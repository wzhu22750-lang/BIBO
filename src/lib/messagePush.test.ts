import { describe, expect, it } from 'vitest'
import {
  buildMessagePush,
  isDeviceRecentlyActive,
  MESSAGE_PUSH_CHANNEL,
  messagePreview,
} from '../../supabase/functions/_shared/messagePush'
const record = {
  id: '12345678-1234-4234-8234-123456789021',
  couple_id: '12345678-1234-4234-8234-123456789013',
  sender_id: '12345678-1234-4234-8234-123456789014',
  content: '你今天吃饭了吗？',
}
describe('message FCM push payload contract', () => {
  it('builds a minimal payload that deep-links to the chat message', () => {
    const result = buildMessagePush(record, 't'.repeat(20), 'Wincy')
    expect(result.message.token).toHaveLength(20)
    expect(result.message.notification.title).toBe('Wincy')
    expect(result.message.notification.body).toBe('你今天吃饭了吗？')
    expect(result.message.data.route).toBe(`#chat?message=${record.id}`)
    expect(result.message.data.message_id).toBe(record.id)
    expect(result.message.android.priority).toBe('HIGH')
    expect(result.message.android.notification.channel_id).toBe(MESSAGE_PUSH_CHANNEL)
    expect(result.message.android.notification.notification_priority).toBe('PRIORITY_HIGH')
    // The data payload must never carry message content or couple identifiers.
    expect(JSON.stringify(result.message.data)).not.toContain('吃饭')
    expect(JSON.stringify(result)).not.toContain(record.couple_id)
    expect(JSON.stringify(result)).not.toContain(record.sender_id)
  })
  it('truncates long previews and collapses whitespace', () => {
    expect(messagePreview('a\n\n  b   c')).toBe('a b c')
    const long = 'x'.repeat(200)
    const preview = messagePreview(long, 80)
    expect(Array.from(preview)).toHaveLength(81)
    expect(preview.endsWith('…')).toBe(true)
    expect(messagePreview('   ')).toBe('发来一条悄悄话')
  })
  it('rejects invalid tokens and message IDs', () => {
    expect(() => buildMessagePush(record, 'short', 'Wincy')).toThrow('token')
    expect(() => buildMessagePush({ ...record, id: 'bad' }, 't'.repeat(20))).toThrow('ID')
  })
  it('suppresses only devices with a fresh heartbeat', () => {
    const now = Date.parse('2026-09-08T12:00:00Z')
    expect(isDeviceRecentlyActive(new Date(now - 30_000).toISOString(), now)).toBe(true)
    expect(isDeviceRecentlyActive(new Date(now - 121_000).toISOString(), now)).toBe(false)
    expect(isDeviceRecentlyActive(new Date(now + 10_000).toISOString(), now)).toBe(true)
    expect(isDeviceRecentlyActive(new Date(now + 60_000).toISOString(), now)).toBe(false)
    expect(isDeviceRecentlyActive(null, now)).toBe(false)
    expect(isDeviceRecentlyActive('not-a-date', now)).toBe(false)
  })
})
