import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import {
  clearStoredPushToken,
  readStoredPushToken,
  registerDevicePush,
  storePushToken,
  unregisterDevicePush,
} from '../lib/pushRegistration'
import { BibuNative, type NotificationPermission, type PushDiagnostics } from '../native'
import { Button } from './ui'
import { SettingsNote } from './SettingsNote'

export function PushRegistrationPanel({ controller }: { controller: SpaceController }) {
  const initialToken = readStoredPushToken()
  const [message, setMessage] = useState(
    initialToken
      ? '本机 Push 状态：已成功登记。伴侣发消息时将自动推送，无需重复登记。'
      : '',
  )
  const [registered, setRegistered] = useState(Boolean(initialToken))
  const [token, setToken] = useState<string | undefined>(initialToken)
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [testResult, setTestResult] = useState('')
  const [diagnostics, setDiagnostics] = useState<PushDiagnostics | null>(null)
  const [copiedDiag, setCopiedDiag] = useState(false)

  async function refreshDiagnostics() {
    try {
      const diag = await BibuNative.push.getDiagnostics()
      setDiagnostics(diag)
      if (diag.cid && !token) {
        setToken(diag.cid)
      }
    } catch {
      // 忽略非原生环境异常
    }
  }

  useEffect(() => {
    let active = true
    void BibuNative.permissions
      .notifications()
      .then((value) => {
        if (active) setPermission(value)
      })
      .catch(() => {})
    void refreshDiagnostics()
    return () => {
      active = false
    }
  }, [busy])

  const requestPermission = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await BibuNative.permissions.requestNotifications()
      setPermission(res)
      if (res.granted) {
        setMessage('系统通知权限已开启！')
      } else {
        setMessage(
          '系统通知权限仍未开启。请前往 Android 系统「设置 → 应用管理 → BIBU！ → 通知」手动允许。',
        )
      }
      void refreshDiagnostics()
    } finally {
      setBusy(false)
    }
  }

  const testMessageChannel = async () => {
    setBusy(true)
    setTestResult('')
    try {
      const res = await BibuNative.notifications.show({
        id: 999,
        title: 'BIBU！悄悄话渠道测试',
        body: '如果你看到了这条系统横幅，说明系统通知权限与悄悄话通道（bibo_messages_v2）完全正常！',
        route: '#chat',
        channel: 'messages',
      })
      if (res.supported) {
        setTestResult(
          '本地测试通知已发出！请查看手机通知栏。若能看到，说明系统权限与通道无误；若收不到伴侣的远程推送，请排查下方后台保活与网络连接。',
        )
      } else {
        setTestResult(`本地通知未能显示：${res.reason || '不支持'}`)
      }
    } catch (err) {
      setTestResult(`发送测试通知异常：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const testCloudPing = async () => {
    setBusy(true)
    setTestResult('')
    try {
      await controller.sendPing('哔卟哔卟')
      setTestResult(
        '已触发云端「想你/戳一戳」！若另一台手机在后台或锁屏，将通过个推唤起系统通知；本机前台不会自我重复弹窗。',
      )
    } catch (err) {
      setTestResult(`云端发送异常：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  const permissionNote = !permission
    ? ''
    : !permission.supported
      ? '当前环境没有 Android 系统通知（Web）。通知登记仅对 Android 应用有效。'
      : permission.granted
        ? '系统通知权限：已开启（GRANTED）'
        : '系统通知权限：已被拒绝（DENIED）。BIBU！无法弹出任何系统横幅。'

  async function register() {
    setBusy(true)
    setMessage('')
    try {
      const result = await registerDevicePush(controller.space!.me.id, 'bibu-0.1.0')
      if (!result.supported) {
        setMessage(result.reason || '此环境不支持远程 Push')
        return
      }
      if (!result.stored) {
        setMessage('设备返回了 Push 状态，但 CID 未能完成服务器登记，请检查网络后重试。')
        return
      }
      setRegistered(true)
      if (result.token) {
        setToken(result.token)
        storePushToken(result.token)
      }
      setMessage('设备个推 CID 已成功登记到服务器！伴侣发消息时将自动推送到这台设备。')
      void refreshDiagnostics()
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
      const currentToken = token || readStoredPushToken()
      if (!currentToken) {
        setMessage('未检测到已登记的 Token')
        return
      }
      const result = await unregisterDevicePush(controller.space!.me.id, currentToken)
      setRegistered(false)
      setToken(undefined)
      clearStoredPushToken()
      setMessage(
        result.supported
          ? '本机 Push 已撤销，服务器登记已清理。'
          : result.reason || '此设备不支持远程 Push',
      )
      void refreshDiagnostics()
    } catch (error) {
      setMessage(`撤销失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  function copyDiagnosticsReport() {
    const report = [
      '--- BIBU！个推与设备排查报告 ---',
      `时间: ${new Date().toLocaleString()}`,
      `环境: ${diagnostics?.deviceModel ? 'Android 原生 APK' : 'Web 浏览器 / 预览环境'}`,
      `设备机型: ${diagnostics?.deviceModel || 'N/A'}`,
      `系统版本: ${diagnostics?.androidVersion || navigator.userAgent}`,
      `通知权限: ${permission ? (permission.granted ? '已开启 (GRANTED)' : '被拒绝/禁用 (DENIED)') : '未知'}`,
      `个推长连接: ${diagnostics ? (diagnostics.isPushOnline ? '在线 (ONLINE)' : '离线/连接中 (OFFLINE)') : '未知'}`,
      `个推 CID: ${diagnostics?.cid || token || '未就绪'}`,
      `服务器登记状态: ${registered ? '已同步已登记' : '未登记'}`,
      '--------------------------------',
    ].join('\n')

    navigator.clipboard
      .writeText(report)
      .then(() => {
        setCopiedDiag(true)
        setTimeout(() => setCopiedDiag(false), 2000)
      })
      .catch(() => {
        setMessage('复制失败，请手动截图或记录')
      })
  }

  return (
    <div className="settings-section">
      <h3>Android 远程 Push 设备登记与诊断</h3>
      <SettingsNote title="Push 工作原理">
        前台页面由 Supabase Realtime 即时更新；应用处于后台或息屏时，由个推推送服务（:pushservice 进程）
        接收云端透传并交由系统通知频道弹出横幅。
      </SettingsNote>

      {/* 状态看板 */}
      <div
        style={{
          border: '2px solid #e0dcd3',
          borderRadius: '4px',
          padding: '12px',
          background: '#fffdf9',
          marginTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.85rem',
        }}
      >
        <div
          style={{
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>推送链路自检看板</span>
          <button
            type="button"
            onClick={() => void refreshDiagnostics()}
            style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              cursor: 'pointer',
              border: '1px solid #999',
              background: '#fff',
              borderRadius: '2px',
            }}
          >
            刷新状态
          </button>
        </div>

        <div>
          <b>系统通知权限：</b>
          {permission ? (
            permission.granted ? (
              <span style={{ color: '#107c10', fontWeight: 'bold' }}>已开启 (正常)</span>
            ) : (
              <span style={{ color: '#d83b01', fontWeight: 'bold' }}>未开启 / 被禁用 (无法弹出横幅)</span>
            )
          ) : (
            '检测中…'
          )}
        </div>

        <div>
          <b>个推长连接状态：</b>
          {diagnostics ? (
            diagnostics.isPushOnline ? (
              <span style={{ color: '#107c10', fontWeight: 'bold' }}>在线 (长连接通畅)</span>
            ) : (
              <span style={{ color: '#d83b01' }}>离线 / 正在连接 (请检查手机网络)</span>
            )
          ) : (
            '检测中…'
          )}
        </div>

        <div style={{ wordBreak: 'break-all' }}>
          <b>个推 ClientId (CID)：</b>
          {diagnostics?.cid ? (
            <code>{diagnostics.cid}</code>
          ) : token ? (
            <code>{token}</code>
          ) : (
            <span style={{ color: '#888' }}>尚未获取到 CID（若刚启动应用请稍等或点击刷新）</span>
          )}
        </div>

        <div>
          <b>服务器登记状态：</b>
          {registered ? (
            <span style={{ color: '#107c10', fontWeight: 'bold' }}>已登记到云端 (可接收对方推送)</span>
          ) : (
            <span style={{ color: '#d83b01' }}>未登记 (对方发消息时无法推送到本设备)</span>
          )}
        </div>

        {diagnostics?.deviceModel && (
          <div style={{ color: '#666', fontSize: '0.75rem' }}>
            机型: {diagnostics.deviceModel} · {diagnostics.androidVersion}
          </div>
        )}
      </div>

      {permissionNote && (
        <p role="status" style={{ fontWeight: 600, marginTop: '8px' }}>
          {permissionNote}
        </p>
      )}
      {permission && !permission.granted && permission.supported && (
        <div style={{ marginTop: '6px' }}>
          <Button tone="yellow" disabled={busy} onClick={() => void requestPermission()}>
            去开启系统通知权限
          </Button>
        </div>
      )}

      {message && (
        <p role="status" style={{ marginTop: '8px', color: '#107c10', fontWeight: 'bold' }}>
          {message}
        </p>
      )}
      {testResult && (
        <p
          role="status"
          style={{
            marginTop: '8px',
            fontWeight: 500,
            color: '#333',
            background: '#f5f5f5',
            padding: '6px 10px',
            borderRadius: '2px',
          }}
        >
          {testResult}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        <Button
          tone={registered ? 'white' : 'yellow'}
          disabled={busy}
          onClick={() => void register()}
        >
          {busy ? '处理中…' : registered ? '重新更新/登记本机 CID' : '登记这台设备接收 Push'}
        </Button>
        <Button tone="white" disabled={busy} onClick={() => void testMessageChannel()}>
          自测 1：本地通知弹窗
        </Button>
        <Button tone="white" disabled={busy} onClick={() => void testCloudPing()}>
          自测 2：云端想你呼唤
        </Button>
        <Button tone="white" disabled={busy} onClick={() => void copyDiagnosticsReport()}>
          {copiedDiag ? '✓ 已复制报告' : '复制诊断排查报告'}
        </Button>
        <Button tone="white" disabled={busy || !registered} onClick={() => void revoke()}>
          撤销这台设备的 Push
        </Button>
      </div>

      <SettingsNote title="真机推送排查三部曲" className="push-troubleshoot-note">
        <ol style={{ margin: '0 0 0 16px', padding: 0 }}>
          <li>
            <b>步骤 1（横幅测试）</b>：点击「自测 1」，若收不到横幅或无提示音，说明系统通知权限被关或渠道被静音。
          </li>
          <li>
            <b>步骤 2（CID 与连通性）</b>：确认看板的 CID 是否已获取并处于「在线」状态。若离线，请检查手机是否开启了代理应用拦截了个推长连接。
          </li>
          <li>
            <b>步骤 3（保活与后台策略）</b>：国产手机（小米/华为/vivo/OPPO 等）必须在手机设置里将 BIBU！设为<b>「允许自启动」</b>，电池策略设为<b>「无限制」</b>，划掉应用后才能被个推唤醒。
          </li>
        </ol>
      </SettingsNote>
    </div>
  )
}
