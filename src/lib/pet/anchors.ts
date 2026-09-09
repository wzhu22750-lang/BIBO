import type { CharacterAnchors, CharacterId } from './types'

/**
 * 角色锚点表 (Character Anchors)
 *
 * 每个锚点均基于 scripts/qa/measure.py 对角色基础立绘的像素级测量结果设定：
 * - head：帽座锚点 = 颅顶(skullTop, 不含耳朵/角/呆毛) + 6px，
 *   使帽类资产底边(局部 y=-2)压住颅顶约 4px，杜绝悬空；
 * - body：衣服锚点，位于胸腔上沿；
 * - mouth：嘴部/喙部中心，供"咬吐司"一类口部道具吸附；
 * - waist：腰部中心，供游泳圈一类环身道具吸附；
 * - hand / back / front / accessory：手持、背负、胸前与特效锚点。
 *
 * 注意：不同角色的颅顶、嘴部、腰部高度完全不同（例如小兔颅顶 y=32、
 * 小猫颅顶 y=16），因此锚点必须逐角色定义，不能共享全局默认值。
 */
export const DEFAULT_ANCHORS: CharacterAnchors = {
  head: { x: 40, y: 14 },
  body: { x: 40, y: 56 },
  hand: { x: 60, y: 56 },
  back: { x: 24, y: 52 },
  front: { x: 40, y: 52 },
  accessory: { x: 40, y: 44 },
  mouth: { x: 40, y: 42 },
  waist: { x: 40, y: 60 },
}

export const CHARACTER_ANCHORS: Record<CharacterId, CharacterAnchors> = {
  dog: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 56 },
    hand: { x: 62, y: 58 },
    back: { x: 20, y: 54 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 42 },
    waist: { x: 40, y: 60 },
  },
  cat: {
    head: { x: 40, y: 22 }, // skullTop 16（双耳之间的黑色额带之上）
    body: { x: 40, y: 56 },
    hand: { x: 60, y: 56 },
    back: { x: 22, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 46 },
    waist: { x: 40, y: 60 },
  },
  bunny: {
    head: { x: 40, y: 38 }, // skullTop 32：长耳之间的颅顶，帽子必须坐在这里而非耳尖
    body: { x: 40, y: 60 },
    hand: { x: 60, y: 60 },
    back: { x: 22, y: 56 },
    front: { x: 40, y: 56 },
    accessory: { x: 40, y: 46 },
    mouth: { x: 40, y: 46 },
    waist: { x: 40, y: 64 },
  },
  bear: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 60 },
    hand: { x: 62, y: 60 },
    back: { x: 20, y: 56 },
    front: { x: 40, y: 56 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 42 },
    waist: { x: 40, y: 64 },
  },
  panda: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 56 },
    hand: { x: 62, y: 56 },
    back: { x: 20, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 46 },
    waist: { x: 40, y: 62 },
  },
  fox: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 56 },
    hand: { x: 60, y: 56 },
    back: { x: 22, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 46 },
    waist: { x: 40, y: 60 },
  },
  penguin: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 52 },
    hand: { x: 62, y: 52 },
    back: { x: 22, y: 48 },
    front: { x: 40, y: 48 },
    accessory: { x: 40, y: 42 },
    mouth: { x: 40, y: 35 }, // 喙中心
    waist: { x: 40, y: 64 },
  },
  duck: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 52 },
    hand: { x: 62, y: 52 },
    back: { x: 20, y: 48 },
    front: { x: 40, y: 48 },
    accessory: { x: 40, y: 42 },
    mouth: { x: 40, y: 36 }, // 喙中心
    waist: { x: 40, y: 60 },
  },
  frog: {
    head: { x: 40, y: 14 }, // skullTop 8（两眼泡之间）
    body: { x: 40, y: 56 },
    hand: { x: 62, y: 56 },
    back: { x: 20, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 34 },
    waist: { x: 40, y: 62 },
  },
  hamster: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 54 },
    hand: { x: 62, y: 54 },
    back: { x: 20, y: 50 },
    front: { x: 40, y: 50 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 42 },
    waist: { x: 40, y: 60 },
  },
  chick: {
    head: { x: 40, y: 14 }, // skullTop 8（呆毛之下）
    body: { x: 40, y: 52 },
    hand: { x: 62, y: 52 },
    back: { x: 20, y: 48 },
    front: { x: 40, y: 48 },
    accessory: { x: 40, y: 42 },
    mouth: { x: 40, y: 35 }, // 喙中心
    waist: { x: 40, y: 60 },
  },
  koala: {
    head: { x: 40, y: 22 }, // skullTop 16（大圆耳之间）
    body: { x: 40, y: 56 },
    hand: { x: 62, y: 56 },
    back: { x: 20, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 42 }, // 大鼻头下沿
    waist: { x: 40, y: 62 },
  },
  chinchilla: {
    head: { x: 40, y: 14 }, // skullTop 8（大耳之间）
    body: { x: 40, y: 56 },
    hand: { x: 62, y: 56 },
    back: { x: 20, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 36 },
    waist: { x: 40, y: 62 },
  },
  otter: {
    head: { x: 40, y: 14 }, // skullTop 8
    body: { x: 40, y: 54 },
    hand: { x: 60, y: 54 },
    back: { x: 22, y: 50 },
    front: { x: 40, y: 50 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 38 },
    waist: { x: 40, y: 60 },
  },
  sheep: {
    head: { x: 40, y: 12 }, // skullTop 6（云绒顶）
    body: { x: 40, y: 56 },
    hand: { x: 60, y: 56 },
    back: { x: 20, y: 52 },
    front: { x: 40, y: 52 },
    accessory: { x: 40, y: 44 },
    mouth: { x: 40, y: 37 },
    waist: { x: 40, y: 62 },
  },
  owl: {
    head: { x: 40, y: 14 }, // skullTop 8（耳羽之间）
    body: { x: 40, y: 52 },
    hand: { x: 62, y: 52 },
    back: { x: 20, y: 48 },
    front: { x: 40, y: 48 },
    accessory: { x: 40, y: 42 },
    mouth: { x: 40, y: 31 }, // 喙中心
    waist: { x: 40, y: 60 },
  },
}
