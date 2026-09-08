import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequestDeadlineError, withRequestDeadline } from './requestDeadline'
import { retryableOutboxError } from './outbox'
afterEach(() => vi.useRealTimers())
describe('bounded message request', () => {
  it('resolves successful responses without leaving a timer', async () => {
    vi.useFakeTimers()
    expect(await withRequestDeadline(async () => ({ id: 'same' }))).toEqual({ id: 'same' })
    expect(vi.getTimerCount()).toBe(0)
  })
  it('aborts a hanging transport and releases the waiter at deadline', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    const result = withRequestDeadline((s) => {
      signal = s
      return new Promise(() => {})
    })
    const checked = expect(result).rejects.toBeInstanceOf(RequestDeadlineError)
    await vi.advanceTimersByTimeAsync(20000)
    await checked
    expect(signal?.aborted).toBe(true)
    expect(retryableOutboxError(new RequestDeadlineError())).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('never turns a late success into a second completion', async () => {
    vi.useFakeTimers()
    let resolve!: (value: string) => void
    const completed = vi.fn(),
      failed = vi.fn()
    const result = withRequestDeadline(
      () =>
        new Promise<string>((r) => {
          resolve = r
        }),
    ).then(completed, failed)
    await vi.advanceTimersByTimeAsync(20000)
    await result
    resolve('late server commit')
    await Promise.resolve()
    expect(completed).not.toHaveBeenCalled()
    expect(failed).toHaveBeenCalledOnce()
  })
  it('preserves immediate transport errors and clears timer', async () => {
    vi.useFakeTimers()
    const error = { code: '42501', message: 'denied' }
    await expect(
      withRequestDeadline(() => {
        throw error
      }),
    ).rejects.toBe(error)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('read request deadline', () => {
  it('uses read-specific error text without claiming a message was queued', async () => {
    vi.useFakeTimers()
    const request = withRequestDeadline(
      () => new Promise(() => {}),
      20000,
      '空间读取超时（network timeout）',
    )
    const checked = expect(request).rejects.toThrow('空间读取超时')
    await vi.advanceTimersByTimeAsync(20000)
    await checked
  })
})
