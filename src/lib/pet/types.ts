export const CHARACTER_IDS = [
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
  'chinchilla',
  'otter',
  'sheep',
  'owl',
  'pig',
  'tiger',
  'lion',
  'deer',
  'seal',
  'elephant',
  'hedgehog',
  'redpanda',
  'whale',
  'monkey',
  'cow',
] as const

export type CharacterId = (typeof CHARACTER_IDS)[number]

export type AnchorType =
  'head' | 'body' | 'hand' | 'back' | 'front' | 'accessory' | 'mouth' | 'waist'

export type Point = {
  x: number
  y: number
}

export type CharacterAnchors = Record<AnchorType, Point>

export type CharacterDefinition = {
  id: CharacterId
  name: string
  tag: string
  description: string
  anchors: CharacterAnchors
}

export type WardrobeCategory = 'clothes' | 'hats' | 'accessories' | 'sets' | 'special'

export type WardrobeLayer = 'clothes' | 'hat' | 'accessory' | 'special'

/**
 * 单件装备针对单个角色的视觉适配覆写。
 * 装备是通用资产，但允许与特定角色之间存在适配差异：
 * - offset / scale：微调位置与比例
 * - visible=false：标记该角色不适配此装备（兼容性矩阵入口）
 */
export type CharacterItemOverride = {
  offset?: Point
  scale?: number
  visible?: boolean
}

export type WardrobeItem = {
  id: string
  name: string
  category: WardrobeCategory
  layer: WardrobeLayer
  anchor: AnchorType
  offset: Point
  scale?: number
  /** @deprecated 请使用 characterOverrides[char].offset，保留仅为兼容旧数据 */
  characterOffsets?: Partial<Record<CharacterId, Point>>
  /** 角色级适配覆写（位置 / 比例 / 是否兼容） */
  characterOverrides?: Partial<Record<CharacterId, CharacterItemOverride>>
  /** 白名单：若提供，则仅这些角色兼容此装备 */
  compatibleCharacters?: CharacterId[]
  assetId: string
  metadata?: {
    tag?: string
    couplePairId?: string
  }
}

export type Outfit = {
  clothesId?: string
  hatId?: string
  accessoryId?: string
  specialId?: string
}

export type CharacterOutfits = Partial<Record<CharacterId, Outfit>>

export type WardrobeSet = {
  id: string
  name: string
  description: string
  tag?: string
  preset: Outfit
}
