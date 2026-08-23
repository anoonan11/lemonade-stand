import type { ChaosEvent, DayResult } from '../engine/types'
import { formatCents } from '../engine/money'
import { formatIce, plural } from '../format'

interface Props {
  result: DayResult
  onNextDay?: () => void
}

// One banner per chaos event: an emoji, a name, and what it did. The
// mechanics live in the engine; only the words live here.
function chaosBanner(result: DayResult): { emoji: string; title: string; text: string } | null {
  const banners: Record<ChaosEvent, { emoji: string; title: string; text: string }> = {
    pestilence: {
      emoji: '🐛',
      title: 'Pestilence!',
      text: `Bugs got into the cooler overnight — ${plural(
        result.lemonsRotted,
        'lemon',
      )} rotted before you opened.`,
    },
    thunderstorm: {
      emoji: '⛈️',
      title: 'Thunderstorm!',
      text: 'A storm parked over the stand all day. Nobody came out.',
    },
    windstorm: {
      emoji: '💨',
      title: 'Windstorm!',
      text: `Gusts kept a quarter of the crowd home and blew ${plural(
        result.sugarLostTbsp,
        'tbsp',
        'tbsp',
      )} of sugar clean away.`,
    },
  }
  return result.chaos === null ? null : banners[result.chaos]
}

export default function DayResults({ result, onNextDay }: Props) {
  const missed = result.demand - result.cupsSold
  const netCents = result.revenueCents - result.spentCents
  const chaos = chaosBanner(result)

  return (
    <section className="card" aria-live="polite">
      {chaos && (
        <p className="chaos-banner" role="alert">
          <span className="chaos-emoji" aria-hidden="true">
            {chaos.emoji}
          </span>
          <span>
            <strong>{chaos.title}</strong> {chaos.text}
          </span>
        </p>
      )}

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
