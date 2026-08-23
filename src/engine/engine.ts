import {
  STARTING_CASH_CENTS,
  MAX_DAYS,
  ICE_CENTS_PER_LB,
  CUP_PACK_CENTS,
  CUP_PACK_SIZE,
  LEMON_CENTS_PER_LB,
  SUGAR_CENTS_PER_LB,
  ICE_UNITS_PER_LB,
  LEMONS_PER_LB,
  SUGAR_TBSP_PER_LB,
  RECIPE,
  REFERENCE_PRICE_CENTS,
  BASE_RATE,
  MAX_RATE,
} from './constants'
import type { DayResult, GameState, Inventory, Purchases } from './types'
import { roundHalfUp } from './money'
import { randomPassersby } from './rng'

export function newGame(playerName: string): GameState {
  return {
    playerName,
    day: 1,
    cashCents: STARTING_CASH_CENTS,
    inventory: { iceUnits: 0, cups: 0, lemons: 0, sugarTbsp: 0 },
    status: 'playing',
    history: [],
  }
}

export function purchaseCost(p: Purchases): number {
  return (
    p.iceLbs * ICE_CENTS_PER_LB +
    p.cupPacks * CUP_PACK_CENTS +
    p.lemonLbs * LEMON_CENTS_PER_LB +
    p.sugarLbs * SUGAR_CENTS_PER_LB
  )
}

export function validatePurchases(p: Purchases, cashCents: number): string | null {
  const amounts = [p.iceLbs, p.cupPacks, p.lemonLbs, p.sugarLbs]
  if (amounts.some((n) => !Number.isInteger(n) || n < 0)) {
    return 'Purchase quantities must be whole, non-negative numbers.'
  }
  const cost = purchaseCost(p)
  if (cost > cashCents) {
    return "You can't afford that."
  }
  return null
}

export function addPurchases(inv: Inventory, p: Purchases): Inventory {
  return {
    iceUnits: inv.iceUnits + p.iceLbs * ICE_UNITS_PER_LB,
    cups: inv.cups + p.cupPacks * CUP_PACK_SIZE,
    lemons: inv.lemons + p.lemonLbs * LEMONS_PER_LB,
    sugarTbsp: inv.sugarTbsp + p.sugarLbs * SUGAR_TBSP_PER_LB,
  }
}

// How many cups each ingredient could cover on its own. Every recipe amount is
// currently 1, so these match the raw inventory counts, but dividing by RECIPE
// keeps them right if a recipe amount ever changes.
export function cupsPerIngredient(inv: Inventory): Record<keyof Inventory, number> {
  return {
    lemons: Math.floor(inv.lemons / RECIPE.lemons),
    sugarTbsp: Math.floor(inv.sugarTbsp / RECIPE.sugarTbsp),
    iceUnits: Math.floor(inv.iceUnits / RECIPE.iceUnits),
    cups: Math.floor(inv.cups / RECIPE.cups),
  }
}

// You can only make as many cups as the scarcest ingredient allows.
export function cupsMakeable(inv: Inventory): number {
  const per = cupsPerIngredient(inv)
  return Math.min(per.lemons, per.sugarTbsp, per.iceUnits, per.cups)
}

// Fraction of passersby who buy a cup at the given price: BASE_RATE at the
// reference price, falling linearly to 0 at double the reference price,
// rising toward MAX_RATE as the price approaches free.
export function demandRate(priceCents: number): number {
  const rate = BASE_RATE * (1 + (REFERENCE_PRICE_CENTS - priceCents) / REFERENCE_PRICE_CENTS)
  return Math.min(MAX_RATE, Math.max(0, rate))
}

// Cheapest shopping trip that would let the player make one cup, given what
// they already have. Used for the bankruptcy check.
export function costToCoverOneCup(inv: Inventory): number {
  let cost = 0
  if (inv.lemons < RECIPE.lemons) cost += LEMON_CENTS_PER_LB
  if (inv.sugarTbsp < RECIPE.sugarTbsp) cost += SUGAR_CENTS_PER_LB
  if (inv.iceUnits < RECIPE.iceUnits) cost += ICE_CENTS_PER_LB
  if (inv.cups < RECIPE.cups) cost += CUP_PACK_CENTS
  return cost
}

// Runs one full day: buy supplies, sell to whoever shows up, melt the ice,
// then check whether the game is over. Pure — passersby is passed in so
// tests can pin the outcome; simulateDay supplies the random value.
export function runDay(
  state: GameState,
  purchases: Purchases,
  priceCents: number,
  passersby: number,
): GameState {
  if (state.status !== 'playing') {
    throw new Error('This game is over.')
  }
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new Error('Price must be a whole number of cents, zero or more.')
  }
  const problem = validatePurchases(purchases, state.cashCents)
  if (problem) {
    throw new Error(problem)
  }

  const spentCents = purchaseCost(purchases)
  let cash = state.cashCents - spentCents
  const stocked = addPurchases(state.inventory, purchases)

  const demand = roundHalfUp(passersby * demandRate(priceCents))
  const cupsSold = Math.min(demand, cupsMakeable(stocked))
  const revenueCents = cupsSold * priceCents
  cash += revenueCents

  const afterSelling: Inventory = {
    iceUnits: stocked.iceUnits - cupsSold * RECIPE.iceUnits,
    cups: stocked.cups - cupsSold * RECIPE.cups,
    lemons: stocked.lemons - cupsSold * RECIPE.lemons,
    sugarTbsp: stocked.sugarTbsp - cupsSold * RECIPE.sugarTbsp,
  }
  const iceMeltedUnits = afterSelling.iceUnits
  const endInventory: Inventory = { ...afterSelling, iceUnits: 0 }

  const result: DayResult = {
    day: state.day,
    priceCents,
    spentCents,
    passersby,
    demand,
    cupsSold,
    revenueCents,
    iceMeltedUnits,
    endCashCents: cash,
  }

  let status: GameState['status'] = 'playing'
  const broke = cupsMakeable(endInventory) === 0 && cash < costToCoverOneCup(endInventory)
  if (broke) {
    status = 'bankrupt'
  } else if (state.day >= MAX_DAYS) {
    status = 'finished'
  }

  return {
    ...state,
    day: state.day + 1,
    cashCents: cash,
    inventory: endInventory,
    status,
    history: [...state.history, result],
  }
}

export function simulateDay(
  state: GameState,
  purchases: Purchases,
  priceCents: number,
): GameState {
  return runDay(state, purchases, priceCents, randomPassersby())
}
