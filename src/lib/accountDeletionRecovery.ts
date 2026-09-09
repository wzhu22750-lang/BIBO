import { clearEventOutboxForUser } from './eventOutbox'
import { clearChatDraftsForUser } from './chatDraftStorage'
import { clearImageCache } from './imageCache'
import { clearOutboxForUser } from './outbox'
import { clearPhotoOutboxForUser } from './photoOutbox'
import { clearSpaceCache, setCacheEnabled } from './spaceCache'
import { BibuNative } from '../native'
import { clearStoredPushToken } from './pushRegistration'

const KEY = 'bibu-account-deletion-pending-v1'
const MAX_USER_ID_LENGTH = 80
export type PendingAccountDeletion = {
  userId: string
  expectedSpace: string | null
  requestedAt: number
}

function valid(value: unknown): value is PendingAccountDeletion {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.userId === 'string' &&
    row.userId.length > 0 &&
    row.userId.length <= MAX_USER_ID_LENGTH &&
    (row.expectedSpace === null || typeof row.expectedSpace === 'string') &&
    typeof row.requestedAt === 'number' &&
    Number.isFinite(row.requestedAt)
  )
}

export function markPendingAccountDeletion(userId: string, expectedSpace: string | null) {
  if (!userId || userId.length > MAX_USER_ID_LENGTH) return
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        userId,
        expectedSpace,
        requestedAt: Date.now(),
      } satisfies PendingAccountDeletion),
    )
  } catch {
    // The server remains authoritative; recovery is best-effort when storage is unavailable.
  }
}

export function readPendingAccountDeletion(): PendingAccountDeletion | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    return valid(value) ? value : null
  } catch {
    return null
  }
}

export function clearPendingAccountDeletion() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

/**
 * If Auth deletion succeeded but its final HTTP response was lost, the next
 * launch must not leave the user's private offline material indefinitely.
 * This recovery is intentionally local-only and never claims that the server
 * deletion succeeded.
 */
export async function recoverPendingAccountDeletion(): Promise<string[]> {
  const pending = readPendingAccountDeletion()
  if (!pending) return []
  const errors: string[] = []
  const attempt = async (label: string, task: () => Promise<void> | void) => {
    try {
      await task()
    } catch (error) {
      errors.push(`${label}：${String(error)}`)
    }
  }
  await attempt('离线快照', () => {
    setCacheEnabled(pending.userId, false)
    clearSpaceCache(pending.userId)
  })
  await attempt('待发送消息', () => clearOutboxForUser(pending.userId))
  await attempt('待发送事件', async () => {
    await clearEventOutboxForUser(pending.userId)
  })
  await attempt('待发送照片', async () => {
    await clearPhotoOutboxForUser(pending.userId)
  })
  await attempt('照片缓存', () => clearImageCache())
  await attempt('聊天草稿', () => clearChatDraftsForUser(pending.userId))
  await attempt('保存的邮箱', () => localStorage.removeItem('bibu-saved-email'))
  await attempt('本机 Push', async () => {
    await BibuNative.push.unregister()
    clearStoredPushToken()
  })
  await attempt('本机提醒', async () => {
    const reminders = await BibuNative.reminders.list()
    if (!reminders.supported) return
    for (const reminder of reminders.items) await BibuNative.reminders.cancel(reminder.id)
  })
  if (!errors.length) clearPendingAccountDeletion()
  return errors
}
