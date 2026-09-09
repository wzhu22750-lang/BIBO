import { afterEach, describe, expect, it, vi } from 'vitest'
import { isPing, mergePings, shouldPresentPing } from './pingHistory'
import { makeDemo, readDemo, saveDemo } from './demo'
import type { Ping } from './types'
const now = Date.parse('2026-09-08T12:00:00Z')
const row = (id: string, age = 0, couple_id = 'c', sender_id = 'partner'): Ping => ({
  id,
  couple_id,
  sender_id,
  kind: '想你',
  created_at: new Date(now - age).toISOString(),
})
afterEach(() => vi.unstubAllGlobals())
describe('ping history boundary', () => {
  it('validates wire payloads before use', () => {
    for (const value of [
      null,
      {},
      { ...row('1'), created_at: 'invalid' },
      { ...row('1'), kind: 1 },
    ])
      expect(isPing(value)).toBe(false)
    expect(isPing(row('1'))).toBe(true)
  })
  it('deduplicates and retains live inserts across an older snapshot', () => {
    const live = [row('new'), row('old', 10_000)]
    expect(mergePings('c', [row('old', 10_000)], live).map((p) => p.id)).toEqual(['new', 'old'])
    expect(live).toHaveLength(2)
  })
  it('never mixes spaces and caps retained history in stable timestamp/id order', () => {
    const many = Array.from({ length: 80 }, (_, i) => row(String(i), i * 1000))
    const merged = mergePings('c', many, [row('other', 0, 'other')])
    expect(merged).toHaveLength(50)
    expect(merged[0].id).toBe('0')
    expect(merged.at(-1)?.id).toBe('49')
    expect(mergePings('c', [row('a'), row('b')]).map((p) => p.id)).toEqual(['b', 'a'])
    expect(mergePings('new', many)).toEqual([])
  })
  it('presents only unseen partner pings, never duplicates or own sends', () => {
    expect(shouldPresentPing(row('1'), [], 'me')).toBe(true)
    expect(shouldPresentPing(row('1'), [row('1')], 'me')).toBe(false)
    expect(shouldPresentPing(row('1', 0, 'c', 'me'), [], 'me')).toBe(false)
    expect(shouldPresentPing(row('1', 10 * 60_000), [], 'me')).toBe(true)
    expect(shouldPresentPing(row('1', -30_001), [], 'me')).toBe(true)
  })
  it('loads an old demo without losing messages or requiring a reset', () => {
    const old: Partial<ReturnType<typeof makeDemo>> = makeDemo()
    delete old.pings
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(old) })
    expect(readDemo().pings).toEqual([])
    expect(readDemo().messages).toEqual(old.messages)
  })
  it('preserves new demo records across reload and surfaces quota failure', () => {
    let stored: string | null = null
    vi.stubGlobal('localStorage', {
      getItem: () => stored,
      setItem: (_: string, value: string) => {
        stored = value
      },
    })
    const space = makeDemo()
    space.pings = [row('saved', 0, 'demo', 'demo-me')]
    saveDemo(space)
    expect(readDemo().pings).toEqual(space.pings)
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota')
      },
    })
    expect(() => saveDemo(space)).toThrow('quota')
  })
})

describe('anonymized ping history', () => {
  it('keeps a shared ping visible without presenting it as a new incoming ping', () => {
    const anonymized = row('deleted', 0, 'c', null as unknown as string)
    expect(isPing(anonymized)).toBe(true)
    expect(shouldPresentPing(anonymized, [], 'me')).toBe(false)
  })
})
