import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDeviceActivityHeartbeat } from './deviceActivity'
// The default Vitest environment is node; stub a minimal document that models
// only what the heartbeat uses: hidden flag and visibilitychange listeners.
function stubDocument(hidden = false) {
  const listeners = new Set<() => void>()
  const fake = {
    hidden,
    addEventListener: (_event: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_event: string, fn: () => void) => void listeners.delete(fn),
    emitVisibility() {
      for (const fn of listeners) fn()
    },
    listenerCount: () => listeners.size,
  }
  vi.stubGlobal('document', fake)
  return fake
}
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe('device activity heartbeat', () => {
  it('beats immediately on start, throttles, and beats again after the interval', () => {
    vi.useFakeTimers()
    stubDocument()
    const touch = vi.fn().mockResolvedValue(0)
    const heartbeat = createDeviceActivityHeartbeat(touch, { intervalMs: 60_000 })
    heartbeat.start()
    expect(touch).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(59_000)
    expect(touch).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1_000)
    expect(touch).toHaveBeenCalledTimes(2)
    heartbeat.stop()
    vi.advanceTimersByTime(300_000)
    expect(touch).toHaveBeenCalledTimes(2)
  })
  it('stays silent while the document is hidden so FCM owns the background', () => {
    vi.useFakeTimers()
    const doc = stubDocument(true)
    const touch = vi.fn().mockResolvedValue(0)
    const heartbeat = createDeviceActivityHeartbeat(touch, { intervalMs: 60_000 })
    heartbeat.start()
    expect(touch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(180_000)
    expect(touch).not.toHaveBeenCalled()
    doc.hidden = false
    doc.emitVisibility()
    expect(touch).toHaveBeenCalledTimes(1)
    heartbeat.stop()
  })
  it('swallows failures so a missing RPC or offline moment is never a user error', async () => {
    stubDocument()
    const touch = vi.fn().mockRejectedValue(new Error('rpc missing'))
    const heartbeat = createDeviceActivityHeartbeat(touch, { intervalMs: 60_000 })
    heartbeat.start()
    await Promise.resolve()
    expect(touch).toHaveBeenCalledTimes(1)
    heartbeat.stop()
  })
  it('stop is idempotent, detaches listeners, and start after stop does nothing', () => {
    vi.useFakeTimers()
    const doc = stubDocument()
    const touch = vi.fn().mockResolvedValue(0)
    const heartbeat = createDeviceActivityHeartbeat(touch, { intervalMs: 1000 })
    heartbeat.start()
    expect(doc.listenerCount()).toBe(1)
    heartbeat.stop()
    heartbeat.stop()
    expect(doc.listenerCount()).toBe(0)
    heartbeat.start()
    vi.advanceTimersByTime(10_000)
    expect(touch).toHaveBeenCalledTimes(1)
  })
})
