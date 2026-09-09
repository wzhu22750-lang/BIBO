import { CHARACTER_MAP, WARDROBE_MAP, type CharacterId, type Outfit } from '../../lib/pet'
import { PixelCharacter, type PixelCharacterAnimation } from '../../components/pet/PixelCharacter'
import { Icon, type IconName } from '../../components/PixelArt'

export function CharacterStage({
  character,
  outfit,
  animation,
  size = 96,
  variant = 'hero',
  onBounce,
  showPedestal = true,
}: {
  character: CharacterId
  outfit: Outfit
  animation: PixelCharacterAnimation
  size?: number
  variant?: 'compact' | 'hero' | 'room'
  onBounce?: () => void
  showPedestal?: boolean
}) {
  const meta = CHARACTER_MAP[character]
  const isAnimating = animation !== 'none'

  return (
    <div
      className={`char-stage-box variant-${variant} pixel-stage-diorama ${isAnimating ? 'is-animating' : ''}`}
      onClick={onBounce}
      title="点击立绘触发挥手跳动"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onBounce?.()
        }
      }}
    >
      {/* 4角复古像素边角饰物 */}
      <span className="pixel-corner-deco top-left" aria-hidden="true" />
      <span className="pixel-corner-deco top-right" aria-hidden="true" />
      <span className="pixel-corner-deco bottom-left" aria-hidden="true" />
      <span className="pixel-corner-deco bottom-right" aria-hidden="true" />

      {/* 像素环境星光（克制微量，仅舞台角落） */}
      <span className="pixel-ambient-spark spark-top" aria-hidden="true">
        ✦
      </span>
      <span className="pixel-ambient-spark spark-bottom" aria-hidden="true">
        ·
      </span>

      {/* 复古像素地毯台座 (Pixel Art Rug / Pedestal) */}
      {showPedestal && (
        <div className="char-stage-pedestal pixel-rug" aria-hidden="true">
          <svg
            viewBox="0 0 100 24"
            width="100"
            height="24"
            shapeRendering="crispEdges"
            className="pixel-rug-svg"
          >
            {/* 地面阴影 */}
            <path d="M12 14h76v6h-6v2H18v-2h-6z" fill="#20211d" opacity="0.25" />
            {/* 地毯基座厚边 */}
            <path d="M8 8h84v8H12v-2H8z" fill="#44403c" />
            {/* 复古红绒毯镶边 */}
            <path d="M10 6h80v8H14v-2h-4z" fill="#991b1b" />
            {/* 米黄像素流苏与编织结 */}
            <path
              d="M14 8h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4zm8 0h4v2h-4z"
              fill="#fef08a"
            />
            {/* 地毯中心温馨浅米色绒面 */}
            <path d="M16 6h68v5H16z" fill="#fef9c3" />
            {/* 中心精致小十字绣纹 */}
            <path d="M46 7h8v3h-8zm3 -1h2v5h-2z" fill="#dc2626" />
          </svg>
        </div>
      )}

      {/* 角色立绘主体 */}
      <div className="char-stage-sprite">
        <PixelCharacter character={character} outfit={outfit} animation={animation} size={size} />
      </div>

      {/* 舞台轻量点击反馈标签 */}
      <div className="char-stage-caption">
        <span className="caption-name">{meta?.name || character}</span>
        <span className="caption-action-hint">
          <Icon name="spark" size={9} />
          <span>点击跳动</span>
        </span>
      </div>
    </div>
  )
}

/**
 * 游戏化装备栏 (Equipment Slots)
 * 4 个标准化 RPG 槽位：衣服、帽子、配饰、特效
 * 每件显示对应分类 icon + 装备名称 + 一键移除
 */
export function EquipmentSlotsBar({
  outfit,
  onRemoveItem,
  onFocusCategory,
}: {
  outfit: Outfit
  onRemoveItem: (layer: 'clothes' | 'hat' | 'accessory' | 'special') => void
  onFocusCategory?: (category: 'clothes' | 'hats' | 'accessories' | 'all') => void
}) {
  const slotConfigs: Array<{
    layer: 'clothes' | 'hat' | 'accessory' | 'special'
    name: string
    icon: IconName
    category: 'clothes' | 'hats' | 'accessories' | 'all'
    itemId: string | undefined
  }> = [
    {
      layer: 'clothes',
      name: '衣服',
      icon: 'shirt',
      category: 'clothes',
      itemId: outfit.clothesId,
    },
    {
      layer: 'hat',
      name: '帽子',
      icon: 'crown',
      category: 'hats',
      itemId: outfit.hatId,
    },
    {
      layer: 'accessory',
      name: '配饰',
      icon: 'gem',
      category: 'accessories',
      itemId: outfit.accessoryId,
    },
    {
      layer: 'special',
      name: '特效',
      icon: 'spark',
      category: 'all',
      itemId: outfit.specialId,
    },
  ]

  return (
    <div className="equipment-slots-rack" role="region" aria-label="已穿戴装备栏">
      {slotConfigs.map((slot) => {
        const item = slot.itemId ? WARDROBE_MAP[slot.itemId] : null

        if (item) {
          return (
            <div key={slot.layer} className="equip-slot-item equipped">
              <div className="equip-slot-icon-box" title={slot.name}>
                <Icon name={slot.icon} size={12} />
              </div>
              <div className="equip-slot-body">
                <span className="equip-slot-label micro">{slot.name}</span>
                <span className="equip-slot-title" title={item.name}>
                  {item.name}
                </span>
              </div>
              <button
                type="button"
                className="equip-slot-del-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveItem(slot.layer)
                }}
                title={`卸下【${item.name}】`}
                aria-label={`卸下${item.name}`}
              >
                <Icon name="close" size={9} />
              </button>
            </div>
          )
        }

        return (
          <button
            key={slot.layer}
            type="button"
            className="equip-slot-item slot-vacant"
            onClick={() => onFocusCategory?.(slot.category)}
            title={`点击挑选${slot.name}`}
          >
            <div className="equip-slot-icon-box slot-vacant" aria-hidden="true">
              <Icon name={slot.icon} size={12} />
            </div>
            <div className="equip-slot-body">
              <span className="equip-slot-label micro">{slot.name}</span>
              <span className="equip-slot-empty-text">未穿戴</span>
            </div>
            <span className="equip-slot-plus" aria-hidden="true">
              +
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 兼容别名导出
export const EquippedChipsBar = EquipmentSlotsBar
