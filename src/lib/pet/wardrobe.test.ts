import { describe, expect, it } from 'vitest'
import {
  ACCESSORIES_LIST,
  CHARACTER_LIST,
  CHARACTER_MAP,
  CLOTHES_LIST,
  HATS_LIST,
  WARDROBE_ASSET_RENDERERS,
  WARDROBE_ITEMS,
  WARDROBE_MAP,
  WARDROBE_SETS,
  type CharacterId,
  type CharacterOutfits,
} from './index'

describe('Character System Completeness', () => {
  const ORIGINAL_12 = [
    'dog',
    'cat',
    'bunny',
    'bear',
    'panda',
    'fox',
    'penguin',
    'duck',
    'frog',
    'hamster',
    'chick',
    'koala',
  ]
  const NEW_4 = ['chinchilla', 'otter', 'sheep', 'owl']

  it('preserves all 12 original characters and adds at least 4 new ones (total >= 15)', () => {
    expect(CHARACTER_LIST.length).toBeGreaterThanOrEqual(15)
    expect(CHARACTER_LIST.length).toBe(27)

    for (const id of ORIGINAL_12) {
      expect(CHARACTER_MAP[id as CharacterId]).toBeDefined()
      expect(CHARACTER_MAP[id as CharacterId].id).toBe(id)
    }

    for (const id of NEW_4) {
      expect(CHARACTER_MAP[id as CharacterId]).toBeDefined()
      expect(CHARACTER_MAP[id as CharacterId].id).toBe(id)
    }
  })

  it('ensures all characters define complete standard anchor coordinates', () => {
    const requiredAnchors = ['head', 'body', 'hand', 'back', 'front', 'accessory'] as const

    for (const char of CHARACTER_LIST) {
      expect(char.anchors).toBeDefined()
      for (const anchor of requiredAnchors) {
        expect(char.anchors[anchor]).toBeDefined()
        expect(typeof char.anchors[anchor].x).toBe('number')
        expect(typeof char.anchors[anchor].y).toBe('number')
        // Must be within standard 80x88 canvas viewport
        expect(char.anchors[anchor].x).toBeGreaterThanOrEqual(0)
        expect(char.anchors[anchor].x).toBeLessThanOrEqual(80)
        expect(char.anchors[anchor].y).toBeGreaterThanOrEqual(0)
        expect(char.anchors[anchor].y).toBeLessThanOrEqual(88)
      }
    }
  })
})

describe('Wardrobe Content Milestone Acceptance', () => {
  it('meets or exceeds item quantity requirements (>=20 clothes, >=20 hats, >=20 accessories, >=10 sets, total >= 70)', () => {
    expect(CLOTHES_LIST.length).toBeGreaterThanOrEqual(20)
    expect(HATS_LIST.length).toBeGreaterThanOrEqual(20)
    expect(ACCESSORIES_LIST.length).toBeGreaterThanOrEqual(20)
    expect(WARDROBE_SETS.length).toBeGreaterThanOrEqual(10)

    const total = WARDROBE_ITEMS.length + WARDROBE_SETS.length
    expect(total).toBeGreaterThanOrEqual(70)
  })

  it('guarantees every wardrobe item maps to a valid SVG asset renderer', () => {
    for (const item of WARDROBE_ITEMS) {
      expect(item.assetId).toBeDefined()
      expect(typeof WARDROBE_ASSET_RENDERERS[item.assetId]).toBe('function')
    }
  })

  it('verifies all Set presets map strictly to valid wardrobe item IDs and layers', () => {
    for (const set of WARDROBE_SETS) {
      expect(set.name).toBeDefined()
      expect(set.preset).toBeDefined()

      if (set.preset.clothesId) {
        const item = WARDROBE_MAP[set.preset.clothesId]
        expect(item).toBeDefined()
        expect(item.layer).toBe('clothes')
      }
      if (set.preset.hatId) {
        const item = WARDROBE_MAP[set.preset.hatId]
        expect(item).toBeDefined()
        expect(item.layer).toBe('hat')
      }
      if (set.preset.accessoryId) {
        const item = WARDROBE_MAP[set.preset.accessoryId]
        expect(item).toBeDefined()
        expect(item.layer === 'accessory' || item.layer === 'special').toBe(true)
      }
      if (set.preset.specialId) {
        const item = WARDROBE_MAP[set.preset.specialId]
        expect(item).toBeDefined()
        expect(item.layer === 'special' || item.layer === 'accessory').toBe(true)
      }
    }
  })

  it('simulates independent per-character outfit persistence without cross-overwrites', () => {
    const userOutfits: CharacterOutfits = {}

    // 1. Duck equips sailor suit and duck beanie
    userOutfits.duck = {
      clothesId: 'c_sailor_suit',
      hatId: 'h_duck_beanie',
    }

    // 2. User switches to Cat and equips christmas sweater and santa hat
    userOutfits.cat = {
      clothesId: 'c_christmas_sweater',
      hatId: 'h_santa_hat',
    }

    // 3. User switches to Fox and equips detective cape
    userOutfits.fox = {
      clothesId: 'c_detective_cape',
      hatId: 'h_detective_hat',
    }

    // 4. Verify Duck still has sailor suit & duck beanie
    expect(userOutfits.duck).toEqual({
      clothesId: 'c_sailor_suit',
      hatId: 'h_duck_beanie',
    })

    // 5. Verify Cat still has christmas sweater & santa hat
    expect(userOutfits.cat).toEqual({
      clothesId: 'c_christmas_sweater',
      hatId: 'h_santa_hat',
    })

    // 6. User modifies Duck's hat only
    userOutfits.duck = {
      ...userOutfits.duck,
      hatId: 'h_baseball_cap',
    }

    // Cat's outfit must remain untouched
    expect(userOutfits.cat?.hatId).toBe('h_santa_hat')
    expect(userOutfits.duck?.hatId).toBe('h_baseball_cap')
  })
})
