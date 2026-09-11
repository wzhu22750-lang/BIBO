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
  pushReady: vi.fn(),
  pushRegistration: vi.fn(),
  pushUnregister: vi.fn(),
  getPushDiagnostics: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => mocks.platform },
  registerPlugin: () => mocks,
}))
import { BibuNative, BiboNative, safeNativeRoute } from './index'
beforeEach(() => {
  mocks.platform = 'web'
  vi.clearAllMocks()
})
afterEach(() => vi.unstubAllGlobals())
describe('BibuNative boundary', () => {
  it('exports BiboNative as an alias for backward compatibility', () => {
    expect(BiboNative).toBe(BibuNative)
  })
  it('has safe Web fallbacks for all capability groups without calling the native plugin', async () => {
    expect((await BibuNative.permissions.notifications()).granted).toBe(false)
    expect((await BibuNative.permissions.requestNotifications()).supported).toBe(false)
    expect(
      (await BibuNative.notifications.show({ id: 1, title: 'test', body: '', route: '#home' }))
        .supported,
    ).toBe(false)
    expect(
      (
        await BibuNative.reminders.schedule({
          id: 1,
          title: 'test',
          body: '',
          route: '#home',
          at: Date.now(),
        })
      ).supported,
    ).toBe(false)
    expect((await BibuNative.screenTime.today()).milliseconds).toBeNull()
    expect(typeof (await BibuNative.deepLinks.listen(() => {}))).toBe('function')
    expect(mocks.notify).not.toHaveBeenCalled()
  })
  it('normalizes routes without opening external URLs', () => {
    expect(safeNativeRoute('https://evil.test')).toBe('#home')
    expect(safeNativeRoute('#chat?message=abc')).toBe('#chat?message=abc')
    expect(safeNativeRoute('#chat?message=../x')).toBe('#chat')
  })
  it('blocks Push registration when 个推 GETUI_APPID is not configured', async () => {
    mocks.platform = 'android'
    mocks.pushReady.mockResolvedValue({ supported: true, configured: false })
    expect(await BibuNative.push.register()).toEqual({
      supported: false,
      reason: 'Android 未配置个推 GETUI_APPID，未调用 Push 注册',
    })
    expect(mocks.pushRegistration).not.toHaveBeenCalled()
  })
  it('returns push diagnostics from device plugin', async () => {
    mocks.platform = 'android'
    mocks.getPushDiagnostics.mockResolvedValue({
      cid: 'test-cid-1234567890',
      isPushOnline: true,
      notificationsEnabled: true,
      sdkVersion: '3.3.7.0',
      deviceModel: 'Xiaomi 13',
      androidVersion: 'Android 14 (API 34)',
    })
    const diag = await BibuNative.push.getDiagnostics()
    expect(diag.cid).toBe('test-cid-1234567890')
    expect(diag.isPushOnline).toBe(true)
    expect(diag.deviceModel).toBe('Xiaomi 13')
  })
  it('uses the Android bridge and validates untrusted vibration input', async () => {
    mocks.platform = 'android'
    mocks.vibrate.mockResolvedValue({ supported: true })
    await BibuNative.vibration.pulse([100, 60, 100])
    expect(mocks.vibrate).toHaveBeenCalledWith({ pattern: [100, 60, 100] })
    for (const pattern of [[], [-1], [Infinity], [1001], Array(21).fill(1)])
      await expect(BibuNative.vibration.pulse(pattern)).rejects.toThrow('无效')
  })
  it('does not represent unavailable browser vibration as successful', async () => {
    vi.stubGlobal('navigator', {})
    expect((await BibuNative.vibration.pulse([100])).supported).toBe(false)
  })
  it('bounds Android notifications and sanitizes navigation at the bridge', async () => {
    mocks.platform = 'android'
    mocks.notify.mockResolvedValue({ supported: true })
    await BibuNative.notifications.show({
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
      BibuNative.notifications.show({ id: -1, title: '', body: '', route: '#home' }),
    ).rejects.toThrow('ID')
  })
  it('routes message notifications to the messages channel and drops unknown channels', async () => {
    mocks.platform = 'android'
    mocks.notify.mockResolvedValue({ supported: true })
    await BibuNative.notifications.show({
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
    await BibuNative.notifications.show({
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
    expect((await BibuNative.screenTime.today()).milliseconds).toBeNull()
    mocks.screenTimeToday.mockResolvedValue({
      supported: true,
      granted: true,
      milliseconds: 0,
      metric: 'app_foreground',
    })
    expect((await BibuNative.screenTime.today('com.example.app')).milliseconds).toBe(0)
    expect(mocks.screenTimeToday).toHaveBeenLastCalledWith({ packageName: 'com.example.app' })
    await expect(BibuNative.screenTime.today('../other')).rejects.toThrow('包名')
  })
  it('opening Usage Access settings does not imply permission was granted', async () => {
    mocks.platform = 'android'
    mocks.openUsageSettings.mockResolvedValue({ supported: true })
    mocks.usagePermission.mockResolvedValue({ supported: true, granted: false })
    await BibuNative.permissions.openUsageAccessSettings()
    expect((await BibuNative.permissions.usageAccess()).granted).toBe(false)
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
    await BibuNative.reminders.schedule(input)
    expect(mocks.scheduleReminder).toHaveBeenCalledWith({ ...input, route: '#home' })
    for (const at of [NaN, Date.now() - 1000, Date.now() + 367 * 86400000])
      await expect(BibuNative.reminders.schedule({ ...input, at })).rejects.toThrow('时间')
    await expect(BibuNative.reminders.schedule({ ...input, id: 0 })).rejects.toThrow('ID')
  })
  it('lists and cancels persisted reminders through the native boundary', async () => {
    mocks.platform = 'android'
    mocks.listReminders.mockResolvedValue({
      supported: true,
      items: [{ id: 2, status: 'blocked' }],
    })
    expect((await BibuNative.reminders.list()).items[0].status).toBe('blocked')
    mocks.cancelReminder.mockResolvedValue({ supported: true })
    await BibuNative.reminders.cancel(2)
    expect(mocks.cancelReminder).toHaveBeenCalledWith({ id: 2 })
    await expect(BibuNative.reminders.cancel(-1)).rejects.toThrow('ID')
  })
})
