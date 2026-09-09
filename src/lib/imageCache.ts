import type { Photo } from './types'

/**
 * Persistent photo cache for the browser and the Capacitor WebView.
 *
 * Supabase signed URLs are deliberately not used as cache keys: their token
 * expires and changes even when the underlying private object does not.
 */
export const IMAGE_CACHE_MAX_BYTES = 64 * 1024 * 1024
export const IMAGE_CACHE_MAX_ENTRY_BYTES = 5 * 1024 * 1024
export const IMAGE_CACHE_REVALIDATE_AFTER_MS = 24 * 60 * 60 * 1000

const DB_NAME = 'bibu-image-cache-v1'
const DB_VERSION = 1
const STORE_NAME = 'images'
const MEMORY_CACHE_LIMIT = 64

type ImageRecord = {
  key: string
  blob: Blob
  bytes: number
  mimeType: string
  createdAt: number
  lastAccessAt: number
  lastValidatedAt: number
}

type ObjectUrlRecord = { url: string; lastAccessAt: number }
type ImageListener = (url: string | null) => void

const memoryRecords = new Map<string, ImageRecord>()
const objectUrls = new Map<string, ObjectUrlRecord>()
const pendingLoads = new Map<string, Promise<string>>()
const pendingRefreshes = new Map<string, Promise<void>>()
const listeners = new Map<string, Set<ImageListener>>()
const keyGenerations = new Map<string, number>()
let cacheGeneration = 0
let database: Promise<IDBDatabase> | null = null
let writeQueue: Promise<void> = Promise.resolve()

function now() {
  return Date.now()
}

function isInlineImageSource(source: string) {
  return source.startsWith('data:image/') || source.startsWith('blob:')
}

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined'
}

function generationToken(key: string) {
  return `${cacheGeneration}:${keyGenerations.get(key) || 0}`
}

function invalidateKey(key: string) {
  keyGenerations.set(key, (keyGenerations.get(key) || 0) + 1)
  pendingLoads.delete(key)
  pendingRefreshes.delete(key)
}

function openDatabase() {
  if (!canUseIndexedDb()) return Promise.reject(new Error('当前运行环境没有 IndexedDB'))
  if (database) return database
  database = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('无法打开照片缓存'))
  })
  database.catch(() => {
    database = null
  })
  return database
}

function readIndexedRecord(key: string): Promise<ImageRecord | null> {
  return openDatabase().then(
    (db) =>
      new Promise<ImageRecord | null>((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
        request.onsuccess = () => resolve((request.result as ImageRecord | undefined) || null)
        request.onerror = () => reject(request.error || new Error('无法读取照片缓存'))
      }),
  )
}

function allIndexedRecords(): Promise<ImageRecord[]> {
  return openDatabase().then(
    (db) =>
      new Promise<ImageRecord[]>((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
        request.onsuccess = () => resolve((request.result as ImageRecord[]) || [])
        request.onerror = () => reject(request.error || new Error('无法读取照片缓存目录'))
      }),
  )
}

function enqueueWrite(task: () => Promise<void>) {
  const next = writeQueue.then(task)
  writeQueue = next.catch(() => {})
  return next
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('照片缓存写入失败'))
    transaction.onabort = () => reject(transaction.error || new Error('照片缓存写入被取消'))
  })
}

function writeIndexedRecord(record: ImageRecord, token: string) {
  return enqueueWrite(async () => {
    // A logout, relationship change, or delete may have happened while this
    // write was waiting behind another IndexedDB transaction.
    if (generationToken(record.key) !== token) return
    const db = await openDatabase()
    const records = await allIndexedRecords()
    if (generationToken(record.key) !== token) return
    const current = records.find((item) => item.key === record.key)
    let total = records.reduce((sum, item) => sum + item.bytes, 0) - (current?.bytes || 0)
    const evictable = records
      .filter((item) => item.key !== record.key)
      .sort((a, b) => a.lastAccessAt - b.lastAccessAt)
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    for (const item of evictable) {
      if (total + record.bytes <= IMAGE_CACHE_MAX_BYTES) break
      store.delete(item.key)
      total -= item.bytes
      dropObjectUrl(item.key)
    }
    if (total + record.bytes > IMAGE_CACHE_MAX_BYTES) {
      await transactionDone(transaction)
      return
    }
    const completed = transactionDone(transaction)
    if (generationToken(record.key) !== token) {
      transaction.abort()
      await completed.catch(() => {})
      return
    }
    store.put(record)
    await completed
  })
}

