import type { EventCategory, MemoryInput, Photo } from './types'
export const eventCategories: { value: EventCategory; label: string }[] = [
  { value: 'other', label: '日常小事' },
  { value: 'anniversary', label: '纪念日' },
  { value: 'date', label: '约会' },
  { value: 'travel', label: '旅行' },
  { value: 'birthday', label: '生日' },
]
export const DEFAULT_PHOTO_ART = 'icon:heart'
export function memoryInput(value: Partial<MemoryInput> = {}): MemoryInput {
  const occurred_on = value.occurred_on || null
  if (occurred_on) {
    const parsed = new Date(`${occurred_on}T00:00:00Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(occurred_on) ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== occurred_on ||
      occurred_on < '1900-01-01'
    )
      throw new Error('请选择有效的回忆日期（1900 年起）')
  }
  const story = (value.story || '').trim()
  if (Array.from(story).length > 2000) throw new Error('回忆文字最多 2000 字')
  const emoji = (value.emoji || DEFAULT_PHOTO_ART).trim()
  if (Array.from(emoji).length < 1 || Array.from(emoji).length > 64) throw new Error('照片图标无效')
  return {
    occurred_on,
    story,
    event_id: value.event_id || null,
    message_id: value.message_id || null,
    emoji,
  }
}
export function memoryDateLabel(photo: Photo) {
  return photo.occurred_on ? photo.occurred_on.replaceAll('-', '.') : null
}
// 回忆时间：优先发生日期，缺失时回落到上传日期（UTC），与 photo_history RPC 保持一致。
export type MemoryOrder = 'desc' | 'asc'
export function memoryDateOf(photo: Pick<Photo, 'occurred_on' | 'created_at'>) {
  return photo.occurred_on || photo.created_at.slice(0, 10)
}
export function sortedMemories(photos: Photo[], order: MemoryOrder = 'desc') {
  const ordered = [...photos].sort(
    (a, b) =>
      memoryDateOf(b).localeCompare(memoryDateOf(a)) ||
      b.created_at.localeCompare(a.created_at) ||
      b.id.localeCompare(a.id),
  )
  return order === 'asc' ? ordered.reverse() : ordered
}
