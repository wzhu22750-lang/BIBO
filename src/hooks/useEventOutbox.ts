import { useCallback, useEffect, useRef, useState } from 'react'
import { withRequestDeadline } from '../lib/requestDeadline'
import { errorText } from '../lib/supabase'
import * as api from '../lib/api'
import {
  changeEventOutbox,
  confirmedEvent,
  enqueueEvent,
  eventDue,
  eventOperationForCreate,
  eventOperationForUpdate,
  eventOperationForDelete,
  failedEventAttempt,
  listEventOutbox,
  retryableEventError,
  type EventOutboxOperation,
} from '../lib/eventOutbox'
import type { EventInput, EventItem } from '../lib/types'
export function useEventOutbox(
  userId: string | undefined,
  coupleId: string | undefined,
  enabled: boolean,
  onCommitted: (
    value:
      | { operation: 'create' | 'update'; event: EventItem }
      | { operation: 'delete'; eventId: string },
  ) => void,
  create = api.createEventOnce,
  update = api.updateEventOnce,
  remove = api.deleteEventOnce,
) {
  const [state, setState] = useState<{
    scope: string
    rows: EventOutboxOperation[]
    error: string
  }>({ scope: '', rows: [], error: '' })
  const scope = `${userId || ''}:${coupleId || ''}`
  const scopeRef = useRef(scope)
  scopeRef.current = scope
  const callback = useRef(onCommitted)
  callback.current = onCommitted
  const running = useRef(new Set<string>())
  const refresh = useCallback(async () => {
    if (!enabled || !userId || !coupleId) return
    const rows = await listEventOutbox(userId, coupleId)
    if (scopeRef.current === scope) setState({ scope, rows, error: '' })
  }, [enabled, userId, coupleId, scope])
  const flush = useCallback(async () => {
    if (!enabled || !userId || !coupleId || !navigator.onLine || running.current.has(scope)) return
    running.current.add(scope)
    try {
      const rows = await listEventOutbox(userId, coupleId)
      for (const row of rows) {
        if (scopeRef.current !== scope || !navigator.onLine) break
        if (row.status === 'blocked') {
          if (row.error && /mismatch|不匹配/i.test(row.error)) {
            await changeEventOutbox(row.id, userId, coupleId, (current) => ({
              ...current,
              status: 'pending',
              error: undefined,
              nextAttemptAt: undefined,
              attempts: 0,
            }))
            row.status = 'pending'
            row.error = undefined
          } else {
            continue
          }
        }
        if (!eventDue(row)) break // Preserve create/delete order while an earlier operation backs off
        try {
          if (row.operation === 'create' || row.operation === 'update') {
            if (!row.input) throw { message: '待同步事件内容缺失', code: 'EVENT_OUTBOX_INVALID' }
            const sender = row.operation === 'create' ? create : update
            const saved = await withRequestDeadline(
              (signal) => sender(row.eventId, coupleId, row.input!, signal),
              20000,
              row.operation === 'create'
                ? '事件同步超时，结果尚未确认；原事件意图已保留，稍后使用同一 ID 重试'
                : '事件编辑超时，结果尚未确认；原事件意图已保留，稍后使用同一 ID 重试',
            )
            if (!confirmedEvent(row, saved))
              throw {
                message: '服务器返回的事件不匹配，已保留原内容',
                code: 'EVENT_OUTBOX_MISMATCH',
              }
            await changeEventOutbox(row.id, userId, coupleId, () => null)
            if (scopeRef.current === scope)
              callback.current({ operation: row.operation, event: saved })
          } else {
            const confirmed = await withRequestDeadline(
              (signal) => remove(row.eventId, coupleId, signal),
              20000,
              '事件删除超时，结果尚未确认；原删除意图已保留，稍后使用同一 ID 重试',
            )
            if (!confirmed)
              throw { message: '事件删除结果未确认', code: 'EVENT_DELETE_UNCONFIRMED' }
            await changeEventOutbox(row.id, userId, coupleId, () => null)
            if (scopeRef.current === scope)
              callback.current({ operation: 'delete', eventId: row.eventId })
          }
        } catch (error) {
          const retryable = retryableEventError(error)
          await changeEventOutbox(row.id, userId, coupleId, (current) =>
            failedEventAttempt(current, errorText(error), retryable),
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
  }, [enabled, userId, coupleId, scope, refresh, create, update, remove])
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
    const timer = setInterval(wake, 15000)
    window.addEventListener('online', wake)
    document.addEventListener('visibilitychange', wake)
    return () => {
      active = false
      if (scopeRef.current === scope) scopeRef.current = ''
      clearInterval(timer)
      window.removeEventListener('online', wake)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [scope, refresh, flush])
  return {
    rows: state.scope === scope ? state.rows : [],
    error: state.scope === scope ? state.error : '',
    async enqueueCreate(input: EventInput) {
      if (!userId || !coupleId) throw new Error('请先登录并进入空间')
      const row = eventOperationForCreate(userId, coupleId, input)
      await enqueueEvent(row)
      await refresh().catch(() => {})
      void flush()
    },
    async enqueueUpdate(eventId: string, input: EventInput) {
      if (!userId || !coupleId) throw new Error('请先登录并进入空间')
      const row = eventOperationForUpdate(userId, coupleId, eventId, input)
      await enqueueEvent(row)
      await refresh().catch(() => {})
      void flush()
    },
    async enqueueDelete(eventId: string) {
      if (!userId || !coupleId) throw new Error('请先登录并进入空间')
      const row = eventOperationForDelete(userId, coupleId, eventId)
      await enqueueEvent(row)
      await refresh().catch(() => {})
      void flush()
    },
    async retry(id: string) {
      if (!userId || !coupleId) return
      await changeEventOutbox(id, userId, coupleId, (row) => ({
        ...row,
        status: 'pending',
        error: undefined,
        nextAttemptAt: undefined,
        attempts: 0,
      }))
      await refresh()
      void flush()
    },
    async discard(id: string) {
      if (!userId || !coupleId) return
      await changeEventOutbox(id, userId, coupleId, () => null)
      await refresh()
    },
  }
}
