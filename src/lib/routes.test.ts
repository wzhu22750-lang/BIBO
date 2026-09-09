import { describe, expect, it } from 'vitest'
import { parseRoute, referenceLink } from './routes'
describe('bounded record navigation', () => {
  it('retains legacy routes and has a safe default', () => {
    for (const page of ['home', 'chat', 'events', 'photos', 'focus', 'wardrobe', 'settings'])
      expect(parseRoute(`#${page}`)).toEqual({ page })
    expect(parseRoute('#missing')).toEqual({ page: 'home' })
  })
  it('round trips IDs without accepting redirects or unrelated query parameters', () => {
    expect(parseRoute(referenceLink('message', 'demo-123'))).toEqual({
      page: 'chat',
      referenceId: 'demo-123',
    })
    expect(parseRoute(referenceLink('event', '1234-5678'))).toEqual({
      page: 'events',
      referenceId: '1234-5678',
    })
    expect(parseRoute('#photos?message=123')).toEqual({ page: 'photos' })
    expect(parseRoute('#chat?event=123')).toEqual({ page: 'chat' })
    expect(parseRoute('#chat?message=https%3A%2F%2Fevil.test')).toEqual({ page: 'chat' })
    expect(parseRoute('#wardrobe?mode=split')).toEqual({ page: 'wardrobe', wardrobeMode: 'split' })
    expect(parseRoute('#wardrobe?mode=drawer')).toEqual({
      page: 'wardrobe',
      wardrobeMode: 'drawer',
    })
    expect(parseRoute('#wardrobe?mode=mirror')).toEqual({ page: 'wardrobe' })
    expect(parseRoute('#wardrobe?mode=invalid')).toEqual({ page: 'wardrobe' })
  })
  it('rejects malformed and excessive IDs', () => {
    for (const id of ['', '../x', '<script>', 'x'.repeat(81), '%'])
      expect(() => referenceLink('message', id)).toThrow('ID')
    expect(parseRoute('#chat?message=%FF')).toEqual({ page: 'chat' })
  })
})
