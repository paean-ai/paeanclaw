# Add USDC Payment Capabilities to PaeanClaw

This skill adds stablecoin payment capabilities to a PaeanClaw installation using `paean-pay-mcp` — a Model Context Protocol server for USDC on Base (Coinbase L2) and Solana.

After applying this skill, your agent can:
- Create payment requests and present them to users or other agents
- Verify on-chain payment confirmation before delivering services
- Send USDC to any address (for paying external services or other agents)
- Check balances and transaction history
- Run fully autonomously as a paid micro-service

## What This Skill Does

1. Adds `paean-pay-mcp` to `paeanclaw.config.json` as an MCP server
2. Injects a `## Payment Policy` section into `AGENT.md` tailored to the chosen scenario
3. Optionally creates a wallet setup guide at `docs/wallet-setup.md`

## Prerequisites

- A funded USDC wallet on Base, Solana, or both
  - **Read-only mode**: no wallet needed — balance checks and tx lookups work without a key
  - **Receiving payments**: requires a wallet address (private key needed for `create_payment_request`)
  - **Sending payments**: requires a private key for the relevant chain
- Node.js 20+ or Bun 1.0+ (for running `paean-pay-mcp` via npx/bunx)
- For testnet: get free test USDC at [faucet.circle.com](https://faucet.circle.com/)

> ⚠️ **Security**: Never store private keys directly in `paeanclaw.config.json`. Always use `${ENV_VAR}` references and set the actual values in your shell environment or a `.env` file that is not committed to version control.

## Implementation Steps

### 1. Add the MCP Server to paeanclaw.config.json

Add a `payment` entry under `mcpServers`. Choose your chain(s):

**Base only (simplest for EVM users):**
```json
{
  "mcpServers": {
    "payment": {
      "command": "npx",
      "args": ["-y", "paean-pay-mcp"],
      "env": {
        "PAYMENT_PRIVATE_KEY_BASE": "${BASE_PRIVATE_KEY}",
        "PAYMENT_NETWORK": "mainnet",
        "PAYMENT_DEFAULT_CHAIN": "base"
      }
    }
  }
}
```

**Solana only (best for high-frequency micro-payments, ~400ms finality):**
```json
{
  "mcpServers": {
    "payment": {
      "command": "npx",
      "args": ["-y", "paean-pay-mcp"],
      "env": {
        "PAYMENT_PRIVATE_KEY_SOLANA": "${SOLANA_PRIVATE_KEY}",
        "PAYMENT_NETWORK": "mainnet",
        "PAYMENT_DEFAULT_CHAIN": "solana"
      }
    }
  }
}
```

**Both chains (most flexible):**
```json
{
  "mcpServers": {
    "payment": {
      "command": "npx",
      "args": ["-y", "paean-pay-mcp"],
      "env": {
        "PAYMENT_PRIVATE_KEY_BASE": "${BASE_PRIVATE_KEY}",
        "PAYMENT_PRIVATE_KEY_SOLANA": "${SOLANA_PRIVATE_KEY}",
        "PAYMENT_NETWORK": "mainnet",
        "PAYMENT_DEFAULT_CHAIN": "base"
      }
    }
  }
}
```

**Testnet (for development — safe to experiment):**
```json
{
  "mcpServers": {
    "payment": {
      "command": "npx",
      "args": ["-y", "paean-pay-mcp"],
      "env": {
        "PAYMENT_PRIVATE_KEY_BASE": "${BASE_PRIVATE_KEY_TESTNET}",
        "PAYMENT_NETWORK": "testnet",
        "PAYMENT_DEFAULT_CHAIN": "base"
      }
    }
  }
}
```

### 2. Set Environment Variables

Add your private key to your shell environment or a `.env` file in your agent directory. **Never commit this file.**

```bash
# Base (EVM) — 64-char hex, with or without 0x prefix
export BASE_PRIVATE_KEY="0xabc123..."

# Solana — base58 encoded private key
export SOLANA_PRIVATE_KEY="your-base58-private-key"
```

If using a `.env` file, ensure it is in `.gitignore`:
```
.env
.env.*
```

Load it before starting PaeanClaw:
```bash
source .env && bunx paeanclaw
# or use a tool like dotenv-cli:
npx dotenv-cli bunx paeanclaw
```

### 3. Add a Payment Policy to AGENT.md

Append a `## Payment Policy` section to your existing `AGENT.md`. Tailor it to your scenario:

**Scenario A — Pay-per-query service:**
```markdown
## Payment Policy

You charge $0.25 USDC (on Base) per research or analysis request.

When a user asks for a premium task:
1. Call create_payment_request(amount: "0.25", chain: "base", memo: "service-query")
2. Present the payment address, amount, and payment ID to the user
3. Wait for the user to confirm they have sent payment
4. Call check_payment_status(payment_id: "...") to verify on-chain receipt
5. Only proceed after the status is "confirmed"
6. If the payment expires (30 min), inform the user and offer to create a new request
```

**Scenario B — Autonomous agent that pays for external services:**
```markdown
## Payment Behavior

You can pay for external services using send_usdc when instructed.

Rules:
- Always confirm with the user before sending any amount over $1.00
- For amounts $1.00 and below, you may proceed autonomously if the task requires it
- Always report the transaction hash and explorer URL after sending
- Never send to an address you cannot verify from the conversation context
```

**Scenario C — Subscription gating:**
```markdown
## Subscription Check

Before responding to any premium request, verify the user has an active subscription.
Check the subscription records in ~/subscriptions/subscribers.md.
If not found or expired, create a payment request for $5.00 USDC (monthly subscription)
and wait for payment confirmation before granting access.
```

### 4. Verify the Setup

Restart PaeanClaw and test in the PWA:
```
You: What is my USDC balance?
Agent: [calls get_usdc_balance]
       Your Base wallet: 0xABC...123
       Balance: 42.50 USDC
```

For testnet testing, get free USDC at [faucet.circle.com](https://faucet.circle.com/).

## Available Tools (exposed to agent)

| Tool | Description | Needs Private Key |
|------|-------------|-------------------|
| `get_wallet_address` | Return configured wallet address(es) | No |
| `get_usdc_balance` | Check USDC balance for any address | No |
| `create_payment_request` | Create a payment request with unique ID | Yes |
| `check_payment_status` | Verify on-chain payment receipt | No |
| `send_usdc` | Send USDC to a recipient | Yes |
| `get_transaction_status` | Look up a tx by hash | No |
| `list_payment_requests` | List all tracked payment requests | No |

## Supported Chains

| Chain | Token | Finality | Tx Cost | Best For |
|-------|-------|----------|---------|----------|
| Base (Coinbase L2) | USDC | ~2s | <$0.01 | General payments, EVM wallets |
| Solana | USDC | ~400ms | <$0.001 | High-frequency micro-payments |

## Security Notes

1. **Private keys in environment only** — never in committed config files
2. **Read-only by default** — without private keys, no funds can move
3. **Amount limits** — the MCP server rejects amounts ≤ 0 or > 1,000,000 USDC
4. **In-memory state** — payment requests reset on restart; persist records to a file if needed
5. **LLM confirmation** — for large transfers, always require explicit user confirmation in `AGENT.md`
6. **Testnet first** — always validate your payment flow on testnet before enabling mainnet

## Reference

- [paean-pay-mcp on npm](https://www.npmjs.com/package/paean-pay-mcp)
- [paean-pay-mcp on GitHub](https://github.com/paean-ai/paean-pay-mcp)
- [USDC faucet for testnet](https://faucet.circle.com/)
- [Base explorer](https://basescan.org) / [Solana explorer](https://solscan.io)
