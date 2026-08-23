import type { LeaderboardEntry } from '../engine/types'
import { formatCents } from '../engine/money'
import { plural } from '../format'

interface Props {
  entries: LeaderboardEntry[]
  highlight: LeaderboardEntry | null
}

function shortDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Leaderboard({ entries, highlight }: Props) {
  return (
    <section className="card">
      <h2>Best stands</h2>
      {entries.length === 0 ? (
        <p className="muted">No finished seasons yet. Be the first.</p>
      ) : (
        <ol className="board-list">
          {entries.map((entry, index) => (
            <li
              key={`${entry.finishedAt}-${entry.playerName}`}
              className={`board-row ${entry === highlight ? 'is-you' : ''}`}
            >
              <span className="board-rank">{index + 1}</span>
              <span className="board-who">
                <span className="board-name">{entry.playerName}</span>
                <span className="board-meta">
                  {entry.outcome === 'bankrupt'
                    ? `went bust on day ${entry.daysSurvived}`
                    : `${plural(entry.daysSurvived, 'day')}`}
                  {shortDate(entry.finishedAt) && ` · ${shortDate(entry.finishedAt)}`}
                </span>
              </span>
              <span className="board-score">{formatCents(entry.scoreCents)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
