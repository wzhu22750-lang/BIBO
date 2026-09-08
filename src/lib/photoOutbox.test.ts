import { describe, expect, it } from 'vitest'
import {
  photoConfirmed,
  photoFailure,
  photoOperation,
  photoDue,
  photoRowsReadyForSync,
  retryablePhotoError,
  samePhotoScope,
} from './photoOutbox'
const memory = { occurred_on: null, story: 'story', event_id: null, message_id: null }
const file = new Blob(['photo'], { type: 'image/jpeg' })
const row = photoOperation('u', 'c', file, 'x.jpg', 'image/jpeg', 'caption', memory, 1000)
describe('photo upload outbox', () => {
  it('uses a fixed UUID/path contract and exact response confirmation', () => {
    expect(row.photoId).not.toBe(row.id)
    expect(samePhotoScope(row, 'u', 'c')).toBe(true)
    expect(
      photoConfirmed(row, {
        id: row.photoId,
        couple_id: 'c',
        uploaded_by: 'u',
        path: `c/u/${row.photoId}.jpg`,
        caption: 'caption',
        created_at: 'now',
      }),
    ).toBe(true)
    expect(
      photoConfirmed(row, {
        id: row.photoId,
        couple_id: 'c',
        uploaded_by: 'u',
        path: 'c/u/other.jpg',
        caption: 'caption',
        created_at: 'now',
      }),
    ).toBe(false)
  })
  it('backs off retryable uploads and blocks authorization errors', () => {
    const retry = photoFailure(row, 'offline', true, 1000)
    expect(retry.nextAttemptAt).toBeGreaterThan(1000)
    expect(photoDue(retry, 1001)).toBe(false)
    expect(photoFailure(row, 'denied', false).status).toBe('blocked')
  })
  it('reuses the message/event retryability contract for photo uploads', () => {
    // Transport timeout (no Postgres code) stays retryable.
    expect(retryablePhotoError(new Error('fetch failed'))).toBe(true)
    expect(retryablePhotoError({ message: '网络请求超时' })).toBe(true)
    // Transient database classes are retried, not permanently blocked.
    expect(retryablePhotoError({ code: '40001', message: 'serialization_failure' })).toBe(true)
    expect(retryablePhotoError({ code: '40P01', message: 'deadlock_detected' })).toBe(true)
    expect(retryablePhotoError({ code: '57014', message: 'query_canceled' })).toBe(true)
    expect(retryablePhotoError({ code: '08P01', message: 'protocol_violation' })).toBe(true)
    // A mismatched server response stays blocked for manual retry.
    expect(retryablePhotoError({ code: 'PHOTO_OUTBOX_MISMATCH' })).toBe(false)
    // Authorization/schema errors stay blocked.
    expect(retryablePhotoError({ code: '42501', message: 'permission denied' })).toBe(false)
  })
  it('skips blocked rows instead of stalling the queue behind them', () => {
    const pending = photoOperation('u', 'c', file, 'y.jpg', 'image/jpeg', 'two', memory, 1000)
    const blocked = photoFailure(row, 'denied', false, 1000)
    // A blocked row at the head must not prevent a pending row behind it from syncing.
    expect(photoRowsReadyForSync([blocked, pending], 1001).map((r) => r.id)).toEqual([pending.id])
    // The first pending row waiting on backoff stops the pass to preserve order.
    const backingOff = photoFailure(
      photoOperation('u', 'c', file, 'z.jpg', 'image/jpeg', 'three', memory, 1000),
      'offline',
      true,
      1000,
    )
    expect(photoRowsReadyForSync([pending, backingOff, row], 1001).map((r) => r.id)).toEqual([
      pending.id,
    ])
    // Mixed blocked + pending rows: blocked are skipped, due pending pass.
    expect(photoRowsReadyForSync([blocked, pending, blocked, row], 1001).map((r) => r.id)).toEqual([
      pending.id,
      row.id,
    ])
    // A completely blocked queue has nothing to sync.
    expect(photoRowsReadyForSync([blocked], 1001)).toEqual([])
  })
})
