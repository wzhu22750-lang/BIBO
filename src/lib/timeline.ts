import type { Photo, Space } from './types'
import { dayNumber } from './dates'
export type TimelinePeriod = 'all' | 'past' | 'today' | 'future'
export function timelineEntries(
  space: Pick<Space, 'events' | 'photos'>,
  period: TimelinePeriod,
  now = new Date(),
) {
  const entries: {
    id: string
    at: Date
    title: string
    art?: string
    photo?: Photo
    uploadDate?: boolean
  }[] = [
    ...space.events.map((e) => ({
      id: `event:${e.id}`,
      at: new Date(e.target_at),
      title: e.title,
      art: e.emoji,
    })),
    ...space.photos.map((p) => ({
      id: `photo:${p.id}`,
      at: new Date(p.occurred_on ? `${p.occurred_on}T00:00:00` : p.created_at),
      title: p.caption,
      photo: p,
      uploadDate: !p.occurred_on,
    })),
  ]
  return entries
    .filter((entry) => {
      if (!Number.isFinite(entry.at.getTime())) return false
      const delta = dayNumber(entry.at) - dayNumber(now)
      return (
        period === 'all' ||
        (period === 'past' ? delta < 0 : period === 'today' ? delta === 0 : delta > 0)
      )
    })
    .sort((a, b) => b.at.getTime() - a.at.getTime() || a.id.localeCompare(b.id))
}
