import { useState } from 'react'
import type { GameState, Inventory, Purchases } from '../engine/types'
import {
  addPurchases,
  cupsMakeable,
  cupsPerIngredient,
  demandRate,
  purchaseCost,
  validatePurchases,
} from '../engine/engine'
import { formatCents, parseDollarsToCents, roundHalfUp } from '../engine/money'
import {
  CUP_PACK_CENTS,
  CUP_PACK_SIZE,
  ICE_CENTS_PER_LB,
  LEMONS_PER_LB,
  LEMON_CENTS_PER_LB,
  MAX_DAYS,
  MAX_PASSERSBY,
  SUGAR_CENTS_PER_LB,
  SUGAR_TBSP_PER_LB,
} from '../engine/constants'
import { plural } from '../format'

interface Props {
  game: GameState
  onRunDay: (purchases: Purchases, priceCents: number) => void
  error: string | null
}

// Blank means "none". Anything unparseable becomes NaN and fails validation
// rather than silently counting as zero.
function quantity(text: string): number {
  const trimmed = text.trim()
  return trimmed === '' ? 0 : Number(trimmed)
}

// Inventory keys paired with the words used in the legend, in row order.
const SUPPLY_NAMES: Array<[keyof Inventory, string]> = [
  ['iceUnits', 'ice'],
  ['cups', 'cups'],
  ['lemons', 'lemons'],
  ['sugarTbsp', 'sugar'],
]

// "ice", "ice and cups", "ice, cups and lemons"
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

interface SupplyRowProps {
  label: string
  unit: string
  unitCents: number
  yields: string
  value: string
  onChange: (value: string) => void
  // Cups' worth of this ingredient now, and after the order. `after` is null
  // when the typed quantities don't parse, so there is nothing to project.
  have: number
  after: number | null
  // True when this ingredient is the one capping the day's cups. Marks the
  // whole row rather than the number, so the legend below has something to
  // point at.
  limiting: boolean
}

function SupplyRow({
  label,
  unit,
  unitCents,
  yields,
  value,
  onChange,
  have,
  after,
  limiting,
}: SupplyRowProps) {
  const count = quantity(value)
  const lineCents = Number.isInteger(count) && count >= 0 ? count * unitCents : null

  return (
    <div className={limiting ? 'supply-row limiting' : 'supply-row'}>
      <label className="supply-label" htmlFor={`buy-${label}`}>
        <span className="supply-name">{label}</span>
        <span className="supply-hint">
          {formatCents(unitCents)} / {unit} &middot; {yields}
        </span>
      </label>
      <input
        id={`buy-${label}`}
        className="number-input"
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {/* Three fixed cells rather than a flex run, so the arrows and both
          numbers line up down the column whatever their digit count. */}
      <span className="supply-stock">
        <span className="stock-have">{have}</span>
        <span className="stock-arrow" aria-hidden="true">
          &rarr;
        </span>
        <span className="stock-after">{after === null ? '—' : after}</span>
      </span>
      <span className="supply-cost">{lineCents === null ? '—' : formatCents(lineCents)}</span>
    </div>
  )
}

