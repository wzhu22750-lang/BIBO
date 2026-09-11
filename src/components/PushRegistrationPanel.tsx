import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import {
  readStoredPushToken,
  registerDevicePush,
  storePushToken,
} from '../lib/pushRegistration'
import { BibuNative, type NotificationPermission, type PushDiagnostics } from '../native'
import { Icon } from './PixelArt'

export function PushRegistrationPanel({ controller }: { controller: SpaceController }) {
  const initialToken = readStoredPushToken()
  const [registered, setRegistered] = useState(Boolean(initialToken))
  const [token, setToken] = useState<string | undefined>(initialToken)
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [diagnostics, setDiagnostics] = useState<PushDiagnostics | null>(null)
  const [copiedCid, setCopiedCid] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

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

    const interval = setInterval(() => {
      void refreshDiagnostics()
    }, 8000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const copyCid = async () => {
    const targetCid = diagnostics?.cid || token || ''
    if (!targetCid) return
    try {
      await navigator.clipboard.writeText(targetCid)
      setCopiedCid(true)
      setTimeout(() => setCopiedCid(false), 2000)
    } catch {
      setStatusMsg('复制失败')
    }
  }

  const handleTestLocalMessage = async () => {
    setBusy(true)
    setStatusMsg('正在发送悄悄话横幅测试...')
    try {
      await BibuNative.notifications.show({
        id: 999,
        title: 'BIBU！悄悄话渠道测试',
        body: '如果你看到了这条系统横幅，说明通知通道（bibo_messages_v2）完全正常！',
        route: '#chat',
        channel: 'messages',
      })
      setStatusMsg('测试横幅已投递，请看通知栏')
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : '发送失败')
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshRegistration = async () => {
    setBusy(true)
    setStatusMsg('正在重新检查状态并登记 CID...')
    try {
      const reg = await BibuNative.push.register()
      const currentToken = reg.token || diagnostics?.cid || token
      if (!currentToken) throw new Error('未获取到个推 CID')
      storePushToken(currentToken)
      setToken(currentToken)
      if (controller.space?.me?.id) {
        await registerDevicePush(controller.space.me.id, currentToken)
      }
      setRegistered(true)
      await refreshDiagnostics()
      setStatusMsg('个推 CID 登记成功，长连接已激活！')
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : '登记失败')
    } finally {
      setBusy(false)
    }
  }

  const handleCopyReport = async () => {
    const report = [
      '--- BIBU GETUI PUSH REPORT ---',
      `time: ${new Date().toISOString()}`,
      `cid: ${diagnostics?.cid || token || 'NONE'}`,
      `isPushOnline: ${diagnostics?.isPushOnline ?? 'UNKNOWN'}`,
      `sdkVersion: ${diagnostics?.sdkVersion || '3.3.15.0'}`,
      `deviceModel: ${diagnostics?.deviceModel || 'N/A'}`,
      `androidVersion: ${diagnostics?.androidVersion || 'N/A'}`,
      `notificationPermission: ${permission?.granted ? 'GRANTED' : 'DENIED'}`,
      `registeredOnServer: ${registered}`,
      '------------------------------',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(report)
      setCopiedReport(true)
      setTimeout(() => setCopiedReport(false), 2000)
      setStatusMsg('已复制完整诊断报告')
    } catch {
      setStatusMsg('写入剪贴板失败')
    }
  }

  const isOnline = diagnostics?.isPushOnline === true

  return (
    <div className="link-station-card">
      <div className="retro-window-bar bar-green">
        <span className="micro">
          <i className="sq" /> GETUI LINK STATION · 通信与个推联络站
        </span>
        <div className="dots">■ ■ ■</div>
      </div>

      <div className="retro-cartridge-body">
        {/* CRT 终端液晶监控屏 */}
        <div className="crt-monitor-screen">
          <div className="crt-header-line">
            <span>[SIGNAL ANTENNA]</span>
            {isOnline ? (
              <span className="crt-status-online">
                <i className="crt-blink-led" /> ONLINE 在线 (长连接通畅)
              </span>
            ) : (
              <span className="crt-status-offline">
                <i
                  className="crt-blink-led"
                  style={{ background: '#fb923c', boxShadow: '0 0 6px #fb923c' }}
                />
                OFFLINE 离线 (请点击重新激活)
              </span>
            )}
          </div>

          <div className="crt-data-row">
            <span>CID:</span>
            <span className="crt-cid-text">{diagnostics?.cid || token || '等待分配...'}</span>
            {(diagnostics?.cid || token) && (
              <button type="button" className="crt-copy-btn" onClick={() => void copyCid()}>
                {copiedCid ? '已复制' : '复制'}
              </button>
            )}
          </div>

          <div className="crt-meta-line">
            <span>机型: {diagnostics?.deviceModel || 'Android Phone'} (API {diagnostics?.androidVersion || '36'})</span>
            <span style={{ marginLeft: '10px' }}>
              SDK: v{diagnostics?.sdkVersion || '3.3.15.0'}
            </span>
          </div>

          <div className="crt-meta-line" style={{ color: registered ? '#86efac' : '#fca5a5' }}>
            <span>伴侣云端链路: {registered ? '已完成登记' : '未登记'}</span>
            <span style={{ marginLeft: '10px', color: permission?.granted ? '#86efac' : '#fca5a5' }}>
              通知栏: {permission?.granted ? '已授权' : '未开启'}
            </span>
          </div>
        </div>

        {/* 状态消息 */}
        {statusMsg && (
          <div
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontWeight: 700,
            }}
          >
            ✦ {statusMsg}
          </div>
        )}

        {/* 街机风格诊断按键组 */}
        <div className="arcade-buttons-deck">
          <button
            type="button"
            className="arcade-btn btn-green"
            disabled={busy}
            onClick={() => void handleRefreshRegistration()}
          >
            <Icon name="spark" size={13} />
            <span>重新检查 / 激活</span>
          </button>

          <button
            type="button"
            className="arcade-btn btn-yellow"
            disabled={busy}
            onClick={() => void handleTestLocalMessage()}
          >
            <Icon name="chat" size={13} />
            <span>自测通知横幅</span>
          </button>

          <button
            type="button"
            className="arcade-btn btn-white"
            disabled={busy}
            onClick={() => void handleCopyReport()}
          >
            <Icon name="heart" size={13} />
            <span>{copiedReport ? '已复制报告' : '复制排查报告'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
