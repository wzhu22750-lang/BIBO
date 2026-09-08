import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
}))
vi.mock('./supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./supabase')>()),
  db: () => ({ from: mocks.from }),
}))
import { readLinkedRecord } from './api'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.from.mockReturnValue({ select: mocks.select })
  mocks.select.mockReturnValue({ eq: mocks.eq })
  mocks.eq.mockReturnValue({ eq: mocks.eq, maybeSingle: mocks.maybeSingle })
})
describe('reference lookup outside paginated history', () => {
  it('queries one message with both current-space and record filters', async () => {
    const record = { id: 'old', couple_id: 'space', content: 'older than latest 200' }
    mocks.maybeSingle.mockResolvedValue({ data: record, error: null })
    expect(await readLinkedRecord('space', 'message', 'old')).toEqual({ kind: 'message', record })
    expect(mocks.from).toHaveBeenCalledWith('messages')
    expect(mocks.eq.mock.calls).toEqual([
      ['couple_id', 'space'],
      ['id', 'old'],
    ])
  })
  it('queries events through the same scoped boundary', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'event' }, error: null })
    expect((await readLinkedRecord('space', 'event', 'event'))?.kind).toBe('event')
    expect(mocks.from).toHaveBeenCalledWith('events')
    expect(mocks.eq.mock.calls).toEqual([
      ['couple_id', 'space'],
      ['id', 'event'],
    ])
  })
  it('distinguishes inaccessible or deleted records from network errors', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await readLinkedRecord('space', 'message', 'gone')).toBeNull()
    const error = { message: 'offline', code: 'network' }
    mocks.maybeSingle.mockResolvedValue({ data: null, error })
    await expect(readLinkedRecord('space', 'message', 'gone')).rejects.toBe(error)
  })
  it('does not issue a query for an invalid ID', async () => {
    await expect(readLinkedRecord('space', 'event', '../another')).rejects.toThrow('ID')
    expect(mocks.from).not.toHaveBeenCalled()
  })
})
