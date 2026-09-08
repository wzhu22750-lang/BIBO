import { describe, expect, it, vi } from 'vitest'
import { registerDevicePush, unregisterDevicePush } from './pushRegistration'
function native(registerResult: any, unregisterResult: any = { supported: true }) {
  return {
    push: {
      register: vi.fn().mockResolvedValue(registerResult),
      unregister: vi.fn().mockResolvedValue(unregisterResult),
    },
  } as any
}
function backend() {
  return {
    registerDeviceInstallation: vi.fn().mockResolvedValue({}),
    removeDeviceInstallation: vi.fn().mockResolvedValue(undefined),
  }
}
describe('push registration boundary', () => {
  it('stores only a successful native token and keeps Web unsupported', async () => {
    const api = backend()
    const first = await registerDevicePush(
      'u',
      '1.2.3',
      native({ supported: false, reason: 'Web' }),
      api,
    )
    expect(first.stored).toBeUndefined()
    const second = await registerDevicePush(
      'u',
      '1.2.3',
      native({ supported: true, token: 'token-value-that-is-long-enough' }),
      api,
    )
    expect(second.stored).toBe(true)
    expect(api.registerDeviceInstallation).toHaveBeenCalledWith(
      'u',
      'token-value-that-is-long-enough',
      '1.2.3',
    )
  })
  it('does not remove a server token when native unregister fails', async () => {
    const api = backend()
    await unregisterDevicePush(
      'u',
      'token',
      native({}, { supported: false, reason: 'permission' }),
      api,
    )
    expect(api.removeDeviceInstallation).not.toHaveBeenCalled()
  })
  it('removes only this device token after native unregister succeeds', async () => {
    const api = backend()
    await unregisterDevicePush('u', 'token', native({}, { supported: true }), api)
    expect(api.removeDeviceInstallation).toHaveBeenCalledWith('u', 'token')
  })
  it('does not guess which server token belongs to this device', async () => {
    const api = backend()
    await unregisterDevicePush('u', undefined, native({}, { supported: true }), api)
    expect(api.removeDeviceInstallation).not.toHaveBeenCalled()
  })
})
