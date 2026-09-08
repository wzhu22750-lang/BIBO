import type { Space } from './types'
export type ExportedSpace = {
  schema: 1
  exported_at: string
  scope: 'currently_loaded'
  notice: string
  profile: { name: string; avatar: string }
  partner: { name: string; avatar: string } | null
  couple: { name: string; together_since: string } | null
  messages: { content: string; created_at: string; author: 'me' | 'partner' | 'deleted_player' }[]
  events: {
    title: string
    target_at: string
    kind: string
    yearly: boolean
    emoji: string
    category?: string
  }[]
  memories: {
    caption: string
    occurred_on: string | null
    story: string
    created_at: string
    event_title: string | null
    has_photo: boolean
  }[]
  pings: { kind: string; created_at: string; author: 'me' | 'partner' | 'deleted_player' }[]
}
export function exportSpace(space: Space, now = new Date()): ExportedSpace {
  const author = (id: string | null): 'me' | 'partner' | 'deleted_player' =>
    id === null ? 'deleted_player' : id === space.me.id ? 'me' : 'partner'
  const eventById = new Map(space.events.map((e) => [e.id, e.title]))
  return {
    schema: 1,
    exported_at: now.toISOString(),
    scope: 'currently_loaded',
    notice:
      '这是当前设备已加载的空间数据导出；不包含完整分页历史、图片文件、签名 URL、登录凭据或管理员数据。',
    profile: { name: space.me.name, avatar: space.me.avatar },
    partner: space.partner ? { name: space.partner.name, avatar: space.partner.avatar } : null,
    couple: space.couple
      ? { name: space.couple.name, together_since: space.couple.together_since }
      : null,
    messages: space.messages.map((m) => ({
      content: m.content,
      created_at: m.created_at,
      author: author(m.sender_id),
    })),
    events: space.events.map((e) => ({
      title: e.title,
      target_at: e.target_at,
      kind: e.kind,
      yearly: e.yearly,
      emoji: e.emoji,
      category: e.category,
    })),
    memories: space.photos.map((p) => ({
      caption: p.caption,
      occurred_on: p.occurred_on || null,
      story: p.story || '',
      created_at: p.created_at,
      event_title: p.event_id ? eventById.get(p.event_id) || null : null,
      has_photo: true,
    })),
    pings: space.pings.map((p) => ({
      kind: p.kind,
      created_at: p.created_at,
      author: author(p.sender_id),
    })),
  }
}
export function exportFilename(now = new Date()) {
  return `bibo-space-${now.toISOString().slice(0, 10)}.json`
}
export function downloadSpace(
  space: Space,
  now = new Date(),
  download: (blob: Blob, name: string) => void = downloadBlob,
) {
  const data = JSON.stringify(exportSpace(space, now), null, 2)
  download(new Blob([data], { type: 'application/json' }), exportFilename(now))
  return data
}
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
