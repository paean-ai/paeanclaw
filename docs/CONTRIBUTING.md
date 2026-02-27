# Contributing to PaeanClaw

## The Golden Rule

**Don't add features. Add skills.**

PaeanClaw's core is intentionally minimal. The entire runtime is 477 lines across 5 files. This is not a limitation to overcome — it is the primary design goal. Every line added to the core is a line that every user must understand, maintain, and carry forever.

## What Are Skills?

Skills are markdown files (`SKILL.md`) that contain instructions for an AI coding agent to transform a PaeanClaw installation. They live in the `skills/` directory.

When a user wants to add WhatsApp support, they don't install a plugin or enable a config flag. Instead, they open their AI coding assistant and say:

```
Follow the instructions in skills/add-whatsapp/SKILL.md
```

The AI reads the skill, modifies the user's code, installs dependencies, and produces a working WhatsApp integration — customized to that specific installation.

### Why This Works

In the agentic coding era, **code generation is cheap and instant**. What's expensive is:
- Maintaining generic abstractions that serve multiple use cases
- Debugging interactions between features you didn't ask for
- Understanding a codebase that grows with every contributor's pet feature

Skills flip the economics. Instead of one generic implementation that serves everyone poorly, each user gets a bespoke implementation that serves them perfectly.

### The Skills Workflow

```
Contributor writes SKILL.md
         ↓
User runs AI coding agent (Claude Code, Cursor, Codex, etc.)
         ↓
AI reads the skill instructions
         ↓
AI modifies the user's fork with exactly what they need
         ↓
User has clean, purpose-built code — no dead features
```

## How to Contribute a Skill

### 1. Create a skill directory

```
skills/
└── add-your-feature/
    └── SKILL.md
```

### 2. Write the SKILL.md

A good skill file includes:

- **What it does** — one-paragraph description
- **Prerequisites** — what the user needs before running
- **Implementation steps** — clear, numbered instructions with code examples
- **Key patterns** — code snippets the AI should follow
- **Notes** — edge cases, limitations, tips

### 3. Structure your instructions for AI agents

Write as if you're instructing a senior developer who has never seen the codebase. Be specific:

```markdown
### Step 1: Install dependencies

    npm install some-package

### Step 2: Create `src/channels/yourfeature.ts`

Create a new file that:
- Initializes the connection
- Listens for incoming messages  
- Calls the PaeanClaw API at `http://localhost:3007/api/chat`
- Sends the response back

Key pattern:

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage }),
    });
    // Parse SSE stream...

### Step 3: Update `src/index.ts`

Add an optional startup block:

    if (config.channels?.yourfeature?.enabled) {
      const { start } = await import('./channels/yourfeature.js');
      start(config.channels.yourfeature);
    }
```

### 4. Test with an AI coding agent

Before submitting, verify your skill works by running it yourself:

1. Start with a clean PaeanClaw installation
2. Open Claude Code, Cursor, or another AI coding agent
3. Ask it to follow your `SKILL.md`
4. Verify the result works

### 5. Submit a pull request

Your PR should contain **only** the `skills/your-feature/SKILL.md` file. No changes to core source files.

## Skills We'd Like to See

### Channels
- `/add-discord` — Discord bot via discord.js
- `/add-slack` — Slack bot via Bolt
- `/add-matrix` — Matrix via matrix-js-sdk

### Capabilities
- `/add-scheduled-tasks` — Cron-based task scheduler
- `/add-memory` — Long-term memory via vector embeddings
- `/add-rag` — RAG pipeline with local document indexing
- `/add-voice` — Speech-to-text / text-to-speech

### Integrations
- `/add-paean-sync` — Sync conversations with Paean cloud
- `/add-obsidian` — Read/write Obsidian vault via MCP
- `/add-github` — GitHub integration via MCP

### Platform
- `/setup-systemd` — Run as a Linux systemd service
- `/setup-launchd` — Run as a macOS launchd daemon
- `/add-docker` — Containerize the installation

## What Changes ARE Accepted to Core

The bar for core changes is deliberately high:

- **Security fixes** — always accepted
- **Bug fixes** — if they fix real broken behavior
- **Performance improvements** — if measurable and zero-cost in complexity
- **Dependency updates** — routine maintenance

The following are NOT accepted as core changes:

- New channels (contribute a skill instead)
- New built-in tools (use MCP servers)
- Configuration options (users should modify code directly)
- Abstraction layers (keep the code flat and direct)
- Features that increase the line count by more than ~20 lines

If you're unsure whether something belongs in core or as a skill, it's almost certainly a skill.

## Code Style

If you do contribute to core:

- No comments that narrate what the code does
- No abstraction for fewer than 3 concrete use cases
- Prefer inline code over extracted functions when the function would only be called once
- Use TypeScript's type system, not runtime validation
- Zero `any` types

## The Philosophy

Traditional open source: *"I added a feature, please merge it."*

Agentic open source: *"I wrote instructions for how to add this capability. Users generate the code on demand, customized for their setup."*

This is not laziness — it's a fundamentally better model:

1. **Every installation is unique.** Generic code serves the average case. Generated code serves the specific case.
2. **AI agents read markdown better than abstractions.** A clear SKILL.md produces better code than a complex plugin API.
3. **The core stays auditable.** 477 lines today, 477 lines next year.
4. **Contributors focus on knowledge, not code.** The most valuable contribution is understanding *how* to integrate something, not a specific implementation of it.
5. **Users stay in control.** Generated code lives in their fork. They can read it, modify it, delete it. No hidden framework magic.

---

Thank you for contributing to PaeanClaw. Whether you're fixing a bug in core or writing a skill that helps thousands of users generate exactly the code they need — your contribution matters.
