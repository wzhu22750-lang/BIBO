/**
 * Wardrobe Visual QA 面板（仅开发环境）
 *
 * 路由：#wardrobe?mode=qa （import.meta.env.DEV 为 false 时不会渲染本页面）
 *
 * 用途：
 * - 选择 Character → Category → Item，查看 "当前角色 + 当前装备" 的最终 SVG；
 * - 展示解析后的 anchor / offset / override / scale / 兼容状态；
 * - 图层开关（Base / Clothes / Hat / Accessory / Special）；
 * - 兼容性矩阵总览：每个角色 × 当前分类的全部单品缩略渲染。
 */
import { useMemo, useState } from 'react'
import {
  CHARACTER_LIST,
  WARDROBE_MAP,
  WARDROBE_SETS,
  getCompatibilityStatus,
  getVisualProfile,
  isItemCompatible,
  resolveItemPlacement,
  resolveSetForCharacter,
  type CharacterId,
  type Outfit,
  type WardrobeCategory,
  type WardrobeItem,
} from '../../lib/pet'
import { PixelCharacter } from '../../components/pet/PixelCharacter'
import { Icon } from '../../components/PixelArt'

const CATEGORIES: Array<WardrobeCategory> = ['clothes', 'hats', 'accessories']

function itemsOf(category: WardrobeCategory): WardrobeItem[] {
  switch (category) {
    case 'clothes':
      return Object.values(WARDROBE_MAP).filter((i) => i.category === 'clothes')
    case 'hats':
      return Object.values(WARDROBE_MAP).filter((i) => i.category === 'hats')
    case 'accessories':
      return Object.values(WARDROBE_MAP).filter((i) => i.category === 'accessories')
    default:
      return []
  }
}

function layerOfItem(item: WardrobeItem): keyof Outfit {
  switch (item.layer) {
    case 'clothes':
      return 'clothesId'
    case 'hat':
      return 'hatId'
    case 'accessory':
      return 'accessoryId'
    case 'special':
      return 'specialId'
  }
}

export function WardrobeQaLayout({ onExit }: { onExit: () => void }) {
  const [character, setCharacter] = useState<CharacterId>('cat')
  const [category, setCategory] = useState<WardrobeCategory>('hats')
  const [selectedId, setSelectedId] = useState<string | undefined>('h_red_beret')
  const [layers, setLayers] = useState({
    clothes: true,
    hat: true,
    accessory: true,
    special: true,
  })

  const items = useMemo(() => itemsOf(category), [category])
  const selected = selectedId ? WARDROBE_MAP[selectedId] : undefined
  const profile = getVisualProfile(character)

  const previewOutfit: Outfit = useMemo(() => {
    if (!selected) return {}
    return { [layerOfItem(selected)]: selected.id } as Outfit
  }, [selected])

  const maskedOutfit: Outfit = useMemo(() => {
    const out: Outfit = { ...previewOutfit }
    if (!layers.clothes) delete out.clothesId
    if (!layers.hat) delete out.hatId
    if (!layers.accessory) delete out.accessoryId
    if (!layers.special) delete out.specialId
    return out
  }, [previewOutfit, layers])

  const placement = selected ? resolveItemPlacement(character, selected) : null
  const status = selected ? getCompatibilityStatus(character, selected) : null

  return (
    <div className="wardrobe-qa-layout" style={{ padding: 12, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <strong>Wardrobe Visual QA（DEV ONLY）</strong>
        <button type="button" onClick={onExit} className="hud-tool-btn">
          <Icon name="arrow" size={11} />
          <span>返回衣橱</span>
        </button>
      </div>

      {/* 角色选择 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {CHARACTER_LIST.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`wardrobe-tab-btn ${character === c.id ? 'active' : ''}`}
            onClick={() => setCharacter(c.id)}
          >
            <span>{c.id}</span>
          </button>
        ))}
      </div>

      {/* 分类选择 */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[...CATEGORIES, 'sets' as const].map((c) => (
          <button
            key={c}
            type="button"
            className={`wardrobe-tab-btn ${category === c ? 'active' : ''}`}
            onClick={() => {
              if (c !== 'sets') {
                setCategory(c)
                setSelectedId(itemsOf(c)[0]?.id)
              } else {
                setCategory('sets')
                setSelectedId(undefined)
              }
            }}
          >
            <span>{c}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12 }}>
        {/* 左：最终渲染 + 解析数据 */}
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          <div
            style={{
              background: '#111318',
              padding: 16,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <PixelCharacter character={character} outfit={maskedOutfit} size={160} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(Object.keys(layers) as Array<keyof typeof layers>).map((l) => (
              <button
                key={l}
                type="button"
                className={`wardrobe-tab-btn ${layers[l] ? 'active' : ''}`}
                onClick={() => setLayers((prev) => ({ ...prev, [l]: !prev[l] }))}
              >
                <span>{l}</span>
              </button>
            ))}
          </div>
          {selected && placement && (
            <pre style={{ fontSize: 10, lineHeight: 1.5, overflow: 'auto' }}>
              {JSON.stringify(
                {
                  item: selected.id,
                  layer: selected.layer,
                  anchorType: selected.anchor,
                  status,
                  anchor: placement.anchor,
                  itemOffset: placement.offset,
                  characterOffset: placement.overrideOffset,
                  layerScale: placement.layerScale,
                  overrideScale: placement.overrideScale,
                  finalScale: placement.scale,
                  finalPosition: { x: placement.x, y: placement.y },
                  visible: placement.visible,
                  profile: {
                    skullTopY: profile.skullTopY,
                    neckY: profile.neckY,
                    mouth: profile.mouth,
                    waist: profile.waist,
                    clothesScale: profile.clothesScale,
                    earStyle: profile.earStyle,
                  },
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>

        {/* 右：兼容性矩阵（角色 × 当前分类单品）或套装总览 */}
        <div>
          {category !== 'sets' ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                gap: 6,
              }}
            >
              {items.map((item) => {
                const ok = isItemCompatible(character, item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`wardrobe-item-card ${selectedId === item.id ? 'active' : ''} ${ok ? '' : 'incompatible'}`}
                    title={`${item.id} (${getCompatibilityStatus(character, item)})`}
                  >
                    <PixelCharacter
                      character={character}
                      outfit={{ [layerOfItem(item)]: item.id } as Outfit}
                      size={56}
                    />
                    <span className="item-card-name">{item.id}</span>
                    {!ok && <span className="item-card-badge bad">不适配</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 6,
              }}
            >
              {WARDROBE_SETS.map((set) => {
                const resolved = resolveSetForCharacter(character, set)
                return (
                  <div key={set.id} className="wardrobe-item-card">
                    <PixelCharacter character={character} outfit={resolved.outfit} size={64} />
                    <span className="item-card-name">{set.name}</span>
                    {resolved.skippedItemIds.length > 0 && (
                      <span className="item-card-badge bad">
                        skip:{resolved.skippedItemIds.length}
                      </span>
                    )}
                    <span className="item-card-tag">
                      {resolved.skippedItemIds.join(', ') || '完整适配'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
