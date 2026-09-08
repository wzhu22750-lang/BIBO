import type { Message } from './types'
export type OutboxMessage = {
  id: string
  userId: string
  coupleId: string
  content: string
  queuedAt: number
  status: 'pending' | 'blocked'
  error?: string
  attempts?: number
  nextAttemptAt?: number
}
const DB_NAME = 'bibo-message-outbox-v1'
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('messages', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('本机消息存储不可用'))
    request.onblocked = () => reject(new Error('本机消息存储被其他页面占用，请关闭旧页面后重试'))
  })
}
async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, set: (value: T) => void) => void,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', mode)
    let value: T
    tx.oncomplete = () => {
      db.close()
      resolve(value)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('消息未能保存到本机，请勿关闭页面'))
    }
    tx.onerror = () => {} // onabort is authoritative; don't resolve before commit.
    try {
      run(tx.objectStore('messages'), (v) => {
        value = v
      })
    } catch (e) {
      tx.abort()
      db.close()
      reject(e)
    }
  })
}
export function sameOutboxScope(row: OutboxMessage, userId: string, coupleId: string) {
  return row.userId === userId && row.coupleId === coupleId
}
export function confirmedOutboxRow(queued: OutboxMessage, server: Message) {
  return (
    server.id === queued.id &&
    server.sender_id === queued.userId &&
    server.couple_id === queued.coupleId &&
    server.content === queued.content
  )
}
export function retryableOutboxError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code || '') : ''
  // Network/transport (no Postgres code), serialization, deadlock and connection classes.
  return !code || code.startsWith('08') || code === '40001' || code === '40P01' || code === '57014'
}
export async function listOutbox(userId: string, coupleId: string): Promise<OutboxMessage[]> {
  return transaction('readonly', (store, set) => {
    const request = store.getAll()
    request.onsuccess = () =>
      set(
        (request.result as OutboxMessage[])
          .filter((r) => sameOutboxScope(r, userId, coupleId))
          .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id)),
      )
  })
}
export async function enqueueMessage(row: OutboxMessage): Promise<void> {
  return transaction('readwrite', (store, set) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const rows = request.result as OutboxMessage[]
      if (rows.filter((r) => sameOutboxScope(r, row.userId, row.coupleId)).length >= 100) {
        store.transaction.abort()
        return
      }
      store.add(row)
      set(undefined)
    }
  })
}
export async function changeOutbox(
  id: string,
  userId: string,
  coupleId: string,
  update: (row: OutboxMessage) => OutboxMessage | null,
): Promise<void> {
  return transaction('readwrite', (store, set) => {
    const request = store.get(id)
    request.onsuccess = () => {
      const row = request.result as OutboxMessage | undefined
      if (row && sameOutboxScope(row, userId, coupleId)) {
        const next = update(row)
        if (next) store.put(next)
        else store.delete(id)
      }
      set(undefined)
    }
  })
}

export function inactiveOutboxRows(
  rows: OutboxMessage[],
  userId: string,
  currentCoupleId: string | null,
) {
  return rows
    .filter((row) => row.userId === userId && row.coupleId !== currentCoupleId)
    .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id))
}
export async function listInactiveOutbox(
  userId: string,
  currentCoupleId: string | null,
): Promise<OutboxMessage[]> {
  return transaction('readonly', (store, set) => {
    const request = store.getAll()
    request.onsuccess = () =>
      set(inactiveOutboxRows(request.result as OutboxMessage[], userId, currentCoupleId))
  })
}

export async function clearOutboxForUser(userId: string): Promise<void> {
  return transaction('readwrite', (store, set) => {
    const request = store.getAll()
    request.onsuccess = () => {
      for (const row of request.result as OutboxMessage[])
        if (row.userId === userId) store.delete(row.id)
      set(undefined)
    }
  })
}
