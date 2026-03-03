import { Bot } from 'grammy';
import { runAgent, type LlmConfig } from './agent.js';
import { ensureConversation, addMessage, getMessages } from './store.js';

function isUserAllowed(ctx: { from?: { id: number; username?: string } }, allowedUsers?: string[]): boolean {
  if (!allowedUsers || allowedUsers.length === 0) return true;
  if (!ctx.from) return false;
  const userId = String(ctx.from.id);
  const username = (ctx.from.username ?? '').toLowerCase();
  return allowedUsers.some(u => u === userId || (username && u.toLowerCase() === username));
}

export async function startTelegram(token: string, llmConfig: LlmConfig, systemPrompt: string, allowedUsers?: string[]): Promise<void> {
  const bot = new Bot(token);

  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    const isPrivate = ctx.chat.type === 'private';
    const botUsername = ctx.me.username;
    const mentioned = text.includes(`@${botUsername}`);
    const isReply = ctx.message.reply_to_message?.from?.id === ctx.me.id;

    if (!isPrivate && !mentioned && !isReply) return;
    if (!isUserAllowed(ctx, allowedUsers)) return;

    const userMsg = text.replace(`@${botUsername}`, '').trim();
    if (!userMsg) return;

    const convId = `telegram-${chatId}`;
    const title = ctx.chat.type === 'private'
      ? `Telegram: ${ctx.from?.first_name || chatId}`
      : `Telegram: ${(ctx.chat as { title?: string }).title || chatId}`;
    ensureConversation(convId, title);
    addMessage(convId, 'user', userMsg);

    const history = getMessages(convId).map(m => ({
      role: m.role,
      content: m.content,
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
      const maxLen = 4096;
      for (let i = 0; i < response.length; i += maxLen) {
        await ctx.reply(response.slice(i, i + maxLen), {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    }
  });

  bot.catch((err) => console.error('[telegram] Error:', err.message));

  console.log('🤖 Telegram bot starting...');
  bot.start({
    onStart: (info) => console.log(`🤖 Telegram bot @${info.username} is running`),
  });
}
