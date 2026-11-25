import { describe, expect, it } from 'vitest'
import { forGrams, parseLabel } from '../src/lib/food'

describe('parseLabel', () => {
  it('reads a Romanian table, taking the per-100 g column', () => {
    const text = `Declarație nutrițională  100 g   Porție 30 g
Valoare energetică 1046 kJ / 250 kcal  314 kJ / 75 kcal
Grăsimi 12,5 g 3,8 g
din care acizi grași saturați 5 g 1,5 g
Glucide 30 g 9 g
din care zaharuri 20 g 6 g
Proteine 5,2 g 1,6 g
Sare 0,5 g 0,15 g`
    expect(parseLabel(text)).toEqual({ kcal: 250, fat: 12.5, carbs: 30, protein: 5.2 })
  })

  it('reads English, works out kcal from kJ', () => {
    const text = `Energy 1500kJ\nFat 10.0g\nof which saturates 2g\nCarbohydrate 50g\nof which sugars 5g\nProtein 8g`
    expect(parseLabel(text)).toEqual({ kcal: 359, fat: 10, carbs: 50, protein: 8 })
  })

  it('copes with OCR spacing in decimals and missing diacritics', () => {
    expect(parseLabel('Energie 400 kcal\nGrasimi 20 , 5 g\nGlucide 40g\nProteine 15g')).toEqual({ kcal: 400, fat: 20.5, carbs: 40, protein: 15 })
  })

  it('puts back a decimal comma the OCR dropped, using the energy to tell', () => {
    expect(parseLabel('Energie 1046 kJ / 250 kcal\nGrasimi 125 g\nGlucide 30 g\nProteine 52 g')).toEqual({ kcal: 250, fat: 12.5, carbs: 30, protein: 5.2 })
    // already consistent: left alone
    expect(parseLabel('Energie 553 kcal\nGrasimi 45 g\nGlucide 20 g\nProteine 18 g')).toEqual({ kcal: 553, fat: 45, carbs: 20, protein: 18 })
  })

  it('works out kcal from macros when energy is unreadable, and gives up on nothing useful', () => {
    expect(parseLabel('Grasimi 10 g\nGlucide 20 g\nProteine 5 g')).toEqual({ kcal: 190, fat: 10, carbs: 20, protein: 5 })
    expect(parseLabel('ingrediente: faina, apa, sare')).toBeNull()
  })
})

describe('forGrams', () => {
  it('scales per-100 g values to the portion', () => {
    expect(forGrams({ kcal: 250, protein: 5.2, carbs: 30, fat: null }, 150)).toEqual({ kcal: 375, protein: 7.8, carbs: 45, fat: null })
  })
})
