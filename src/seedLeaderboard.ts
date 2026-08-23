import type { LeaderboardEntry } from './engine/types'

// Committed so the leaderboard has something to beat on a fresh clone.
export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    playerName: 'Squeeze Louise',
    scoreCents: 21840,
    daysSurvived: 10,
    outcome: 'finished',
    finishedAt: '2026-07-14T16:20:00.000Z',
  },
  {
    playerName: 'Pulp Fiction',
    scoreCents: 18325,
    daysSurvived: 10,
    outcome: 'finished',
    finishedAt: '2026-07-28T14:05:00.000Z',
  },
  {
    playerName: 'Zest Coast',
    scoreCents: 15070,
    daysSurvived: 10,
    outcome: 'finished',
    finishedAt: '2026-08-02T18:45:00.000Z',
  },
  {
    playerName: 'Sour Grapes',
    scoreCents: 9615,
    daysSurvived: 10,
    outcome: 'finished',
    finishedAt: '2026-08-09T13:30:00.000Z',
  },
  {
    playerName: 'Ice Ice Maybe',
    scoreCents: 240,
    daysSurvived: 4,
    outcome: 'bankrupt',
    finishedAt: '2026-08-15T11:10:00.000Z',
  },
]
