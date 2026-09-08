import type { EventCategory, MemoryInput, Photo } from './types'
export const eventCategories: { value: EventCategory; label: string }[] = [
  { value: 'other', label: '日常小事' },
  { value: 'anniversary', label: '纪念日' },
  { value: 'date', label: '约会' },
  { value: 'travel', label: '旅行' },
  { value: 'birthday', label: '生日' },
]
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
  return {
    occurred_on,
    story,
    event_id: value.event_id || null,
    message_id: value.message_id || null,
  }
}
export function memoryDateLabel(photo: Photo) {
  return photo.occurred_on ? photo.occurred_on.replaceAll('-', '.') : null
}
export function sortedMemories(photos: Photo[]) {
  return [...photos].sort(
    (a, b) =>
      (b.occurred_on || b.created_at.slice(0, 10)).localeCompare(
        a.occurred_on || a.created_at.slice(0, 10),
      ) ||
      b.created_at.localeCompare(a.created_at) ||
      b.id.localeCompare(a.id),
  )
}
