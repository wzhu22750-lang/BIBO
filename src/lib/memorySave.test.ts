import { describe, expect, it } from 'vitest'
import { makeDemo } from './demo'
import { applySavedMemory } from './memorySave'
describe('confirmed memory update', () => {
  it('uses returned fields, preserves a matching signed URL, leaves unrelated rows untouched', () => {
    const space = makeDemo()
    const saved = { ...space.photos[0], caption: 'server normalized', story: 'saved' }
    delete saved.url
    const result = applySavedMemory(space, saved)
    expect(result.photos[0].caption).toBe('server normalized')
    expect(result.photos[0].story).toBe('saved')
    expect(result.photos[0].url).toBe(space.photos[0].url)
    expect(result.photos[1]).toBe(space.photos[1])
    expect(space.photos[0].caption).not.toBe('server normalized')
  })
  it('does not resurrect removed photos or cross a changed space boundary', () => {
    const space = makeDemo(),
      row = { ...space.photos[0], couple_id: 'another-space' }
    expect(applySavedMemory(space, row)).toBe(space)
    expect(applySavedMemory({ ...space, photos: [] }, space.photos[0]).photos).toEqual([])
  })
  it('drops stale image URLs when a returned storage path changes', () => {
    const space = makeDemo()
    expect(
      applySavedMemory(space, { ...space.photos[0], path: 'new-path' }).photos[0].url,
    ).toBeUndefined()
  })
})
