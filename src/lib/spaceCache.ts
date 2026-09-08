import { AVATAR_IDS, type Space } from './types'
const PREFIX = 'bibo-space-cache-v1:'
const TTL = 24 * 60 * 60 * 1000
const MAX_BYTES = 2_000_000
export type CachedSpace = { schema: 1; userId: string; savedAt: number; space: Space }
const key = (id: string) => PREFIX + id
const preference = (id: string) => PREFIX + 'enabled:' + id
export function cacheEnabled(userId: string) {
  try {
    return localStorage.getItem(preference(userId)) === 'true'
  } catch {
    return false
  }
}
export function clearSpaceCache(userId: string) {
  localStorage.removeItem(key(userId))
}
export function setCacheEnabled(userId: string, enabled: boolean) {
  localStorage.setItem(preference(userId), String(enabled))
  if (!enabled) clearSpaceCache(userId)
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
const text = (v: unknown) => typeof v === 'string'
const date = (v: unknown) => text(v) && Number.isFinite(Date.parse(v as string))
function validSpace(value: unknown, userId: string): value is Space {
  if (
    !object(value) ||
    !object(value.me) ||
    value.me.id !== userId ||
    !text(value.me.name) ||
    !AVATAR_IDS.includes(value.me.avatar as never)
  )
    return false
  if (
    !object(value.couple) ||
    !text(value.couple.id) ||
    !text(value.couple.name) ||
    !date(value.couple.together_since)
  )
    return false
  if (
    value.partner !== null &&
    (!object(value.partner) ||
      !text(value.partner.id) ||
      !text(value.partner.name) ||
      !AVATAR_IDS.includes(value.partner.avatar as never))
  )
    return false
  const cid = value.couple.id
  const rows = (name: string, max: number, valid: (row: Record<string, unknown>) => boolean) =>
    Array.isArray(value[name]) &&
    value[name].length <= max &&
    value[name].every((row: unknown) => object(row) && row.couple_id === cid && valid(row))
  if (
    !rows(
      'messages',
      200,
      (r) =>
        text(r.id) &&
        (r.sender_id == null || text(r.sender_id)) &&
        text(r.content) &&
        date(r.created_at),
    )
  )
    return false
  if (
    !rows(
      'events',
      500,
      (r) =>
        text(r.id) &&
        text(r.title) &&
        date(r.target_at) &&
        ['anniversary', 'countdown'].includes(String(r.kind)) &&
        typeof r.yearly === 'boolean' &&
        text(r.emoji) &&
        (r.created_by == null || text(r.created_by)),
    )
  )
    return false
  if (
    !rows(
      'photos',
      200,
      (r) =>
        text(r.id) &&
        text(r.path) &&
        !String(r.path).startsWith('data:') &&
        (r.uploaded_by == null || text(r.uploaded_by)) &&
        text(r.caption) &&
        date(r.created_at) &&
        (r.story === undefined || text(r.story)) &&
        (r.occurred_on == null || date(r.occurred_on)) &&
        (r.event_id == null || text(r.event_id)) &&
        (r.message_id == null || text(r.message_id)),
    )
  )
    return false
  return (
    rows(
      'pings',
      50,
      (r) =>
        text(r.id) &&
        (r.sender_id == null || text(r.sender_id)) &&
        text(r.kind) &&
        date(r.created_at),
    ) &&
    rows(
      'focus',
      2,
      (r) =>
        text(r.user_id) &&
        text(r.activity) &&
        date(r.ends_at) &&
        typeof r.allow_reminders === 'boolean',
    )
  )
}
export function encodeSpaceCache(userId: string, space: Space, now = Date.now()): string {
  if (space.me.id !== userId || !space.couple) throw new Error('不能缓存其他账号或未绑定空间')
  const snapshot: Space = {
    me: { id: space.me.id, name: space.me.name, avatar: space.me.avatar },
    partner: space.partner
      ? { id: space.partner.id, name: space.partner.name, avatar: space.partner.avatar }
      : null,
    couple: {
      id: space.couple.id,
      name: space.couple.name,
      together_since: space.couple.together_since,
    },
    messages: space.messages
      .slice(-200)
      .map(({ id, couple_id, sender_id, content, created_at }) => ({
        id,
        couple_id,
        sender_id,
        content,
        created_at,
      })),
    events: space.events
      .slice(0, 500)
      .map(({ id, couple_id, title, target_at, kind, yearly, emoji, created_by, category }) => ({
        id,
        couple_id,
        title,
        target_at,
        kind,
        yearly,
        emoji,
        created_by,
        category,
      })),
    photos: space.photos
      .slice(0, 200)
      .map(
        ({
          id,
          couple_id,
          uploaded_by,
          path,
          caption,
          created_at,
          occurred_on,
          story,
          event_id,
          message_id,
        }) => ({
          id,
          couple_id,
          uploaded_by,
          path,
          caption,
          created_at,
          occurred_on,
          story,
          event_id,
          message_id,
        }),
      ),
    pings: space.pings.slice(0, 50).map(({ id, couple_id, sender_id, kind, created_at }) => ({
      id,
      couple_id,
      sender_id,
      kind,
      created_at,
    })),
    focus: space.focus
      .slice(0, 2)
      .map(({ user_id, couple_id, activity, ends_at, allow_reminders }) => ({
        user_id,
        couple_id,
        activity,
        ends_at,
        allow_reminders,
      })),
  }
  if (!validSpace(snapshot, userId)) throw new Error('空间数据格式不适合缓存')
  const encoded = JSON.stringify({ schema: 1, userId, savedAt: now, space: snapshot })
  if (new Blob([encoded]).size > MAX_BYTES) throw new Error('本机快照超过 2 MB，未写入缓存')
  return encoded
}
export function decodeSpaceCache(
  raw: string,
  userId: string,
  now = Date.now(),
): CachedSpace | null {
  try {
    if (raw.length > MAX_BYTES) return null
    const value = JSON.parse(raw)
    if (
      !object(value) ||
      value.schema !== 1 ||
      value.userId !== userId ||
      typeof value.savedAt !== 'number' ||
      !Number.isFinite(value.savedAt) ||
      value.savedAt > now + 60000 ||
      now - value.savedAt > TTL ||
      !validSpace(value.space, userId)
    )
      return null
    // Re-project even validated persisted data: don't revive a injected/expired signed URL.
    return JSON.parse(encodeSpaceCache(userId, value.space, value.savedAt)) as CachedSpace
  } catch {
    return null
  }
}
export function readSpaceCache(userId: string): CachedSpace | null {
  if (!cacheEnabled(userId)) return null
  try {
    const raw = localStorage.getItem(key(userId))
    return raw ? decodeSpaceCache(raw, userId) : null
  } catch {
    return null
  }
}
export function writeSpaceCache(userId: string, space: Space) {
  if (!cacheEnabled(userId)) return
  if (!space.couple) {
    clearSpaceCache(userId)
    return
  }
  localStorage.setItem(key(userId), encodeSpaceCache(userId, space))
}
export function networkFailure(error: unknown) {
  if (!object(error)) return false
  const status = Number(error.status)
  if (error.code || status === 401 || status === 403) return false
  const message = String(error.message || '')
  return /failed to fetch|networkerror|network request failed|load failed|fetch failed|network connection|timeout|timed out/i.test(
    message,
  )
}
