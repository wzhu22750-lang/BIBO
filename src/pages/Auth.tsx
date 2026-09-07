import { useState } from 'react'
import { configured, db } from '../lib/supabase'
import { Button, useTask, useToast } from '../components/ui'
import { Icon, PixelFlower, PixelPal } from '../components/PixelArt'
import type { SpaceController } from '../hooks/useSpace'
import { InviteCode } from './Settings'
export function Auth({ enterDemo }: { enterDemo: () => void }) {
  const [email, setEmail] = useState(''),
    [sent, setSent] = useState(false),
    { busy, run } = useTask()
  return (
    <div className="auth-screen">
      <div className="auth-art">
        <span className="micro">NO THIRD PLAYER ALLOWED.</span>
        <h1>
          两个人，
          <br />
          一整个
          <br />
          <span>小宇宙。</span>
        </h1>
        <div className="auth-pals">
          <PixelPal />
          <Icon name="heart" size={48} />
          <PixelPal type="bunny" />
        </div>
        <PixelFlower className="auth-flower" />
        <span className="micro">PRESS START. MAKE MEMORIES.</span>
      </div>
      <section className="auth-panel">
        <a className="auth-brand" href="#home">
          BIBU!
        </a>
        <span className="micro">WELCOME TO OUR PRIVATE SPACE</span>
        <h2>{configured ? '你的专属入场券' : '小宇宙，准备开门'}</h2>
        <p>
          没有广场，没有陌生人。
          <br />
          只有你，和你最想分享日常的那个人。
        </p>
        {configured ? (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              void run(async () => {
                const { error } = await db().auth.signInWithOtp({
                  email: email.trim(),
                  options: { emailRedirectTo: window.location.origin },
                })
                if (error) throw error
                setSent(true)
              })
            }}
          >
            <label>
              邮箱地址
              <input
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSent(false)
                }}
              />
            </label>
            <Button tone="yellow" type="submit" disabled={busy || sent}>
              {busy ? '正在发送…' : sent ? '邮件已发送，请检查收件箱' : '发送登录魔法链接'}
              <Icon name="arrow" size={17} />
            </Button>
            {sent && (
              <p className="success-note" role="status">
                请在此设备打开邮箱中的链接完成登录。如果没收到，也看看垃圾邮件。
              </p>
            )}
          </form>
        ) : (
          <div className="setup-instructions">
            <strong>先连接你自己的 Supabase</strong>
            <ol>
              <li>复制项目根目录的 .env.example 为 .env.local。</li>
              <li>填写项目 URL 和公开的 Publishable Key。</li>
              <li>执行 supabase/migrations 中的 SQL，配置 Auth 回调地址。</li>
              <li>重新启动开发服务，即可邮箱登录。</li>
            </ol>
            <p>完整步骤见项目根目录 README.md。不要填写 service_role 密钥。</p>
          </div>
        )}
        <div className="auth-divider">或先逛一逛</div>
        <Button tone="white" onClick={enterDemo}>
          进入本地演示 <Icon name="spark" size={16} />
        </Button>
        <span className="auth-privacy">
          <Icon name="lock" size={13} /> 演示数据与真实空间完全分开
        </span>
      </section>
    </div>
  )
}
export function Onboarding({ controller }: { controller: SpaceController }) {
  const [invite, setInvite] = useState(''),
    [code, setCode] = useState(''),
    { busy, run } = useTask(),
    toast = useToast()
  return (
    <div className="onboarding">
      <div className="onboarding-logo">BIBU!</div>
      <Icon name="heart" size={56} />
      <h1>宇宙很小，只装得下两个人。</h1>
      <p>创建一个私人空间，或输入 TA 给你的邀请码。</p>
      {controller.space?.couple ? (
        <div className="onboarding-box">
          <h2>你的空间已创建 ✨</h2>
          <p>可以先去布置小窝，再把入场券发给 TA。</p>
          {code ? (
            <InviteCode code={code} />
          ) : (
            <Button
              disabled={busy}
              onClick={() => void run(async () => setCode(await controller.refreshInvite()))}
            >
              生成邀请码
            </Button>
          )}
        </div>
      ) : (
        <div className="onboarding-options">
          <section className="onboarding-box">
            <span className="micro">PLAYER 01</span>
            <h2>我来开一个小宇宙</h2>
            <p>创建空间，获取专属邀请码。</p>
            <Button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await controller.createSpace()
                  setCode(result)
                  window.location.hash = 'settings'
                  toast('空间创建成功，把入场券分享给 TA 吧')
                })
              }
            >
              创建我们的空间
              <Icon name="plus" size={17} />
            </Button>
          </section>
          <form
            className="onboarding-box form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              void run(async () => {
                await controller.joinSpace(invite)
                toast('绑定成功，欢迎回家！')
              })
            }}
          >
            <span className="micro">PLAYER 02</span>
            <h2>TA 正在等我</h2>
            <label>
              输入邀请码
              <input
                required
                minLength={32}
                maxLength={32}
                value={invite}
                autoCapitalize="none"
                autoCorrect="off"
                onChange={(e) => setInvite(e.target.value.trim())}
                placeholder="粘贴 TA 发来的 32 位邀请码"
              />
            </label>
            <Button tone="green" disabled={busy} type="submit">
              加入 TA 的空间
              <Icon name="arrow" size={17} />
            </Button>
          </form>
        </div>
      )}
      <button
        className="text-button"
        onClick={() =>
          void run(async () => {
            const { error } = await db().auth.signOut()
            if (error) throw error
          })
        }
      >
        退出登录
      </button>
    </div>
  )
}
