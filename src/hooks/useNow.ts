import { useEffect, useState } from 'react'
// Refresh day-dependent content and expiring focus after foregrounding without a full reload.
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const update = () => {
      if (!document.hidden) setNow(new Date())
    }
    const timer = setInterval(update, 30_000)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return now
}
