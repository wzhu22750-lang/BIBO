import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { parseRoute } from '../lib/routes'
export type CapabilityResult = { supported: boolean; reason?: string }
export type NotificationPermission = CapabilityResult & { granted: boolean }
export type NotificationInput = { id: number; title: string; body: string; route: string }
export type ScreenTimeResult = CapabilityResult & {
  granted: boolean
  milliseconds: number | null
  from?: number
  to?: number
  timezone?: string
  metric?: 'screen_interactive' | 'app_foreground'
}
export type ReminderInput = NotificationInput & { at: number }
export type ReminderRecord = ReminderInput & {
  status: 'scheduled' | 'posted' | 'blocked' | 'expired' | 'failed'
}
export type PushRegistration = CapabilityResult & { token?: string }
interface DevicePlugin {
  scheduleReminder(input: ReminderInput): Promise<CapabilityResult>
  firebaseConfiguration(): Promise<CapabilityResult & { configured: boolean }>
  cancelReminder(input: { id: number }): Promise<CapabilityResult>
  listReminders(): Promise<CapabilityResult & { items: ReminderRecord[] }>
  usagePermission(): Promise<NotificationPermission>
  openUsageSettings(): Promise<CapabilityResult>
  screenTimeToday(input: { packageName?: string }): Promise<ScreenTimeResult>
  notificationPermission(): Promise<NotificationPermission>
  requestNotificationPermission(): Promise<NotificationPermission>
  notify(input: NotificationInput): Promise<CapabilityResult>
  vibrate(input: { pattern: number[] }): Promise<CapabilityResult>
  launchRoute(): Promise<{ route?: string }>
  addListener(
    event: 'deepLink',
    listener: (value: { route: string }) => void,
  ): Promise<PluginListenerHandle>
}
const plugin = registerPlugin<DevicePlugin>('BiboDevice')
const native = () => Capacitor.getPlatform() === 'android'
const unavailable = (reason: string): CapabilityResult => ({ supported: false, reason })
export function safeNativeRoute(value: string) {
  const parsed = parseRoute(value)
  // Only internal application fragments; never execute/open an arbitrary URL.
  if (!/^#(home|chat|events|photos|focus|settings)(\?|$)/.test(value)) return '#home'
  const key = parsed.page === 'chat' ? 'message' : 'event'
  return `#${parsed.page}${parsed.referenceId ? `?${key}=${encodeURIComponent(parsed.referenceId)}` : ''}`
}
export const BiboNative = {
  notifications: {
    async show(input: NotificationInput): Promise<CapabilityResult> {
      if (!native()) return unavailable('系统通知仅在 Android 应用内可用')
      if (!Number.isInteger(input.id) || input.id < 1 || input.id > 2147483647)
        throw new Error('通知 ID 无效')
      return plugin.notify({
        ...input,
        title: input.title.slice(0, 80),
        body: input.body.slice(0, 240),
        route: safeNativeRoute(input.route),
      })
    },
  },
  permissions: {
    async usageAccess(): Promise<NotificationPermission> {
      return native()
        ? plugin.usagePermission()
        : { ...unavailable('Web 无法读取 Android 使用情况权限'), granted: false }
    },
    async openUsageAccessSettings(): Promise<CapabilityResult> {
      return native()
        ? plugin.openUsageSettings()
        : unavailable('请在 Android 应用中授权使用情况访问')
    },
    async notifications(): Promise<NotificationPermission> {
      return native()
        ? plugin.notificationPermission()
        : { ...unavailable('Web 不申请 Android 权限'), granted: false }
    },
    async requestNotifications(): Promise<NotificationPermission> {
      return native()
        ? plugin.requestNotificationPermission()
        : { ...unavailable('请在 Android 应用中开启系统通知'), granted: false }
    },
  },
  vibration: {
    async pulse(pattern: readonly number[]): Promise<CapabilityResult> {
      if (
        pattern.length < 1 ||
        pattern.length > 20 ||
        pattern.some((n) => !Number.isFinite(n) || n < 0 || n > 1000) ||
        pattern.reduce((a, b) => a + b, 0) > 5000
      )
        throw new Error('震动节奏无效')
      if (native()) return plugin.vibrate({ pattern: [...pattern] })
      try {
        return typeof navigator !== 'undefined' && navigator.vibrate?.([...pattern])
          ? { supported: true }
          : unavailable('此浏览器不支持震动')
      } catch {
        return unavailable('设备未允许震动')
      }
    },
  },
  reminders: {
    async schedule(input: ReminderInput): Promise<CapabilityResult> {
      if (!native()) return unavailable('本机定时提醒仅在 Android 应用中可用')
      if (!Number.isInteger(input.id) || input.id < 1 || input.id > 2147483647)
        throw new Error('提醒 ID 无效')
      if (
        !Number.isFinite(input.at) ||
        input.at <= Date.now() ||
        input.at - Date.now() > 366 * 86400000
      )
        throw new Error('请选择未来一年内的提醒时间')
      return plugin.scheduleReminder({
        ...input,
        title: input.title.slice(0, 80),
        body: input.body.slice(0, 240),
        route: safeNativeRoute(input.route),
      })
    },
    async cancel(id: number): Promise<CapabilityResult> {
      if (!native()) return unavailable('此环境没有 Android 本机提醒')
      if (!Number.isInteger(id) || id < 1 || id > 2147483647) throw new Error('提醒 ID 无效')
      return plugin.cancelReminder({ id })
    },
    async list(): Promise<CapabilityResult & { items: ReminderRecord[] }> {
      return native()
        ? plugin.listReminders()
        : { ...unavailable('本机提醒仅在 Android 应用中可用'), items: [] }
    },
  },
  push: {
    async register(): Promise<PushRegistration> {
      if (!native()) return unavailable('远程 Push 设备注册仅在 Android 应用中可用')
      try {
        const firebase = await plugin.firebaseConfiguration()
        if (!firebase.configured)
          return {
            supported: false,
            reason: 'Android 未配置 Firebase google-services.json，未调用 Push 注册',
          }
        let permission = await PushNotifications.checkPermissions()
        if (permission.receive !== 'granted')
          permission = await PushNotifications.requestPermissions()
        if (permission.receive !== 'granted')
          return { supported: true, reason: 'Android 系统通知权限未开启' }
        await PushNotifications.createChannel({
          id: 'bibo_love_v1',
          name: '两个人的哔卟',
          description: '情侣 Ping 通知',
          importance: 3,
          visibility: 1,
          vibration: true,
        })
        const token = await new Promise<string>((resolve, reject) => {
          let settled = false
          let registration: PluginListenerHandle | undefined
          let registrationError: PluginListenerHandle | undefined
          const cleanup = () => {
            clearTimeout(timer)
            void registration?.remove()
            void registrationError?.remove()
          }
          const succeed = (value: string) => {
            if (settled) return
            settled = true
            cleanup()
            resolve(value)
          }
          const fail = (error: Error) => {
            if (settled) return
            settled = true
            cleanup()
            reject(error)
          }
          const timer = setTimeout(
            () => fail(new Error('FCM token 获取超时；请确认 google-services.json 已配置')),
            20000,
          )
          void PushNotifications.addListener('registration', (value) => succeed(value.value)).then(
            (value) => {
              registration = value
            },
          )
          void PushNotifications.addListener('registrationError', (value) =>
            fail(new Error(value.error || 'FCM token 注册失败')),
          ).then((value) => {
            registrationError = value
          })
          void PushNotifications.register().catch((error) =>
            fail(error instanceof Error ? error : new Error(String(error))),
          )
        })
        if (!token || token.length < 20)
          return { supported: false, reason: 'Android 返回了无效的 Push token' }
        return { supported: true, token }
      } catch (error) {
        return {
          supported: false,
          reason: error instanceof Error ? error.message : 'FCM token 注册失败',
        }
      }
    },
    async listenRegistration(listener: (token: string) => void): Promise<() => void> {
      if (!native()) return () => {}
      const handle = await PushNotifications.addListener('registration', (value) => {
        if (value.value.length >= 20) listener(value.value)
      })
      return () => {
        void handle.remove()
      }
    },
    async unregister(): Promise<CapabilityResult> {
      if (!native()) return unavailable('Web 没有 Android Push token')
      try {
        await PushNotifications.unregister()
        return { supported: true }
      } catch (error) {
        return {
          supported: false,
          reason: error instanceof Error ? error.message : 'Push token 注销失败',
        }
      }
    },
    async listenAction(listener: (route: string) => void): Promise<() => void> {
      if (!native()) return () => {}
      const handle = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (event) => {
          const route =
            event.notification.data && typeof event.notification.data.route === 'string'
              ? event.notification.data.route
              : '#home'
          listener(safeNativeRoute(route))
        },
      )
      return () => {
        void handle.remove()
      }
    },
  },
  screenTime: {
    async today(packageName?: string): Promise<ScreenTimeResult> {
      if (packageName && !/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$/.test(packageName))
        throw new Error('请输入有效 App 包名，例如 com.example.app')
      return native()
        ? plugin.screenTimeToday({ packageName: packageName || undefined })
        : { ...unavailable('Web 无法读取真实屏幕使用量'), granted: false, milliseconds: null }
    },
  },
  deepLinks: {
    async listen(listener: (route: string) => void): Promise<() => void> {
      if (!native()) return () => {}
      const handle = await plugin.addListener('deepLink', (value) =>
        listener(safeNativeRoute(value.route)),
      )
      try {
        const initial = await plugin.launchRoute()
        if (initial.route) listener(safeNativeRoute(initial.route))
      } catch (error) {
        await handle.remove()
        throw error
      }
      return () => {
        void handle.remove()
      }
    },
  },
}
