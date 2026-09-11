import { describe, expect, it } from 'vitest'
import {
  computeSlotGeometries,
  resolveHitCandidate,
  getBibuTipText,
  stepGesture,
  initialGestureState,
  ARC_Y_OFFSETS,
} from './bibuGestureLogic'
import { lovePings } from '../../lib/ping'

describe('bibuGestureLogic - Geometry & Shallow Arc', () => {
  const trackBounds = { left: 10, top: 100, width: 300, height: 60, right: 310, bottom: 160 }

  it('computes 6 slot geometries with shallow arc offsets', () => {
    const slots = computeSlotGeometries(trackBounds)
    expect(slots.length).toBe(6)

    // Check slot widths and positions
    slots.forEach((slot, i) => {
      expect(slot.kind).toBe(lovePings[i].kind)
      expect(slot.left).toBeCloseTo(10 + i * 50)
      expect(slot.right).toBeCloseTo(10 + (i + 1) * 50)
      expect(slot.centerX).toBeCloseTo(10 + i * 50 + 25)
      expect(slot.arcOffsetY).toBe(ARC_Y_OFFSETS[i])
      expect(slot.top).toBe(100 + ARC_Y_OFFSETS[i])
    })

    // Confirm arc curvature: center slots (index 2, 3) are higher than outer slots (index 0, 5)
    expect(slots[2].top).toBeLessThan(slots[0].top)
    expect(slots[3].top).toBeLessThan(slots[5].top)
  })
})

describe('bibuGestureLogic - Hit Testing & Hysteresis & Cancellation', () => {
  const trackBounds = { left: 0, top: 100, width: 300, height: 60, right: 300, bottom: 160 }
  const slots = computeSlotGeometries(trackBounds)

  it('hits each of the 6 items accurately at their center X', () => {
    slots.forEach((slot) => {
      const result = resolveHitCandidate(slot.centerX, 130, trackBounds, slots, null)
      expect(result.isCancelled).toBe(false)
      expect(result.candidate).toBe(slot.kind)
    })
  })

  it('applies hysteresis to avoid jitter around slot boundaries', () => {
    // Boundary between slot 0 (0..50) and slot 1 (50..100) is x = 50.
    // If current candidate is slot 0:
    // With 8px hysteresis, x = 54 (which is past 50, but < 50 + 8) should STILL be slot 0.
    const hitWithCurrent0 = resolveHitCandidate(54, 130, trackBounds, slots, slots[0].kind)
    expect(hitWithCurrent0.candidate).toBe(slots[0].kind)

    // But if current candidate was null or slot 1, x = 54 selects slot 1.
    const hitWithoutCurrent = resolveHitCandidate(54, 130, trackBounds, slots, null)
    expect(hitWithoutCurrent.candidate).toBe(slots[1].kind)

    // Moving beyond hysteresis threshold (e.g. x = 60 > 50 + 8) switches to slot 1 even if currently slot 0.
    const hitSwitched = resolveHitCandidate(60, 130, trackBounds, slots, slots[0].kind)
    expect(hitSwitched.candidate).toBe(slots[1].kind)
  })

  it('cancels immediately when sliding back down towards the center/button (center cancel)', () => {
    // trackBounds.bottom is 160. Bottom cancel threshold is > 160 + 25 = 185.
    const result = resolveHitCandidate(150, 190, trackBounds, slots, slots[2].kind)
    expect(result.isCancelled).toBe(true)
    expect(result.candidate).toBeNull()
  })

  it('cancels immediately when sliding too far up or to the sides', () => {
    // Too far up (< 100 - 50 = 50)
    const tooHigh = resolveHitCandidate(150, 40, trackBounds, slots, slots[2].kind)
    expect(tooHigh.isCancelled).toBe(true)
    expect(tooHigh.candidate).toBeNull()

    // Too far left (< 0 - 25 = -25)
    const tooFarLeft = resolveHitCandidate(-30, 130, trackBounds, slots, slots[0].kind)
    expect(tooFarLeft.isCancelled).toBe(true)
    expect(tooFarLeft.candidate).toBeNull()

    // Too far right (> 300 + 25 = 325)
    const tooFarRight = resolveHitCandidate(330, 130, trackBounds, slots, slots[5].kind)
    expect(tooFarRight.isCancelled).toBe(true)
    expect(tooFarRight.candidate).toBeNull()
  })
})

