# Core Concept for Lemonade Stand Game

This is the spec of record for what we're building. `instructions.md` is the
original assignment brief and is left unchanged. Where this doc departs from
the first draft of the concept, the reason is noted.

## Shape of the app

Frontend only: React + Vite + TypeScript, with the game logic in plain
TypeScript modules under `src/engine/`. No backend — the game is a pure state
machine, so a server would add a toolchain without adding anything to show.
The leaderboard persists in `localStorage`.

## Start of the Game

1. The player starts with $100 to spend on supplies.
2. Supplies are ice, cups, lemons, and sugar.
3. Prices are as follows:
   - ice is $1/lb
   - 100 cups for $5
   - $5/lb for lemons
   - $2/lb for sugar

### Units

Purchase units and recipe units differ, so the engine converts once, on
purchase, and stores integers only:

| Supply | Bought as | Stored as |
| --- | --- | --- |
| Ice | pounds | tenths of a pound (1 lb = 10 units) |
| Cups | packs of 100 | individual cups |
| Lemons | pounds | individual lemons (1 lb = 4 lemons) |
| Sugar | pounds | tablespoons (1 lb = 16 tbsp) |

Money is integer cents everywhere and becomes dollars only at render.

### User Inputs

1. How many of each supply to buy
2. How much to charge for a cup of lemonade

## Recipe for Lemonade

One cup of lemonade takes **1 lemon, 1 tbsp sugar, 0.1 lb ice, and 1 cup**.

That works out to 152.5¢ of ingredients per cup (125¢ lemon + 12.5¢ sugar +
10¢ ice + 5¢ cup), so a $2.00 cup earns a healthy margin.

> Changed from the original draft, which called for 4 lemons and 1/8 cup of
> sugar per cup. At the listed prices that recipe costs about $5.31 per cup,
> which would force prices no player would pay. The ratio was simplified so
> the economy works at the $1–2 price point people expect.

## Gameplay

Each day runs as one atomic step — no changes mid-day, per the brief:

1. **Chaos, maybe.** One roll per day against the odds in
   `src/engine/constants.ts` (`CHAOS_ODDS`): pestilence 15%, thunderstorm
   20%, windstorm 10%; otherwise a normal day. Pestilence rots the lemons
   carried in from yesterday — lemons bought today survive.
2. **Buy supplies.** Rejected if quantities aren't whole and non-negative, or
   if the order costs more than the cash on hand. A windstorm then blows away
   half the sugar, today's shopping included, rounded half-up.
3. **People walk by.** A uniform random 0–100 of them — zero in a
   thunderstorm, reduced 25% (rounded half-up) in a windstorm.
4. **Some of them buy.** See the demand model below.
5. **Sell.** Cups sold is the lesser of demand and what the inventory can
   make. Revenue is price × cups sold.
6. **Ice melts.** Any ice left at the end of the day is gone. Cups, lemons,
   and sugar carry forward.

> The chaos spec is `docs/chaos-generator.md`. Two of its five scenarios (the
> TikTok lemon cap and the bad review) are deferred — they need persistent
> state across days. `features/chaos-events.md` has the scope decision.

### Demand

Purchase rate depends on price, anchored at 25% for a $2.00 cup:

```
rate = 0.25 × (1 + ($2.00 − price) / $2.00),  clamped to [0, 0.5]
```

| Price | Rate |
| --- | --- |
| $0.00 | 50% (cap) |
| $1.00 | 37.5% |
| $2.00 | 25% |
| $3.00 | 12.5% |
| $4.00+ | 0% |

Demand is `passersby × rate`, rounded half-up once.

> Changed from the original draft's flat 25% regardless of price. With a flat
> rate the optimal strategy is to charge $999 a cup, which isn't a game. This
> is the simplest curve that makes pricing a real decision. The README covers
> what tuning it for genuine playability would involve.

## End of Game

The game ends when either:

- **Day 10 finishes.** Status `finished`.
- **The player is bankrupt.** Checked after each day: they can't make a single
  cup from what's in stock, *and* they can't afford to buy the missing
  ingredients for one. Status `bankrupt`.

Score is the cash on hand at the end, either way. Scores go to a leaderboard
that persists across reloads and ships with committed seed entries so it has
something to show on first run.

## Extra Fun

Stretch goals, only if time allows:

1. Chaos generator (lemon disease spoils part of the stock overnight)
2. Competition (someone opens a cheap lemonade or limeade stand nearby)
