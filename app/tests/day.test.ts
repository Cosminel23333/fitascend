import { describe, expect, it } from 'vitest'
import { localDay, mergePending, type Entry } from '../src/lib/day'
import type { Op } from '../src/lib/outbox'

const e = (id: string, created_at: string, day = '2026-11-23'): Entry => ({ id, day, kind: 'water', value: 250, data: null, created_at })

describe('localDay', () => {
  it('uses the local calendar day, zero-padded', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(localDay(new Date(2026, 10, 23, 0, 1))).toBe('2026-11-23')
  })
})

describe('mergePending', () => {
  const server = [e('a', '2026-11-23T08:00:00Z'), e('b', '2026-11-23T09:00:00Z')]

  it('adds unsent entries of the same day, in time order', () => {
    const ops: Op[] = [{ op: 'upsert', table: 'entries', row: e('c', '2026-11-23T08:30:00Z'), userId: 'u' }]
    expect(mergePending(server, ops, 'u', '2026-11-23').map(r => r.id)).toEqual(['a', 'c', 'b'])
  })

  it('hides entries whose delete is still unsent', () => {
    const ops: Op[] = [{ op: 'delete', table: 'entries', id: 'a', userId: 'u' }]
    expect(mergePending(server, ops, 'u', '2026-11-23').map(r => r.id)).toEqual(['b'])
  })

  it('an unsent edit replaces the server version', () => {
    const ops: Op[] = [{ op: 'upsert', table: 'entries', row: { ...e('a', '2026-11-23T08:00:00Z'), value: 999 }, userId: 'u' }]
    expect(mergePending(server, ops, 'u', '2026-11-23')[0].value).toBe(999)
  })

  it('ignores other days, other users and other tables', () => {
    const ops: Op[] = [
      { op: 'upsert', table: 'entries', row: e('x', '2026-11-22T08:00:00Z', '2026-11-22'), userId: 'u' },
      { op: 'upsert', table: 'entries', row: e('y', '2026-11-23T08:00:00Z'), userId: 'other' },
      { op: 'upsert', table: 'profiles', row: { user_id: 'u' }, userId: 'u' },
    ]
    expect(mergePending(server, ops, 'u', '2026-11-23').map(r => r.id)).toEqual(['a', 'b'])
  })
})
