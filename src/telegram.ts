import { Bot } from 'grammy';
import { runAgent, type LlmConfig } from './agent.js';

const conversations = new Map<number, string[]>();

export async function startTelegram(token: string, llmConfig: LlmConfig, systemPrompt: string): Promise<void> {
  const bot = new Bot(token);

  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    const isPrivate = ctx.chat.type === 'private';
    const botUsername = ctx.me.username;
    const mentioned = text.includes(`@${botUsername}`);
    const isReply = ctx.message.reply_to_message?.from?.id === ctx.me.id;

    if (!isPrivate && !mentioned && !isReply) return;

    const userMsg = text.replace(`@${botUsername}`, '').trim();
    if (!userMsg) return;

    const history = conversations.get(chatId) ?? [];
    history.push(userMsg);
    if (history.length > 40) history.splice(0, history.length - 40);
    conversations.set(chatId, history);

    const messages = history.map((m, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: m,
    }));

    let response = '';
    try {
      for await (const event of runAgent(llmConfig, systemPrompt, messages)) {
        if (event.type === 'content') response += event.text;
        if (event.type === 'done' && !response) response = event.content;
      }
    } catch (e) {
      response = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    if (response) {
      history.push(response);
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
