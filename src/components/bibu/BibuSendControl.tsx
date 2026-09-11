import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent,
} from 'react'
import { motion, AnimatePresence, useReducedMotion, useMotionValue } from 'framer-motion'
import { lovePings, type LovePingKind } from '../../lib/ping'
import type { BibuAction } from '../../hooks/useBibu'
import { BibuNative } from '../../native'
import { EventArt } from '../EventArt'
import {
  computeSlotGeometries,
  gestureReducer,
  stepGesture,
  getBibuTipText,
  initialGestureState,
  resolveHitCandidate,
  ARC_Y_OFFSETS,
  LONG_PRESS_DURATION_MS,
  type PickerBounds,
  type SlotGeometry,
} from './bibuGestureLogic'
import './BibuSendControl.css'

const SHORT_LABELS: Record<LovePingKind, string> = {
  哔卟哔卟: '哔卟',
  想你: '想你',
  抱一下: '抱抱',
  快来: '快来',
  晚安: '晚安',
  我回来啦: '回啦',
}

export interface BibuSendControlProps {
  bibu: BibuAction
  isMoreOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BibuSendControl({ bibu, isMoreOpen, onOpenChange }: BibuSendControlProps) {
  const [state, dispatch] = useReducer(gestureReducer, initialGestureState)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')
  const prefersReducedMotion = useReducedMotion() ?? false

  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const slotButtonRefs = useRef<Map<LovePingKind, HTMLButtonElement>>(new Map())

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const suppressNextClickRef = useRef(false)
  const hasPointerCaptureRef = useRef(false)
  const trackBoundsRef = useRef<PickerBounds | null>(null)
  const slotsRef = useRef<SlotGeometry[]>([])

  const followerX = useMotionValue(0)
  const followerY = useMotionValue(0)

  const isPickerOpen = state.status === 'dragging' || state.status === 'pinned'
  const isPressing = state.status === 'pressing'

  // 通知父组件选择器开关，用于和“更多”菜单互斥
  useEffect(() => {
    onOpenChange?.(isPickerOpen)
  }, [isPickerOpen, onOpenChange])

  // 当外部“更多”菜单打开时，自动收起当前选择器
  useEffect(() => {
    if (isMoreOpen && isPickerOpen) {
      dispatch({ type: 'CANCEL_ALL' })
    }
  }, [isMoreOpen, isPickerOpen])

  // 当 disabled 状态改变时自动清理手势
  useEffect(() => {
    if (bibu.disabled && state.status !== 'idle') {
      dispatch({ type: 'DISABLED_CHANGE', disabled: true })
    }
  }, [bibu.disabled, state.status])

  // 测量固定布局槽位几何信息（与渲染动画分离）
  const measureTrack = useCallback(() => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const bounds: PickerBounds = {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    }
    trackBoundsRef.current = bounds
    slotsRef.current = computeSlotGeometries(bounds, lovePings)
  }, [])

