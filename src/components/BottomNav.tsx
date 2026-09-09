import { useEffect, useRef, useState } from 'react'
import type { Page } from '../lib/types'
import type { BibuAction } from '../hooks/useBibu'
import { Icon } from './PixelArt'
import moreIcon from 'pixelarticons/svg/more-horizontal.svg'
import { lovePings, type LovePingKind } from '../lib/ping'
import { BiboNative } from '../native'

export function BottomNav({
  page,
  navigate,
  bibu,
}: {
  page: Page
  navigate: (page: Page) => void
  bibu: BibuAction
}) {
  const [more, setMore] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [hoveredKind, setHoveredKind] = useState<LovePingKind | null>(null)
  const [isPressing, setIsPressing] = useState(false)
  const ref = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isLongPress = useRef(false)
  const suppressNextClick = useRef(false)
  const itemRefs = useRef<Map<LovePingKind, HTMLButtonElement>>(new Map())
  const hoveredKindRef = useRef<LovePingKind | null>(null)
  hoveredKindRef.current = hoveredKind

  useEffect(() => {
    if (!more && !selectorOpen) return
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) {
        setMore(false)
        setSelectorOpen(false)
      }
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMore(false)
        setSelectorOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [more, selectorOpen])

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  function go(target: Page) {
    setMore(false)
    setSelectorOpen(false)
    navigate(target)
  }

  // Pointer / Touch interaction handlers for long-press & slide-to-select
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (bibu.disabled) return
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture is unavailable in a few embedded WebViews; normal
      // pointer events still provide a usable tap fallback.
    }
    suppressNextClick.current = false
    setIsPressing(true)
    isLongPress.current = false
    setHoveredKind(bibu.kind)

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setSelectorOpen(true)
      void BiboNative.vibration.pulse([40, 30, 40]).catch(() => {})
    }, 280)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isLongPress.current) return
    // Check which item the user's finger is currently over
    const clientX = e.clientX
    const clientY = e.clientY

    let matched: LovePingKind | null = null
    itemRefs.current.forEach((el, k) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      // Generous hit box for mobile finger drag
      if (
        clientX >= rect.left - 10 &&
        clientX <= rect.right + 10 &&
        clientY >= rect.top - 18 &&
        clientY <= rect.bottom + 18
      ) {
        matched = k
      }
    })

    if (matched && matched !== hoveredKindRef.current) {
      setHoveredKind(matched)
      void BiboNative.vibration.pulse([25]).catch(() => {})
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsPressing(false)
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore browsers without pointer-capture support.
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }

    if (isLongPress.current) {
      const selected = hoveredKindRef.current
      setSelectorOpen(false)
      suppressNextClick.current = true
      if (selected) void bibu.send(selected)
      // Keep this flag until the synthetic click generated after pointerup is
      // consumed; clearing it here would send the default BIBU a second time.
    }
  }

  const handlePointerCancel = (e?: React.PointerEvent<HTMLButtonElement>) => {
    setIsPressing(false)
    try {
      if (e && e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore browsers without pointer-capture support.
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
    setSelectorOpen(false)
    isLongPress.current = false
    suppressNextClick.current = false
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressNextClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressNextClick.current = false
      isLongPress.current = false
      return
    }
    if (isLongPress.current) return
    setMore(false)
    void bibu.send()
  }

  return (
    <nav ref={ref} className="bottom-nav bibo-dock" aria-label="移动端导航">
      <button
        className={`dock-item ${page === 'home' ? 'active' : ''}`}
        aria-current={page === 'home' ? 'page' : undefined}
        onClick={() => go('home')}
      >
        <span className="dock-icon dock-blue">
          <Icon name="home" size={24} />
        </span>
        <span>小窝</span>
      </button>
      <button
        className={`dock-item ${page === 'chat' ? 'active' : ''}`}
        aria-current={page === 'chat' ? 'page' : undefined}
        onClick={() => go('chat')}
      >
        <span className="dock-icon dock-green">
          <Icon name="chat" size={24} />
        </span>
        <span>悄悄话</span>
      </button>
      <div className="dock-center">
        {selectorOpen && (
          <div className="dock-bibu-picker" role="dialog" aria-label="滑动选择想发送的情绪">
            <span className="picker-tip micro">SLIDE TO SELECT ✦ RELEASE TO SEND</span>
            <div className="picker-track">
              {lovePings.map((item) => {
                const isCurrent = (hoveredKind || bibu.kind) === item.kind
                return (
                  <button
                    key={item.kind}
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.kind, el)
                      else itemRefs.current.delete(item.kind)
                    }}
                    type="button"
                    className={`picker-pill ${isCurrent ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectorOpen(false)
                      void bibu.send(item.kind)
                    }}
                  >
                    <span className="pill-dot">{isCurrent ? '♥' : '•'}</span>
                    <span className="pill-name">{item.kind}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <button
          className={`dock-bibo ${isPressing ? 'is-pressing' : ''} ${selectorOpen ? 'selector-active' : ''}`}
          disabled={bibu.disabled}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClick={handleClick}
          aria-label={`BIBU，长按滑动切换情绪，当前：${bibu.kind}`}
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
              fill={selectorOpen ? '#ff85d8' : '#fff238'}
              d="M24 8h28v4h8v8h4v36h-4v8H20v-4h-8V20h4v-8h8z"
            />
            <path
              fill="#20211d"
              d="M20 24h12v4h4v4h4v-4h4v-4h12v4h4v16h-4v4h-4v4h-4v4h-4v4H32v-4h-4v-4h-4v-4h-4v-4h-4V28h4z"
            />
            <path fill="#fffef7" d="M24 28h8v4h-8z" />
          </svg>
        </button>
        <span className={`dock-bibo-label ${selectorOpen ? 'selecting' : ''}`}>
          {selectorOpen ? hoveredKind || bibu.kind : 'BIBU!'}
        </span>
      </div>
      <button
        className={`dock-item ${page === 'events' ? 'active' : ''}`}
        aria-current={page === 'events' ? 'page' : undefined}
        onClick={() => go('events')}
      >
        <span className="dock-icon dock-pink">
          <Icon name="calendar" size={24} />
        </span>
        <span>值得期待</span>
      </button>
      <button
        ref={trigger}
        className={`dock-item ${['photos', 'focus', 'wardrobe', 'settings'].includes(page) || more ? 'active' : ''}`}
        aria-expanded={more}
        aria-controls="dock-more"
        onClick={() => setMore(!more)}
      >
        <span className="dock-icon dock-lilac">
          <img src={moreIcon} alt="" aria-hidden="true" width={24} height={24} />
        </span>
        <span>更多</span>
      </button>
      {more && (
        <div className="dock-more" id="dock-more">
          <span className="micro">MORE LITTLE THINGS</span>
          {(
            [
              { page: 'wardrobe', name: '萌宠衣橱', icon: 'shirt' },
              { page: 'photos', name: '照片墙', icon: 'photo' },
              { page: 'focus', name: '专注陪伴', icon: 'focus' },
              { page: 'settings', name: '空间设置', icon: 'settings' },
            ] as const
          ).map((item) => (
            <button
              key={item.page}
              aria-current={page === item.page ? 'page' : undefined}
              onClick={() => go(item.page)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.name}</span>
              <Icon name="arrow" size={13} />
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
