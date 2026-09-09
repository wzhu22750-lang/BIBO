import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearPendingAccountDeletion,
  markPendingAccountDeletion,
  readPendingAccountDeletion,
} from './accountDeletionRecovery'

function storage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pending account deletion marker', () => {
  it('round-trips a valid local recovery marker', () => {
    vi.stubGlobal('localStorage', storage())
    markPendingAccountDeletion('user-1', 'space-1')
    expect(readPendingAccountDeletion()).toMatchObject({
      userId: 'user-1',
      expectedSpace: 'space-1',
    })
    clearPendingAccountDeletion()
    expect(readPendingAccountDeletion()).toBeNull()
  })

  it('ignores malformed marker data', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '{"userId": "", "requestedAt": "bad"}',
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    expect(readPendingAccountDeletion()).toBeNull()
  })
})
