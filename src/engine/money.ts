// Round half-up, applied once at the final step of a calculation.
export function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5)
}

// The display boundary: the only place cents become dollars.
export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const rest = String(abs % 100).padStart(2, '0')
  return `${sign}$${dollars}.${rest}`
}

// The input boundary: turn a dollar amount someone typed into integer cents.
// Returns null when the text isn't a usable amount, so callers can show an
// error instead of guessing. Multiplying by 100 can land just under a whole
// cent (1.15 * 100 is 114.99999999999999), so round once, here.
export function parseDollarsToCents(text: string): number | null {
  const trimmed = text.trim().replace(/^\$/, '')
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null
  return roundHalfUp(Number(trimmed) * 100)
}
