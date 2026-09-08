import { describe, expect, it } from 'vitest'
import {
  photoConfirmed,
  photoFailure,
  photoOperation,
  photoDue,
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
})
