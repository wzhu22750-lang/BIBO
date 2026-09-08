import { useCallback, useEffect, useState } from 'react'
import { loadPhotoPage } from '../lib/api'
import { errorText } from '../lib/supabase'
import type { Photo } from '../lib/types'
import type { PhotoCursor, PhotoPage } from '../lib/photoHistory'
export function usePhotoPages(
  coupleId: string,
  eventId: string | null,
  enabled: boolean,
  fetchPage = loadPhotoPage,
) {
  const scope = `${coupleId}:${eventId || ''}`
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
  }>({ key: '', page: { photos: [], hasMore: false }, error: '', busy: false })
  const refresh = useCallback(() => setRevision((n) => n + 1), [])
  useEffect(() => {
    if (!enabled) return
    let active = true
    setState((s) => ({
      key,
      page: s.key === key ? s.page : { photos: [], hasMore: false },
      error: '',
      busy: true,
    }))
    void fetchPage(coupleId, cursor, eventId).then(
      (page) => {
        if (active) setState({ key, page, error: '', busy: false })
      },
      (e) => {
        if (active) setState((s) => ({ ...s, key, busy: false, error: errorText(e) }))
      },
    )
    return () => {
      active = false
    }
  }, [coupleId, eventId, cursor?.id, cursor?.created_at, key, revision, enabled, fetchPage])
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
      : { key, page: { photos: [] as Photo[], hasMore: false }, error: '', busy: enabled }
  return {
    ...active.page,
    busy: active.busy,
    error: active.error,
    pageNumber: cursors.length,
    refresh,
    next() {
      if (active.busy || !active.page.hasMore) return
      const last = active.page.photos.at(-1)
      if (last)
        setNavigation({
          scope,
          cursors: [...cursors, { id: last.id, created_at: last.created_at }],
        })
    },
    previous() {
      if (!active.busy && cursors.length > 1)
        setNavigation({ scope, cursors: cursors.slice(0, -1) })
    },
  }
}
