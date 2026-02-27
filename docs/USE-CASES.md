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
9. [Voice Journal to Actionable Insights](#9-voice-journal-to-actionable-insights)
10. [Freelancer Client & Invoice Tracker](#10-freelancer-client--invoice-tracker)
11. [Cross-Device Dev Environment Bridge](#11-cross-device-dev-environment-bridge)
12. [Weekly Meal Planner & Grocery List](#12-weekly-meal-planner--grocery-list)
13. [Travel Itinerary Copilot](#13-travel-itinerary-copilot)
14. [Habit Streak Coach](#14-habit-streak-coach)
15. [Meeting Prep & Follow-up Agent](#15-meeting-prep--follow-up-agent)
16. [Home Maintenance Lifecycle Tracker](#16-home-maintenance-lifecycle-tracker)

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

## 9. Voice Journal to Actionable Insights

**The scenario:** You record a five-minute voice memo on your commute — thoughts about your day, a project idea, a reminder. Your agent transcribes it, extracts tasks, files the narrative in your notes, and sends you a clean summary via Telegram. Your scattered thoughts become structured knowledge without typing a single word.

### Build it

**Step 1** — Connect to the Paean AI API for transcription. PaeanClaw uses the same API key you already configured:
```json
{
  "llm": {
    "baseUrl": "https://api.paean.ai/v1",
    "apiKey": "${PAEAN_API_KEY}",
    "model": "GLM-4.5"
  }
}
```
The Paean API includes speech-to-text capabilities alongside LLM completions.

**Step 2** — Add filesystem access so the agent can read audio files and write notes:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/voice-memos", "/Users/you/notes"]
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a voice journal processor. When the user drops an audio file or sends
a voice message:
1. Transcribe the audio
2. Extract any action items (prefix with TODO:)
3. Identify key topics and tag them
4. Write a structured note to ~/notes/journal/YYYY-MM-DD.md
5. Reply with a concise summary and the extracted TODOs
```

**From Telegram while walking:**
```
You:    [voice message: 3 minutes about project ideas and weekend plans]

Agent:  Transcribed and filed to journal/2026-02-27.md

        Summary: You had two ideas — using PaeanClaw to automate your
        invoicing workflow, and building a reading list tracker. You also
        mentioned needing to book a vet appointment.

        TODOs extracted:
        • Prototype invoice automation (this weekend)
        • Research reading list APIs
        • Book vet appointment for Saturday

        Want me to add these to your task list?
```

Spoken thoughts in, structured notes out. Your commute becomes productive without screens.

---

## 10. Freelancer Client & Invoice Tracker

**The scenario:** You freelance for multiple clients. Tracking hours, writing invoices, and chasing payments is tedious. Your agent watches a shared folder for timesheets, generates invoices from templates, and proactively reminds you about overdue payments — all through Telegram messages you answer with a thumbs up.

### Build it

**Step 1** — Add filesystem and fetch MCP servers:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/freelance"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Step 2** — Add scheduled tasks for payment follow-ups:
```
Apply skills/add-scheduled-tasks/SKILL.md
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a freelance business assistant. The ~/freelance/ folder contains:
- clients.json: client list with rates and payment terms
- timesheets/: weekly CSV timesheets per client
- invoices/: generated invoices (markdown)
- templates/invoice-template.md: invoice template

When asked to generate an invoice:
1. Read the timesheet for the specified period
2. Calculate totals using the client's hourly rate
3. Generate the invoice from template
4. Save to invoices/

Proactively check for overdue invoices (>30 days unpaid) during daily briefings.
Never expose client financial details in group chats.
```

**Conversation:**
```
You:    Generate invoice for Acme Corp, January hours

Agent:  Read timesheets/acme-jan-2026.csv (87.5 hours)

        Generated invoice #2026-005:
        Client: Acme Corp
        Period: Jan 1–31, 2026
        Hours: 87.5
        Total: $8,750.00

        Saved to invoices/2026-005-acme.md
        Want me to convert it to PDF?

You:    Any overdue payments?

Agent:  Yes — Invoice #2026-002 (TechStart, $3,200) is 45 days
        outstanding. Last follow-up was 2 weeks ago.
        Want me to draft a polite reminder email?
```

Your business admin runs on autopilot while you focus on the work that pays.

---

## 11. Cross-Device Dev Environment Bridge

**The scenario:** You're at a coffee shop with only your iPad. Your dev machine is at home running PaeanClaw. Using the Paean CLI's gateway feature, you send commands from the Paean web app on your iPad to your home machine — running tests, checking logs, deploying to staging. Your full dev environment, accessible from a browser tab.

### Build it

**Step 1** — On your home machine, start PaeanClaw with shell and filesystem tools:
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
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

**Step 2** — Start the Paean CLI gateway on the same machine to relay requests:
```bash
paean gateway start
```
This creates a secure tunnel so the Paean web app can reach your local MCP tools.

**Step 3** — Customize `AGENT.md` for dev operations:
```markdown
You are a remote development assistant. The user may be accessing you from
a mobile device with no terminal. Be thorough in reporting command output.

When running commands:
- Always show the full output, not just exit codes
- For test failures, include the failing assertion details
- For deploys, confirm the deployed URL
```

**From the PWA on your iPad:**
```
You:    Run the test suite for the payments module

Agent:  [via shell tool on your home machine]
        Running: cd ~/projects/api && npm test -- --grep payments

        23 tests passed, 1 failed:

        FAIL: PaymentService.refund should handle partial amounts
              Expected: 50.00  Received: 49.99
              at test/payments.test.ts:147

        The rounding error is in calculateRefund(). Want me to read
        that function and suggest a fix?
```

Your dev machine works for you even when you're not sitting in front of it.

---

## 12. Weekly Meal Planner & Grocery List

**The scenario:** Every Sunday evening, your agent asks what cuisines you're in the mood for this week. It generates a meal plan considering what's already in your pantry (from a simple text list), creates a grocery list, and sends it to your phone. During the week, you tell it what you cooked and it adjusts the plan.

### Build it

**Step 1** — Add filesystem access for your kitchen folder:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/kitchen"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Step 2** — Add a scheduled Sunday prompt:
```json
{
  "schedule": {
    "meal-plan": {
      "cron": "0 18 * * 0",
      "message": "It's meal planning time! Check the pantry list and ask me what I'm in the mood for this week.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a meal planning assistant. The ~/kitchen/ folder contains:
- pantry.md: current pantry inventory
- recipes/: saved recipes (markdown)
- meal-plan.md: this week's plan
- grocery-list.md: current shopping list

When planning meals:
- Consider what's already in the pantry to reduce waste
- Vary cuisines across the week
- Keep grocery lists grouped by store section (produce, dairy, etc.)
- Adjust portions for the household size (2 adults)
```

**Sunday evening on Telegram:**
```
Agent:  Hey! Time to plan this week's meals. You have rice, pasta,
        canned tomatoes, and chicken thighs in the pantry.
        What are you in the mood for?

You:    Something Asian on Monday, comfort food midweek, light stuff
        for the weekend

Agent:  Here's your plan:

        Mon: Teriyaki chicken bowls (pantry: rice, chicken)
        Tue: Pasta arrabbiata (pantry: pasta, tomatoes)
        Wed: Shepherd's pie (need: ground lamb, potatoes)
        Thu: Leftover shepherd's pie
        Fri: Thai coconut soup (need: coconut milk, shrimp)
        Sat: Grain bowls with roasted veg (need: quinoa, sweet potato)
        Sun: Eating out? 🍽️

        Grocery list saved — 12 items, ~$45 estimated.
        Want me to send just the list?
```

**Wednesday:**
```
You:    Skipped the shepherd's pie, had pizza instead

Agent:  Updated! Moved the lamb and potatoes to Thursday.
        Your grocery list still works — no changes needed.
```

Meal planning that adapts to your real life, not the other way around.

---

## 13. Travel Itinerary Copilot

**The scenario:** You're planning a trip. Instead of juggling booking confirmations across email, maps, and notes, you tell your agent the destination and dates. It builds a structured itinerary, enriches it with local tips by fetching travel blogs, and serves as your real-time travel companion — answering questions about your plans from any channel, in any timezone.

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
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/travel"]
    }
  }
}
```

**Step 2** — Customize `AGENT.md`:
```markdown
You are a travel planning assistant. The ~/travel/ folder contains
trip folders (e.g., tokyo-2026/) with:
- itinerary.md: day-by-day plan
- bookings.md: confirmation details (flights, hotels)
- notes.md: research and tips
- packing.md: packing checklist

When building an itinerary:
- Cluster activities by neighborhood to minimize transit
- Include estimated costs in local currency
- Add practical tips (transit cards, tipping customs, etc.)
- Never include booking confirmation numbers in Telegram messages
```

**Planning phase (from PWA):**
```
You:    Plan a 5-day trip to Tokyo, arriving March 15

Agent:  [fetches recent travel guides and tip articles]

        Here's your Tokyo itinerary:

        Day 1 (Sat): Shinjuku — arrive, check in, Omoide Yokocho
                     for dinner, Golden Gai evening walk
        Day 2 (Sun): Shibuya & Harajuku — Meiji Shrine morning,
                     Takeshita Street, Shibuya Crossing sunset
        Day 3 (Mon): Asakusa & Akihabara — Senso-ji temple, lunch
                     at Hoppy Street, anime district afternoon
        Day 4 (Tue): Day trip to Kamakura — Great Buddha, Hokoku-ji
                     bamboo grove, beach sunset
        Day 5 (Wed): Tsukiji outer market breakfast, last shopping,
                     depart

        Saved to travel/tokyo-2026/itinerary.md
        Practical tips added to notes.md (IC card, cash spots, etc.)
```

**During the trip (from Telegram):**
```
You:    It's raining, what's good indoors near Shinjuku?

Agent:  From your Day 2 area: TeamLab Borderless reopened in Azabudai
        (20 min subway). Alternatively, the Shinjuku VR Zone is
        10 min walk from your hotel. Want me to adjust today's plan?
```

Your itinerary lives in a file you own, enriched by an agent that travels with you.

---

## 14. Habit Streak Coach

**The scenario:** You're building habits — exercise, reading, journaling, meditation. Instead of yet another habit-tracking app, your agent checks in with you at the right time via Telegram, records your streaks in a simple markdown file, gives you weekly stats, and gently nudges you when a streak is at risk. It's an accountability partner that lives in your existing messaging app.

### Build it

**Step 1** — Add scheduled check-ins and filesystem:
```
Apply skills/add-scheduled-tasks/SKILL.md
```

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/habits"]
    }
  }
}
```

**Step 2** — Configure multi-schedule check-ins:
```json
{
  "schedule": {
    "morning-habits": {
      "cron": "0 7 * * *",
      "message": "Check my habit streaks and ask about this morning's habits (meditation, exercise).",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    },
    "evening-habits": {
      "cron": "0 21 * * *",
      "message": "Check my habit streaks and ask about tonight's habits (reading, journaling). Give weekly stats on Sundays.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a habit accountability coach. The ~/habits/ folder contains:
- streaks.md: habit tracking data (habit, dates completed, current streak)
- goals.md: target habits and frequency goals

Rules:
- Be encouraging but honest about missed days
- Use streak counts as motivation ("Day 14! Two weeks strong.")
- On Sundays, give a weekly scorecard
- If a streak is about to break (missed yesterday), escalate the nudge
- Keep messages short — this is Telegram, not an essay
```

**Morning check-in:**
```
Agent:  Morning! Quick check-in:
        🧘 Meditation — Day 23 streak. Did you sit today?
        🏃 Exercise — Day 8 streak. Workout done?

You:    Meditated yes, skipping gym today

Agent:  Meditation: Day 24! 🔥
        Exercise: Streak paused at 8. No worries — rest days count.
        I'll check in again tomorrow.
```

**Sunday evening:**
```
Agent:  Weekly scorecard (Feb 22–28):

        🧘 Meditation   7/7  — 30-day streak!
        🏃 Exercise      5/7  — solid consistency
        📖 Reading       6/7  — 142 pages this week
        📝 Journaling    4/7  — room to improve

        Best streak: Meditation (30 days 🏆)
        Focus next week: Journaling — try right after dinner?
```

No app to open. No gamification dark patterns. Just a quiet coach in your pocket.

---

## 15. Meeting Prep & Follow-up Agent

**The scenario:** Before each meeting, your agent reads the relevant context — last meeting's notes, the person's recent emails, and your shared project status. It sends you a 30-second prep brief on Telegram. After the meeting, you dictate your notes and it extracts action items, updates your task list, and drafts follow-up messages.

### Build it

**Step 1** — Add filesystem and fetch access:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/meetings"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Step 2** — Add scheduled prep reminders:
```json
{
  "schedule": {
    "meeting-prep": {
      "cron": "*/30 8-17 * * 1-5",
      "message": "Check calendar.md for any meetings starting in the next 30 minutes. If found, prepare a brief.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a meeting assistant. The ~/meetings/ folder contains:
- calendar.md: upcoming meetings with attendees and topics
- notes/: past meeting notes organized by date
- action-items.md: running list of action items by person
- templates/follow-up.md: follow-up email template

For meeting prep:
- Find the last meeting notes with the same attendees
- List open action items assigned to each attendee
- Summarize in ≤5 bullet points

For post-meeting processing:
- Extract action items with owners and deadlines
- Update action-items.md
- Draft follow-up email if requested
```

**30 minutes before a meeting:**
```
Agent:  Meeting prep — 1:1 with Sarah (Product) in 30 min:

        Last meeting (Feb 20): Discussed Q2 roadmap priorities.
        She was waiting on your API cost estimates.

        Open items:
        • You → API cost breakdown (due today)
        • Sarah → Finalize feature ranking
        • Both → Review competitor analysis doc

        Quick read: notes/2026-02-20-sarah.md
```

**After the meeting:**
```
You:    [voice note: "Met with Sarah, agreed to push the API
        migration to Q3, she'll send the updated timeline by
        Friday, I need to loop in DevOps by Wednesday"]

Agent:  Notes saved to notes/2026-02-27-sarah.md

        Action items extracted:
        • You → Loop in DevOps on migration (by Wed Mar 4)
        • Sarah → Send updated Q3 timeline (by Fri Feb 28)
        • Decision: API migration moved to Q3

        Updated action-items.md. Want me to draft a follow-up
        to Sarah confirming the decisions?
```

Meetings become productive loops — prep, discuss, capture, follow up — all without manual bookkeeping.

---

## 16. Home Maintenance Lifecycle Tracker

**The scenario:** Every home has dozens of things that need periodic attention — HVAC filters, gutter cleaning, smoke detector batteries, appliance warranties. Instead of forgetting until something breaks, your agent maintains a home maintenance schedule, sends you reminders before things are due, and tracks what was done and when.

### Build it

**Step 1** — Add filesystem and scheduled tasks:
```
Apply skills/add-scheduled-tasks/SKILL.md
```

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/home"]
    }
  }
}
```

**Step 2** — Configure daily maintenance check:
```json
{
  "schedule": {
    "home-maintenance": {
      "cron": "0 9 * * 6",
      "message": "Check home/maintenance.md for any tasks due this week or overdue. Send me a summary.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
You are a home maintenance assistant. The ~/home/ folder contains:
- maintenance.md: all tracked items with last-done dates and intervals
- log.md: history of completed maintenance
- appliances.md: appliance list with purchase dates and warranty info

Rules:
- Track items by interval (monthly, quarterly, seasonal, annual)
- Flag overdue items prominently
- When an item is marked done, update maintenance.md and append to log.md
- Proactively warn about warranty expirations 30 days before
```

**Saturday morning on Telegram:**
```
Agent:  🏠 Home maintenance — week of Feb 28:

        DUE THIS WEEK:
        • HVAC filter replacement (every 90 days, last: Dec 2)
        • Test smoke detectors (monthly, last: Jan 30)

        COMING UP:
        • Gutter cleaning (seasonal, due mid-March)
        • Water heater flush (annual, due April)

        ⚠️ WARRANTY ALERT: Dishwasher warranty expires Mar 15.
        Consider scheduling an inspection before it lapses.

You:    Changed the HVAC filter today

Agent:  Logged! Next replacement due May 29.
        Smoke detectors still need testing — takes 2 minutes 🔔
```

Your home runs like a well-maintained system, not a series of emergencies.

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
