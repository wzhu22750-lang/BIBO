import type { CharacterId, Outfit, WardrobeSet } from './types'
import { filterCompatibleItems } from './compatibility'
import { ACCESSORIES_LIST, CLOTHES_LIST, HATS_LIST } from './wardrobe'

export const WARDROBE_SETS: WardrobeSet[] = [
  {
    id: 'set_christmas',
    name: '圣诞颂歌套装',
    description: '红绿相间的经典冬日圣诞氛围，戴上红帽与暖红围巾送出真挚祝福。',
    tag: '圣诞节日',
    preset: {
      clothesId: 'c_christmas_sweater',
      hatId: 'h_santa_hat',
      accessoryId: 'a_red_scarf',
    },
  },
  {
    id: 'set_sailor_school',
    name: '青春水手套装',
    description: '深蓝海军领与棒球帽的碰撞，装上双肩包奔赴校园新学期。',
    tag: '青春校园',
    preset: {
      clothesId: 'c_sailor_suit',
      hatId: 'h_baseball_cap',
      accessoryId: 'a_school_backpack',
    },
  },
  {
    id: 'set_british_academy',
    name: '英伦学院套装',
    description: '西服领带搭配低调优雅黑贝雷帽，挎上拍立得定格午后图书馆时光。',
    tag: '学院复古',
    preset: {
      clothesId: 'c_british_blazer',
      hatId: 'h_black_beret',
      accessoryId: 'a_polaroid_camera',
    },
  },
  {
    id: 'set_cozy_winter',
    name: '暖冬物语套装',
    description: '厚实蓝白羽绒服配雪花毛线帽，手捧热咖啡慢品初雪。',
    tag: '冬日恋歌',
    preset: {
      clothesId: 'c_winter_down_jacket',
      hatId: 'h_winter_beanie',
      accessoryId: 'a_coffee_cup',
    },
  },
  {
    id: 'set_summer_beach',
    name: '夏日海滩套装',
    description: '热带夏威夷碎花衬衫加草织遮阳帽，套上小鸭游泳圈向大海出发！',
    tag: '海岛度假',
    preset: {
      clothesId: 'c_hawaiian_shirt',
      hatId: 'h_straw_sunhat',
      accessoryId: 'a_beach_swim_ring',
    },
  },
  {
    id: 'set_magic_apprentice',
    name: '魔法学徒套装',
    description: '深紫星辰长袍与神秘巫师尖顶帽，挥舞星光魔杖唤醒沉睡的心愿。',
    tag: '奇幻魔法',
    preset: {
      clothesId: 'c_magic_robe',
      hatId: 'h_magic_wizard_hat',
      accessoryId: 'a_magic_wand',
    },
  },
  {
    id: 'set_great_detective',
    name: '传奇大侦探套装',
    description: '复古猎鹿格纹帽与保暖小斗篷，手持金色放大镜看穿一切小秘密。',
    tag: '推理密友',
    preset: {
      clothesId: 'c_detective_cape',
      hatId: 'h_detective_hat',
      accessoryId: 'a_detective_magnifier',
    },
  },
  {
    id: 'set_sweet_bakery',
    name: '甜蜜烘焙师套装',
    description: '暖黄格纹围裙配洁白挺括高帽，手持木打蛋勺烤制最甜的焦糖泡芙。',
    tag: '温馨烘焙',
    preset: {
      clothesId: 'c_chef_apron',
      hatId: 'h_chef_toque',
      accessoryId: 'a_whisk_spoon',
    },
  },
  {
    id: 'set_sleepy_pajama',
    name: '晚安睡衣套装',
    description: '粉色波点草莓睡袍配垂坠睡帽，嘴咬小吐司迷迷糊糊准备入眠。',
    tag: '舒适居家',
    preset: {
      clothesId: 'c_cozy_pajamas',
      hatId: 'h_pajama_nightcap',
      accessoryId: 'a_toast_mouth',
    },
  },
  {
    id: 'set_space_voyager',
    name: '星际领航员套装',
    description: '银白宇航服与透明深空面罩，身边漂浮着忠诚的像素小幽灵伙伴。',
    tag: '漫游宇宙',
    preset: {
      clothesId: 'c_space_suit',
      hatId: 'h_space_helmet',
      specialId: 'a_ghost_companion',
    },
  },
]

export const SETS_MAP: Record<string, WardrobeSet> = WARDROBE_SETS.reduce(
  (acc, set) => {
    acc[set.id] = set
    return acc
  },
  {} as Record<string, WardrobeSet>,
)

/**
 * 随机穿搭：传入角色时仅从该角色兼容的单品中抽取，
 * 避免随机出被标记为 incompatible 的装备。
 */
export function getRandomOutfit(characterId?: CharacterId): Outfit {
  const clothesPool = characterId ? filterCompatibleItems(characterId, CLOTHES_LIST) : CLOTHES_LIST
  const hatPool = characterId ? filterCompatibleItems(characterId, HATS_LIST) : HATS_LIST
  const accPool = characterId
    ? filterCompatibleItems(characterId, ACCESSORIES_LIST)
    : ACCESSORIES_LIST

  const pick = <T>(list: T[]): T | undefined =>
    list.length ? list[Math.floor(Math.random() * list.length)] : undefined

  const clothes = pick(clothesPool)
  const hat = pick(hatPool)
  const acc = pick(accPool)
  return {
    clothesId: clothes?.id,
    hatId: hat?.id,
    accessoryId: acc?.id,
  }
}
