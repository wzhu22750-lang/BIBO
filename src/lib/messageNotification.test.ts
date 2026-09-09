import { describe, expect, it } from 'vitest'
import {
  incomingMessageNotification,
  messagePreview,
  newPartnerMessages,
} from './messageNotification'
import type { Message } from './types'
const now = Date.parse('2026-09-08T12:00:00Z')
const me = 'user-me'
const partner = 'user-partner'
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
    expect(newPartnerMessages(previous, next, me).map((m) => m.id)).toEqual(['m2'])
  })
  it('never notifies on the initial snapshot, but does not use a hidden age window', () => {
    expect(newPartnerMessages(null, [message('m1', partner)], me)).toEqual([])
    expect(
      newPartnerMessages([], [message('m1', partner, 10 * 60_000)], me).map((m) => m.id),
    ).toEqual(['m1'])
    expect(newPartnerMessages([], [message('m1', null)], me)).toEqual([])
  })
  it('builds a stable-id notification that routes back to the exact message', () => {
    const input = incomingMessageNotification(message('m2', partner), 'Wincy')
    expect(input.id).toBeGreaterThan(0)
    expect(input.id).toBe(incomingMessageNotification(message('m2', partner), '其他名字').id)
    expect(input.title).toBe('Wincy')
    expect(input.body).toBe('收到一条悄悄话，打开 BIBU！查看')
    expect(input.route).toBe('#chat?message=m2')
    expect(input.channel).toBe('messages')
  })
  it('truncates previews without leaking extra content', () => {
    expect(messagePreview('a\n  b')).toBe('a b')
    expect(Array.from(messagePreview('长'.repeat(300)))).toHaveLength(101)
    expect(messagePreview('')).toBe('发来一条悄悄话')
  })
})
