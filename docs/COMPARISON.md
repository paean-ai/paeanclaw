# Comparison: PaeanClaw vs OpenClaw vs NanoClaw vs OpenPaean

A deep, multi-dimensional comparison of four agent runtime projects in the personal AI assistant space. All four aim to run an AI agent that connects to messaging platforms and executes tasks, but they make fundamentally different trade-offs.

## At a Glance

| Metric | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|--------|-----------|----------|----------|-----------|
| **Core source lines** | **365** | ~8,000 | ~420,000 | ~12,800 |
| **Source files** | **5** | 28 | ~4,900 | 66 |
| **Runtime dependencies** | **2** | 9 | ~50 | 16 |
| **LLM providers** | **Any** (OpenAI-compatible) | Claude only | Pi (multi-model) | Paean cloud (multi-model) |
| **Channels** | Web PWA + Telegram | WhatsApp | 16+ platforms | Terminal CLI |
| **Container isolation** | None | Docker/Apple Container | Optional Docker | None |
| **Runtime** | Node.js or **Bun** | Node.js + Docker | Node.js 22 | Node.js or Bun |
| **Tool system** | MCP only | Claude SDK + MCP | 60+ built-in + plugins | Cloud tools + local MCP |
| **Database** | SQLite | SQLite | SQLite (FTS5 + vector) | Cloud PostgreSQL |
| **Setup time** | **~2 min** | ~15 min | ~30 min | ~5 min |
| **License** | MIT | MIT | Proprietary (source-available) | MIT |

## Benchmark Snapshot

Local machine benchmark (macOS arm64, Bun 1.x / Node.js 22, March 2026).

|                          | PaeanClaw (Bun)   | PaeanClaw (Node) | NanoClaw          | OpenClaw           | OpenPaean          |
| ------------------------ | ----------------- | ---------------- | ----------------- | ------------------ | ------------------ |
| **Cold Start**           | **~20ms**         | ~40ms            | ~5s (container)   | ~3s                | ~2s (cloud)        |
| **Memory Baseline**      | **~30MB**         | ~50MB            | ~200MB            | ~150MB             | N/A (cloud)        |
| **Install Time**         | **~5s**           | ~30s             | ~2 min            | ~5 min             | ~10s               |
| **Dist / Binary Size**   | **~0.8MB** (src)  | ~0.8MB (src)     | ~4MB              | ~28MB              | ~2MB               |
| **Runtime Dependencies** | **2**             | 3                | 9                 | ~50                | 16                 |
| **Native Addons**        | **0**             | 1                | 3+                | Several            | 0                  |
| **Setup Complexity**     | **~2 min**        | ~5 min           | ~15 min           | ~30 min            | ~5 min             |
| **Deployment Cost**      | **Any hardware**  | Any hardware     | Docker host ~$5/mo| beefy server ~$20+ | Cloud subscription |

> PaeanClaw on Bun starts **150x faster** than OpenClaw, uses **5x less memory**, and installs **60x faster** — with zero native compilation.

---

## 1. Codebase Complexity

### Lines of Code

```
PaeanClaw    ████                                                          365
NanoClaw     ██████████████████████████████████████                       ~8,000
OpenPaean    ██████████████████████████████████████████████████████████  ~12,800
OpenClaw     ████████████████████████████████████████████████ (off-chart) ~420,000
```

PaeanClaw is **880x smaller** than OpenClaw and **17x smaller** than NanoClaw.

### Why Code Size Matters in the Agentic Era

In a world where AI coding assistants modify and extend code, smaller codebases have compounding advantages:

1. **Full-context understanding.** PaeanClaw's entire source fits within a single LLM context window (~4K tokens). An AI assistant can read, understand, and safely modify the entire system. OpenClaw's ~420K lines require multi-stage analysis with significant risk of partial understanding.

2. **Modification safety.** When an AI makes a change to a 365-line codebase, the blast radius is inherently limited. In a 420K-line codebase, a seemingly local change can have cascading effects across modules the AI hasn't read.

3. **Fork-and-customize economics.** PaeanClaw is designed to be forked. With 5 source files, every installation can safely diverge from upstream. OpenClaw's 52+ modules make custom forks expensive to maintain.

4. **Audit surface.** A security-conscious user can read PaeanClaw's complete source in under 15 minutes. OpenClaw requires days of focused effort.

5. **Bug density.** Fewer lines mean fewer bugs. This is not just theoretical -- industry data consistently shows that defect density increases super-linearly with codebase size.

