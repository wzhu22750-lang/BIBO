import { useEffect, useRef, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { LinkedRecord } from '../lib/types'
import type { ReferenceKind } from '../lib/routes'
import { dateLabel, clock } from '../lib/dates'
import { errorText } from '../lib/supabase'
import { Button } from './ui'
export function LinkedRecordPanel({
  controller,
  kind,
  id,
}: {
  controller: SpaceController
  kind: ReferenceKind
  id: string
}) {
  const [result, setResult] = useState<{
    value: LinkedRecord | null
    error: string
    loading: boolean
  }>({ value: null, error: '', loading: true })
  const [retry, setRetry] = useState(0)
  const panel = useRef<HTMLElement>(null)
  const read = controller.readReference
  useEffect(() => {
    let active = true
    setResult({ value: null, error: '', loading: true })
    void read(kind, id).then(
      (value) => {
        if (active) setResult({ value, error: '', loading: false })
      },
      (error) => {
        if (active) setResult({ value: null, error: errorText(error), loading: false })
      },
    )
    return () => {
      active = false
    }
  }, [read, kind, id, retry])
  useEffect(() => {
    if (!result.loading) panel.current?.focus({ preventScroll: false })
  }, [result.loading])
  const item = result.value
  return (
    <section
      ref={panel}
      tabIndex={-1}
      className="linked-record-panel"
      aria-label={kind === 'message' ? '定位的悄悄话' : '定位的事件'}
      aria-busy={result.loading}
    >
      <h2>{kind === 'message' ? '这段回忆里的悄悄话' : '这段回忆里的事件'}</h2>
      {result.loading ? (
        <p role="status">正在读取关联记录…</p>
      ) : result.error ? (
        <div role="alert">
          <p>读取失败：{result.error}</p>
          <Button onClick={() => setRetry((n) => n + 1)}>重新读取</Button>
        </div>
      ) : !item ? (
        <p>记录已删除，或当前空间无法访问。不会显示其他空间的内容。</p>
      ) : item.kind === 'message' ? (
        <>
          <p>
            {item.record.sender_id === null
              ? '已注销玩家'
              : item.record.sender_id === controller.space!.me.id
                ? '你'
                : controller.space!.partner?.name || 'TA'}{' '}
            ·{' '}
            <time dateTime={item.record.created_at}>
              {dateLabel(item.record.created_at)} {clock(item.record.created_at)}
            </time>
          </p>
          <blockquote>{item.record.content}</blockquote>
          <small>单独读取的关联消息，不代表已经加载完整聊天历史。</small>
        </>
      ) : (
        <>
          <h3>{item.record.title}</h3>
          <p>
            原始事件日期：{dateLabel(item.record.target_at)}
            {item.record.yearly ? ' · 每年纪念' : ''}
          </p>
        </>
      )}
      <a href={kind === 'message' ? '#chat' : '#events'}>
        返回{kind === 'message' ? '最近聊天' : '时间线'}
      </a>
    </section>
  )
}
