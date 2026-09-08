import { mergePings } from './pingHistory'
import type { Space } from './types'
const future = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}
export const DEMO_KEY = 'bibu-demo-v1'
export function makeDemo(): Space {
  const now = Date.now()
  return {
    me: { id: 'demo-me', name: '小橘', avatar: 'cat' },
    partner: { id: 'demo-you', name: '小桃', avatar: 'bunny' },
    couple: {
      id: 'demo',
      name: '小橘 & 小桃的小宇宙',
      together_since: '2025-07-07',
      greeting_title: '今天也喜欢你，多一点',
      greeting_subtitle: '生活不是每天都浪漫，但每天都有你。',
    },
    messages: [
      {
        id: '1',
        couple_id: 'demo',
        sender_id: 'demo-you',
        content: '发现一家超好吃的店，下次一起去！🍜',
        created_at: new Date(now - 3600000).toISOString(),
      },
      {
        id: '2',
        couple_id: 'demo',
        sender_id: 'demo-me',
        content: '收到！已经加入我们的约会清单 📝',
        created_at: new Date(now - 3400000).toISOString(),
      },
      {
        id: '3',
        couple_id: 'demo',
        sender_id: 'demo-you',
        content: '今天也有在好好想你哦 (｡･ω･｡)ﾉ♡',
        created_at: new Date(now - 300000).toISOString(),
      },
    ],
    events: [
      {
        id: 'e1',
        couple_id: 'demo',
        title: '一起去看海',
        target_at: future(12),
        kind: 'countdown',
        yearly: false,
        emoji: '🌊',
        category: 'travel',
        created_by: 'demo-me',
      },
      {
        id: 'e2',
        couple_id: 'demo',
        title: '小桃的生日',
        target_at: future(26),
        kind: 'anniversary',
        yearly: true,
        emoji: '🎂',
        category: 'birthday',
        created_by: 'demo-you',
      },
      {
        id: 'e3',
        couple_id: 'demo',
        title: '下一次见面',
        target_at: future(5),
        kind: 'countdown',
        yearly: false,
        emoji: '🚃',
        category: 'date',
        created_by: 'demo-me',
      },
    ],
    photos: [
      {
        id: 'p1',
        couple_id: 'demo',
        uploaded_by: 'demo-me',
        path: '/demo/lake.jpg',
        url: '/demo/lake.jpg',
        caption: '把好天气存起来 ☀️',
        created_at: new Date(now - DAY * 2).toISOString(),
      },
      {
        id: 'p2',
        couple_id: 'demo',
        uploaded_by: 'demo-you',
        path: '/demo/date.jpg',
        url: '/demo/date.jpg',
        caption: '约会的第 N 家小店',
        created_at: new Date(now - DAY * 4).toISOString(),
      },
      {
        id: 'p3',
        couple_id: 'demo',
        uploaded_by: 'demo-me',
        path: '/demo/mountain.jpg',
        url: '/demo/mountain.jpg',
        caption: '和你一起，慢慢走',
        created_at: new Date(now - DAY * 7).toISOString(),
      },
    ],
    pings: [],
    focus: [],
  }
}
const DAY = 86400000
export function readDemo(): Space {
  try {
    const saved = localStorage.getItem(DEMO_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      if (
        data.me &&
        data.couple &&
        Array.isArray(data.messages) &&
        Array.isArray(data.photos) &&
        Array.isArray(data.events) &&
        Array.isArray(data.focus)
      )
        return {
          ...data,
          pings: mergePings(data.couple.id, Array.isArray(data.pings) ? data.pings : []),
        }
    }
  } catch {
    /* Invalid local demo data resets safely. */
  }
  return makeDemo()
}
export function saveDemo(space: Space) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(space))
}
