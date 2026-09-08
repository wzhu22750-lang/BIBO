import type { MemoryInput, Photo } from './types'
export type PhotoOutboxOperation = {
  id: string
  photoId: string
  userId: string
  coupleId: string
  file: Blob
  fileName: string
  mime: string
  caption: string
  memory: MemoryInput
  queuedAt: number
  status: 'pending' | 'blocked'
  error?: string
  attempts?: number
  nextAttemptAt?: number
}
const DB_NAME = 'bibo-photo-outbox-v1'
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('本机照片队列不可用'))
    request.onblocked = () => reject(new Error('本机照片队列被其他页面占用，请关闭旧页面后重试'))
  })
}
async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, set: (value: T) => void) => void,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode)
    let value: T
    tx.oncomplete = () => {
      db.close()
      resolve(value)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('照片未能保存到本机'))
    }
    tx.onerror = () => {}
    try {
      run(tx.objectStore('photos'), (v) => {
        value = v
      })
    } catch (error) {
      tx.abort()
      db.close()
      reject(error)
    }
  })
}
export function samePhotoScope(row: PhotoOutboxOperation, userId: string, coupleId: string) {
  return row.userId === userId && row.coupleId === coupleId
}
export function photoOperation(
  userId: string,
  coupleId: string,
  file: Blob,
  fileName: string,
  mime: string,
  caption: string,
  memory: MemoryInput,
  now = Date.now(),
): PhotoOutboxOperation {
  return {
    id: crypto.randomUUID(),
    photoId: crypto.randomUUID(),
    userId,
    coupleId,
    file,
    fileName,
    mime,
    caption,
    memory,
    queuedAt: now,
    status: 'pending',
  }
}
export function photoDue(row: PhotoOutboxOperation, now = Date.now()) {
  if (row.status !== 'pending') return false
  if (!Number.isFinite(row.nextAttemptAt)) return true
  return row.nextAttemptAt! <= now || row.nextAttemptAt! - now > 305000
}
// Blocked rows are never due and must not stall the queue behind them; the first
// pending row that is waiting on backoff stops this pass to preserve order.
// Mirrors the blocked-skip semantics of the message and event outboxes.
export function photoRowsReadyForSync(
  rows: PhotoOutboxOperation[],
  now = Date.now(),
): PhotoOutboxOperation[] {
  const ready: PhotoOutboxOperation[] = []
  for (const row of rows) {
    if (row.status === 'blocked') continue
    if (!photoDue(row, now)) break
    ready.push(row)
  }
  return ready
}
// Same retryability contract as the message/event outboxes: transport errors
// without a Postgres code and transient database classes are retried with
// backoff; schema/authorization errors (e.g. 42501) block without retry.
// PHOTO_OUTBOX_MISMATCH is not whitelisted, so it stays blocked for manual retry.
export function retryablePhotoError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code || '') : ''
  return !code || code.startsWith('08') || code === '40001' || code === '40P01' || code === '57014'
}
export function photoRetryDelay(attempt: number, id: string) {
  const n = Math.max(1, Math.min(10, Math.floor(Number.isFinite(attempt) ? attempt : 1)))
  const jitter = Array.from(id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 5000
  return Math.min(300000, 15000 * 2 ** (n - 1) + jitter)
}
export function photoFailure(
  row: PhotoOutboxOperation,
  error: string,
  retryable: boolean,
  now = Date.now(),
): PhotoOutboxOperation {
  const attempts = Math.min(
    1000,
    (Number.isFinite(row.attempts) ? Math.max(0, row.attempts!) : 0) + 1,
  )
  return {
    ...row,
    attempts,
    error,
    status: retryable ? 'pending' : 'blocked',
    nextAttemptAt: retryable ? now + photoRetryDelay(attempts, row.id) : undefined,
  }
}
export function photoConfirmed(row: PhotoOutboxOperation, saved: Photo) {
  return (
    saved.id === row.photoId &&
    saved.couple_id === row.coupleId &&
    saved.uploaded_by === row.userId &&
    (saved.caption || '').trim() === (row.caption || '').trim() &&
    saved.path.startsWith(`${row.coupleId}/${row.userId}/${row.photoId}.`)
  )
}
export async function listPhotoOutbox(
  userId: string,
  coupleId: string,
): Promise<PhotoOutboxOperation[]> {
  return transaction('readonly', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () =>
      set(
        (req.result as PhotoOutboxOperation[])
          .filter((row) => samePhotoScope(row, userId, coupleId))
          .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id)),
      )
  })
}
export async function enqueuePhoto(row: PhotoOutboxOperation) {
  return transaction('readwrite', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () => {
      const rows = req.result as PhotoOutboxOperation[]
      if (
        rows.filter((item) => samePhotoScope(item, row.userId, row.coupleId)).length >= 5 ||
        rows.reduce((total, item) => total + (item.file?.size || 0), 0) + row.file.size > 25000000
      ) {
        store.transaction.abort()
        return
      }
      store.add(row)
      set(undefined)
    }
  })
}
export async function changePhotoOutbox(
  id: string,
  userId: string,
  coupleId: string,
  update: (row: PhotoOutboxOperation) => PhotoOutboxOperation | null,
) {
  return transaction('readwrite', (store, set) => {
    const req = store.get(id)
    req.onsuccess = () => {
      const row = req.result as PhotoOutboxOperation | undefined
      if (row && samePhotoScope(row, userId, coupleId)) {
        const next = update(row)
        if (next) store.put(next)
        else store.delete(id)
      }
      set(undefined)
    }
  })
}
export async function clearPhotoOutboxForUser(userId: string) {
  return transaction('readwrite', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () => {
      for (const row of req.result as PhotoOutboxOperation[])
        if (row.userId === userId) store.delete(row.id)
      set(undefined)
    }
  })
}
export async function inactivePhotoOutboxRows(userId: string, currentCoupleId: string | null) {
  return transaction('readonly', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () =>
      set(
        (req.result as PhotoOutboxOperation[])
          .filter((row) => row.userId === userId && row.coupleId !== currentCoupleId)
          .sort((a, b) => a.queuedAt - b.queuedAt),
      )
  })
}
