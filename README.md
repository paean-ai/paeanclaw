# PaeanClaw

**Your local AI agent, accessible anywhere. 477 lines of code.**

Ultra-minimal local agent runtime. Any LLM provider, MCP tools, web PWA + Telegram. Runs on Node.js or Bun. Part of the [Paean](https://paean.ai) ecosystem.

## How It Compares

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| **Core source** | **477 lines** | ~8,000 lines | ~420,000 lines | ~12,800 lines |
| **Source files** | **5** | 28 | ~4,900 | 66 |
| **Runtime deps** | **2** | 9 | ~50 | 16 |
| **LLM providers** | **Any** | Claude only | Multi (Pi) | Cloud only |
| **Runtime** | Node.js / **Bun** | Node.js + Docker | Node.js 22 | Node.js |
| **Channels** | PWA + Telegram | WhatsApp | 16+ platforms | Terminal |
| **Data** | **Local SQLite** | Local SQLite | Local SQLite | Cloud PostgreSQL |

PaeanClaw is **880x smaller** than OpenClaw. Its entire source fits in a single LLM context window, making it the ideal foundation for AI-assisted customization. See the [full comparison](docs/COMPARISON.md) and [why minimal code matters](docs/WHY-MINIMAL.md).

## When to Use What

**Choose PaeanClaw when you want:**
- An agent you can fully read and understand in 15 minutes
- Provider freedom (OpenAI, Claude, Gemini, Ollama, DeepSeek, or any OpenAI-compatible API)
- A lightweight starting point to fork and customize with AI assistance
- Local-first data ownership with zero cloud lock-in
- Fast setup (2 minutes) with minimal dependencies

**Choose [NanoClaw](https://github.com/qwibitai/nanoclaw) when you want:**
- Container-isolated agents (Docker / Apple Container)
- WhatsApp as the primary interface
- Claude Agent SDK's built-in tool ecosystem
- Security through OS-level sandboxing

**Choose [OpenClaw](https://github.com/openclaw/openclaw) when you want:**
- 16+ messaging platform support out of the box
- Native macOS, iOS, and Android apps
- 60+ built-in tools with a plugin ecosystem
- Voice wake and talk mode
- Hybrid memory (BM25 + vector search)

**Choose [OpenPaean](https://github.com/paean-ai/openpaean) when you want:**
- Cloud-powered agent with rich backend services
- Cross-device gateway relay (mobile/web to local MCP tools)
- Task worker with multi-executor routing
- Full Paean ecosystem integration

---

## What Is This

PaeanClaw runs an AI agent on your local machine and exposes it through a web interface and optional Telegram bot. The agent can use tools (file access, shell commands, web search, etc.) via MCP servers.

```
Phone/Browser/Telegram → PaeanClaw (your machine) → LLM API + MCP Tools
```

Think of it as a personal AI assistant that runs where your data lives.

## Quick Start

```bash
git clone https://github.com/paean-ai/paeanclaw.git
cd paeanclaw
npm install    # or: bun install
cp paeanclaw.config.example.json paeanclaw.config.json
# Edit paeanclaw.config.json with your API key
npm run build
npm start      # or: bun run start:bun
```

Open [http://localhost:3007](http://localhost:3007) in your browser.

The default config uses the [Paean AI](https://paean.ai) API with GLM-4.5. To use a different provider, edit `paeanclaw.config.json`.

## Runtime: Node.js or Bun

PaeanClaw works on both Node.js and Bun:

| | Node.js | Bun |
|---|---|---|
| SQLite | `better-sqlite3` (native addon) | `bun:sqlite` (built-in, zero deps) |
| Startup | ~40ms | ~20ms |
| Install | `npm install` | `bun install` (no native compile) |
| Run | `npm start` | `bun run start:bun` |

Bun is recommended for faster startup and zero native dependencies.

## Configuration

Copy the example config and fill in your API key:

```bash
cp paeanclaw.config.example.json paeanclaw.config.json
```

```json
{
  "llm": {
    "baseUrl": "https://api.paean.ai/v1",
    "apiKey": "${PAEAN_API_KEY}",
    "model": "GLM-4.5"
  },
  "mcpServers": {},
  "telegram": {
    "token": "${TELEGRAM_BOT_TOKEN}"
  },
  "server": {
    "port": 3007
  }
}
```

Environment variables are interpolated via `${VAR_NAME}` syntax. You can also write values directly in the config file.

## Provider Examples

PaeanClaw works with any OpenAI-compatible API.

**Paean AI (default):**
```json
{
  "llm": {
    "baseUrl": "https://api.paean.ai/v1",
    "apiKey": "os_ak_...",
    "model": "GLM-4.5"
  }
}
```

Available models: `GLM-4.7`, `GLM-4.6`, `GLM-4.5`, `GLM-4.5-Air`, `claude-sonnet-4-6`, `claude-opus-4-6`, `gemini-3-flash-preview`, `gemini-3-pro-preview`.

**OpenAI:**
```json
{ "llm": { "baseUrl": "https://api.openai.com/v1", "apiKey": "${OPENAI_API_KEY}", "model": "gpt-4o" } }
```

**Anthropic (Claude):**
```json
{ "llm": { "baseUrl": "https://api.anthropic.com/v1", "apiKey": "${ANTHROPIC_API_KEY}", "model": "claude-sonnet-4-20250514" } }
```

**Ollama (local, no API key needed):**
```json
{ "llm": { "baseUrl": "http://localhost:11434/v1", "apiKey": "ollama", "model": "llama3.2" } }
```

**Google Gemini:**
```json
{ "llm": { "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai", "apiKey": "${GOOGLE_API_KEY}", "model": "gemini-2.5-flash" } }
```

## Telegram Bot

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Add the token to `paeanclaw.config.json` under `"telegram": { "token": "..." }`
3. Restart PaeanClaw

In private chats, the bot responds to all messages. In group chats, it responds when mentioned or replied to.

## Adding Tools via MCP

Configure MCP servers in `paeanclaw.config.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

Any [MCP server](https://github.com/modelcontextprotocol/servers) works. The agent automatically discovers and uses available tools.

## Customizing the Agent

Edit `AGENT.md` to change the agent's system prompt, personality, instructions, and behavior.

## Architecture

```
src/index.ts     (~140 lines)  HTTP server, SSE streaming, API routes
src/agent.ts     (~130 lines)  LLM streaming tool-calling loop
src/store.ts      (~90 lines)  SQLite persistence (Node.js + Bun dual-runtime)
src/mcp.ts        (~60 lines)  MCP client, tool discovery and execution
src/telegram.ts   (~60 lines)  Telegram bot channel adapter
```

Runtime dependencies: `@modelcontextprotocol/sdk`, `grammy`. On Bun, SQLite uses the built-in `bun:sqlite`.

See [DESIGN.md](DESIGN.md) for the full design philosophy and [docs/COMPARISON.md](docs/COMPARISON.md) for a deep comparison with other projects.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send message, returns SSE stream |
| `GET` | `/api/conversations` | List all conversations |
| `GET` | `/api/messages?conversationId=...` | Get messages for a conversation |

### SSE Events

```
data: {"type":"start","conversationId":"..."}
data: {"type":"content","text":"Hello"}
data: {"type":"tool_call","name":"filesystem__read_file","args":"..."}
data: {"type":"tool_result","name":"filesystem__read_file","result":"..."}
data: {"type":"done","content":"Hello world"}
```

## PWA

The web interface is a PWA -- installable on mobile and desktop. Open the URL in your browser and use "Add to Home Screen" for an app-like experience.

## Adding More Channels

Beyond the built-in Telegram support, more channels can be added via skills:

- **WhatsApp** -- See `skills/add-whatsapp/SKILL.md`

Skills are instructions for an AI coding assistant to transform your installation.

## Documentation

- [DESIGN.md](DESIGN.md) -- Design philosophy and architecture
- [docs/COMPARISON.md](docs/COMPARISON.md) -- Deep comparison with OpenClaw, NanoClaw, OpenPaean
- [docs/WHY-MINIMAL.md](docs/WHY-MINIMAL.md) -- Why minimal code matters in the agentic era

## Requirements

- Node.js 20+ or Bun 1.0+
- An LLM API key (or a local model via Ollama)

## License

MIT
