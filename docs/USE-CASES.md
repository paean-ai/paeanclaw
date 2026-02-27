# PaeanClaw Use Cases

> **The agentic era changes the question.** It's no longer "what does this software support?" — it's "what do I need, and can my AI coding agent build it in five minutes?"

PaeanClaw is a minimal base, not a finished product. Each use case below is built by applying skills (markdown instructions that an AI coding agent follows) and composing MCP servers. The result is a purpose-built agent that fits your life — not a generic platform configured around your life.

---

## Table of Contents

1. [Morning Intelligence Briefing](#1-morning-intelligence-briefing)
2. [Personal Finance Copilot](#2-personal-finance-copilot)
3. [Agentic Code Review for Solo Developers](#3-agentic-code-review-for-solo-developers)
4. [Family Coordination Hub](#4-family-coordination-hub)
5. [Smart Home Command Center](#5-smart-home-command-center)
6. [Living Second Brain](#6-living-second-brain)
7. [Async Team Stand-up Bot](#7-async-team-stand-up-bot)
8. [Personal Research Pipeline](#8-personal-research-pipeline)

---

## 1. Morning Intelligence Briefing

**The scenario:** Every morning you wake up to a Telegram message — a personalized briefing assembled by your local agent: today's calendar, top headlines in your domain, open pull requests, and weather. Zero logins, zero subscriptions, runs on your machine while you sleep.

### Build it

**Step 1** — Add the scheduled tasks skill:
```
Apply skills/add-scheduled-tasks/SKILL.md
```
This adds a cron-based runner that triggers your agent on a schedule.

**Step 2** — Add MCP servers that give your agent eyes:
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

**Step 3** — Set the schedule in `paeanclaw.config.json`:
```json
{
  "schedule": {
    "morning-briefing": {
      "cron": "0 7 * * *",
      "message": "Prepare my morning briefing: fetch top 3 HN stories, check my GitHub PRs awaiting review, and give me a focused work agenda for today.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**What it looks like at 7am:**
```
Good morning. Here's your briefing for Tuesday:

GITHUB: 2 PRs awaiting your review (auth-refactor, deps-update)
HN TODAY: "The economics of context windows" (847pts), "Bun 2.0 ships"...
FOCUS: You have no meetings until 2pm — ideal for deep work.
```

No dashboard to open. No app to check. The agent delivers.

---

## 2. Personal Finance Copilot

**The scenario:** Your bank exports a monthly CSV. Instead of opening a spreadsheet, you drop it in a folder and ask your agent in plain language: "Did I overspend on food this month? What's trending up?" The agent reads, analyzes, and answers — then proactively warns you next month when you're on track to exceed a category.

### Build it

**Step 1** — Add the filesystem MCP server to give the agent access to your downloads folder:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Downloads/finance"]
    }
  }
}
```

**Step 2** — Add WhatsApp via skill (so you can ask while commuting):
```
Apply skills/add-whatsapp/SKILL.md
```

**Step 3** — Customize `AGENT.md` to make your agent finance-aware:
```markdown
You are a personal finance assistant. The user's bank exports are CSV files
in ~/Downloads/finance/. When analyzing spending:
- Categorize by merchant patterns
- Flag month-over-month increases > 20%
- Never expose raw account numbers in responses
```

**Conversation:**
```
You:    @Agent analyze my March statement
Agent:  Analyzed chase-march-2025.csv (247 transactions)

        Top categories:
        Food & dining  $1,240  ↑38% vs Feb
        Transport        $180  ↓12%
        Subscriptions    $127  (8 active)

        Alert: Food spending is unusually high. The increase is
        concentrated on weekends (Fri-Sun). 3 subscriptions haven't
        been used this month — want me to list them?
```

Your data stays on your machine. The CSV never leaves.

---

## 3. Agentic Code Review for Solo Developers

**The scenario:** You're a solo developer or a small team. You don't have colleagues to review every PR. You set up PaeanClaw with code access, and before merging anything you ask your local agent to review it — it reads the diff, checks for common issues, and gives structured feedback. Then you ask Telegram questions about it from your phone on the subway.

### Build it

**Step 1** — Add filesystem and shell MCP servers:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/projects"]
    },
    "shell": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-shell"]
    }
  }
}
```

**Step 2** — Customize `AGENT.md` to focus on code review:
```markdown
You are a code review assistant. When asked to review code:
1. Read the diff or file(s)
2. Check for security issues first (injection, auth bypasses, data leaks)
3. Check logic correctness
4. Flag performance issues
5. Format output as: CRITICAL / WARNING / SUGGESTION with one-line explanations
```

**Conversation from the PWA:**
```
You:    Review the changes in src/auth/ since yesterday
Agent:  [reads git diff via shell tool]

        CRITICAL: Line 47 in middleware.ts — JWT secret falls back to
        hardcoded "dev-secret" if env var is missing. This will be
        exploitable in production.

        WARNING: Token expiry is 30 days; industry standard is 15 min
        for access tokens.

        SUGGESTION: extractUser() is called 3 times in the request
        lifecycle — consider caching per-request.
```

**Later, from Telegram on the subway:**
```
You:    What was that JWT issue again?
Agent:  Line 47 in src/auth/middleware.ts. If JWT_SECRET env var isn't
        set, it defaults to the string "dev-secret". Fix: throw an error
        at startup if the env var is missing.
```

Context persists between the PWA and Telegram because they share the same conversation store.

---

## 4. Family Coordination Hub

**The scenario:** A WhatsApp family group. Instead of everyone asking "when is dinner?" or "did anyone book the dentist?", there's a family agent in the group. It tracks shared todos in a simple text file, answers questions about the family calendar, and only responds when mentioned — so it doesn't spam the group.

### Build it

**Step 1** — Add WhatsApp channel via skill:
```
Apply skills/add-whatsapp/SKILL.md
```
Configure the trigger word to `@Claw` so the bot only activates when called.

**Step 2** — Add filesystem access to a shared family folder (iCloud, Dropbox, etc.):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/iCloud/family"]
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a friendly family coordination assistant named Claw. Keep answers
short (this is WhatsApp). The family folder at ~/iCloud/family/ contains:
- todos.md: shared task list
- calendar.md: upcoming events
- notes.md: misc family notes

Update these files when asked. Be warm and friendly, not robotic.
```

**In the family WhatsApp group:**
```
Dad:    @Claw add "book flu shots for kids" to todos
Claw:   Done! Added to the list. You're at 7 open todos — want me
        to read them all?

Mom:    @Claw when's the next school holiday?
Claw:   Spring break is April 7-11 (from your calendar.md)

Teen:   @Claw remove "clean room" from todos
Claw:   Nice try — that one stays 😄
```

---

## 5. Smart Home Command Center

**The scenario:** Your Home Assistant runs locally. You add an MCP server that connects to its REST API. Now you control your home through natural language, from any channel — Telegram when you're outside, the PWA when you're at your desk. The agent understands intent, not just commands.

### Build it

**Step 1** — Install or write a Home Assistant MCP server. A minimal one exposes:
- `get_entities` — list devices and their states
- `call_service` — trigger automations and actions

**Step 2** — Configure it:
```json
{
  "mcpServers": {
    "homeassistant": {
      "command": "npx",
      "args": ["-y", "mcp-server-homeassistant"],
      "env": {
        "HA_URL": "http://homeassistant.local:8123",
        "HA_TOKEN": "${HA_LONG_LIVED_TOKEN}"
      }
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You control a smart home via Home Assistant tools. When the user says
"I'm leaving", run the "away mode" scene. When they say "movie time",
dim the living room lights to 20% and turn off the overhead light.
Learn their preferences from conversation and apply them proactively.
```

**From Telegram while leaving the office:**
```
You:    Heading home, be there in 30 min
Agent:  Got it. I've set the heat to 70°F (arrives in ~30 min),
        turned on the entryway light, and started your "coming home"
        playlist on the kitchen speaker. Anything else?
```

The agent infers context from natural language and chains multiple smart home actions — something rigid command interfaces can't do.

---

## 6. Living Second Brain

**The scenario:** Your notes live in Obsidian. Your bookmarks in a folder. Your research in PDFs. PaeanClaw connects them all and becomes your second brain — searchable by thought, not by filename. You ask it questions that span multiple sources, and it synthesizes answers.

### Build it

**Step 1** — Apply the Obsidian skill (or configure filesystem MCP for your vault):
```
Apply skills/add-obsidian/SKILL.md
```

**Step 2** — Apply the RAG skill to enable semantic search across your knowledge base:
```
Apply skills/add-rag/SKILL.md
```
This adds a local embedding model and vector index over your notes.

**Step 3** — Give the agent access to your bookmarks and PDFs:
```json
{
  "mcpServers": {
    "vault": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/obsidian-vault"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Conversation:**
```
You:    What did I conclude about async Rust last time I researched it?

Agent:  From your notes (async-rust-notes.md, Oct 2024):
        You concluded that async Rust is powerful but the learning curve
        is steep due to the executor model. You preferred tokio over
        async-std for ecosystem reasons. You flagged "cancellation safety"
        as a footgun to revisit.

        Want me to pull the current Tokio docs to see if anything changed?
```

Your knowledge base becomes conversational. You stop searching and start asking.

---

## 7. Async Team Stand-up Bot

**The scenario:** A small remote team uses Telegram. Every weekday at 9am, the bot asks each person for their stand-up in a private message. At 9:30am, it posts a compiled summary to the team channel. No meeting, no Zoom fatigue, full async coordination.

### Build it

**Step 1** — Add scheduled tasks skill:
```
Apply skills/add-scheduled-tasks/SKILL.md
```

**Step 2** — Add a skill or custom MCP server that can message multiple Telegram users and collect replies. The key pattern:

```typescript
// 9:00am: DM each team member
for (const member of config.team) {
  await bot.api.sendMessage(member.chatId,
    "Morning! What are you working on today? Any blockers?");
}

// 9:30am: collect replies, synthesize, post to channel
const replies = await collectReplies(config.team, timeoutMs: 30 * 60 * 1000);
const summary = await agent.ask(`Summarize these stand-ups concisely:\n${replies}`);
await bot.api.sendMessage(config.channelId, summary);
```

**Step 3** — Configure the team roster:
```json
{
  "standup": {
    "team": [
      { "name": "Alice", "chatId": 123456 },
      { "name": "Bob", "chatId": 789012 }
    ],
    "channelId": -1001234567890,
    "collectCron": "0 9 * * 1-5",
    "postCron": "30 9 * * 1-5"
  }
}
```

**In the team channel at 9:30am:**
```
📋 Stand-up — Tuesday Feb 27

Alice: Finishing the payment integration PR. Blocked on staging
       credentials — needs ops attention.

Bob:   Reviewing Alice's PR, then starting the email templates.
       No blockers.

🚨 Blocker: staging credentials (Alice → ops team)
```

A stand-up that runs itself, surfaces blockers, and takes zero meeting time.

---

## 8. Personal Research Pipeline

**The scenario:** You're researching a topic — a new technology, a market, a competitor. Instead of opening 20 tabs, you brief your agent and let it do the legwork: fetch pages, extract key points, compare sources, and write a structured report to a file in your notes. You review the output when you're ready.

### Build it

**Step 1** — Add fetch and filesystem MCP servers:
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/research"]
    }
  }
}
```

**Step 2** — From Telegram (so you can start a research task from anywhere):
```
You:    Research the current state of local-first software databases.
        Cover: key players, technical approaches, trade-offs, and
        who's winning. Save a report to research/local-first-dbs.md

Agent:  On it. I'll fetch docs and articles from the main projects
        and write a structured report. This will take a few minutes...

        [reads cr.sqlite.org, liveblocks.io/blog, vlcn.io, ditto.live...]

        Done. Saved to research/local-first-dbs.md (1,840 words).

        TL;DR: The space has consolidated around three approaches —
        CRDT-based sync (Automerge, Yjs), SQLite replication (cr-sqlite,
        LiteFS), and custom P2P protocols (Ditto). Electric SQL is
        emerging as the Postgres-friendly option...
```

**The key advantage:** The agent runs a multi-step research loop autonomously. You brief it once and return to a finished output. This is what "agentic" actually means in practice.

---

## The Pattern Behind All of These

Every use case above follows the same construction:

```
1. Identify the channels you live in  → apply channel skills
2. Identify the data sources you need → add MCP servers
3. Customize AGENT.md with context    → specialize the agent
4. Describe the scenario to your AI   → let it build the integration
```

The agent is not pre-packaged for any of these scenarios. You build the version you need, with exactly the capabilities required, in the channels you already use. The codebase stays small enough to understand, modify, and trust.

This is what agentic software looks like when built right: **a minimal, composable system that your AI coding assistant can bend to fit your exact life.**

---

## Building Your Own Use Case

The framework for turning any scenario into a PaeanClaw installation:

### 1. Identify your channels
Where does this live? Telegram? WhatsApp? Your browser? Find the relevant skill or write one.

### 2. Map the data sources
What does the agent need to read or write? Find or build the MCP server for it.

### 3. Write the scenario into AGENT.md
Give the agent the context it needs: what it's for, what it knows, what it should do proactively.

### 4. Tell your AI coding agent
Open Claude Code, Cursor, or any AI coding assistant and describe what you want. Point it at the relevant skills. Let it generate the bespoke integration.

### 5. Run it, iterate
Because the codebase is 477 lines, your AI coding assistant can read all of it and make precise changes. Iteration is fast and safe.

---

Want to contribute a use case or the skills needed to build one? See [CONTRIBUTING.md](CONTRIBUTING.md).
