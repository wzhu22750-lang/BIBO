import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BibuSendControl } from './BibuSendControl'
import type { BibuAction } from '../../hooks/useBibu'

describe('BibuSendControl Component', () => {
  const mockBibu: BibuAction = {
    send: vi.fn().mockResolvedValue(undefined),
    busy: false,
    cooling: false,
    kind: '哔卟哔卟',
    setKind: vi.fn(),
    disabled: false,
  }

  it('renders BIBU trigger button with accessible labels and attributes', () => {
    const html = renderToStaticMarkup(<BibuSendControl bibu={mockBibu} />)

    // Check trigger button presence
    expect(html).toContain('dock-bibo')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('aria-label="BIBU！，长按滑动切换情绪，当前：哔卟哔卟"')
    expect(html).toContain('BIBU！')

    // SVG vector icon inside trigger button
    expect(html).toContain('<svg viewBox="0 0 76 76"')
  })

  it('reflects disabled state properly on button', () => {
    const disabledBibu: BibuAction = {
      ...mockBibu,
      disabled: true,
    }
    const html = renderToStaticMarkup(<BibuSendControl bibu={disabledBibu} />)
    expect(html).toContain('disabled=""')
  })
})
