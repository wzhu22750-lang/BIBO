import { useEffect, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { Button, useTask, useToast } from './ui'
import { InviteCode } from '../pages/Settings'
import { errorText } from '../lib/supabase'
export function InvitationManager({ controller }: { controller: SpaceController }) {
  const [status, setStatus] = useState<{ active: boolean; expires_at: string } | null>(null)
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0)
  const [code, setCode] = useState(controller.inviteCode)
  const { busy, run } = useTask(),
    toast = useToast()
  const cid = controller.space!.couple!.id
  const read = controller.invitationStatus
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void read()
      .then(
        (value) => {
          if (active) {
            setStatus(value)
            if (!value?.active) setCode('')
          }
        },
        (e) => {
          if (active) setError(errorText(e))
        },
      )
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [cid, revision, read])
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) setRevision((n) => n + 1)
    }
    const timer = setInterval(refresh, 30000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return (
    <>
      {loading ? (
        <p role="status">正在检查邀请状态…</p>
      ) : error ? (
        <p role="alert">邀请状态读取失败：{error}</p>
      ) : (
        <p>
          {status?.active
            ? `待使用 · 到期时间 ${new Date(status.expires_at).toLocaleString()}`
            : status
              ? '原邀请已过期'
              : '没有待使用的邀请码'}
        </p>
      )}
      {code && status?.active && !error && <InviteCode code={code} />}
      {status?.active && !code && (
        <p>出于隐私考虑，服务器不保存可取回的邀请码原文。可以撤销它，或生成新码并使旧码失效。</p>
      )}
      <Button
        disabled={busy}
        onClick={() =>
          void run(async () => {
            const value = await controller.refreshInvite()
            setCode(value)
            setRevision((n) => n + 1)
            toast('已生成新邀请码，旧码失效')
          })
        }
      >
        生成新邀请码
      </Button>
      <Button
        tone="white"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            await controller.revokeInvitation()
            setCode('')
            setStatus(null)
            setRevision((n) => n + 1)
            toast('待使用邀请码已撤销；已完成的绑定不会被解除')
          })
        }
      >
        撤销待使用邀请
      </Button>
      {error && (
        <Button tone="white" onClick={() => setRevision((n) => n + 1)}>
          重新检查邀请状态
        </Button>
      )}
    </>
  )
}
