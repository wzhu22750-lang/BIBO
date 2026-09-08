import { beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryInput } from './memories'
const mocks = vi.hoisted(() => ({
  single: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}))
vi.mock('./supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./supabase')>()
  return { ...actual, db: () => ({ from: mocks.from }) }
})
import { updateMemory } from './api'
import { errorText } from './supabase'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.from.mockReturnValue({ update: mocks.update })
  mocks.update.mockReturnValue({ eq: mocks.eq })
  mocks.eq.mockReturnValue({ select: mocks.select })
  mocks.select.mockReturnValue({ single: mocks.single })
})
describe('memory API confirmed-row contract', () => {
  it('returns the actual server row rather than the submitted object', async () => {
    const saved = { id: 'photo', caption: 'normalized server caption' }
    mocks.single.mockResolvedValue({ data: saved, error: null })
    expect(await updateMemory('photo', 'input', memoryInput())).toBe(saved)
    expect(mocks.from).toHaveBeenCalledWith('photos')
    expect(mocks.eq).toHaveBeenCalledWith('id', 'photo')
    expect(mocks.update).toHaveBeenCalledWith({
      caption: 'input',
      story: '',
      occurred_on: null,
      event_id: null,
      message_id: null,
    })
  })
  it('rejects zero-row writes instead of showing success', async () => {
    mocks.single.mockResolvedValue({ data: null, error: null })
    await expect(updateMemory('photo', 'input', memoryInput())).rejects.toThrow('没有返回数据')
  })
  it('preserves database error identity, code, details and hint', async () => {
    const error = {
      message: 'link rejected',
      code: '23503',
      details: 'cross-space event',
      hint: 'choose a current event',
    }
    mocks.single.mockResolvedValue({ data: null, error })
    await expect(updateMemory('photo', 'input', memoryInput())).rejects.toBe(error)
    expect(errorText(error)).toContain('23503')
    expect(errorText(error)).toContain('cross-space event')
    expect(errorText(error)).toContain('choose a current event')
  })
  it('rejects invalid metadata before sending a write', async () => {
    await expect(
      updateMemory('photo', 'input', { ...memoryInput(), occurred_on: '2025-02-30' }),
    ).rejects.toThrow('日期')
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
