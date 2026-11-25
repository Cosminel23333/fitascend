import { describe, expect, it } from 'vitest'
import { byExercise, e1rm, progress, suggest } from '../src/lib/progress'

describe('e1rm', () => {
  it('uses Epley, a single rep is the max', () => {
    expect(e1rm(1, 100)).toBe(100)
    expect(e1rm(10, 60)).toBeCloseTo(80)
  })
})

describe('progress', () => {
  it('groups sets by day, in order, and finds the record and best 1RM', () => {
    const p = progress([
      { day: '2026-11-25', reps: 5, weight_kg: 70 },
      { day: '2026-11-20', reps: 10, weight_kg: 60 },
      { day: '2026-11-20', reps: 8, weight_kg: 60 },
    ])
    expect(p.sessions.map(s => s.day)).toEqual(['2026-11-20', '2026-11-25'])
    expect(p.sessions[0].top).toEqual({ day: '2026-11-20', reps: 10, weight_kg: 60 })
    expect(p.record).toEqual({ day: '2026-11-25', reps: 5, weight_kg: 70 })
    expect(p.bestE1rm).toBeCloseTo(81.67, 1)
  })
  it('ranks bodyweight sets by reps and is empty without sets', () => {
    const p = progress([{ day: '2026-11-20', reps: 12, weight_kg: 0 }, { day: '2026-11-20', reps: 15, weight_kg: 0 }])
    expect(p.record?.reps).toBe(15)
    expect(p.sessions[0].best).toBe(15)
    expect(p.bestE1rm).toBe(0)
    expect(progress([])).toEqual({ sessions: [], record: null, bestE1rm: 0 })
  })
})

describe('byExercise', () => {
  it('groups by exercise, most recently trained first', () => {
    const r = (exercise_id: string, day: string, reps = 8) => ({ exercise_id, exercise_name: exercise_id.toUpperCase(), day, reps, weight_kg: 50 })
    const list = byExercise([r('a', '2026-11-01'), r('b', '2026-11-20'), r('a', '2026-11-10', 10)])
    expect(list.map(x => [x.id, x.name, x.sessions.length])).toEqual([['b', 'B', 1], ['a', 'A', 2]])
    expect(list[1].record?.reps).toBe(10)
  })
})

describe('suggest', () => {
  it('adds a rep, or weight once at 12 reps', () => {
    expect(suggest({ day: 'd', reps: 8, weight_kg: 60 })).toMatchObject({ reps: 9, weight_kg: 60 })
    expect(suggest({ day: 'd', reps: 12, weight_kg: 60 })).toMatchObject({ reps: 8, weight_kg: 62.5 })
    expect(suggest({ day: 'd', reps: 20, weight_kg: 0 })).toMatchObject({ reps: 21, weight_kg: 0 })
  })
})
