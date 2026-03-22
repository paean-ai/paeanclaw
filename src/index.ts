#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runAgent, type LlmConfig } from './agent.js';
import { connectAll, shutdown, type McpServerConfig } from './mcp.js';
import { initStore, createConversation, ensureConversation, listConversations, addMessage, getMessages, updateTitle } from './store.js';

interface Config {
  llm: LlmConfig;
  mcpServers?: Record<string, McpServerConfig>;
  server?: { port?: number };
  telegram?: { token: string; allowedUsers?: string[] };
  wechat?: { allowedUsers?: string[] };
}

function resolveConfigPath(): string {
  return path.join(process.cwd(), 'paeanclaw.config.json');
}

function scaffoldProject(): void {
  const cwd = process.cwd();
  const pkgDir = path.resolve(__dirname, '..');
  const configDest = path.join(cwd, 'paeanclaw.config.json');
  const agentDest = path.join(cwd, 'AGENT.md');
  const exampleSrc = path.join(pkgDir, 'paeanclaw.config.example.json');
  const agentSrc = path.join(pkgDir, 'AGENT.md');

  if (!fs.existsSync(configDest) && fs.existsSync(exampleSrc)) {
    fs.copyFileSync(exampleSrc, configDest);
    console.log('Created paeanclaw.config.json — edit it with your API key.');
  }
  if (!fs.existsSync(agentDest) && fs.existsSync(agentSrc)) {
    fs.copyFileSync(agentSrc, agentDest);
    console.log('Created AGENT.md — customize your agent\'s system prompt.');
  }
}

function loadConfig(): Config {
  const configPath = resolveConfigPath();
  if (!fs.existsSync(configPath)) {
    scaffoldProject();
    if (!fs.existsSync(configPath)) {
      console.error('No paeanclaw.config.json found. Create one with your LLM settings.');
      process.exit(1);
    }
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  const interpolated = raw.replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? '');
  return JSON.parse(interpolated);
}

