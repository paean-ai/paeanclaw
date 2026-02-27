# PaeanClaw Design Philosophy

PaeanClaw is an ultra-minimal local AI agent runtime. It bridges messaging interfaces (web PWA, IM bots) with a local agent that runs on your machine, using any LLM provider and MCP tools.

## Origins

PaeanClaw draws from two projects:

**NanoClaw** — A personal Claude assistant running in containers. Its core insight: a useful AI agent system can be *small enough to understand*. One process, a handful of files, no microservices. Agents gain capabilities through MCP tools rather than built-in features. Extension happens through skills (markdown instructions for an AI coding assistant) rather than code additions.

**Paean** — An edge-cloud AI workspace with rich multi-channel access (web, desktop, mobile, CLI). Its core insight: the best agent experience combines *cloud intelligence with local execution*. The CLI acts as a gateway between remote interfaces and local MCP tools. Streaming responses make interactions feel immediate.

PaeanClaw takes the minimalism of NanoClaw and the edge-cloud thinking of Paean, and distills them into approximately 400 lines of TypeScript across five files — including built-in Telegram bot support and dual-runtime compatibility (Node.js + Bun).

## Design Principles

### 1. Radical Minimalism

The entire runtime is five files:

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | ~140 | HTTP server, API routes, static serving, orchestration |
| `src/agent.ts` | ~130 | LLM streaming, tool-calling loop |
| `src/store.ts` | ~90 | SQLite persistence (Node.js + Bun dual-runtime) |
| `src/mcp.ts` | ~60 | MCP client, tool discovery and execution |
| `src/telegram.ts` | ~60 | Telegram bot channel adapter |

This isn't minimalism for its own sake. Small code means:
- You can read and understand the entire system in minutes
- Any AI coding assistant can safely modify it
- Bugs have nowhere to hide
- The system does exactly what you need, nothing more

### 2. Provider Agnostic

PaeanClaw calls LLM APIs directly using the OpenAI chat completions format — the de facto standard that nearly every provider supports:

- **OpenAI** — native
- **Anthropic** — via their OpenAI-compatible endpoint
- **Google Gemini** — via OpenAI-compatible mode
- **Local models** — Ollama, LM Studio, vLLM, llama.cpp
- **Cloud providers** — Groq, Together, DeepSeek, Fireworks, etc.

No SDK lock-in. A single `fetch()` call handles streaming and tool calling. Switching providers means changing three fields in the config file.

