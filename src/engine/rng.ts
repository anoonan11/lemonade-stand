import { MAX_PASSERSBY } from './constants'

// Random foot traffic for a day: 0 to 100 people, uniform.
export function randomPassersby(): number {
  return Math.floor(Math.random() * (MAX_PASSERSBY + 1))
}
