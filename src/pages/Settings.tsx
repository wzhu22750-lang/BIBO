import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { Button, PageHeading, Panel, useTask, useToast } from '../components/ui'
import { Icon, PixelPal } from '../components/PixelArt'
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
    [code, setCode] = useState(controller.inviteCode),
    { busy, run } = useTask(),
    toast = useToast()
  return (
    <>
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
                await controller.save(name.trim(), since)
                toast('档案已保存')
              })
            }}
          >
            <div className="settings-avatar">
              <PixelPal type={space.me.avatar} />
              <span className="micro">PLAYER 01</span>
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
              {!space.partner && (
                <Button
                  disabled={busy}
                  onClick={() => void run(async () => setCode(await controller.refreshInvite()))}
                >
                  生成新邀请码
                </Button>
              )}
              {code && <InviteCode code={code} />}
              <p className="form-note">MVP 暂不支持解除绑定或更换伴侣，避免误操作丢失共同资料。</p>
            </div>
          </Panel>
          <Panel title="提醒偏好" tag="FEEDBACK">
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
            title={demo ? '从演示到专属空间' : '登录状态'}
            tag={demo ? 'DEMO MODE' : 'ACCOUNT'}
          >
            <div className="settings-section">
              <p>
                {demo
                  ? '你正在探索本地演示。聊天、照片和日期只保存在当前浏览器，不会传给真实用户。配置 Supabase 后即可登录、邀请另一位玩家。'
                  : '私人数据由数据库成员权限隔离。本产品未实现端到端加密。'}
              </p>
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  demo
                    ? exitDemo()
                    : void run(async () => {
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
