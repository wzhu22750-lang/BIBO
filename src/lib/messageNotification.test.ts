import { describe, expect, it } from 'vitest'
import {
  incomingMessageNotification,
  messagePreview,
  newPartnerMessages,
  shouldNotifyIncomingMessage,
} from './messageNotification'
import type { Message } from './types'
const me = 'user-me'
const partner = 'user-partner'
const now = Date.parse('2026-09-08T12:00:00Z')
function message(id: string, sender: string | null, ageMs = 10_000): Message {
  return {
    id,
    couple_id: 'c1',
    sender_id: sender,
    content: `内容 ${id}`,
    created_at: new Date(now - ageMs).toISOString(),
  }
}
describe('incoming message notification decisions', () => {
  it('detects only fresh partner messages against the previous snapshot', () => {
    const previous = [message('m1', partner)]
    const next = [message('m1', partner), message('m2', partner), message('m3', me)]
    expect(newPartnerMessages(previous, next, me, now).map((m) => m.id)).toEqual(['m2'])
  })
  it('never notifies on the initial snapshot or on stale messages', () => {
    expect(newPartnerMessages(null, [message('m1', partner)], me, now)).toEqual([])
    expect(newPartnerMessages([], [message('m1', partner, 10 * 60_000)], me, now)).toEqual([])
    expect(newPartnerMessages([], [message('m1', null)], me, now)).toEqual([])
  })
  it('suppresses the banner in background (owned by FCM) and while chat is active', () => {
    expect(shouldNotifyIncomingMessage(true, '#chat')).toBe(false)
    expect(shouldNotifyIncomingMessage(true, '#home')).toBe(false)
    expect(shouldNotifyIncomingMessage(false, '#chat')).toBe(false)
    expect(shouldNotifyIncomingMessage(false, '#chat?message=m1')).toBe(false)
    expect(shouldNotifyIncomingMessage(false, '#home')).toBe(true)
    expect(shouldNotifyIncomingMessage(false, '#photos')).toBe(true)
    expect(shouldNotifyIncomingMessage(false, '#nonsense')).toBe(true)
  })
  it('builds a stable-id notification that routes back to the exact message', () => {
    const input = incomingMessageNotification(message('m2', partner), 'Wincy')
    expect(input.id).toBeGreaterThan(0)
    expect(input.id).toBe(incomingMessageNotification(message('m2', partner), '其他名字').id)
    expect(input.title).toBe('Wincy')
    expect(input.body).toBe('内容 m2')
    expect(input.route).toBe('#chat?message=m2')
    expect(input.channel).toBe('messages')
  })
  it('truncates previews without leaking extra content', () => {
    expect(messagePreview('a\n  b')).toBe('a b')
    expect(Array.from(messagePreview('长'.repeat(300)))).toHaveLength(101)
    expect(messagePreview('')).toBe('发来一条悄悄话')
  })
})
