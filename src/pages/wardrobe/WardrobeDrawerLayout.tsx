import { useState } from 'react'
import type { SharedWardrobeProps } from './types'
import { CHARACTER_LIST, CHARACTER_MAP, getRandomOutfit, type CharacterId } from '../../lib/pet'
import { CharacterSelector } from '../../components/pet/CharacterSelector'
import { WardrobeGrid } from '../../components/pet/WardrobeGrid'
import { CharacterStage, EquippedChipsBar } from './CharacterStage'
import { Button } from '../../components/ui'
import { Icon } from '../../components/PixelArt'
import { PixelCharacter } from '../../components/pet/PixelCharacter'

export type DrawerSnapState = 'half' | 'full' | 'collapsed'

export function WardrobeDrawerLayout(props: SharedWardrobeProps) {
  const {
    activeChar,
    outfits,
    currentOutfit,
    isDeployed,
    anim,
    busy,
    triggerBounce,
    onSelectCharacter,
    onOutfitChange,
    onItemEquipped,
    onSetDeployed,
    onSave,
  } = props

  // 抽屉状态：'half' 半屏试衣（默认，舞台与抽屉同屏共存）、'full' 大衣橱全屏浏览、'collapsed' 收起欣赏全身
  const [drawerState, setDrawerState] = useState<DrawerSnapState>('half')

  const handleRandomize = () => {
    onOutfitChange(getRandomOutfit(activeChar))
  }
  const handleClear = () => {
    onOutfitChange({})
  }

  const handleRemoveLayer = (layer: 'clothes' | 'hat' | 'accessory' | 'special') => {
    const next = { ...currentOutfit }
    if (layer === 'clothes') delete next.clothesId
    if (layer === 'hat') delete next.hatId
    if (layer === 'accessory') delete next.accessoryId
    if (layer === 'special') delete next.specialId
    onOutfitChange(next)
  }

  const equippedCount = Object.keys(currentOutfit).length

  return (
    <div className={`wardrobe-drawer-view snap-${drawerState}`}>
      {/* 顶部体验引导条 */}
      <div className="drawer-notice-bar micro">
        <span>
          <Icon name="grid" size={13} /> <b>抽屉试衣间模式</b>：
          {drawerState === 'collapsed'
            ? '已推入抽屉，全屏鉴赏全身立绘与小窝。点击底部手柄随时拉出抽屉试穿！'
            : drawerState === 'full'
              ? '大衣橱全景模式：海量时装轻松挑选，点击【还原半屏】边试边看。'
              : '上部实时试衣镜，下部滑动衣橱抽屉。随点随穿，永不遮挡！'}
        </span>
      </div>

      {/* 1. 试衣间舞台区 (Upper Fitting Studio / Atelier) */}
      <section
        className={`drawer-stage-section ${drawerState === 'collapsed' ? 'stage-full' : 'stage-compact'}`}
      >
        {drawerState === 'collapsed' ? (
          /* 收起抽屉时的「全景鉴赏大厅」 */
          <div className="drawer-room-full-card">
            <div className="drawer-stage-header">
              <span className="micro">
                <i /> ATELIER & SUITE · 全身鉴赏大厅
              </span>
              <div className="drawer-stage-actions">
                {isDeployed ? (
                  <span className="status-badge deployed">
                    <Icon name="star" size={11} /> 当前 BIBU！形象
                  </span>
                ) : (
                  <button type="button" className="status-badge deploy-btn" onClick={onSetDeployed}>
                    设为 BIBU！形象
                  </button>
                )}
              </div>
            </div>

            <div className="drawer-stage-wrapper">
              <CharacterStage
                character={activeChar}
                outfit={currentOutfit}
                animation={anim}
                size={112}
                variant="room"
                onBounce={triggerBounce}
              />
            </div>

            <div className="drawer-char-meta">
              <p className="char-desc">{CHARACTER_MAP[activeChar]?.description}</p>
            </div>

            <div className="drawer-quick-actions">
              <button type="button" className="tool-btn micro" onClick={handleRandomize}>
                <Icon name="shuffle" size={13} /> 随机搭配
              </button>
              <button type="button" className="tool-btn micro" onClick={handleClear}>
                <Icon name="undo" size={13} /> 一键脱下
              </button>
              <Button tone="blue" onClick={onSave} disabled={busy} className="drawer-save-btn">
                {busy ? '正在保存…' : '保存穿搭与形象'}
                <Icon name="check" size={16} />
              </Button>
            </div>

            <div className="drawer-chips-block">
              <EquippedChipsBar outfit={currentOutfit} onRemoveItem={handleRemoveLayer} />
            </div>

            <div className="drawer-selector-box">
              <span className="micro muted">选择伙伴 (16 款专属穿搭)</span>
              <CharacterSelector
                selectedId={activeChar}
                outfits={outfits}
                onSelect={(id) => onSelectCharacter(id as CharacterId)}
              />
            </div>
          </div>
        ) : (
          /* 展开抽屉时的「核心试衣镜舞台」：永不遮挡、永不暗化、实时交互 */
          <div className="drawer-fitting-studio-card">
            <div className="fitting-meta-row">
              <div className="fitting-name-badge">
                <Icon name="shirt" size={13} className="fitting-avatar-icon" />
                <strong>{CHARACTER_MAP[activeChar]?.name}</strong>
                <span className="micro fitting-tag">{CHARACTER_MAP[activeChar]?.tag}</span>
              </div>
              <div className="fitting-actions-right">
                {isDeployed ? (
                  <span className="status-badge deployed micro">
                    <Icon name="star" size={11} /> BIBU！形象
                  </span>
                ) : (
                  <button
                    type="button"
                    className="status-badge deploy-btn micro"
                    onClick={onSetDeployed}
                  >
                    设为形象
                  </button>
                )}
                <Button
                  tone="yellow"
                  onClick={onSave}
                  disabled={busy}
                  className="fitting-save-btn micro"
                >
                  {busy ? '同步中…' : '保存穿搭'}
                  <Icon name="check" size={13} />
                </Button>
              </div>
            </div>

            {/* 试衣主镜台 */}
            <div className="fitting-mirror-stage">
              <CharacterStage
                character={activeChar}
                outfit={currentOutfit}
                animation={anim}
                size={drawerState === 'full' ? 52 : 84}
                variant="hero"
                onBounce={triggerBounce}
              />
            </div>

            {/* 16 款小动物横向快速切换条 (免关闭抽屉即可换人) */}
            <div className="fitting-animal-carousel" role="radiogroup" aria-label="切换试衣伙伴">
              {CHARACTER_LIST.map((item) => {
                const isSelected = item.id === activeChar
                const charOutfit = outfits[item.id as CharacterId] || {}
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`fitting-carousel-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectCharacter(item.id as CharacterId)}
                    title={`切换伙伴为 ${item.name}`}
                  >
                    <div className="carousel-mini-avatar">
                      <PixelCharacter
                        character={item.id as CharacterId}
                        outfit={charOutfit}
                        size={26}
                      />
                    </div>
                    <span className="micro">{item.name}</span>
                  </button>
                )
              })}
            </div>

            {/* 快捷操作与已穿单品清单 */}
            <div className="fitting-tools-and-chips">
              <div className="fitting-quick-tools">
                <button
                  type="button"
                  className="tool-btn micro"
                  onClick={handleRandomize}
                  title="为当前萌宠随机穿搭"
                >
                  <Icon name="shuffle" size={12} /> 随机
                </button>
                <button
                  type="button"
                  className="tool-btn micro"
                  onClick={handleClear}
                  title="一键脱下全部时装"
                >
                  <Icon name="undo" size={12} /> 脱下
                </button>
              </div>
              <div className="fitting-chips-scroll">
                <EquippedChipsBar outfit={currentOutfit} onRemoveItem={handleRemoveLayer} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. 底部收起手柄栏 (收起时固定在底部，点击拉出抽屉) */}
      {drawerState === 'collapsed' && (
        <div
          className="drawer-docked-handle"
          onClick={() => setDrawerState('half')}
          title="点击拉出抽屉开始换装"
        >
          <Icon name="shirt" size={18} className="docked-handle-icon" />
          <div className="docked-handle-info">
            <strong>开启衣橱抽屉 (73 款时装)</strong>
            <span className="micro">
              {equippedCount > 0
                ? `当前已穿戴 ${equippedCount} 件装扮 · 点击拉出抽屉继续试穿`
                : '点击拉出底部抽屉挑选衣服、帽子与饰品'}
            </span>
          </div>
          <div className="docked-handle-arrow">
            <span className="arrow-pill">拉出抽屉 ▲</span>
          </div>
        </div>
      )}

      {/* 3. 底部滑出抽屉面板 (Bottom Sheet Drawer - 无暗色遮罩，舞台全亮) */}
      <aside
        className={`drawer-sheet ${drawerState}`}
        aria-label="衣橱试衣抽屉"
        aria-hidden={drawerState === 'collapsed'}
      >
        {/* 抽屉顶部手柄与操作控制栏 */}
        <div
          className="drawer-handle-bar"
          onClick={() => setDrawerState(drawerState === 'half' ? 'full' : 'half')}
          title="点击在半屏与大图之间切换"
        >
          <span className="drawer-grip" />
          <div className="drawer-handle-controls">
            <div className="drawer-handle-title">
              <Icon name="shirt" size={14} className="drawer-title-icon" />
              <strong>衣橱试衣抽屉 (73款)</strong>
              <span className="drawer-status-pill micro">
                {drawerState === 'half' ? '半屏试衣' : '大衣橱全景'}
              </span>
            </div>

            <div className="drawer-state-btns" onClick={(e) => e.stopPropagation()}>
              {drawerState === 'half' ? (
                <button
                  type="button"
                  className="drawer-btn micro"
                  onClick={() => setDrawerState('full')}
                  title="放大衣橱浏览更多单品"
                >
                  ⤢ 展开大图
                </button>
              ) : (
                <button
                  type="button"
                  className="drawer-btn micro"
                  onClick={() => setDrawerState('half')}
                  title="还原半屏试衣模式"
                >
                  ⤡ 还原半屏
                </button>
              )}
              <button
                type="button"
                className="drawer-btn close-btn micro"
                onClick={() => setDrawerState('collapsed')}
                title="收起抽屉欣赏全身"
              >
                收起 ▼
              </button>
            </div>
          </div>
        </div>

        {/* 抽屉内部时装网格（独立内部平滑滚动） */}
        <div className="drawer-sheet-body">
          <WardrobeGrid
            outfit={currentOutfit}
            onChange={onOutfitChange}
            onItemEquipped={onItemEquipped}
            character={activeChar}
          />
        </div>
      </aside>
    </div>
  )
}
