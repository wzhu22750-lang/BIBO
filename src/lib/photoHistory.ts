import type { Photo } from './types'
export type PhotoCursor = Pick<Photo, 'id' | 'created_at'>
export type PhotoPage = { photos: Photo[]; hasMore: boolean }
export function photoPage(rows: Photo[]): PhotoPage {
  return { photos: rows.slice(0, 30), hasMore: rows.length > 30 }
}
