# Project conventions

## Stack
- React + Vite + TypeScript. Frontend only — no backend, no server beyond Vite.
- Storage: `localStorage` for the leaderboard. No external services, no Docker.
- Testing: vitest
- Keep the dependency list short. Ask before adding anything not listed here.

## Money and numeric rules
- All monetary values stored as integer cents. Never floats.
- Format to dollars only at the display boundary — `formatCents` in `src/engine/money.ts` is the only place cents become dollars.
- Rounding: half-up, applied once at the final step, never mid-calculation. Use `roundHalfUp`.
- Inventory is integer base units too: ice in tenths of a pound, sugar in tablespoons.

## Structure
- `src/engine/` holds the game logic: pure functions over immutable state, no React imports, testable on its own
- `src/components/` holds the UI. Components call engine functions directly and render what comes back.
- All game-balance numbers (prices, recipe, demand curve) live in `src/engine/constants.ts`. Nothing hardcoded at a call site.
- Types live in `src/engine/types.ts`
- Components stay thin: read state, call an engine function, render the result. No game rules in components.

## Engine contract
- The engine owns all calculation. Components render what they receive.
- State transitions return a new `GameState`; never mutate the one passed in.
- Randomness stays at the edge. `runDay` takes `passersby` as a parameter so it is exactly testable; `simulateDay` is the thin wrapper that supplies the random value.
- Invalid input throws with a human-readable message, or returns one from a `validate*` function. No silent failures.

## Frontend
- Plain CSS. No component library.
- Local component state. No Redux, no React Query, no router.
- One page. Sections rather than routing.
- Every action that can fail shows the error. Wrap `localStorage` access in try/catch.

## Testing
- vitest, plain `expect`
- Cover the money math, the day simulation, and edge cases. Skip trivial getters.
- Every test uses a hand-computed expected value, not one derived from running the code. Show the arithmetic in a comment.
- At least one test plays a full day end to end through `runDay`

## Runnability
- Must work from a fresh clone with `npm install && npm run dev`
- Production check: `npm run build && npm run preview`
- Pin the Node version in `.nvmrc`
- Seed data committed to the repo. The leaderboard has something to show on first run.
- README covers setup, the run command, how to play, and how the demand model works

## Feature plans
- Every feature gets a plan file in `features/`, written before implementation
  and updated as the work lands — a checklist checked off as we go.
- The plan records scope decisions, including what we decided *not* to
  implement and why. Cut scope is part of the record, not silently dropped.
- `CHANGELOG.md` records what happened and why; `features/` tracks what's
  planned, in flight, and deferred.

## Changelog
- `CHANGELOG.md` at the repo root, newest entries first, grouped by date.
- Add an entry for each unit of work: what changed, and for anything that was a
  judgment call, a one-line why. Decisions that were reversed stay in the log
  with the reason — the reasoning is the point, not just the diff.
- Update it as part of the work, not in a batch at the end.

## Working style
- Small, verifiable steps. Run the tests after each unit of work.
- Prefer the readable implementation over the clever or maximally robust one. I want to be able to read and explain every part of the game logic.
- Explain anything non-obvious briefly, in place, rather than assuming I'll infer it.
- Don't refactor beyond what I asked for
- No speculative abstraction for requirements that don't exist yet
- When something is ambiguous, ask rather than assume
