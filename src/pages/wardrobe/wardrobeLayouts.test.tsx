import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { WardrobeSplitLayout } from './WardrobeSplitLayout'
import { WardrobeDrawerLayout } from './WardrobeDrawerLayout'
import { Wardrobe } from '../Wardrobe'
import type { SharedWardrobeProps } from './types'

describe('Wardrobe Multi-Prototype Layout Architecture', () => {
  const mockProps: SharedWardrobeProps = {
    activeChar: 'bunny',
    outfits: {
      bunny: {
        clothesId: 'c_sailor_suit',
        hatId: 'h_beret_pink',
      },
    },
    currentOutfit: {
      clothesId: 'c_sailor_suit',
      hatId: 'h_beret_pink',
    },
    deployedAvatar: 'bunny',
    isDeployed: true,
    anim: 'none',
    busy: false,
    triggerBounce: vi.fn(),
    onSelectCharacter: vi.fn(),
    onOutfitChange: vi.fn(),
    onItemEquipped: vi.fn(),
    onSetDeployed: vi.fn(),
    onSave: vi.fn(),
    navigate: vi.fn(),
  }

  it('renders Split layout with sticky top stage and animal carousel', () => {
    const html = renderToStaticMarkup(<WardrobeSplitLayout {...mockProps} />)
    expect(html).toContain('wardrobe-split-view')
    expect(html).toContain('split-sticky-stage')
    expect(html).toContain('split-char-carousel')
    expect(html).toContain('split-scrollable-catalog')
    expect(html).toContain('青春水手服')
  })

  it('renders Drawer layout without blocking dark backdrop, with live fitting studio and sliding sheet', () => {
    const html = renderToStaticMarkup(<WardrobeDrawerLayout {...mockProps} />)
    expect(html).toContain('wardrobe-drawer-view')
    expect(html).toContain('snap-half')
    // Crucial: No dark backdrop blocking stage interaction
    expect(html).not.toContain('drawer-backdrop')
    // Studio stage with pet
    expect(html).toContain('drawer-fitting-studio-card')
    expect(html).toContain('fitting-mirror-stage')
    // Horizontal animal switcher is available in fitting studio
    expect(html).toContain('fitting-animal-carousel')
    // Drawer sheet with wardrobe items
    expect(html).toContain('drawer-sheet')
    expect(html).toContain('drawer-handle-bar')
    expect(html).toContain('drawer-sheet-body')
  })

  it('renders official Wardrobe page with Split Screen layout and no mode switcher', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockController: any = {
      space: {
        me: {
          id: 'u1',
          name: 'Player',
          avatar: 'bunny',
          outfits: {},
        },
        couple: {
          together_since: '2026-01-01',
        },
        partner: null,
      },
      save: vi.fn(),
    }
    const html = renderToStaticMarkup(<Wardrobe controller={mockController} navigate={vi.fn()} />)
    expect(html).toContain('wardrobe-page layout-split')
    expect(html).toContain('split-sticky-stage')
    // No prototype switcher buttons
    expect(html).not.toContain('wardrobe-mode-switcher-container')
  })
})
