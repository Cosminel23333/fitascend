import { describe, expect, it } from 'vitest'
import { monthGrid, monthRange } from '../src/lib/month'

describe('monthGrid', () => {
  it('November 2026 starts on a Sunday: 6 blanks, then 30 days', () => {
    const g = monthGrid(2026, 10)
    expect(g.slice(0, 6)).toEqual([null, null, null, null, null, null])
    expect(g[6]).toBe('2026-11-01')
    expect(g.filter(Boolean)).toHaveLength(30)
    expect(g[g.length - 1]).toBe('2026-11-30')
  })
  it('a month starting on Monday has no blanks', () => {
    expect(monthGrid(2026, 5)[0]).toBe('2026-06-01')
  })
  it('handles February in a leap year', () => {
    expect(monthGrid(2028, 1).filter(Boolean)).toHaveLength(29)
  })
  it('gives the first and last day of the month', () => {
    expect(monthRange(2026, 1)).toEqual({ from: '2026-02-01', to: '2026-02-28' })
  })
})
