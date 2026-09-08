import type { Message } from './types'
export function mergeMessages(coupleId: string, ...lists: Message[][]): Message[] {
  const rows = new Map<string, Message>()
  for (const list of lists)
    for (const row of list) if (row.couple_id === coupleId) rows.set(row.id, row)
  return [...rows.values()].sort(
    (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  )
}
