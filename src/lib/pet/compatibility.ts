import { CHARACTER_ANCHORS } from './anchors'
import { getVisualProfile } from './visualProfiles'
import type { CharacterId, Outfit, Point, WardrobeItem, WardrobeSet } from './types'
import { WARDROBE_MAP } from './wardrobe'

/**
 * 装备兼容性矩阵 & 适配解析 (Compatibility Matrix / Placement Resolver)
 *
 * 核心原则："装备是通用资产，但装备与角色之间必须允许存在适配差异。"
 *
 * 解析顺序（后者覆盖前者）：
 * 1. 角色锚点表 CHARACTER_ANCHORS（逐角色测量的 head/body/mouth/waist/…）
 * 2. 角色视觉档案的图层比例补偿（clothesScale 等）
 * 3. 装备自身的全局 offset / scale
 * 4. 装备的 characterOverrides[char]（offset / scale / visible）
 *
 * 兼容性判定：
 * - compatibleCharacters 白名单存在且不包含该角色 → incompatible
 * - characterOverrides[char].visible === false → incompatible
 * incompatible 的装备在该角色身上不渲染，且在衣橱中标记为"不适配"。
 */

export type ItemPlacement = {
  x: number
  y: number
  scale: number
  visible: boolean
  /** 解析来源，供 QA 面板展示 */
  anchor: Point
  offset: Point
  overrideOffset: Point
  overrideScale: number
  layerScale: number
}

export type CompatibilityStatus = 'compatible' | 'incompatible' | 'custom'

export function getCharacterOverride(
  item: WardrobeItem,
  characterId: CharacterId,
): { offset?: Point; scale?: number; visible?: boolean } | undefined {
  return item.characterOverrides?.[characterId]
}

/** 兼容性矩阵查询：compatible / incompatible / custom(存在位置或比例覆写) */
export function getCompatibilityStatus(
  characterId: CharacterId,
  item: WardrobeItem,
): CompatibilityStatus {
  if (item.compatibleCharacters && !item.compatibleCharacters.includes(characterId)) {
    return 'incompatible'
  }
  const override = getCharacterOverride(item, characterId)
  if (override?.visible === false) return 'incompatible'
  const hasCustom =
    !!override?.offset ||
    typeof override?.scale === 'number' ||
    !!item.characterOffsets?.[characterId]
  return hasCustom ? 'custom' : 'compatible'
}

export function isItemCompatible(characterId: CharacterId, item: WardrobeItem): boolean {
  return getCompatibilityStatus(characterId, item) !== 'incompatible'
}

export function filterCompatibleItems<T extends WardrobeItem>(
  characterId: CharacterId,
  items: T[],
): T[] {
  return items.filter((item) => isItemCompatible(characterId, item))
}

function layerScaleFor(characterId: CharacterId, item: WardrobeItem): number {
  const profile = getVisualProfile(characterId)
  switch (item.layer) {
    case 'clothes':
      return profile.clothesScale
    case 'hat':
      return profile.hatScale
    case 'accessory':
      return profile.accessoryScale
    case 'special':
      return profile.specialScale
    default:
      return 1
  }
}

/** 解析某件装备在某角色身上的最终位置 / 比例 / 可见性 */
export function resolveItemPlacement(characterId: CharacterId, item: WardrobeItem): ItemPlacement {
  const anchors = CHARACTER_ANCHORS[characterId] || CHARACTER_ANCHORS.cat
  const anchor = anchors[item.anchor] || { x: 40, y: 50 }
  const baseOffset = item.offset || { x: 0, y: 0 }
  const legacyOffset = item.characterOffsets?.[characterId] || { x: 0, y: 0 }
  const override = getCharacterOverride(item, characterId)
  const overrideOffset = override?.offset || { x: 0, y: 0 }

  const x = anchor.x + baseOffset.x + legacyOffset.x + overrideOffset.x
  const y = anchor.y + baseOffset.y + legacyOffset.y + overrideOffset.y
  const layerScale = layerScaleFor(characterId, item)
  const overrideScale = typeof override?.scale === 'number' ? override.scale : 1
  const scale = layerScale * (item.scale ?? 1) * overrideScale
  const visible = isItemCompatible(characterId, item)

  return {
    x,
    y,
    scale,
    visible,
    anchor,
    offset: baseOffset,
    overrideOffset: {
      x: legacyOffset.x + overrideOffset.x,
      y: legacyOffset.y + overrideOffset.y,
    },
    overrideScale,
    layerScale,
  }
}

/** 套装在当前角色上的解析结果：跳过不适配单品，保证视觉成立 */
export type ResolvedSet = {
  outfit: Outfit
  /** 因不适配而被跳过的单品 ID */
  skippedItemIds: string[]
  compatible: boolean
}

export function resolveSetForCharacter(characterId: CharacterId, set: WardrobeSet): ResolvedSet {
  const outfit: Outfit = {}
  const skippedItemIds: string[] = []

  const slots: Array<[keyof Outfit, string | undefined]> = [
    ['clothesId', set.preset.clothesId],
    ['hatId', set.preset.hatId],
    ['accessoryId', set.preset.accessoryId],
    ['specialId', set.preset.specialId],
  ]

  for (const [slot, itemId] of slots) {
    if (!itemId) continue
    const item = WARDROBE_MAP[itemId]
    if (!item) continue
    if (isItemCompatible(characterId, item)) {
      outfit[slot] = itemId
    } else {
      skippedItemIds.push(itemId)
    }
  }

  return { outfit, skippedItemIds, compatible: skippedItemIds.length === 0 }
}
