import { useCallback, useEffect, useState } from 'react'
import { mergeOps } from './day'
import type { Exercise } from './exercises'
import { pending } from './outbox'
import { save, supabase } from './sync'
import { uuid } from './uuid'

export type Kind = 'strength' | 'cardio' | 'hiit'
export type Workout = {
  id: string
  day: string
  kind: Kind
  title: string | null
  duration_min: number | null
  distance_km: number | null
  rounds: number | null
  notes: string | null
  created_at: string
}
export type WSet = {
  id: string
  workout_id: string
  exercise_id: string
  exercise_name: string
  set_no: number
  reps: number
  weight_kg: number
  created_at: string
}

export function useWorkouts(uid: string, day: string) {
  const [workouts, setWorkouts] = useState<Workout[]>(() => mergeOps<Workout>([], pending(), uid, 'workouts', w => w.day === day))
  const [sets, setSets] = useState<WSet[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading')

  const load = useCallback(async () => {
    const w = await supabase.from('workouts').select('id, day, kind, title, duration_min, distance_km, rounds, notes, created_at').eq('day', day)
    if (w.error) return setStatus('offline')
    const ws = mergeOps(w.data as Workout[], pending(), uid, 'workouts', x => x.day === day)
    const ids = ws.map(x => x.id)
    const s = ids.length ? await supabase.from('workout_sets').select('id, workout_id, exercise_id, exercise_name, set_no, reps, weight_kg, created_at').in('workout_id', ids) : { data: [], error: null }
    if (s.error) return setStatus('offline')
    setWorkouts(ws)
    setSets(mergeOps(s.data as WSet[], pending(), uid, 'workout_sets', x => ids.includes(x.workout_id)))
    setStatus('ok')
  }, [uid, day])

  useEffect(() => {
    void load()
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    addEventListener('online', load)
    document.addEventListener('visibilitychange', onVisible)
    return () => { removeEventListener('online', load); document.removeEventListener('visibilitychange', onVisible) }
  }, [load])

  const saveWorkout = (w: Partial<Workout> & Pick<Workout, 'kind'>) => {
    const row: Workout = {
      title: null, duration_min: null, distance_km: null, rounds: null, notes: null,
      ...w,
      id: w.id ?? uuid(),
      created_at: w.created_at ?? new Date().toISOString(),
      day,
    }
    setWorkouts(ws => [...ws.filter(x => x.id !== row.id), row].sort((a, b) => a.created_at.localeCompare(b.created_at)))
    save({ op: 'upsert', table: 'workouts', row, userId: uid })
    return row
  }

  // the server deletes the sets too (on delete cascade)
  const removeWorkout = (id: string) => {
    setWorkouts(ws => ws.filter(w => w.id !== id))
    setSets(ss => ss.filter(s => s.workout_id !== id))
    save({ op: 'delete', table: 'workouts', id, userId: uid })
  }

  const addSet = (workoutId: string, ex: Pick<Exercise, 'id' | 'n'>, reps: number, weightKg: number) => {
    const setNo = sets.filter(s => s.workout_id === workoutId && s.exercise_id === ex.id).length + 1
    const row: WSet = {
      id: uuid(), workout_id: workoutId, exercise_id: ex.id, exercise_name: ex.n,
      set_no: setNo, reps, weight_kg: weightKg, created_at: new Date().toISOString(),
    }
    setSets(ss => [...ss, row])
    save({ op: 'upsert', table: 'workout_sets', row, userId: uid })
  }

  const removeSet = (id: string) => {
    setSets(ss => ss.filter(s => s.id !== id))
    save({ op: 'delete', table: 'workout_sets', id, userId: uid })
  }

  return { workouts, sets, status, saveWorkout, removeWorkout, addSet, removeSet }
}

// the user's own exercises, shaped like library ones so search treats them the same
export function useCustomExercises(uid: string) {
  const [list, setList] = useState<Exercise[]>([])
  useEffect(() => {
    supabase.from('custom_exercises').select('id, name, muscles, created_at').then(({ data }) => {
      const rows = mergeOps((data ?? []) as { id: string; name: string; muscles: string[] | null; created_at: string }[], pending(), uid, 'custom_exercises', () => true)
      setList(rows.map(r => ({ id: r.id, n: r.name, m: r.muscles ?? [], s: [], q: null, c: 'strength', i: 0, custom: true })))
    })
  }, [uid])

  const add = (name: string): Exercise => {
    const row = { id: uuid(), name, muscles: [] as string[], created_at: new Date().toISOString() }
    save({ op: 'upsert', table: 'custom_exercises', row, userId: uid })
    const ex: Exercise = { id: row.id, n: name, m: [], s: [], q: null, c: 'strength', i: 0, custom: true }
    setList(l => [...l, ex])
    return ex
  }

  return { list, add }
}
