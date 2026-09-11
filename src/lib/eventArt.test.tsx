import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EventArt } from '../components/EventArt'
import {
  eventArtConfig,
  eventArtId,
  eventArtOptions,
  filterEventArt,
  eventArtGroups,
} from './eventArt'
describe('SVG event art compatibility', () => {
  it('maps existing emoji records without rewriting stored data', () => {
    expect(eventArtId('🎂')).toBe('cake')
    expect(eventArtId('🌊')).toBe('sea')
    expect(eventArtId('🚃')).toBe('train')
    expect(eventArtConfig('🎂').tone).toBe('lilac')
    const markup = renderToStaticMarkup(<EventArt value="🎂" />)
    expect(markup).toContain('<svg')
    expect(markup).not.toContain('🎂')
  })
  it.each(eventArtOptions)('$id has an SVG renderer and fits the existing DB CHECK', (option) => {
    const token = `icon:${option.id}`
    expect(token.length).toBeLessThanOrEqual(16)
    expect(eventArtId(token)).toBe(option.id)
    const markup = renderToStaticMarkup(<EventArt value={token} />)
    expect(markup).toMatch(/<(svg|img)/)
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toMatch(/(<path|<img)/)
  })
  it('uses a safe default for unknown identifiers and does not inject markup', () => {
    const input = '<script>alert(1)</script>'
    expect(eventArtId(input)).toBe('heart')
    expect(renderToStaticMarkup(<EventArt value={input} />)).not.toContain('<script>')
  })
})

describe('expanded picker search and groups', () => {
  it('exposes one hundred and sixty-four unique choices and keeps all categorized', () => {
    expect(eventArtOptions).toHaveLength(164)
    expect(new Set(eventArtOptions.map((option) => option.id)).size).toBe(164)
    for (const group of eventArtGroups.filter((g) => g.id !== 'all')) {
      expect(filterEventArt(group.id, '').length).toBeGreaterThan(0)
      expect(filterEventArt(group.id, '').every((option) => option.group === group.id)).toBe(true)
    }
    expect(filterEventArt('friends', '')).toHaveLength(10)
  })
  it('matches Chinese aliases and case-insensitive English terms', () => {
    expect(filterEventArt('all', '考研').map((o) => o.id)).toEqual(['book', 'flag'])
    expect(filterEventArt('friends', ' BEAR ').map((o) => o.id)).toEqual(['bear'])
    expect(filterEventArt('friends', '机甲').map((o) => o.id)).toEqual(['robot'])
    expect(filterEventArt('travel', '自驾').map((o) => o.id)).toEqual(['car'])
    expect(filterEventArt('food', '微醺').map((o) => o.id)).toEqual(['wine'])
    expect(filterEventArt('daily', '赖床').map((o) => o.id)).toEqual(['bed'])
    expect(filterEventArt('all', 'music').map((o) => o.id)).toEqual(['music'])
  })
  it('combines group and query without changing the underlying options', () => {
    expect(filterEventArt('travel', '熊')).toEqual([])
    expect(filterEventArt('all', '')).toHaveLength(164)
  })
})
