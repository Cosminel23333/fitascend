import { useCallback, useEffect, useState } from 'react'
import { pending, type Op } from './outbox'
import { uuid } from './uuid'
import { save, supabase } from './sync'

export type Kind = 'water' | 'meal' | 'sleep' | 'steps' | 'screen' | 'weight' | 'supplement'
export type Entry = {
  id: string
  day: string
  kind: Kind
  value: number | null
  data: Record<string, unknown> | null
  created_at: string
}

// local calendar day; toISOString() would give the UTC day and flip dates after midnight
export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// server rows plus this user's writes to `table` still waiting in the outbox, in time order
export function mergeOps<T extends { id: string; created_at: string }>(rows: T[], ops: Op[], userId: string, table: Op['table'], match: (row: T) => boolean): T[] {
  const out = new Map(rows.map(r => [r.id, r]))
  for (const o of ops) {
    if (o.userId !== userId || o.table !== table) continue
    if (o.op === 'delete') out.delete(o.id)
    else if (match(o.row as T)) out.set(o.row.id as string, o.row as T)
  }
  return [...out.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export const mergePending = (rows: Entry[], ops: Op[], userId: string, day: string) =>
  mergeOps(rows, ops, userId, 'entries', r => r.day === day)

export function useDay(uid: string, day: string) {
  const [rows, setRows] = useState<Entry[]>(() => mergePending([], pending(), uid, day))
  const [status, setStatus] = useState<'loading' | 'ok' | 'offline'>('loading')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('entries').select('id, day, kind, value, data, created_at').eq('day', day)
    if (error) return setStatus('offline')
    setRows(mergePending(data as Entry[], pending(), uid, day))
    setStatus('ok')
  }, [uid, day])

  useEffect(() => {
    void load()
    // pick up changes made on another device when coming back to the app
    const onVisible = () => { if (document.visibilityState === 'visible') void load() }
    addEventListener('online', load)
    document.addEventListener('visibilitychange', onVisible)
    return () => { removeEventListener('online', load); document.removeEventListener('visibilitychange', onVisible) }
  }, [load])

  const put = (e: Omit<Entry, 'id' | 'day' | 'created_at'> & Partial<Pick<Entry, 'id' | 'created_at'>>) => {
    // ?? and not a spread: callers pass id/created_at as undefined for new entries
    const row: Entry = { ...e, id: e.id ?? uuid(), created_at: e.created_at ?? new Date().toISOString(), day }
    setRows(rs => [...rs.filter(r => r.id !== row.id), row].sort((a, b) => a.created_at.localeCompare(b.created_at)))
    save({ op: 'upsert', table: 'entries', row, userId: uid })
  }

  const remove = (id: string) => {
    setRows(rs => rs.filter(r => r.id !== id))
    save({ op: 'delete', table: 'entries', id, userId: uid })
  }

  // sleep, steps, screen time and weight have one value per day: setting it again replaces it
  const setSingle = (kind: Kind, value: number) => {
    const existing = rows.find(r => r.kind === kind)
    put({ id: existing?.id, created_at: existing?.created_at, kind, value, data: null })
  }

  return { rows, status, put, remove, setSingle }
}
