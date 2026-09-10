import { CHARACTER_ANCHORS } from './anchors'
import type { CharacterId, Point } from './types'

/** 像素包围盒（含轮廓） */
export type Bounds = { x: number; y: number; w: number; h: number }

export type EarStyle = 'none' | 'small' | 'pointy' | 'long' | 'round' | 'tuft' | 'horns'

/**
 * 全局图层顺序（z-index 规则）：所有角色共用，保证渲染一致性。
 * PixelCharacter 按此顺序自下而上合成 SVG 图层。
 */
export const LAYER_ORDER = ['base', 'clothes', 'hat', 'accessory', 'special'] as const

/**
 * 角色视觉适配档案 (CharacterVisualProfile)
 *
 * 16 款角色共享同一套 Pixel Art 设计基准（80×88 画布、统一描边/阴影语言、
 * 统一站姿），但身体结构各不相同：颅顶高度、耳朵形态、躯干宽度、嘴部与
 * 腰部位置都逐角色测量（见 scripts/qa/measure.py 的输出）。
 *
 * 装备是通用资产，装备与角色之间的适配差异由本档案 + characterOverrides
 * 共同表达：
 * - hatAnchor / clothesAnchor / …：各图层在该角色身上的吸附点；
 * - hatScale / clothesScale / …：各图层在该角色身上的比例补偿；
 * - skullTopY / mouth / waist / ears：供 QA 与兼容性判断使用的结构参数。
 */
export type CharacterVisualProfile = {
  id: CharacterId
  /** 整体像素包围盒（含轮廓，80×88 画布坐标） */
  bodyBounds: Bounds
  /** 头部区域包围盒（含耳/角） */
  headBounds: Bounds
  /** 躯干区域包围盒（颈线以下） */
  torsoBounds: Bounds
  /** 双眼连线中心 */
  faceCenter: Point
  /** 左耳/右耳（或角、耳羽、眼泡）区域中心 */
  leftEar: Point
  rightEar: Point
  earStyle: EarStyle
  /** 颅顶 y（不含耳/角/呆毛），帽座基准线 */
  skullTopY: number
  /** 颈线 y（头/身分界） */
  neckY: number
  /** 嘴部/喙部中心 */
  mouth: Point
  /** 腰部中心（环身道具吸附） */
  waist: Point
  /** 帽类吸附点 */
  hatAnchor: Point
  hatScale: number
  /** 衣服吸附点 */
  clothesAnchor: Point
  clothesScale: number
  /** 胸前配饰吸附点 */
  accessoryAnchor: Point
  accessoryScale: number
  /** 手持道具吸附点 */
  handAnchor: Point
  /** 背负道具吸附点 */
  backAnchor: Point
  /** 特效层吸附点 */
  specialAnchor: Point
  specialScale: number
}

type ProfileSeed = {
  id: CharacterId
  bodyBounds: Bounds
  headBounds: Bounds
  torsoBounds: Bounds
  faceCenter: Point
  leftEar: Point
  rightEar: Point
  earStyle: EarStyle
  skullTopY: number
  neckY: number
  hatScale?: number
  clothesScale?: number
  accessoryScale?: number
  specialScale?: number
}

function defineProfile(seed: ProfileSeed): CharacterVisualProfile {
  const anchors = CHARACTER_ANCHORS[seed.id]
  return {
    ...seed,
    hatScale: seed.hatScale ?? 1,
    clothesScale: seed.clothesScale ?? 1,
    accessoryScale: seed.accessoryScale ?? 1,
    specialScale: seed.specialScale ?? 1,
    hatAnchor: anchors.head,
    clothesAnchor: anchors.body,
    accessoryAnchor: anchors.front,
    handAnchor: anchors.hand,
    backAnchor: anchors.back,
    specialAnchor: anchors.accessory,
    mouth: anchors.mouth,
    waist: anchors.waist,
  }
}

