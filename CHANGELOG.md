# Changelog

Running log of what was built and which decisions were made along the way,
newest first. Decisions get a short "why" so the reasoning survives the
commit.

## 2026-08-23

### Chaos events — pestilence, thunderstorm, windstorm
- Three of the five scenarios from `docs/chaos-generator.md`: pestilence
  (15%), thunderstorm (20%), windstorm (10%), at most one per day. The TikTok
  lemon cap and the bad review are deferred — both need persistent state in
  `GameState` and planner UI, which didn't fit the time box. The full scope
  decision lives in `features/chaos-events.md`.
- Ruled out a runtime LLM "chaos agent": it would need an API key in the
  browser or a backend, and the odds table has to stay deterministic and
  testable. If we ever want generative flavor, it'll be a committed pool of
  pre-written variants, not a live call.
- Chaos follows the same randomness-at-the-edge pattern as foot traffic:
  `runDay` takes the event as a parameter so tests pin exact outcomes, and
  `simulateDay` supplies `rollChaos()` — one draw against cumulative odds in
  `CHAOS_ODDS`, and still the only `Math.random()` file.
- Pestilence rots only the lemons carried in from yesterday; lemons bought
  that day survive. The doc says inventory rots "to start the day", and the
  order arrives fresh.
- Windstorm sugar is gone for good rather than restored next morning —
  simpler, and "blown away" reads that way. The loss applies after shopping,
  today's bag included, rounded half-up.
- `DayResult.passersby` now records traffic *after* chaos — it's who actually
  walked by, so the existing results copy ("Not one person walked by") keeps
  working under a thunderstorm.
- `DayResult` gains `chaos`, `lemonsRotted`, and `sugarLostTbsp`, which feed
  a banner at the top of the results card: emoji, event name, and what it
  did. The words live in `DayResults`; the engine only reports numbers.
- Four new engine tests, hand-computed: pestilence sparing the day's
  shopping, thunderstorm zeroing a 60-person day, a windstorm day end to end,
  and the half-up rounding on an odd sugar count.

### Feature plans move to `features/`
- Each feature now gets a plan file in `features/`, written up front and
  checked off as work lands, including what was deliberately not built and
  why. `CHANGELOG.md` stays the record of what happened; `features/` is the
  record of what's planned and deferred. Convention added to `CLAUDE.md`.

### DayPlanner — per-supply stock, inline with the shopping rows
- Each shopping row now shows what you have and what you'll have after the
  order, in a "Possible cups" column between the quantity input and the line
  cost, so the effect of a purchase is visible on the row you're typing into.
- Numbers are in *cups' worth* rather than raw units. Every `RECIPE` amount is
  1, so an inventory count already equals the cups that ingredient covers —
  which means all four rows share one unit and "Cups you can make" is visibly
  the smallest of them. Considered showing natural units (pounds, tablespoons)
  instead: rejected because the four numbers stop being comparable, the
  bottleneck stops being obvious, and ice needs a tenths-to-pounds conversion
  the rest of the app doesn't do.
- Added a Supply / Buy / Possible cups / Cost header row above the list, on the
  same grid template as the rows so the columns line up. First pass shipped
  without it and the numbers read as unexplained — "830 → 830" next to a dollar
  amount gives no clue it's cups.
- The column went "Makes" → "Potential cups" → "Possible cups", with
  "now → after purchase" as a second header line. "Makes" read as a verb about
  the order alone when the number is really a total that includes the cooler;
  naming the two sides in the header itself is what actually fixes that, since
  it explains the arrow at the point you're looking at it.
- The explanation moved off the page and into a hover/focus tooltip on the
  header. It was a four-line paragraph pushing the whole form down to explain a
  column most players understand after one day. The `i` button is a real
  `<button type="button">` so keyboard focus opens it too, and it can't submit
  the form it sits inside.
- Restored the arrow on every row. It was hidden on rows the order doesn't
  change, which cut clutter but made the column inconsistent — a bare number
  gave no clue it was the same "now → after" reading as its neighbours.
- The three cells are a `1fr auto 1fr` grid rather than a flex run, so the
  arrows and both columns of digits line up down the list no matter how many
  digits each value has.
- Column widths shuffled to fit the wider header: buy 92px → 78px, possible cups
  96px → 124px, cost 82px → 76px, leaving the supply label enough room not to
  wrap.
- The row that caps the day is outlined in the accent colour. Marking the row
  rather than the number went through two earlier attempts — an underline, then
  an underline plus colour on the "after" value — both of which read as emphasis
  on a number rather than "this ingredient is the problem". The outline is an
  outer ring (`box-shadow`) on top of the existing 1px border, not a thicker
  border, so the row doesn't shift a pixel when it becomes the limit.
- A legend under the list names the culprit: "The outlined row is your limit —
  you'll run out of lemons first, capping the day at 12 cups." A swatch matching
  the outline sits beside it, so the colour is decoded rather than guessed.
- Ties mark every tied row, which is accurate — they're all equally limiting —
  and the legend switches to "rows are" and lists both. Phrased as "you'll run
  out of X" rather than "X runs out" specifically to dodge verb agreement: the
  supply names mix mass nouns (ice, sugar) with plurals (cups, lemons), and no
  single conjugation fits both.
- The marker is suppressed entirely when the order makes zero cups, since every
  row would tie at 0 and the "can't make a single cup" warning already says it.
- Added `cupsPerIngredient` to the engine and rewrote `cupsMakeable` as the min
  of it. The per-ingredient division was going to be needed twice otherwise,
  and components can't hold that rule. Divides by `RECIPE` rather than reading
  the count directly, so it stays correct if a recipe amount ever stops being 1.
- Dropped the "In the cooler" summary line. The per-row "now" column says the
  same thing more precisely; the note that ice melts overnight lives in the
  tooltip, since that rule isn't visible from the numbers alone.
- Column headers top-align, so every label sits on the first line and the
  "now → after purchase" caption hangs below it. Bottom-aligning them dropped
  Supply, Buy and Cost to the caption's baseline, leaving the header row looking
  staggered.
- Two tests for `cupsPerIngredient`: one checking each ingredient's coverage,
  one checking that its smallest entry equals `cupsMakeable`.

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
- Fixed sugar being pluralised as "tbsps" — `plural` now takes an explicit
  plural form for units that don't take an -s.
- Tests cover the money math, the day simulation, and a hand-computed ten-day
  season played end to end through `runDay`.

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
