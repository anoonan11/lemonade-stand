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

export interface DayResult {
  day: number
  priceCents: number
  spentCents: number
  passersby: number
  demand: number
  cupsSold: number
  revenueCents: number
  iceMeltedUnits: number
  endCashCents: number
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
