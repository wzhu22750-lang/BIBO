import { useState } from 'react'
import type { SharedWardrobeProps } from './types'
import {
  CHARACTER_LIST,
  CHARACTER_MAP,
  getRandomOutfit,
  type CharacterId,
  type WardrobeCategory,
} from '../../lib/pet'
import { WardrobeGrid } from '../../components/pet/WardrobeGrid'
import { CharacterStage, EquipmentSlotsBar } from './CharacterStage'
import { Icon } from '../../components/PixelArt'
import { PixelCharacter } from '../../components/pet/PixelCharacter'

export function WardrobeSplitLayout(props: SharedWardrobeProps) {
  const {
    activeChar,
    outfits,
    currentOutfit,
    isDeployed,
    isDirty = false,
    anim,
    busy,
    triggerBounce,
    onSelectCharacter,
    onOutfitChange,
    onItemEquipped,
    onSetDeployed,
    onSave,
  } = props

  // 控制下方陈列网格的分类 Tab（点击空装备槽位可直达对应分类）
  const [catalogTab, setCatalogTab] = useState<WardrobeCategory | 'all'>('all')

  // 一键清空当前角色穿搭
  const handleClear = () => {
    onOutfitChange({})
  }

  // 随机穿搭
  const handleRandomize = () => {
    const random = getRandomOutfit(activeChar)
    onOutfitChange(random)
  }

  // 单项移除
  const handleRemoveLayer = (layer: 'clothes' | 'hat' | 'accessory' | 'special') => {
    const next = { ...currentOutfit }
    if (layer === 'clothes') delete next.clothesId
    if (layer === 'hat') delete next.hatId
    if (layer === 'accessory') delete next.accessoryId
    if (layer === 'special') delete next.specialId
    onOutfitChange(next)
  }

  // 点击空槽位，自动切换到对应分类并聚焦
  const handleFocusCategory = (cat: 'clothes' | 'hats' | 'accessories' | 'all') => {
    setCatalogTab(cat)
  }

  const activeMeta = CHARACTER_MAP[activeChar]

  return (
    <div className="wardrobe-split-view">
      {/* 1. 顶部吸顶固定舞台（Sticky Stage） */}
      <section className="split-sticky-stage" aria-label="固定试衣舞台">
        {/* A. 顶部 HUD 信息与操作集群 */}
        <div className="split-hud-header">
          <div className="hud-pet-identity">
            <span className="hud-tag micro">PET</span>
            <strong className="hud-pet-name">{activeMeta?.name || activeChar}</strong>
            {isDeployed ? (
              <span className="hud-deployed-badge" title="当前在小窝陪伴的角色">
                <Icon name="heart" size={10} />
                <span>陪伴中</span>
              </span>
            ) : (
              <button
                type="button"
                className="hud-deploy-btn"
                onClick={onSetDeployed}
                title="设为在小窝陪伴的 BIBU 形象"
              >
                设为陪伴
              </button>
            )}
          </div>

          <div className="hud-actions-cluster">
            <button
              type="button"
              className="hud-tool-btn"
              onClick={handleRandomize}
              title="为当前角色随机生成一套穿搭"
            >
              <Icon name="shuffle" size={11} />
              <span>随机</span>
            </button>
            <button
              type="button"
              className="hud-tool-btn"
              onClick={handleClear}
              title="一键卸下当前全部装扮"
            >
              <Icon name="undo" size={11} />
              <span>脱下</span>
            </button>
            <button
              type="button"
              className={`hud-save-btn ${isDirty ? 'dirty' : 'clean'}`}
              onClick={onSave}
              disabled={busy}
              title={isDirty ? '有未保存的装扮修改，点击同步' : '当前已是最新保存状态'}
            >
              <Icon name="check" size={12} />
              <span>{busy ? '同步中…' : isDirty ? '保存' : '已保存'}</span>
              {isDirty && <span className="save-dirty-pip" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* B. 轻量化角色横向滚动选择栏（降低非选定项权重，去除死板黑框） */}
        <div
          className="split-char-carousel split-char-ribbon"
          role="radiogroup"
          aria-label="切换伙伴"
        >
          {CHARACTER_LIST.map((item) => {
            const isSelected = item.id === activeChar
            const charOutfit = outfits[item.id as CharacterId] || {}
            return (
              <button
                key={item.id}
                type="button"
                className={`ribbon-char-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCharacter(item.id as CharacterId)}
                title={`切换为【${item.name}】`}
                role="radio"
                aria-checked={isSelected}
              >
                <div className="ribbon-avatar-wrap">
                  <PixelCharacter
                    character={item.id as CharacterId}
                    outfit={charOutfit}
                    size={28}
                  />
                </div>
                <span className="ribbon-name micro">{item.name}</span>
              </button>
            )
          })}
        </div>

        {/* C. 核心主舞台 (左侧立绘展台 + 右侧 4 槽位游戏装备栏) */}
        <div className="split-main-showcase">
          <div className="showcase-stage-pod">
            <CharacterStage
              character={activeChar}
              outfit={currentOutfit}
              animation={anim}
              size={92}
              variant="compact"
              onBounce={triggerBounce}
            />
          </div>

          <div className="showcase-slots-pod">
            <EquipmentSlotsBar
              outfit={currentOutfit}
              onRemoveItem={handleRemoveLayer}
              onFocusCategory={handleFocusCategory}
            />
          </div>
        </div>
      </section>

      {/* 2. 下方独立滚动时装陈列网格 */}
      <section className="split-scrollable-catalog" aria-label="时装陈列">
        <WardrobeGrid
          outfit={currentOutfit}
          onChange={onOutfitChange}
          onItemEquipped={onItemEquipped}
          activeTab={catalogTab}
          onTabChange={setCatalogTab}
          character={activeChar}
        />
      </section>
    </div>
  )
}
