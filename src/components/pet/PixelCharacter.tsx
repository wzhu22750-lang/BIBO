import type { CSSProperties, ReactNode } from 'react'
import {
  CHARACTER_MAP,
  WARDROBE_ASSET_RENDERERS,
  WARDROBE_MAP,
  resolveItemPlacement,
  type CharacterId,
  type Outfit,
  type WardrobeItem,
} from '../../lib/pet'

export type PixelCharacterAnimation = 'idle' | 'happy' | 'bounce' | 'sparkle' | 'none'

export type PixelCharacterProps = {
  character?: CharacterId | string
  outfit?: Outfit | null
  size?: number
  className?: string
  style?: CSSProperties
  animation?: PixelCharacterAnimation
  onClick?: () => void
}

/**
 * 图层渲染：位置/比例/可见性一律经由兼容性矩阵解析
 * （角色锚点 → 视觉档案比例 → 装备全局 offset/scale → 角色级覆写）。
 * 被标记为 incompatible 的装备在该角色身上直接不渲染。
 */
function renderLayerItem(item: WardrobeItem, characterId: CharacterId): ReactNode {
  const renderer = WARDROBE_ASSET_RENDERERS[item.assetId]
  if (!renderer) return null

  const placement = resolveItemPlacement(characterId, item)
  if (!placement.visible) return null

  const scale = placement.scale !== 1 ? ` scale(${placement.scale})` : ''

  return (
    <g
      key={`${item.layer}-${item.id}`}
      className={`layer-${item.layer}`}
      transform={`translate(${placement.x}, ${placement.y})${scale}`}
    >
      {renderer()}
    </g>
  )
}

/**
 * 统一矢量像素角色渲染引擎 (PixelCharacter)
 * 核心技术标准：
 * 1. 单一 SVG Viewport (0 0 80 88)，杜绝 HTML 容器 absolute 拼合
 * 2. shapeRendering="crispEdges" 保证任意尺寸下像素物理边缘锐利
 * 3. 5 层标准图层合并：Base -> Clothes -> Hat -> Accessory -> Special
 * 4. 锚点与偏移补偿在 SVG 坐标系下原子计算
 */
export function PixelCharacter({
  character = 'cat',
  outfit,
  size = 80,
  className = '',
  style,
  animation = 'none',
  onClick,
}: PixelCharacterProps) {
  const validCharId = (character && character in CHARACTER_MAP ? character : 'cat') as CharacterId
  const charMeta = CHARACTER_MAP[validCharId] || CHARACTER_MAP.cat
  const activeOutfit = outfit || {}

  const height = Math.round((size * 88) / 80)

  return (
    <svg
      viewBox="0 0 80 88"
      width={size}
      height={height}
      className={`pixel-character anim-${animation} ${className}`}
      style={{
        ...style,
        cursor: onClick ? 'pointer' : undefined,
      }}
      shapeRendering="crispEdges"
      aria-hidden="true"
      onClick={onClick}
    >
      {/* Layer 1: Base Character */}
      <g className="layer-base">{charMeta.renderBase()}</g>

      {/* Layer 2: Clothes */}
      {activeOutfit.clothesId &&
        WARDROBE_MAP[activeOutfit.clothesId] &&
        renderLayerItem(WARDROBE_MAP[activeOutfit.clothesId], validCharId)}

      {/* Layer 3: Hat */}
      {activeOutfit.hatId &&
        WARDROBE_MAP[activeOutfit.hatId] &&
        renderLayerItem(WARDROBE_MAP[activeOutfit.hatId], validCharId)}

      {/* Layer 4: Accessory */}
      {activeOutfit.accessoryId &&
        WARDROBE_MAP[activeOutfit.accessoryId] &&
        renderLayerItem(WARDROBE_MAP[activeOutfit.accessoryId], validCharId)}

      {/* Layer 5: Special Effect */}
      {activeOutfit.specialId &&
        WARDROBE_MAP[activeOutfit.specialId] &&
        renderLayerItem(WARDROBE_MAP[activeOutfit.specialId], validCharId)}
    </svg>
  )
}

/**
 * 独立的装扮物品缩略图组件 (PixelItemPreview)
 * 供衣橱网格卡片进行高质量、居中且锋利的像素预览
 */
export function PixelItemPreview({
  item,
  size = 36,
  className = '',
}: {
  item: WardrobeItem
  size?: number
  className?: string
}) {
  const renderer = WARDROBE_ASSET_RENDERERS[item.assetId]
  if (!renderer) return null

  return (
    <svg
      viewBox="-24 -24 48 48"
      width={size}
      height={size}
      className={`pixel-item-preview ${className}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <g transform="translate(0, 0)">{renderer()}</g>
    </svg>
  )
}
