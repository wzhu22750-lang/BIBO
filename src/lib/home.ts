import { daysUntil, dayNumber, sortedEvents } from './dates'
import type { Page, Photo, Space } from './types'
const prompts: { text: string; page: Page; action: string }[] = [
  { text: '今天哪一个瞬间，让你想起了 TA？', page: 'chat', action: '告诉 TA' },
  { text: '存下一张平凡的照片，也是在收藏你们。', page: 'photos', action: '收藏今天' },
  { text: '下一次见面，你最想一起做什么？', page: 'events', action: '留个小期待' },
  { text: '今天收到的温柔，也分给 TA 一点吧。', page: 'chat', action: '留一句话' },
  { text: '翻到一张旧照片，还记得那天的心情吗？', page: 'photos', action: '看看回忆' },
]
function seed(value: string) {
  return Array.from(value).reduce(
    (hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0,
    0,
  )
}
// Stable for the couple and local calendar day, not random on every render.
export function dailyPrompt(coupleId: string, now = new Date()) {
  return prompts[(seed(coupleId) + dayNumber(now)) % prompts.length]
}
export function dailyMemories(photos: Photo[], coupleId: string, now = new Date()) {
  const ordered = [...photos].sort((a, b) => a.id.localeCompare(b.id))
  if (!ordered.length) return []
  const start = (seed(coupleId) + dayNumber(now)) % ordered.length
  return [...ordered.slice(start), ...ordered.slice(0, start)].slice(0, 3)
}
export function upcomingEvents(space: Pick<Space, 'events'>, now = new Date()) {
  return sortedEvents(
    space.events.filter((event) => daysUntil(event.target_at, event.yearly, now) >= 0),
    now,
  ).slice(0, 3)
}
