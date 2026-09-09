import { describe, expect, it, vi } from 'vitest'
import { downloadSpace, exportFilename, exportSpace } from './spaceExport'
import { makeDemo } from './demo'
describe('private space export', () => {
  it('exports loaded records without IDs, signed URLs or credentials', () => {
    const space = makeDemo()
    space.photos[0].url = 'https://private/signed?token=secret'
    space.messages[0].sender_id = null
    space.pings = [
      {
        id: 'p',
        couple_id: 'demo',
        sender_id: null,
        kind: '想你',
        created_at: '2026-09-08T00:00:00Z',
      },
    ]
    const result = exportSpace(space, new Date('2026-09-08T00:00:00Z'))
    const serialized = JSON.stringify(result)
    expect(result.schema).toBe(1)
    expect(result.scope).toBe('currently_loaded')
    expect(result.messages[0].author).toBe('deleted_player')
    expect(result.pings[0].author).toBe('deleted_player')
    expect(result.memories[0].has_photo).toBe(true)
    expect(serialized).not.toContain('token=secret')
    expect(serialized).not.toContain('demo-me')
    expect(serialized).not.toContain('demo-you')
    expect(serialized).not.toContain('bibu-demo-v1')
  })
  it('preserves chronology and event title but never invents missing links', () => {
    const space = makeDemo()
    space.photos[0].event_id = 'missing'
    const result = exportSpace(space)
    expect(result.messages).toHaveLength(space.messages.length)
    expect(result.events).toHaveLength(space.events.length)
    expect(result.memories[0].event_title).toBeNull()
    expect(result.notice).toContain('不包含完整分页历史')
  })
  it('creates a deterministic date filename and delegates a Blob download', () => {
    const space = makeDemo(),
      download = vi.fn(),
      now = new Date('2026-09-08T00:00:00Z')
    const data = downloadSpace(space, now, download)
    expect(exportFilename(now)).toBe('bibu-space-2026-09-08.json')
    expect(download).toHaveBeenCalledWith(expect.any(Blob), 'bibu-space-2026-09-08.json')
    expect(JSON.parse(data).schema).toBe(1)
  })
})
