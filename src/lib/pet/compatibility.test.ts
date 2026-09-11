import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { PixelCharacter } from '../../components/pet/PixelCharacter'
import {
  CHARACTER_ANCHORS,
  CHARACTER_IDS,
  CHARACTER_LIST,
  CHARACTER_VISUAL_PROFILES,
  WARDROBE_ITEMS,
  WARDROBE_MAP,
  WARDROBE_SETS,
  getCompatibilityStatus,
  getRandomOutfit,
  isItemCompatible,
  resolveItemPlacement,
  resolveSetForCharacter,
  type CharacterId,
} from './index'

describe('CharacterVisualProfile 基准', () => {
  it('每个角色都拥有完整的视觉档案', () => {
    for (const id of CHARACTER_IDS) {
      const profile = CHARACTER_VISUAL_PROFILES[id]
      expect(profile, id).toBeDefined()
      expect(profile.bodyBounds.w).toBeGreaterThan(0)
      expect(profile.headBounds.w).toBeGreaterThan(0)
      expect(profile.torsoBounds.w).toBeGreaterThan(0)
      expect(profile.skullTopY).toBeGreaterThanOrEqual(0)
      expect(profile.neckY).toBeGreaterThan(profile.skullTopY)
      expect(profile.hatAnchor.y).toBe(profile.skullTopY + 6)
      expect(profile.clothesScale).toBeGreaterThanOrEqual(1)
      expect(profile.clothesScale).toBeLessThanOrEqual(1.2)
    }
  })

  it('每个角色都定义了 mouth / waist 锚点且落在画布内', () => {
    for (const id of CHARACTER_IDS) {
      const anchors = CHARACTER_ANCHORS[id]
      for (const key of ['mouth', 'waist'] as const) {
        expect(anchors[key], `${id}.${key}`).toBeDefined()
        expect(anchors[key].x).toBeGreaterThanOrEqual(0)
        expect(anchors[key].x).toBeLessThanOrEqual(80)
        expect(anchors[key].y).toBeGreaterThanOrEqual(0)
        expect(anchors[key].y).toBeLessThanOrEqual(88)
      }
    }
  })

  it('帽座锚点位于颅顶之下（帽子不再悬空）', () => {
    // 小兔颅顶 y=32，帽座 y=38：帽类资产底边(局部 -2) 落在 y=36，压住颅顶
    expect(CHARACTER_ANCHORS.bunny.head.y).toBe(38)
    // 小猫/考拉颅顶 y=16
    expect(CHARACTER_ANCHORS.cat.head.y).toBe(22)
    expect(CHARACTER_ANCHORS.koala.head.y).toBe(22)
  })
})

describe('装备兼容性矩阵', () => {
  it('所有装备的 anchor 类型在每个角色上都可解析', () => {
    for (const item of WARDROBE_ITEMS) {
      for (const id of CHARACTER_IDS) {
        const placement = resolveItemPlacement(id, item)
        expect(Number.isFinite(placement.x), `${item.id}@${id}`).toBe(true)
        expect(Number.isFinite(placement.y), `${item.id}@${id}`).toBe(true)
        expect(placement.scale).toBeGreaterThan(0)
      }
    }
  })

  it('默认兼容全部角色，除非显式标记', () => {
    const scarf = WARDROBE_MAP.a_red_scarf
    expect(getCompatibilityStatus('cat', scarf)).toBe('compatible')
    expect(getCompatibilityStatus('penguin', scarf)).toBe('incompatible')
    expect(getCompatibilityStatus('hamster', scarf)).toBe('incompatible')

    const catEars = WARDROBE_MAP.h_cat_ears
    expect(getCompatibilityStatus('bunny', catEars)).toBe('incompatible')
    expect(getCompatibilityStatus('chinchilla', catEars)).toBe('incompatible')
    expect(getCompatibilityStatus('owl', catEars)).toBe('incompatible')
    expect(getCompatibilityStatus('dog', catEars)).toBe('compatible')

    const antlers = WARDROBE_MAP.h_deer_antlers
    expect(getCompatibilityStatus('bunny', antlers)).toBe('incompatible')
    expect(getCompatibilityStatus('fox', antlers)).toBe('compatible')
  })

  it('incompatible 装备在渲染时被跳过（不产生图层节点）', () => {
    const svg = renderToStaticMarkup(
      createElement(PixelCharacter, {
        character: 'penguin',
        outfit: { accessoryId: 'a_red_scarf' },
      }),
    )
    expect(svg).not.toContain('layer-accessory')

    const svgOk = renderToStaticMarkup(
      createElement(PixelCharacter, {
        character: 'dog',
        outfit: { accessoryId: 'a_red_scarf' },
      }),
    )
    expect(svgOk).toContain('layer-accessory')
  })

  it('口部/环身道具吸附到逐角色 mouth / waist 锚点', () => {
    const toast = WARDROBE_MAP.a_toast_mouth
    for (const id of CHARACTER_IDS) {
      const placement = resolveItemPlacement(id, toast)
      expect(placement.y, `toast@${id}`).toBe(CHARACTER_ANCHORS[id].mouth.y)
    }
    const ring = WARDROBE_MAP.a_beach_swim_ring
    for (const id of CHARACTER_IDS) {
      const placement = resolveItemPlacement(id, ring)
      expect(placement.y, `ring@${id}`).toBe(CHARACTER_ANCHORS[id].waist.y)
    }
  })

  it('宽躯干角色拥有衣服比例补偿', () => {
    expect(CHARACTER_VISUAL_PROFILES.bear.clothesScale).toBeGreaterThan(1)
    expect(CHARACTER_VISUAL_PROFILES.panda.clothesScale).toBeGreaterThan(1)
    const bearPlacement = resolveItemPlacement('bear', WARDROBE_MAP.c_blue_hoodie)
    const catPlacement = resolveItemPlacement('cat', WARDROBE_MAP.c_blue_hoodie)
    expect(bearPlacement.scale).toBeGreaterThan(catPlacement.scale)
  })
})