### File Count and Architecture

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Source files | 5 | 28 | ~4,900 | 66 |
| Config files | 1 | 3 | 8+ | 2 |
| Test files | 0 | 5 | 971 | 3 |
| Architecture | Single process | Host + container | Gateway monolith | CLI + cloud backend |

PaeanClaw deliberately has zero test files. At 365 lines, the code is its own specification. Tests would be larger than the code they test.

---

## 2. Dependencies

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Production deps | 2 | 9 | ~50 | 16 |
| Dev deps | 3 | 9 | ~15 | 6 |
| Native addons | 0 (Bun) / 1 (Node) | 1 | Several | 0 |
| Package manager | npm or bun | npm | pnpm | npm or bun |

**PaeanClaw's 2 dependencies:**
- `@modelcontextprotocol/sdk` -- MCP protocol compliance
- `grammy` -- Telegram bot

On Bun, even the SQLite dependency is eliminated (uses built-in `bun:sqlite`).

**Why minimal dependencies matter:**
- Fewer supply-chain attack vectors
- Faster install (no native compilation on Bun)
- No version conflicts
- Smaller attack surface for security audits

---

## 3. LLM Provider Support

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Provider model | **Any OpenAI-compatible** | Claude only | Pi (multi-model) | Paean cloud |
| Switch providers | Change 3 config fields | Fork + rewrite | Config change | N/A (cloud) |
| Local models | Yes (Ollama, LM Studio) | No | Via plugins | No |
| Default provider | Paean AI | Anthropic | Anthropic | Paean AI |

PaeanClaw achieves provider agnosticism through a deliberate architectural choice: raw `fetch()` to the OpenAI chat completions API, which has become the de facto standard. No SDK abstractions. No provider-specific code paths. The entire LLM integration is 67 lines.

NanoClaw is tightly coupled to the Claude Agent SDK, which provides excellent tool-calling capabilities but locks users to Anthropic.

OpenClaw uses its own "Pi" agent runtime that supports multiple models but through a significant abstraction layer with 60+ built-in tools.

---

## 4. Tool System

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Approach | MCP-only | Claude SDK + custom MCP | 60+ built-in + plugins | Cloud tools + local MCP |
| Built-in tools | 0 | 7 (via MCP) | 60+ | 7+ system tools |
| Tool extensibility | Any MCP server | MCP servers | Plugin system | MCP config |
| Tool protocol | MCP (open standard) | MCP + SDK hooks | Proprietary | MCP + REST |

PaeanClaw has zero built-in tools. All capabilities come from MCP servers configured in `paeanclaw.config.json`. This is a feature, not a limitation:

- The MCP ecosystem has hundreds of available servers (filesystem, shell, web, databases, APIs)
- Users compose exactly the capabilities they need
- No unused tool code in memory
- Each tool runs in its own process (natural isolation)

OpenClaw's 60+ built-in tools provide rich out-of-the-box functionality but at the cost of a much larger codebase and potential security surface.

---

## 5. Channel Support

| Channel | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---------|-----------|----------|----------|-----------|
| Web PWA | **Built-in** | No | WebChat | No |
| Telegram | **Built-in** | Via skill | Built-in | No |
| WhatsApp | Via skill | **Built-in** | Built-in | No |
| Slack | Via skill | No | Built-in | No |
| Discord | Via skill | Via skill | Built-in | No |
| Signal | No | No | Built-in | No |
| iMessage | No | No | Built-in | No |
| Google Chat | No | No | Built-in | No |
| CLI terminal | No | No | Yes | **Built-in** |
| Native apps | No | No | macOS/iOS/Android | No |

PaeanClaw takes a "two built-in, rest via skills" approach: Web PWA + Telegram cover the most common access patterns (browser + mobile IM). Additional channels follow the NanoClaw-inspired skill pattern.

OpenClaw supports 16+ channels natively, which is its primary differentiator. If you need Signal, iMessage, or Teams support out of the box, OpenClaw is the clear choice.

---

---

## 7. Runtime Performance

| | PaeanClaw (Bun) | PaeanClaw (Node) | NanoClaw | OpenClaw |
|---|---|---|---|---|
| Cold start | **~20ms** | ~40ms | ~5s (container pull) | ~3s |
| Memory baseline (RSS) | **~30MB** | ~50MB | ~200MB (host + container) | ~150MB |
| Install time | **~5s** (no native compile) | ~30s | ~2 min | ~5 min |
| Dist / binary size | **~0.8MB** (source) | ~0.8MB (source) | ~4MB | ~28MB |
| Native addons | **0** | 1 | 3+ | Several |
| Min. deployment cost | **$0** (any hardware) | $0 | ~$5/mo (Docker host) | ~$20+/mo |

