import {
  CUP_PACK_CENTS,
  CUP_PACK_SIZE,
  ICE_CENTS_PER_LB,
  INGREDIENT_CENTS_PER_CUP,
  LEMONS_PER_LB,
  LEMON_CENTS_PER_LB,
  MAX_PASSERSBY,
  SUGAR_CENTS_PER_LB,
  SUGAR_TBSP_PER_LB,
} from '../engine/constants'
import { demandRate } from '../engine/engine'
import { formatCents } from '../engine/money'

const PRICE_POINTS = [100, 200, 300, 400]

export default function Reference() {
  return (
    <section className="card">
      <h2>The fine print</h2>

      <h3 className="subhead">Supplies</h3>
      <ul className="plain-list">
        <li>
          Ice — {formatCents(ICE_CENTS_PER_LB)} per lb
        </li>
        <li>
          Cups — {formatCents(CUP_PACK_CENTS)} per pack of {CUP_PACK_SIZE}
        </li>
        <li>
          Lemons — {formatCents(LEMON_CENTS_PER_LB)} per lb ({LEMONS_PER_LB} lemons)
        </li>
        <li>
          Sugar — {formatCents(SUGAR_CENTS_PER_LB)} per lb ({SUGAR_TBSP_PER_LB} tbsp)
        </li>
      </ul>

      <h3 className="subhead">One cup takes</h3>
      <p className="muted">
        1 lemon, 1 tbsp sugar, 0.1 lb ice, and a cup — about{' '}
        {formatCents(INGREDIENT_CENTS_PER_CUP)} of ingredients. Price above that or you lose money on
        every sale.
      </p>

      <h3 className="subhead">Who buys</h3>
      <p className="muted">
        Between 0 and {MAX_PASSERSBY} people wander past each day. How many stop depends on your
        price:
      </p>
      <table className="mini-table">
        <thead>
          <tr>
            <th scope="col">Price</th>
            <th scope="col">Buy</th>
          </tr>
        </thead>
        <tbody>
          {PRICE_POINTS.map((cents) => (
            <tr key={cents}>
              <td>{formatCents(cents)}</td>
              <td>{Math.round(demandRate(cents) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="muted small">
        Leftover ice melts overnight. Cups, lemons, and sugar keep.
      </p>
    </section>
  )
}
