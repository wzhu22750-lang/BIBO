import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import {
  registerDevicePush,
  unregisterDevicePush,
  readStoredPushToken,
} from '../lib/pushRegistration'
import { BiboNative, type NotificationPermission } from '../native'
import { Button } from './ui'
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
    [permission, setPermission] = useState<NotificationPermission | null>(null)
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
  const permissionNote = !permission
    ? ''
    : !permission.supported
      ? '当前环境没有 Android 系统通知（Web）。通知登记仅对 Android 应用有效。'
      : permission.granted
        ? '系统通知权限：已开启（GRANTED）。'
        : '系统通知权限：已被拒绝（DENIED）。这不是系统故障：BIBO 将无法显示任何系统通知，伴侣消息只会在打开应用后出现。请在 Android 系统设置 → 应用 → 哔卟哔卟 → 通知 中重新开启。'
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
      setMessage(
        '设备 token 已登记；这不代表伴侣消息已经发送或送达。服务端 Push 发送函数（send-message-push / send-ping-push）部署并配置 Webhook 后才会真实推送。',
      )
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
      <h3>Android 远程 Push 设备登记</h3>
      <p>
        需要 Firebase 配置与服务端发送函数。此按钮只申请权限、获取设备 token
        并登记当前账号；不会在客户端发送伴侣通知。前台消息由 Supabase Realtime
        呈现，后台/被杀时由服务端 FCM 推送，二者按 message_id 与活跃心跳去重。
      </p>
      {permissionNote && <p role="status">{permissionNote}</p>}
      {message && <p role="status">{message}</p>}
      <Button
        tone={registered ? 'white' : 'yellow'}
        disabled={busy}
        onClick={() => void register()}
      >
        {busy ? '处理中…' : registered ? '重新更新本机 Token' : '登记这台设备接收 Push'}
      </Button>
      <Button tone="white" disabled={busy || !registered} onClick={() => void revoke()}>
        撤销这台设备的 Push
      </Button>
    </div>
  )
}
