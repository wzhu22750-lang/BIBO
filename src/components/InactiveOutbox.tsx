import { useEffect, useState } from 'react'
import { changeOutbox, listInactiveOutbox, type OutboxMessage } from '../lib/outbox'
import { errorText } from '../lib/supabase'
import { Button, Panel, useTask, useToast } from './ui'
import { SettingsNote } from './SettingsNote'
export function InactiveOutbox({
  userId,
  currentCoupleId,
}: {
  userId: string
  currentCoupleId: string | null
}) {
  const scope = `${userId}:${currentCoupleId || ''}`
  const [state, setState] = useState<{ scope: string; rows: OutboxMessage[]; error: string }>({
    scope: '',
    rows: [],
    error: '',
  })
  const [revision, setRevision] = useState(0),
    [confirm, setConfirm] = useState<string | null>(null)
  const { busy, run } = useTask(),
    toast = useToast()
  useEffect(() => {
    let active = true
    setConfirm(null)
    void listInactiveOutbox(userId, currentCoupleId).then(
      (rows) => {
        if (active) setState({ scope, rows, error: '' })
      },
      (e) => {
        if (active) setState({ scope, rows: [], error: errorText(e) })
      },
    )
    return () => {
      active = false
    }
  }, [scope, userId, currentCoupleId, revision])
  const rows = state.scope === scope ? state.rows : []
  return (
    <Panel title="旧空间待发送记录" tag="LOCAL ONLY" className="inactive-outbox">
      <div className="settings-section">
        <SettingsNote title="旧空间消息说明">
          这里只显示当前账号留在其他空间的本机消息。它们不会自动发往新关系。移除本机记录不是撤回已经到达服务器的消息。
        </SettingsNote>
        {state.scope !== scope ? (
          <p role="status">正在读取本机记录…</p>
        ) : state.error ? (
          <p role="alert">读取失败：{state.error}</p>
        ) : !rows.length ? (
          <p>没有旧空间待发送消息。</p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                <time>{new Date(row.queuedAt).toLocaleString()}</time>
                <p className="memory-story">{row.content}</p>
                {row.error && <small>{row.error}</small>}
                <Button
                  tone="white"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(row.content)
                      toast('原文已复制，尚未发送')
                    })
                  }
                >
                  复制原文
                </Button>
                {confirm === row.id ? (
                  <>
                    <p>确认移除此条本机记录？此操作不能撤销。</p>
                    <Button
                      tone="pink"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await changeOutbox(row.id, userId, row.coupleId, () => null)
                          setRevision((n) => n + 1)
                          toast('本机待发送记录已移除')
                        })
                      }
                    >
                      确认移除本机记录
                    </Button>
                    <Button tone="white" disabled={busy} onClick={() => setConfirm(null)}>
                      保留原文
                    </Button>
                  </>
                ) : (
                  <Button tone="white" disabled={busy} onClick={() => setConfirm(row.id)}>
                    移除此条记录
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Button tone="white" disabled={busy} onClick={() => setRevision((n) => n + 1)}>
          刷新本机记录
        </Button>
      </div>
    </Panel>
  )
}
