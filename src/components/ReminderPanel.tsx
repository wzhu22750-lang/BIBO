import { useEffect, useState } from 'react'
import { BibuNative, type NotificationPermission, type ReminderRecord } from '../native'
import { Button, Panel, useTask, useToast } from './ui'
import { SettingsNote } from './SettingsNote'
import { errorText } from '../lib/supabase'
import { PixelDateTimePicker } from './PixelPickers'
const labels = {
  scheduled: '等待系统提醒',
  posted: '已交给系统通知栏',
  blocked: '通知权限或渠道关闭',
  expired: '已过期，未补发',
  failed: '系统调度失败',
}
export function ReminderPanel() {
  const [at, setAt] = useState(''),
    [rows, setRows] = useState<ReminderRecord[]>([]),
    [supported, setSupported] = useState(false),
    [permission, setPermission] = useState<NotificationPermission | null>(null),
    [error, setError] = useState('')
  const { busy, run } = useTask(),
    toast = useToast()
  async function refresh() {
    try {
      const result = await BibuNative.reminders.list()
      setSupported(result.supported)
      setRows(result.items)
      const notification = await BibuNative.permissions.notifications()
      setPermission(notification)
      setError('')
    } catch (e) {
      setError(errorText(e))
    }
  }
  useEffect(() => {
    void refresh()
    const listener = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', listener)
    return () => document.removeEventListener('visibilitychange', listener)
  }, [])
  return (
    <Panel title="本机小约定提醒" tag="LOCAL REMINDER" className="screen-time-panel">
      <div className="settings-section">
        <SettingsNote title="本机提醒说明">
          <p>
            提醒保存在这台设备，不属于云端账号。只显示通用文案，不含聊天或伴侣资料。系统可能延后；强行停止应用或关闭通知会影响提醒。
          </p>
          {!supported ? <p>Android 本机能力；Web 不会用网页计时器假装后台提醒。</p> : null}
        </SettingsNote>
        {error && <p role="alert">{error}</p>}
        {!supported ? null : (
          <>
            {permission && !permission.granted && (
              <div className="permission-inline" role="status">
                <p>系统通知权限尚未开启，本机提醒不会出现在通知栏。</p>
                <Button
                  tone="yellow"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const next = await BibuNative.permissions.requestNotifications()
                      setPermission(next)
                      if (!next.granted) throw new Error('请在 Android 系统设置中允许通知后再重试')
                    })
                  }
                >
                  申请通知权限
                </Button>
              </div>
            )}
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault()
                void run(async () => {
                  if (!at) throw new Error('请选择提醒日期与时间')
                  const permission = await BibuNative.permissions.requestNotifications()
                  if (!permission.granted) throw new Error('请先允许系统通知')
                  const id = (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646) + 1
                  const result = await BibuNative.reminders.schedule({
                    id,
                    at: new Date(at).getTime(),
                    title: 'BIBU！小约定',
                    body: '到了你留给自己的提醒时间，回来看看吧。',
                    route: '#focus',
                  })
                  toast(result.reason || '提醒已保存')
                  setAt('')
                  await refresh()
                })
              }}
            >
              <label>
                提醒时间（本机时区）
                <PixelDateTimePicker value={at} onChange={setAt} />
              </label>
              <Button type="submit" disabled={busy}>
                保存本机提醒
              </Button>
            </form>
            <Button tone="white" disabled={busy} onClick={() => void refresh()}>
              刷新提醒状态
            </Button>
            <ul>
              {rows.map((row) => (
                <li key={row.id}>
                  {new Date(row.at).toLocaleString()} · {labels[row.status] || '未知状态'}{' '}
                  <Button
                    tone="white"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await BibuNative.reminders.cancel(row.id)
                        await refresh()
                      })
                    }
                  >
                    {row.status === 'scheduled' ? '取消提醒' : '移除记录'}
                  </Button>
                </li>
              ))}
            </ul>
            {!rows.length && <p>还没有本机提醒。</p>}
          </>
        )}
      </div>
    </Panel>
  )
}
