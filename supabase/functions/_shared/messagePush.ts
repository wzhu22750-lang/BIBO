// Contract for the chat-message FCM payload. Keep data minimal: the client only
// needs the internal route and message_id for deep linking and dedupe; the
// visible preview belongs to the notification, never to the data payload.
import { isUsablePushToken } from './pingPush.ts'
export type MessagePushRecord = {
  id: string
  couple_id: string
  sender_id: string | null
  content: string
}
export type MessageFcmPayload = {
  message: {
    token: string
    notification: { title: string; body: string }
    data: { route: string; message_id: string; kind: string }
    android: {
      priority: 'HIGH'
      notification: {
        channel_id: string
        notification_priority: 'PRIORITY_HIGH'
        default_sound: boolean
        default_vibrate_timings: boolean
      }
    }
  }
}
export const MESSAGE_PUSH_CHANNEL = 'bibo_messages_v1'
// A device that reported foreground activity within this window is presumed to
// receive the message through Supabase Realtime; pushing anyway would double-
// notify a user who is already inside the app.
export const ACTIVE_DEVICE_WINDOW_MS = 120_000
export function messagePreview(content: string, limit = 80): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  const chars = Array.from(clean)
  if (!chars.length) return '发来一条悄悄话'
  return chars.length > limit ? `${chars.slice(0, limit).join('')}…` : chars.join('')
}
export function isDeviceRecentlyActive(
  lastSeenAt: string | null | undefined,
  now = Date.now(),
  windowMs = ACTIVE_DEVICE_WINDOW_MS,
): boolean {
  if (!lastSeenAt) return false
  const parsed = Date.parse(lastSeenAt)
  if (!Number.isFinite(parsed)) return false
  const age = now - parsed
  // Tolerate small clock skew into the future; never suppress on stale rows.
  return age <= windowMs && age >= -30_000
}
export function buildMessagePush(
  record: MessagePushRecord,
  token: string,
  senderName = 'TA',
): MessageFcmPayload {
  if (!isUsablePushToken(token)) throw new Error('FCM token 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Message ID 无效')
  const name = (senderName || 'TA').replace(/\s+/g, ' ').trim().slice(0, 24) || 'TA'
  return {
    message: {
      token,
      notification: { title: name, body: messagePreview(record.content) },
      data: { route: `#chat?message=${record.id}`, message_id: record.id, kind: 'message' },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: MESSAGE_PUSH_CHANNEL,
          notification_priority: 'PRIORITY_HIGH',
          default_sound: true,
          default_vibrate_timings: true,
        },
      },
    },
  }
}
