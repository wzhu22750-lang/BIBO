import type { Photo } from './types'
import { errorText } from './supabase'
export interface PhotoDeletionStore {
  read(id: string, coupleId: string, userId: string): Promise<Photo | null>
  removeFile(path: string): Promise<void>
  fileExists(path: string): Promise<boolean>
  removeRow(id: string, coupleId: string, userId: string): Promise<string>
}
// Storage and Postgres cannot share a transaction. Keep metadata until file absence is confirmed.
export async function deleteOwnedPhoto(
  store: PhotoDeletionStore,
  id: string,
  coupleId: string,
  userId: string,
) {
  const photo = await store.read(id, coupleId, userId)
  if (!photo || photo.id !== id || photo.couple_id !== coupleId || photo.uploaded_by !== userId)
    throw new Error('回忆不存在或当前账号无权删除，请刷新确认')
  if (!photo.path.startsWith(`${coupleId}/${userId}/`) || photo.path.split('/').length !== 3)
    throw new Error('照片路径与上传者不匹配，未删除任何文件')
  await store.removeFile(photo.path)
  if (await store.fileExists(photo.path))
    throw new Error('照片文件仍存在，尚未删除回忆记录，请重试')
  try {
    const removed = await store.removeRow(id, coupleId, userId)
    if (removed !== id) throw new Error('删除未返回匹配的回忆记录')
  } catch (error) {
    throw new Error(
      `照片文件已清理，但回忆记录删除未确认：${errorText(error)}。请保留当前页面并重试；不会重新上传照片。`,
    )
  }
  return photo
}
