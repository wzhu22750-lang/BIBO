import type { EventInput, EventItem } from './types'
export type EventOutboxOperation = {
  id: string
  eventId: string
  userId: string
  coupleId: string
  operation: 'create' | 'update' | 'delete'
  queuedAt: number
  status: 'pending' | 'blocked'
  error?: string
  attempts?: number
  nextAttemptAt?: number
  input?: EventInput
}
const DB_NAME = 'bibo-event-outbox-v1'
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('events', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('本机事件队列不可用'))
    request.onblocked = () => reject(new Error('本机事件队列被其他页面占用，请关闭旧页面后重试'))
  })
}
async function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, set: (value: T) => void) => void,
): Promise<T> {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('events', mode)
    let value: T
    tx.oncomplete = () => {
      db.close()
      resolve(value)
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('事件未能保存到本机'))
    }
    tx.onerror = () => {}
    try {
      run(tx.objectStore('events'), (v) => {
        value = v
      })
    } catch (error) {
      tx.abort()
      db.close()
      reject(error)
    }
  })
}
export function sameEventScope(row: EventOutboxOperation, userId: string, coupleId: string) {
  return row.userId === userId && row.coupleId === coupleId
}
export function eventOperationForCreate(
  userId: string,
  coupleId: string,
  input: EventInput,
  now = Date.now(),
): EventOutboxOperation {
  return {
    id: crypto.randomUUID(),
    eventId: crypto.randomUUID(),
    userId,
    coupleId,
    operation: 'create',
    queuedAt: now,
    status: 'pending',
    input: { ...input },
  }
}
export function eventOperationForUpdate(
  userId: string,
  coupleId: string,
  eventId: string,
  input: EventInput,
  now = Date.now(),
): EventOutboxOperation {
  return {
    id: crypto.randomUUID(),
    eventId,
    userId,
    coupleId,
    operation: 'update',
    queuedAt: now,
    status: 'pending',
    input: { ...input },
  }
}
export function eventOperationForDelete(
  userId: string,
  coupleId: string,
  eventId: string,
  now = Date.now(),
): EventOutboxOperation {
  return {
    id: crypto.randomUUID(),
    eventId,
    userId,
    coupleId,
    operation: 'delete',
    queuedAt: now,
    status: 'pending',
  }
}
export function sameInstant(a?: string, b?: string) {
  if (!a || !b) return false
  if (a === b) return true
  const ta = new Date(a).getTime()
  const tb = new Date(b).getTime()
  return Number.isFinite(ta) && Number.isFinite(tb) && ta === tb
}
export function confirmedEvent(row: EventOutboxOperation, saved: EventItem) {
  const input = row.input
  return (
    (row.operation === 'create' || row.operation === 'update') &&
    !!input &&
    saved.id === row.eventId &&
    saved.couple_id === row.coupleId &&
    (row.operation === 'update' || saved.created_by === row.userId) &&
    saved.title.trim() === input.title.trim() &&
    sameInstant(saved.target_at, input.target_at) &&
    saved.kind === input.kind &&
    Boolean(saved.yearly) === Boolean(input.yearly) &&
    (saved.emoji || '') === (input.emoji || '') &&
    (saved.category || 'other') === (input.category || 'other')
  )
}
export function retryableEventError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code || '') : ''
  return !code || code.startsWith('08') || code === '40001' || code === '40P01' || code === '57014'
}
export function eventRetryDelay(attempt: number, id: string) {
  const n = Math.max(1, Math.min(10, Math.floor(Number.isFinite(attempt) ? attempt : 1)))
  const jitter = Array.from(id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % 5000
  return Math.min(300000, 15000 * 2 ** (n - 1) + jitter)
}
export function failedEventAttempt(
  row: EventOutboxOperation,
  error: string,
  retryable: boolean,
  now = Date.now(),
): EventOutboxOperation {
  const attempts = Math.min(
    1000,
    (Number.isFinite(row.attempts) ? Math.max(0, row.attempts!) : 0) + 1,
  )
  return {
    ...row,
    attempts,
    error,
    status: retryable ? 'pending' : 'blocked',
    nextAttemptAt: retryable ? now + eventRetryDelay(attempts, row.id) : undefined,
  }
}
export function eventDue(row: EventOutboxOperation, now = Date.now()) {
  if (row.status !== 'pending') return false
  if (!Number.isFinite(row.nextAttemptAt)) return true
  return row.nextAttemptAt! <= now || row.nextAttemptAt! - now > 305000
}
export async function listEventOutbox(
  userId: string,
  coupleId: string,
): Promise<EventOutboxOperation[]> {
  return transaction('readonly', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () =>
      set(
        (req.result as EventOutboxOperation[])
          .filter((row) => sameEventScope(row, userId, coupleId))
          .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id)),
      )
  })
}
export async function enqueueEvent(row: EventOutboxOperation) {
  return transaction('readwrite', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () => {
      const rows = req.result as EventOutboxOperation[]
      if (rows.filter((item) => sameEventScope(item, row.userId, row.coupleId)).length >= 100) {
        store.transaction.abort()
        return
      }
      store.add(row)
      set(undefined)
    }
  })
}
export async function changeEventOutbox(
  id: string,
  userId: string,
  coupleId: string,
  update: (row: EventOutboxOperation) => EventOutboxOperation | null,
) {
  return transaction('readwrite', (store, set) => {
    const req = store.get(id)
    req.onsuccess = () => {
      const row = req.result as EventOutboxOperation | undefined
      if (row && sameEventScope(row, userId, coupleId)) {
        const next = update(row)
        if (next) store.put(next)
        else store.delete(id)
      }
      set(undefined)
    }
  })
}
export async function clearEventOutboxForUser(userId: string) {
  return transaction('readwrite', (store, set) => {
    const req = store.getAll()
    req.onsuccess = () => {
      for (const row of req.result as EventOutboxOperation[])
        if (row.userId === userId) store.delete(row.id)
      set(undefined)
    }
  })
}
export function inactiveEventOutboxRows(
  rows: EventOutboxOperation[],
  userId: string,
  currentCoupleId: string | null,
) {
  return rows
    .filter((row) => row.userId === userId && row.coupleId !== currentCoupleId)
    .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id))
}

export async function listAllEventOutbox(userId: string): Promise<EventOutboxOperation[]> {
  return transaction('readonly', (store, set) => {
    const request = store.getAll()
    request.onsuccess = () =>
      set(
        (request.result as EventOutboxOperation[])
          .filter((row) => row.userId === userId)
          .sort((a, b) => a.queuedAt - b.queuedAt || a.id.localeCompare(b.id)),
      )
  })
}
