import type { GameState, LeaderboardEntry } from './engine/types'
import { SEED_LEADERBOARD } from './seedLeaderboard'

const STORAGE_KEY = 'lemonade-stand.leaderboard'
const MAX_ENTRIES = 10

// localStorage throws in private windows and when the quota is full, so every
// access is guarded and reports what went wrong rather than failing quietly.

export function loadLeaderboard(): { entries: LeaderboardEntry[]; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return { entries: SEED_LEADERBOARD, error: null }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return { entries: SEED_LEADERBOARD, error: 'Saved scores looked corrupted, so we started over.' }
    }
    return { entries: parsed as LeaderboardEntry[], error: null }
  } catch {
    return { entries: SEED_LEADERBOARD, error: "Couldn't read saved scores, so this list starts fresh." }
  }
}

function save(entries: LeaderboardEntry[]): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return null
  } catch {
    return "Couldn't save your score — it won't be here next time."
  }
}

export function rank(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.scoreCents - a.scoreCents).slice(0, MAX_ENTRIES)
}

export function recordScore(
  game: GameState,
  current: LeaderboardEntry[],
  finishedAt: string,
): { entries: LeaderboardEntry[]; entry: LeaderboardEntry; error: string | null } {
  const entry: LeaderboardEntry = {
    playerName: game.playerName,
    scoreCents: game.cashCents,
    daysSurvived: game.history.length,
    outcome: game.status === 'bankrupt' ? 'bankrupt' : 'finished',
    finishedAt,
  }
  const entries = rank([...current, entry])
  // A score outside the top ten still shows this run, it just isn't saved.
  const error = entries.includes(entry) ? save(entries) : null
  return { entries, entry, error }
}
