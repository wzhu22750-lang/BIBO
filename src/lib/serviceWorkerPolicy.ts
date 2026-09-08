export function cacheableShellRequest(
  input: { method: string; mode?: string; destination?: string },
  url: { origin: string; pathname: string },
  origin: string,
) {
  if (input.method !== 'GET' || url.origin !== origin) return false
  if (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/demo/')
  )
    return true
  return (
    input.destination === 'script' || input.destination === 'style' || input.destination === 'font'
  )
}
export function isNavigationRequest(input: { mode?: string; destination?: string }) {
  return input.mode === 'navigate' || input.destination === 'document'
}
