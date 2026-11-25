import { localDay } from './day'

// Strength progress for one exercise, from all of the user's sets of it.
export type HistSet = { day: string; reps: number; weight_kg: number }
export type HistRow = HistSet & { exercise_id: string; exercise_name: string }
export type Session = { day: string; sets: HistSet[]; best: number; top: HistSet }

// Epley estimate; a single rep is already the max
export const e1rm = (reps: number, kg: number) => (reps <= 1 ? kg : kg * (1 + reps / 30))

// heaviest weight wins, then more reps (so bodyweight sets at 0 kg still rank by reps)
const heavier = (a: HistSet, b: HistSet) => (a.weight_kg - b.weight_kg) || (a.reps - b.reps)

export function progress(sets: HistSet[]) {
  const byDay = new Map<string, HistSet[]>()
  for (const s of sets) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s])
  const sessions: Session[] = [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([day, ss]) => ({
    day,
    sets: ss,
    top: ss.reduce((m, s) => (heavier(s, m) > 0 ? s : m)),
    // without weight the chart follows reps instead of an estimated max
    best: Math.max(...ss.map(s => (s.weight_kg > 0 ? e1rm(s.reps, s.weight_kg) : s.reps))),
  }))
  const record = sessions.length ? sessions.map(s => s.top).reduce((m, s) => (heavier(s, m) > 0 ? s : m)) : null
  const bestE1rm = Math.max(0, ...sets.filter(s => s.weight_kg > 0).map(s => e1rm(s.reps, s.weight_kg)))
  return { sessions, record, bestE1rm }
}

// one progress per exercise, the most recently trained first
export function byExercise(rows: HistRow[]) {
  const by = new Map<string, { name: string; sets: HistSet[] }>()
  for (const r of rows) {
    const g = by.get(r.exercise_id) ?? { name: r.exercise_name, sets: [] }
    g.sets.push(r)
    by.set(r.exercise_id, g)
  }
  const last = (p: ReturnType<typeof progress>) => p.sessions[p.sessions.length - 1].day
  return [...by].map(([id, g]) => ({ id, name: g.name, ...progress(g.sets) })).sort((a, b) => last(b).localeCompare(last(a)))
}

const addDays = (day: string, n: number) => {
  const [y, m, d] = day.split('-').map(Number)
  return localDay(new Date(y, m - 1, d + n))
}
// Monday of the day's week
export const weekOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return addDays(day, -((new Date(y, m - 1, d).getDay() + 6) % 7))
}

// the last `weeks` weeks up to today's, oldest first, empty weeks included
export function weekly(rows: HistSet[], today: string, weeks = 8) {
  const start = weekOf(today)
  const list = Array.from({ length: weeks }, (_, i) => ({ week: addDays(start, (i - weeks + 1) * 7), volume: 0, days: new Set<string>() }))
  const at = new Map(list.map(w => [w.week, w]))
  for (const r of rows) {
    const w = at.get(weekOf(r.day))
    if (w) { w.volume += r.reps * r.weight_kg; w.days.add(r.day) }
  }
  return list.map(w => ({ week: w.week, volume: w.volume, days: w.days.size }))
}

// sets per muscle over the last 7 days: a full set for each main muscle, half for each secondary one
export function muscleSets(rows: HistRow[], musclesOf: (exerciseId: string) => { m: string[]; s: string[] } | undefined, today: string) {
  const from = addDays(today, -6)
  const load: Record<string, number> = {}
  for (const r of rows) {
    if (r.day < from || r.day > today) continue
    const ex = musclesOf(r.exercise_id)
    for (const m of ex?.m ?? []) load[m] = (load[m] ?? 0) + 1
    for (const m of ex?.s ?? []) load[m] = (load[m] ?? 0) + 0.5
  }
  return load
}

// double progression: add a rep until 12, then add weight and drop back to 8
export function suggest(top: HistSet): HistSet {
  if (top.weight_kg > 0 && top.reps >= 12) return { ...top, reps: 8, weight_kg: top.weight_kg + 2.5 }
  return { ...top, reps: top.reps + 1 }
}
