// Contract for the chat-message GeTui payload. Keep data minimal: the client only
// needs the internal route and message_id for deep linking and dedupe; the
// visible preview belongs to the notification body, never to the transmission data.
import { isUsablePushToken } from './pingPush.ts'
export type MessagePushRecord = {
  id: string
  couple_id: string
  sender_id: string | null
  content: string
}
export type GeTuiMessagePayload = {
  kind: 'message'
  title: string
  body: string
  route: string
  message_id: string
}
export const MESSAGE_PUSH_CHANNEL = 'bibo_messages_v2'
export function messagePreview(content: string, limit = 80): string {
  const clean = content.replace(/\s+/g, ' ').trim()
  const chars = Array.from(clean)
  if (!chars.length) return '发来一条悄悄话'
  return chars.length > limit ? `${chars.slice(0, limit).join('')}…` : chars.join('')
}
export function buildMessagePush(record: MessagePushRecord, cid: string): GeTuiMessagePayload {
  if (!isUsablePushToken(cid)) throw new Error('个推 CID 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Message ID 无效')
  return {
    kind: 'message',
    title: 'BIBU！悄悄话',
    body: '收到一条悄悄话，打开 BIBU！查看',
    route: `#chat?message=${record.id}`,
    message_id: record.id,
  }
}