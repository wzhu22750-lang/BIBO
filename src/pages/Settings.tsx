import { InactiveEventOutbox } from '../components/InactiveEventOutbox'
import { downloadSpace } from '../lib/spaceExport'
import { PushRegistrationPanel } from '../components/PushRegistrationPanel'
import { AccountDeletion } from '../components/AccountDeletion'
import { InactiveOutbox } from '../components/InactiveOutbox'
import { InvitationManager } from '../components/InvitationManager'
import { BiboNative } from '../native'
import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { AvatarType } from '../lib/types'
import { Button, Modal, PageHeading, Panel, useTask, useToast } from '../components/ui'
import { Icon, PixelPal, AVATAR_LIST } from '../components/PixelArt'
import { db } from '../lib/supabase'
import { disableFeedback, enableFeedback } from '../lib/notifications'
import { localDateInput } from '../lib/dates'
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
  demo,
  exitDemo,
  sound,
  setSound,
}: {
  controller: SpaceController
  demo: boolean
  exitDemo: () => void
  sound: boolean
  setSound: (on: boolean) => void
}) {
  const space = controller.space!,
    [name, setName] = useState(space.me.name),
    [since, setSince] = useState(space.couple?.together_since || localDateInput()),
    [avatar, setAvatar] = useState<AvatarType>(space.me.avatar || 'cat'),
    [newPass, setNewPass] = useState(''),
    [closing, setClosing] = useState(false),
    [closeText, setCloseText] = useState(''),
    { busy, run } = useTask(),
    toast = useToast()
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
                await controller.save(name.trim(), since, avatar)
                toast('档案已保存')
              })
            }}
          >
            <div className="settings-avatar">
              <PixelPal type={avatar} />
              <span className="micro">
                PLAYER 01 · {AVATAR_LIST.find((a) => a.id === avatar)?.name || '专属形象'}
              </span>
            </div>
            <div className="settings-avatar-select">
              <label className="avatar-picker-label">选择你的像素专属形象</label>
              <div className="avatar-grid" role="radiogroup" aria-label="选择像素形象">
                {AVATAR_LIST.map((item) => {
                  const active = avatar === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`avatar-option ${active ? 'active' : ''}`}
                      onClick={() => setAvatar(item.id)}
                    >
                      <div className="avatar-preview">
                        <PixelPal type={item.id} />
                      </div>
                      <span className="avatar-name">{item.name}</span>
                      <span className="avatar-tag">{item.tag}</span>
                    </button>
                  )
                })}
              </div>
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
            <label>
              我们在一起的日期
              <input
                type="date"
                required
                max={localDateInput()}
                value={since}
                onChange={(e) => setSince(e.target.value)}
              />
            </label>
            <p className="form-note">以本地自然日计算经过天数，在一起当天为第 0 天。</p>
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
              <p className="form-note">
                解除会封存旧空间。重新绑定只能进入新空间，旧关系内容不会分享给新伴侣。
              </p>
            </div>
          </Panel>
          {!demo && (
            <Panel title="本机离线快照" tag="LOCAL CACHE">
              <div className="settings-section">
                <p>
                  开启后，在这台设备保存最近聊天、事件和回忆文字，最多保留 24
                  小时；不保存照片签名链接、登录令牌或邀请码。只有曾成功联网读取的账号可离线恢复。
                </p>
                <p>
                  本机数据不是端到端加密存储；共享设备请勿开启。服务器撤销访问后，离线期间无法即时获知。清除快照不删除云端资料或待发消息。
                </p>
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
              <p>只在你点击时申请权限。测试通知不代表伴侣消息已实现后台推送。</p>
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    const permission = await BiboNative.permissions.requestNotifications()
                    if (!permission.supported) {
                      toast(permission.reason || '此环境暂不支持')
                      return
                    }
                    if (!permission.granted) {
                      toast('通知未开启，可到系统应用设置中调整', true)
                      return
                    }
                    const result = await BiboNative.notifications.show({
                      id: 1,
                      title: 'BIBO 通知测试',
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
              <p className="form-note">
                全屏特效不依赖声音授权。手机震动取决于设备支持；关闭网页或系统挂起后，不保证收到提醒。刷新后需重新授权声音。
              </p>
            </div>
          </Panel>
          <Panel
            title={demo ? '从演示到专属空间' : '账号与安全'}
            tag={demo ? 'DEMO MODE' : 'ACCOUNT'}
          >
            <div className="settings-section">
              <p>
                {demo
                  ? '你正在探索本地演示。聊天、照片和日期只保存在当前浏览器，不会传给真实用户。配置 Supabase 后即可登录、邀请另一位玩家。'
                  : '私人数据由数据库成员权限隔离。本产品未实现端到端加密。'}
              </p>
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
              <AccountDeletion controller={controller} demo={demo} />
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  demo
                    ? exitDemo()
                    : void run(async () => {
                        controller.clearOfflineSnapshot()
                        const { error } = await db().auth.signOut()
                        if (error) throw error
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
