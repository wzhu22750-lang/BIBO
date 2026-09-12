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
// Deterministic PRNG (mulberry32) so the same couple + local day always draws
// the same three memories, while the pick looks random and changes every day.
function draw(seedValue: number) {
  let state = seedValue >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function dailyPrompt(coupleId: string, now = new Date()) {
  return prompts[(seed(coupleId) + dayNumber(now)) % prompts.length]
}
// 每天随机抽三张回忆：用 (coupleId, 自然日) 做种子的 Fisher–Yates 洗牌，
// 保证同一天内多次渲染结果一致，跨天则换一批。
export function dailyMemories(photos: Photo[], coupleId: string, now = new Date()) {
  const pool = [...photos].sort((a, b) => a.id.localeCompare(b.id))
  if (!pool.length) return []
  const random = draw(seed(`${coupleId}:${dayNumber(now)}`))
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, 3)
}
export function upcomingEvents(space: Pick<Space, 'events'>, now = new Date()) {
  return sortedEvents(
    space.events.filter((event) => daysUntil(event.target_at, event.yearly, now) >= 0),
    now,
  ).slice(0, 3)
}
