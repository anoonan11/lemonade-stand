import { useState } from 'react'
import type { GameState, Purchases } from '../engine/types'
import {
  addPurchases,
  cupsMakeable,
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

interface SupplyRowProps {
  label: string
  unit: string
  unitCents: number
  yields: string
  value: string
  onChange: (value: string) => void
}

function SupplyRow({ label, unit, unitCents, yields, value, onChange }: SupplyRowProps) {
  const count = quantity(value)
  const lineCents = Number.isInteger(count) && count >= 0 ? count * unitCents : null

  return (
    <div className="supply-row">
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

  const priceCents = parseDollarsToCents(price)
  const priceError = priceCents === null ? 'Enter a price like 2.00.' : null
  const busiestDay = priceCents === null ? 0 : roundHalfUp(MAX_PASSERSBY * demandRate(priceCents))

  const carried = game.inventory
  const hasCarryover = carried.cups > 0 || carried.lemons > 0 || carried.sugarTbsp > 0
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

      <p className="muted">
        {hasCarryover ? (
          <>
            In the cooler: {plural(carried.cups, 'cup')}, {plural(carried.lemons, 'lemon')},{' '}
            {plural(carried.sugarTbsp, 'tbsp', 'tbsp')} of sugar. The ice melted overnight.
          </>
        ) : (
          <>Nothing in the cooler. Everything you sell today, you buy this morning.</>
        )}
      </p>

      <h3 className="subhead">Go shopping</h3>
      <div className="supply-list">
        <SupplyRow
          label="Ice"
          unit="lb"
          unitCents={ICE_CENTS_PER_LB}
          yields="10 cups"
          value={ice}
          onChange={setIce}
        />
        <SupplyRow
          label="Cups"
          unit="pack"
          unitCents={CUP_PACK_CENTS}
          yields={`${CUP_PACK_SIZE} cups`}
          value={packs}
          onChange={setPacks}
        />
        <SupplyRow
          label="Lemons"
          unit="lb"
          unitCents={LEMON_CENTS_PER_LB}
          yields={`${LEMONS_PER_LB} cups`}
          value={lemons}
          onChange={setLemons}
        />
        <SupplyRow
          label="Sugar"
          unit="lb"
          unitCents={SUGAR_CENTS_PER_LB}
          yields={`${SUGAR_TBSP_PER_LB} cups`}
          value={sugar}
          onChange={setSugar}
        />
      </div>

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
