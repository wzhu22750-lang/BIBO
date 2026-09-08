import { describe, expect, it, vi } from 'vitest'
import { cleanupAccountLocal } from './accountCleanup'
function deps(overrides: Partial<Parameters<typeof cleanupAccountLocal>[0]> = {}) {
  return {
    clearSpaceCache: vi.fn(),
    clearOutbox: vi.fn().mockResolvedValue(undefined),
    removeSavedEmail: vi.fn(),
    listReminders: vi.fn().mockResolvedValue({ supported: true, items: [{ id: 1 }, { id: 2 }] }),
    cancelReminder: vi.fn().mockResolvedValue({ supported: true }),
    ...overrides,
  }
}
describe('post-deletion local cleanup', () => {
  it('clears cache, outbox, saved email and every local reminder after server confirmation', async () => {
    const d = deps()
    expect(await cleanupAccountLocal(d)).toEqual([])
    expect(d.clearSpaceCache).toHaveBeenCalledOnce()
    expect(d.clearOutbox).toHaveBeenCalledOnce()
    expect(d.removeSavedEmail).toHaveBeenCalledOnce()
    expect(d.cancelReminder).toHaveBeenNthCalledWith(1, 1)
    expect(d.cancelReminder).toHaveBeenNthCalledWith(2, 2)
  })
  it('attempts all independent cleanup steps and reports local failures', async () => {
    const d = deps({
      clearSpaceCache: vi.fn(() => {
        throw new Error('quota')
      }),
      clearOutbox: vi.fn().mockRejectedValue(new Error('locked')),
      removeSavedEmail: vi.fn(() => {
        throw new Error('storage')
      }),
      cancelReminder: vi.fn().mockRejectedValue(new Error('denied')),
    })
    const errors = await cleanupAccountLocal(d)
    expect(errors).toHaveLength(5)
    expect(d.cancelReminder).toHaveBeenCalledTimes(2)
  })
  it('does not attempt reminders when the platform does not support them', async () => {
    const d = deps({ listReminders: vi.fn().mockResolvedValue({ supported: false, items: [] }) })
    expect(await cleanupAccountLocal(d)).toEqual([])
    expect(d.cancelReminder).not.toHaveBeenCalled()
  })
})
