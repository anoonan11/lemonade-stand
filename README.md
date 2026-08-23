# Lemonade Stand

A ten-day lemonade stand simulation. You start with $100. Each morning you buy
supplies and set a price, then the day runs: some number of people wander past,
some of them buy, leftover ice melts, and whatever cash you finish with is your
score.

Built as a single-page React app with the game logic in plain TypeScript.

## Running it

Node 22 (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
```

That's the whole setup — no backend, no database, no services.

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
2. **Buy supplies.** Ice, cups, lemons, and sugar are sold in the quantities
   listed on each row. The panel underneath updates as you type: what the order
   costs, what cash you'd have left, and how many cups you could actually make.
   That last number is the one to watch — it's capped by whichever ingredient
   you're shortest on.
3. **Set a price.** The line under the field tells you what share of passersby
   will buy at that price and the most cups you could sell on the busiest
   possible day.
4. **Open for business.** The day runs start to finish; you can't intervene
   partway. If you run out of lemonade, the rest of the crowd goes home thirsty.
5. **Read the results,** then move to the next day. Leftover ice melts
   overnight; cups, lemons, and sugar carry over.

The game ends after day 10, or earlier if you go bankrupt — no lemonade you can
make and no money to buy the ingredients for even one cup. Either way your
final cash goes on the leaderboard, which persists in `localStorage`.

**A hint:** one cup costs about $1.53 in ingredients. Price below that and every
sale loses you money.

## How the numbers work

### Recipe and units

Supplies are sold in one unit and consumed in another, so the engine converts
once at purchase and stores integers only.

| Supply | Bought as | Stored as | Cups per purchase unit |
| --- | --- | --- | --- |
| Ice | $1.00 / lb | tenths of a pound | 10 |
| Cups | $5.00 / pack | individual cups | 100 |
| Lemons | $5.00 / lb | individual lemons | 4 |
| Sugar | $2.00 / lb | tablespoons | 16 |

One cup takes 1 lemon, 1 tbsp sugar, 0.1 lb ice, and a cup.

### Demand

Two things decide sales. Foot traffic is a uniform random integer from 0 to 100,
independent each day. The share of those people who buy depends on your price:

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

Demand is `passersby × rate` rounded half-up, and you sell the lesser of that
and what your inventory can make.

**Where this is deliberately simple.** The brief warned against disappearing
into the statistics, so this is a straight line through one anchor point rather
than anything calibrated. It gives pricing a real trade-off — charge more, sell
to fewer — and that's all it's trying to do. If the goal were a genuinely fun
game rather than a working one, the things to change:

- **The curve shape.** Linear demand means a single optimum (around $2.76 with
  these costs) that a player can solve once and then repeat. A curve with
  diminishing sensitivity near the anchor, or a reference price that drifts
  toward what you've been charging, would make pricing an ongoing decision.
- **Uniform foot traffic.** A flat 0–100 draw makes day-to-day results swing
  wildly for reasons the player can't anticipate or plan around. Something
  clustered around a mean, nudged by a visible signal like a weather forecast,
  would reward preparation instead of punishing it at random.
- **No memory between days.** Nothing you did yesterday affects today. Repeat
  customers, a reputation that a bad price or a sellout dents, or word of mouth
  would connect the days into a season rather than ten independent rolls.
- **Spoilage and lumpiness.** Only ice expires, and everything else is
  effectively free to hold, so over-buying is nearly costless. Making lemons go
  off after a few days would give inventory decisions some teeth.

All of the knobs are in `src/engine/constants.ts`, and the day simulation is
`runDay` in `src/engine/engine.ts`.

## How it's built

```
src/
  engine/          game logic — pure TypeScript, no React
    constants.ts   every price, conversion, and demand parameter
    types.ts       GameState, Inventory, Purchases, DayResult, LeaderboardEntry
    money.ts       integer-cent helpers and the only dollar formatting
    rng.ts         random foot traffic
    engine.ts      newGame, validatePurchases, cupsMakeable, runDay, ...
  components/      React UI — reads state, calls the engine, renders
  storage.ts       leaderboard persistence
  format.ts        small display helpers
```

Three things shaped the design:

**No backend.** The game is a pure state machine with no shared state, no
authority to enforce, and nothing to keep private. A server would have added a
second language and a deployment story without making anything on this list
better, so the logic lives in TypeScript and the app is static files.

**Money is integer cents, everywhere.** Floats never touch a monetary value.
`formatCents` is the single place cents become dollars for display, and
`parseDollarsToCents` is the single place typed dollars come back — it rounds
half-up once, which is what keeps `1.15` from becoming 114 cents. Inventory is
integers too: ice in tenths of a pound, sugar in tablespoons.

**The engine is testable without the UI.** `runDay` takes the number of
passersby as an argument rather than rolling for it, so every test asserts an
exact hand-computed outcome. `simulateDay` is the one-line wrapper that supplies
the random value. That's also why there's no seeded PRNG here — the
determinism tests need comes from the parameter, not from machinery.

## Tests

```bash
npm test
```

38 tests, all with hand-computed expected values and the arithmetic shown in a
comment. They cover the money helpers (including the floating-point trap in
parsing dollars), purchase and unit-conversion math, the demand curve at both
clamps, inventory-limited and demand-limited days, ice melting, the bankruptcy
boundary, input validation, and one full ten-day season played through `runDay`.

There are no component tests. The engine holds everything worth asserting, and
the UI was verified by playing it — a full season and a forced bankruptcy.

## What's not built

Tracked in `features/implementation-plan.md`; decisions and their reasoning are
in `CHANGELOG.md`.

- **Chaos events** — lemon disease spoiling stock overnight, the first thing
  I'd add. The day result already has a place to announce it.
- **A competitor** who undercuts you for a stretch of days.
- **Weather** as a forecast the player can plan against, which is also the
  fix for the random-foot-traffic problem above.
- **Bulk discounts or equipment**, to make spending decisions more than
  arithmetic.
- **Saving a game in progress.** Only finished scores persist today, so a
  reload mid-season loses the run.
- **Component tests.** Worth adding if the UI grows past one screen.
