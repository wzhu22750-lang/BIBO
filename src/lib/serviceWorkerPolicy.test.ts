import { describe, expect, it } from 'vitest'
import { cacheableShellRequest, isNavigationRequest } from './serviceWorkerPolicy'
const origin = 'https://bibo.example'
const url = (pathname: string, base = origin) => ({ origin: base, pathname })
describe('offline shell cache policy', () => {
  it('caches only same-origin app shell and local demo assets', () => {
    for (const path of [
      '/',
      '/index.html',
      '/assets/app.js',
      '/demo/lake.jpg',
      '/favicon.svg',
      '/sw.js',
    ])
      expect(cacheableShellRequest({ method: 'GET' }, url(path), origin)).toBe(true)
    expect(cacheableShellRequest({ method: 'GET' }, url('/rest/v1/messages'), origin)).toBe(false)
    expect(
      cacheableShellRequest(
        { method: 'GET' },
        url('/storage/v1/object/sign/couple-photos/x.jpg'),
        origin,
      ),
    ).toBe(false)
    expect(
      cacheableShellRequest({ method: 'GET' }, url('/assets/app.js', 'https://evil.test'), origin),
    ).toBe(false)
  })
  it('never caches non-GET writes or remote API responses', () => {
    expect(cacheableShellRequest({ method: 'POST' }, url('/assets/ignored.js'), origin)).toBe(false)
    expect(
      cacheableShellRequest(
        { method: 'GET', destination: 'fetch' },
        url('/functions/v1/delete-account'),
        origin,
      ),
    ).toBe(false)
    expect(
      cacheableShellRequest(
        { method: 'GET', destination: 'script' },
        url('/custom-runtime.js'),
        origin,
      ),
    ).toBe(true)
  })
  it('identifies navigation separately for network-first fallback', () => {
    expect(isNavigationRequest({ mode: 'navigate' })).toBe(true)
    expect(isNavigationRequest({ destination: 'document' })).toBe(true)
    expect(isNavigationRequest({ destination: 'script' })).toBe(false)
  })
})
