import { InactiveEventOutbox } from '../components/InactiveEventOutbox'
import { downloadSpace } from '../lib/spaceExport'
import { PushRegistrationPanel } from '../components/PushRegistrationPanel'
import { SettingsNote } from '../components/SettingsNote'
import { AccountDeletion } from '../components/AccountDeletion'
import { InactiveOutbox } from '../components/InactiveOutbox'
import { InvitationManager } from '../components/InvitationManager'
import { BibuNative } from '../native'
import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { AvatarType, Page } from '../lib/types'
import { Button, Modal, PageHeading, Panel, useTask, useToast } from '../components/ui'
import { Icon } from '../components/PixelArt'
import { CharacterSelector, PixelCharacter, type PixelCharacterAnimation } from '../components/pet'
import { CHARACTER_MAP } from '../lib/pet'
import { db } from '../lib/supabase'
import { disableFeedback, enableFeedback } from '../lib/notifications'
import { localDateInput } from '../lib/dates'
import { PixelDatePicker } from '../components/PixelPickers'
export function InviteCode({ code }: { code: string }) {
  const { busy, run } = useTask(),
    toast = useToast()
  return (
    <div className="invite-code">
      <p>把这张入场券，私下交给唯一的 TA。</p>
      <code>{code}</code>
      <Button
        disabled={busy}
        tone="green"
        onClick={() =>
          void run(async () => {
            await navigator.clipboard.writeText(code)
            toast('邀请码已复制，有效期 24 小时')
          })
        }
      >
        复制邀请码
      </Button>
      <small>24 小时有效 · 使用一次即失效 · 重新生成会使旧码失效</small>
    </div>
  )
}
export function Settings({
  controller,
  navigate,
  demo,
  exitDemo,
  sound,
  setSound,
}: {
  controller: SpaceController
  navigate?: (page: Page) => void
  demo: boolean
  exitDemo: () => void
  sound: boolean
  setSound: (on: boolean) => void
}) {
  const space = controller.space!,
    [name, setName] = useState(space.me.name),
    [since, setSince] = useState(space.couple?.together_since || localDateInput()),
    [avatar, setAvatar] = useState<AvatarType>(space.me.avatar || 'cat'),
    outfits = space.me.outfits || {},
    [petAnim, setPetAnim] = useState<PixelCharacterAnimation>('none'),
    [showCharacterPicker, setShowCharacterPicker] = useState(false),
    [newPass, setNewPass] = useState(''),
    [closing, setClosing] = useState(false),
    [closeText, setCloseText] = useState(''),
    { busy, run } = useTask(),
    toast = useToast()

  const handleSelectCharacter = (newId: AvatarType) => {
    setAvatar(newId)
    setPetAnim('bounce')
    setTimeout(() => setPetAnim('none'), 400)
  }

  return (
    <>
      {closing && (
        <Modal
          title="解除当前关系？"
          onClose={() => {
            if (!busy) setClosing(false)
          }}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (closeText !== '解除绑定') return
              void run(async () => {
                await controller.closeRelationship(space.couple!.id)
                setClosing(false)
                toast('双方已解除绑定，旧空间已封存。可创建或加入新空间。')
              })
            }}
          >
            <p>
              此操作会同时移除你和另一位玩家的成员关系，撤销邀请码并结束共享专注。双方将无法继续访问旧空间，但云端资料尚未删除。
            </p>
            <p>
              旧照片、聊天与回忆不会带入新空间。本版本没有封存空间恢复入口；如需保留可见副本，请先自行保存。其他设备离线缓存无法即时远程清除，已安排的本机提醒需在本机取消。
            </p>
            <p>
              未同步到旧空间的消息不会发送到新空间；它们仍留在本机原账号队列中。解除不是账号注销或彻底数据删除。
            </p>
            <label>
              输入“解除绑定”确认
              <input
                value={closeText}
                onChange={(e) => setCloseText(e.target.value)}
                autoComplete="off"
              />
            </label>
            <Button tone="pink" type="submit" disabled={busy || closeText !== '解除绑定'}>
              {busy ? '正在解除…' : '确认解除并封存'}
            </Button>
            <Button tone="white" type="button" disabled={busy} onClick={() => setClosing(false)}>
              保留当前关系
            </Button>
          </form>
        </Modal>
      )}
      <PageHeading
        eyebrow="OUR SPACE, OUR RULES"
        title="空间设置"
        subtitle="调整一点小细节，让这里更像我们。"
      />
      <div className="settings-grid">
        <Panel title="我的玩家档案" tag="PROFILE">
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              void run(async () => {
                await controller.save(name.trim(), since, avatar, outfits)
                toast('档案与 BIBU！形象已保存')
              })
            }}
          >
            {/* 1. 萌宠衣橱快捷入口横幅 */}
            <div
              className="settings-wardrobe-entry-card"
              onClick={() => navigate?.('wardrobe')}
              role="button"
              tabIndex={0}
            >
              <div className="wardrobe-entry-avatar">
                <PixelCharacter
                  character={avatar}
                  outfit={outfits[avatar]}
                  size={44}
                  animation={petAnim}
                />
              </div>
              <div className="wardrobe-entry-info">
                <div className="wardrobe-entry-head">
                  <strong>萌宠衣橱与换装中心</strong>
                  <span className="micro tag">73款时装 · 16款萌宠</span>
                </div>
                <p>为你的小动物自由搭配衣服、帽子与配饰，每只角色独立保留专属穿搭</p>
              </div>
              <Button
                tone="yellow"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate?.('wardrobe')
                }}
                className="wardrobe-entry-btn"
              >
                进入衣橱 <Icon name="shirt" size={15} />
              </Button>
            </div>

            {/* 2. 当前 BIBU 形象展台 */}
            <div className="settings-pet-hero">
              <div className="pet-hero-stage">
                <PixelCharacter
                  character={avatar}
                  outfit={outfits[avatar]}
                  size={68}
                  animation={petAnim}
                  onClick={() => {
                    setPetAnim('happy')
                    setTimeout(() => setPetAnim('none'), 600)
                  }}
                />
              </div>
              <div className="pet-hero-meta">
                <span className="micro eyebrow">PLAYER 01 · 当前 BIBU！形象</span>
                <h3 className="pet-hero-title">{CHARACTER_MAP[avatar]?.name || '小动物'}</h3>
                <p className="pet-hero-desc">
                  {CHARACTER_MAP[avatar]?.description || '你的专属像素好伙伴。'}
                </p>
              </div>
            </div>

            {/* 3. 选择 BIBU 形象 */}
            <div className="settings-section-block">
              <div className="section-block-header">
                <div className="section-block-title-group">
                  <label className="avatar-picker-label">选择你的 BIBU！形象</label>
                  <span className="micro muted">自动穿戴该角色已保存的穿搭</span>
                </div>
                <button
                  type="button"
                  className="character-picker-toggle-btn"
                  onClick={() => setShowCharacterPicker((prev) => !prev)}
                  aria-expanded={showCharacterPicker}
                >
                  <Icon name={showCharacterPicker ? 'close' : 'grid'} size={12} />
                  <span>{showCharacterPicker ? '收起形象列表' : '更换形象 (16款)'}</span>
                  <Icon
                    name="arrow"
                    size={10}
                    className={`toggle-arrow ${showCharacterPicker ? 'up' : 'down'}`}
                  />
                </button>
              </div>

              {showCharacterPicker ? (
                <div className="character-picker-expanded-body">
                  <CharacterSelector
                    selectedId={avatar}
                    outfits={outfits}
                    onSelect={handleSelectCharacter}
                  />
                  <div className="character-picker-collapse-bar">
                    <span className="micro muted">
                      当前选择：<strong>{CHARACTER_MAP[avatar]?.name || '小动物'}</strong>
                    </span>
                    <button
                      type="button"
                      className="character-picker-toggle-btn mini"
                      onClick={() => setShowCharacterPicker(false)}
                    >
                      <span>收起形象列表</span>
                      <Icon name="arrow" size={10} className="toggle-arrow up" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="character-selector-collapsed-preview"
                  onClick={() => setShowCharacterPicker(true)}
                  aria-label="展开选择 BIBU！形象"
                >
                  <div className="collapsed-preview-left">
                    <Icon name="spark" size={12} />
                    <span>想换个形象？点击展开 16 款萌宠列表</span>
                  </div>
                  <span className="collapsed-preview-action">展开选择 »</span>
                </button>
              )}
            </div>

            <label>
              我的昵称
              <input
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div>
              <span
                style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 650 }}
              >
                我们在一起的日期
              </span>
              <PixelDatePicker
                value={since}
                min="1900-01-01"
                max={localDateInput()}
                yearMax={new Date().getFullYear()}
                onChange={setSince}
              />
            </div>
            <SettingsNote title="日期怎么算？" className="form-note">
              以本地自然日计算经过天数，在一起当天为第 0 天。
            </SettingsNote>
            <Button type="submit" tone="blue" disabled={busy || !name.trim()}>
              保存小档案
              <Icon name="check" size={16} />
            </Button>
          </form>
        </Panel>
        <div className="settings-aside">
          {!demo && (
            <InactiveOutbox userId={space.me.id} currentCoupleId={space.couple?.id || null} />
          )}
          {!demo && (
            <InactiveEventOutbox userId={space.me.id} currentCoupleId={space.couple?.id || null} />
          )}
          <Panel title="双人入场券" tag="PRIVATE">
            <div className="settings-section">
              <div className="binding-status">
                <Icon name="heart" size={28} />
                <div>
                  <strong>
                    {space.partner ? `${space.me.name} × ${space.partner.name}` : '等待另一位玩家'}
                  </strong>
                  <p>
                    {demo
                      ? '演示角色，不代表真实绑定'
                      : space.partner
                        ? '已绑定 · 第三位玩家无法加入'
                        : '分享邀请码，让 TA 加入你的宇宙'}
                  </p>
                </div>
              </div>
              {!demo && !space.partner && (
                <InvitationManager key={space.couple!.id} controller={controller} />
              )}
              {!demo && (
                <Button tone="pink" disabled={busy} onClick={() => setClosing(true)}>
                  解除并封存当前空间
                </Button>
              )}
              <SettingsNote title="解除绑定说明">
                解除会封存旧空间。重新绑定只能进入新空间，旧关系内容不会分享给新伴侣。
              </SettingsNote>
            </div>
          </Panel>
          {!demo && (
            <Panel title="本机离线快照" tag="LOCAL CACHE">
              <div className="settings-section">
                <SettingsNote title="离线快照说明">
                  <p>
                    开启后，在这台设备保存最近聊天、事件和回忆文字，最多保留 24
                    小时；不保存照片签名链接、登录令牌或邀请码。只有曾成功联网读取的账号可离线恢复。
                  </p>
                  <p>
                    本机数据不是端到端加密存储；共享设备请勿开启。服务器撤销访问后，离线期间无法即时获知。清除快照不删除云端资料或待发消息。
                  </p>
                </SettingsNote>
                <Button
                  tone="white"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      controller.setOfflineCache(!controller.offlineCacheEnabled)
                      toast(
                        controller.offlineCacheEnabled
                          ? '已关闭并清除本机快照'
                          : '已开启本机离线快照',
                      )
                    })
                  }
                >
                  {controller.offlineCacheEnabled ? '关闭并清除本机快照' : '开启本机离线快照'}
                </Button>
              </div>
            </Panel>
          )}
          <Panel title="提醒偏好" tag="FEEDBACK">
            <PushRegistrationPanel controller={controller} />
            <div className="settings-section">
              <h3>Android 系统通知</h3>
              <SettingsNote title="系统通知说明">
                只在你点击时申请权限。测试通知不代表伴侣消息已实现后台推送。
              </SettingsNote>
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const permission = await BibuNative.permissions.requestNotifications()
                    if (!permission.supported) {
                      toast(permission.reason || '此环境暂不支持')
                      return
                    }
                    if (!permission.granted) {
                      toast('通知未开启，可到系统应用设置中调整', true)
                      return
                    }
                    const result = await BibuNative.notifications.show({
                      id: 1,
                      title: 'BIBU！通知测试',
                      body: '点击回到我们的小窝',
                      route: '#home',
                    })
                    toast(
                      result.supported
                        ? '通知已交给 Android 系统，请检查通知栏并点击验证'
                        : result.reason || '通知暂不可用',
                    )
                  })
                }
              >
                开启并测试系统通知
              </Button>
            </div>
            <div className="settings-section">
              <div className="setting-row">
                <div>
                  <h3>声音与震动</h3>
                  <p>{sound ? '本页已授权，支持时播放与震动' : '默认关闭，点击开启并试听'}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={sound}
                  aria-label="声音与震动"
                  className={`toggle ${sound ? 'on' : ''}`}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      if (sound) {
                        disableFeedback()
                        setSound(false)
                      } else {
                        await enableFeedback()
                        setSound(true)
                      }
                    })
                  }
                >
                  <span />
                </button>
              </div>
              <SettingsNote title="声音与震动说明">
                开启后会保存在本机，退出或刷新后保持开启；声音会在你再次点击页面时自动恢复（浏览器只允许在点击手势里发声）。手机震动取决于设备支持；关闭网页或锁屏后，不保证收到提醒。
              </SettingsNote>
            </div>
          </Panel>
          <Panel
            title={demo ? '从演示到专属空间' : '账号与安全'}
            tag={demo ? 'DEMO MODE' : 'ACCOUNT'}
          >
            <div className="settings-section">
              <SettingsNote title={demo ? '演示模式说明' : '账号与安全说明'}>
                {demo
                  ? '你正在探索本地演示。聊天、照片和日期只保存在当前浏览器，不会传给真实用户。配置 Supabase 后即可登录、邀请另一位玩家。'
                  : '私人数据由数据库成员权限隔离。本产品未实现端到端加密。'}
              </SettingsNote>
              {!demo && (
                <form
                  className="form-stack"
                  style={{
                    margin: '14px 0',
                    padding: '14px 0',
                    borderTop: '1px solid #e1e7d5',
                    borderBottom: '1px solid #e1e7d5',
                  }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    void run(async () => {
                      if (newPass.length < 6) throw new Error('密码长度至少需要 6 位')
                      const { error } = await db().auth.updateUser({ password: newPass })
                      if (error) throw error
                      setNewPass('')
                      toast('登录密码设置成功，后续可直接用密码登录')
                    })
                  }}
                >
                  <label>
                    设置 / 修改登录密码
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="至少 6 位新密码"
                      minLength={6}
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                    />
                  </label>
                  <Button tone="green" type="submit" disabled={busy || newPass.length < 6}>
                    更新登录密码
                    <Icon name="check" size={16} />
                  </Button>
                </form>
              )}
              {!demo && (
                <Button
                  tone="white"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      downloadSpace(space)
                      toast('当前已加载的空间数据已导出到下载目录；不包含图片文件和完整历史')
                    })
                  }
                >
                  导出当前已加载的数据
                </Button>
              )}
              <Button
                tone="white"
                onClick={() =>
                  void run(async () => {
                    const info = [
                      `build: ${__BIBU_BUILD__.commit}`,
                      `builtAt: ${__BIBU_BUILD__.builtAt}`,
                      `mode: ${__BIBU_BUILD__.mode}`,
                      `url: ${window.location.href}`,
                      `ua: ${navigator.userAgent}`,
                    ].join('\n')
                    await navigator.clipboard.writeText(info)
                    toast('诊断信息已复制，可发给开发者对比版本')
                  })
                }
              >
                <Icon name="spark" size={17} />
                复制诊断信息（版本 / 环境）
              </Button>
              <AccountDeletion controller={controller} demo={demo} />
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  demo
                    ? exitDemo()
                    : void run(async () => {
                        const warnings = await controller.signOut()
                        if (warnings.length)
                          toast(`已退出登录；部分本机清理未确认：${warnings.join('；')}`, true)
                      })
                }
              >
                <Icon name={demo ? 'arrow' : 'logout'} size={17} />
                {demo ? '进入登录 / 配置指引' : '退出登录'}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
