import type { Ping } from './types'
export const PING_HISTORY_LIMIT = 50
export function isPing(value: unknown): value is Ping {
  if (!value || typeof value !== 'object') return false
  const p = value as Record<string, unknown>
  return (
    ['id', 'couple_id', 'kind', 'created_at'].every(
      (k) => typeof p[k] === 'string' && p[k] !== '',
    ) &&
    (p.sender_id === null || (typeof p.sender_id === 'string' && p.sender_id !== '')) &&
    Number.isFinite(Date.parse(p.created_at as string))
  )
}
// Deduplicate snapshots and live INSERTs. Scope is always explicit to avoid retaining another space.
export function mergePings(coupleId: string, ...lists: readonly unknown[][]): Ping[] {
  const rows = new Map<string, Ping>()
  for (const list of lists)
    for (const value of list) {
      if (isPing(value) && value.couple_id === coupleId) rows.set(value.id, value)
    }
  return [...rows.values()]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id.localeCompare(a.id))
    .slice(0, PING_HISTORY_LIMIT)
}
export function shouldPresentPing(incoming: Ping, known: Ping[], userId: string, now = Date.now()) {
  const age = now - Date.parse(incoming.created_at)
  return (
    incoming.sender_id !== null &&
    incoming.sender_id !== userId &&
    !known.some((p) => p.id === incoming.id) &&
    age >= -30_000 &&
    age <= 120_000
  )
}