  // 展开时及窗口 resize 时重新测量
  useEffect(() => {
    if (isPickerOpen) {
      // 下一帧测量，确保 DOM 已经布局就绪
      const raf = requestAnimationFrame(() => {
        measureTrack()
      })
      window.addEventListener('resize', measureTrack)
      window.addEventListener('orientationchange', measureTrack)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', measureTrack)
        window.removeEventListener('orientationchange', measureTrack)
      }
    }
  }, [isPickerOpen, measureTrack])

  // 离散候选项变化时更新屏幕阅读器播报（避免逐帧频繁播报）
  useEffect(() => {
    if (state.candidateKind) {
      setLiveAnnouncement(`已选中「${state.candidateKind}」`)
    } else if (state.isCancelled) {
      setLiveAnnouncement('已移出有效区域，松手取消')
    }
  }, [state.candidateKind, state.isCancelled])

  // 处理全局点击外部关闭、窗口失焦、指针取消清理与全局 Escape 快捷键
  useEffect(() => {
    const cancelAll = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = undefined
      }
      followerX.set(0)
      followerY.set(0)
      dispatch({ type: 'CANCEL_ALL' })
    }

    const handlePointerDownOutside = (e: globalThis.PointerEvent) => {
      if (!isPickerOpen) return
      if (
        e.target instanceof Node &&
        !pickerRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        cancelAll()
      }
    }

    const handleWindowBlur = () => {
      cancelAll()
    }

    const handlePointerCancelGlobal = (e: PointerEvent) => {
      if (state.activePointerId !== null && state.activePointerId === e.pointerId) {
        cancelAll()
      }
    }

    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        cancelAll()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('pointercancel', handlePointerCancelGlobal)
    window.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('pointercancel', handlePointerCancelGlobal)
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isPickerOpen, state.activePointerId, followerX, followerY])

  // 清理长按计时器
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const onPointerMove = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      if (state.activePointerId !== null && state.activePointerId !== pointerId) {
        return
      }

      if (state.status === 'pressing') {
        const result = stepGesture(state, {
          type: 'MOVE_BEFORE_THRESHOLD',
          x: clientX,
          y: clientY,
        })
        if (result.effect?.type === 'SUPPRESS_CLICK') {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = undefined
          }
          suppressNextClickRef.current = true
          dispatch({ type: 'MOVE_BEFORE_THRESHOLD', x: clientX, y: clientY })
        }
        return
      }

      if (state.status === 'dragging') {
        // 检查并实时测量
        if (!trackBoundsRef.current || slotsRef.current.length === 0) {
          measureTrack()
        }
        const bounds = trackBoundsRef.current
        if (!bounds) return

        const hit = resolveHitCandidate(
          clientX,
          clientY,
          bounds,
          slotsRef.current,
          state.candidateKind,
        )

        const result = stepGesture(state, {
          type: 'DRAG_MOVE',
          x: clientX,
          y: clientY,
          candidate: hit.candidate,
          isCancelled: hit.isCancelled,
        })

        dispatch({
          type: 'DRAG_MOVE',
          x: clientX,
          y: clientY,
          candidate: hit.candidate,
          isCancelled: hit.isCancelled,
        })

        if (result.effect?.type === 'VIBRATE_SLOT') {
          void BibuNative.vibration.pulse([20]).catch(() => {})
        }

        // 跟手微偏移（最大不超过 4px，采用 motion values 避免 React 重渲染）
        if (!prefersReducedMotion && hit.candidate) {
          const slot = slotsRef.current.find((s) => s.kind === hit.candidate)
          if (slot) {
            const dx = Math.max(-4, Math.min(4, (clientX - slot.centerX) * 0.15))
            const dy = Math.max(-4, Math.min(4, (clientY - slot.centerY) * 0.15))
            followerX.set(dx)
            followerY.set(dy)
          }
        } else {
          followerX.set(0)
          followerY.set(0)
        }
      }
    },
    [state, measureTrack, prefersReducedMotion, followerX, followerY],
  )

  const onPointerUp = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      if (state.activePointerId !== null && state.activePointerId !== pointerId) {
        return
      }

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = undefined
      }

      if (hasPointerCaptureRef.current && triggerRef.current) {
        try {
          if (triggerRef.current.hasPointerCapture(pointerId)) {
            triggerRef.current.releasePointerCapture(pointerId)
          }
        } catch {
          // 忽略不支持或异常情况
        }
        hasPointerCaptureRef.current = false
      }

      followerX.set(0)
      followerY.set(0)

      if (state.status === 'dragging') {
        // 松手坐标最终确认
        let finalCandidate = state.candidateKind
        let finalCancelled = state.isCancelled

        if (trackBoundsRef.current && slotsRef.current.length > 0) {
          const hit = resolveHitCandidate(
            clientX,
            clientY,
            trackBoundsRef.current,
            slotsRef.current,
            state.candidateKind,
          )
          finalCandidate = hit.candidate
          finalCancelled = hit.isCancelled
        }

        // 如果从未进入过任何情绪槽位且松手位置仍在触发按钮附近（原地长按），判定为保留模式，不判定为取消
        const distFromStart = Math.hypot(clientX - state.startX, clientY - state.startY)
        if (!state.hasEnteredSlot && distFromStart <= 24) {
          finalCancelled = false
          finalCandidate = null
        }

        const result = stepGesture(state, {
          type: 'POINTER_UP',
          candidate: finalCandidate,
          isCancelled: finalCancelled,
        })

        suppressNextClickRef.current = true
        dispatch({
          type: 'POINTER_UP',
          candidate: finalCandidate,
          isCancelled: finalCancelled,
        })

        if (result.effect?.type === 'SEND_PING') {
          void BibuNative.vibration.pulse([35]).catch(() => {})
          void bibu.send(result.effect.kind)
        }
      } else if (state.status === 'pressing') {
        dispatch({
          type: 'POINTER_UP',
          candidate: null,
          isCancelled: false,
        })
      }
    },
    [state, bibu, followerX, followerY],
  )

  // 指针全局回退监听：当未获得指针捕获（如某些环境不支持 setPointerCapture 或捕获失败）或移出元素时，
  // 依然能通过 window 层跟踪 move / up / cancel，避免滑动松手卡住
  useEffect(() => {
    if (state.status !== 'pressing' && state.status !== 'dragging') return

    const handleWindowPointerMove = (e: globalThis.PointerEvent) => {
      onPointerMove(e.clientX, e.clientY, e.pointerId)
    }

    const handleWindowPointerUp = (e: globalThis.PointerEvent) => {
      onPointerUp(e.clientX, e.clientY, e.pointerId)
    }

    const handleWindowPointerCancel = (e: globalThis.PointerEvent) => {
      if (state.activePointerId !== null && state.activePointerId !== e.pointerId) return
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = undefined
      }
      followerX.set(0)
      followerY.set(0)
      dispatch({ type: 'CANCEL_ALL' })
    }

    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true })
    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerCancel)

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove)
      window.removeEventListener('pointerup', handleWindowPointerUp)
      window.removeEventListener('pointercancel', handleWindowPointerCancel)
    }
  }, [state.status, state.activePointerId, onPointerMove, onPointerUp, followerX, followerY])

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (bibu.disabled || !e.isPrimary || e.button !== 0) return

    suppressNextClickRef.current = false

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
      hasPointerCaptureRef.current = true
    } catch {
      hasPointerCaptureRef.current = false
    }

    const result = stepGesture(state, {
      type: 'POINTER_DOWN',
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      defaultKind: bibu.kind,
    })

    if (result.state !== state) {
      dispatch({
        type: 'POINTER_DOWN',
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        defaultKind: bibu.kind,
      })

      longPressTimerRef.current = setTimeout(() => {
        const fireResult = stepGesture(result.state, {
          type: 'LONG_PRESS_FIRED',
          initialCandidate: bibu.kind,
        })
        dispatch({
          type: 'LONG_PRESS_FIRED',
          initialCandidate: bibu.kind,
        })
        if (fireResult.effect?.type === 'VIBRATE_OPEN') {
          void BibuNative.vibration.pulse([25]).catch(() => {})
        }
      }, LONG_PRESS_DURATION_MS)
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerMove(e.clientX, e.clientY, e.pointerId)
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    onPointerUp(e.clientX, e.clientY, e.pointerId)
  }

  const handlePointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (state.activePointerId !== null && state.activePointerId !== e.pointerId) {
      return
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = undefined
    }

    if (hasPointerCaptureRef.current) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {
        // 忽略
      }
      hasPointerCaptureRef.current = false
    }

    followerX.set(0)
    followerY.set(0)
    dispatch({ type: 'CANCEL_ALL' })
  }

  const handleLostPointerCapture = () => {
    hasPointerCaptureRef.current = false
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressNextClickRef.current = false
      return
    }
    if (isPickerOpen) return
    void bibu.send()
  }

  // -------------------------------------------------------------
  // 键盘无障碍支持（方向键展开/切换、Enter 发送、Escape 关闭回焦）
  // -------------------------------------------------------------

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (bibu.disabled) return

    if (e.key === 'ArrowUp' || (e.altKey && e.key === 'ArrowDown')) {
      e.preventDefault()
      dispatch({ type: 'KEYBOARD_OPEN', defaultKind: bibu.kind })
      // 聚焦当前选中的情绪项
      requestAnimationFrame(() => {
        const btn = slotButtonRefs.current.get(bibu.kind)
        btn?.focus()
      })
    }
  }

  const handlePickerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      dispatch({ type: 'CANCEL_ALL' })
      triggerRef.current?.focus()
      return
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const result = stepGesture(state, {
        type: 'KEYBOARD_NAV',
        direction: 'prev',
        currentItems: lovePings,
      })
      dispatch({
        type: 'KEYBOARD_NAV',
        direction: 'prev',
        currentItems: lovePings,
      })
      if (result.state.candidateKind) {
        const btn = slotButtonRefs.current.get(result.state.candidateKind)
        btn?.focus()
      }
      return
    }

    if (e.key === 'Tab') {
      const currentActive = document.activeElement
      const slots = Array.from(slotButtonRefs.current.values())
      if (slots.length === 0) return

      const currentIndex = slots.indexOf(currentActive as HTMLButtonElement)
      let nextIndex = 0

      if (e.shiftKey) {
        nextIndex = currentIndex <= 0 ? slots.length - 1 : currentIndex - 1
      } else {
        nextIndex = currentIndex === -1 || currentIndex >= slots.length - 1 ? 0 : currentIndex + 1
      }

      e.preventDefault()
      const nextBtn = slots[nextIndex]
      const nextKind = lovePings[nextIndex]?.kind
      if (nextBtn && nextKind) {
        nextBtn.focus()
        dispatch({
          type: 'KEYBOARD_NAV',
          direction: e.shiftKey ? 'prev' : 'next',
          currentItems: lovePings,
        })
      }
      return
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const result = stepGesture(state, {
        type: 'KEYBOARD_NAV',
        direction: 'next',
        currentItems: lovePings,
      })
      dispatch({
        type: 'KEYBOARD_NAV',
        direction: 'next',
        currentItems: lovePings,
      })
      if (result.state.candidateKind) {
        const btn = slotButtonRefs.current.get(result.state.candidateKind)
        btn?.focus()
      }
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = state.candidateKind || bibu.kind
      dispatch({ type: 'PIN_SELECT', kind: target })
      void BibuNative.vibration.pulse([35]).catch(() => {})
      void bibu.send(target)
      triggerRef.current?.focus()
    }
  }

  // 渲染提示文案
  const tipText = getBibuTipText(state, bibu.kind)

  // Framer Motion 弹簧动画参数
  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.7 }

  return (
    <div className="bibu-send-control">
      {/* 屏幕阅读器实时播报区 */}
      <div className="bibu-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* 情绪小扇面弹层 */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            ref={pickerRef}
            id="bibu-arc-picker"
            className="bibu-arc-picker"
            role="dialog"
            aria-label="选择想发送的心情"
            onKeyDown={handlePickerKeyDown}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.92 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.94 }}
            transition={springTransition}
            style={{ x: 0 }}
          >
            {/* 顶端单行清晰提示 */}
            <div
              className={`bibu-picker-tip ${state.isCancelled ? 'tip-cancelled' : ''} ${state.candidateKind ? 'tip-selected' : ''}`}
            >
              {tipText}
            </div>

            {/* 浅弧形固定几何槽位轨道 */}
            <div ref={trackRef} className="bibu-arc-track">
              {lovePings.map((item, index) => {
                const isSelected = state.candidateKind === item.kind
                const arcOffsetY = ARC_Y_OFFSETS[index] ?? 0

                // 选中项轻抬 8–12px，放大至 1.15
                const liftY = isSelected ? arcOffsetY - 10 : arcOffsetY
                const targetScale = isSelected ? 1.15 : 1

                return (
                  <button
                    key={item.kind}
                    ref={(el) => {
                      if (el) slotButtonRefs.current.set(item.kind, el)
                      else slotButtonRefs.current.delete(item.kind)
                    }}
                    data-kind={item.kind}
                    type="button"
                    className={`bibu-arc-slot ${isSelected ? 'is-selected' : ''}`}
                    aria-label={`心情：${item.kind}`}
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch({ type: 'PIN_SELECT', kind: item.kind })
                      void BibuNative.vibration.pulse([35]).catch(() => {})
                      void bibu.send(item.kind)
                      triggerRef.current?.focus()
                    }}
                  >
                    <motion.div
                      className="bibu-arc-content"
                      animate={{
                        y: liftY,
                        scale: targetScale,
                      }}
                      style={
                        isSelected && !prefersReducedMotion
                          ? { x: followerX, y: followerY }
                          : undefined
                      }
                      transition={springTransition}
                    >
                      <span className="bibu-arc-icon-wrap" aria-hidden="true">
                        <EventArt value={item.art} size={28} />
                      </span>
                      <span className="bibu-arc-name">{SHORT_LABELS[item.kind] ?? item.kind}</span>
                    </motion.div>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部中央 BIBU 触发按钮 */}
      <button
        ref={triggerRef}
        type="button"
        className={`dock-bibo ${isPressing ? 'is-pressing' : ''} ${isPickerOpen ? 'selector-active' : ''}`}
        disabled={bibu.disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onClick={handleClick}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="dialog"
        aria-expanded={isPickerOpen}
        aria-controls={isPickerOpen ? 'bibu-arc-picker' : undefined}
        aria-label={`BIBU！，长按滑动切换情绪，当前：${state.candidateKind || bibu.kind}`}
        title={`点击发送，长按滑动切换：${bibu.kind}`}
      >
        <svg viewBox="0 0 76 76" aria-hidden="true" shapeRendering="crispEdges">
          <path
            fill="#20211d"
            d="M20 0h36v4h8v8h8v8h4v36h-4v8h-8v8h-8v4H20v-4h-8v-8H4v-8H0V20h4v-8h8V4h8z"
          />
          <path
            fill="#04bcf0"
            d="M20 4h36v4h8v8h4v8h4v28h-4v8h-8v8h-8v4H24v-4h-8v-8H8v-8H4V24h4v-8h8V8h4z"
          />
          <path
            className="dock-bibo-face"
            fill={isPickerOpen ? '#ff85d8' : '#fff238'}
            d="M24 8h28v4h8v8h4v36h-4v8H20v-4h-8V20h4v-8h8z"
          />
          <path
            fill="#20211d"
            d="M20 24h12v4h4v4h4v-4h4v-4h12v4h4v16h-4v4h-4v4h-4v4h-4v4H32v-4h-4v-4h-4v-4h-4v-4h-4V28h4z"
          />
          <path fill="#fffef7" d="M24 28h8v4h-8z" />
        </svg>
      </button>

      {/* 按钮下方状态标签 */}
      <span className={`bibu-dock-label ${isPickerOpen ? 'selecting' : ''}`}>
        {isPickerOpen ? state.candidateKind || bibu.kind : 'BIBU！'}
      </span>
    </div>
  )
}
