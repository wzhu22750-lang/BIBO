import type { OutboxMessage } from './outbox'
// Stable per-message jitter avoids duplicate tabs changing the retry deadline unpredictably.
export function retryDelay(attempt: number, id: string): number {
  const count = Math.max(1, Math.min(10, Number.isFinite(attempt) ? Math.floor(attempt) : 1))
  const jitter =
    Array.from(id).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0) % 5000
  return Math.min(300000, 15000 * 2 ** (count - 1) + jitter)
}
export function failedOutboxAttempt(
  row: OutboxMessage,
  error: string,
  retryable: boolean,
  now = Date.now(),
): OutboxMessage {
  const attempts = Math.min(
    1000,
    (Number.isFinite(row.attempts) ? Math.max(0, row.attempts!) : 0) + 1,
  )
  return {
    ...row,
    attempts,
    error,
    status: retryable ? 'pending' : 'blocked',
    nextAttemptAt: retryable ? now + retryDelay(attempts, row.id) : undefined,
  }
}
export function outboxDue(row: OutboxMessage, now = Date.now()): boolean {
  if (row.status !== 'pending') return false
  if (!Number.isFinite(row.nextAttemptAt)) return true
  // Recover from a clock that moved backward rather than waiting days for a five-minute retry.
  return row.nextAttemptAt! <= now || row.nextAttemptAt! - now > 305000
}
