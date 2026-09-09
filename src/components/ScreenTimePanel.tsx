import { useEffect, useState } from 'react'
import { BiboNative, type ScreenTimeResult } from '../native'
import { errorText } from '../lib/supabase'
import { Button, Panel } from './ui'
import { SettingsNote } from './SettingsNote'
export function ScreenTimePanel() {
  const [packageName, setPackageName] = useState('')
  const [query, setQuery] = useState('')
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<ScreenTimeResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    setBusy(true)
    setError('')
    setResult(null)
    void BiboNative.screenTime
      .today(query || undefined)
      .then(
        (value) => {
          if (active) setResult(value)
        },
        (failure) => {
          if (active) setError(errorText(failure))
        },
      )
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [query, version])
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) setVersion((n) => n + 1)
    }
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])
  return (
    <Panel title="今天的设备使用情况" tag="ONLY ON THIS DEVICE" className="screen-time-panel">
      <div className="settings-section">
        <SettingsNote title="使用情况说明">
          仅本人设备可见，不自动上传给伴侣。统计按手机时区从今天零点开始。
        </SettingsNote>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(packageName.trim())
            setVersion((n) => n + 1)
          }}
        >
          <label>
            指定 App 包名（留空看屏幕使用）
            <input
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="com.example.app"
              maxLength={200}
            />
          </label>
          <Button type="submit" tone="white" disabled={busy}>
            查询设备使用量
          </Button>
        </form>
        {busy && <p role="status">正在读取设备记录…</p>}
        {error && <p role="alert">{error}</p>}
        {result && (
          <>
            <h3>{query ? `App 前台时间 · ${query}` : '屏幕交互时间'}</h3>
            <p>
              {result.milliseconds === null
                ? '暂无可用时长'
                : `${Math.floor(result.milliseconds / 60000)} 分 ${Math.floor(result.milliseconds / 1000) % 60} 秒`}
            </p>
            <p>{result.reason}</p>
            {result.timezone && (
              <small>
                设备时区：{result.timezone} · 查询截至 {new Date(result.to!).toLocaleTimeString()}
              </small>
            )}
            {result.supported && !result.granted && (
              <Button
                tone="yellow"
                onClick={() =>
                  void BiboNative.permissions.openUsageAccessSettings().then(
                    (value) => {
                      if (!value.supported) setError(value.reason || '不支持此功能')
                    },
                    (failure) => setError(errorText(failure)),
                  )
                }
              >
                打开使用情况访问设置
              </Button>
            )}
          </>
        )}
        <SettingsNote title="数据准确性说明">
          系统可能延迟或截断事件，数值为估算；无记录不等于零。开启设置不代表已经授权，请返回后刷新确认。这里不做强制限制或拦截。
        </SettingsNote>
      </div>
    </Panel>
  )
}
