import { useCallback, useEffect, useRef, useState } from 'react'
import { withRequestDeadline } from '../lib/requestDeadline'
import { errorText } from '../lib/supabase'
import * as api from '../lib/api'
import type { MemoryInput, Photo } from '../lib/types'
import {
  changePhotoOutbox,
  enqueuePhoto,
  listPhotoOutbox,
  photoConfirmed,
  photoFailure,
  photoRowsReadyForSync,
  retryablePhotoError,
  type PhotoOutboxOperation,
} from '../lib/photoOutbox'
export function usePhotoOutbox(
  userId: string | undefined,
  coupleId: string | undefined,
  enabled: boolean,
  onCommitted: (photo: Photo) => void,
  upload = api.uploadPhotoOnce,
) {
  const [state, setState] = useState<{
    scope: string
    rows: PhotoOutboxOperation[]
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
    const rows = await listPhotoOutbox(userId, coupleId)
    if (scopeRef.current === scope) setState({ scope, rows, error: '' })
  }, [enabled, userId, coupleId, scope])
  const flush = useCallback(async () => {
    if (!enabled || !userId || !coupleId || !navigator.onLine || running.current.has(scope)) return
    running.current.add(scope)
    try {
      const rows = await listPhotoOutbox(userId, coupleId)
      for (const row of photoRowsReadyForSync(rows)) {
        if (scopeRef.current !== scope || !navigator.onLine) break
        try {
          const file = new File([row.file], row.fileName, { type: row.mime })
          const saved = await withRequestDeadline(
            (signal) =>
              upload(coupleId, userId, row.photoId, file, row.caption, row.memory, signal),
            20000,
            '照片同步超时；文件/回忆意图已保留，稍后使用同一 ID 重试',
          )
          if (!photoConfirmed(row, saved))
            throw {
              message: '服务器返回的照片不匹配，已保留本机原文',
              code: 'PHOTO_OUTBOX_MISMATCH',
            }
          await changePhotoOutbox(row.id, userId, coupleId, () => null)
          if (scopeRef.current === scope) callback.current(saved)
        } catch (error) {
          const retryable = retryablePhotoError(error)
          await changePhotoOutbox(row.id, userId, coupleId, (current) =>
            photoFailure(current, errorText(error), retryable),
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
  }, [enabled, userId, coupleId, scope, refresh, upload])
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
    async enqueue(file: File, caption: string, memory: MemoryInput) {
      if (!userId || !coupleId) throw new Error('请先登录并进入空间')
      await enqueuePhoto({
        id: crypto.randomUUID(),
        photoId: crypto.randomUUID(),
        userId,
        coupleId,
        file,
        fileName: file.name,
        mime: file.type,
        caption,
        memory,
        queuedAt: Date.now(),
        status: 'pending',
      })
      await refresh().catch(() => {})
      void flush()
    },
    async retry(id: string) {
      if (!userId || !coupleId) return
      await changePhotoOutbox(id, userId, coupleId, (row) => ({
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
      await changePhotoOutbox(id, userId, coupleId, () => null)
      await refresh()
    },
  }
}