function trimMemory() {
  while (memoryRecords.size > MEMORY_CACHE_LIMIT) {
    const oldest = [...memoryRecords.values()].sort((a, b) => a.lastAccessAt - b.lastAccessAt)[0]
    if (!oldest) break
    memoryRecords.delete(oldest.key)
    dropObjectUrl(oldest.key)
  }
}

async function readRecord(key: string) {
  const local = memoryRecords.get(key)
  if (local) {
    local.lastAccessAt = now()
    return local
  }
  if (!canUseIndexedDb()) return null
  try {
    const persisted = await readIndexedRecord(key)
    if (!persisted) return null
    persisted.lastAccessAt = now()
    memoryRecords.set(key, persisted)
    trimMemory()
    // LRU metadata is best effort; an unavailable/closed database must not
    // make an already cached photo disappear from the UI.
    void writeIndexedRecord(persisted, generationToken(key)).catch(() => {})
    return persisted
  } catch {
    return null
  }
}

function notifyListeners(key: string, url: string | null) {
  listeners.get(key)?.forEach((listener) => listener(url))
}

function makeObjectUrl(key: string, blob: Blob, replace = false) {
  const existing = objectUrls.get(key)
  if (existing && !replace) {
    existing.lastAccessAt = now()
    return existing.url
  }
  if (existing) dropObjectUrl(key)
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return null
  const url = URL.createObjectURL(blob)
  objectUrls.set(key, { url, lastAccessAt: now() })
  while (objectUrls.size > MEMORY_CACHE_LIMIT) {
    const oldest = [...objectUrls.entries()].sort(
      ([, a], [, b]) => a.lastAccessAt - b.lastAccessAt,
    )[0]
    if (!oldest) break
    dropObjectUrl(oldest[0])
  }
  return url
}

function dropObjectUrl(key: string) {
  const item = objectUrls.get(key)
  if (!item) return
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function')
    URL.revokeObjectURL(item.url)
  objectUrls.delete(key)
}

async function storeBlob(key: string, blob: Blob, validatedAt: number, token: string) {
  if (blob.size > IMAGE_CACHE_MAX_ENTRY_BYTES || generationToken(key) !== token) return false
  const record: ImageRecord = {
    key,
    blob,
    bytes: blob.size,
    mimeType: blob.type || 'image/jpeg',
    createdAt: memoryRecords.get(key)?.createdAt || now(),
    lastAccessAt: now(),
    lastValidatedAt: validatedAt,
  }
  memoryRecords.set(key, record)
  trimMemory()
  const url = makeObjectUrl(key, blob, true)
  if (url) notifyListeners(key, url)
  if (canUseIndexedDb()) {
    try {
      await writeIndexedRecord(record, token)
    } catch {
      // The fetched image remains usable from this session even if IndexedDB
      // quota or WebView storage is unavailable.
    }
  }
  return true
}

async function downloadAndStore(source: string, key: string, token = generationToken(key)) {
  const response = await fetch(source, { cache: 'no-store', credentials: 'omit' })
  if (!response.ok) {
    const error = new Error(`照片下载失败（HTTP ${response.status}）`) as Error & {
      status?: number
    }
    error.status = response.status
    throw error
  }
  const blob = await response.blob()
  await storeBlob(key, blob, now(), token)
  if (generationToken(key) !== token) throw new Error('照片缓存已失效')
  return blob
}

type RefreshSource = () => Promise<string | undefined>

function authResponse(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = Number((error as { status?: unknown }).status)
  return status === 401 || status === 403
}

