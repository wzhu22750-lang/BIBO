import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { OutboxMessage } from '../lib/outbox'
import { Button, Panel, useTask } from './ui'

function statusText(row: OutboxMessage) {
  if (row.status === 'blocked') return '同步失败，消息还没有送达'
  if (row.nextAttemptAt && row.nextAttemptAt > Date.now()) return '网络暂时不可用，稍后自动重试'
  return '已保存到本机，等待服务器确认'
}

export function MessageOutboxPanel({ controller }: { controller: SpaceController }) {
  const rows = controller.outbox.rows
  const [confirm, setConfirm] = useState<string | null>(null)
  const { busy, run } = useTask()
  if (!rows.length && !controller.outbox.error) return null
  return (
    <Panel title="待同步悄悄话" tag="LOCAL ONLY" className="chat-outbox-panel">
      <div className="chat-outbox-content">
        <p>
          这里的消息已经写入本机，但还没有得到服务器确认。关闭页面不会丢失；对方在确认前不会看到。
        </p>
        {controller.outbox.error && (
          <p role="alert">读取本机发送队列失败：{controller.outbox.error}</p>
        )}
        <div className="chat-outbox-list">
          {rows.map((row) => (
            <article key={row.id} className={`chat-outbox-row ${row.status}`}>
              <div className="chat-outbox-meta">
                <strong>{row.status === 'blocked' ? '需要处理' : '等待同步'}</strong>
                <time>{new Date(row.queuedAt).toLocaleString()}</time>
              </div>
              <p>{row.content}</p>
              <small>{statusText(row)}</small>
              {row.error && <small className="chat-outbox-error">原因：{row.error}</small>}
              <div className="chat-outbox-actions">
                {row.status === 'blocked' && (
                  <Button
                    tone="green"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await controller.outbox.retry(row.id)
                      })
                    }
                  >
                    重试发送
                  </Button>
                )}
                {confirm === row.id ? (
                  <>
                    <span className="chat-outbox-confirm">确认只移除本机记录？</span>
                    <Button
                      tone="pink"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await controller.outbox.discard(row.id)
                          setConfirm(null)
                        })
                      }
                    >
                      确认移除
                    </Button>
                    <Button tone="white" disabled={busy} onClick={() => setConfirm(null)}>
                      保留
                    </Button>
                  </>
                ) : (
                  <Button tone="white" disabled={busy} onClick={() => setConfirm(row.id)}>
                    移除本机记录
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  )
}
