import { describe, expect, it } from 'vitest'
import { mergeMessages } from './messageHistory'
import type { Message } from './types'
const row = (id: string, couple_id = 'c'): Message => ({
  id,
  couple_id,
  sender_id: 'u',
  content: id,
  created_at: '2026-09-08T00:00:00Z',
})
describe('message history merge', () => {
  it('orders equal timestamp rows by ID and removes overlapping pages', () => {
    expect(mergeMessages('c', [row('b'), row('a')], [row('b'), row('c')]).map((r) => r.id)).toEqual(
      ['a', 'b', 'c'],
    )
  })
  it('does not mix another space or mutate pages', () => {
    const page = [row('b'), row('a')]
    expect(mergeMessages('c', page, [row('x', 'other')])).toHaveLength(2)
    expect(page.map((r) => r.id)).toEqual(['b', 'a'])
  })
})