async function refresh(source: string, key: string, refreshSource?: RefreshSource) {
  const current = pendingRefreshes.get(key)
  if (current) return current
  const token = generationToken(key)
  const operation = (async () => {
    try {
      await downloadAndStore(source, key, token)
    } catch (error) {
      if (!refreshSource || !authResponse(error)) throw error
      const freshSource = await refreshSource()
      if (!freshSource || freshSource === source) throw error
      await downloadAndStore(freshSource, key, token)
    }
  })().finally(() => {
    if (pendingRefreshes.get(key) === operation) pendingRefreshes.delete(key)
  })
  pendingRefreshes.set(key, operation)
  return operation
}

async function load(source: string | undefined, key: string, refreshSource?: RefreshSource) {
  const record = await readRecord(key)
  if (record) {
    if (source && now() - record.lastValidatedAt > IMAGE_CACHE_REVALIDATE_AFTER_MS)
      void refresh(source, key, refreshSource).catch(() => {})
    const cachedUrl = makeObjectUrl(key, record.blob)
    if (cachedUrl) return cachedUrl
  }
  if (!source) throw new Error('本机没有这张照片的缓存')
  const token = generationToken(key)
  try {
    const blob = await downloadAndStore(source, key, token)
    return makeObjectUrl(key, blob) || source
  } catch (error) {
    if (!refreshSource || !authResponse(error)) throw error
    const freshSource = await refreshSource()
    if (!freshSource || freshSource === source) throw error
    const blob = await downloadAndStore(freshSource, key, token)
    return makeObjectUrl(key, blob) || freshSource
  }
}

/**
 * Return a stable cache key for a private Supabase photo. `created_at` makes a
 * new metadata row a new cache generation, while the Storage path avoids signed
 * URL token churn on every reload.
 */
export function imageCacheKey(photo: Pick<Photo, 'couple_id' | 'path' | 'created_at'>) {
  return `photo:${photo.couple_id}:${photo.path}:${photo.created_at}`
}

/** Subscribe to a replacement Blob after stale-image revalidation completes. */
export function subscribeCachedImage(key: string, listener: ImageListener) {
  const current = listeners.get(key) || new Set<ImageListener>()
  current.add(listener)
  listeners.set(key, current)
  return () => {
    current.delete(listener)
    if (!current.size) listeners.delete(key)
  }
}

/** Load a photo from persistent cache, sharing concurrent downloads by key. */
export function getCachedImage(
  source: string | undefined,
  key = source || '',
  refreshSource?: RefreshSource,
) {
  if (source && isInlineImageSource(source)) return Promise.resolve(source)
  if (!key) return Promise.reject(new Error('照片缓存键为空'))
  const current = pendingLoads.get(key)
  if (current) return current
  const operation = load(source, key, refreshSource).finally(() => {
    if (pendingLoads.get(key) === operation) pendingLoads.delete(key)
  })
  pendingLoads.set(key, operation)
  return operation
}

/** Explicitly load and cache an image, useful for prefetching or tests. */
export function cacheImage(source: string, key = source) {
  return getCachedImage(source, key)
}

export async function removeCachedImage(key: string) {
  invalidateKey(key)
  memoryRecords.delete(key)
  dropObjectUrl(key)
  notifyListeners(key, null)
  if (!canUseIndexedDb()) return
  try {
    await enqueueWrite(async () => {
      const db = await openDatabase()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).delete(key)
      await transactionDone(transaction)
    })
  } catch {
    // Deletion is best effort; the cache has already been removed for this
    // session and the next successful load can replace stale data.
  }
}

export async function clearImageCache() {
  cacheGeneration += 1
  pendingLoads.clear()
  pendingRefreshes.clear()
  memoryRecords.clear()
  for (const key of [...objectUrls.keys()]) dropObjectUrl(key)
  if (!canUseIndexedDb()) return
  try {
    await enqueueWrite(async () => {
      const db = await openDatabase()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      transaction.objectStore(STORE_NAME).clear()
      await transactionDone(transaction)
    })
  } catch {
    // Clearing local cache must not block logout or account deletion.
  }
}

/** Test-only reset that also removes the in-memory fallback state. */
export async function resetImageCacheForTests() {
  await clearImageCache()
  database = null
  writeQueue = Promise.resolve()
  keyGenerations.clear()
}