PaeanClaw on Bun achieves the fastest startup and lightest footprint of any agent runtime in this comparison. The zero-native-addon architecture means `bun install` finishes in seconds with no C++ compiler, no Python, and no platform-specific binary downloads.

### Why These Numbers Matter

- **20ms cold start** means the agent responds before you finish pressing Enter. OpenClaw's 3s startup makes the difference between "always on" and "wait for it."
- **30MB memory** means PaeanClaw runs comfortably on a $5 VPS, a Raspberry Pi, or alongside 50 other processes on your laptop without breaking a sweat.
- **0 native addons** on Bun eliminates the #1 source of install failures across platforms — no more `node-gyp` errors, no missing XCode Command Line Tools, no broken Python environments.
- **~0.8MB source** means the entire agent ships in a fraction of what OpenClaw's `dist` directory alone weighs.

---

## 8. Data Ownership

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Data location | **Local SQLite** | Local SQLite + files | Local SQLite | **Cloud PostgreSQL** |
| Cloud dependency | LLM API calls only | LLM API calls only | LLM API calls only | Full cloud backend |
| Offline capable | With local LLM | No | With local LLM | No |
| Export | Direct DB access | Direct DB/file access | CLI commands | API export |
| GDPR compliant | **By design** (data never leaves) | By design | By design | Requires cloud compliance |

PaeanClaw and NanoClaw keep all conversation data on the user's machine. OpenPaean relies on cloud infrastructure, meaning user data is stored on remote servers.

---

## 9. Extensibility Model

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Extension mechanism | MCP servers + skills | MCP + Claude Code skills | Plugin system (34 bundled) | MCP config + executors |
| Add a tool | Config change | Config change | Plugin development | Config change |
| Add a channel | Skill (AI-guided) | Skill (AI-guided) | Plugin development | N/A |
| Customization | Edit code (365 lines) | Edit code (~8K lines) | Config + plugins | Config |
| AI-assisted extension | **Trivial** (full-context) | Good (small codebase) | Challenging (large codebase) | Moderate |

---

## 10. Development Velocity

| | PaeanClaw | NanoClaw | OpenClaw | OpenPaean |
|---|---|---|---|---|
| Time to understand codebase | **15 min** | 1 hour | Days | 2-3 hours |
| Time to add a feature | Minutes | Hours | Days | Hours |
| Time to fork and customize | **Minutes** | Hours | Days-weeks | Hours |
| Risk of breaking change | Very low | Low | High | Moderate |
| AI-assisted development | **Ideal** | Good | Difficult | Good |

---

## Detailed Architecture Comparison

### PaeanClaw

```
User → HTTP/SSE → Server → Agent Loop → LLM API
                      ↓          ↓
                   SQLite    MCP Servers
                      ↓
                  Telegram Bot
```

Five files, one process, zero abstraction layers. The entire agent loop is a `while` loop calling `fetch()`.

### NanoClaw

```
WhatsApp → SQLite → Poll Loop → Container Spawn → Claude SDK → Response
                                      ↓
                                 File-based IPC
                                      ↓
                                  MCP Server
```

Host process + container architecture. The host manages lifecycle; agents run isolated in containers with explicit filesystem mounts.

### OpenClaw

```
16 Channels → Gateway → Agent Engine (Pi) → 60+ Tools
                ↓              ↓
           Config/Cron    Plugin Runtime
                ↓              ↓
            WebSocket     34 Extensions
                ↓
         Native Apps (macOS/iOS/Android)
```

Full-featured gateway with plugin architecture, native apps, and comprehensive tool ecosystem.

### OpenPaean

```
Terminal → CLI → SSE Stream → Paean Cloud → Response
   ↓                              ↓
  MCP ← ← ← ← ← ← mcp_tool_call ←
   ↓
Gateway (remote → local MCP relay)
```

Cloud-centric architecture where the agent runs in the cloud but can execute local tools via the MCP gateway relay.

---

## Summary: Choosing the Right Solution

Each project optimizes for different priorities:

- **PaeanClaw** optimizes for **simplicity and portability**
- **NanoClaw** optimizes for **security through isolation**
- **OpenClaw** optimizes for **feature completeness**
- **OpenPaean** optimizes for **cloud-edge coordination**

See the scenario-based recommendations in the main [README](../README.md).
