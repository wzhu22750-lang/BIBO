import type { CharacterOutfits, Outfit } from './types'
import { CHARACTER_IDS } from './types'
import { WARDROBE_MAP } from './wardrobe'

function isObject(val: unknown): val is Record<string, unknown> {
  return !!val && typeof val === 'object' && !Array.isArray(val)
}

/**
 * 校验并清洗单套穿搭数据，剔除已不存在的物品 ID 或层级不匹配的脏数据
 */
export function normalizeOutfit(raw: unknown): Outfit {
  if (!isObject(raw)) return {}

  const outfit: Outfit = {}

  // 1. 衣服校验
  if (typeof raw.clothesId === 'string' && raw.clothesId.trim()) {
    const item = WARDROBE_MAP[raw.clothesId]
    if (item && item.layer === 'clothes') {
      outfit.clothesId = item.id
    }
  }

  // 2. 帽子校验
  if (typeof raw.hatId === 'string' && raw.hatId.trim()) {
    const item = WARDROBE_MAP[raw.hatId]
    if (item && item.layer === 'hat') {
      outfit.hatId = item.id
    }
  }

  // 3. 配饰校验
  if (typeof raw.accessoryId === 'string' && raw.accessoryId.trim()) {
    const item = WARDROBE_MAP[raw.accessoryId]
    if (item && (item.layer === 'accessory' || item.layer === 'special')) {
      outfit.accessoryId = item.id
    }
  }

  // 4. 特殊/光效校验
  if (typeof raw.specialId === 'string' && raw.specialId.trim()) {
    const item = WARDROBE_MAP[raw.specialId]
    if (item && (item.layer === 'special' || item.layer === 'accessory')) {
      outfit.specialId = item.id
    }
  }

  return outfit
}

/**
 * 是否属于完全未穿戴任何物品的空白穿搭
 */
export function isOutfitEmpty(outfit?: Outfit | null): boolean {
  if (!outfit) return true
  return !outfit.clothesId && !outfit.hatId && !outfit.accessoryId && !outfit.specialId
}

/**
 * 防御性穿搭字典全量清洗管道：
 * 1. 保证输入为 JSON Object；
 * 2. 仅保留系统白名单内存在的 CharacterId；
 * 3. 逐个角色清洗其穿搭内容，剔除失效的物品 ID；
 * 4. 空穿搭不占位，保持输出紧凑；
 * 5. 杜绝未知字段、SQL 注入、XSS 污染与脏数据堆积。
 */
export function normalizeOutfits(raw: unknown): CharacterOutfits {
  if (!isObject(raw)) return {}

  const result: CharacterOutfits = {}

  for (const charId of CHARACTER_IDS) {
    if (charId in raw) {
      const cleaned = normalizeOutfit(raw[charId])
      if (!isOutfitEmpty(cleaned)) {
        result[charId] = cleaned
      }
    }
  }

  return result
}
