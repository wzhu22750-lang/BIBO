import type { Message } from './types'
import type { NotificationInput } from '../native'
import { positiveHash } from './pingNotification'
export function messagePreview(content: string, limit = 100): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  const chars = Array.from(clean)
  if (!chars.length) return '发来一条悄悄话'
  return chars.length > limit ? `${chars.slice(0, limit).join('')}…` : chars.join('')
}
export function incomingMessageNotification(
  message: Pick<Message, 'id' | 'content'>,
  partnerName = 'TA',
): NotificationInput {
  return {
    id: positiveHash(message.id),
    title: partnerName.slice(0, 24) || 'TA',
    body: '收到一条悄悄话，打开 BIBU！查看',
    route: `#chat?message=${encodeURIComponent(message.id)}`,
    channel: 'messages',
  }
}
/**
 * Messages that appeared since the previous snapshot, sent by the partner, and
 * A null previous snapshot means initial load (or account/space switch):
 * everything is marked seen without notifying, so opening the app never fires
 * a burst of stale banners. There is no hidden wall-clock suppression window.
 */
export function newPartnerMessages(
  previous: Message[] | null,
  next: Message[],
  myId: string,
): Message[] {
  if (!previous) return []
  const seen = new Set(previous.map((row) => row.id))
  return next.filter((row) => !seen.has(row.id) && row.sender_id !== null && row.sender_id !== myId)
}
/**
 * BIBU has exactly one conversation per couple. Background/screen-off delivery
 * belongs strictly to FCM to prevent duplicate stacked notifications.
 * Realtime only notifies when the app is in the foreground AND the user
 * is not currently on the chat page.
 */
