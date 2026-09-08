import type { Photo, Space } from './types'
// Apply only the server-confirmed row and retain the existing short-lived image URL.
export function applySavedMemory(space: Space, row: Photo): Space {
  if (space.couple?.id !== row.couple_id) return space
  return {
    ...space,
    photos: space.photos.map((photo) =>
      photo.id === row.id
        ? {
            ...row,
            url: photo.path === row.path ? photo.url : undefined,
          }
        : photo,
    ),
  }
}
