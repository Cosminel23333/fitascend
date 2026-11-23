import type { Lang } from './i18n'

// slim free-exercise-db record (see scripts/build-exercises.mjs)
export type Exercise = { id: string; n: string; m: string[]; s: string[]; q: string | null; c: string; i: number; a?: string[]; custom?: boolean }

const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'
export const imageUrl = (id: string, frame: 0 | 1) => `${IMG}${id}/${frame}.jpg`
export const detailsUrl = (id: string) => `${IMG}${id}.json`

const muscleRo: Record<string, string> = {
  abdominals: 'abdomen', hamstrings: 'femurali', adductors: 'adductori', quadriceps: 'cvadricepși', biceps: 'biceps',
  shoulders: 'umeri', chest: 'piept', 'middle back': 'spate (mijloc)', calves: 'gambe', glutes: 'fesieri',
  'lower back': 'zona lombară', lats: 'dorsali', triceps: 'triceps', traps: 'trapez', forearms: 'antebrațe',
  neck: 'gât', abductors: 'abductori',
}
const equipmentRo: Record<string, string> = {
  'body only': 'greutatea corpului', machine: 'aparat', other: 'altele', 'foam roll': 'rolă', kettlebells: 'kettlebell',
  dumbbell: 'gantere', cable: 'cablu', barbell: 'bară', bands: 'benzi elastice', 'medicine ball': 'minge medicinală',
  'exercise ball': 'minge fitness', 'e-z curl bar': 'bară EZ',
}

export const muscleName = (m: string, lang: Lang) => (lang === 'ro' ? muscleRo[m] ?? m : m)
export const equipmentName = (q: string | null, lang: Lang) => (q ? (lang === 'ro' ? equipmentRo[q] ?? q : q) : '')

// lowercase, no diacritics: "Împins" matches "impins"
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

let cache: Exercise[] | null = null
export async function loadExercises(): Promise<Exercise[]> {
  // separate chunk, loaded only when the workout screen needs it
  cache ??= (await import('../data/exercises.json')).default as Exercise[]
  return cache
}

export function search(list: Exercise[], query: string, limit = 30): Exercise[] {
  const q = norm(query)
  if (!q) return []
  const scored: { e: Exercise; score: number }[] = []
  for (const e of list) {
    const name = norm(e.n)
    const muscles = [...e.m, ...e.m.map(m => muscleRo[m] ?? m)].map(norm)
    let score = 0
    if (name.startsWith(q)) score = 100
    else if (name.split(/[\s\-/(]+/).some(w => w.startsWith(q))) score = 80
    else if (e.a?.some(a => norm(a).startsWith(q) || norm(a).split(' ').some(w => w.startsWith(q)))) score = 70
    else if (name.includes(q)) score = 50
    else if (muscles.some(m => m.startsWith(q))) score = 30
    if (!score) continue
    if (e.custom) score += 5 // the user's own exercises first
    if (e.c === 'strength' || e.c === 'powerlifting') score += 2
    scored.push({ e, score })
  }
  return scored.sort((a, b) => b.score - a.score || a.e.n.length - b.e.n.length).slice(0, limit).map(s => s.e)
}
