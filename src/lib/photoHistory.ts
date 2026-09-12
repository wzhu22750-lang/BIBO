import type { Photo } from './types'
// 线上 photo_history RPC 还是旧签名（迁移未应用）时抛出，调用方退回本地快照渲染。
export class PhotoHistoryUnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PhotoHistoryUnsupportedError'
  }
}
export type PhotoCursor = Pick<Photo, 'id' | 'created_at' | 'occurred_on'>
export type PhotoPage = { photos: Photo[]; hasMore: boolean }
export function photoPage(rows: Photo[]): PhotoPage {
  return { photos: rows.slice(0, 30), hasMore: rows.length > 30 }
}
export function photoCursor(photo: Photo): PhotoCursor {
  return { id: photo.id, created_at: photo.created_at, occurred_on: photo.occurred_on || null }
}
