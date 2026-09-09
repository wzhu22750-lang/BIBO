import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import {
  registerDevicePush,
  unregisterDevicePush,
  readStoredPushToken,
} from '../lib/pushRegistration'
import { BiboNative, type NotificationPermission } from '../native'
import { Button } from './ui'
import { SettingsNote } from './SettingsNote'
export function PushRegistrationPanel({ controller }: { controller: SpaceController }) {
  const initialToken = readStoredPushToken()
  const [message, setMessage] = useState(
      initialToken
        ? '本机 Push 状态：已成功登记。伴侣在后台发消息时将自动推送，无需重复点击。'
        : '',
    ),
    [registered, setRegistered] = useState(Boolean(initialToken)),
    [token, setToken] = useState<string | undefined>(initialToken),
    [busy, setBusy] = useState(false),
    [permission, setPermission] = useState<NotificationPermission | null>(null),
    [testResult, setTestResult] = useState('')

  useEffect(() => {
    let active = true
    void BiboNative.permissions
      .notifications()
      .then((value) => {
        if (active) setPermission(value)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [busy])

  const requestPermission = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await BiboNative.permissions.requestNotifications()
      setPermission(res)
      if (res.granted) {
        setMessage('系统通知权限已开启！')
      } else {
        setMessage(
          '系统通知权限仍未开启。请前往 Android 系统「设置 → 应用管理 → 哔卟哔卟 → 通知」手动允许。',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  const testMessageChannel = async () => {
    setBusy(true)
    setTestResult('')
    try {
      const res = await BiboNative.notifications.show({
        id: 999,
        title: 'BIBU 悄悄话渠道测试',
        body: '如果你看到了这条系统横幅，说明系统通知权限与悄悄话通道（bibo_messages_v2）完全正常！',
        route: '#chat',
        channel: 'messages',
      })
      if (res.supported) {
        setTestResult(
          '✅ 本地测试通知已发出！请查看手机通知栏。若能看到，说明系统权限与通道无误；若收不到伴侣的远程推送，请排查下方 GMS 与网络连接。',
        )
      } else {
        setTestResult(`❌ 本地通知未能显示：${res.reason || '不支持'}`)
      }
    } catch (err) {
      setTestResult(`❌ 发送测试通知异常：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const permissionNote = !permission
    ? ''
    : !permission.supported
      ? '当前环境没有 Android 系统通知（Web）。通知登记仅对 Android 应用有效。'
      : permission.granted
        ? '✅ 系统通知权限：已开启（GRANTED）'
        : '❌ 系统通知权限：已被拒绝（DENIED）。BIBU 无法弹出任何系统横幅。'

  async function register() {
    setBusy(true)
    setMessage('')
    try {
      const result = await registerDevicePush(controller.space!.me.id, 'bibo-0.1.0')
      if (!result.supported) {
        setMessage(result.reason || '此环境不支持远程 Push')
        return
      }
      if (!result.stored) {
        setMessage('设备返回了 Push 状态，但 token 未完成服务器登记')
        return
      }
      setRegistered(true)
      setToken(result.token)
      setMessage('✅ 设备 token 已成功登记到服务器！伴侣发消息时将通过 FCM 自动推送到这台设备。')
    } catch (error) {
      setMessage(`登记失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    setBusy(true)
    setMessage('')
    try {
      const result = await unregisterDevicePush(controller.space!.me.id, token)
      setRegistered(false)
      setToken(undefined)
      setMessage(
        result.supported
          ? '本机 Push 已撤销，服务器登记已清理。'
          : result.reason || '此设备不支持远程 Push',
      )
    } catch (error) {
      setMessage(`撤销失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-section">
      <h3>Android 远程 Push 设备登记与诊断</h3>
      <SettingsNote title="Push 工作原理">
        前台页面由 Supabase Realtime 更新；FCM 不使用隐藏的前台时间窗口，Android 会把收到的 Push
        交给系统通知频道处理。
      </SettingsNote>
      {permissionNote && (
        <p role="status" style={{ fontWeight: 600 }}>
          {permissionNote}
        </p>
      )}
      {permission && !permission.granted && permission.supported && (
        <Button tone="yellow" disabled={busy} onClick={() => void requestPermission()}>
          申请开启系统通知权限
        </Button>
      )}
      {token && (
        <p style={{ fontSize: '0.85rem', color: '#666', wordBreak: 'break-all' }}>
          本机 Push Token：
          <code>
            {token.slice(0, 14)}...{token.slice(-10)}
          </code>
          （{token.length} 位）
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {testResult && (
        <p role="status" style={{ fontWeight: 500 }}>
          {testResult}
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <Button
          tone={registered ? 'white' : 'yellow'}
          disabled={busy}
          onClick={() => void register()}
        >
          {busy ? '处理中…' : registered ? '重新更新本机 Token' : '登记这台设备接收 Push'}
        </Button>
        <Button tone="white" disabled={busy} onClick={() => void testMessageChannel()}>
          测试本设备通知渠道 (悄悄话)
        </Button>
        <Button tone="white" disabled={busy || !registered} onClick={() => void revoke()}>
          撤销这台设备的 Push
        </Button>
      </div>
      <SettingsNote title="国内 Android FCM 排查建议" className="push-troubleshoot-note">
        <ul>
          <li>
            <b>Google 服务 (GMS)</b>：国内设备需在「系统设置 → 谷歌服务/Google 基础服务」中开启。
          </li>
          <li>
            <b>后台与自启动</b>：在系统应用设置中将「哔卟哔卟」和「Google Play
            服务」设为「允许自启动 / 后台耗电无限制」，避免息屏被杀。
          </li>
          <li>
            <b>网络连接</b>：FCM 需长连接 <code>mtalk.google.com:5228</code>
            。若在无外部网络环境下，Google Cloud 无法将消息推入手机。
          </li>
        </ul>
      </SettingsNote>
    </div>
  )
}
