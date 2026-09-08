import { useEffect, useState } from 'react'
import { BiboNative, type ReminderRecord } from '../native'
import { Button, Panel, useTask, useToast } from './ui'
import { errorText } from '../lib/supabase'
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
    [error, setError] = useState('')
  const { busy, run } = useTask(),
    toast = useToast()
  async function refresh() {
    try {
      const result = await BiboNative.reminders.list()
      setSupported(result.supported)
      setRows(result.items)
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
        <p>
          提醒保存在这台设备，不属于云端账号。只显示通用文案，不含聊天或伴侣资料。系统可能延后；强行停止应用或关闭通知会影响提醒。
        </p>
        {error && <p role="alert">{error}</p>}
        {!supported ? (
          <p>Android 本机能力；Web 不会用网页计时器假装后台提醒。</p>
        ) : (
          <>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault()
                void run(async () => {
                  const permission = await BiboNative.permissions.requestNotifications()
                  if (!permission.granted) throw new Error('请先允许系统通知')
                  const id = (crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646) + 1
                  const result = await BiboNative.reminders.schedule({
                    id,
                    at: new Date(at).getTime(),
                    title: 'BIBO 小约定',
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
                <input
                  required
                  type="datetime-local"
                  value={at}
                  onChange={(e) => setAt(e.target.value)}
                />
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
                        await BiboNative.reminders.cancel(row.id)
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
