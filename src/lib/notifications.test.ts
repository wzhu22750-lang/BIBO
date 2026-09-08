import { afterEach, describe, expect, it, vi } from 'vitest'
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})
describe('optional device feedback', () => {
  it('does not request device feedback without opt-in', async () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    const feedback = await import('./notifications')
    feedback.playFeedback('想你')
    expect(vibrate).not.toHaveBeenCalled()
  })
  it('reports unavailable audio to the opt-in caller', async () => {
    vi.stubGlobal('AudioContext', undefined)
    const feedback = await import('./notifications')
    await expect(feedback.enableFeedback()).rejects.toThrow('不支持声音')
  })
  it('does not turn an audio device exception into a failed received ping', async () => {
    vi.stubGlobal('navigator', { vibrate: vi.fn() })
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'running'
        resume = async () => {}
        createOscillator() {
          throw new Error('device unavailable')
        }
      },
    )
    const feedback = await import('./notifications')
    await expect(feedback.enableFeedback()).resolves.toBeUndefined()
    expect(() => feedback.playFeedback('想你')).not.toThrow()
  })
  it('handles vibration failure and honors disable after opt-in', async () => {
    const vibrate = vi.fn(() => {
      throw new Error('unsupported')
    })
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'suspended'
        resume = async () => {}
      },
    )
    const feedback = await import('./notifications')
    await expect(feedback.enableFeedback()).resolves.toBeUndefined()
    expect(() => feedback.playFeedback('晚安')).not.toThrow()
    expect(vibrate).toHaveBeenLastCalledWith([100])
    feedback.disableFeedback()
    vibrate.mockClear()
    feedback.playFeedback('想你')
    expect(vibrate).not.toHaveBeenCalled()
  })
})