The default provider is [Paean AI](https://paean.ai), which provides access to GLM-4.x, Claude, and Gemini models through a unified OpenAI-compatible API with a single API key.

### 3. MCP-Native Tool System

All agent capabilities come from MCP (Model Context Protocol) servers:

```
Agent ←→ MCP Client ←→ MCP Servers (filesystem, shell, web, custom...)
```

This is a deliberate choice over built-in tools. MCP is an open standard with a growing ecosystem. Any MCP server works with PaeanClaw immediately. Users compose exactly the capabilities they need by configuring servers in `paeanclaw.config.json`.

The agent's tool-calling loop is generic: call LLM → get tool calls → execute via MCP → feed results back → repeat. No tool-specific code exists in the core.

### 4. Dual-Runtime: Node.js + Bun

PaeanClaw runs on both Node.js and Bun. The SQLite store auto-detects the runtime:

- **Bun**: Uses built-in `bun:sqlite` — zero native dependencies, ~2x faster startup
- **Node.js**: Falls back to `better-sqlite3` (optional dependency)

This is implemented with a simple try/catch at startup — no conditional imports or build-time flags.

### 5. Local-First, Your Data

PaeanClaw runs on your machine. Conversations are stored in a local SQLite database. No cloud account required. No telemetry. No data leaves your machine except the LLM API calls you explicitly configure.

This is the fundamental difference from cloud-hosted agent platforms: you own everything.

### 6. Channel as a Layer

The core system exposes a simple HTTP + SSE API:

```
POST /api/chat          → SSE stream of agent events
GET  /api/conversations → conversation list
GET  /api/messages      → conversation history
```

The built-in web PWA is one client. The built-in Telegram bot is another. WhatsApp, Discord, Slack — any messaging platform can be added as another client that calls the same API or integrates directly. Additional channels are added through skills.

### 7. Skills Over Features

Borrowed directly from NanoClaw: don't add features to the codebase. Add skills — markdown files that teach an AI coding assistant how to transform the installation.

Want WhatsApp? Run the `/add-whatsapp` skill. Want scheduled tasks? A skill can add a cron-based task scheduler. Want multi-agent orchestration? A skill can add an MCP server that spawns sub-agents.

The core stays minimal. Every installation has exactly what its user needs.

## Architecture

```
User (Phone/Desktop/Any Device)
         │
    HTTP / SSE
         │
    ┌────▼────┐
    │  Server  │  src/index.ts — routes, SSE streaming, static PWA
    └────┬────┘
         │
    ┌────▼────┐
    │  Agent   │  src/agent.ts — LLM calls, tool-calling loop
    └──┬───┬──┘
       │   │
  ┌────▼┐ ┌▼────┐
  │ MCP │ │Store│  src/mcp.ts, src/store.ts
  └──┬──┘ └─────┘
     │
  MCP Servers (stdio)
  ├── filesystem
  ├── shell
  ├── web-fetch
  └── (any MCP server)
```

### Data Flow

1. User sends a message via the PWA (or any HTTP client)
2. Server stores the message and loads conversation history
3. Agent receives history + available MCP tools
4. Agent calls the LLM with streaming enabled
5. Content chunks stream back to the user via SSE in real-time
6. If the LLM requests tool calls, the agent executes them via MCP
7. Tool results are fed back to the LLM, and the loop continues
8. When the LLM finishes (no more tool calls), the response is stored

### The Tool-Calling Loop

The heart of PaeanClaw is a simple loop in `src/agent.ts`:

```
while (turn < MAX_TURNS):
    stream = call_llm(messages, tools)
    for each chunk in stream:
        if content → yield to user (real-time)
        if tool_call → accumulate
    if no tool_calls → done
    for each tool_call:
        result = mcp.execute(tool_name, arguments)
        messages.append(tool_result)
    loop again with updated messages
```

This single loop handles arbitrarily complex multi-step agent tasks: research, code generation, file manipulation, web browsing — whatever the configured MCP servers can do.

## Comparison

| | NanoClaw | Paean CLI | PaeanClaw |
|---|---|---|---|
| Core size | ~2,000 lines | ~5,000 lines | ~480 lines |
| LLM | Claude only | Gemini (cloud) | Any provider (default: Paean AI) |
| Tools | Claude SDK + MCP | Cloud + local MCP | MCP only |
| Isolation | Docker containers | N/A (cloud) | None (host) |
| Interface | WhatsApp | Terminal | Web PWA + Telegram |
| Storage | SQLite + files | Cloud PostgreSQL | Local SQLite |
| Runtime | Node.js + Docker | Node.js | Node.js or Bun |
| Runtime deps | ~10 | ~20 | 2 (0 native on Bun) |
| Auth | WhatsApp QR | JWT/OAuth | None (local) |

## Positioning in the Paean Ecosystem

PaeanClaw fills the "local claw middleware" layer:

- **Paean Cloud** (zero-api, app-paean-ai) — Full-featured cloud agent with rich UI, multi-provider AI, billing, sharing
- **Paean CLI** (ai-paean-cli, openpaean) — Terminal-based agent with cloud backend, gateway relay, worker mode
- **PaeanClaw** — Ultra-minimal local agent, self-hosted, provider-agnostic, extensible via MCP

PaeanClaw can optionally connect to the Paean cloud (via an MCP server that talks to the Paean API), but works completely standalone. It represents the lightest possible entry point into the agentic computing paradigm: a system you can understand in 10 minutes, run on any machine, and extend to do anything.

## Future Directions

Extensions via skills and MCP servers, not core code:

- **Scheduled tasks** — Cron-based task runner as an MCP server
- **Multi-agent** — Agent orchestrator via MCP
- **Voice** — Speech-to-text/text-to-speech via local models
- **Paean cloud sync** — Optional conversation sync with Paean cloud
- **RAG** — Local vector search via an MCP server
- **Memory** — Long-term agent memory beyond conversation history
