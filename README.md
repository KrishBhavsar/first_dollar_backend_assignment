# Onchain Wallet Score API

A backend service that accepts an Ethereum wallet address on **Base mainnet** or **Basename**, fetches its transaction history via **Alchemy**, and returns a numeric score (0-100) reflecting "real, engaged user" behavior.

Built with **Next.js 16** (App Router) and **TypeScript**.

## Setup & Running

### Prerequisites

- Node.js 18+
- An [Alchemy](https://www.alchemy.com/) API key (free tier works)

### Installation

```bash
git clone <repo-url>
cd first_dollar_backend_assignment
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
ALCHEMY_API_KEY=your_alchemy_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3000
CACHE_TTL_SECONDS=300
```

### Run

```bash
npm run dev      # Development server on http://localhost:3000
npm run build    # Production build
npm start        # Start production server
```

## Data Source

- **Provider:** Alchemy (`alchemy_getAssetTransfers` JSON-RPC method)
- **Network:** Base mainnet
- **Transaction categories fetched:** `external`, `erc20`, `erc721`, `erc1155`
- **Direction:** Outgoing transactions only (`fromAddress`). Incoming transfers are excluded to focus on active wallet behavior rather than passive receipt of tokens.

## API

### `GET /api/score?address=<ethereum_address>`

### Success Response (200)

```json
{
  "address": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
  "score": 67,
  "breakdown": {
    "activityConsistency": 72,
    "transactionVolume": 45,
    "multiAppUsage": 80,
    "walletMaturity": 55
  },
  "stats": {
    "totalTransactions": 142,
    "uniqueActiveDays": 89,
    "longestStreak": 12,
    "firstTxAt": "2024-06-01T00:00:00.000Z",
    "lastTxAt": "2025-04-20T00:00:00.000Z",
    "uniqueContracts": 34,
    "daysSinceFirstTx": 310
  },
  "flags": {
    "insufficientData": false
  }
}
```

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing `address` query param | `{ "error": "Missing address parameter" }` |
| 400 | Invalid Ethereum address | `{ "error": "Invalid Ethereum address format" }` |
| 429 | Alchemy rate limit hit | `{ "error": "Rate limited. Please try again later." }` |
| 500 | Upstream or server failure | `{ "error": "Failed to fetch transaction data" }` |

## Scoring Methodology

The final score is a **weighted average** of four component scores, each ranging 0-100:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Activity Consistency | 30% | How regularly the wallet transacts |
| Transaction Volume | 25% | Total number of transactions |
| Multi-App Usage | 25% | Diversity of contracts interacted with |
| Wallet Maturity | 20% | Age of the wallet |

```
finalScore = round(activity * 0.30 + volume * 0.25 + diversity * 0.25 + maturity * 0.20)
```

### Activity Consistency (0-100)

Three sub-components summed together:

- **Active Days** (0-40 pts): `min(uniqueActiveDays / 100 * 40, 40)`. Rewards wallets active on many distinct days.
- **Longest Streak** (0-30 pts): `min(longestStreak / 30 * 30, 30)`. Rewards consecutive-day activity.
- **Recency** (0-30 pts): Based on days since last transaction:
  - <=7 days: 30 pts
  - 8-30 days: 25 pts
  - 31-90 days: 15 pts
  - \>90 days: 0 pts

### Transaction Volume (0-100)

Log-scaled to prevent high-volume wallets from dominating:

```
score = min(round(log10(totalTransactions + 1) * 33.33), 100)
```

Approximate mapping: 0 tx = 0, 10 tx ~ 35, 100 tx ~ 67, 1000 tx = 100.

### Multi-App Usage / Diversity (0-100)

Two sub-components:

- **Contract Score** (0-70 pts): `min(uniqueContracts / 20 * 70, 70)`. Rewards interacting with many distinct contract addresses.
- **Diversity Ratio Bonus** (0-30 pts): `min((uniqueContracts / totalTransactions) * 150, 30)`. Rewards wallets that spread transactions across contracts rather than repeating the same one.

### Wallet Maturity (0-100)

Tiered scoring based on wallet age (days since first transaction):

| Age | Score |
|-----|-------|
| 0 days | 0 |
| 1-29 days | 0-20 (linear) |
| 30-179 days | 20-70 (linear) |
| 180-364 days | 70-100 (linear) |
| 365+ days | 100 |


### Insufficient Data

Wallets with fewer than 5 transactions receive a score of 0 with an `insufficientData: true` flag, since there isn't enough history to produce a meaningful score.

## Caching

- **Type:** In-memory cache using `node-cache`
- **TTL:** 300 seconds (5 minutes), configurable via `CACHE_TTL_SECONDS` env var
- **Key:** Normalized (lowercase) wallet address
- **Eviction check:** Every 60 seconds
- Cache does not persist across server restarts.

## Project Structure

```
app/
  api/score/route.ts        API endpoint
  page.tsx                   Frontend UI
lib/
  blockchain/alchemy.ts      Alchemy API client with pagination
  cache/cache.ts             In-memory score cache
  scoring/
    calculator.ts            Transaction processing & score aggregation
    components/
      activity.ts            Activity consistency scorer
      volume.ts              Transaction volume scorer
      diversity.ts           Multi-app / diversity scorer
      maturity.ts            Wallet maturity scorer
  utils/validation.ts        Ethereum address validation (ethers + zod)
  constants.ts               Weights, thresholds, config
types/index.ts               TypeScript interfaces
```

## Assumptions

- Only **outgoing** transactions are analyzed. This focuses the score on active wallet behavior (sending, swapping, minting) rather than passive receipt.
- `uniqueContracts` counts distinct `to` addresses, not protocol-level classifications. A single protocol may appear as multiple contracts.
- Pagination fetches all available transaction history (up to Alchemy's limits). Very active wallets may have longer response times.

## Frontend

A simple UI is included at the root path (`/`). Enter a wallet address to see the score, breakdown bars, flags, and wallet statistics.
