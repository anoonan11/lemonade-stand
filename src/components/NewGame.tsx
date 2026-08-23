import { useState } from 'react'
import { formatCents } from '../engine/money'
import { MAX_DAYS, STARTING_CASH_CENTS } from '../engine/constants'

interface Props {
  onStart: (playerName: string) => void
}

export default function NewGame({ onStart }: Props) {
  const [name, setName] = useState('')
  const trimmed = name.trim()

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed) onStart(trimmed)
      }}
    >
      <h2>Open your stand</h2>
      <p className="lede">
        You have {formatCents(STARTING_CASH_CENTS)} and {MAX_DAYS} days. Buy supplies each morning,
        pick a price, and see who shows up. Whatever cash you finish with is your score.
      </p>

      <label className="field">
        <span className="field-label">Who&rsquo;s running this stand?</span>
        <input
          className="text-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          placeholder="Your name"
          autoFocus
        />
      </label>

      <button className="button primary" type="submit" disabled={!trimmed}>
        Start the season
      </button>
    </form>
  )
}
