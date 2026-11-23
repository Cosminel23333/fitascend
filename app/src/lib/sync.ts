import { createClient } from '@supabase/supabase-js'
import { enqueue, flush, type Op } from './outbox'

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

const keyOf = (table: Op['table']) => (table === 'profiles' ? 'user_id' : 'id')

async function send(op: Op) {
  const q = op.op === 'upsert'
    ? supabase.from(op.table).upsert(op.row, { onConflict: keyOf(op.table) })
    : supabase.from(op.table).delete().eq(keyOf(op.table), op.id)
  const { status, error } = await q
  return { status, error }
}

export async function flushNow() {
  const { data } = await supabase.auth.getSession()
  await flush(data.session?.user.id ?? null, send)
}

// every write goes through the queue: shown instantly, sent now if online, retried otherwise
export function save(op: Op) {
  enqueue(op)
  void flushNow()
}

let started = false
export function startSync() {
  if (started) return
  started = true
  addEventListener('online', () => void flushNow())
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void flushNow() })
  setInterval(() => void flushNow(), 30_000)
  void flushNow()
}
