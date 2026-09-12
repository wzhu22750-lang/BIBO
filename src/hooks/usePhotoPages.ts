import { useCallback, useEffect, useState } from 'react'
import { loadPhotoPage } from '../lib/api'
import { errorText } from '../lib/supabase'
import { photoCursor, PhotoHistoryUnsupportedError } from '../lib/photoHistory'
import type { PhotoCursor, PhotoPage } from '../lib/photoHistory'
import type { MemoryOrder } from '../lib/memories'
import type { Photo } from '../lib/types'
export function usePhotoPages(
  coupleId: string,
  eventId: string | null,
  enabled: boolean,
  order: MemoryOrder = 'desc',
  fetchPage = loadPhotoPage,
) {
  const scope = `${coupleId}:${eventId || ''}:${order}`
  const [navigation, setNavigation] = useState<{ scope: string; cursors: (PhotoCursor | null)[] }>({
    scope,
    cursors: [null],
  })
  const cursors = navigation.scope === scope ? navigation.cursors : [null]
  const cursor = cursors[cursors.length - 1]
  const key = `${scope}:${cursor?.id || 'first'}`
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<{
    key: string
    page: PhotoPage
    error: string
    busy: boolean
    unsupported: boolean
  }>({ key: '', page: { photos: [], hasMore: false }, error: '', busy: false, unsupported: false })
  const refresh = useCallback(() => setRevision((n) => n + 1), [])
  useEffect(() => {
    if (!enabled) return
    let active = true
    setState((s) => ({
      key,
      page: s.key === key ? s.page : { photos: [], hasMore: false },
      error: '',
      busy: true,
      unsupported: false,
    }))
    void fetchPage(coupleId, cursor, eventId, order).then(
      (page) => {
        if (active) setState({ key, page, error: '', busy: false, unsupported: false })
      },
      (e) => {
        if (!active) return
        // 后端 photo_history 迁移未应用：不报错，交给页面用本地快照降级渲染。
        if (e instanceof PhotoHistoryUnsupportedError) {
          setState({
            key,
            page: { photos: [], hasMore: false },
            error: '',
            busy: false,
            unsupported: true,
          })
          return
        }
        setState((s) => ({ ...s, key, busy: false, error: errorText(e), unsupported: false }))
      },
    )
    return () => {
      active = false
    }
  }, [coupleId, eventId, cursor?.id, cursor?.created_at, key, revision, enabled, order, fetchPage])
  useEffect(() => {
    if (!enabled) return
    const wake = () => {
      if (!document.hidden) refresh()
    }
    const timer = setInterval(wake, 60000)
    document.addEventListener('visibilitychange', wake)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [enabled, refresh])
  const active =
    state.key === key
      ? state
      : {
          key,
          page: { photos: [] as Photo[], hasMore: false },
          error: '',
          busy: enabled,
          unsupported: false,
        }
  return {
    ...active.page,
    busy: active.busy,
    error: active.error,
    unsupported: active.unsupported,
    pageNumber: cursors.length,
    refresh,
    next() {
      if (active.busy || !active.page.hasMore) return
      const last = active.page.photos.at(-1)
      if (last) setNavigation({ scope, cursors: [...cursors, photoCursor(last)] })
    },
    previous() {
      if (!active.busy && cursors.length > 1)
        setNavigation({ scope, cursors: cursors.slice(0, -1) })
    },
  }
}
