// Queue of writes not yet sent to the cloud. Rows live here only until the server accepts them.

export type Table = 'profiles' | 'workouts' | 'workout_sets' | 'entries' | 'custom_exercises'
export type Op =
  | { op: 'upsert'; table: Table; row: Record<string, unknown>; userId: string }
  | { op: 'delete'; table: Table; id: string; userId: string }
export type SendResult = { status: number; error: { message: string } | null }

const KEY = 'fitascend-outbox'
const REJECTED = 'fitascend-rejected'
const listeners = new Set<() => void>()
let queue: Op[] = load(KEY)
let flushing = false

function load(key: string): Op[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function persist() {
  // if storage is unavailable the queue still lives in memory and is sent while the app is open
  try { localStorage.setItem(KEY, JSON.stringify(queue)) } catch { /* private mode / quota */ }
  listeners.forEach(l => l())
}

export function enqueue(op: Op) {
  queue.push(op)
  persist()
}

export const pending = () => queue
export function subscribe(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

// offline, expired session, rate limit or server hiccup: keep the op and retry later
const isTemporary = (status: number) => status === 0 || status === 401 || status === 408 || status === 429 || status >= 500

export async function flush(userId: string | null, send: (op: Op) => Promise<SendResult>) {
  if (flushing || !userId) return
  flushing = true
  try {
    for (let i = queue.findIndex(o => o.userId === userId); i >= 0; i = queue.findIndex(o => o.userId === userId)) {
      const op = queue[i]
      let r: SendResult
      try { r = await send(op) } catch (e) { r = { status: 0, error: { message: String(e) } } }
      if (r.error && isTemporary(r.status)) break
      if (r.error) {
        // rejected by the server (invalid data): keep a copy instead of losing it silently
        console.error('FitAscend: rejected write', op, r.error.message)
        try { localStorage.setItem(REJECTED, JSON.stringify([...load(REJECTED), { ...op, error: r.error.message }])) } catch { /* ignore */ }
      }
      queue.splice(i, 1)
      persist()
    }
  } finally {
    flushing = false
  }
}

// test helper
export function _reset() {
  queue = []
  flushing = false
}
