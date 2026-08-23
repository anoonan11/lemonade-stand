import { describe, it, expect } from 'vitest'
import { roundHalfUp, formatCents, parseDollarsToCents } from './money'

describe('roundHalfUp', () => {
  it('rounds .5 up', () => {
    expect(roundHalfUp(2.5)).toBe(3)
    expect(roundHalfUp(0.5)).toBe(1)
  })

  it('rounds below .5 down and above .5 up', () => {
    expect(roundHalfUp(2.4)).toBe(2)
    expect(roundHalfUp(2.6)).toBe(3)
  })

  it('leaves whole numbers alone', () => {
    expect(roundHalfUp(7)).toBe(7)
    expect(roundHalfUp(0)).toBe(0)
  })
})

describe('formatCents', () => {
  it('formats dollars and cents', () => {
    expect(formatCents(10000)).toBe('$100.00')
    expect(formatCents(152)).toBe('$1.52')
  })

  it('pads single-digit cents', () => {
    expect(formatCents(5)).toBe('$0.05')
  })

  it('handles zero and negatives', () => {
    expect(formatCents(0)).toBe('$0.00')
    expect(formatCents(-250)).toBe('-$2.50')
  })
})

describe('parseDollarsToCents', () => {
  it('parses plain dollar amounts', () => {
    expect(parseDollarsToCents('2.00')).toBe(200)
    expect(parseDollarsToCents('0.75')).toBe(75)
    expect(parseDollarsToCents('3')).toBe(300)
  })

  it('survives binary floating point: 1.15 is 115 cents, not 114', () => {
    expect(parseDollarsToCents('1.15')).toBe(115)
  })

  it('tolerates a leading dollar sign and surrounding space', () => {
    expect(parseDollarsToCents(' $2.50 ')).toBe(250)
  })

  it('rejects text it cannot use', () => {
    expect(parseDollarsToCents('')).toBeNull()
    expect(parseDollarsToCents('free')).toBeNull()
    expect(parseDollarsToCents('-1.00')).toBeNull()
    expect(parseDollarsToCents('1.234')).toBeNull()
    expect(parseDollarsToCents('.')).toBeNull()
  })
})
