export type DeviceActivityHeartbeat = { start: () => void; stop: () => void }
/**
 * While the app is visible, periodically tell the server this installation is
 * active so webhook push functions defer to Supabase Realtime instead of firing
 * a duplicate system notification. Hidden/backgrounded tabs and apps stop
 * beating, which is exactly when FCM should take over. The heartbeat is
 * best-effort: failures are swallowed and never surface as user errors.
 */
export function createDeviceActivityHeartbeat(
  touch: () => Promise<unknown>,
  options: { intervalMs?: number; now?: () => number } = {},
): DeviceActivityHeartbeat {
  const intervalMs = options.intervalMs ?? 60_000
  const now = options.now ?? (() => Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  let lastTouch = Number.NEGATIVE_INFINITY
  let stopped = false
  const beat = () => {
    if (stopped || (typeof document !== 'undefined' && document.hidden)) return
    const current = now()
    if (current - lastTouch < intervalMs) return
    lastTouch = current
    void touch().catch(() => {})
  }
  const onVisibility = () => beat()
  return {
    start() {
      if (timer !== undefined || stopped) return
      beat()
      timer = setInterval(beat, intervalMs)
      if (typeof document !== 'undefined')
        document.addEventListener('visibilitychange', onVisibility)
    },
    stop() {
      stopped = true
      if (timer !== undefined) clearInterval(timer)
      timer = undefined
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
