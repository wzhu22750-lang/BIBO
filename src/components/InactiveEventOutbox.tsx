import { useEffect, useState } from 'react'
import {
  changeEventOutbox,
  listAllEventOutbox,
  type EventOutboxOperation,
} from '../lib/eventOutbox'
import { errorText } from '../lib/supabase'
import { Button, Panel, useTask, useToast } from './ui'
export function InactiveEventOutbox({
  userId,
  currentCoupleId,
}: {
  userId: string
  currentCoupleId: string | null
}) {
  const scope = `${userId}:${currentCoupleId || ''}`
  const [state, setState] = useState<{
    scope: string
    rows: EventOutboxOperation[]
    error: string
  }>({ scope: '', rows: [], error: '' })
  const [revision, setRevision] = useState(0),
    [confirm, setConfirm] = useState<string | null>(null)
  const { busy, run } = useTask(),
    toast = useToast()
  useEffect(() => {
    let active = true
    setConfirm(null)
    void listAllEventOutbox(userId).then(
      (rows) => {
        if (active)
          setState({
            scope,
            rows: rows.filter((row) => row.coupleId !== currentCoupleId),
            error: '',
          })
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
  if (!rows.length && !state.error && state.scope === scope) return null
  return (
    <Panel title="旧空间事件意图" tag="LOCAL ONLY" className="inactive-outbox">
      <div className="settings-section">
        <p>
          旧关系留下的创建/删除事件意图不会自动迁移到新空间。复制摘要后，可在新空间重新手动创建；移除本机意图不会撤回服务器上已经完成的操作。
        </p>
        {state.scope !== scope ? (
          <p role="status">正在读取本机事件意图…</p>
        ) : state.error ? (
          <p role="alert">读取失败：{state.error}</p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                <time>{new Date(row.queuedAt).toLocaleString()}</time>
                <p>
                  {row.operation === 'create'
                    ? `创建：${row.input?.title || '未命名事件'}`
                    : `删除事件：${row.eventId}`}
                </p>
                <small>
                  {row.status === 'blocked'
                    ? '同步失败，原意图已保留'
                    : row.nextAttemptAt
                      ? `等待重试 · 最早 ${new Date(row.nextAttemptAt).toLocaleTimeString()}`
                      : '等待同步'}
                  {row.error ? ` · ${row.error}` : ''}
                </small>
                <Button
                  tone="white"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await navigator.clipboard.writeText(
                        JSON.stringify(
                          {
                            operation: row.operation,
                            eventId: row.eventId,
                            input: row.input || null,
                          },
                          null,
                          2,
                        ),
                      )
                      toast('事件摘要已复制，尚未迁移')
                    })
                  }
                >
                  复制事件摘要
                </Button>
                {confirm === row.id ? (
                  <>
                    <p>确认移除这条旧空间本机意图？</p>
                    <Button
                      tone="pink"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await changeEventOutbox(row.id, userId, row.coupleId, () => null)
                          setRevision((n) => n + 1)
                          toast('旧空间事件意图已移除')
                        })
                      }
                    >
                      确认移除
                    </Button>
                    <Button tone="white" disabled={busy} onClick={() => setConfirm(null)}>
                      保留原文
                    </Button>
                  </>
                ) : (
                  <Button tone="white" disabled={busy} onClick={() => setConfirm(row.id)}>
                    移除本机意图
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Button tone="white" disabled={busy} onClick={() => setRevision((n) => n + 1)}>
          刷新本机事件意图
        </Button>
      </div>
    </Panel>
  )
}
