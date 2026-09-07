import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EventArt } from '../components/EventArt'
import { eventArtConfig, eventArtId, eventArtOptions } from './eventArt'
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
  })
  it('uses a safe default for unknown identifiers and does not inject markup', () => {
    const input = '<script>alert(1)</script>'
    expect(eventArtId(input)).toBe('heart')
    expect(renderToStaticMarkup(<EventArt value={input} />)).not.toContain('<script>')
  })
})
