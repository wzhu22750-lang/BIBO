import { describe, expect, it } from 'vitest'
import { memoryInput, memoryDateLabel, sortedMemories } from './memories'
import { timelineEntries } from './timeline'
import { makeDemo } from './demo'
describe('memory metadata and date provenance', () => {
  it('keeps missing occurrence dates unknown instead of copying upload dates', () => {
    expect(memoryInput()).toEqual({
      occurred_on: null,
      story: '',
      event_id: null,
      message_id: null,
      emoji: 'icon:heart',
    })
    expect(memoryDateLabel(makeDemo().photos[0])).toBeNull()
  })
  it('validates leap dates, bounds and story length', () => {
    expect(memoryInput({ occurred_on: '2024-02-29' }).occurred_on).toBe('2024-02-29')
    for (const occurred_on of ['2025-02-29', '2025-13-01', '1899-12-31', 'nonsense', '2025-1-1'])
      expect(() => memoryInput({ occurred_on })).toThrow('日期')
    expect(() => memoryInput({ story: 'x'.repeat(2001) })).toThrow('2000')
    expect(memoryInput({ story: ' hello ' }).story).toBe('hello')
  })
  it('sorts by occurrence with upload fallback without changing existing photos', () => {
    const photos = makeDemo().photos
    photos[0].occurred_on = '2000-01-01'
    const original = [...photos]
    expect(sortedMemories(photos).at(-1)?.id).toBe(photos[0].id)
    expect(sortedMemories(photos, 'asc')[0]?.id).toBe(photos[0].id)
    expect(sortedMemories(photos, 'asc')).toEqual(sortedMemories(photos).reverse())
    expect(photos).toEqual(original)
  })
})
describe('relationship timeline', () => {
  it('retains original anniversary history rather than rewriting it to the next recurrence', () => {
    const space = makeDemo()
    space.events = [{ ...space.events[0], target_at: '2020-09-08T12:00:00', yearly: true }]
    space.photos = []
    expect(timelineEntries(space, 'past', new Date(2026, 8, 8))).toHaveLength(1)
    expect(timelineEntries(space, 'today', new Date(2026, 8, 8))).toHaveLength(0)
  })
  it('groups local calendar days and labels upload-date fallback', () => {
    const space = makeDemo()
    space.events = []
    space.photos = space.photos.slice(0, 2)
    space.photos[0].occurred_on = '2026-09-08'
    space.photos[1].created_at = new Date(2026, 8, 9).toISOString()
    const today = timelineEntries(space, 'today', new Date(2026, 8, 8, 23))
    expect(today).toHaveLength(1)
    expect(today[0].uploadDate).toBe(false)
    const future = timelineEntries(space, 'future', new Date(2026, 8, 8, 23))
    expect(future).toHaveLength(1)
    expect(future[0].uploadDate).toBe(true)
  })
})
