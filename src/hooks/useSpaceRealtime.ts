import { useEffect, useRef } from 'react'
import { supabase, errorText } from '../lib/supabase'
import { DEMO_KEY, readDemo } from '../lib/demo'
import { createReloadScheduler } from '../lib/reloadScheduler'
import type { Space } from '../lib/types'
export function useSpaceRealtime({
  demo,
  userId,
  coupleId,
  reload,
  onLocal,
  onPing,
  onConnection,
}: {
  demo: boolean
  userId: string | undefined
  coupleId: string | undefined
  reload: () => Promise<void>
  onLocal: (space: Space) => void
  onPing: (payload: unknown) => void
  onConnection: (value: string) => void
}) {
  const callbacks = useRef({ onLocal, onPing, onConnection })
  callbacks.current = { onLocal, onPing, onConnection }
  useEffect(() => {
    if (demo) {
      const sync = (event: StorageEvent) => {
        if (event.key === DEMO_KEY || event.key === null) callbacks.current.onLocal(readDemo())
      }
      window.addEventListener('storage', sync)
      return () => window.removeEventListener('storage', sync)
    }
    if (!supabase || !userId) return
    let disposed = false
    const scheduler = createReloadScheduler(reload, (error) =>
      callbacks.current.onConnection(`同步异常 · ${errorText(error)}`),
    )
    const channel = supabase.channel(`space-${userId}-${coupleId || 'pending'}`)
    const schedule = () => {
      if (!disposed) scheduler.schedule()
    }
    for (const table of [
      'messages',
      'events',
      'photos',
      'focus_sessions',
      'couple_members',
      'couples',
      'profiles',
      'daily_tasks',
      'daily_task_completions',
    ]) {
      // Keep DELETE and membership discovery unfiltered; RLS still gates delivery server-side.
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    }
    if (coupleId)
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pings', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (!disposed) callbacks.current.onPing(payload.new)
        },
      )
    channel.subscribe((status) => {
      if (disposed) return
      callbacks.current.onConnection(
        !navigator.onLine
          ? '离线 · 等待网络恢复'
          : status === 'SUBSCRIBED'
            ? '实时已连接'
            : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED'
              ? '连接中断 · 自动重试'
              : '连接中',
      )
      if (status === 'SUBSCRIBED') schedule()
    })
    const refresh = () => {
      if (!document.hidden && navigator.onLine) schedule()
    }
    const online = () => {
      callbacks.current.onConnection('网络恢复 · 正在同步')
      refresh()
    }
    const offline = () => callbacks.current.onConnection('离线 · 待发送内容保留在本机')
    const interval = setInterval(refresh, 60000)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      disposed = true
      scheduler.dispose()
      clearInterval(interval)
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
      document.removeEventListener('visibilitychange', refresh)
      void supabase!.removeChannel(channel).catch(() => {})
    }
  }, [demo, userId, coupleId, reload])
}
