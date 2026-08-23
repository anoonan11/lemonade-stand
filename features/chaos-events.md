# Chaos events

Plan and tracking for the chaos generator in `docs/chaos-generator.md`: random
events that complicate a day, at most one per day. Checked off as it lands;
`CHANGELOG.md` records the why.

Status: **done for the three one-day events. TikTok trend and bad review
deferred — see Later.**

## Scope decision

The doc specifies five scenarios. We implemented the three **one-day** events
and deliberately skipped the two that need persistent state, to fit a 30–40
minute time box:

| Scenario | Odds | Decision |
| --- | --- | --- |
| Pestilence — stored lemons rot overnight | 15% | **Implementing** |
| Thunderstorm — nobody passes by | 20% | **Implementing** |
| Windstorm — 25% less traffic, half the sugar gone | 10% | **Implementing** |
| Lemon TikTok trend — 1 lb/day lemon cap for 3 days | 5% | **Not implemented** — needs a countdown in `GameState`, purchase-cap validation, and planner UI showing the cap before you shop |
| Bad review — half demand for the rest of the game | 1% | **Not implemented** — needs a persistent flag in `GameState` threaded through the demand calc and surfaced in the planner |

The two skipped scenarios are still wanted; they're the natural next unit of
work. Their odds are excluded from the roll for now, so ~55% of days are
normal instead of the doc's 49%.

Other calls made with Anne:

- Windstorm sugar is **gone for good**, not restored next morning — simpler,
  and "blown away" reads that way.
- One fixed description line per event, no LLM flavor-text pool. A real
  runtime LLM was ruled out: it needs an API key in the browser or a backend,
  and the odds table must stay deterministic and testable.
- Pestilence rots only the lemons already in the cooler; lemons bought that
  day arrive fresh (the doc says inventory rots "to start the day").
- `DayResult.passersby` records the traffic *after* chaos — it's who actually
  walked by, and the existing results copy keeps working.
- The chaos roll stays at the random edge like `randomPassersby`: `runDay`
  takes `chaos` as a parameter so tests pin outcomes; `simulateDay` rolls.

## Checklist

### Engine
- [x] `types.ts` — `ChaosEvent`; `DayResult` gains `chaos`, `lemonsRotted`,
      `sugarLostTbsp`
- [x] `constants.ts` — `CHAOS_ODDS`, `WIND_TRAFFIC_FACTOR`, `WIND_SUGAR_LOSS`
- [x] `rng.ts` — `rollChaos()`, one draw against cumulative odds
- [x] `engine.ts` — chaos effects in `runDay` (pestilence → shopping →
      windstorm sugar → traffic → demand as before); `simulateDay` passes
      `rollChaos()`
- [x] Tests: pestilence (carried lemons rot, bought survive), thunderstorm
      (zero traffic), windstorm (traffic and sugar, hand-computed), windstorm
      rounding (5 tbsp → 3 lost), normal day has null/0 chaos fields

### UI
- [x] `DayResults.tsx` — chaos banner (emoji + one line) at the top of the
      card when `result.chaos` is set
- [x] `styles.css` — `.chaos-banner`, louder than `.notice warn`

### Docs
- [x] `CHANGELOG.md` entry
- [x] `README.md` — short chaos paragraph with the odds
- [x] `docs/core-functionality.md` — chaos in the spec of record

## Later
- [ ] Lemon TikTok trend (5%)
- [ ] Bad review (1%)
