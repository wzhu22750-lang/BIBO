import type { Page } from './types'
const pages: Page[] = ['home', 'chat', 'events', 'photos', 'focus', 'wardrobe', 'settings']
export type ReferenceKind = 'message' | 'event'
export type WardrobeViewMode = 'split' | 'drawer' | 'qa'
export type Route = {
  page: Page
  referenceId?: string
  wardrobeMode?: WardrobeViewMode
}
export function validReferenceId(id: string) {
  return /^[A-Za-z0-9_-]{1,80}$/.test(id)
}
export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const page = pages.includes(path as Page) ? (path as Page) : 'home'
  const search = new URLSearchParams(query)
  const key = page === 'chat' ? 'message' : page === 'events' ? 'event' : null
  const id = key ? search.get(key) : null
  const modeParam = search.get('mode')
  const wardrobeMode: WardrobeViewMode | undefined =
    page === 'wardrobe' && (modeParam === 'split' || modeParam === 'drawer' || modeParam === 'qa')
      ? modeParam
      : undefined
  return {
    page,
    ...(id && validReferenceId(id) ? { referenceId: id } : {}),
    ...(wardrobeMode ? { wardrobeMode } : {}),
  }
}
export function referenceLink(kind: ReferenceKind, id: string) {
  if (!validReferenceId(id)) throw new Error('关联记录 ID 无效')
  return `#${kind === 'message' ? 'chat' : 'events'}?${kind}=${encodeURIComponent(id)}`
}
