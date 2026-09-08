import { registerDeviceInstallation, touchDeviceActivity } from './lib/api'
import { BiboNative, isAndroidApp } from './native'
import { createDeviceActivityHeartbeat } from './lib/deviceActivity'
import { parseRoute } from './lib/routes'
import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import type { Session } from '@supabase/supabase-js'
import { configured, errorText, supabase } from './lib/supabase'
import { useBibu } from './hooks/useBibu'
import { useSpace } from './hooks/useSpace'
import {
  disableFeedback,
  loadFeedbackEnabled,
  restoreFeedback,
  storeFeedbackEnabled,
} from './lib/notifications'
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
    [route, setRoute] = useState(() => parseRoute(window.location.hash)),
    [sound, setSound] = useState<boolean>(() => loadFeedbackEnabled())
  const page = route.page
  const bibu = useBibu(controller, demo)
  useEffect(() => {
    // 声音/震动偏好持久化到本机：退出或刷新后保持开启，声音在首次点击时自动恢复
    storeFeedbackEnabled(sound)
    if (sound) restoreFeedback()
    else disableFeedback()
    return () => disableFeedback()
  }, [sound])
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  function navigate(value: Page) {
    setRoute({ page: value })
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
        <Button tone="white" onClick={() => void controller.signOut().catch(() => {})}>
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
        {controller.cachedAt && (
          <div className="waiting-banner" role="status">
            当前显示本机离线快照，保存于 {new Date(controller.cachedAt).toLocaleString()}
            。成员与记录可能已变化；照片需联网重新获取，待发消息仍须服务器验证权限。
          </div>
        )}
        {controller.cacheError && (
          <div className="error-banner" role="alert">
            本机快照保存失败：{controller.cacheError}。云端数据不受影响。
          </div>
        )}
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
        {page === 'chat' && (
          <Chat controller={controller} demo={demo} referenceId={route.referenceId} />
        )}{' '}
        {page === 'events' && <Events controller={controller} referenceId={route.referenceId} />}{' '}
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
  useEffect(() => {
    let disposed = false
    let stop: (() => void) | undefined
    void BiboNative.deepLinks
      .listen((route) => {
        window.location.hash = route
      })
      .then((cleanup) => {
        if (disposed) cleanup()
        else stop = cleanup
      })
      .catch((error) => console.warn('无法初始化通知跳转', errorText(error)))
    return () => {
      disposed = true
      stop?.()
    }
  }, [])
  useEffect(() => {
    let disposed = false
    let stop: (() => void) | undefined
    void BiboNative.push
      .listenAction((route) => {
        window.location.hash = route
      })
      .then((cleanup) => {
        if (disposed) cleanup()
        else stop = cleanup
      })
      .catch(() => {})
    return () => {
      disposed = true
      stop?.()
    }
  }, [])
  const [session, setSession] = useState<Session | null>(null),
    [initializing, setInitializing] = useState(configured),
    [demo, setDemo] = useState(!configured),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(null)
  useEffect(() => {
    if (!session || !configured) return
    let active = true
    let stop: (() => void) | undefined
    void BiboNative.push
      .listenRegistration((token) => {
        if (active)
          void registerDeviceInstallation(session.user.id, token, 'bibo-0.1.0').catch(() => {})
      })
      .then((cleanup) => {
        if (active) stop = cleanup
        else cleanup()
      })
      .catch(() => {})
    return () => {
      active = false
      stop?.()
    }
  }, [session?.user.id])
  useEffect(() => {
    // Foreground heartbeat for the Realtime/FCM split: while this Android app is
    // visible, server push functions skip its devices so an arriving message or
    // Ping is presented once (Realtime in-app) instead of twice (system banner).
    // The RPC no-ops for accounts without registered devices.
    if (!session || !configured || !isAndroidApp()) return
    const heartbeat = createDeviceActivityHeartbeat(() => touchDeviceActivity())
    heartbeat.start()
    return () => heartbeat.stop()
  }, [session?.user.id])
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
