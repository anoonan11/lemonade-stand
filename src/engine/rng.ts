import { CHAOS_ODDS, MAX_PASSERSBY } from './constants'
import type { ChaosEvent } from './types'

// Random foot traffic for a day: 0 to 100 people, uniform.
export function randomPassersby(): number {
  return Math.floor(Math.random() * (MAX_PASSERSBY + 1))
}

// One roll decides the day's chaos, if any. The events split a single [0, 1)
// draw: [0, .15) pestilence, [.15, .35) thunderstorm, [.35, .45) windstorm,
// and everything above is a normal day.
export function rollChaos(): ChaosEvent | null {
  const roll = Math.random()
  let threshold = 0
  for (const [event, odds] of Object.entries(CHAOS_ODDS)) {
    threshold += odds
    if (roll < threshold) return event as ChaosEvent
  }
  return null
}
