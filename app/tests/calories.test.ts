import { describe, expect, it } from 'vitest'
import { ageOn, bmr, bmrKatch, bmrMifflin, macros, paceMinPerKm, targetKcal, tdee, waterTargetMl } from '../src/lib/calories'

describe('BMR', () => {
  it('Mifflin-St Jeor, man 80 kg / 180 cm / 30 y', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmrMifflin('m', 80, 180, 30)).toBe(1780)
  })
  it('Mifflin-St Jeor, woman 60 kg / 165 cm / 25 y', () => {
    // 600 + 1031.25 - 125 - 161 = 1345.25
    expect(bmrMifflin('f', 60, 165, 25)).toBeCloseTo(1345.25)
  })
  it('Katch-McArdle, 80 kg at 15% fat', () => {
    // lean mass 68 kg -> 370 + 21.6*68 = 1838.8
    expect(bmrKatch(80, 15)).toBeCloseTo(1838.8)
  })
  it('uses Katch-McArdle only when body fat is known', () => {
    const p = { sex: 'm' as const, weightKg: 80, heightCm: 180, age: 30 }
    expect(bmr(p)).toBe(1780)
    expect(bmr({ ...p, bodyFatPct: 15 })).toBeCloseTo(1838.8)
  })
})

describe('TDEE and goals', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(tdee(1780, 'moderate')).toBeCloseTo(2759)
    expect(tdee(1780, 'sedentary')).toBeCloseTo(2136)
  })
  it('applies goal adjustments', () => {
    expect(targetKcal(2759, 'maintain', 'm')).toBe(2759)
    expect(targetKcal(2759, 'cut', 'm')).toBe(Math.round(2759 * 0.85))
    expect(targetKcal(2759, 'bulk', 'm')).toBe(Math.round(2759 * 1.15))
  })
  it('never goes below the safety floor', () => {
    expect(targetKcal(1500, 'cut_aggressive', 'f')).toBe(1200)
    expect(targetKcal(1700, 'cut_aggressive', 'm')).toBe(1500)
  })
})

describe('macros', () => {
  it('splits calories into protein, fat and carbs', () => {
    // protein 2.2 g/kg on a cut = 176 g (704 kcal); fat 25% of 2345 = 65 g; carbs = rest
    const m = macros(2345, 80, 'cut')
    expect(m.protein).toBe(176)
    expect(m.fat).toBe(65)
    expect(m.carbs).toBe(Math.round((2345 - 176 * 4 - 65 * 9) / 4))
  })
  it('never returns negative carbs', () => {
    expect(macros(1200, 150, 'cut').carbs).toBe(0)
  })
})

describe('helpers', () => {
  it('computes age on a given day', () => {
    expect(ageOn('1995-11-24', new Date('2026-11-23'))).toBe(30)
    expect(ageOn('1995-11-23', new Date('2026-11-23'))).toBe(31)
  })
  it('water target is 35 ml per kg, rounded to 50 ml', () => {
    expect(waterTargetMl(80)).toBe(2800)
    expect(waterTargetMl(63)).toBe(2200)
  })
  it('running pace in min/km', () => {
    expect(paceMinPerKm(5, 25)).toBe(5)
    expect(paceMinPerKm(0, 25)).toBeNull()
  })
})
