import type { Page } from './types'
const pages: Page[] = ['home', 'chat', 'events', 'photos', 'focus', 'settings']
export type ReferenceKind = 'message' | 'event'
export type Route = { page: Page; referenceId?: string }
export function validReferenceId(id: string) {
  return /^[A-Za-z0-9_-]{1,80}$/.test(id)
}
export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const page = pages.includes(path as Page) ? (path as Page) : 'home'
  const key = page === 'chat' ? 'message' : page === 'events' ? 'event' : null
  const id = key ? new URLSearchParams(query).get(key) : null
  return { page, ...(id && validReferenceId(id) ? { referenceId: id } : {}) }
}
export function referenceLink(kind: ReferenceKind, id: string) {
  if (!validReferenceId(id)) throw new Error('关联记录 ID 无效')
  return `#${kind === 'message' ? 'chat' : 'events'}?${kind}=${encodeURIComponent(id)}`
}
