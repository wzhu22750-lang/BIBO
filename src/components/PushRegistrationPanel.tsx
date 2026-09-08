import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { registerDevicePush, unregisterDevicePush } from '../lib/pushRegistration'
import { Button } from './ui'
export function PushRegistrationPanel({ controller }: { controller: SpaceController }) {
  const [message, setMessage] = useState(''),
    [registered, setRegistered] = useState(false),
    [token, setToken] = useState<string | undefined>(),
    [busy, setBusy] = useState(false)
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
        '设备 token 已登记；这不代表伴侣消息已经发送或送达。服务端 Push 发送通道仍需部署。',
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
        并登记当前账号；不会在客户端发送伴侣通知。
      </p>
      {message && <p role="status">{message}</p>}
      <Button tone="white" disabled={busy} onClick={() => void register()}>
        {busy ? '处理中…' : '登记这台设备接收 Push'}
      </Button>
      <Button tone="white" disabled={busy || !registered} onClick={() => void revoke()}>
        撤销这台设备的 Push
      </Button>
    </div>
  )
}
