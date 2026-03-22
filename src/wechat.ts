import { runAgent, type LlmConfig } from './agent.js';
import { ensureConversation, addMessage, getMessages } from './store.js';
import {
  fetchQRCode, pollQRStatus, getUpdates, sendTextMessage, extractTextFromMessage,
  DEFAULT_BASE_URL, MSG_TYPE_USER,
  type AccountData,
} from './wechat-api.js';
import { loadCredentials, saveCredentials, loadSyncBuf, saveSyncBuf } from './wechat-credentials.js';

const MAX_CONSECUTIVE_FAILURES = 3;
const BACKOFF_DELAY_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

const contextTokenCache = new Map<string, string>();

async function doQRLogin(baseUrl: string): Promise<AccountData | null> {
  console.log('[wechat] Fetching login QR code...');
  const qrResp = await fetchQRCode(baseUrl);
  try {
    const qrterm = await import('qrcode-terminal');
    await new Promise<void>(resolve => {
      qrterm.default.generate(qrResp.qrcode_img_content, { small: true }, (qr: string) => {
        process.stderr.write(qr + '\n');
        resolve();
      });
    });
  } catch {
    console.log(`[wechat] QR URL: ${qrResp.qrcode_img_content}`);
  }

  console.log('[wechat] Scan the QR code with WeChat...');
  const deadline = Date.now() + 480_000;
  let scannedLogged = false;
  while (Date.now() < deadline) {
    const status = await pollQRStatus(baseUrl, qrResp.qrcode);
    switch (status.status) {
      case 'wait': break;
      case 'scaned':
        if (!scannedLogged) { console.log('[wechat] Scanned! Confirm on phone...'); scannedLogged = true; }
        break;
      case 'expired': console.log('[wechat] QR code expired.'); return null;
      case 'confirmed': {
        if (!status.ilink_bot_id || !status.bot_token) { console.error('[wechat] Login failed: incomplete info'); return null; }
        const account: AccountData = {
          token: status.bot_token, baseUrl: status.baseurl || baseUrl,
          accountId: status.ilink_bot_id, userId: status.ilink_user_id,
          savedAt: new Date().toISOString(),
        };
        saveCredentials(account);
        console.log('[wechat] Connected!');
        return account;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('[wechat] Login timed out.');
  return null;
}

function isUserAllowed(senderId: string, allowedUsers?: string[]): boolean {
  if (!allowedUsers || allowedUsers.length === 0) return true;
  const name = senderId.split('@')[0] || senderId;
  return allowedUsers.some(u => u === senderId || u === name);
}

export async function startWechat(
  wechatConfig: { allowedUsers?: string[] },
  llmConfig: LlmConfig,
  systemPrompt: string,
): Promise<void> {
  let account = loadCredentials();
  if (!account) {
    console.log('[wechat] No saved credentials, starting QR login...');
    account = await doQRLogin(DEFAULT_BASE_URL);
    if (!account) { console.error('[wechat] Login failed, WeChat channel disabled.'); return; }
  } else {
    console.log(`[wechat] Using saved account: ${account.accountId}`);
  }

  let getUpdatesBuf = loadSyncBuf();
  let consecutiveFailures = 0;
  console.log('[wechat] Listening for messages...');

  while (true) {
    try {
      const resp = await getUpdates(account.baseUrl, account.token, getUpdatesBuf);
      const isError = (resp.ret !== undefined && resp.ret !== 0) || (resp.errcode !== undefined && resp.errcode !== 0);
      if (isError) {
        consecutiveFailures++;
        console.error(`[wechat] getUpdates error: ret=${resp.ret} errcode=${resp.errcode}`);
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          consecutiveFailures = 0;
          await new Promise(r => setTimeout(r, BACKOFF_DELAY_MS));
        } else {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
        continue;
      }
      consecutiveFailures = 0;
      if (resp.get_updates_buf) { getUpdatesBuf = resp.get_updates_buf; saveSyncBuf(getUpdatesBuf); }

      for (const msg of resp.msgs ?? []) {
        if (msg.message_type !== MSG_TYPE_USER) continue;
        const text = extractTextFromMessage(msg);
        if (!text) continue;
        const senderId = msg.from_user_id ?? 'unknown';
        if (!isUserAllowed(senderId, wechatConfig.allowedUsers)) continue;
        if (msg.context_token) contextTokenCache.set(senderId, msg.context_token);

        const convId = `wechat-${senderId}`;
        const title = `WeChat: ${senderId.split('@')[0] || senderId}`;
        ensureConversation(convId, title);
        addMessage(convId, 'user', text);

        const history = getMessages(convId).map(m => ({
          role: m.role, content: m.content,
          ...(m.tool_calls ? { tool_calls: JSON.parse(m.tool_calls) } : {}),
        }));

        let response = '';
        try {
          for await (const event of runAgent(llmConfig, systemPrompt, history)) {
            if (event.type === 'content') response += event.text;
            if (event.type === 'done' && !response) response = event.content;
          }
        } catch (e) {
          response = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }

        if (response) {
          addMessage(convId, 'assistant', response);
          const ctxToken = contextTokenCache.get(senderId);
          if (ctxToken) {
            const maxLen = 2048;
            for (let i = 0; i < response.length; i += maxLen) {
              try { await sendTextMessage(account.baseUrl, account.token, senderId, response.slice(i, i + maxLen), ctxToken); }
              catch (e) { console.error(`[wechat] Send failed: ${e instanceof Error ? e.message : e}`); }
            }
          }
        }
      }
    } catch (err) {
      consecutiveFailures++;
      console.error(`[wechat] Poll error: ${err instanceof Error ? err.message : err}`);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        consecutiveFailures = 0;
        await new Promise(r => setTimeout(r, BACKOFF_DELAY_MS));
      } else {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }
}
