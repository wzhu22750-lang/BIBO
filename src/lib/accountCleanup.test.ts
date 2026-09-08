import { describe, expect, it, vi } from 'vitest'
import { cleanupAccountLocal, cleanupSessionPrivacy } from './accountCleanup'
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

describe('session privacy cleanup', () => {
  it('removes remote device rows before local push and reminder cleanup', async () => {
    const calls: string[] = []
    const errors = await cleanupSessionPrivacy({
      removeDeviceInstallations: vi.fn(async () => {
        calls.push('remote')
      }),
      unregisterPush: vi.fn(async () => {
        calls.push('push')
      }),
      listReminders: vi.fn(async () => ({ supported: true, items: [{ id: 7 }] })),
      cancelReminder: vi.fn(async () => {
        calls.push('reminder')
      }),
    })
    expect(errors).toEqual([])
    expect(calls).toEqual(['remote', 'push', 'reminder'])
  })
  it('reports remote cleanup failure so the caller can fail closed before signout', async () => {
    const errors = await cleanupSessionPrivacy({
      removeDeviceInstallations: vi.fn().mockRejectedValue(new Error('network')),
      unregisterPush: vi.fn().mockResolvedValue(undefined),
      listReminders: vi.fn().mockResolvedValue({ supported: false, items: [] }),
      cancelReminder: vi.fn(),
    })
    expect(errors[0]).toContain('远程 Push 登记')
  })
})
