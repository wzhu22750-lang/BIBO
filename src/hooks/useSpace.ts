import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import * as api from '../lib/api'
import { db, errorText, must, supabase } from '../lib/supabase'
import { DEMO_KEY, readDemo, saveDemo } from '../lib/demo'
import { playFeedback } from '../lib/notifications'
import type { AvatarType, EventInput, Ping, Space } from '../lib/types'

export function useSpace(session: Session | null, demo: boolean) {
  const [space, setSpace] = useState<Space | null>(() => (demo ? readDemo() : null))
  const [loading, setLoading] = useState(!demo)
  const [error, setError] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [connection, setConnection] = useState(demo ? '本地演示' : '连接中')
  const [ping, setPing] = useState<{ name: string; kind: string } | null>(null)
  const version = useRef(0)
  const stateRef = useRef(space)
  stateRef.current = space
  const userId = session?.user.id
  const reload = useCallback(async () => {
    if (demo || !userId) return
    const current = ++version.current
    try {
      const data = await api.loadSpace(userId)
      if (current === version.current) {
        setSpace(data)
        setError('')
      }
    } catch (e) {
      if (current === version.current) setError(errorText(e))
    } finally {
      if (current === version.current) setLoading(false)
    }
  }, [demo, userId])
  useEffect(() => {
    void reload()
    return () => {
      version.current++
    }
  }, [reload])
  const cid = space?.couple?.id
  useEffect(() => {
    if (demo) {
      const sync = (event: StorageEvent) => {
        if (event.key === DEMO_KEY) setSpace(readDemo())
      }
      window.addEventListener('storage', sync)
      return () => window.removeEventListener('storage', sync)
    }
    if (!supabase || !userId) return
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void reload(), 180)
    }
    const channel = supabase.channel(`space-${userId}-${cid || 'pending'}`)
    const tables = [
      'messages',
      'events',
      'photos',
      'focus_sessions',
      'couple_members',
      'couples',
      'profiles',
    ]
    for (const table of tables)
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    if (cid)
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pings', filter: `couple_id=eq.${cid}` },
        (payload) => {
          const incoming = payload.new as Ping
          if (incoming.sender_id !== userId) {
            setPing({ name: stateRef.current?.partner?.name || '另一位玩家', kind: incoming.kind })
            playFeedback()
          }
        },
      )
    channel.subscribe((status) => {
      setConnection(
        status === 'SUBSCRIBED'
          ? '实时已连接'
          : status === 'CHANNEL_ERROR' || status === 'TIMED_OUT'
            ? '连接中断 · 自动重试'
            : '连接中',
      )
      if (status === 'SUBSCRIBED') schedule()
    })
    // Recover missed changes on foreground/reconnect; refresh expiring signed URLs.
    const refresh = () => {
      if (!document.hidden) void reload()
    }
    const interval = setInterval(refresh, 60000)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
      void supabase!.removeChannel(channel)
    }
  }, [demo, userId, cid, reload])
  function local(update: (old: Space) => Space) {
    const next = update(stateRef.current!)
    saveDemo(next) // Do not falsely report success when localStorage quota is exceeded.
    stateRef.current = next
    setSpace(next)
  }
  async function mutate(remote: () => Promise<unknown>, update: (old: Space) => Space) {
    if (demo) local(update)
    else {
      await remote()
      await reload()
    }
  }
  const me = space?.me.id || ''
  return {
    space,
    loading,
    error,
    connection,
    ping,
    inviteCode,
    dismissPing: () => setPing(null),
    reload,
    async message(content: string) {
      const clean = content.trim()
      if (!clean || clean.length > 2000) throw new Error('消息需为 1–2000 字')
      await mutate(
        () => api.sendMessage(cid!, me, clean),
        (s) => ({
          ...s,
          messages: [
            ...s.messages,
            {
              id: crypto.randomUUID(),
              couple_id: cid!,
              sender_id: me,
              content: clean,
              created_at: new Date().toISOString(),
            },
          ],
        }),
      )
    },
    async addEvent(input: EventInput) {
      await mutate(
        () => api.addEvent(cid!, me, input),
        (s) => ({
          ...s,
          events: [
            ...s.events,
            { ...input, id: crypto.randomUUID(), couple_id: cid!, created_by: me },
          ],
        }),
      )
    },
    async deleteEvent(id: string) {
      await mutate(
        () => api.deleteEvent(id),
        (s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }),
      )
    },
    async upload(file: File, caption: string) {
      api.validatePhoto(file)
      if (demo) {
        if (file.size > 1500000)
          throw new Error('本地演示请使用小于 1.5 MB 的图片；连接 Supabase 后支持 5 MB')
        const url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        local((s) => ({
          ...s,
          photos: [
            {
              id: crypto.randomUUID(),
              couple_id: cid!,
              uploaded_by: me,
              path: url,
              url,
              caption,
              created_at: new Date().toISOString(),
            },
            ...s.photos,
          ],
        }))
      } else {
        await api.uploadPhoto(cid!, me, file, caption)
        await reload()
      }
    },
    async startFocus(activity: string, minutes: number, allow: boolean) {
      await mutate(
        () => api.setFocus(cid!, me, activity, minutes, allow),
        (s) => ({
          ...s,
          focus: [
            ...s.focus.filter((f) => f.user_id !== me),
            {
              user_id: me,
              couple_id: cid!,
              activity,
              ends_at: new Date(Date.now() + minutes * 60000).toISOString(),
              allow_reminders: allow,
            },
          ],
        }),
      )
    },
    async endFocus() {
      await mutate(
        () => api.endFocus(me),
        (s) => ({ ...s, focus: s.focus.filter((f) => f.user_id !== me) }),
      )
    },
    async sendPing(kind = '哔卟哔卟') {
      if (demo) {
        setPing({ name: '演示玩家 · ' + space!.partner!.name, kind })
        playFeedback()
      } else await api.sendPing(kind)
    },
    async save(name: string, since: string, avatar?: AvatarType) {
      await mutate(
        () => api.saveSettings(me, cid, name, since, avatar),
        (s) => ({
          ...s,
          me: { ...s.me, name, ...(avatar ? { avatar } : {}) },
          couple: s.couple ? { ...s.couple, together_since: since } : null,
        }),
      )
    },
    async updateGreeting(title: string, subtitle: string) {
      if (!cid) throw new Error('尚未绑定空间')
      await mutate(
        () => api.updateGreeting(cid, title, subtitle),
        (s) => ({
          ...s,
          couple: s.couple
            ? { ...s.couple, greeting_title: title, greeting_subtitle: subtitle }
            : null,
        }),
      )
    },
    async createSpace() {
      const code = must(await db().rpc('create_space')) as string
      setInviteCode(code)
      await reload()
      return code
    },
    async joinSpace(code: string) {
      must(await db().rpc('join_space', { invite_code: code }))
      await reload()
    },
    async refreshInvite() {
      const code = must(await db().rpc('refresh_invite')) as string
      setInviteCode(code)
      return code
    },
  }
}
export type SpaceController = ReturnType<typeof useSpace>
