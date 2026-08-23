# Changelog

Running log of what was built and which decisions were made along the way,
newest first. Decisions get a short "why" so the reasoning survives the
commit.

## 2026-08-23

### UI — the game is playable end to end
- `NewGame`, `DayPlanner`, `DayResults`, `GameOver`, `Leaderboard`, and
  `Reference`, wired together in `App` with plain CSS. One page, sections
  rather than routing, no component library.
- `DayPlanner` previews the order cost, the cash left, and — the number that
  actually matters — how many cups the order lets you make, all recomputed
  from engine functions as you type. The price field shows the demand rate it
  implies.
- `Reference` reads its prices, recipe, and demand table straight from
  `constants.ts`, so tuning the game can't leave the on-screen rules stale.
- `storage.ts` persists the leaderboard in `localStorage`, guarded against
  private windows and full quotas, surfacing failures instead of swallowing
  them. `seedLeaderboard.ts` ships five committed entries.
- Added `parseDollarsToCents` as the input counterpart to `formatCents`, so
  typed dollars convert in exactly one place. It rounds half-up once, which is
  what stops `1.15` becoming 114 cents.
- Verified in the browser: a full ten-day season through to the game-over card
  and the leaderboard, a forced bankruptcy on day 1, and a reload confirming
  scores persist. Fixed one thing it caught — sugar was pluralised as "tbsps".
- Test count is now 38, including a hand-computed ten-day season.

### README
- Setup, commands, how to play, and the money and unit rules.
- Documents the demand model and — as the brief invited — what would need to
  change to make it genuinely playable: the linear curve's single solvable
  optimum, uniform foot traffic that can't be planned around, no memory
  between days, and near-costless over-buying.

### Docs brought in sync with the frontend-only plan
- Rewrote `CLAUDE.md` for the new stack: React + Vite + TypeScript, vitest,
  `localStorage`. Replaced the API-contract section with an engine contract,
  and inverted the old "no currency math in TypeScript" rule — the money
  rules now apply to the TypeScript engine, since that is where the math
  lives.
- Rewrote `docs/core-functionality.md` as the spec of record, documenting the
  unit conversions, the day sequence, the demand table, and the two places
  the spec departs from the original draft.
- Replaced the Python `.gitignore` (219 lines of `__pycache__`, wheels, mypy)
  with a Node/Vite one.
- Left `docs/instructions.md` untouched — it is the original assignment brief.

### Game engine
- `src/engine/` — pure TypeScript, no React imports:
  - `constants.ts` — every price, recipe amount, and demand parameter in one
    place, all tunable.
  - `money.ts` — `roundHalfUp` and `formatCents`. The only conversion from
    cents to dollars in the codebase.
  - `rng.ts` — `randomPassersby`, a uniform 0–100 draw.
  - `engine.ts` — `newGame`, `purchaseCost`, `validatePurchases`,
    `addPurchases`, `cupsMakeable`, `demandRate`, `costToCoverOneCup`,
    `runDay`, `simulateDay`.
- 30 vitest tests, every expected value hand-computed with the arithmetic
  shown in a comment. Covers the demand curve at both clamps, half-up
  rounding, ice melt, inventory- vs demand-limited days, and the bankruptcy
  boundary ($1.00 broke vs. exactly $13.00 surviving).

### Decisions
- **Dropped the FastAPI backend.** The game is a pure state machine; a server
  added a toolchain without adding anything to demonstrate. All logic moved
  to TypeScript.
- **`Math.random()` over a seeded PRNG.** A mulberry32 generator was written
  and then removed: determinism wasn't worth the comprehension cost on a
  project this size. Testability is preserved differently — `runDay` takes
  `passersby` as a parameter, so tests pin exact outcomes with no seeding
  machinery, and `simulateDay` is the one-line wrapper that supplies the
  random value.
- **Simplified the recipe** to 1 lemon, 1 tbsp sugar, 0.1 lb ice, 1 cup
  (152.5¢/cup). The drafted recipe cost ~$5.31/cup, which forces prices no
  player would pay.
- **Made demand price-sensitive** rather than the drafted flat 25%. A flat
  rate makes charging $999 optimal, which isn't a game.
- **Leaderboard in `localStorage`,** not a database. Persists across reloads,
  ships with committed seed entries.

### Project setup
- Scaffolded Vite `react-ts` at the repo root, Node pinned to 22 in `.nvmrc`,
  vitest wired up with `npm test` / `npm run test:watch`.
