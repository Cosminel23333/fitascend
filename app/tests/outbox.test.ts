import { beforeEach, describe, expect, it } from 'vitest'
import { _reset, enqueue, flush, pending, type Op, type SendResult } from '../src/lib/outbox'

const water = (userId: string, value: number): Op => ({ op: 'upsert', table: 'entries', row: { id: String(value), kind: 'water', value }, userId })
const ok: SendResult = { status: 201, error: null }

describe('outbox', () => {
  beforeEach(_reset)

  it('keeps everything while offline', async () => {
    enqueue(water('a', 250))
    enqueue(water('a', 500))
    await flush('a', async () => ({ status: 0, error: { message: 'Failed to fetch' } }))
    expect(pending()).toHaveLength(2)
  })

  it('treats a thrown network error as offline', async () => {
    enqueue(water('a', 250))
    await flush('a', async () => { throw new TypeError('Failed to fetch') })
    expect(pending()).toHaveLength(1)
  })

  it('sends in order and empties the queue once online', async () => {
    enqueue(water('a', 250))
    enqueue(water('a', 500))
    const sent: unknown[] = []
    await flush('a', async op => { sent.push(op.op === 'upsert' && op.row.value); return ok })
    expect(sent).toEqual([250, 500])
    expect(pending()).toHaveLength(0)
  })

  it('stops at the first temporary failure and keeps the rest', async () => {
    enqueue(water('a', 1))
    enqueue(water('a', 2))
    enqueue(water('a', 3))
    let n = 0
    await flush('a', async () => (++n === 2 ? { status: 503, error: { message: 'down' } } : ok))
    expect(pending().map(o => o.op === 'upsert' && o.row.value)).toEqual([2, 3])
  })

  it('drops a write the server rejects as invalid, so it cannot block the queue', async () => {
    enqueue(water('a', -1))
    enqueue(water('a', 250))
    await flush('a', async op => (op.op === 'upsert' && op.row.value === -1 ? { status: 400, error: { message: 'check violation' } } : ok))
    expect(pending()).toHaveLength(0)
  })

  it('only sends the signed-in user\'s writes', async () => {
    enqueue(water('a', 250))
    enqueue(water('b', 500))
    await flush('b', async () => ok)
    expect(pending().map(o => o.userId)).toEqual(['a'])
  })

  it('does nothing when nobody is signed in', async () => {
    enqueue(water('a', 250))
    await flush(null, async () => ok)
    expect(pending()).toHaveLength(1)
  })
})