export default function DayPlanner({ game, onRunDay, error }: Props) {
  const previousPrice = game.history[game.history.length - 1]?.priceCents
  const [ice, setIce] = useState('0')
  const [packs, setPacks] = useState('0')
  const [lemons, setLemons] = useState('0')
  const [sugar, setSugar] = useState('0')
  // formatCents is the one cents-to-dollars conversion; the input just omits the sign.
  const [price, setPrice] = useState(
    previousPrice === undefined ? '2.00' : formatCents(previousPrice).replace('$', ''),
  )

  const purchases: Purchases = {
    iceLbs: quantity(ice),
    cupPacks: quantity(packs),
    lemonLbs: quantity(lemons),
    sugarLbs: quantity(sugar),
  }

  const amounts = [purchases.iceLbs, purchases.cupPacks, purchases.lemonLbs, purchases.sugarLbs]
  const amountsUsable = amounts.every((n) => Number.isInteger(n) && n >= 0)
  const purchaseError = validatePurchases(purchases, game.cashCents)
  const orderCents = amountsUsable ? purchaseCost(purchases) : 0
  const cashAfterOrder = game.cashCents - orderCents
  const stocked = amountsUsable ? addPurchases(game.inventory, purchases) : game.inventory
  const makeable = cupsMakeable(stocked)

  // Each row shows cups' worth now and after the order. Because every recipe
  // amount is 1, these are directly comparable, and `makeable` is the smallest
  // of the "after" numbers — the row that ties it is the bottleneck.
  const have = cupsPerIngredient(game.inventory)
  const after = amountsUsable ? cupsPerIngredient(stocked) : null
  // Nothing is worth flagging when the order makes no cups at all — every row
  // would tie at zero. The "can't make a single cup" warning covers that case.
  const isLimiting = (cupsAfter: number | undefined) =>
    cupsAfter !== undefined && makeable > 0 && cupsAfter === makeable

  // Names of whatever ties for the limit, for the legend under the list. Ties
  // are real — two ingredients can cap the day equally — so this is a list.
  const limitingNames = SUPPLY_NAMES.filter(([key]) => isLimiting(after?.[key])).map(
    ([, name]) => name,
  )

  const priceCents = parseDollarsToCents(price)
  const priceError = priceCents === null ? 'Enter a price like 2.00.' : null
  const busiestDay = priceCents === null ? 0 : roundHalfUp(MAX_PASSERSBY * demandRate(priceCents))

  const blocked = purchaseError !== null || priceError !== null

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault()
        if (!blocked && priceCents !== null) onRunDay(purchases, priceCents)
      }}
    >
      <div className="day-heading">
        <h2>
          Day {game.day} <span className="of-days">of {MAX_DAYS}</span>
        </h2>
        <p className="cash-on-hand">{formatCents(game.cashCents)}</p>
      </div>

      <h3 className="subhead">Go shopping</h3>
      <div className="supply-head">
        <span>Supply</span>
        <span className="head-center">Buy</span>
        <span className="head-right">
          <span className="head-tip">
            Possible cups
            {/* type="button" so it never submits the form it sits inside. */}
            <button
              type="button"
              className="tip-button"
              aria-label="What possible cups means"
            >
              i
            </button>
            <span className="tip-bubble" role="tooltip">
              Counts what&rsquo;s already in your cooler <em>plus</em> what you&rsquo;re
              buying &mdash; how many cups that one ingredient could cover on its own. You
              can only make as many as the <em>lowest</em> row. Ice melts overnight, so it
              starts every day at zero.
            </span>
          </span>
          <span className="head-sub">now &rarr; after purchase</span>
        </span>
        <span className="head-right">Cost</span>
      </div>
      <div className="supply-list">
        <SupplyRow
          label="Ice"
          unit="lb"
          unitCents={ICE_CENTS_PER_LB}
          yields="10 cups"
          value={ice}
          onChange={setIce}
          have={have.iceUnits}
          after={after === null ? null : after.iceUnits}
          limiting={isLimiting(after?.iceUnits)}
        />
        <SupplyRow
          label="Cups"
          unit="pack"
          unitCents={CUP_PACK_CENTS}
          yields={`${CUP_PACK_SIZE} cups`}
          value={packs}
          onChange={setPacks}
          have={have.cups}
          after={after === null ? null : after.cups}
          limiting={isLimiting(after?.cups)}
        />
        <SupplyRow
          label="Lemons"
          unit="lb"
          unitCents={LEMON_CENTS_PER_LB}
          yields={`${LEMONS_PER_LB} cups`}
          value={lemons}
          onChange={setLemons}
          have={have.lemons}
          after={after === null ? null : after.lemons}
          limiting={isLimiting(after?.lemons)}
        />
        <SupplyRow
          label="Sugar"
          unit="lb"
          unitCents={SUGAR_CENTS_PER_LB}
          yields={`${SUGAR_TBSP_PER_LB} cups`}
          value={sugar}
          onChange={setSugar}
          have={have.sugarTbsp}
          after={after === null ? null : after.sugarTbsp}
          limiting={isLimiting(after?.sugarTbsp)}
        />
      </div>

      {limitingNames.length > 0 && (
        <p className="limit-note">
          <span className="limit-swatch" aria-hidden="true" />
          <span>
            {limitingNames.length === 1 ? 'The outlined row is' : 'The outlined rows are'} your
            limit &mdash; you&rsquo;ll run out of{' '}
            {joinNames(limitingNames)} first, capping the day at {plural(makeable, 'cup')}.
            Buy more to sell more.
          </span>
        </p>
      )}

      <dl className="totals">
        <div>
          <dt>Order</dt>
          <dd>{amountsUsable ? formatCents(orderCents) : '—'}</dd>
        </div>
        <div>
          <dt>Cash left</dt>
          <dd className={cashAfterOrder < 0 ? 'negative' : undefined}>
            {amountsUsable ? formatCents(cashAfterOrder) : '—'}
          </dd>
        </div>
        <div>
          <dt>Cups you can make</dt>
          <dd className="emphasis">{amountsUsable ? makeable : '—'}</dd>
        </div>
      </dl>

      <h3 className="subhead">Set your price</h3>
      <div className="price-field">
        <label className="field-label" htmlFor="price">
          Per cup
        </label>
        <div className="price-input-wrap">
          <span className="price-prefix">$</span>
          <input
            id="price"
            className="text-input price-input"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>
      {priceCents !== null && (
        <p className="muted small">
          {Math.round(demandRate(priceCents) * 100)}% of passersby will buy at this price — up to{' '}
          {plural(busiestDay, 'cup')} on the busiest possible day.
        </p>
      )}

      {makeable === 0 && amountsUsable && (
        <p className="notice warn">
          You can&rsquo;t make a single cup with this order. You&rsquo;ll sell nothing today.
        </p>
      )}
      {purchaseError && <p className="notice error">{purchaseError}</p>}
      {priceError && <p className="notice error">{priceError}</p>}
      {error && <p className="notice error">{error}</p>}

      <button className="button primary" type="submit" disabled={blocked}>
        Open for business
      </button>
    </form>
  )
}
