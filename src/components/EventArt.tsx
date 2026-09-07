import { Icon, PixelPal } from './PixelArt'
import { eventArtId } from '../lib/eventArt'
import type { EventArtId } from '../lib/eventArt'
// Static, per-file SVG imports: no library index, icon font, runtime fetch or raw HTML.
import trophy from 'pixelarticons/svg/trophy.svg'
import map from 'pixelarticons/svg/map.svg'
import gift from 'pixelarticons/svg/gift.svg'
import coffee from 'pixelarticons/svg/coffee.svg'
const imported: Partial<Record<EventArtId, string>> = { trophy, gift, coffee }
export function MapIcon({ size = 24 }: { size?: number }) {
  return (
    <img
      src={map}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="imported-pixel"
    />
  )
}
export function EventArt({
  value,
  size = 52,
  className = '',
}: {
  value: string
  size?: number
  className?: string
}) {
  const id = eventArtId(value)
  if (imported[id])
    return (
      <img
        src={imported[id]}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        className={`event-art imported-pixel ${className}`}
      />
    )
  if (id === 'bunny')
    return (
      <span
        className={`event-art bunny-letter ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <PixelPal type="bunny" />
        <svg viewBox="0 0 32 24" shapeRendering="crispEdges">
          <path fill="#20211d" d="M0 0h32v24H0z" />
          <path fill="#fffef7" d="M3 3h26v18H3z" />
          <path fill="#ff79c9" d="M7 6h6v3h6V6h6v6h-3v3h-3v3h-6v-3h-3v-3H7z" />
        </svg>
      </span>
    )
  if (id === 'heart' || id === 'home')
    return <Icon name={id} size={size} className={`event-art ${className}`} />
  return (
    <svg
      className={`event-art ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {id === 'plane' && (
        <>
          <path fill="#20211d" d="M28 4h8v20l24 12v12L36 40v12l8 4v4H20v-4l8-4V40L4 48V36l24-12z" />
          <path fill="#fffef7" d="M30 8h4v20l22 12v4l-22-8v18l4 2H26l4-2V36L8 44v-4l22-12z" />
          <path fill="#04bcf0" d="M30 12h4v12h-4zM12 40h12v4H12zm28 0h12v4H40z" />
        </>
      )}
      {id === 'dog' && (
        <>
          <path
            fill="#20211d"
            d="M16 8h32v4h8v8h4v20h-8v4h-4v8h4v8H12v-8h4v-8h-4v-4H4V20h4v-8h8z"
          />
          <path fill="#e8a64e" d="M16 12h32v8h4v20h-8v8H20v-8h-8V20h4z" />
          <path fill="#895435" d="M8 20h8v20H8zm40 0h8v20h-8z" />
          <path fill="#fff3d8" d="M24 12h12v12H24zM20 32h24v12H20z" />
          <path fill="#20211d" d="M20 24h4v8h-4zm20 0h4v8h-4zm-12 8h8v4h-8zm0 8h8v4h-8z" />
          <path fill="#ff83ba" d="M28 40h8v8h-8z" />
          <path fill="#04bcf0" d="M20 48h24v8H20z" />
          <path fill="#fff238" d="M28 48h8v8h-8z" />
          <path fill="#e8a64e" d="M16 56h12v4H16zm20 0h12v4H36z" />
        </>
      )}
      {id === 'cake' && (
        <>
          <path fill="#20211d" d="M8 28h8v-8h4v-8h4v8h4v8h8v-8h4v-8h4v8h4v8h8v28h4v4H4v-4h4z" />
          <path fill="#fff238" d="M20 8h4v8h-4zm20 0h4v8h-4z" />
          <path fill="#ff74c8" d="M20 20h4v8h-4zm20 0h4v8h-4zM12 36h40v16H12z" />
          <path fill="#fff8e1" d="M12 32h40v8h-8v4h-8v-4H24v4h-8v-4h-4zM12 52h40v4H12z" />
          <path fill="#d64f94" d="M20 48h4v4h-4zm20-4h4v4h-4z" />
        </>
      )}
      {id === 'sea' && (
        <>
          <path fill="#20211d" d="M4 36h12v-4h8v-4h8V16h8v4h8v12h8v8h4v20H4z" />
          <path fill="#04bcf0" d="M8 40h12v-4h8v-4h8V20h4v4h4v8h-4v8h-8v4H8z" />
          <path fill="#fffef7" d="M28 32h8V20h4v4h4v8h-4v8h-8v4H8v-4h12v-4h8z" />
          <path fill="#229ad1" d="M8 48h24v-4h12v-8h8v8h4v12H8z" />
          <path fill="#fff238" d="M8 8h12v12H8z" />
          <path fill="#20211d" d="M8 4h12v4H8zM4 8h4v12H4zm16 0h4v12h-4zM8 20h12v4H8z" />
        </>
      )}
      {id === 'train' && (
        <>
          <path fill="#20211d" d="M16 4h32v4h4v40h-4v8h4v4h-8v-4H20v4h-8v-4h4v-8h-4V8h4z" />
          <path fill="#2aeea4" d="M16 12h32v32H16z" />
          <path fill="#fff238" d="M20 8h24v4H20zM16 36h32v4H16z" />
          <path fill="#20211d" d="M20 16h24v16H20zM20 48h24v4H20z" />
          <path fill="#dff9ff" d="M24 20h4v8h-4zm8 0h8v8h-8zM20 40h4v4h-4zm20 0h4v4h-4z" />
        </>
      )}
      {id === 'tree' && (
        <>
          <path fill="#20211d" d="M28 8h8v8h4v8h8v12h8v16H36v8h-8v-8H8V36h8V24h8v-8h4z" />
          <path fill="#2aeea4" d="M28 20h8v8h8v12h8v8H12v-8h8V28h8z" />
          <path fill="#fff238" d="M28 4h8v8h-8zm-8 32h8v4h-8zm16 4h8v4h-8z" />
          <path fill="#ff82cd" d="M28 28h8v4h-8zM16 44h8v4h-8z" />
          <path fill="#b47841" d="M28 52h8v8h-8z" />
        </>
      )}
    </svg>
  )
}
