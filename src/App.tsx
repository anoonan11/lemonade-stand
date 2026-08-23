import { useState } from 'react'
import type { GameState, LeaderboardEntry, Purchases } from './engine/types'
import { newGame, simulateDay } from './engine/engine'
import { loadLeaderboard, recordScore } from './storage'
import NewGame from './components/NewGame'
import DayPlanner from './components/DayPlanner'
import DayResults from './components/DayResults'
import GameOver from './components/GameOver'
import Leaderboard from './components/Leaderboard'
import Reference from './components/Reference'

export default function App() {
  const [saved] = useState(loadLeaderboard)
  const [entries, setEntries] = useState<LeaderboardEntry[]>(saved.entries)
  const [storageError, setStorageError] = useState<string | null>(saved.error)
  const [game, setGame] = useState<GameState | null>(null)
  const [showingResults, setShowingResults] = useState(false)
  const [justRecorded, setJustRecorded] = useState<LeaderboardEntry | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const lastResult = game && game.history.length > 0 ? game.history[game.history.length - 1] : null

  function handleStart(playerName: string) {
    setGame(newGame(playerName))
    setShowingResults(false)
    setJustRecorded(null)
    setActionError(null)
  }

  function handleRunDay(purchases: Purchases, priceCents: number) {
    if (!game) return
    try {
      const next = simulateDay(game, purchases, priceCents)
      setGame(next)
      setShowingResults(true)
      setActionError(null)
      if (next.status !== 'playing') {
        const recorded = recordScore(next, entries, new Date().toISOString())
        setEntries(recorded.entries)
        setJustRecorded(recorded.entry)
        setStorageError(recorded.error)
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "That day couldn't be run.")
    }
  }

  let panel
  if (!game) {
    panel = <NewGame onStart={handleStart} />
  } else if (game.status !== 'playing' && lastResult) {
    panel = (
      <>
        <DayResults result={lastResult} />
        <GameOver game={game} onPlayAgain={() => handleStart(game.playerName)} />
      </>
    )
  } else if (showingResults && lastResult) {
    panel = <DayResults result={lastResult} onNextDay={() => setShowingResults(false)} />
  } else {
    panel = (
      <DayPlanner key={game.day} game={game} onRunDay={handleRunDay} error={actionError} />
    )
  }

  return (
    <div className="shell">
      <header className="masthead">
        <h1>
          <span aria-hidden="true">🍋</span> Lemonade Stand
        </h1>
        <p className="tagline">
          {game ? `${game.playerName}'s stand` : 'Ten days. One hundred dollars. Good luck.'}
        </p>
      </header>

      {storageError && (
        <p className="notice warn" role="status">
          {storageError}
        </p>
      )}

      <div className="layout">
        <main>{panel}</main>
        <aside>
          <Leaderboard entries={entries} highlight={justRecorded} />
          <Reference />
        </aside>
      </div>
    </div>
  )
}
