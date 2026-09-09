import { useMemo, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { AvatarType, Page } from '../lib/types'
import {
  CHARACTER_MAP,
  type CharacterId,
  type CharacterOutfits,
  type Outfit,
  type WardrobeItem,
} from '../lib/pet'
import type { PixelCharacterAnimation } from '../components/pet/PixelCharacter'
import { PageHeading, useTask, useToast } from '../components/ui'
import { Icon } from '../components/PixelArt'
import { WardrobeSplitLayout } from './wardrobe/WardrobeSplitLayout'
import { WardrobeQaLayout } from './wardrobe/WardrobeQaLayout'

type WardrobePageProps = {
  controller: SpaceController
  navigate: (page: Page) => void
  initialMode?: string
}

/**
 * 衣橱页入口：开发环境下 #wardrobe?mode=qa 进入视觉 QA 面板。
 * QA 面板与正式衣橱为互斥的独立子树，避免 hooks 顺序问题。
 */
export function Wardrobe(props: WardrobePageProps) {
  if (import.meta.env.DEV && props.initialMode === 'qa') {
    return (
      <div className="wardrobe-page layout-split">
        <WardrobeQaLayout onExit={() => props.navigate('wardrobe')} />
      </div>
    )
  }
  return <WardrobeMain {...props} />
}

function WardrobeMain({ controller, navigate, initialMode: _initialMode }: WardrobePageProps) {
  const space = controller.space!
  const toast = useToast()
  const { busy, run } = useTask()

  // 共享的核心底层业务状态
  const [activeChar, setActiveChar] = useState<CharacterId>(
    (space.me.avatar as CharacterId) || 'cat',
  )
  const [outfits, setOutfits] = useState<CharacterOutfits>(space.me.outfits || {})
  const [deployedAvatar, setDeployedAvatar] = useState<AvatarType>(space.me.avatar || 'cat')
  const [anim, setAnim] = useState<PixelCharacterAnimation>('none')

  // 触发跳动反馈
  const triggerBounce = () => {
    setAnim('bounce')
    setTimeout(() => setAnim('none'), 400)
  }

  // 切换打扮的角色
  const handleSelectCharacter = (charId: CharacterId) => {
    setActiveChar(charId)
    triggerBounce()
  }

  // 修改当前角色的穿搭
  const handleOutfitChange = (newOutfit: Outfit) => {
    setOutfits((prev) => ({
      ...prev,
      [activeChar]: newOutfit,
    }))
    triggerBounce()
  }

  // 单件装备点击反馈
  const handleItemEquipped = (_item: WardrobeItem) => {
    triggerBounce()
  }

  // 设为当前 BIBU！形象
  const handleSetDeployed = () => {
    setDeployedAvatar(activeChar as AvatarType)
    triggerBounce()
    toast(`已将【${CHARACTER_MAP[activeChar]?.name || activeChar}】设为你的 BIBU！形象！`)
  }

  // 保存所有穿搭和当前 BIBU！形象
  const handleSave = () => {
    void run(async () => {
      await controller.save(
        space.me.name,
        space.couple?.together_since || '',
        deployedAvatar,
        outfits,
      )
      toast('穿搭与 BIBU！形象已保存同步！')
    })
  }

  const currentOutfit = outfits[activeChar] || {}
  const isDeployed = deployedAvatar === activeChar

  // 检测是否有未保存的更改
  const isDirty = useMemo(() => {
    const savedOutfits = space.me.outfits || {}
    const savedAvatar = space.me.avatar || 'cat'
    if (deployedAvatar !== savedAvatar) return true
    return JSON.stringify(outfits) !== JSON.stringify(savedOutfits)
  }, [outfits, deployedAvatar, space.me.outfits, space.me.avatar])

  const sharedProps = {
    activeChar,
    outfits,
    currentOutfit,
    deployedAvatar,
    isDeployed,
    isDirty,
    anim,
    busy,
    triggerBounce,
    onSelectCharacter: handleSelectCharacter,
    onOutfitChange: handleOutfitChange,
    onItemEquipped: handleItemEquipped,
    onSetDeployed: handleSetDeployed,
    onSave: handleSave,
    navigate,
  }

  return (
    <div className="wardrobe-page layout-split">
      <PageHeading
        eyebrow="PET & WARDROBE"
        title="萌宠衣橱"
        subtitle="为 16 款小动物定制专属穿搭，随时试穿、保存，并设为你的 BIBU！形象。"
        leading={
          <button
            type="button"
            className="wardrobe-exit-btn"
            onClick={() => navigate('settings')}
            title="返回档案"
            aria-label="返回档案"
          >
            <Icon name="arrow" size={13} />
            <span>返回</span>
          </button>
        }
      />

      {/* 正式采用上下分屏试衣布局 */}
      <WardrobeSplitLayout {...sharedProps} />
    </div>
  )
}
