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

// double progression: add a rep until 12, then add weight and drop back to 8
export function suggest(top: HistSet): HistSet {
  if (top.weight_kg > 0 && top.reps >= 12) return { ...top, reps: 8, weight_kg: top.weight_kg + 2.5 }
  return { ...top, reps: top.reps + 1 }
}
