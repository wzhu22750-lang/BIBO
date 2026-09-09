import { describe, expect, it, vi } from 'vitest'
import { BibuNative } from '../native'
import { FOCUS_REMINDER_ID, setFocusReminder, cancelFocusReminder } from './focusReminder'
import type { Focus } from './types'
const focus: Focus = {
  user_id: 'secret-user',
  couple_id: 'secret-space',
  activity: 'private activity',
  ends_at: new Date(Date.now() + 60000).toISOString(),
  allow_reminders: false,
}
function adapter() {
  return {
    ...BibuNative,
    reminders: {
      ...BibuNative.reminders,
      cancel: vi.fn().mockResolvedValue({ supported: true }),
      schedule: vi.fn().mockResolvedValue({ supported: true }),
    },
    permissions: {
      ...BibuNative.permissions,
      requestNotifications: vi.fn().mockResolvedValue({ supported: true, granted: true }),
    },
  }
}
describe('focus and local reminder partial outcomes', () => {
  it('uses confirmed end time and never leaks activity or user identity into notification', async () => {
    const native = adapter()
    expect(await setFocusReminder(focus, true, native)).toContain('已安排')
    expect(native.reminders.cancel).toHaveBeenCalledWith(FOCUS_REMINDER_ID)
    const sent = native.reminders.schedule.mock.calls[0][0]
    expect(sent.at).toBe(Date.parse(focus.ends_at))
    expect(JSON.stringify(sent)).not.toContain('private activity')
    expect(JSON.stringify(sent)).not.toContain('secret-user')
  })
  it('clears old reminder on opt-out without asking permission', async () => {
    const native = adapter()
    await setFocusReminder(focus, false, native)
    expect(native.reminders.cancel).toHaveBeenCalledOnce()
    expect(native.permissions.requestNotifications).not.toHaveBeenCalled()
    expect(native.reminders.schedule).not.toHaveBeenCalled()
  })
  it('reports permission denial and schedule failure separately from saved focus', async () => {
    const native = adapter()
    native.permissions.requestNotifications.mockResolvedValue({ supported: true, granted: false })
    expect(await setFocusReminder(focus, true, native)).toContain('专注已开始')
    expect(native.reminders.schedule).not.toHaveBeenCalled()
    native.permissions.requestNotifications.mockResolvedValue({ supported: true, granted: true })
    native.reminders.schedule.mockRejectedValue(new Error('alarm failed'))
    expect(await setFocusReminder(focus, true, native)).toContain('alarm failed')
  })
  it('does not claim cancellation succeeded after an error', async () => {
    const native = adapter()
    native.reminders.cancel.mockRejectedValue(new Error('storage failed'))
    expect(await cancelFocusReminder(native)).toContain('取消失败')
    expect(await setFocusReminder(focus, true, native)).toContain('旧提醒')
    expect(native.reminders.schedule).not.toHaveBeenCalled()
  })
})
