import { describe, expect, it } from 'vitest'
import { forGrams } from '../src/lib/food'

describe('forGrams', () => {
  it('scales per-100 g values to the portion', () => {
    expect(forGrams({ kcal: 250, protein: 5.2, carbs: 30, fat: null }, 150)).toEqual({ kcal: 375, protein: 7.8, carbs: 45, fat: null })
  })
})
