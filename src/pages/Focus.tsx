import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { Button, PageHeading, Panel, useTask, useToast } from '../components/ui'
import { Icon, PixelPal } from '../components/PixelArt'
export function Focus({ controller }: { controller: SpaceController }) {
  const space = controller.space!,
    [activity, setActivity] = useState('学习'),
    [minutes, setMinutes] = useState(25),
    [allow, setAllow] = useState(false),
    [now, setNow] = useState(Date.now()),
    { busy, run } = useTask(),
    toast = useToast()
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const own = space.focus.find(
    (f) => f.user_id === space.me.id && new Date(f.ends_at).getTime() > now,
  )
  const partner = space.focus.find(
    (f) => f.user_id === space.partner?.id && new Date(f.ends_at).getTime() > now,
  )
  const seconds = own
    ? Math.max(0, Math.ceil((new Date(own.ends_at).getTime() - now) / 1000))
    : minutes * 60
  return (
    <>
      <PageHeading
        eyebrow="GROW APART, GROW TOGETHER"
        title="专注陪伴"
        subtitle="不是监督你，是陪你成为更喜欢的自己。"
      />
      <div className="focus-layout">
        <Panel className="focus-main" title="我的专注时间" tag="PLAYER 01">
          <div className="focus-timer-area">
            <div className="focus-status">
              <i />
              {own ? `正在${own.activity} · 专心模式 ON` : '准备好，给自己一点专注时间'}
            </div>
            <div className="focus-clock" role="timer" aria-label="专注剩余时间">
              {String(Math.floor(seconds / 60)).padStart(2, '0')}
              <span>:</span>
              {String(seconds % 60).padStart(2, '0')}
            </div>
            <PixelPal type={space.me.avatar} />
            <span className="micro">ONE SMALL STEP AT A TIME</span>
          </div>
          {own ? (
            <div className="form-stack">
              <p className="focus-consent-state">
                <Icon name={own.allow_reminders ? 'sound' : 'lock'} size={18} />
                {own.allow_reminders ? '本次允许对方发送提醒' : '本次不接收对方的打扰提醒'}
              </p>
              <Button
                tone="pink"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await controller.endFocus()
                    toast('专注已结束，辛苦啦！')
                  })
                }
              >
                结束本次专注
              </Button>
              <p className="form-note">你随时可以结束，只控制自己的状态。</p>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault()
                void run(async () => {
                  await controller.startFocus(activity, minutes, allow)
                  toast('专注开始，慢慢来，你可以的！')
                })
              }}
            >
              <label>
                现在想做什么？
                <select value={activity} onChange={(e) => setActivity(e.target.value)}>
                  <option>学习</option>
                  <option>工作</option>
                  <option>阅读</option>
                  <option>运动</option>
                </select>
              </label>
              <fieldset className="duration-picker">
                <legend>给自己多少时间？</legend>
                {[15, 25, 45, 60].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={minutes === n ? 'selected' : ''}
                    onClick={() => setMinutes(n)}
                  >
                    {n} 分钟
                  </button>
                ))}
              </fieldset>
              <label className="check-label consent-box">
                <input
                  type="checkbox"
                  checked={allow}
                  onChange={(e) => setAllow(e.target.checked)}
                />
                <span>
                  我主动允许对方在本次专注中发提醒
                  <small>默认关闭。结束本次专注即可撤回授权。</small>
                </span>
              </label>
              <Button tone="green" disabled={busy} type="submit">
                <Icon name="focus" size={20} />
                开始专注
              </Button>
            </form>
          )}
        </Panel>
        <div className="focus-aside">
          <Panel title="TA 的小状态" tag="PLAYER 02" className="partner-focus">
            <PixelPal type={space.partner?.avatar || 'bunny'} />
            <h3>{space.partner?.name || '另一位玩家'}</h3>
            <div className="partner-state">
              {partner
                ? `正在${partner.activity} · 还有 ${Math.ceil((new Date(partner.ends_at).getTime() - now) / 60000)} 分钟`
                : '暂时没有开启专注'}
            </div>
            <p>
              {partner?.allow_reminders
                ? 'TA 主动允许你在这次专注中提醒'
                : '不打扰，也是一种温柔的陪伴。'}
            </p>
            <div className="reminder-grid">
              {['去学习', '去工作', '休息一下', '哔卟哔卟'].map((kind) => (
                <Button
                  key={kind}
                  tone="white"
                  disabled={!partner?.allow_reminders || busy}
                  onClick={() =>
                    void run(async () => {
                      await controller.sendPing(kind)
                      toast('提醒已发送，暂无送达回执')
                    })
                  }
                >
                  {kind}
                </Button>
              ))}
            </div>
          </Panel>
          <div className="consent-note">
            <Icon name="lock" size={25} />
            <h3>陪伴，不是监控</h3>
            <p>不读取其他 App，不查看屏幕，不偷偷统计。每一次专注，都由本人开启和结束。</p>
            <p>未来的 Android 屏幕时间或专注锁定能力，也只会在明确授权后作用于本人设备。</p>
          </div>
        </div>
      </div>
    </>
  )
}
