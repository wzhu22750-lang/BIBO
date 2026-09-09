import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearImageCache,
  getCachedImage,
  imageCacheKey,
  removeCachedImage,
  resetImageCacheForTests,
} from './imageCache'

const source = 'https://storage.example.test/sign/couple/photo.jpg?token=one'
const key = 'photo:couple:couple/user/photo.jpg:2026-09-08T00:00:00.000Z'

beforeEach(async () => {
  await resetImageCacheForTests()
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:cached-photo'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('persistent photo cache contract', () => {
  it('uses a stable path and metadata generation instead of signed URL tokens', () => {
    expect(
      imageCacheKey({
        couple_id: 'couple',
        path: 'couple/user/photo.jpg',
        created_at: '2026-09-08T00:00:00.000Z',
      }),
    ).toBe(key)
    expect(
      imageCacheKey({
        couple_id: 'couple',
        path: 'couple/user/photo.jpg',
        created_at: '2026-09-09T00:00:00.000Z',
      }),
    ).not.toBe(key)
  })

  it('shares a concurrent download and serves the cached object on later reads', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(new Blob(['pixels'], { type: 'image/png' })))
    vi.stubGlobal('fetch', fetcher)
    const [first, second] = await Promise.all([
      getCachedImage(source, key),
      getCachedImage(source, key),
    ])
    expect(first).toBe('blob:cached-photo')
    expect(second).toBe(first)
    expect(fetcher).toHaveBeenCalledTimes(1)

    const nextUrl = source.replace('one', 'two')
    expect(await getCachedImage(nextUrl, key)).toBe(first)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('refreshes an expired signed URL on an authorization response', async () => {
    const freshSource = source.replace('one', 'fresh')
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('expired', { status: 403 }))
      .mockResolvedValueOnce(new Response(new Blob(['pixels'], { type: 'image/png' })))
    const refreshSource = vi.fn().mockResolvedValue(freshSource)
    vi.stubGlobal('fetch', fetcher)
    expect(await getCachedImage(source, key, refreshSource)).toBe('blob:cached-photo')
    expect(refreshSource).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenNthCalledWith(2, freshSource, {
      cache: 'no-store',
      credentials: 'omit',
    })
  })

  it('serves a cached photo without a signed URL after an offline snapshot restore', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(new Blob(['pixels']))))
    vi.stubGlobal('fetch', fetcher)
    const online = await getCachedImage(source, key)
    const offline = await getCachedImage(undefined, key)
    expect(offline).toBe(online)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('removes a deleted photo so a later load downloads it again', async () => {
    const fetcher = vi.fn(() => Promise.resolve(new Response(new Blob(['pixels']))))
    vi.stubGlobal('fetch', fetcher)
    await getCachedImage(source, key)
    await removeCachedImage(key)
    await getCachedImage(source, key)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not repopulate the cache after a clear races an in-flight download', async () => {
    let resolveResponse: ((response: Response) => void) | undefined
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve
        }),
    )
    vi.stubGlobal('fetch', fetcher)
    const loading = getCachedImage(source, key)
    await Promise.resolve()
    await clearImageCache()
    resolveResponse?.(new Response(new Blob(['late pixels'], { type: 'image/png' })))
    await expect(loading).rejects.toThrow('失效')
    expect(await getCachedImage(undefined, key).catch(() => null)).toBeNull()
  })

  it('does not download inline demo images', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    const inline = 'data:image/png;base64,AAAA'
    expect(await getCachedImage(inline, key)).toBe(inline)
    expect(fetcher).not.toHaveBeenCalled()
  })
})
