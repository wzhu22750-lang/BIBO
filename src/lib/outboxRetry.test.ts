import { describe, expect, it } from 'vitest'
import { failedOutboxAttempt, outboxDue, retryDelay } from './outboxRetry'
import type { OutboxMessage } from './outbox'
const row: OutboxMessage = {
  id: 'id',
  userId: 'u',
  coupleId: 'c',
  content: 'hello',
  queuedAt: 1,
  status: 'pending',
}
describe('persistent outbox retry policy', () => {
  it('backs off exponentially with bounded stable jitter and a five-minute ceiling', () => {
    expect(retryDelay(1, 'id')).toBeGreaterThanOrEqual(15000)
    expect(retryDelay(1, 'id')).toBeLessThan(20000)
    expect(retryDelay(2, 'id')).toBe(retryDelay(1, 'id') + 15000)
    expect(retryDelay(1000, 'id')).toBe(300000)
    expect(retryDelay(1, 'id')).toBe(retryDelay(1, 'id'))
  })
  it('preserves identity and content while persisting the next deadline', () => {
    const failed = failedOutboxAttempt(row, 'offline', true, 1000)
    expect(failed.id).toBe(row.id)
    expect(failed.content).toBe(row.content)
    expect(failed.attempts).toBe(1)
    expect(outboxDue(failed, 1001)).toBe(false)
    expect(outboxDue(JSON.parse(JSON.stringify(failed)), failed.nextAttemptAt!)).toBe(true)
    expect(row.nextAttemptAt).toBeUndefined()
  })
  it('never automatically retries blocked records and supports old queue records', () => {
    expect(outboxDue(row, 1000)).toBe(true)
    const failed = failedOutboxAttempt(row, 'permission denied', false, 1000)
    expect(failed.nextAttemptAt).toBeUndefined()
    expect(outboxDue(failed, 99999999)).toBe(false)
  })
  it('recovers from clock rollback and invalid legacy timestamps', () => {
    expect(outboxDue({ ...row, nextAttemptAt: 999999999 }, 1000)).toBe(true)
    expect(outboxDue({ ...row, nextAttemptAt: NaN }, 1000)).toBe(true)
    expect(outboxDue({ ...row, nextAttemptAt: 200000 }, 1000)).toBe(false)
  })
})
