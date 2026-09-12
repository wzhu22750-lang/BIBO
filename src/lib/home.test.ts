import { describe, expect, it } from 'vitest'
import { dailyMemories, dailyPrompt, upcomingEvents } from './home'
import { lovePings, pingFeedback } from './ping'
import type { Photo, EventItem } from './types'
const now = new Date(2026, 8, 8, 12)
describe('daily home', () => {
  it('keeps the prompt stable throughout the local day and changes tomorrow', () => {
    expect(dailyPrompt('couple', now)).toEqual(dailyPrompt('couple', new Date(2026, 8, 8, 23)))
    expect(dailyPrompt('couple', now)).not.toEqual(dailyPrompt('couple', new Date(2026, 8, 9)))
  })
  it('draws three distinct random memories per local day, stable within the day', () => {
    const photos: Photo[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i).padStart(2, '0'),
      couple_id: 'c',
      uploaded_by: 'u',
      path: '',
      caption: '',
      created_at: now.toISOString(),
    }))
    const original = [...photos]
    const result = dailyMemories(photos, 'c', now)
    expect(result).toHaveLength(3)
    expect(new Set(result.map((p) => p.id)).size).toBe(3)
    // 同一天多次渲染（哪怕已到深夜）拿到同一批回忆
    expect(result).toEqual(dailyMemories(photos, 'c', new Date(2026, 8, 8, 23, 59, 59)))
    expect(result).toEqual(dailyMemories([...photos].reverse(), 'c', now))
    expect(photos).toEqual(original)
    // 每天随机抽，跨天会换一批，而不是固定轮转相邻三张
    const week = Array.from({ length: 7 }, (_, d) =>
      dailyMemories(photos, 'c', new Date(2026, 8, 8 + d)),
    )
    expect(new Set(week.map((day) => day.map((p) => p.id).join(','))).size).toBeGreaterThan(1)
    expect(new Set(week.flat().map((p) => p.id)).size).toBeGreaterThan(3)
    expect(dailyMemories([], 'c', now)).toEqual([])
    expect(dailyMemories(photos.slice(0, 1), 'c', now)).toHaveLength(1)
  })
  it('excludes past one-time events but retains today and annual recurrences', () => {
    const event = (id: string, target_at: string, yearly = false): EventItem => ({
      id,
      target_at,
      yearly,
      couple_id: 'c',
      created_by: 'u',
      title: id,
      kind: 'anniversary',
      emoji: 'heart',
    })
    expect(
      upcomingEvents(
        {
          events: [
            event('past', '2025-09-07T00:00:00'),
            event('today', '2026-09-08T00:00:00'),
            event('yearly', '2025-09-09T00:00:00', true),
          ],
        },
        now,
      ).map((e) => e.id),
    ).toEqual(['today', 'yearly'])
  })
})
describe('semantic feedback', () => {
  it('has distinct patterns for six love pings and safe legacy fallback', () => {
    expect(new Set(lovePings.map((p) => p.kind)).size).toBe(6)
    expect(new Set(lovePings.map((p) => p.notes.join(','))).size).toBe(6)
    for (const ping of lovePings) expect(pingFeedback(ping.kind)).toEqual(ping)
    expect(pingFeedback('older-client')).toEqual(lovePings[0])
  })
})
