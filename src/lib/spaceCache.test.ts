import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeDemo } from './demo'
import {
  cacheEnabled,
  clearSpaceCache,
  decodeSpaceCache,
  encodeSpaceCache,
  networkFailure,
  readSpaceCache,
  setCacheEnabled,
  writeSpaceCache,
} from './spaceCache'
const now = Date.now()
afterEach(() => vi.unstubAllGlobals())
function storage() {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => values.get(k) || null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  })
  return values
}
describe('explicit account-scoped space snapshots', () => {
  it('defaults off, needs opt-in, and never returns another account snapshot', () => {
    storage()
    const space = makeDemo()
    expect(cacheEnabled(space.me.id)).toBe(false)
    writeSpaceCache(space.me.id, space)
    expect(readSpaceCache(space.me.id)).toBeNull()
    setCacheEnabled(space.me.id, true)
    writeSpaceCache(space.me.id, space)
    expect(readSpaceCache(space.me.id)?.space.messages).toEqual(space.messages)
    expect(readSpaceCache('another')).toBeNull()
    expect(decodeSpaceCache(encodeSpaceCache(space.me.id, space), 'another')).toBeNull()
  })
  it('projects whitelisted fields and strips private image URLs', () => {
    const space = makeDemo()
    space.photos[0].url = 'https://private/signed?token=secret'
    const encoded = encodeSpaceCache(space.me.id, space, now)
    expect(encoded).not.toContain('token=secret')
    expect(decodeSpaceCache(encoded, space.me.id, now)?.space.photos[0].url).toBeUndefined()
    const changed = JSON.parse(encoded)
    changed.space.photos[0].url = 'injected'
    expect(
      decodeSpaceCache(JSON.stringify(changed), space.me.id, now)?.space.photos[0].url,
    ).toBeUndefined()
  })
  it('rejects expired, future-clock, malformed and mixed-space snapshots', () => {
    const space = makeDemo(),
      encoded = encodeSpaceCache(space.me.id, space, now)
    expect(decodeSpaceCache(encoded, space.me.id, now + 86400001)).toBeNull()
    expect(decodeSpaceCache(encoded, space.me.id, now - 60001)).toBeNull()
    expect(decodeSpaceCache('{bad', space.me.id, now)).toBeNull()
    const changed = JSON.parse(encoded)
    changed.space.messages[0].couple_id = 'other'
    expect(decodeSpaceCache(JSON.stringify(changed), space.me.id, now)).toBeNull()
    changed.space.messages = []
    changed.space.partner.name = { bad: 'object' }
    expect(decodeSpaceCache(JSON.stringify(changed), space.me.id, now)).toBeNull()
  })
  it('does not persist data URL images or fabricate oversized snapshots', () => {
    const space = makeDemo()
    space.photos[0].path = 'data:image/jpeg;base64,huge'
    expect(() => encodeSpaceCache(space.me.id, space, now)).toThrow('格式')
  })
  it('disabling clears cache but never touches unrelated storage', () => {
    const values = storage(),
      space = makeDemo()
    values.set('unrelated', 'keep')
    setCacheEnabled(space.me.id, true)
    writeSpaceCache(space.me.id, space)
    setCacheEnabled(space.me.id, false)
    expect(readSpaceCache(space.me.id)).toBeNull()
    expect(values.get('unrelated')).toBe('keep')
    clearSpaceCache(space.me.id)
  })
  it('surfaces failed local writes rather than reporting offline availability', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => 'true',
      setItem: () => {
        throw new Error('quota')
      },
    })
    expect(() => writeSpaceCache('demo-me', makeDemo())).toThrow('quota')
  })
  it('does not use network fallback for authorization or schema failures', () => {
    expect(networkFailure(new TypeError('Failed to fetch'))).toBe(true)
    expect(networkFailure({ message: 'TypeError: Failed to fetch' })).toBe(true)
    expect(networkFailure({ message: 'network error', code: '42501' })).toBe(false)
    expect(networkFailure({ message: 'Load failed', status: 401 })).toBe(false)
    expect(networkFailure({ message: 'relation does not exist', code: '42P01' })).toBe(false)
    expect(networkFailure(new Error('programming bug'))).toBe(false)
  })
})

describe('anonymized shared records remain cache-readable', () => {
  it('accepts null authors without reviving private identity fields', () => {
    const space = makeDemo()
    space.messages[0].sender_id = null
    space.events[0].created_by = null
    space.photos[0].uploaded_by = null
    space.pings = [
      {
        id: 'ping',
        couple_id: space.couple!.id,
        sender_id: null,
        kind: '想你',
        created_at: new Date().toISOString(),
      },
    ]
    const raw = encodeSpaceCache(space.me.id, space, now)
    const restored = decodeSpaceCache(raw, space.me.id, now)
    expect(restored?.space.messages[0].sender_id).toBeNull()
    expect(restored?.space.events[0].created_by).toBeNull()
    expect(restored?.space.photos[0].uploaded_by).toBeNull()
    expect(restored?.space.pings[0].sender_id).toBeNull()
  })
})
