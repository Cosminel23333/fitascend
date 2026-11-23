import { expect, it } from 'vitest'
import { uuid } from '../src/lib/uuid'

it('makes valid, unique v4 UUIDs', () => {
  const ids = Array.from({ length: 1000 }, uuid)
  for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  expect(new Set(ids).size).toBe(1000)
})
