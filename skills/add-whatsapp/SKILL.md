# Add WhatsApp Channel to PaeanClaw

This skill transforms a PaeanClaw installation to accept messages from WhatsApp using the Baileys library (unofficial WhatsApp Web API).

## What This Skill Does

1. Adds a WhatsApp channel adapter that connects to WhatsApp Web
2. Routes incoming WhatsApp messages to the PaeanClaw agent
3. Sends agent responses back to the WhatsApp chat
4. Stores WhatsApp auth state for persistent sessions

## Prerequisites

- A WhatsApp account
- A phone to scan the QR code

## Implementation Steps

### 1. Install Dependencies

```bash
npm install @whiskeysockets/baileys qrcode-terminal
```

### 2. Create `src/channels/whatsapp.ts`

Create a new file that:

- Initializes a Baileys WhatsApp connection
- Displays a QR code in the terminal for auth
- Listens for incoming messages
- Filters messages by a configurable trigger word (e.g., `@Agent`)
- On trigger: calls the PaeanClaw agent API at `http://localhost:3007/api/chat`
- Streams the SSE response and sends the final text back via WhatsApp
- Stores auth credentials in `data/whatsapp-auth/`

Key patterns to follow (from NanoClaw):

```typescript
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';

const TRIGGER = process.env.PAEANCLAW_TRIGGER || '@Agent';
const API_URL = process.env.PAEANCLAW_URL || 'http://localhost:3007';

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('data/whatsapp-auth');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      if (!text.startsWith(TRIGGER)) continue;
      const userMessage = text.slice(TRIGGER.length).trim();
      const jid = msg.key.remoteJid!;

      // Call PaeanClaw API and collect response
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      // Parse SSE stream, collect content, send final message
      // ... (read SSE events, accumulate content text)
      await sock.sendMessage(jid, { text: finalResponse });
    }
  });
}
```

### 3. Update `src/index.ts`

Add an optional import and startup call:

```typescript
if (config.channels?.whatsapp?.enabled) {
  const { startWhatsApp } = await import('./channels/whatsapp.js');
  startWhatsApp(config.channels.whatsapp);
}
```

### 4. Update `paeanclaw.config.json`

Add a channels section:

```json
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "trigger": "@Agent"
    }
  }
}
```

## Notes

- WhatsApp Web API is unofficial; use responsibly
- Each WhatsApp account can only have one Web session active
- Messages are processed sequentially per chat to avoid race conditions
- The trigger word prevents the agent from responding to every message
