import { withRequestDeadline } from '../lib/requestDeadline'
import { failedOutboxAttempt, outboxDue } from '../lib/outboxRetry'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  changeOutbox,
  confirmedOutboxRow,
  enqueueMessage,
  listOutbox,
  retryableOutboxError,
  type OutboxMessage,
} from '../lib/outbox'
import { sendMessageOnce } from '../lib/api'
import { errorText } from '../lib/supabase'
import type { Message } from '../lib/types'
export function useMessageOutbox(
  userId: string | undefined,
  coupleId: string | undefined,
  enabled: boolean,
  onCommitted: (row: Message) => void,
  send: typeof sendMessageOnce = sendMessageOnce,
) {
  const [state, setState] = useState<{ scope: string; rows: OutboxMessage[]; error: string }>({
    scope: '',
    rows: [],
    error: '',
  })
  const scope = `${userId || ''}:${coupleId || ''}`
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  const callback = useRef(onCommitted)
  callback.current = onCommitted
  const running = useRef(new Set<string>())
  const refresh = useCallback(async () => {
    if (!enabled || !userId || !coupleId) return
    const rows = await listOutbox(userId, coupleId)
    if (scopeRef.current === scope) setState({ scope, rows, error: '' })
  }, [userId, coupleId, enabled, scope])
  const flush = useCallback(async () => {
    if (!enabled || !userId || !coupleId || !navigator.onLine || running.current.has(scope)) return
    running.current.add(scope)
    try {
      const rows = await listOutbox(userId, coupleId)
      for (const row of rows) {
        if (scopeRef.current !== scope || !navigator.onLine) break
        if (row.status === 'blocked') continue
        if (!outboxDue(row)) break // Preserve ordering among pending messages during backoff.
        try {
          const saved = await withRequestDeadline((signal) =>
            send(row.id, coupleId, row.content, signal),
          )
          if (!confirmedOutboxRow(row, saved))
            throw { message: '服务器返回的消息不匹配，已保留原文', code: 'OUTBOX_MISMATCH' }
          // Persist removal only after an exact server confirmation. Ambiguous failures retain UUID.
          await changeOutbox(row.id, userId, coupleId, () => null)
          if (scopeRef.current === scope) callback.current(saved)
        } catch (error) {
          const retryable = retryableOutboxError(error)
          await changeOutbox(row.id, userId, coupleId, (current) =>
            failedOutboxAttempt(current, errorText(error), retryable),
          )
          if (retryable) break
        }
      }
      await refresh()
    } catch (error) {
      if (scopeRef.current === scope) setState((s) => ({ ...s, scope, error: errorText(error) }))
    } finally {
      running.current.delete(scope)
    }
  }, [userId, coupleId, enabled, scope, refresh, send])
  useEffect(() => {
    scopeRef.current = scope
    let active = true
    void refresh().catch((error) => {
      if (active) setState({ scope, rows: [], error: errorText(error) })
    })
    void flush()
    const wake = () => {
      if (!document.hidden) {
        void flush()
        void refresh().catch(() => {})
      }
    }
    const interval = setInterval(wake, 15000)
    window.addEventListener('online', wake)
    document.addEventListener('visibilitychange', wake)
    return () => {
      active = false
      if (scopeRef.current === scope) scopeRef.current = ''
      clearInterval(interval)
      window.removeEventListener('online', wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [flush, refresh, scope])
  return {
    rows: state.scope === scope ? state.rows : [],
    error: state.scope === scope ? state.error : '',
    async enqueue(content: string) {
      if (!enabled || !userId || !coupleId) throw new Error('请先登录并进入空间')
      const clean = content.trim()
      if (!clean || Array.from(clean).length > 2000) throw new Error('消息需为 1–2000 字')
      await enqueueMessage({
        id: crypto.randomUUID(),
        userId,
        coupleId,
        content: clean,
        queuedAt: Date.now(),
        status: 'pending',
      })
      await refresh().catch((error) => {
        if (scopeRef.current === scope) setState((s) => ({ ...s, scope, error: errorText(error) }))
      })
      void flush()
    },
    async retry(id: string) {
      if (!userId || !coupleId) return
      await changeOutbox(id, userId, coupleId, (row) => ({
        ...row,
        status: 'pending',
        error: undefined,
        nextAttemptAt: undefined,
        attempts: 0,
      }))
      await refresh().catch((error) => {
        if (scopeRef.current === scope) setState((s) => ({ ...s, scope, error: errorText(error) }))
      })
      void flush()
    },
    async discard(id: string) {
      if (!userId || !coupleId) return
      await changeOutbox(id, userId, coupleId, () => null)
      await refresh()
    },
  }
}