function loadSystemPrompt(): string {
  const agentMd = path.join(process.cwd(), 'AGENT.md');
  return fs.existsSync(agentMd) ? fs.readFileSync(agentMd, 'utf-8') : 'You are a helpful AI assistant.';
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');
const MIME: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const url = req.url === '/' ? '/index.html' : req.url!;
  const filePath = path.join(publicDir, url);
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath)) return false;
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c: Buffer) => { data += c.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function cors(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: http.ServerResponse, data: unknown, status = 200): void {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleWechatCLI(): Promise<boolean> {
  const args = process.argv.slice(2);
  if (args.length === 0) return false;
  const sub = args[0];

  if (sub === 'wechat-setup' || (sub === 'wechat' && args[1] === 'setup')) {
    const { fetchQRCode, pollQRStatus, DEFAULT_BASE_URL } = await import('./wechat-api.js');
    const { saveCredentials, loadCredentials } = await import('./wechat-credentials.js');

    const existing = loadCredentials();
    if (existing) {
      console.log(`Existing WeChat account: ${existing.accountId} (saved: ${existing.savedAt})`);
    }

    console.log('Fetching WeChat login QR code...\n');
    const qrResp = await fetchQRCode(DEFAULT_BASE_URL);
    try {
      const qrterm = await import('qrcode-terminal');
      await new Promise<void>(resolve => {
        qrterm.default.generate(qrResp.qrcode_img_content, { small: true }, (qr: string) => { console.log(qr); resolve(); });
      });
    } catch { console.log(`QR URL: ${qrResp.qrcode_img_content}\n`); }

    console.log('Scan the QR code with WeChat...\n');
    const deadline = Date.now() + 480_000;
    let scanned = false;
    while (Date.now() < deadline) {
      const status = await pollQRStatus(DEFAULT_BASE_URL, qrResp.qrcode);
      switch (status.status) {
        case 'wait': process.stdout.write('.'); break;
        case 'scaned': if (!scanned) { console.log('\nScanned! Confirm on phone...'); scanned = true; } break;
        case 'expired': console.error('\nQR code expired.'); process.exit(1); break;
        case 'confirmed': {
          if (!status.ilink_bot_id || !status.bot_token) { console.error('\nLogin failed.'); process.exit(1); }
          saveCredentials({
            token: status.bot_token, baseUrl: status.baseurl || DEFAULT_BASE_URL,
            accountId: status.ilink_bot_id, userId: status.ilink_user_id,
            savedAt: new Date().toISOString(),
          });
          console.log('\n✓ WeChat connected!\n');
          console.log('Next steps:');
          console.log('  1. Ensure "wechat": {} is in paeanclaw.config.json');
          console.log('  2. Start the server: npx paeanclaw');
          console.log('     The WeChat channel will activate automatically.\n');
          return true;
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    console.error('\nLogin timed out.');
    process.exit(1);
  }

  if (sub === 'wechat-status' || (sub === 'wechat' && args[1] === 'status')) {
    const { loadCredentials } = await import('./wechat-credentials.js');
    const account = loadCredentials();
    if (account) {
      console.log('✓ WeChat: Logged in');
      console.log(`  Account: ${account.accountId}`);
      console.log(`  User:    ${account.userId ?? 'N/A'}`);
      console.log(`  Saved:   ${account.savedAt}`);
    } else {
      console.log('✗ WeChat: Not logged in');
      console.log('  Run: npx paeanclaw wechat-setup');
    }
    return true;
  }

  if (sub === 'wechat-logout' || (sub === 'wechat' && args[1] === 'logout')) {
    const { removeCredentials, loadCredentials } = await import('./wechat-credentials.js');
    if (!loadCredentials()) { console.log('No WeChat credentials found.'); return true; }
    removeCredentials();
    console.log('✓ WeChat credentials removed.');
    return true;
  }

  if (sub === 'help' || sub === '--help' || sub === '-h') {
    console.log(`paeanclaw — AI agent server with Telegram & WeChat channels

Usage:
  npx paeanclaw                  Start the server (reads paeanclaw.config.json)
  npx paeanclaw wechat-setup     Authenticate with WeChat via QR code
  npx paeanclaw wechat-status    Show WeChat login status
  npx paeanclaw wechat-logout    Remove WeChat credentials

WeChat setup:
  1. Run "npx paeanclaw wechat-setup" and scan the QR code
  2. Add "wechat": {} to paeanclaw.config.json
  3. Start the server: npx paeanclaw
     The WeChat channel activates automatically.

Config: paeanclaw.config.json (see paeanclaw.config.example.json)
`);
    return true;
  }

  return false;
}

async function main(): Promise<void> {
  if (await handleWechatCLI()) return;

  const config = loadConfig();
  const systemPrompt = loadSystemPrompt();
  await initStore();
  if (config.mcpServers) await connectAll(config.mcpServers);
  process.on('SIGINT', async () => { await shutdown(); process.exit(0); });

  const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/conversations') {
      return json(res, listConversations());
    }

    if (req.method === 'GET' && url.pathname === '/api/messages') {
      const id = url.searchParams.get('conversationId');
      if (!id) return json(res, { error: 'conversationId required' }, 400);
      return json(res, getMessages(id));
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const body = JSON.parse(await readBody(req));
      const { message, conversationId } = body;
      let convId: string;
      if (conversationId) {
        ensureConversation(conversationId, message.slice(0, 60));
        convId = conversationId;
      } else {
        convId = createConversation(message.slice(0, 60)).id;
      }
      addMessage(convId, 'user', message);

      const history = getMessages(convId).map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: JSON.parse(m.tool_calls) } : {}),
        ...(m.role === 'tool' ? { tool_call_id: m.content } : {}),
      }));

      res.writeHead(200, {
        'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: convId })}\n\n`);

      let fullContent = '';
      try {
        for await (const event of runAgent(config.llm, systemPrompt, history)) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
          if (event.type === 'content') fullContent += event.text;
          if (event.type === 'done') {
            addMessage(convId, 'assistant', event.content);
            if (!conversationId && event.content.length > 0) {
              updateTitle(convId, event.content.slice(0, 80));
            }
          }
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        res.write(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`);
      }
      res.end();
      return;
    }

    if (!serveStatic(req, res)) {
      json(res, { error: 'Not found' }, 404);
    }
  });

  if (config.telegram?.token) {
    const { startTelegram } = await import('./telegram.js');
    startTelegram(config.telegram.token, config.llm, systemPrompt, config.telegram.allowedUsers);
  }

  if (config.wechat) {
    const { startWechat } = await import('./wechat.js');
    startWechat(config.wechat, config.llm, systemPrompt);
  }

  const port = config.server?.port ?? 3007;
  server.listen(port, () => {
    console.log(`🐾 PaeanClaw running at http://localhost:${port}`);
    if (config.telegram?.token) console.log('   Telegram channel: active');
    if (config.wechat) console.log('   WeChat channel: active');
  });
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
