import type { DraftSnapshot } from './chatDraft'
const PREFIX = 'bibo-chat-draft-v1:'
const TTL = 24 * 60 * 60 * 1000
function key(userId: string, coupleId: string) {
  return `${PREFIX}${userId}:${coupleId}`
}
export function readChatDraft(userId: string, coupleId: string, now = Date.now()): DraftSnapshot {
  try {
    const raw = sessionStorage.getItem(key(userId, coupleId))
    if (!raw) return { text: '', revision: 0 }
    const value = JSON.parse(raw)
    if (
      typeof value.text !== 'string' ||
      typeof value.savedAt !== 'number' ||
      now - value.savedAt > TTL ||
      value.savedAt > now + 60000 ||
      Array.from(value.text).length > 2000
    ) {
      sessionStorage.removeItem(key(userId, coupleId))
      return { text: '', revision: 0 }
    }
    return { text: value.text, revision: 0 }
  } catch {
    return { text: '', revision: 0 }
  }
}
export function writeChatDraft(
  userId: string,
  coupleId: string,
  draft: DraftSnapshot,
  now = Date.now(),
) {
  if (!draft.text) {
    clearChatDraft(userId, coupleId)
    return
  }
  sessionStorage.setItem(key(userId, coupleId), JSON.stringify({ text: draft.text, savedAt: now }))
}
export function clearChatDraft(userId: string, coupleId: string) {
  sessionStorage.removeItem(key(userId, coupleId))
}

export function clearChatDraftsForUser(userId: string) {
  const prefix = PREFIX + userId + ':'
  const keys: string[] = []
  for (let index = 0; index < sessionStorage.length; index++) {
    const value = sessionStorage.key(index)
    if (value?.startsWith(prefix)) keys.push(value)
  }
  for (const value of keys) sessionStorage.removeItem(value)
}
