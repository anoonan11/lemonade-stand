import { ICE_UNITS_PER_LB } from './engine/constants'

// Ice is stored in tenths of a pound; show it back in pounds.
export function formatIce(units: number): string {
  const lbs = units / ICE_UNITS_PER_LB
  return `${Number.isInteger(lbs) ? lbs : lbs.toFixed(1)} lb`
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}
