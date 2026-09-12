import { describe, expect, it } from 'vitest'
import { photoCursor, photoPage } from './photoHistory'
import { makeDemo } from './demo'
describe('photo lookahead page', () => {
  it('uses the 31st row only to signal another page', () => {
    const rows = Array.from({ length: 31 }, (_, i) => ({ ...makeDemo().photos[0], id: String(i) }))
    expect(photoPage(rows).photos).toHaveLength(30)
    expect(photoPage(rows).hasMore).toBe(true)
    expect(photoPage(rows).photos.at(-1)?.id).toBe('29')
    expect(photoPage(rows.slice(0, 30)).hasMore).toBe(false)
    expect(photoPage([])).toEqual({ photos: [], hasMore: false })
  })
  it('carries the memory date, upload time and id as the paging cursor', () => {
    const photo = makeDemo().photos[0]
    expect(photoCursor(photo)).toEqual({
      id: photo.id,
      created_at: photo.created_at,
      occurred_on: photo.occurred_on || null,
    })
  })
})
