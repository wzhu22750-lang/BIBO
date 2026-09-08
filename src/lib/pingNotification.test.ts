import { describe, expect, it } from 'vitest'
import { incomingPingNotification } from './pingNotification'
describe('incoming ping system notification', () => {
  it('creates stable positive Android notification IDs and a safe internal route', () => {
    const first = incomingPingNotification('ping-1', '想你', '小桃')
    expect(first).toEqual(incomingPingNotification('ping-1', '想你', '小桃'))
    expect(first.id).toBeGreaterThan(0)
    expect(first.id).toBeLessThan(2147483648)
    expect(first.title).toBe('收到一个小小的哔卟')
    expect(first.body).toContain('小桃')
    expect(first.body).toContain('想你')
    expect(first.route).toBe('#home')
  })
  it('uses a safe generic fallback for unknown wire kinds', () => {
    const result = incomingPingNotification('ping-2', 'future-kind')
    expect(result.body).toContain('哔卟')
    expect(result.route).toBe('#home')
  })
})
