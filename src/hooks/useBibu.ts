import { useCallback, useEffect, useRef, useState } from 'react'
import type { SpaceController } from './useSpace'
import { errorText } from '../lib/supabase'
import type { LovePingKind } from '../lib/ping'
import { useToast } from '../components/ui'
import { playFeedback } from '../lib/notifications'
// Shared by Home and the central dock: switching routes cannot bypass cooldown.
export function useBibu(controller: SpaceController, demo: boolean) {
  const [busy, setBusy] = useState(false),
    [cooling, setCooling] = useState(false)
  const locked = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const toast = useToast()
  const [kind, setKind] = useState<LovePingKind>('哔卟哔卟')
  useEffect(() => () => clearTimeout(timer.current), [])
  const send = useCallback(
    async (customKind?: LovePingKind) => {
      if (locked.current || !controller.space?.partner) return
      const targetKind = customKind ?? kind
      locked.current = true
      setBusy(true)
      if (customKind && customKind !== kind) {
        setKind(customKind)
      }
      // 立即触发本机声音与震动反馈，给用户零延迟的触觉与听觉反馈
      playFeedback(targetKind)
      try {
        await controller.sendPing(targetKind)
        if (!demo) toast(`「${targetKind}」已送出！`)
      } catch (error) {
        toast(errorText(error), true)
      } finally {
        locked.current = false
        setBusy(false)
        setCooling(false)
      }
    },
    [controller, demo, toast, kind],
  )
  return {
    send,
    busy,
    cooling,
    kind,
    setKind,
    disabled: busy || !controller.space?.partner,
  }
}
export type BibuAction = ReturnType<typeof useBibu>
