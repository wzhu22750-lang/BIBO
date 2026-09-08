import type { SpaceController } from '../hooks/useSpace'
import { Button, Panel, useTask, useToast } from './ui'
export function PhotoOutboxPanel({ controller }: { controller: SpaceController }) {
  const { busy, run } = useTask(),
    toast = useToast(),
    rows = controller.photoOutbox.rows
  if (!rows.length) return null
  return (
    <Panel title="照片同步队列" tag="LOCAL RECOVERY" className="event-outbox-panel">
      <div className="settings-section">
        <p>
          照片文件和回忆文字已保存在本机，联网后会使用同一路径重试；等待同步不代表伴侣已经看到。
        </p>
        {controller.photoOutbox.error && (
          <p role="alert">照片队列读取失败：{controller.photoOutbox.error}</p>
        )}
        <ul>
          {rows.map((row) => (
            <li key={row.id}>
              <strong>{row.caption || '未命名回忆'}</strong>
              <small>
                {row.status === 'blocked'
                  ? '同步失败，原回忆已保留'
                  : row.nextAttemptAt
                    ? `等待重试 · 最早 ${new Date(row.nextAttemptAt).toLocaleTimeString()}`
                    : '等待上传'}
                {row.error ? ` · ${row.error}` : ''}
              </small>
              <Button
                tone="white"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await controller.photoOutbox.retry(row.id)
                    toast('已请求重试照片同步')
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
                    await controller.photoOutbox.discard(row.id)
                    toast('本机照片意图已移除')
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
