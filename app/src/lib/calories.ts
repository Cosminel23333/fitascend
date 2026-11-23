export type Sex = 'm' | 'f'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
export type Goal = 'cut_aggressive' | 'cut' | 'maintain' | 'lean_bulk' | 'bulk'

export const activityFactor: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export const goalFactor: Record<Goal, number> = {
  cut_aggressive: 0.75,
  cut: 0.85,
  maintain: 1,
  lean_bulk: 1.1,
  bulk: 1.15,
}

export function bmrMifflin(sex: Sex, kg: number, cm: number, age: number) {
  return 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161)
}

export function bmrKatch(kg: number, bodyFatPct: number) {
  return 370 + 21.6 * kg * (1 - bodyFatPct / 100)
}

// Katch-McArdle is more accurate when lean mass is known; Mifflin-St Jeor otherwise
export function bmr(p: { sex: Sex; weightKg: number; heightCm: number; age: number; bodyFatPct?: number | null }) {
  return p.bodyFatPct ? bmrKatch(p.weightKg, p.bodyFatPct) : bmrMifflin(p.sex, p.weightKg, p.heightCm, p.age)
}

export const tdee = (bmrKcal: number, activity: Activity) => bmrKcal * activityFactor[activity]

export function targetKcal(tdeeKcal: number, goal: Goal, sex: Sex) {
  const floor = sex === 'f' ? 1200 : 1500
  return Math.max(Math.round(tdeeKcal * goalFactor[goal]), floor)
}

export function macros(kcal: number, weightKg: number, goal: Goal) {
  const perKg = goal.startsWith('cut') ? 2.2 : goal === 'maintain' ? 1.8 : 2
  const protein = Math.round(weightKg * perKg)
  const fat = Math.round((kcal * 0.25) / 9)
  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 0)
  return { protein, fat, carbs }
}

export function ageOn(birthDate: string, today = new Date()) {
  // split the ISO date instead of new Date(str), which parses as UTC and can shift the day
  const [y, m, d] = birthDate.split('-').map(Number)
  let age = today.getFullYear() - y
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--
  return age
}

export const waterTargetMl = (weightKg: number) => Math.round((weightKg * 35) / 50) * 50

export const paceMinPerKm = (km: number, minutes: number) => (km > 0 ? minutes / km : null)
