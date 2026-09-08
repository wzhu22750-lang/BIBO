import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpaceController } from './useSpace'
import { errorText } from '../lib/supabase'
import type { LovePingKind } from '../lib/ping'
import { useToast } from '../components/ui'
// Shared by Home and the central dock: switching routes cannot bypass cooldown.
export function useBibu(controller: SpaceController, demo: boolean) {
  const [busy, setBusy] = useState(false),
    [cooling, setCooling] = useState(false)
  const locked = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const toast = useToast()
  const [kind, setKind] = useState<LovePingKind>('哔卟哔卟')
  useEffect(() => () => clearTimeout(timer.current), [])
  const send = useCallback(async () => {
    if (locked.current || !controller.space?.partner) return
    locked.current = true
    setBusy(true)
    try {
      await controller.sendPing(kind)
      setCooling(true)
      timer.current = setTimeout(() => {
        locked.current = false
        setCooling(false)
      }, 3000)
      if (!demo) toast('哔卟已发出！对方在线时可实时收到；暂无送达回执。')
    } catch (error) {
      locked.current = false
      toast(errorText(error), true)
    } finally {
      setBusy(false)
    }
  }, [controller, demo, toast, kind])
  return {
    send,
    busy,
    cooling,
    kind,
    setKind,
    disabled: busy || cooling || !controller.space?.partner,
  }
}
export type BibuAction = ReturnType<typeof useBibu>
