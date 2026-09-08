import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteOwnedPhoto, type PhotoDeletionStore } from './photoDeletion'
import type { Photo } from './types'
const photo: Photo = {
  id: 'p',
  couple_id: 'c',
  uploaded_by: 'u',
  path: 'c/u/photo.jpg',
  caption: 'keep',
  created_at: '2026-09-08T00:00:00Z',
}
let store: PhotoDeletionStore
beforeEach(() => {
  store = {
    read: vi.fn().mockResolvedValue(photo),
    removeFile: vi.fn().mockResolvedValue(undefined),
    fileExists: vi.fn().mockResolvedValue(false),
    removeRow: vi.fn().mockResolvedValue('p'),
  }
})
describe('two-system photo deletion', () => {
  it('checks authoritative ownership, confirms file absence, then deletes the matching row', async () => {
    const calls: string[] = []
    store.removeFile = async () => {
      calls.push('file')
    }
    store.fileExists = async () => {
      calls.push('verify')
      return false
    }
    store.removeRow = async () => {
      calls.push('row')
      return 'p'
    }
    expect(await deleteOwnedPhoto(store, 'p', 'c', 'u')).toEqual(photo)
    expect(calls).toEqual(['file', 'verify', 'row'])
  })
  it('never removes a file for another user or an unexpected path', async () => {
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'other')).rejects.toThrow('无权')
    expect(store.removeFile).not.toHaveBeenCalled()
    store.read = vi.fn().mockResolvedValue({ ...photo, path: 'another/private.jpg' })
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('路径')
  })
  it('retains metadata on failed or unconfirmed storage deletion', async () => {
    store.removeFile = vi.fn().mockRejectedValue(new Error('offline'))
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('offline')
    expect(store.removeRow).not.toHaveBeenCalled()
    store.removeFile = vi.fn().mockResolvedValue(undefined)
    store.fileExists = vi.fn().mockResolvedValue(true)
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('仍存在')
    expect(store.removeRow).not.toHaveBeenCalled()
  })
  it('explains partial failure and can retry when the file is already absent', async () => {
    store.removeRow = vi
      .fn()
      .mockRejectedValue({ message: 'denied', code: '42501', details: 'RLS' })
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('照片文件已清理')
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('42501')
    store.removeRow = vi.fn().mockResolvedValue('p')
    expect(await deleteOwnedPhoto(store, 'p', 'c', 'u')).toEqual(photo)
  })
  it('does not report mismatched or missing database confirmation as success', async () => {
    store.removeRow = vi.fn().mockResolvedValue('wrong')
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('未返回匹配')
    store.read = vi.fn().mockResolvedValue(null)
    await expect(deleteOwnedPhoto(store, 'p', 'c', 'u')).rejects.toThrow('不存在')
  })
})
