import type { DayResult } from '../engine/types'
import { formatCents } from '../engine/money'
import { formatIce, plural } from '../format'

interface Props {
  result: DayResult
  onNextDay?: () => void
}

export default function DayResults({ result, onNextDay }: Props) {
  const missed = result.demand - result.cupsSold
  const netCents = result.revenueCents - result.spentCents

  return (
    <section className="card" aria-live="polite">
      <div className="day-heading">
        <h2>Day {result.day} is done</h2>
        <p className={`net ${netCents < 0 ? 'negative' : 'positive'}`}>
          {netCents >= 0 ? '+' : '−'}
          {formatCents(Math.abs(netCents))}
        </p>
      </div>

      <p className="lede">
        {result.passersby === 0
          ? 'Not one person walked by. Some days are like that.'
          : `${plural(result.passersby, 'person', 'people')} walked past, and you sold ${plural(
              result.cupsSold,
              'cup',
            )} at ${formatCents(result.priceCents)}.`}
      </p>

      {missed > 0 && (
        <p className="notice warn">
          You ran out. {plural(missed, 'more person', 'more people')} wanted lemonade you
          couldn&rsquo;t make.
        </p>
      )}

      <dl className="stat-grid">
        <div>
          <dt>Passersby</dt>
          <dd>{result.passersby}</dd>
        </div>
        <div>
          <dt>Wanted a cup</dt>
          <dd>{result.demand}</dd>
        </div>
        <div>
          <dt>Cups sold</dt>
          <dd className="emphasis">{result.cupsSold}</dd>
        </div>
        <div>
          <dt>Spent on supplies</dt>
          <dd>{formatCents(result.spentCents)}</dd>
        </div>
        <div>
          <dt>Took in</dt>
          <dd>{formatCents(result.revenueCents)}</dd>
        </div>
        <div>
          <dt>Cash now</dt>
          <dd className="emphasis">{formatCents(result.endCashCents)}</dd>
        </div>
      </dl>

      {result.iceMeltedUnits > 0 && (
        <p className="muted small">{formatIce(result.iceMeltedUnits)} of ice melted overnight.</p>
      )}

      {onNextDay && (
        <button className="button primary" type="button" onClick={onNextDay} autoFocus>
          On to day {result.day + 1}
        </button>
      )}
    </section>
  )
}
