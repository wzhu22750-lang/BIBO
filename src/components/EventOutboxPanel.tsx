import type { SpaceController } from '../hooks/useSpace'
import { Button, Panel, useTask, useToast } from './ui'
export function EventOutboxPanel({ controller }: { controller: SpaceController }) {
  const { busy, run } = useTask(),
    toast = useToast(),
    rows = controller.eventOutbox.rows
  if (!rows.length) return null
  return (
    <Panel title="事件同步队列" tag="LOCAL RECOVERY" className="event-outbox-panel">
      <div className="settings-section">
        <p>
          事件意图已保存在本机；等待同步不等于伴侣已看到。网络恢复后会使用同一个事件 ID
          重试，不会重复创建。
        </p>
        {controller.eventOutbox.error && (
          <p role="alert">队列读取失败：{controller.eventOutbox.error}</p>
        )}
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              <strong>
                {row.operation === 'create'
                  ? row.input?.title || '未命名事件'
                  : `删除事件「${controller.space?.events.find((event) => event.id === row.eventId)?.title || row.eventId}」`}
              </strong>
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
                    await controller.eventOutbox.retry(row.id)
                    toast('已请求重试事件同步')
                  })
                }
              >
                重试同步
              </Button>
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await controller.eventOutbox.discard(row.id)
                    toast('本机事件意图已移除')
                  })
                }
              >
                移除本机意图
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