describe('套装与随机穿搭的角色适配', () => {
  it('套装在当前角色上跳过不适配单品', () => {
    const christmas = WARDROBE_SETS.find((s) => s.id === 'set_christmas')!
    const onPenguin = resolveSetForCharacter('penguin', christmas)
    expect(onPenguin.compatible).toBe(false)
    expect(onPenguin.skippedItemIds).toContain('a_red_scarf')
    expect(onPenguin.outfit.accessoryId).toBeUndefined()
    expect(onPenguin.outfit.hatId).toBe('h_santa_hat')

    const onDog = resolveSetForCharacter('dog', christmas)
    expect(onDog.compatible).toBe(true)
    expect(onDog.outfit.accessoryId).toBe('a_red_scarf')
  })

  it('所有套装在全部角色上至少保留一件单品', () => {
    for (const set of WARDROBE_SETS) {
      for (const id of CHARACTER_IDS) {
        const resolved = resolveSetForCharacter(id, set)
        const pieces = Object.values(resolved.outfit).filter(Boolean).length
        expect(pieces, `${set.id}@${id}`).toBeGreaterThan(0)
      }
    }
  })

  it('随机穿搭不会抽到当前角色不适配的单品', () => {
    for (let i = 0; i < 200; i++) {
      const bunnyOutfit = getRandomOutfit('bunny')
      if (bunnyOutfit.hatId) {
        expect(isItemCompatible('bunny', WARDROBE_MAP[bunnyOutfit.hatId])).toBe(true)
      }
      const penguinOutfit = getRandomOutfit('penguin')
      if (penguinOutfit.accessoryId) {
        expect(isItemCompatible('penguin', WARDROBE_MAP[penguinOutfit.accessoryId])).toBe(true)
      }
    }
  })
})

describe('角色设计基准（统一风格、不统一结构）', () => {
  it('27 款角色共享同一画布基准但身体结构参数互不相同', () => {
    expect(CHARACTER_LIST.length).toBe(27)
    const skullTops = new Set(CHARACTER_IDS.map((id) => CHARACTER_VISUAL_PROFILES[id].skullTopY))
    const earStyles = new Set(CHARACTER_IDS.map((id) => CHARACTER_VISUAL_PROFILES[id].earStyle))
    // 颅顶高度至少 4 种、耳朵形态至少 5 种：结构差异被显式建模
    expect(skullTops.size).toBeGreaterThanOrEqual(4)
    expect(earStyles.size).toBeGreaterThanOrEqual(5)
  })

  it('兼容性标记不破坏存量数据：normalize 仍接受被限制装备的旧穿搭', async () => {
    const { normalizeOutfit } = await import('./normalize')
    const cleaned = normalizeOutfit({ accessoryId: 'a_red_scarf', hatId: 'h_cat_ears' })
    expect(cleaned.accessoryId).toBe('a_red_scarf')
    expect(cleaned.hatId).toBe('h_cat_ears')
  })

  it('character 类型 ID 全覆盖', () => {
    const ids: CharacterId[] = CHARACTER_IDS.slice()
    expect(ids).toContain('owl')
    expect(ids).toContain('chinchilla')
    expect(ids).toContain('pig')
  })
})
