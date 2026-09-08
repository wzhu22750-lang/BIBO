import { BiboNative } from '../native'
import type { Focus } from './types'
import { errorText } from './supabase'
// Reserved device-local slot: never include account identity or activity in notification text.
export const FOCUS_REMINDER_ID = 2147483647
export async function setFocusReminder(
  focus: Focus,
  requested: boolean,
  native = BiboNative,
): Promise<string> {
  try {
    // Always remove an old session's alarm, including when the next session opts out.
    const cancelled = await native.reminders.cancel(FOCUS_REMINDER_ID)
    if (!requested) return cancelled.supported ? '旧专注提醒已清理' : '本次未设置本机提醒'
    if (!cancelled.supported) return cancelled.reason || '此设备不支持专注提醒'
    const permission = await native.permissions.requestNotifications()
    if (!permission.granted) return '专注已开始，但通知权限未开启；本次没有本机提醒'
    const result = await native.reminders.schedule({
      id: FOCUS_REMINDER_ID,
      at: Date.parse(focus.ends_at),
      title: 'BIBU 专注小约定',
      body: '你为自己安排的专注时间到了，休息一下吧。',
      route: '#focus',
    })
    return result.supported
      ? '本机到时提醒已安排；系统可能延后'
      : result.reason || '专注已开始，但本机提醒不受支持'
  } catch (error) {
    return `专注已开始，但本机提醒设置失败：${errorText(error)}。请到本机提醒列表检查旧提醒。`
  }
}
export async function cancelFocusReminder(native = BiboNative): Promise<string> {
  try {
    const result = await native.reminders.cancel(FOCUS_REMINDER_ID)
    return result.supported ? '专注已结束，本机到时提醒已取消' : '专注已结束'
  } catch (error) {
    return `专注已结束，但本机提醒取消失败：${errorText(error)}。请到本机提醒列表手动取消。`
  }
}
