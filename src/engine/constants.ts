import { roundHalfUp } from './money'

// All game-balance numbers live here. Money is integer cents; inventory is
// integer base units (ice in tenths of a lb, sugar in tbsp).

export const STARTING_CASH_CENTS = 10000
export const MAX_DAYS = 10

// Purchase prices, as sold
export const ICE_CENTS_PER_LB = 100
export const CUP_PACK_CENTS = 500
export const CUP_PACK_SIZE = 100
export const LEMON_CENTS_PER_LB = 500
export const SUGAR_CENTS_PER_LB = 200

// Unit conversions from purchase units to inventory units
export const ICE_UNITS_PER_LB = 10 // 1 unit = 0.1 lb
export const LEMONS_PER_LB = 4
export const SUGAR_TBSP_PER_LB = 16

// Recipe for one cup of lemonade, in inventory units
export const RECIPE = {
  lemons: 1,
  sugarTbsp: 1,
  iceUnits: 1, // 0.1 lb
  cups: 1,
} as const

// Demand model: purchase rate is BASE_RATE at REFERENCE_PRICE_CENTS and falls
// linearly to 0 at twice the reference price. Cheaper lemonade raises the
// rate, capped at MAX_RATE.
export const REFERENCE_PRICE_CENTS = 200
export const BASE_RATE = 0.25
export const MAX_RATE = 0.5
export const MAX_PASSERSBY = 100

// Chaos odds, rolled once per day. At most one event can happen; the
// remaining 55% is a normal day.
export const CHAOS_ODDS = {
  pestilence: 0.15,
  thunderstorm: 0.2,
  windstorm: 0.1,
} as const

// Windstorm effects
export const WIND_TRAFFIC_FACTOR = 0.75 // 25% fewer passersby
export const WIND_SUGAR_LOSS = 0.5 // half the sugar blows away

// Roughly what the ingredients for one cup cost, for the player's reference.
// Display only — a single cup works out to 152.5¢, which isn't a whole number
// of cents, so this is rounded once and shown with a "≈". Nothing in the
// simulation uses it: real spending comes from whole bags and packs.
export const INGREDIENT_CENTS_PER_CUP = roundHalfUp(
  (LEMON_CENTS_PER_LB / LEMONS_PER_LB) * RECIPE.lemons +
    (SUGAR_CENTS_PER_LB / SUGAR_TBSP_PER_LB) * RECIPE.sugarTbsp +
    (ICE_CENTS_PER_LB / ICE_UNITS_PER_LB) * RECIPE.iceUnits +
    (CUP_PACK_CENTS / CUP_PACK_SIZE) * RECIPE.cups,
)
