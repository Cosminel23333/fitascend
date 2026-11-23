import { localDay } from './day'

// Monday-first month grid: null for the blank cells before the 1st
export function monthGrid(year: number, month: number): (string | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => localDay(new Date(year, month, i + 1))),
  ]
}

export const monthRange = (year: number, month: number) => ({
  from: localDay(new Date(year, month, 1)),
  to: localDay(new Date(year, month + 1, 0)),
})
