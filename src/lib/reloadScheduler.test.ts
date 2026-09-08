import { afterEach, describe, expect, it, vi } from 'vitest'
import { createReloadScheduler } from './reloadScheduler'
afterEach(() => vi.useRealTimers())
describe('bounded realtime coalescing', () => {
  it('does not starve under events arriving faster than its window', async () => {
    vi.useFakeTimers()
    const load = vi.fn().mockResolvedValue(undefined)
    const scheduler = createReloadScheduler(load, vi.fn())
    for (let i = 0; i < 20; i++) {
      scheduler.schedule()
      await vi.advanceTimersByTimeAsync(50)
    }
    expect(load.mock.calls.length).toBeGreaterThanOrEqual(4)
    scheduler.dispose()
  })
  it('never overlaps reads and schedules one catch-up after in-flight events', async () => {
    vi.useFakeTimers()
    let finish!: () => void
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((r) => {
            finish = r
          }),
      )
      .mockResolvedValue(undefined)
    const scheduler = createReloadScheduler(load, vi.fn())
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(180)
    for (let i = 0; i < 100; i++) scheduler.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(load).toHaveBeenCalledTimes(1)
    finish()
    await vi.advanceTimersByTimeAsync(180)
    expect(load).toHaveBeenCalledTimes(2)
    scheduler.dispose()
  })
  it('cancels pending work and ignores late in-flight completions after disposal', async () => {
    vi.useFakeTimers()
    let finish!: () => void
    const load = vi.fn(
      () =>
        new Promise<void>((r) => {
          finish = r
        }),
    )
    const scheduler = createReloadScheduler(load, vi.fn())
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(180)
    scheduler.schedule()
    scheduler.dispose()
    finish()
    await vi.advanceTimersByTimeAsync(1000)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(load).toHaveBeenCalledTimes(1)
  })
  it('reports an error but accepts later requests', async () => {
    vi.useFakeTimers()
    const error = new Error('offline'),
      report = vi.fn()
    const load = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(undefined)
    const scheduler = createReloadScheduler(load, report)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(180)
    expect(report).toHaveBeenCalledWith(error)
    scheduler.schedule()
    await vi.advanceTimersByTimeAsync(180)
    expect(load).toHaveBeenCalledTimes(2)
    scheduler.dispose()
  })
})
