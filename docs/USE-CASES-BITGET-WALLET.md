# PaeanClaw Use Cases — Bitget Wallet On-Chain Intelligence

> **Multi-chain market data for your local AI agent.** These use cases add real-time on-chain intelligence across 9+ chains to PaeanClaw via the [Bitget Wallet](https://web3.bitget.com) API ecosystem. No private keys required for data queries. Human-in-the-loop signing for swap execution.

PaeanClaw's composable architecture means you can combine any use case below with the [core use cases](USE-CASES.md) — a Morning Briefing that includes token prices, a Research Pipeline that starts with a security audit, a Habit Coach that rewards streaks with token purchases.

---

## Prerequisites

All use cases below require one of the three Bitget Wallet components. Choose based on your setup:

| Component | Best For | Integration |
|-----------|----------|-------------|
| [bitget-wallet-mcp](https://github.com/bitget-wallet-ai-lab/bitget-wallet-mcp) | **PaeanClaw native** — MCP server, zero config | Add to `mcpServers` in config |
| [bitget-wallet-skill](https://github.com/bitget-wallet-ai-lab/bitget-wallet-skill) | Agent customization via SKILL.md | Apply skill, agent runs Python scripts |
| [bitget-wallet-cli](https://github.com/bitget-wallet-ai-lab/bitget-wallet-cli) | Terminal workflows, piping, scripting | Use via shell MCP server |

**Supported chains:** Ethereum · Solana · BNB Chain · Base · Arbitrum · Tron · TON · Sui · Optimism

**Available tools (via MCP):** `token_info` · `token_price` · `batch_token_info` · `kline` · `tx_info` · `batch_tx_info` · `rankings` · `liquidity` · `security_audit` · `swap_quote` · `swap_calldata` · `swap_send` · `historical_coins`

---

## Table of Contents

**On-Chain Intelligence**

1. [Multi-Chain Token Watchlist](#1-multi-chain-token-watchlist)
2. [Smart Token Discovery Agent](#2-smart-token-discovery-agent)
3. [On-Chain Due Diligence Agent](#3-on-chain-due-diligence-agent)

**Cross-Chain Trading Copilot**

4. [Cross-Chain Swap Router](#4-cross-chain-swap-router)
5. [Arbitrage Opportunity Scanner](#5-arbitrage-opportunity-scanner)

**Portfolio Intelligence**

6. [Multi-Chain Portfolio Dashboard](#6-multi-chain-portfolio-dashboard)
7. [Whale Activity Monitor](#7-whale-activity-monitor)
8. [Community Token Price Bot](#8-community-token-price-bot)

---

## On-Chain Intelligence

---

## 1. Multi-Chain Token Watchlist

**The scenario:** You track 15 tokens across Ethereum, Solana, Base, and BNB Chain. Instead of cycling through CoinGecko tabs or checking four different block explorers, your local agent runs a batch query every 4 hours and sends you a clean Telegram summary — prices, 24h changes, and volume spikes. You set it up once and it runs on your machine forever.

### Build it

**Step 1** — Add the Bitget Wallet MCP server:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/watchlist"]
    }
  }
}
```

**Step 2** — Add scheduled monitoring:
```
Apply skills/add-scheduled-tasks/SKILL.md
```

```json
{
  "schedule": {
    "token-watchlist": {
      "cron": "0 */4 * * *",
      "message": "Run the token watchlist check. Batch query all tokens in watchlist/tokens.md. Compare prices against last check. Report any moves > 5% and any volume spikes > 3x average.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Define your watchlist in `watchlist/tokens.md`:
```markdown
# Token Watchlist

| Token | Chain | Contract |
|-------|-------|----------|
| ETH   | eth   |          |
| SOL   | sol   |          |
| AERO  | base  | 0x940181a94A35A4569E4529A3CDfB74e38FD98631 |
| JUP   | sol   | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN |
| USDC  | base  | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
```

**Step 4** — Customize `AGENT.md`:
```markdown
## Token Watchlist Policy

You monitor a portfolio of tokens across multiple chains. The watchlist is in
~/watchlist/tokens.md. For each scheduled check:

1. Call batch_token_info with all tokens from the watchlist
2. Compare current prices against watchlist/last-check.json
3. Save current prices to watchlist/last-check.json
4. Report to user:
   - All prices in a clean table
   - Flag any 24h change > 5% with ↑/↓ arrows
   - Flag unusual volume (> 3x the token's 24h average)
5. Keep messages concise — this is Telegram

If a token drops > 15% in 24h, send an immediate alert with the exact percentage
and a recommendation to check the news.
```

**Every 4 hours on Telegram:**
```
Agent:  📊 Watchlist — Feb 27, 4:00 PM

        ETH    $3,142   ↑2.1%    vol normal
        SOL    $148.30  ↓0.8%    vol normal
        AERO   $1.42    ↑12.7%   ⚡ vol 5.2x avg
        JUP    $0.89    ↓1.2%    vol normal
        USDC   $1.00    —        vol normal

        🔔 AERO is up 12.7% with 5x volume spike.
        Want me to pull the K-line chart and check what's driving it?
```

No browser tabs. No app switching. Your watchlist runs itself on a schedule and speaks up when something matters.

---

## 2. Smart Token Discovery Agent

**The scenario:** You want to catch trending tokens early, but manually scrolling through rankings is tedious and risky — most top gainers are scams. Your agent runs a daily discovery loop: pull the top gainers, auto-run security audits on every one, filter out honeypots and high-risk contracts, and deliver only the vetted opportunities to your Telegram. It's an alpha scanner with built-in risk management.

### Build it

**Step 1** — Configure MCP servers:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/discovery"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Step 2** — Schedule the daily discovery run:
```json
{
  "schedule": {
    "token-discovery": {
      "cron": "0 9 * * *",
      "message": "Run the daily token discovery scan: pull top gainers, audit each for security, check liquidity, and report only safe opportunities.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
## Token Discovery Policy

Daily alpha scan with built-in risk management. Run every morning at 9am.

Discovery process:
1. Call rankings(name: "topGainers") to get the current top movers
2. For each token in the top 10:
   a. Call security_audit to check for honeypot, high tax, proxy contracts
   b. Call token_info to get price, market cap, holder count
   c. Call liquidity to check pool depth
   d. Call tx_info to assess real trading activity
3. Filter results:
   - REJECT if: highRisk=true, cannotSellAll=true, buyTax>5%, sellTax>5%
   - REJECT if: holder count < 100 or single holder > 50% supply
   - REJECT if: total pool liquidity < $10,000
   - REJECT if: 5m volume high but 24h volume near zero (wash trading)
4. Score remaining tokens: weight by market cap, holder growth, volume authenticity
5. Report top 3-5 vetted tokens to user
6. Save full scan results to discovery/YYYY-MM-DD.md

Always clearly state when ALL top gainers failed security checks — this is common.
Never recommend trading a token that failed any security check.
```

**Morning scan on Telegram:**
```
Agent:  🔍 Daily Token Discovery — Feb 27

        Scanned top 10 gainers. 7 filtered out:
        • 4 honeypot contracts
        • 2 with >10% sell tax
        • 1 with 0% LP lock and 3 holders

        3 tokens passed all checks:

        1. AERO (Base) — $1.42 ↑34%
           Market cap: $680M | Holders: 142K | LP lock: 100%
           Security: ✅ clean | Volume: authentic (8K traders)

        2. RENDER (sol) — $7.81 ↑18%
           Market cap: $3.2B | Holders: 89K | LP lock: 95%
           Security: ✅ clean | Volume: authentic (12K traders)

        3. ONDO (eth) — $1.35 ↑11%
           Market cap: $1.9B | Holders: 67K | LP lock: 100%
           Security: ✅ clean | Volume: authentic (5K traders)

        Full report saved to discovery/2026-02-27.md
        Want me to deep-dive into any of these?
```

**Follow-up:**
```
You:    Deep dive on AERO — what's driving the move?

Agent:  [fetches DexScreener, project socials, recent news]

        AERO analysis:
        • 24h K-line shows breakout above $1.30 resistance at 2am UTC
        • Trading volume concentrated in 1h window (possible catalyst)
        • Top LP pool: AERO/USDC on Aerodrome, $12M liquidity
        • No negative audit flags; contract verified and non-upgradeable
        • Recent news: Aerodrome governance proposal passed for new fee tier

        Assessment: Legitimate momentum driven by protocol development.
        Want a swap quote?
```

Your daily alpha scanner rejects 70% of top gainers as unsafe before you even see them. The ones that reach you have passed a four-step audit.

---

## 3. On-Chain Due Diligence Agent

**The scenario:** Someone shares a token contract address in your group chat, or you spot one on Twitter. Before putting any money near it, you want a thorough on-chain investigation. Instead of manually checking Etherscan, DexScreener, and security scanners, you paste the address to your agent and get a complete due diligence report in 30 seconds — security audit, holder distribution, liquidity depth, trading activity, and a risk verdict.

### Build it

**Step 1** — Configure the Bitget Wallet MCP:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Step 2** — Customize `AGENT.md`:
```markdown
## On-Chain Due Diligence

When a user provides a token address (or name + chain), run a comprehensive
assessment. Execute all data calls silently, then present a single structured report.

Assessment workflow (run all in sequence):
1. token_info → price, market cap, supply, holders, age
2. security_audit → honeypot, tax, proxy, blacklist
3. liquidity → pool depth, LP lock %, number of pools
4. tx_info → 5m/1h/4h/24h volume, buyer/seller ratio
5. kline(period: "1h", size: 24) → 24h price trend

Report format:
## Due Diligence: [TOKEN_SYMBOL] on [CHAIN]

### Quick Verdict: 🟢 Low Risk / 🟡 Medium Risk / 🔴 High Risk

### Token Overview
[price, market cap, holder count, token age]

### Security Audit
[audit results with clear pass/fail for each check]

### Liquidity Assessment
[pool depth, LP lock, estimate of max safe trade size]

### Trading Activity
[volume trend, buyer/seller ratio, whale detection]

### 24h Price Trend
[brief description of K-line pattern]

### Recommendation
[Clear, actionable recommendation based on all data]

Risk escalation thresholds:
- 🔴 ANY of: highRisk, cannotSellAll, sellTax>10%, <50 holders
- 🟡 ANY of: isProxy, sellTax 1-10%, <500 holders, LP lock <50%
- 🟢 ALL checks pass, >1000 holders, LP lock >80%, no proxy
```

**Conversation via Telegram:**
```
You:    Check this token: 0x940181a94A35A4569E4529A3CDfB74e38FD98631 on base

Agent:  [runs token_info, security_audit, liquidity, tx_info, kline]

        ## Due Diligence: AERO on Base

        ### Quick Verdict: 🟢 Low Risk

        ### Token Overview
        Price: $1.42 | Market Cap: $680M | Holders: 142,000
        Age: 14 months | Total supply: 479M

        ### Security Audit
        ✅ No honeypot    ✅ No blacklist    ✅ No buy/sell tax
        ✅ Not upgradeable (no proxy)
        ✅ Standard permissions | Risks: 0 | Warnings: 0

        ### Liquidity Assessment
        Primary pool: AERO/USDC — $12.4M liquidity
        LP lock: 100% (protocol-owned)
        Max safe trade: ~$250K (< 2% pool depth)

        ### Trading Activity (24h)
        Volume: $18.2M | Buyers: 5,420 | Sellers: 4,180
        Buy/sell ratio: 1.30 (mild buy pressure)
        No whale concentration detected

        ### 24h Price Trend
        Gradual uptrend with breakout at ~2am UTC.
        Support at $1.28, resistance at $1.52.

        ### Recommendation
        Established DeFi token with strong fundamentals.
        High liquidity, no security flags, organic trading activity.
        Safe for trades up to ~$250K without significant price impact.
```

Thirty seconds. Five data sources. One report. No tabs, no manual checking, no guesswork.

---

## Cross-Chain Trading Copilot

---

## 4. Cross-Chain Swap Router

**The scenario:** You hold tokens across multiple chains — SOL on Solana, USDC on Base, ETH on Arbitrum. When you want to swap, you tell your agent in plain English: "Swap 1 SOL to USDC on Base." The agent checks the security of both tokens, gets a cross-chain quote with best routing, shows you the estimated output and fees, and generates the calldata for your wallet to sign. No DEX UI hopping, no bridge searching, no manual chain switching.

### Build it

**Step 1** — Configure MCP servers. The `bitget-wallet-mcp` handles both same-chain and cross-chain swap quotes:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/trades"]
    }
  }
}
```

**Step 2** — Customize `AGENT.md` with the pre-trade safety workflow:
```markdown
## Cross-Chain Swap Policy

When the user requests a swap (same-chain or cross-chain):

Pre-trade checks (run silently):
1. security_audit on the destination token (skip for well-known tokens like ETH, SOL, USDC, USDT)
2. token_info on both tokens (get current prices for impact estimation)
3. liquidity check on the destination token
4. swap_quote for the requested pair and amount

If any red flag is found, stop and warn immediately.
If everything is clean, present a single confirmation summary:

Swap Summary:
• [amount] [from_token] ([from_chain]) → ~[amount] [to_token] ([to_chain])
• Route: [market/aggregator from quote]
• Slippage tolerance: [from quote]
• Estimated gas: [from quote]
• Token safety: ✅ / ⚠️ [details]

Proceed? [yes/no]

After user confirms:
1. Call swap_calldata to generate unsigned transaction data
2. Present the calldata to the user for wallet signing
3. After user signs and provides the signed transaction, call swap_send to broadcast

Common stablecoin addresses reference:
- USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
- USDC on Solana: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- USDT on Ethereum: 0xdAC17F958D2ee523a2206206994597C13D831ec7

Log all trades (quoted and executed) to ~/trades/log.md with timestamp,
amounts, chains, tx hash, and gas cost.
```

**Conversation via Telegram:**
```
You:    Swap 1 SOL to USDC on Base

Agent:  [runs security_audit, token_info, liquidity, swap_quote silently]

        Swap Summary:
        • 1 SOL (Solana) → ~148.20 USDC (Base)
        • Route: cross-chain via bgwevmaggregator
        • Slippage: 0.5%
        • Estimated gas: ~$0.15 (Solana) + ~$0.08 (Base)
        • Token safety: ✅ Both well-known tokens

        Proceed? (yes/no)

You:    yes

Agent:  Generating transaction data...

        Transaction calldata ready. Please sign with your wallet:
        [calldata details]

        Reply with the signed transaction when ready.

You:    [signed tx: 5xBq...XYZ]

Agent:  Broadcasting via MEV-protected endpoint...
        ✓ Transaction broadcast (sig: 5xBq...XYZ)

        Logged to trades/log.md
        Received: 148.20 USDC on Base
```

One message to swap across chains. The agent handles routing, safety checks, and execution — you just approve and sign.

---

## 5. Arbitrage Opportunity Scanner

**The scenario:** The same token often trades at different prices on different chains or DEXes. Your agent runs scheduled cross-chain price comparisons, finds spreads above a threshold, and alerts you with exact swap routes and expected profit — net of gas and slippage. You don't have to watch screens; the opportunities come to you.

### Build it

**Step 1** — Configure MCP servers:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/arb-log"]
    }
  }
}
```

**Step 2** — Schedule frequent scans:
```json
{
  "schedule": {
    "arb-scan": {
      "cron": "*/15 * * * *",
      "message": "Run the arbitrage opportunity scan across the configured token pairs. Report any spread > 0.5% net of gas.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
## Arbitrage Scanner Policy

Monitor cross-chain price spreads for a set of token pairs. Scan every 15 minutes.

Monitored pairs:
- USDC: sol vs base vs arbitrum vs eth
- USDT: eth vs bnb vs arbitrum
- ETH: eth (native) vs base (WETH) vs arbitrum (WETH)

Scan process:
1. Call batch_token_info for each token on each chain
2. For pairs with > 0.3% price difference:
   a. Get swap_quote for buying on the cheaper chain
   b. Get swap_quote for cross-chain swap to the more expensive chain
   c. Calculate: spread - gas_cost - slippage = net_profit
3. Report only if net_profit > 0.5% of trade amount

Report format:
🔄 Arb opportunity: [TOKEN]
Buy on [CHAIN_A] at $X → Sell on [CHAIN_B] at $Y
Spread: Z% | Gas: $G | Net: N% for $[AMOUNT] trade

Log all scans (with and without opportunities) to arb-log/YYYY-MM-DD.md
Only send Telegram alerts when opportunities are found.
When no opportunities exist, stay silent — don't spam "no opportunities found."
```

**Alert on Telegram:**
```
Agent:  🔄 Arb Opportunity — Feb 27, 2:15 PM

        USDT spread detected:
        Buy on BNB Chain:   $0.9997 (via PancakeSwap)
        Sell on Arbitrum:   $1.0012 (via Uniswap v3)
        Gross spread: 0.15%

        For a $5,000 trade:
        • Buy 5,000 USDT on BNB: gas ~$0.08
        • Cross-chain to Arbitrum: gas ~$0.30
        • Net profit: ~$5.12 (0.10%)

        Note: Spread is thin. Execution risk is moderate —
        prices may converge before the swap completes.

        Want me to generate the swap quote?
```

Your local agent watches price discrepancies 24/7 and only pings you when there's real money on the table.

---

## Portfolio Intelligence

---

## 6. Multi-Chain Portfolio Dashboard

**The scenario:** Your crypto is spread across 5 chains. Getting a total portfolio value means checking multiple wallets, converting token amounts to USD, and doing mental math. Your agent does this in one batch call — queries all your positions using `batch_token_info`, calculates USD values, tracks changes over time, and sends you a daily snapshot. It's a portfolio tracker that runs on your machine, with no third-party app seeing your addresses.

### Build it

**Step 1** — Configure MCP servers:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/portfolio"]
    }
  }
}
```

**Step 2** — Define your portfolio in `portfolio/holdings.md`:
```markdown
# Portfolio Holdings

| Token | Chain | Contract | Amount |
|-------|-------|----------|--------|
| ETH   | eth   |          | 2.5    |
| SOL   | sol   |          | 45     |
| USDC  | base  | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | 1,200 |
| AERO  | base  | 0x940181a94A35A4569E4529A3CDfB74e38FD98631 | 500   |
| JUP   | sol   | JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN | 1,000 |
```

**Step 3** — Schedule daily snapshots:
```json
{
  "schedule": {
    "portfolio-snapshot": {
      "cron": "0 8 * * *",
      "message": "Take a portfolio snapshot: batch query all tokens in portfolio/holdings.md, calculate total USD value, compare against yesterday, and send summary.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 4** — Customize `AGENT.md`:
```markdown
## Portfolio Dashboard Policy

Daily portfolio tracking. Holdings are defined in ~/portfolio/holdings.md.

Snapshot process:
1. Read holdings from portfolio/holdings.md
2. Call batch_token_info for all tokens in one request
3. Calculate: amount × price = USD value for each position
4. Sum for total portfolio value
5. Compare against portfolio/snapshots/latest.json
6. Save current snapshot to portfolio/snapshots/YYYY-MM-DD.json
7. Update portfolio/snapshots/latest.json

Report format:
Portfolio of [total_value] — [change] vs yesterday

[table of positions with: token, chain, amount, price, USD value, 24h %]

Top mover: [biggest % change]
Allocation: [pie: ETH X%, SOL Y%, stables Z%]

Update portfolio/holdings.md when the user reports new purchases or sales.
```

**Morning portfolio update on Telegram:**
```
Agent:  💼 Portfolio Snapshot — Feb 27

        Total: $10,847.30 ↑$342 (+3.3%) vs yesterday

        ETH   (eth)    2.5     $3,142   $7,855  ↑2.1%
        SOL   (sol)    45      $148.30  $6,674  ↓0.8%
        USDC  (base)   1,200   $1.00    $1,200  —
        AERO  (base)   500     $1.42    $710    ↑12.7%
        JUP   (sol)    1,000   $0.89    $890    ↓1.2%

        Top mover: AERO ↑12.7%
        Allocation: ETH 46% | SOL 39% | Stables 7% | Other 8%

        Snapshot saved. View history: portfolio/snapshots/
```

Your portfolio data stays local. No third-party tracker sees your addresses or amounts. The batch query fetches all prices in a single API call.

---

## 7. Whale Activity Monitor

**The scenario:** You hold positions in several mid-cap tokens and want to know when whales are moving. Sudden spikes in volume with few traders usually mean a large player is accumulating or dumping. Your agent monitors transaction stats periodically, detects anomalies (high volume + low trader count = whale), and alerts you before the price impact hits.

### Build it

**Step 1** — Configure the Bitget Wallet MCP:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/whale-watch"]
    }
  }
}
```

**Step 2** — Schedule hourly monitoring:
```json
{
  "schedule": {
    "whale-watch": {
      "cron": "0 * * * *",
      "message": "Run whale detection for monitored tokens. Check for unusual volume-to-trader ratios and alert on anomalies.",
      "channel": "telegram",
      "chatId": "${TELEGRAM_CHAT_ID}"
    }
  }
}
```

**Step 3** — Customize `AGENT.md`:
```markdown
## Whale Activity Monitor

Hourly anomaly detection on monitored tokens defined in ~/whale-watch/tokens.md.

Detection logic:
1. Call batch_tx_info for all monitored tokens
2. For each token, check the 1h window:
   - Volume / trader_count = average trade size
   - If average trade size > 10x the token's typical average → whale alert
   - If buy volume > 5x sell volume (or vice versa) → directional pressure alert
   - If 5m volume > 50% of 1h volume → sudden spike alert
3. For any anomaly detected:
   - Call token_info for current price
   - Call kline(period: "5m", size: 12) for 1h price action
   - Determine if price is reacting to the whale activity

Alert format:
🐋 Whale Alert: [TOKEN] on [CHAIN]
[Anomaly type]: [details]
Current price: $X ([change])
1h volume: $Y (usual: $Z)
Trader count: N (usual: M)
Avg trade: $[huge_number] vs typical $[small_number]

Action suggestion: [hold/monitor/consider exit based on direction]

When no anomalies are found, stay silent (don't send "all clear" every hour).
Keep detection history in whale-watch/log.md for pattern analysis.
```

**Alert on Telegram:**
```
Agent:  🐋 Whale Alert: JUP on Solana — Feb 27, 3:00 PM

        Sudden sell pressure detected:
        1h volume: $4.2M (typical: $800K) — 5.3x normal
        Traders: 12 sellers (typical: 200+)
        Avg sell size: $350K — 175x normal
        Buy/sell ratio: 0.15 (heavy sell side)

        Price impact: $0.89 → $0.84 (−5.6%) in last hour
        K-line: sharp drop at 2:47 PM, partial recovery to $0.86

        Possible cause: Large holder liquidating position.
        Suggestion: Monitor for stabilization before adding.
        If you hold JUP, consider setting a mental stop at $0.80.
```

Your local agent watches the on-chain flow 24/7 and only speaks up when something unusual happens. No exchange account needed, no data shared with third parties.

---

## 8. Community Token Price Bot

**The scenario:** Your Telegram or WhatsApp crypto group is constantly asking "What's the price of X?" and "Is this token safe?" Instead of everyone Googling separately, your PaeanClaw agent sits in the group chat and responds to queries — instant price lookups, mini security audits, and swap quotes. It's a community service bot that runs on your machine.

### Build it

**Step 1** — Configure MCP:
```json
{
  "mcpServers": {
    "bitget-wallet": {
      "command": "python",
      "args": ["/path/to/bitget-wallet-mcp/server.py"]
    }
  }
}
```

**Step 2** — Enable Telegram group mode. In `paeanclaw.config.json`, the bot already responds to mentions in groups. No extra config needed.

For WhatsApp groups:
```
Apply skills/add-whatsapp/SKILL.md
```

**Step 3** — Customize `AGENT.md`:
```markdown
## Community Price Bot

You serve a crypto community group chat. Keep responses SHORT (this is a group chat).

Trigger patterns and responses:
- "price [token]" or "how much is [token]" → call token_price, reply with price + 24h change
- "audit [contract]" or "is [token] safe" → call security_audit, give a 2-line verdict
- "quote [amount] [from] to [to]" → call swap_quote, show route and output
- "top gainers" → call rankings, list top 5 with prices

Rules:
- One-line responses for price queries
- 3-line max for audit results (verdict + key findings)
- Always include chain name for clarity
- If someone asks about a high-risk token, warn the whole group
- Never clutter the group with long reports — offer to DM for details
- Respond only when mentioned (@bot) or when a message matches trigger patterns
```

**In the Telegram group:**
```
User1:  @bot price SOL
Bot:    SOL: $148.30 (↑2.1% 24h)

User2:  @bot is 0xABC...123 on base safe?
Bot:    🔴 HIGH RISK — honeypot detected, 15% sell tax.
        Do NOT trade this token.

User3:  @bot quote 100 USDC to ETH on base
Bot:    100 USDC → 0.0318 ETH (Base)
        Route: Uniswap v3 | Slippage: 0.1% | Gas: ~$0.03

User4:  @bot top gainers
Bot:    📈 Top 5 Gainers:
        1. AERO (base) $1.42 ↑34%
        2. RENDER (sol) $7.81 ↑18%
        3. ONDO (eth) $1.35 ↑11%
        4. PYTH (sol) $0.41 ↑9%
        5. PENDLE (eth) $5.62 ↑7%
```

A community-owned price bot with no subscription, no data collection, and built-in scam detection. Runs on your machine, costs nothing beyond LLM API calls.

---

## The Bitget Wallet Advantage

All use cases above leverage the same three-component ecosystem:

| Role | Component | What It Provides |
|------|-----------|------------------|
| **Data layer for PaeanClaw** | `bitget-wallet-mcp` | 13 MCP tools, direct integration, zero config |
| **AI agent instructions** | `bitget-wallet-skill` | SKILL.md with domain knowledge, risk rules, common pitfalls |
| **Terminal access** | `bitget-wallet-cli` | `bgw` commands for scripting and ad-hoc queries |

Key differentiators from `paean-dex-mcp`:
- **9+ chains** (vs 2 chains for paean-dex-mcp)
- **Security audit tools** — honeypot detection, tax analysis, blacklist checks
- **Market data** — K-line, rankings, tx stats, historical token discovery
- **Human-in-the-loop signing** — calldata generation only, no autonomous execution
- **Built-in demo credentials** — works out of the box, no API key setup

These components complement PaeanClaw's existing web3 capabilities. Use `paean-pay-mcp` for USDC payments, `paean-dex-mcp` for autonomous DEX execution with private keys, and `bitget-wallet-mcp` for cross-chain market intelligence and researched swap flows.

---

## Combining with Core Use Cases

The power of PaeanClaw's composable architecture means you can layer Bitget Wallet capabilities onto any existing use case:

| Core Use Case | + Bitget Wallet | Result |
|---------------|-----------------|--------|
| Morning Briefing | + `batch_token_info` | Briefing includes crypto portfolio snapshot |
| Personal Finance Copilot | + `token_price` | Track crypto alongside bank account data |
| Research Pipeline | + `security_audit` + `token_info` | Add on-chain token research to any topic |
| Habit Streak Coach | + `swap_quote` | Reward streaks with token purchases |
| Freelance Milestone Payments | + `swap_quote` | Auto-convert received USDC to preferred token |
| Travel Itinerary Copilot | + `token_price` | Track crypto while traveling, get alerts on big moves |

---

## Building Your Own Use Case

Follow the same pattern as all PaeanClaw use cases:

1. **Pick your channel** — Telegram, WhatsApp, or the PWA
2. **Add `bitget-wallet-mcp`** to your `mcpServers` config
3. **Reference `bitget-wallet-skill/SKILL.md`** for domain knowledge (risk rules, chain codes, stablecoin addresses)
4. **Customize `AGENT.md`** with your specific policies and guardrails
5. **Let your AI coding assistant** wire it all together

The entire `bitget-wallet-mcp` server is 302 lines of Python. The SKILL.md contains all the domain knowledge your agent needs. Your AI coding assistant can read both and build bespoke integrations in minutes.

---

**→ See all core use cases in [USE-CASES.md](USE-CASES.md)**
**→ See the Bitget Wallet components: [bitget-wallet-mcp](https://github.com/bitget-wallet-ai-lab/bitget-wallet-mcp) · [bitget-wallet-skill](https://github.com/bitget-wallet-ai-lab/bitget-wallet-skill) · [bitget-wallet-cli](https://github.com/bitget-wallet-ai-lab/bitget-wallet-cli)**
