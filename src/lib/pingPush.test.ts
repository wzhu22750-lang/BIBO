import { describe, expect, it } from 'vitest'
import {
  buildPingPush,
  isUnregisteredFcmError,
  isUsablePushToken,
} from '../../supabase/functions/_shared/pingPush'
const record = {
  id: '12345678-1234-4234-8234-123456789012',
  couple_id: '12345678-1234-4234-8234-123456789013',
  sender_id: '12345678-1234-4234-8234-123456789014',
  kind: '想你',
}
describe('FCM push payload contract', () => {
  it('builds private minimal payload with internal route only', () => {
    const result = buildPingPush(record, 't'.repeat(20))
    expect(result.message.token).toHaveLength(20)
    expect(result.message.data.route).toBe('#home')
    expect(result.message.notification.body).toBe('收到一个小小的哔卟，打开 BIBU！查看')
    expect(result.message.android.priority).toBe('HIGH')
    expect(result.message.android.notification.channel_id).toBe('bibo_love_v3')
    expect(result.message.android.notification.notification_priority).toBe('PRIORITY_HIGH')
    expect(JSON.stringify(result)).not.toContain(record.couple_id)
  })
  it('rejects invalid tokens and IDs', () => {
    expect(isUsablePushToken('short')).toBe(false)
    expect(isUsablePushToken('t'.repeat(20))).toBe(true)
    expect(() => buildPingPush(record, 'short')).toThrow()
    expect(() => buildPingPush({ ...record, id: 'bad' }, 't'.repeat(20))).toThrow()
  })
  it('classifies invalid registration tokens but not ordinary transient errors', () => {
    expect(isUnregisteredFcmError(404, 'UNREGISTERED')).toBe(true)
    expect(isUnregisteredFcmError(400, 'registration-token-not-registered')).toBe(true)
    expect(isUnregisteredFcmError(404, 'NOT_FOUND: endpoint unavailable')).toBe(false)
    expect(isUnregisteredFcmError(400, 'INVALID_ARGUMENT: malformed payload')).toBe(false)
    expect(isUnregisteredFcmError(503, 'temporarily unavailable')).toBe(false)
  })
})
