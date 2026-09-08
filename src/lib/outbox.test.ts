import { describe, expect, it } from 'vitest'
import {
  sameOutboxScope,
  inactiveOutboxRows,
  confirmedOutboxRow,
  retryableOutboxError,
  type OutboxMessage,
} from './outbox'
const queued: OutboxMessage = {
  id: 'id',
  userId: 'user',
  coupleId: 'couple',
  content: 'hello',
  queuedAt: 1,
  status: 'pending',
}
describe('outbox confirmation boundary', () => {
  it('requires user and space identity', () => {
    expect(sameOutboxScope(queued, 'user', 'couple')).toBe(true)
    expect(sameOutboxScope(queued, 'other', 'couple')).toBe(false)
    expect(sameOutboxScope(queued, 'user', 'other')).toBe(false)
  })
  it('requires exact UUID, author, space and text before removing a queued row', () => {
    const saved = {
      id: 'id',
      sender_id: 'user',
      couple_id: 'couple',
      content: 'hello',
      created_at: '2026-09-08T00:00:00Z',
    }
    expect(confirmedOutboxRow(queued, saved)).toBe(true)
    for (const key of ['id', 'sender_id', 'couple_id', 'content'])
      expect(confirmedOutboxRow(queued, { ...saved, [key]: 'other' })).toBe(false)
  })
  it('retries transport uncertainty but keeps constraints and authorization failures blocked', () => {
    expect(retryableOutboxError(new TypeError('Failed to fetch'))).toBe(true)
    expect(retryableOutboxError({ code: '40001' })).toBe(true)
    expect(retryableOutboxError({ code: '08006' })).toBe(true)
    for (const code of ['42501', '23514', '22023', 'PGRST202', 'OUTBOX_MISMATCH'])
      expect(retryableOutboxError({ code })).toBe(false)
  })
  it('shows only this account records outside its current relationship', () => {
    const rows = [
      queued,
      { ...queued, id: 'old', coupleId: 'old-space' },
      { ...queued, id: 'foreign', userId: 'other' },
    ]
    expect(inactiveOutboxRows(rows, 'user', 'couple').map((r) => r.id)).toEqual(['old'])
    expect(inactiveOutboxRows(rows, 'user', null).map((r) => r.id)).toEqual(['id', 'old'])
    expect(inactiveOutboxRows(rows, 'nobody', null)).toEqual([])
    expect(rows).toHaveLength(3)
  })
})
