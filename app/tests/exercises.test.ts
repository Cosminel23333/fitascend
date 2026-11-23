import { describe, expect, it } from 'vitest'
import data from '../src/data/exercises.json'
import { norm, search, type Exercise } from '../src/lib/exercises'

const list = data as Exercise[]
const names = (q: string) => search(list, q).map(e => e.n)

describe('exercise search', () => {
  it('has the whole free-exercise-db list', () => {
    expect(list.length).toBeGreaterThan(800)
  })
  it('"pec" finds the pec deck (Butterfly) through its alias', () => {
    expect(names('pec')).toContain('Butterfly')
  })
  it('finds by the start of any word, best matches first', () => {
    expect(names('bench')[0]).toMatch(/^Bench/)
    expect(names('squat').slice(0, 5).every(n => /squat/i.test(n))).toBe(true)
  })
  it('understands Romanian gym names and muscles, with or without diacritics', () => {
    expect(names('genuflexiuni')).toContain('Barbell Squat')
    expect(names('îndreptări')).toContain('Barbell Deadlift')
    expect(search(list, 'piept').length).toBeGreaterThan(5)
  })
  it('puts the user\'s own exercises first', () => {
    const own: Exercise = { id: 'c1', n: 'Pec machine Gym X', m: ['chest'], s: [], q: 'machine', c: 'strength', i: 0, custom: true }
    expect(search([...list, own], 'pec')[0].id).toBe('c1')
  })
  it('returns nothing for an empty query', () => {
    expect(search(list, '   ')).toEqual([])
  })
  it('normalises case and diacritics', () => {
    expect(norm(' Împins Ț ')).toBe('impins t')
  })
})
