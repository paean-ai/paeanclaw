# Add Telegram Channel to PaeanClaw

This skill transforms a PaeanClaw installation to accept messages from Telegram using the grammy library.

## What This Skill Does

1. Adds a Telegram bot channel adapter
2. Routes incoming Telegram messages to the PaeanClaw agent
3. Sends agent responses back to the Telegram chat with markdown formatting
4. Supports both private and group chats

## Prerequisites

- A Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Set the token as `TELEGRAM_BOT_TOKEN` environment variable

## Implementation Steps

### 1. Install Dependencies

```bash
npm install grammy
```

### 2. Create `src/channels/telegram.ts`

Create a new file that:

- Initializes a grammy Bot instance
- Listens for text messages
- In group chats, only responds to messages mentioning the bot or replying to the bot
- Calls the PaeanClaw agent API at `http://localhost:3007/api/chat`
- Streams the SSE response and sends the final text back via Telegram
- Uses Telegram's MarkdownV2 parse mode for formatted responses

Key patterns:

```typescript
import { Bot } from 'grammy';

const API_URL = process.env.PAEANCLAW_URL || 'http://localhost:3007';

export async function startTelegram(config: { token: string }) {
  const bot = new Bot(config.token);

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const isPrivate = ctx.chat.type === 'private';
    const isMentioned = text.includes(`@${bot.botInfo.username}`);
    const isReply = ctx.message.reply_to_message?.from?.id === bot.botInfo.id;

    if (!isPrivate && !isMentioned && !isReply) return;

    const userMessage = text.replace(`@${bot.botInfo.username}`, '').trim();

    // Call PaeanClaw API and stream response
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        conversationId: `telegram-${ctx.chat.id}`,
      }),
    });
    // Parse SSE stream, collect content, send final message
    // ... (read SSE events, accumulate content text)
    await ctx.reply(finalResponse, { parse_mode: 'Markdown' });
  });

  await bot.start();
}
```

### 3. Update `src/index.ts`

Add an optional import and startup call:

```typescript
if (config.channels?.telegram?.enabled) {
  const { startTelegram } = await import('./channels/telegram.js');
  startTelegram(config.channels.telegram);
}
```

### 4. Update `paeanclaw.config.json`

Add a channels section:

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "token": "${TELEGRAM_BOT_TOKEN}"
    }
  }
}
```

## Notes

- Create a bot via [@BotFather](https://t.me/BotFather) and get the token
- For group chats, add the bot to the group and disable privacy mode in BotFather settings
- grammy handles long polling automatically; no webhook server needed
- Per-chat conversation IDs keep context separate between chats
