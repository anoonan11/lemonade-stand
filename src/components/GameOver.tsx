import type { GameState } from '../engine/types'
import { formatCents } from '../engine/money'
import { MAX_DAYS, STARTING_CASH_CENTS } from '../engine/constants'
import { plural } from '../format'

interface Props {
  game: GameState
  onPlayAgain: () => void
}

export default function GameOver({ game, onPlayAgain }: Props) {
  const bankrupt = game.status === 'bankrupt'
  const cupsSold = game.history.reduce((sum, day) => sum + day.cupsSold, 0)
  const revenueCents = game.history.reduce((sum, day) => sum + day.revenueCents, 0)
  const spentCents = game.history.reduce((sum, day) => sum + day.spentCents, 0)
  const profitCents = game.cashCents - STARTING_CASH_CENTS

  return (
    <section className={`card outcome ${bankrupt ? 'bust' : 'win'}`}>
      <h2>{bankrupt ? `Bankrupt on day ${game.history.length}` : `${MAX_DAYS} days, done`}</h2>

      <p className="lede">
        {bankrupt
          ? "You're out of lemonade and out of money to buy more. That's the game."
          : `You started with ${formatCents(STARTING_CASH_CENTS)} and finished with ${formatCents(
              game.cashCents,
            )}.`}
      </p>

      <p className="final-score">
        <span className="score-label">Final score</span>
        <span className="score-value">{formatCents(game.cashCents)}</span>
      </p>

      <dl className="stat-grid">
        <div>
          <dt>Days run</dt>
          <dd>{game.history.length}</dd>
        </div>
        <div>
          <dt>Cups sold</dt>
          <dd>{cupsSold}</dd>
        </div>
        <div>
          <dt>Total sales</dt>
          <dd>{formatCents(revenueCents)}</dd>
        </div>
        <div>
          <dt>Spent on supplies</dt>
          <dd>{formatCents(spentCents)}</dd>
        </div>
        <div>
          <dt>{profitCents < 0 ? 'Lost' : 'Made'}</dt>
          <dd className={profitCents < 0 ? 'negative' : 'positive'}>
            {formatCents(Math.abs(profitCents))}
          </dd>
        </div>
        <div>
          <dt>Best day</dt>
          <dd>{plural(Math.max(0, ...game.history.map((day) => day.cupsSold)), 'cup')}</dd>
        </div>
      </dl>

      <button className="button primary" type="button" onClick={onPlayAgain} autoFocus>
        Run it again
      </button>
    </section>
  )
}
