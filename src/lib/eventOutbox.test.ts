import { describe, expect, it } from 'vitest'
import {
  confirmedEvent,
  eventDue,
  eventOperationForCreate,
  eventOperationForDelete,
  eventOperationForUpdate,
  eventRetryDelay,
  failedEventAttempt,
  inactiveEventOutboxRows,
  retryableEventError,
  sameEventScope,
  sameInstant,
} from './eventOutbox'
import type { EventInput, EventItem } from './types'
const input: EventInput = {
  title: '去看海',
  target_at: '2030-01-02T03:04:05.000Z',
  kind: 'countdown',
  yearly: false,
  emoji: 'icon:plane',
  category: 'travel',
}
const create = eventOperationForCreate('u', 'c', input, 1000)
const event: EventItem = { ...input, id: create.eventId, couple_id: 'c', created_by: 'u' }
describe('durable event operation queue', () => {
  it('creates stable scoped operations and confirms exact server rows', () => {
    expect(create.operation).toBe('create')
    expect(create.eventId).not.toBe(create.id)
    expect(confirmedEvent(create, event)).toBe(true)
    // Supabase PostgREST returns timestamptz formatted with +00:00 without milliseconds
    expect(confirmedEvent(create, { ...event, target_at: '2030-01-02T03:04:05+00:00' })).toBe(true)
    // Trimmed title comparison
    expect(confirmedEvent(create, { ...event, title: '去看海 ' })).toBe(true)
    expect(confirmedEvent(create, { ...event, title: 'tampered' })).toBe(false)
    expect(sameInstant('2030-01-02T03:04:05.000Z', '2030-01-02T03:04:05+00:00')).toBe(true)
    expect(sameInstant('2030-01-02T03:04:05.000Z', '2030-01-02T04:04:05.000Z')).toBe(false)
    expect(sameEventScope(create, 'u', 'c')).toBe(true)
    expect(sameEventScope(create, 'u', 'other')).toBe(false)
  })
  it('models update intent and confirms a deleted creator without changing the target ID', () => {
    const row = eventOperationForUpdate('u', 'c', 'event', input, 1)
    expect(row.operation).toBe('update')
    expect(confirmedEvent(row, { ...event, id: row.eventId, created_by: null })).toBe(true)
    expect(confirmedEvent(row, { ...event, id: row.eventId, title: 'tampered' })).toBe(false)
  })
  it('models idempotent delete intent separately', () => {
    const row = eventOperationForDelete('u', 'c', 'event', 1)
    expect(row.operation).toBe('delete')
    expect(row.eventId).toBe('event')
    expect(row.input).toBeUndefined()
  })
  it('backs off retryable failures but blocks authorization and schema errors', () => {
    const failed = failedEventAttempt(create, 'offline', true, 1000)
    expect(failed.status).toBe('pending')
    expect(failed.nextAttemptAt).toBeGreaterThan(1000)
    expect(eventDue(failed, 1001)).toBe(false)
    expect(eventDue(failed, failed.nextAttemptAt!)).toBe(true)
    expect(failedEventAttempt(create, 'denied', false).status).toBe('blocked')
    expect(retryableEventError({ code: '08006' })).toBe(true)
    for (const code of ['42501', '23514', 'EVENT_OUTBOX_MISMATCH'])
      expect(retryableEventError({ code })).toBe(false)
    expect(eventRetryDelay(100, 'id')).toBe(300000)
  })
  it('keeps only this account and current-space operations visible', () => {
    const rows = [
      create,
      { ...create, id: 'old', coupleId: 'old', queuedAt: 0 },
      { ...create, id: 'other', userId: 'other' },
    ]
    expect(inactiveEventOutboxRows(rows, 'u', 'c').map((r) => r.id)).toEqual(['old'])
    expect(inactiveEventOutboxRows(rows, 'u', null).map((r) => r.id)).toEqual(['old', create.id])
  })
})
