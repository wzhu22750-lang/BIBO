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
        visibility: 'PRIVATE'
        default_sound: boolean
        default_vibrate_timings: boolean
      }
    }
  }
}
export const MESSAGE_PUSH_CHANNEL = 'bibo_messages_v2'
export function messagePreview(content: string, limit = 80): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  const chars = Array.from(clean)
  if (!chars.length) return '发来一条悄悄话'
  return chars.length > limit ? `${chars.slice(0, limit).join('')}…` : chars.join('')
}
export function buildMessagePush(record: MessagePushRecord, token: string): MessageFcmPayload {
  if (!isUsablePushToken(token)) throw new Error('FCM token 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Message ID 无效')
  return {
    message: {
      token,
      notification: { title: 'BIBU 悄悄话', body: '收到一条悄悄话，打开 BIBU 查看' },
      data: { route: `#chat?message=${record.id}`, message_id: record.id, kind: 'message' },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: MESSAGE_PUSH_CHANNEL,
          notification_priority: 'PRIORITY_HIGH',
          visibility: 'PRIVATE',
          default_sound: true,
          default_vibrate_timings: true,
        },
      },
    },
  }
}
