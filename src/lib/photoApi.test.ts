import { beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('./supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./supabase')>()
  return { ...actual, db: () => ({ rpc: mocks.rpc }) }
})
import { loadPhotoPage } from './api'
import { PhotoHistoryUnsupportedError } from './photoHistory'
import { missingRpc } from './supabase'
beforeEach(() => {
  vi.clearAllMocks()
})
describe('photo history paging contract', () => {
  it('sends the memory-date cursor and the requested direction', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null })
    await loadPhotoPage(
      'space',
      { id: 'photo', created_at: '2024-05-06T10:00:00.000Z', occurred_on: '2020-01-02' },
      'event',
      'asc',
    )
    expect(mocks.rpc).toHaveBeenCalledWith('photo_history', {
      space_id: 'space',
      before_date: '2020-01-02',
      before_time: '2024-05-06T10:00:00.000Z',
      before_id: 'photo',
      event_filter: 'event',
      order_asc: true,
    })
  })
  it('falls back to the upload date when a memory has no occurrence date', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null })
    await loadPhotoPage(
      'space',
      { id: 'photo', created_at: '2024-05-06T10:00:00.000Z', occurred_on: null },
      null,
      'desc',
    )
    expect(mocks.rpc).toHaveBeenCalledWith(
      'photo_history',
      expect.objectContaining({ before_date: '2024-05-06', order_asc: false }),
    )
  })
  it('reports an un-applied migration as unsupported instead of a raw PostgREST error', async () => {
    const error = {
      code: 'PGRST202',
      message:
        'Could not find the function public.photo_history(before_date, ...) in the schema cache',
    }
    mocks.rpc.mockResolvedValue({ data: null, error })
    expect(missingRpc(error)).toBe(true)
    await expect(loadPhotoPage('space', null, null)).rejects.toBeInstanceOf(
      PhotoHistoryUnsupportedError,
    )
  })
  it('keeps genuine permission errors intact', async () => {
    const error = { code: '42501', message: 'permission denied for function photo_history' }
    mocks.rpc.mockResolvedValue({ data: null, error })
    expect(missingRpc(error)).toBe(false)
    await expect(loadPhotoPage('space', null, null)).rejects.toBe(error)
  })
})
