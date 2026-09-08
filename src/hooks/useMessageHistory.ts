import { useEffect, useRef, useState } from 'react'
import type { Message } from '../lib/types'
import { loadMessageHistory } from '../lib/api'
import { mergeMessages } from '../lib/messageHistory'
import { errorText } from '../lib/supabase'
export function useMessageHistory(
  coupleId: string,
  latest: Message[],
  demo: boolean,
  fetchPage = loadMessageHistory,
) {
  const [state, setState] = useState<{
    scope: string
    older: Message[]
    done: boolean
    error: string
  }>({ scope: coupleId, older: [], done: false, error: '' })
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const scope = useRef(coupleId)
  scope.current = coupleId
  useEffect(() => {
    scope.current = coupleId
    return () => {
      scope.current = ''
    }
  }, [coupleId])
  const active =
    state.scope === coupleId ? state : { scope: coupleId, older: [], done: false, error: '' }
  const messages = mergeMessages(coupleId, active.older, latest)
  return {
    messages,
    busy,
    error: active.error,
    hasMore: !demo && !active.done && messages.length > 0,
    async loadOlder() {
      if (lock.current || demo || active.done || !messages.length) return
      lock.current = true
      setBusy(true)
      const first = messages[0]
      try {
        const rows = await fetchPage(coupleId, first)
        if (scope.current === coupleId)
          setState((old) => ({
            scope: coupleId,
            older: mergeMessages(coupleId, old.scope === coupleId ? old.older : [], rows),
            done: rows.length < 50,
            error: '',
          }))
      } catch (error) {
        if (scope.current === coupleId)
          setState((old) => ({ ...old, scope: coupleId, error: errorText(error) }))
      } finally {
        lock.current = false
        setBusy(false)
      }
    },
  }
}
