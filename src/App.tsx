import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import type { Session } from '@supabase/supabase-js'
import { configured, errorText, supabase } from './lib/supabase'
import { useBibu } from './hooks/useBibu'
import { useSpace } from './hooks/useSpace'
import { disableFeedback, loadFeedbackEnabled, restoreFeedback, storeFeedbackEnabled } from './lib/notifications'
import type { Page } from './lib/types'
import { Shell } from './components/Shell'
import { ToastContext, Button } from './components/ui'
import { Icon } from './components/PixelArt'
import { PingEffect } from './components/PingEffect'
import { Home } from './pages/Home'
import { Chat } from './pages/Chat'
import { Events } from './pages/Events'
import { Photos } from './pages/Photos'
import { Focus } from './pages/Focus'
import { Settings } from './pages/Settings'
import { Auth, Onboarding } from './pages/Auth'
const pages: Page[] = ['home', 'chat', 'events', 'photos', 'focus', 'settings']
function currentPage(): Page {
  const hash = window.location.hash.slice(1) as Page
  return pages.includes(hash) ? hash : 'home'
}
function Workspace({
  session,
  demo,
  exitDemo,
}: {
  session: Session | null
  demo: boolean
  exitDemo: () => void
}) {
  const controller = useSpace(session, demo),
    [page, setPage] = useState<Page>(currentPage),
    [sound, setSound] = useState<boolean>(() => loadFeedbackEnabled())
  const bibu = useBibu(controller, demo)
  useEffect(() => {
    // 声音/震动偏好持久化到本机：退出或刷新后保持开启，声音在首次点击时自动恢复
    storeFeedbackEnabled(sound)
    if (sound) restoreFeedback()
    else disableFeedback()
    return () => disableFeedback()
  }, [sound])
  useEffect(() => {
    const onHash = () => setPage(currentPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  function navigate(value: Page) {
    setPage(value)
    window.location.hash = value
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  if (controller.loading)
    return (
      <div className="loading-screen">
        <span className="loading-pixel">♥</span>
        <h2>正在连接我们的小宇宙…</h2>
      </div>
    )
  if (!controller.space)
    return (
      <div className="loading-screen">
        <h2>暂时没能打开小宇宙</h2>
        <p role="alert">{controller.error}</p>
        <Button onClick={() => void controller.reload()}>重新连接</Button>
        <Button tone="white" onClick={() => void supabase?.auth.signOut()}>
          退出并重新登录
        </Button>
      </div>
    )
  if (!controller.space.couple) return <Onboarding controller={controller} />
  return (
    <>
      <Shell
        page={page}
        navigate={navigate}
        space={controller.space}
        demo={demo}
        connection={controller.connection}
        bibu={bibu}
      >
        {controller.error && (
          <div className="error-banner" role="alert">
            同步失败，以下可能是旧数据：{controller.error}
            <button onClick={() => void controller.reload()}>重试</button>
          </div>
        )}
        {!controller.space.partner && page !== 'chat' && (
          <div className="waiting-banner">
            你的空间已准备好，去「空间设置」生成邀请码，邀请 TA 加入。
            <button onClick={() => navigate('settings')}>生成邀请码 →</button>
          </div>
        )}
        {page === 'home' && (
          <Home controller={controller} navigate={navigate} demo={demo} bibu={bibu} />
        )}{' '}
        {page === 'chat' && <Chat controller={controller} demo={demo} />}{' '}
        {page === 'events' && <Events controller={controller} />}{' '}
        {page === 'photos' && <Photos controller={controller} demo={demo} />}{' '}
        {page === 'focus' && <Focus controller={controller} />}{' '}
        {page === 'settings' && (
          <Settings
            controller={controller}
            demo={demo}
            exitDemo={exitDemo}
            sound={sound}
            setSound={setSound}
          />
        )}
      </Shell>
      {controller.ping && <PingEffect ping={controller.ping} onClose={controller.dismissPing} />}
    </>
  )
}
export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    [initializing, setInitializing] = useState(configured),
    [demo, setDemo] = useState(!configured),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(null)
  useEffect(() => {
    if (!supabase) return
    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next)
        setInitializing(false)
      }
    })
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          if (error) setToast({ message: errorText(error), error: true })
          setSession(data.session)
          setInitializing(false)
        }
      })
      .catch((e) => {
        if (active) {
          setToast({ message: errorText(e), error: true })
          setInitializing(false)
        }
      })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    // 原生 App：处理邮箱验证深链接 love.bibu.space://?code=... （PKCE 回调）
    const listener = CapApp.addListener('appUrlOpen', (data) => {
      void (async () => {
        try {
          const url = new URL(data.url)
          const code = url.searchParams.get('code')
          if (!code) return
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) setToast({ message: errorText(error), error: true })
        } catch (e) {
          setToast({ message: errorText(e), error: true })
        }
      })()
    })
    return () => {
      void listener.then((l) => l.remove())
    }
  }, [])
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), toast.error ? 12000 : 4500)
      return () => clearTimeout(t)
    }
  }, [toast])
  return (
    <ToastContext.Provider value={(message, error = false) => setToast({ message, error })}>
      <a href="#main" className="skip-link">
        跳到主要内容
      </a>
      {initializing && !demo ? (
        <div className="loading-screen">正在连接…</div>
      ) : demo || session ? (
        <Workspace
          key={demo ? 'demo' : session!.user.id}
          session={session}
          demo={demo}
          exitDemo={() => setDemo(false)}
        />
      ) : (
        <Auth enterDemo={() => setDemo(true)} />
      )}{' '}
      {toast && (
        <div
          className={`toast ${toast.error ? 'error' : ''}`}
          role={toast.error ? 'alert' : 'status'}
        >
          <Icon name={toast.error ? 'close' : 'check'} size={18} />
          <span>{toast.message}</span>
          <button aria-label="关闭提示" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}
