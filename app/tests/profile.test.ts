import { describe, expect, it } from 'vitest'
import { setSaved, type SavedMeal } from '../src/lib/profile'

const m = (name: string, kcal: number): SavedMeal => ({ name, description: null, kcal, protein: null, carbs: null, fat: null })

describe('setSaved', () => {
  it('adds, replaces by name in any case, and removes', () => {
    const one = setSaved([], m('Ovăz', 350), true)
    expect(one).toEqual([m('Ovăz', 350)])
    expect(setSaved(one, m('ovăz', 400), true)).toEqual([m('ovăz', 400)])
    expect(setSaved([...one, m('Omletă', 300)], m('OVĂZ', 0), false)).toEqual([m('Omletă', 300)])
  })
})
