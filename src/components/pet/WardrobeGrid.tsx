import { useMemo, useState } from 'react'
import {
  ACCESSORIES_LIST,
  CLOTHES_LIST,
  HATS_LIST,
  WARDROBE_ITEMS,
  WARDROBE_MAP,
  WARDROBE_SETS,
  isItemCompatible,
  resolveSetForCharacter,
  getRandomOutfit,
  type CharacterId,
  type Outfit,
  type WardrobeCategory,
  type WardrobeItem,
  type WardrobeSet,
} from '../../lib/pet'
import { PixelItemPreview } from './PixelCharacter'
import { Icon } from '../PixelArt'

export type WardrobeGridProps = {
  outfit: Outfit
  onChange: (newOutfit: Outfit) => void
  onItemEquipped?: (item: WardrobeItem) => void
  activeTab?: WardrobeCategory | 'all'
  onTabChange?: (tab: WardrobeCategory | 'all') => void
  /** 当前试穿角色：用于兼容性矩阵（不适配单品置灰、套装跳过不适配件） */
  character?: CharacterId
  className?: string
}

export function WardrobeGrid({
  outfit,
  onChange,
  onItemEquipped,
  activeTab: controlledTab,
  onTabChange,
  character,
  className = '',
}: WardrobeGridProps) {
  const [internalTab, setInternalTab] = useState<WardrobeCategory | 'all'>('all')
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab

  const handleTabSelect = (tab: WardrobeCategory | 'all') => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalTab(tab)
    }
  }

  // 判断单件物品是否当前已装备
  const isItemEquipped = (item: WardrobeItem): boolean => {
    switch (item.layer) {
      case 'clothes':
        return outfit.clothesId === item.id
      case 'hat':
        return outfit.hatId === item.id
      case 'accessory':
        return outfit.accessoryId === item.id
      case 'special':
        return outfit.specialId === item.id
      default:
        return false
    }
  }

  // 点击单件装备：已穿戴则脱下，未穿戴则替换对应层级
  const handleToggleItem = (item: WardrobeItem) => {
    if (character && !isItemCompatible(character, item)) return
    const next: Outfit = { ...outfit }

    switch (item.layer) {
      case 'clothes':
        next.clothesId = next.clothesId === item.id ? undefined : item.id
        break
      case 'hat':
        next.hatId = next.hatId === item.id ? undefined : item.id
        break
      case 'accessory':
        next.accessoryId = next.accessoryId === item.id ? undefined : item.id
        break
      case 'special':
        next.specialId = next.specialId === item.id ? undefined : item.id
        break
    }

    onChange(next)
    if (onItemEquipped) onItemEquipped(item)
  }

  // 判断整套是否完全匹配已装备
  const isSetEquipped = (set: WardrobeSet): boolean => {
    if (set.preset.clothesId && outfit.clothesId !== set.preset.clothesId) return false
    if (set.preset.hatId && outfit.hatId !== set.preset.hatId) return false
    if (set.preset.accessoryId && outfit.accessoryId !== set.preset.accessoryId) return false
    if (set.preset.specialId && outfit.specialId !== set.preset.specialId) return false
    return true
  }

  // 套装在当前角色上的解析结果：不适配单品自动跳过，保证构图成立
  const resolvedSets = useMemo(() => {
    const map: Record<string, ReturnType<typeof resolveSetForCharacter>> = {}
    for (const set of WARDROBE_SETS) {
      map[set.id] = character
        ? resolveSetForCharacter(character, set)
        : { outfit: set.preset, skippedItemIds: [], compatible: true }
    }
    return map
  }, [character])

  // 点击套装：一键应用预设 (Set = Preset)
  const handleApplySet = (set: WardrobeSet) => {
    if (isSetEquipped(set)) {
      // 若当前已完整穿戴该套装，再次点击则脱下该套装中的装扮
      const next: Outfit = { ...outfit }
      if (set.preset.clothesId && next.clothesId === set.preset.clothesId)
        next.clothesId = undefined
      if (set.preset.hatId && next.hatId === set.preset.hatId) next.hatId = undefined
      if (set.preset.accessoryId && next.accessoryId === set.preset.accessoryId)
        next.accessoryId = undefined
      if (set.preset.specialId && next.specialId === set.preset.specialId)
        next.specialId = undefined
      onChange(next)
    } else {
      // 一键覆盖对应槽位（跳过当前角色不适配的单品）
      onChange({
        ...outfit,
        ...resolvedSets[set.id].outfit,
      })
    }
  }

  // 随机穿搭功能（仅从当前角色兼容的单品中抽取）
  const handleRandomOutfit = () => {
    const random = getRandomOutfit(character)
    onChange({
      ...random,
      specialId: undefined,
    })
  }

  // 一键卸下
  const handleUnequipAll = () => {
    onChange({})
  }

  // 筛选列表
  const displayedItems = useMemo(() => {
    switch (activeTab) {
      case 'clothes':
        return CLOTHES_LIST
      case 'hats':
        return HATS_LIST
      case 'accessories':
        return ACCESSORIES_LIST
      case 'all':
      default:
        return WARDROBE_ITEMS
    }
  }, [activeTab])

  return (
    <div className={`wardrobe-panel ${className}`}>
      {/* 顶部快捷操作栏：左侧分类，右侧工具 */}
      <div className="wardrobe-quick-actions">
        <div className="wardrobe-tabs-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`wardrobe-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabSelect('all')}
          >
            <Icon name="grid" size={11} />
            <span>全部</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'clothes'}
            className={`wardrobe-tab-btn ${activeTab === 'clothes' ? 'active' : ''}`}
            onClick={() => handleTabSelect('clothes')}
          >
            <Icon name="shirt" size={11} />
            <span>衣服</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'hats'}
            className={`wardrobe-tab-btn ${activeTab === 'hats' ? 'active' : ''}`}
            onClick={() => handleTabSelect('hats')}
          >
            <Icon name="crown" size={11} />
            <span>帽子</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'accessories'}
            className={`wardrobe-tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => handleTabSelect('accessories')}
          >
            <Icon name="gem" size={11} />
            <span>配饰</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sets'}
            className={`wardrobe-tab-btn ${activeTab === 'sets' ? 'active' : ''}`}
            onClick={() => handleTabSelect('sets')}
          >
            <Icon name="spark" size={11} />
            <span>套装</span>
          </button>
        </div>

        <div className="wardrobe-tool-btns">
          <button
            type="button"
            className="wardrobe-tool-btn"
            onClick={handleRandomOutfit}
            title="随机生成一套和谐穿搭"
          >
            <Icon name="shuffle" size={12} />
            <span>随机</span>
          </button>
          <button
            type="button"
            className="wardrobe-tool-btn wardrobe-tool-btn-danger"
            onClick={handleUnequipAll}
            title="一键卸下当前角色全部装扮"
          >
            <Icon name="undo" size={12} />
            <span>卸下</span>
          </button>
        </div>
      </div>

      {/* 套装专属视图 */}
      {activeTab === 'sets' ? (
        <div className="wardrobe-sets-grid">
          {WARDROBE_SETS.map((set) => {
            const equipped = isSetEquipped(set)
            return (
              <button
                key={set.id}
                type="button"
                className={`wardrobe-set-card ${equipped ? 'active' : ''}`}
                onClick={() => handleApplySet(set)}
              >
                <div className="set-card-header">
                  <span className="set-card-name">{set.name}</span>
                  <span className="set-card-tag">{set.tag || '套装'}</span>
                </div>
                <p className="set-card-desc">{set.description}</p>
                {!resolvedSets[set.id].compatible && (
                  <span className="set-card-skip-note micro">
                    部分单品不适配当前角色，将自动跳过
                  </span>
                )}
                <div className="set-components-row">
                  {set.preset.clothesId && (
                    <span className="set-item-chip">
                      <Icon name="shirt" size={11} />
                      <span>
                        {WARDROBE_MAP[set.preset.clothesId]?.name || set.preset.clothesId}
                      </span>
                    </span>
                  )}
                  {set.preset.hatId && (
                    <span className="set-item-chip">
                      <Icon name="crown" size={11} />
                      <span>{WARDROBE_MAP[set.preset.hatId]?.name || set.preset.hatId}</span>
                    </span>
                  )}
                  {set.preset.accessoryId && (
                    <span className="set-item-chip">
                      <Icon name="gem" size={11} />
                      <span>
                        {WARDROBE_MAP[set.preset.accessoryId]?.name || set.preset.accessoryId}
                      </span>
                    </span>
                  )}
                  {set.preset.specialId && (
                    <span className="set-item-chip">
                      <Icon name="spark" size={11} />
                      <span>
                        {WARDROBE_MAP[set.preset.specialId]?.name || set.preset.specialId}
                      </span>
                    </span>
                  )}
                </div>
                <div className="set-status-badge">
                  {equipped ? (
                    <>
                      <Icon name="check" size={10} />
                      <span>已穿戴整套</span>
                    </>
                  ) : (
                    <span>点击一键装配</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* 普通装扮物品网格 */
        <div className="wardrobe-items-grid">
          {displayedItems.map((item) => {
            const equipped = isItemEquipped(item)
            const incompatible = character ? !isItemCompatible(character, item) : false
            return (
              <button
                key={item.id}
                type="button"
                disabled={incompatible}
                className={`wardrobe-item-card ${equipped ? 'active' : ''} ${incompatible ? 'incompatible' : ''}`}
                onClick={() => handleToggleItem(item)}
                title={
                  incompatible ? `${item.name} 不适配当前角色` : `${item.name} (${item.category})`
                }
              >
                <div className="item-card-preview">
                  <PixelItemPreview item={item} size={36} />
                </div>
                <span className="item-card-name">{item.name}</span>
                {item.metadata?.tag && <span className="item-card-tag">{item.metadata.tag}</span>}
                {incompatible && <span className="item-card-badge bad">不适配</span>}
                {equipped && <span className="item-card-badge">已穿戴</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
