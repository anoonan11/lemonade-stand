# Lemonade Stand

A ten-day lemonade stand simulation. You start with $100. Each morning you buy
supplies and set a price, then the day runs: people walk past, some buy,
leftover ice melts, and the cash you finish with is your score.

Single-page React app; game logic in plain TypeScript under `src/engine/`.
No backend.

## Setup and running

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Tests in watch mode |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |

## How to play

1. **Enter your name** and start the season.
2. **Buy supplies** — ice, cups, lemons, and sugar. The panel below the form
   shows the order cost, the cash you'd have left, and how many cups you could
   make.
3. **Set a price.** The line under the field shows the share of passersby who
   will buy at that price.
4. **Open for business.** The day runs start to finish with no intervention.
5. **Read the results,** then move to the next day. Leftover ice melts
   overnight; cups, lemons, and sugar carry over.

The game ends after day 10, or earlier if you go bankrupt (you can't make a
cup and can't afford the ingredients for one). Your final cash goes on the
leaderboard, which persists in `localStorage`.

**Watch for chaos.** Each day rolls one chance of disaster, announced on the
results screen: pestilence (15% — the lemons already in your cooler rot before
you open; lemons bought that day are fine), a thunderstorm (20% — nobody walks
by), or a windstorm (10% — a quarter of the crowd stays home and half your
sugar blows away for good). The other 55% of days are ordinary.

**A hint:** one cup costs about $1.53 in ingredients. Price below that and every
sale loses you money.

## Recipe and units

Supplies are bought in one unit and consumed in another; the engine converts
once at purchase and stores integers only.

| Supply | Bought as | Stored as | Cups per purchase unit |
| --- | --- | --- | --- |
| Ice | $1.00 / lb | tenths of a pound | 10 |
| Cups | $5.00 / pack | individual cups | 100 |
| Lemons | $5.00 / lb | individual lemons | 4 |
| Sugar | $2.00 / lb | tablespoons | 16 |

One cup of lemonade takes 1 lemon, 1 tbsp sugar, 0.1 lb ice, and a cup.
Money is integer cents everywhere; dollars appear only at display.

## Demand model

Foot traffic is a uniform random integer from 0 to 100 each day. The share of
passersby who buy depends on price, anchored at 25% for a $2.00 cup:

```
rate = 0.25 × (1 + ($2.00 − price) / $2.00),  clamped to [0, 0.5]
```

| Price | Buy |
| --- | --- |
| $0.00 | 50% (the cap) |
| $1.00 | 37.5% |
| $2.00 | 25% |
| $3.00 | 12.5% |
| $4.00+ | 0% |

Demand is `passersby × rate` rounded half-up. Cups sold is the lesser of
demand and what the inventory can make.

All game-balance numbers live in `src/engine/constants.ts`; the day simulation
is `runDay` in `src/engine/engine.ts`.

## Tests

```bash
npm test
```

vitest, with hand-computed expected values. Covers the money math, purchase
and unit conversions, the demand curve, inventory- and demand-limited days,
ice melt, bankruptcy, validation, and a full ten-day season through `runDay`.
