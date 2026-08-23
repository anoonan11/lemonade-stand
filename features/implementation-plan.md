# Implementation plan

The build plan, checked off as it lands. `CHANGELOG.md` records what happened
and why; this file tracks what's left.

Status: **steps 1–5 done. The game is playable end to end. Step 6 is optional
extras.**

---

## 1. Scaffold — done

- [x] Vite `react-ts` at the repo root
- [x] Node pinned in `.nvmrc` (22)
- [x] vitest wired up (`npm test`, `npm run test:watch`)
- [x] `npm run build` green
- [x] Node `.gitignore` replacing the Python one

## 2. Game engine — done

Pure TypeScript in `src/engine/`, no React imports.

- [x] `constants.ts` — prices, unit conversions, recipe, demand parameters
- [x] `money.ts` — `roundHalfUp`, `formatCents` (display boundary),
      `parseDollarsToCents` (input boundary)
- [x] `rng.ts` — `randomPassersby`, uniform 0–100
- [x] `types.ts` — `Inventory`, `Purchases`, `GameState`, `DayResult`,
      `LeaderboardEntry`
- [x] `engine.ts` — `newGame`, `purchaseCost`, `validatePurchases`,
      `addPurchases`, `cupsMakeable`, `demandRate`, `costToCoverOneCup`,
      `runDay`, `simulateDay`
- [x] Ice melts at end of day; cups, lemons, sugar carry forward
- [x] Bankruptcy check: can't make a cup *and* can't afford the missing
      ingredients for one
- [x] Game ends after day 10

## 3. Tests — done for the engine

- [x] Money: half-up rounding, formatting, dollar parsing incl. the
      `1.15 * 100` floating-point trap
- [x] Purchase math and unit conversion
- [x] Demand curve at both clamps ($0 → 50%, $4+ → 0%)
- [x] Inventory-limited day and demand-limited day, hand-computed
- [x] Ice melt, bankruptcy boundary ($1.00 bust vs. exactly $13.00 surviving)
- [x] Validation: negative, fractional, unaffordable, finished game
- [x] Dollar parsing at the input boundary, including the `1.15 × 100`
      floating-point trap
- [x] A test that plays a full ten-day season through `runDay`

## 4. UI — done

- [x] `storage.ts` — leaderboard load/save, guarded, reports failures
- [x] `seedLeaderboard.ts` — committed entries so the board isn't empty
- [x] `format.ts` — ice in pounds, pluralisation
- [x] `NewGame` — name entry, starting conditions
- [x] `DayPlanner` — shopping inputs with live order cost, cash left, cups you
      can make, price entry with the demand it implies
- [x] `DayResults` — passersby, demand, cups sold, money in and out, sellouts,
      ice melted
- [x] `GameOver` — outcome, final score, season totals, play again
- [x] `Reference` — prices, recipe, demand table, all read from constants
- [x] `Leaderboard` — ranked list, highlight the run just finished
- [x] `App` — wire the phases together, hold game state, record scores
- [x] `styles.css` — plain CSS, responsive single page
- [x] Play a full game in the browser and confirm it holds together —
      ten days played through to the game-over card and the leaderboard, a
      forced bankruptcy on day 1, and a reload to confirm scores persist

## 5. Docs — done

- [x] `CLAUDE.md` rewritten for the frontend-only stack
- [x] `docs/core-functionality.md` as the spec of record
- [x] `CHANGELOG.md` with decisions and reasoning
- [x] This file
- [x] `README.md` — setup, run commands, how to play, how the demand model
      works and what tuning it would involve, TODOs

## 6. Stretch — not started

Only if time allows, in rough priority order.

- [ ] Chaos events — in progress, tracked in `features/chaos-events.md`
- [ ] Competition: a rival stand undercuts you for a few days
- [ ] Weather forecast that shifts foot traffic and gives the player something
      to plan against
- [ ] Bulk discounts or equipment upgrades to make spending decisions richer
- [ ] Persist the in-progress game, not just finished scores
