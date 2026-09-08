import { useEffect, useRef, useState } from 'react'
import type { Page } from '../lib/types'
import type { BibuAction } from '../hooks/useBibu'
import { Icon } from './PixelArt'
import moreIcon from 'pixelarticons/svg/more-horizontal.svg'
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
  const ref = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!more) return
    const close = (e: PointerEvent) => {
      if (e.target instanceof Node && !ref.current?.contains(e.target)) setMore(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMore(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [more])
  function go(target: Page) {
    setMore(false)
    navigate(target)
  }
  return (
    <nav ref={ref} className="bottom-nav bibo-dock" aria-label="移动端导航">
      <button
        className={`dock-item ${page === 'home' ? 'active' : ''}`}
        aria-current={page === 'home' ? 'page' : undefined}
        onClick={() => go('home')}
      >
        <span className="dock-icon dock-blue">
          <Icon name="home" size={22} />
        </span>
        <span>小窝</span>
      </button>
      <button
        className={`dock-item ${page === 'chat' ? 'active' : ''}`}
        aria-current={page === 'chat' ? 'page' : undefined}
        onClick={() => go('chat')}
      >
        <span className="dock-icon dock-green">
          <Icon name="chat" size={22} />
        </span>
        <span>悄悄话</span>
      </button>
      <div className="dock-center">
        <button
          className="dock-bibo"
          disabled={bibu.disabled}
          onClick={() => {
            setMore(false)
            void bibu.send()
          }}
          aria-label={`BIBU，发送${bibu.kind}`}
          title={`发送${bibu.kind}`}
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
              fill="#fff238"
              d="M24 8h28v4h8v8h4v36h-4v8H20v-4h-8V20h4v-8h8z"
            />
            <path
              fill="#20211d"
              d="M20 24h12v4h4v4h4v-4h4v-4h12v4h4v16h-4v4h-4v4h-4v4h-4v4H32v-4h-4v-4h-4v-4h-4v-4h-4V28h4z"
            />
            <path fill="#fffef7" d="M24 28h8v4h-8z" />
          </svg>
        </button>
        <span className="dock-bibo-label">{bibu.cooling ? 'SENT!' : 'BIBU!'}</span>
      </div>
      <button
        className={`dock-item ${page === 'events' ? 'active' : ''}`}
        aria-current={page === 'events' ? 'page' : undefined}
        onClick={() => go('events')}
      >
        <span className="dock-icon dock-pink">
          <Icon name="calendar" size={22} />
        </span>
        <span>值得期待</span>
      </button>
      <button
        ref={trigger}
        className={`dock-item ${['photos', 'focus', 'settings'].includes(page) || more ? 'active' : ''}`}
        aria-expanded={more}
        aria-controls="dock-more"
        onClick={() => setMore(!more)}
      >
        <span className="dock-icon dock-lilac">
          <img src={moreIcon} alt="" aria-hidden="true" width={22} height={22} />
        </span>
        <span>更多</span>
      </button>
      {more && (
        <div className="dock-more" id="dock-more">
          <span className="micro">MORE LITTLE THINGS</span>
          {(
            [
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
