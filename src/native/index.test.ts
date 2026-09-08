import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  platform: 'web',
  notify: vi.fn(),
  vibrate: vi.fn(),
  notificationPermission: vi.fn(),
  requestNotificationPermission: vi.fn(),
  screenTimeToday: vi.fn(),
  scheduleReminder: vi.fn(),
  cancelReminder: vi.fn(),
  listReminders: vi.fn(),
  usagePermission: vi.fn(),
  openUsageSettings: vi.fn(),
  firebaseConfiguration: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => mocks.platform },
  registerPlugin: () => mocks,
}))
import { BiboNative, safeNativeRoute } from './index'
beforeEach(() => {
  mocks.platform = 'web'
  vi.clearAllMocks()
})
afterEach(() => vi.unstubAllGlobals())
describe('BiboNative boundary', () => {
  it('has safe Web fallbacks for all capability groups without calling the native plugin', async () => {
    expect((await BiboNative.permissions.notifications()).granted).toBe(false)
    expect((await BiboNative.permissions.requestNotifications()).supported).toBe(false)
    expect(
      (await BiboNative.notifications.show({ id: 1, title: 'test', body: '', route: '#home' }))
        .supported,
    ).toBe(false)
    expect(
      (
        await BiboNative.reminders.schedule({
          id: 1,
          title: 'test',
          body: '',
          route: '#home',
          at: Date.now(),
        })
      ).supported,
    ).toBe(false)
    expect((await BiboNative.screenTime.today()).milliseconds).toBeNull()
    expect(typeof (await BiboNative.deepLinks.listen(() => {}))).toBe('function')
    expect(mocks.notify).not.toHaveBeenCalled()
  })
  it('normalizes routes without opening external URLs', () => {
    expect(safeNativeRoute('https://evil.test')).toBe('#home')
    expect(safeNativeRoute('#chat?message=abc')).toBe('#chat?message=abc')
    expect(safeNativeRoute('#chat?message=../x')).toBe('#chat')
  })
  it('blocks Push registration before the official plugin when Firebase is absent', async () => {
    mocks.platform = 'android'
    mocks.firebaseConfiguration.mockResolvedValue({ supported: true, configured: false })
    expect(await BiboNative.push.register()).toEqual({
      supported: false,
      reason: 'Android 未配置 Firebase google-services.json，未调用 Push 注册',
    })
  })
  it('uses the Android bridge and validates untrusted vibration input', async () => {
    mocks.platform = 'android'
    mocks.vibrate.mockResolvedValue({ supported: true })
    await BiboNative.vibration.pulse([100, 60, 100])
    expect(mocks.vibrate).toHaveBeenCalledWith({ pattern: [100, 60, 100] })
    for (const pattern of [[], [-1], [Infinity], [1001], Array(21).fill(1)])
      await expect(BiboNative.vibration.pulse(pattern)).rejects.toThrow('无效')
  })
  it('does not represent unavailable browser vibration as successful', async () => {
    vi.stubGlobal('navigator', {})
    expect((await BiboNative.vibration.pulse([100])).supported).toBe(false)
  })
  it('bounds Android notifications and sanitizes navigation at the bridge', async () => {
    mocks.platform = 'android'
    mocks.notify.mockResolvedValue({ supported: true })
    await BiboNative.notifications.show({
      id: 3,
      title: 'x'.repeat(100),
      body: 'y'.repeat(300),
      route: 'https://evil.test',
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      id: 3,
      title: 'x'.repeat(80),
      body: 'y'.repeat(240),
      route: '#home',
    })
    await expect(
      BiboNative.notifications.show({ id: -1, title: '', body: '', route: '#home' }),
    ).rejects.toThrow('ID')
  })
  it('routes message notifications to the messages channel and drops unknown channels', async () => {
    mocks.platform = 'android'
    mocks.notify.mockResolvedValue({ supported: true })
    await BiboNative.notifications.show({
      id: 4,
      title: 'Wincy',
      body: '你今天吃饭了吗？',
      route: '#chat?message=m1',
      channel: 'messages',
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      id: 4,
      title: 'Wincy',
      body: '你今天吃饭了吗？',
      route: '#chat?message=m1',
      channel: 'messages',
    })
    await BiboNative.notifications.show({
      id: 5,
      title: 't',
      body: 'b',
      route: '#home',
      channel: 'everything-else' as 'messages',
    })
    expect(mocks.notify).toHaveBeenLastCalledWith({ id: 5, title: 't', body: 'b', route: '#home' })
  })
  it('keeps permission denial separate from measured zero and passes the app filter', async () => {
    mocks.platform = 'android'
    mocks.screenTimeToday.mockResolvedValue({ supported: true, granted: false, milliseconds: null })
    expect((await BiboNative.screenTime.today()).milliseconds).toBeNull()
    mocks.screenTimeToday.mockResolvedValue({
      supported: true,
      granted: true,
      milliseconds: 0,
      metric: 'app_foreground',
    })
    expect((await BiboNative.screenTime.today('com.example.app')).milliseconds).toBe(0)
    expect(mocks.screenTimeToday).toHaveBeenLastCalledWith({ packageName: 'com.example.app' })
    await expect(BiboNative.screenTime.today('../other')).rejects.toThrow('包名')
  })
  it('opening Usage Access settings does not imply permission was granted', async () => {
    mocks.platform = 'android'
    mocks.openUsageSettings.mockResolvedValue({ supported: true })
    mocks.usagePermission.mockResolvedValue({ supported: true, granted: false })
    await BiboNative.permissions.openUsageAccessSettings()
    expect((await BiboNative.permissions.usageAccess()).granted).toBe(false)
  })
  it('schedules bounded Android reminders and never accepts elapsed dates', async () => {
    mocks.platform = 'android'
    mocks.scheduleReminder.mockResolvedValue({ supported: true })
    const input = {
      id: 2,
      at: Date.now() + 60000,
      title: 'test',
      body: 'body',
      route: 'https://evil.test',
    }
    await BiboNative.reminders.schedule(input)
    expect(mocks.scheduleReminder).toHaveBeenCalledWith({ ...input, route: '#home' })
    for (const at of [NaN, Date.now() - 1000, Date.now() + 367 * 86400000])
      await expect(BiboNative.reminders.schedule({ ...input, at })).rejects.toThrow('时间')
    await expect(BiboNative.reminders.schedule({ ...input, id: 0 })).rejects.toThrow('ID')
  })
  it('lists and cancels persisted reminders through the native boundary', async () => {
    mocks.platform = 'android'
    mocks.listReminders.mockResolvedValue({
      supported: true,
      items: [{ id: 2, status: 'blocked' }],
    })
    expect((await BiboNative.reminders.list()).items[0].status).toBe('blocked')
    mocks.cancelReminder.mockResolvedValue({ supported: true })
    await BiboNative.reminders.cancel(2)
    expect(mocks.cancelReminder).toHaveBeenCalledWith({ id: 2 })
    await expect(BiboNative.reminders.cancel(-1)).rejects.toThrow('ID')
  })
})
