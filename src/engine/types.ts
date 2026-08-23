export interface Inventory {
  iceUnits: number // tenths of a lb
  cups: number
  lemons: number
  sugarTbsp: number
}

export interface Purchases {
  iceLbs: number
  cupPacks: number
  lemonLbs: number
  sugarLbs: number
}

export type GameStatus = 'playing' | 'finished' | 'bankrupt'

// A chaos event that can strike a day. At most one per day; most days none.
export type ChaosEvent = 'pestilence' | 'thunderstorm' | 'windstorm'

export interface DayResult {
  day: number
  priceCents: number
  spentCents: number
  // The people who actually walked by, after any chaos effect on traffic.
  passersby: number
  demand: number
  cupsSold: number
  revenueCents: number
  iceMeltedUnits: number
  endCashCents: number
  chaos: ChaosEvent | null
  lemonsRotted: number // pestilence only, otherwise 0
  sugarLostTbsp: number // windstorm only, otherwise 0
}

export interface GameState {
  playerName: string
  day: number // next day to play, 1-based
  cashCents: number
  inventory: Inventory
  status: GameStatus
  history: DayResult[]
}

export interface LeaderboardEntry {
  playerName: string
  scoreCents: number
  daysSurvived: number
  outcome: 'finished' | 'bankrupt'
  finishedAt: string // ISO date
}