export const CHARACTER_VISUAL_PROFILES: Record<CharacterId, CharacterVisualProfile> = {
  dog: defineProfile({
    id: 'dog',
    bodyBounds: { x: 12, y: 4, w: 61, h: 77 },
    headBounds: { x: 12, y: 4, w: 61, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 33 },
    faceCenter: { x: 40, y: 28 },
    leftEar: { x: 20, y: 12 },
    rightEar: { x: 60, y: 12 },
    earStyle: 'small',
    skullTopY: 8,
    neckY: 48,
  }),
  cat: defineProfile({
    id: 'cat',
    bodyBounds: { x: 12, y: 8, w: 57, h: 73 },
    headBounds: { x: 12, y: 8, w: 57, h: 45 },
    torsoBounds: { x: 20, y: 52, w: 41, h: 29 },
    faceCenter: { x: 40, y: 32 },
    leftEar: { x: 20, y: 14 },
    rightEar: { x: 60, y: 14 },
    earStyle: 'pointy',
    skullTopY: 16,
    neckY: 52,
  }),
  bunny: defineProfile({
    id: 'bunny',
    bodyBounds: { x: 12, y: 0, w: 57, h: 81 },
    headBounds: { x: 12, y: 0, w: 57, h: 52 },
    torsoBounds: { x: 20, y: 52, w: 41, h: 29 },
    faceCenter: { x: 40, y: 40 },
    leftEar: { x: 24, y: 16 },
    rightEar: { x: 56, y: 16 },
    earStyle: 'long',
    skullTopY: 32,
    neckY: 52,
  }),
  bear: defineProfile({
    id: 'bear',
    bodyBounds: { x: 8, y: 4, w: 69, h: 81 },
    headBounds: { x: 8, y: 4, w: 69, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 37 },
    faceCenter: { x: 40, y: 32 },
    leftEar: { x: 18, y: 14 },
    rightEar: { x: 62, y: 14 },
    earStyle: 'round',
    skullTopY: 8,
    neckY: 48,
    clothesScale: 1.1, // 宽躯干：衣服需放大避免两侧露毛
  }),
  panda: defineProfile({
    id: 'panda',
    bodyBounds: { x: 8, y: 4, w: 69, h: 81 },
    headBounds: { x: 8, y: 4, w: 69, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 37 },
    faceCenter: { x: 40, y: 32 },
    leftEar: { x: 18, y: 10 },
    rightEar: { x: 62, y: 10 },
    earStyle: 'round',
    skullTopY: 8,
    neckY: 48,
    clothesScale: 1.1,
  }),
  fox: defineProfile({
    id: 'fox',
    bodyBounds: { x: 8, y: 0, w: 69, h: 85 },
    headBounds: { x: 8, y: 0, w: 69, h: 52 },
    torsoBounds: { x: 16, y: 52, w: 49, h: 33 },
    faceCenter: { x: 40, y: 27 },
    leftEar: { x: 16, y: 14 },
    rightEar: { x: 64, y: 14 },
    earStyle: 'pointy',
    skullTopY: 8,
    neckY: 52,
  }),
  penguin: defineProfile({
    id: 'penguin',
    bodyBounds: { x: 8, y: 4, w: 72, h: 81 },
    headBounds: { x: 8, y: 4, w: 72, h: 44 },
    torsoBounds: { x: 16, y: 48, w: 52, h: 37 },
    faceCenter: { x: 40, y: 28 },
    leftEar: { x: 20, y: 12 },
    rightEar: { x: 60, y: 12 },
    earStyle: 'none',
    skullTopY: 8,
    neckY: 48,
  }),
  duck: defineProfile({
    id: 'duck',
    bodyBounds: { x: 8, y: 4, w: 72, h: 81 },
    headBounds: { x: 8, y: 4, w: 72, h: 44 },
    torsoBounds: { x: 16, y: 48, w: 52, h: 37 },
    faceCenter: { x: 40, y: 28 },
    leftEar: { x: 20, y: 12 },
    rightEar: { x: 60, y: 12 },
    earStyle: 'none',
    skullTopY: 8,
    neckY: 48,
  }),
  frog: defineProfile({
    id: 'frog',
    bodyBounds: { x: 8, y: 0, w: 65, h: 85 },
    headBounds: { x: 8, y: 0, w: 65, h: 52 },
    torsoBounds: { x: 16, y: 52, w: 49, h: 33 },
    faceCenter: { x: 40, y: 11 }, // 眼泡即青蛙的"眼睛"
    leftEar: { x: 22, y: 8 },
    rightEar: { x: 58, y: 8 },
    earStyle: 'tuft',
    skullTopY: 8,
    neckY: 52,
  }),
  hamster: defineProfile({
    id: 'hamster',
    bodyBounds: { x: 4, y: 4, w: 73, h: 73 },
    headBounds: { x: 4, y: 4, w: 73, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 29 },
    faceCenter: { x: 40, y: 28 },
    leftEar: { x: 20, y: 10 },
    rightEar: { x: 60, y: 10 },
    earStyle: 'small',
    skullTopY: 8,
    neckY: 48,
  }),
  chick: defineProfile({
    id: 'chick',
    bodyBounds: { x: 8, y: 0, w: 72, h: 85 },
    headBounds: { x: 8, y: 0, w: 72, h: 48 },
    torsoBounds: { x: 16, y: 48, w: 52, h: 37 },
    faceCenter: { x: 40, y: 27 },
    leftEar: { x: 40, y: 4 }, // 中央呆毛
    rightEar: { x: 40, y: 4 },
    earStyle: 'tuft',
    skullTopY: 8,
    neckY: 48,
  }),
  koala: defineProfile({
    id: 'koala',
    bodyBounds: { x: 4, y: 8, w: 73, h: 73 },
    headBounds: { x: 4, y: 8, w: 73, h: 41 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 33 },
    faceCenter: { x: 40, y: 27 },
    leftEar: { x: 12, y: 18 },
    rightEar: { x: 68, y: 18 },
    earStyle: 'round',
    skullTopY: 16,
    neckY: 48,
  }),
  chinchilla: defineProfile({
    id: 'chinchilla',
    bodyBounds: { x: 8, y: 4, w: 69, h: 81 },
    headBounds: { x: 8, y: 4, w: 69, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 37 },
    faceCenter: { x: 40, y: 29 },
    leftEar: { x: 18, y: 14 },
    rightEar: { x: 62, y: 14 },
    earStyle: 'long',
    skullTopY: 8,
    neckY: 48,
  }),
  otter: defineProfile({
    id: 'otter',
    bodyBounds: { x: 4, y: 4, w: 76, h: 77 },
    headBounds: { x: 4, y: 4, w: 76, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 56, h: 33 },
    faceCenter: { x: 40, y: 27 },
    leftEar: { x: 20, y: 10 },
    rightEar: { x: 60, y: 10 },
    earStyle: 'small',
    skullTopY: 8,
    neckY: 48,
    clothesScale: 1.08,
  }),
  sheep: defineProfile({
    id: 'sheep',
    bodyBounds: { x: 8, y: 4, w: 72, h: 77 },
    headBounds: { x: 8, y: 4, w: 72, h: 45 },
    torsoBounds: { x: 16, y: 48, w: 52, h: 33 },
    faceCenter: { x: 40, y: 31 },
    leftEar: { x: 16, y: 14 },
    rightEar: { x: 64, y: 14 },
    earStyle: 'horns',
    skullTopY: 6,
    neckY: 48,
    clothesScale: 1.06,
  }),
  owl: defineProfile({
    id: 'owl',
    bodyBounds: { x: 8, y: 2, w: 69, h: 81 },
    headBounds: { x: 8, y: 2, w: 69, h: 46 },
    torsoBounds: { x: 16, y: 48, w: 49, h: 35 },
    faceCenter: { x: 40, y: 24 },
    leftEar: { x: 24, y: 5 },
    rightEar: { x: 56, y: 5 },
    earStyle: 'tuft',
    skullTopY: 8,
    neckY: 48,
  }),
  pig: defineProfile({
    id: 'pig',
    bodyBounds: { x: 8, y: 8, w: 69, h: 77 },
    headBounds: { x: 8, y: 8, w: 69, h: 45 },
    torsoBounds: { x: 16, y: 52, w: 49, h: 33 },
    faceCenter: { x: 40, y: 32 },
    leftEar: { x: 18, y: 14 },
    rightEar: { x: 62, y: 14 },
    earStyle: 'pointy',
    skullTopY: 12,
    neckY: 52,
    clothesScale: 1.08,
  }),
}

export function getVisualProfile(characterId: CharacterId | string): CharacterVisualProfile {
  return CHARACTER_VISUAL_PROFILES[characterId as CharacterId] || CHARACTER_VISUAL_PROFILES.cat
}
