import { lovePings, type LovePingKind } from '../../lib/ping'

export type GestureStatus = 'idle' | 'pressing' | 'dragging' | 'pinned'

export interface GestureState {
  status: GestureStatus
  candidateKind: LovePingKind | null
  hasEnteredSlot: boolean
  isCancelled: boolean
  activePointerId: number | null
  startX: number
  startY: number
  lastX: number
  lastY: number
}

export interface SlotGeometry {
  kind: LovePingKind
  index: number
  centerX: number
  centerY: number
  left: number
  right: number
  top: number
  bottom: number
  arcOffsetY: number
}

export interface PickerBounds {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

// 浅弧反应条在不同位置的垂直微调偏移量（中央两个稍高，两端稍低，形成浅弧）
export const ARC_Y_OFFSETS = [6, 2, 0, 0, 2, 6] as const

// 手势阈值常数
export const MOVE_THRESHOLD_PX = 12
export const HYSTERESIS_PX = 8
export const LONG_PRESS_DURATION_MS = 300
export const CANCEL_BOTTOM_PADDING_PX = 25
export const CANCEL_TOP_PADDING_PX = 50
export const CANCEL_SIDE_PADDING_PX = 25

export const initialGestureState: GestureState = {
  status: 'idle',
  candidateKind: null,
  hasEnteredSlot: false,
  isCancelled: false,
  activePointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
}

/**
 * 根据容器实际边界计算六个情绪槽位的稳定几何数据（脱离动画后的动态变换）。
 */
export function computeSlotGeometries(
  trackBounds: { left: number; top: number; width: number; height: number },
  items: readonly { kind: LovePingKind }[] = lovePings,
): SlotGeometry[] {
  const count = items.length
  if (count === 0) return []

  const slotWidth = trackBounds.width / count
  const slotHeight = trackBounds.height

  return items.map((item, index) => {
    const left = trackBounds.left + index * slotWidth
    const right = left + slotWidth
    const arcOffsetY = ARC_Y_OFFSETS[index] ?? 0
    const top = trackBounds.top + arcOffsetY
    const bottom = top + slotHeight
    const centerX = left + slotWidth / 2
    const centerY = top + slotHeight / 2

    return {
      kind: item.kind,
      index,
      centerX,
      centerY,
      left,
      right,
      top,
      bottom,
      arcOffsetY,
    }
  })
}

/**
 * 手势滑动命中判定（含滞回和滑出/滑回取消）：
 * 1. 超出整体取消边界（往回滑向中心/按钮，或滑出反应条过远）：立刻清空候选，明确标记取消。
 * 2. 在有效热区内：根据 X 轴就近吸附，并为当前选中项提供 ±8px 滞回，防止边界处手抖闪烁。
 */
export function resolveHitCandidate(
  x: number,
  y: number,
  trackBounds: PickerBounds,
  slots: SlotGeometry[],
  currentCandidate: LovePingKind | null,
): { candidate: LovePingKind | null; isCancelled: boolean } {
  if (slots.length === 0) {
    return { candidate: null, isCancelled: true }
  }

  // 1. 滑回中心/按钮方向（下方距离容器过近或超出下方）
  const isTooLow = y > trackBounds.bottom + CANCEL_BOTTOM_PADDING_PX
  // 向上或向左右滑出太远
  const isTooHigh = y < trackBounds.top - CANCEL_TOP_PADDING_PX
  const isTooFarLeft = x < trackBounds.left - CANCEL_SIDE_PADDING_PX
  const isTooFarRight = x > trackBounds.right + CANCEL_SIDE_PADDING_PX

  if (isTooLow || isTooHigh || isTooFarLeft || isTooFarRight) {
    return { candidate: null, isCancelled: true }
  }

  // 2. 滞回判定：如果已有候选项，优先在其扩展热区内判定
  if (currentCandidate) {
    const currentSlot = slots.find((s) => s.kind === currentCandidate)
    if (currentSlot) {
      const minX = currentSlot.left - HYSTERESIS_PX
      const maxX = currentSlot.right + HYSTERESIS_PX
      if (x >= minX && x <= maxX) {
        return { candidate: currentCandidate, isCancelled: false }
      }
    }
  }

  // 3. 在所有槽位中寻找最近槽位
  let closestSlot = slots[0]
  let minDistance = Math.abs(slots[0].centerX - x)

  for (let i = 1; i < slots.length; i++) {
    const dist = Math.abs(slots[i].centerX - x)
    if (dist < minDistance) {
      minDistance = dist
      closestSlot = slots[i]
    }
  }

  return { candidate: closestSlot.kind, isCancelled: false }
}

/**
 * 提示文案纯函数（严格执行规范）：
 * - 初始：“滑向一个心情”
 * - 命中：“松开发送「想你」”
 * - 离开：“松手取消”
 * - 原地松开保留模式：“点一个心情发送”
 */
export function getBibuTipText(
  state: { status: GestureStatus; candidateKind: LovePingKind | null; isCancelled: boolean },
  defaultKind: LovePingKind,
): string {
  if (state.status === 'pinned') {
    return state.candidateKind ? `点击发送「${state.candidateKind}」` : '点一个心情发送'
  }
  if (state.status === 'dragging') {
    if (state.isCancelled) {
      return '松手取消'
    }
    if (state.candidateKind) {
      return `松开发送「${state.candidateKind}」`
    }
    return '滑向一个心情'
  }
  return `长按滑动切换：${defaultKind}`
}

export type GestureAction =
  | { type: 'POINTER_DOWN'; pointerId: number; x: number; y: number; defaultKind: LovePingKind }
  | { type: 'MOVE_BEFORE_THRESHOLD'; x: number; y: number }
  | { type: 'LONG_PRESS_FIRED'; initialCandidate: LovePingKind }
  | {
      type: 'DRAG_MOVE'
      x: number
      y: number
      candidate: LovePingKind | null
      isCancelled: boolean
    }
  | {
      type: 'POINTER_UP'
      candidate: LovePingKind | null
      isCancelled: boolean
    }
  | { type: 'PIN_SELECT'; kind: LovePingKind }
  | { type: 'KEYBOARD_OPEN'; defaultKind: LovePingKind }
  | {
      type: 'KEYBOARD_NAV'
      direction: 'prev' | 'next'
      currentItems: readonly { kind: LovePingKind }[]
    }
  | { type: 'CANCEL_ALL' }
  | { type: 'DISABLED_CHANGE'; disabled: boolean }

export type GestureEffect =
  | { type: 'SEND_PING'; kind: LovePingKind }
  | { type: 'VIBRATE_SLOT' }
  | { type: 'VIBRATE_OPEN' }
  | { type: 'VIBRATE_SEND' }
  | { type: 'SUPPRESS_CLICK' }

export interface GestureStepResult {
  state: GestureState
  effect?: GestureEffect
}

/**
 * 纯状态机 Step 函数，清晰隔离手势流转与副作用判定。
 */
export function stepGesture(state: GestureState, action: GestureAction): GestureStepResult {
  switch (action.type) {
    case 'POINTER_DOWN': {
      if (state.status !== 'idle') {
        // 已有主按键手势，忽略多指/第二根手指
        return { state }
      }
      return {
        state: {
          ...initialGestureState,
          status: 'pressing',
          activePointerId: action.pointerId,
          startX: action.x,
          startY: action.y,
          lastX: action.x,
          lastY: action.y,
          candidateKind: null,
          hasEnteredSlot: false,
          isCancelled: false,
        },
      }
    }

    case 'MOVE_BEFORE_THRESHOLD': {
      if (state.status !== 'pressing') return { state }
      const dist = Math.hypot(action.x - state.startX, action.y - state.startY)
      if (dist > MOVE_THRESHOLD_PX) {
        // 超过阈值，取消长按并阻止短按发送
        return {
          state: initialGestureState,
          effect: { type: 'SUPPRESS_CLICK' },
        }
      }
      return {
        state: {
          ...state,
          lastX: action.x,
          lastY: action.y,
        },
      }
    }

    case 'LONG_PRESS_FIRED': {
      if (state.status !== 'pressing') return { state }
      return {
        state: {
          ...state,
          status: 'dragging',
          candidateKind: null, // 初始处于滑向状态
          hasEnteredSlot: false,
          isCancelled: false,
        },
        effect: { type: 'VIBRATE_OPEN' },
      }
    }

    case 'DRAG_MOVE': {
      if (state.status !== 'dragging') return { state }
      const changedCandidate = action.candidate !== state.candidateKind

      const nextState: GestureState = {
        ...state,
        lastX: action.x,
        lastY: action.y,
        candidateKind: action.candidate,
        hasEnteredSlot: state.hasEnteredSlot || action.candidate !== null,
        isCancelled: action.isCancelled,
      }

      if (changedCandidate && action.candidate !== null) {
        return {
          state: nextState,
          effect: { type: 'VIBRATE_SLOT' },
        }
      }

      return { state: nextState }
    }

    case 'POINTER_UP': {
      if (state.status === 'pressing') {
        // 短按点击，由 click 事件处理 bibu.send()
        return { state: initialGestureState }
      }

      if (state.status === 'dragging') {
        // 场景 A：长按但从未滑入任何选项，原地松手 -> 切换为保留模式（pinned），不发消息
        if (!state.hasEnteredSlot && !action.isCancelled) {
          return {
            state: {
              ...state,
              status: 'pinned',
              candidateKind: null,
              isCancelled: false,
              activePointerId: null,
            },
            effect: { type: 'SUPPRESS_CLICK' },
          }
        }

        // 场景 B：滑出有效范围或滑回中心取消
        if (action.isCancelled || action.candidate === null) {
          return {
            state: initialGestureState,
            effect: { type: 'SUPPRESS_CLICK' },
          }
        }

        // 场景 C：在有效选项上松手，恰好发送一次
        return {
          state: initialGestureState,
          effect: { type: 'SEND_PING', kind: action.candidate },
        }
      }

      return { state }
    }

    case 'PIN_SELECT': {
      return {
        state: initialGestureState,
        effect: { type: 'SEND_PING', kind: action.kind },
      }
    }

    case 'KEYBOARD_OPEN': {
      return {
        state: {
          ...initialGestureState,
          status: 'pinned',
          candidateKind: action.defaultKind,
        },
      }
    }

    case 'KEYBOARD_NAV': {
      if (state.status !== 'pinned') return { state }
      const items = action.currentItems
      if (items.length === 0) return { state }

      const currentIndex = items.findIndex((i) => i.kind === state.candidateKind)
      let nextIndex = 0

      if (currentIndex === -1) {
        nextIndex = action.direction === 'next' ? 0 : items.length - 1
      } else {
        if (action.direction === 'next') {
          nextIndex = (currentIndex + 1) % items.length
        } else {
          nextIndex = (currentIndex - 1 + items.length) % items.length
        }
      }

      return {
        state: {
          ...state,
          candidateKind: items[nextIndex].kind,
        },
        effect: { type: 'VIBRATE_SLOT' },
      }
    }

    case 'CANCEL_ALL': {
      return {
        state: initialGestureState,
        effect: { type: 'SUPPRESS_CLICK' },
      }
    }

    case 'DISABLED_CHANGE': {
      if (action.disabled && state.status !== 'idle') {
        return {
          state: initialGestureState,
          effect: { type: 'SUPPRESS_CLICK' },
        }
      }
      return { state }
    }

    default:
      return { state }
  }
}

/**
 * useReducer 兼容包装器
 */
export function gestureReducer(state: GestureState, action: GestureAction): GestureState {
  return stepGesture(state, action).state
}