describe('bibuGestureLogic - Tip Texts', () => {
  it('returns appropriate tip text for all required states', () => {
    // Initial dragging (no candidate yet)
    expect(
      getBibuTipText({ status: 'dragging', candidateKind: null, isCancelled: false }, '哔卟哔卟'),
    ).toBe('滑向一个心情')

    // Hit / hovering an option
    expect(
      getBibuTipText({ status: 'dragging', candidateKind: '想你', isCancelled: false }, '哔卟哔卟'),
    ).toBe('松开发送「想你」')

    // Cancelled / slid out of bounds
    expect(
      getBibuTipText({ status: 'dragging', candidateKind: null, isCancelled: true }, '哔卟哔卟'),
    ).toBe('松手取消')

    // Pinned mode (long press released in place)
    expect(
      getBibuTipText({ status: 'pinned', candidateKind: null, isCancelled: false }, '哔卟哔卟'),
    ).toBe('点一个心情发送')

    // Pinned mode with keyboard selection or hover
    expect(
      getBibuTipText({ status: 'pinned', candidateKind: '抱一下', isCancelled: false }, '哔卟哔卟'),
    ).toBe('点击发送「抱一下」')
  })
})

describe('bibuGestureLogic - Gesture Reducer State Machine', () => {
  it('handles short tap: pointerdown then pointerup in pressing state without move', () => {
    const down = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    })
    expect(down.state.status).toBe('pressing')
    expect(down.state.activePointerId).toBe(1)

    const up = stepGesture(down.state, {
      type: 'POINTER_UP',
      candidate: null,
      isCancelled: false,
    })
    // Resets to idle so click handler sends default ping
    expect(up.state.status).toBe('idle')
    expect(up.effect).toBeUndefined()
  })

  it('cancels if moved beyond 12px before 300ms threshold (drag/scroll threshold)', () => {
    const down = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    })

    // Move slightly (within threshold)
    const smallMove = stepGesture(down.state, {
      type: 'MOVE_BEFORE_THRESHOLD',
      x: 105,
      y: 505,
    })
    expect(smallMove.state.status).toBe('pressing')

    // Move past 12px (dx = 15, dy = 0)
    const largeMove = stepGesture(smallMove.state, {
      type: 'MOVE_BEFORE_THRESHOLD',
      x: 116,
      y: 500,
    })
    expect(largeMove.state.status).toBe('idle')
    expect(largeMove.effect?.type).toBe('SUPPRESS_CLICK')
  })

  it('transitions to dragging when 300ms timer fires and vibrates', () => {
    const down = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    })
    const timerFired = stepGesture(down.state, {
      type: 'LONG_PRESS_FIRED',
      initialCandidate: '哔卟哔卟',
    })
    expect(timerFired.state.status).toBe('dragging')
    expect(timerFired.effect?.type).toBe('VIBRATE_OPEN')
  })

  it('supports drag-to-send for all 6 items including default item', () => {
    lovePings.forEach((item) => {
      let state = stepGesture(initialGestureState, {
        type: 'POINTER_DOWN',
        pointerId: 1,
        x: 100,
        y: 500,
        defaultKind: '哔卟哔卟',
      }).state

      state = stepGesture(state, {
        type: 'LONG_PRESS_FIRED',
        initialCandidate: '哔卟哔卟',
      }).state

      // Drag into item
      const dragResult = stepGesture(state, {
        type: 'DRAG_MOVE',
        x: 150,
        y: 130,
        candidate: item.kind,
        isCancelled: false,
      })
      state = dragResult.state
      expect(state.candidateKind).toBe(item.kind)
      expect(state.hasEnteredSlot).toBe(true)

      // Pointer up on that item
      const releaseResult = stepGesture(state, {
        type: 'POINTER_UP',
        candidate: item.kind,
        isCancelled: false,
      })
      expect(releaseResult.state.status).toBe('idle')
      expect(releaseResult.effect?.type).toBe('SEND_PING')
      if (releaseResult.effect?.type === 'SEND_PING') {
        expect(releaseResult.effect.kind).toBe(item.kind)
      }
    })
  })

  it('cross-item switching vibrates only when entering a new item', () => {
    let state = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    }).state

    state = stepGesture(state, {
      type: 'LONG_PRESS_FIRED',
      initialCandidate: '哔卟哔卟',
    }).state

    // First item entered
    const item1 = stepGesture(state, {
      type: 'DRAG_MOVE',
      x: 25,
      y: 130,
      candidate: '哔卟哔卟',
      isCancelled: false,
    })
    expect(item1.effect?.type).toBe('VIBRATE_SLOT')

    // Same item moved within slot - NO vibration
    const sameItem = stepGesture(item1.state, {
      type: 'DRAG_MOVE',
      x: 28,
      y: 130,
      candidate: '哔卟哔卟',
      isCancelled: false,
    })
    expect(sameItem.effect).toBeUndefined()

    // Switched to next item ('想你') - vibrates
    const item2 = stepGesture(sameItem.state, {
      type: 'DRAG_MOVE',
      x: 75,
      y: 130,
      candidate: '想你',
      isCancelled: false,
    })
    expect(item2.effect?.type).toBe('VIBRATE_SLOT')
    expect(item2.state.candidateKind).toBe('想你')
  })

  it('drag out to cancel cancels send and does NOT fire send effect', () => {
    let state = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    }).state

    state = stepGesture(state, {
      type: 'LONG_PRESS_FIRED',
      initialCandidate: '哔卟哔卟',
    }).state

    // Hovered an item first
    state = stepGesture(state, {
      type: 'DRAG_MOVE',
      x: 75,
      y: 130,
      candidate: '想你',
      isCancelled: false,
    }).state

    // Then dragged out
    const draggedOut = stepGesture(state, {
      type: 'DRAG_MOVE',
      x: 75,
      y: 300, // dragged back down
      candidate: null,
      isCancelled: true,
    })
    expect(draggedOut.state.isCancelled).toBe(true)
    expect(draggedOut.state.candidateKind).toBeNull()

    // Released while cancelled
    const release = stepGesture(draggedOut.state, {
      type: 'POINTER_UP',
      candidate: null,
      isCancelled: true,
    })
    expect(release.state.status).toBe('idle')
    expect(release.effect?.type).toBe('SUPPRESS_CLICK')
  })

  it('in-place long press without dragging switches to pinned mode, and tapping sends item', () => {
    let state = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    }).state

    state = stepGesture(state, {
      type: 'LONG_PRESS_FIRED',
      initialCandidate: '哔卟哔卟',
    }).state

    // Never moved into any slot (hasEnteredSlot is false) and release in place
    const inPlaceRelease = stepGesture(state, {
      type: 'POINTER_UP',
      candidate: null,
      isCancelled: false,
    })
    expect(inPlaceRelease.state.status).toBe('pinned')
    expect(inPlaceRelease.effect?.type).toBe('SUPPRESS_CLICK')

    // Now in pinned mode, user taps an item
    const select = stepGesture(inPlaceRelease.state, {
      type: 'PIN_SELECT',
      kind: '晚安',
    })
    expect(select.state.status).toBe('idle')
    expect(select.effect?.type).toBe('SEND_PING')
    if (select.effect?.type === 'SEND_PING') {
      expect(select.effect.kind).toBe('晚安')
    }
  })

  it('ignores second pointer when already pressing or dragging (multi-touch protection)', () => {
    const firstPointer = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    })
    expect(firstPointer.state.activePointerId).toBe(1)

    // Second pointer comes in
    const secondPointer = stepGesture(firstPointer.state, {
      type: 'POINTER_DOWN',
      pointerId: 2,
      x: 200,
      y: 400,
      defaultKind: '哔卟哔卟',
    })
    // Second pointer is ignored, activePointerId remains 1
    expect(secondPointer.state.activePointerId).toBe(1)
  })

  it('cancels gracefully on CANCEL_ALL or pointercancel / window blur', () => {
    let state = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    }).state

    state = stepGesture(state, {
      type: 'LONG_PRESS_FIRED',
      initialCandidate: '哔卟哔卟',
    }).state

    const cancel = stepGesture(state, { type: 'CANCEL_ALL' })
    expect(cancel.state.status).toBe('idle')
    expect(cancel.effect?.type).toBe('SUPPRESS_CLICK')
  })

  it('cancels if disabled changes to true during active gesture', () => {
    let state = stepGesture(initialGestureState, {
      type: 'POINTER_DOWN',
      pointerId: 1,
      x: 100,
      y: 500,
      defaultKind: '哔卟哔卟',
    }).state

    const disabledChange = stepGesture(state, {
      type: 'DISABLED_CHANGE',
      disabled: true,
    })
    expect(disabledChange.state.status).toBe('idle')
    expect(disabledChange.effect?.type).toBe('SUPPRESS_CLICK')
  })

  it('handles keyboard navigation and cycling in pinned mode', () => {
    // Open via keyboard
    const open = stepGesture(initialGestureState, {
      type: 'KEYBOARD_OPEN',
      defaultKind: '哔卟哔卟',
    })
    expect(open.state.status).toBe('pinned')
    expect(open.state.candidateKind).toBe('哔卟哔卟')

    // Navigate next
    const next1 = stepGesture(open.state, {
      type: 'KEYBOARD_NAV',
      direction: 'next',
      currentItems: lovePings,
    })
    expect(next1.state.candidateKind).toBe('想你')

    // Navigate prev back to '哔卟哔卟'
    const prev1 = stepGesture(next1.state, {
      type: 'KEYBOARD_NAV',
      direction: 'prev',
      currentItems: lovePings,
    })
    expect(prev1.state.candidateKind).toBe('哔卟哔卟')

    // Navigate prev wraps around to last item '我回来啦'
    const wrapPrev = stepGesture(prev1.state, {
      type: 'KEYBOARD_NAV',
      direction: 'prev',
      currentItems: lovePings,
    })
    expect(wrapPrev.state.candidateKind).toBe('我回来啦')
  })
})
