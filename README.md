# PaeanClaw

**Your local AI agent, accessible anywhere. 365 lines of core code.**

[![npm version](https://img.shields.io/npm/v/paeanclaw.svg)](https://www.npmjs.com/package/paeanclaw) [![license](https://img.shields.io/npm/l/paeanclaw.svg)](LICENSE)

Ultra-minimal local agent runtime. Any LLM provider, MCP tools, web PWA + Telegram. Runs on Node.js or Bun. Part of the [Paean](https://paean.ai) ecosystem.

## How It Compares

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| **Core source** | **365 lines** (5 TypeScript files, excl. HTML frontend) | ~8,000 lines | ~420,000 lines | ~12,800 lines |
| **Source files** | **5** | 28 | ~4,900 | 66 |
| **Runtime deps** | **2** | 9 | ~50 | 16 |
| **LLM providers** | **Any** | Claude only | Multi (Pi) | Cloud only |
| **Runtime** | Node.js / **Bun** | Node.js + Docker | Node.js 22 | Node.js |
| **Channels** | PWA + Telegram | WhatsApp | 16+ platforms | Terminal |
| **Data** | **Local SQLite** | Local SQLite | Local SQLite | Cloud PostgreSQL |

PaeanClaw is **1,150x smaller** than OpenClaw. Its entire core runtime fits in a single LLM context window, making it the ideal foundation for AI-assisted customization. See the [full comparison](docs/COMPARISON.md) and [why minimal code matters](docs/WHY-MINIMAL.md).

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

## What Can You Build?

PaeanClaw is a blank canvas — each use case is built by composing MCP servers and writing a few lines of `AGENT.md`. Here are some highlights:

| Scenario | What It Does | Channels |
|----------|-------------|----------|
| **Morning Briefing** | Wake up to a Telegram summary: calendar, PRs, headlines, weather — assembled while you slept | Telegram |
| **Voice Journal → Structured Notes** | Record a voice memo on your commute; agent transcribes, extracts TODOs, files notes automatically | Telegram, PWA |
| **Cross-Device Dev Bridge** | Run tests, check logs, and deploy from your iPad — your home machine works via Paean CLI gateway | PWA + CLI Gateway |
| **Habit Streak Coach** | Daily check-ins, streak tracking, and weekly scorecards — an accountability partner in your messaging app | Telegram |
| **Meeting Prep & Follow-up** | Get a 30-second prep brief before meetings; dictate notes after and get action items extracted | Telegram, PWA |
| **Family Coordination Hub** | A WhatsApp family bot that manages shared todos, calendars, and notes — responds only when mentioned | WhatsApp |
| **Smart Home Commander** | Control Home Assistant with natural language: "heading home in 30 min" triggers heat, lights, and music | Telegram, PWA |
| **Travel Itinerary Copilot** | Plan trips with auto-researched local tips, then ask questions during travel from any channel | Telegram, PWA |
| **Pay-per-Answer Research Agent** | Charge $0.25 USDC per deep research query — payment confirmed on-chain before the work begins | Telegram, PWA |
| **Agent Service Marketplace** | Run specialized paid agents (legal review, brand naming, code audit) — humans and other agents pay in USDC | Telegram, PWA |
| **Milestone Payment Tracker** | Break freelance projects into USDC-gated milestones — cryptographic proof of receipt, no invoice-chasing | Telegram, PWA |
| **Dollar-Cost Averaging Agent** | Auto-buy ETH or SOL at a fixed amount every week via on-chain DEX swaps — DCA on autopilot, no exchange accounts | Telegram |
| **Portfolio Rebalancing Bot** | Monitor allocation drift across Base and Solana; swap back to target percentages with one approval message | Telegram, PWA |
| **Token Research & Trade Agent** | Describe a token in plain language; agent checks liquidity, quotes the swap, and executes on your approval | Telegram, PWA |
| **Smart Token Discovery** | Daily scan of top gainers with auto security audit — filters out honeypots and scams, delivers vetted opportunities | Telegram |
| **On-Chain Due Diligence** | Paste a token address, get a 30-second multi-source risk report: security audit, liquidity, whale activity, and verdict | Telegram, PWA |
| **Cross-Chain Swap Router** | "Swap 1 SOL to USDC on Base" — agent handles routing, safety checks, and calldata across 9+ chains | Telegram, PWA |
| **Whale Activity Monitor** | Hourly anomaly detection on your token positions — alerts on unusual volume, whale accumulation, or dump signals | Telegram |

Every scenario follows the same pattern: identify your channels, add MCP servers for your data, customize `AGENT.md`, and let your AI coding assistant wire it together.

**→ See all 32 use cases with step-by-step build instructions in [docs/USE-CASES.md](docs/USE-CASES.md) and [docs/USE-CASES-BITGET-WALLET.md](docs/USE-CASES-BITGET-WALLET.md)**

---

## Install

```bash
bun install -g paeanclaw    # recommended
# or: npm install -g paeanclaw
```

[![npm](https://img.shields.io/npm/v/paeanclaw)](https://www.npmjs.com/package/paeanclaw)

## What Is This

PaeanClaw runs an AI agent on your local machine and exposes it through a web interface and optional Telegram bot. The agent can use tools (file access, shell commands, web search, etc.) via MCP servers.

```
Phone/Browser/Telegram → PaeanClaw (your machine) → LLM API + MCP Tools
```

Think of it as a personal AI assistant that runs where your data lives.

## Quick Start

### Option 1: bunx / npx (no install needed)

Run directly — PaeanClaw auto-creates config files on first run:

```bash
mkdir my-agent && cd my-agent
bunx paeanclaw        # recommended
# or: npx paeanclaw
```

Edit the generated `paeanclaw.config.json` with your API key, then run again:

```bash
bunx paeanclaw
```

### Option 2: Global install

```bash
bun install -g paeanclaw    # recommended (no native compile)
# or: npm install -g paeanclaw
mkdir my-agent && cd my-agent
paeanclaw
```

### Option 3: Clone and customize

```bash
git clone https://github.com/paean-ai/paeanclaw.git
cd paeanclaw
bun install                  # or: npm install
cp paeanclaw.config.example.json paeanclaw.config.json
# Edit paeanclaw.config.json with your API key
bun run build && bun run start:bun    # or: npm run build && npm start
```

Open [http://localhost:3007](http://localhost:3007) in your browser.

The default config uses the [Paean AI](https://paean.ai) API with GLM-4.5. To use a different provider, edit `paeanclaw.config.json`.

## Runtime: Bun (recommended) or Node.js

| | Bun (recommended) | Node.js |
|---|---|---|
| SQLite | `bun:sqlite` (built-in, zero deps) | `better-sqlite3` (native addon) |
| Startup | **~20ms** | ~40ms |
| Install | `bun install` (no native compile) | `npm install` |
| Run | `bunx paeanclaw` | `npx paeanclaw` |
| Native deps | **0** | 1 |

Bun eliminates all native dependencies, compiles nothing during install, and starts ~2x faster.

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

> **Get a free API key:** Sign up at [app.paean.ai](https://app.paean.ai), then go to [Workspace Settings → Developer](https://app.paean.ai/workspace/settings) to generate your API key (`os_ak_...`). Every account includes a free monthly credit allowance — no payment required to get started.

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

Beyond the built-in Telegram support, more channels and capabilities can be added via skills:

- **WhatsApp** -- See `skills/add-whatsapp/SKILL.md`
- **USDC payments** (Base & Solana) -- See `skills/add-payment/SKILL.md`
- **DEX trading** (Uniswap v3 on Base, Jupiter on Solana) -- Add [`paean-dex-mcp`](https://github.com/paean-ai/paean-dex-mcp) to your MCP config
- **On-chain intelligence** (9+ chains: prices, security audits, swap quotes, K-line data) -- Add [`bitget-wallet-mcp`](https://github.com/bitget-wallet-ai-lab/bitget-wallet-mcp) to your MCP config

Skills are markdown instructions that an AI coding agent (Claude Code, Cursor, etc.) follows to transform your installation. See [Contributing](docs/CONTRIBUTING.md).

## Contributing

**Don't add features. Add skills.**

PaeanClaw's core must stay minimal. Instead of adding code to support new channels, tools, or behaviors, contribute skill files that teach AI coding agents how to transform a user's installation on demand.

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

## Documentation

- [DESIGN.md](DESIGN.md) -- Design philosophy and architecture
- [docs/USE-CASES.md](docs/USE-CASES.md) -- 24 core use cases: morning briefings, voice journaling, habit coaching, travel planning, smart home, agent payments, DEX trading, and more
- [docs/USE-CASES-BITGET-WALLET.md](docs/USE-CASES-BITGET-WALLET.md) -- 8 on-chain intelligence use cases: token watchlists, smart discovery, due diligence, cross-chain swaps, arbitrage, portfolio dashboards, whale monitoring, and community price bots
- [docs/COMPARISON.md](docs/COMPARISON.md) -- Deep comparison with OpenClaw, NanoClaw, OpenPaean
- [docs/WHY-MINIMAL.md](docs/WHY-MINIMAL.md) -- Why minimal code matters in the agentic era
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) -- How to contribute (skills over features)

## Requirements

- [Bun](https://bun.sh) 1.0+ (recommended) or Node.js 20+
- An LLM API key (or a local model via Ollama) — [get a free Paean AI key](https://app.paean.ai/workspace/settings)

## License

MIT
