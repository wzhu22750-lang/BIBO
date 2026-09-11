import { PixelFriend, friendIds } from './PixelFriends'
import { Icon, PixelPal, PixelFlower } from './PixelArt'
import { eventArtId } from '../lib/eventArt'
import type { EventArtId } from '../lib/eventArt'
// Static, per-file SVG imports: no library index, icon font, runtime fetch or raw HTML.
import trophy from 'pixelarticons/svg/trophy.svg'
import map from 'pixelarticons/svg/map.svg'
import gift from 'pixelarticons/svg/gift.svg'
import coffee from 'pixelarticons/svg/coffee.svg'
import book from 'pixelarticons/svg/book-open.svg'
import briefcase from 'pixelarticons/svg/briefcase.svg'
import code from 'pixelarticons/svg/code.svg'
import flag from 'pixelarticons/svg/flag.svg'
import camera from 'pixelarticons/svg/camera.svg'
import music from 'pixelarticons/svg/music.svg'
import headphone from 'pixelarticons/svg/headphone.svg'
import gamepad from 'pixelarticons/svg/gamepad.svg'
import movie from 'pixelarticons/svg/video.svg'
import shopping from 'pixelarticons/svg/shopping-bag.svg'
import sun from 'pixelarticons/svg/sun.svg'
import moon from 'pixelarticons/svg/moon.svg'
import tent from 'pixelarticons/svg/tent.svg'
import compass from 'pixelarticons/svg/compass.svg'
import backpack from 'pixelarticons/svg/backpack.svg'
import star from 'pixelarticons/svg/star.svg'
import balloon from 'pixelarticons/svg/balloon.svg'
const imported: Partial<Record<EventArtId, string>> = {
  trophy,
  gift,
  coffee,
  book,
  briefcase,
  code,
  flag,
  camera,
  music,
  headphone,
  gamepad,
  movie,
  shopping,
  sun,
  moon,
  tent,
  compass,
  backpack,
  star,
  balloon,
}
import { ColoredPixelIcon, coloredPixelIconIds } from './ColoredPixelIcons'
import { EventArtNew100, newEventArt100Ids } from './EventArtNew100'

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
  if (value === 'panda' || value === 'hamster' || value === 'chick' || value === 'koala') {
    return (
      <span
        className={`event-art pal-avatar ${className}`}
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <PixelPal type={value} size={size} />
      </span>
    )
  }
  const id = eventArtId(value)
  if (friendIds.some((friend) => friend === id))
    return <PixelFriend kind={id} size={size} className={className} />
  if (id === 'cat')
    return (
      <span
        className={`event-art cat-friend ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <PixelPal type="cat" size={size} />
      </span>
    )
  if (id === 'flower')
    return (
      <span
        className={`event-art flower-friend ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <PixelFlower />
      </span>
    )
  if (coloredPixelIconIds.includes(id as any))
    return <ColoredPixelIcon id={id} size={size} className={className} />
  if (newEventArt100Ids.includes(id as any))
    return <EventArtNew100 id={id} size={size} className={className} />
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
        <PixelPal type="bunny" size={size} />
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
      {id === 'dumbbell' && (
        <>
          <path fill="#20211d" d="M8 12h12v12h24V12h12v8h8v24h-8v8H44V40H20v12H8v-8H0V20h8z" />
          <path fill="#04bcf0" d="M12 16h4v32h-4zm36 0h4v32h-4z" />
          <path fill="#ffa6e8" d="M4 24h4v16H4zm52 0h4v16h-4z" />
          <path fill="#dceef4" d="M20 28h24v8H20z" />
        </>
      )}
      {id === 'bicycle' && (
        <>
          <path
            fill="#20211d"
            d="M8 32h16v4h4v16h-4v4H8v-4H4V36h4zm32 0h16v4h4v16h-4v4H40v-4h-4V36h4z"
          />
          <path
            fill="#e5f9ff"
            d="M12 36h8v4h4v8h-4v4h-8v-4H8v-8h4zm32 0h8v4h4v8h-4v4h-8v-4h-4v-8h4z"
          />
          <path fill="#20211d" d="M40 12h12v4h-8v4h-4zM16 16h12v4H16z" />
          <path
            fill="#f573b5"
            d="M20 20h4v4h16v4H24v8h-4v-8h-4v-4h4zm20 0h4v12h4v12h-4V32h-4V20zM16 36h4v4h12v4H16zm16-4h4v8h-4zm4-4h4v8h-4z"
          />
        </>
      )}
      {id === 'icecream' && (
        <>
          <path
            fill="#20211d"
            d="M24 4h16v4h8v8h4v8h4v12h-8v8h-4v8h-4v8H24v-8h-4v-8h-4v-8H8V24h4v-8h4V8h8z"
          />
          <path fill="#ffa6e8" d="M24 8h16v4h4v8h4v8h4v4H12v-4h4v-8h4v-8h4z" />
          <path fill="#fff8dc" d="M20 24h24v4h-8v4H20zM24 12h8v4h-8z" />
          <path fill="#e6ad57" d="M20 36h24v4h-4v8h-4v8h-8v-8h-4v-8h-4z" />
          <path fill="#a56830" d="M24 40h8v4h-8zm8 4h8v4h-8zm-4 4h8v4h-8z" />
        </>
      )}
      {id === 'mountain' && (
        <>
          <path fill="#20211d" d="M24 8h8v8h4v8h4v-8h8v8h4v8h4v8h4v16H4V40h4v-8h4v-8h4v-8h8z" />
          <path fill="#26c985" d="M24 16h8v8h4v8h4v8h4v8h4v4H8V40h4v-8h4v-8h8z" />
          <path fill="#0d9977" d="M40 24h8v8h4v8h4v12h-8v-4h-4v-8h-4z" />
          <path fill="#fffef7" d="M24 16h8v8h4v8h-8v-4h-8v4h-4v-8h8zm16 8h8v8h-8z" />
          <path fill="#fff238" d="M4 4h12v12H4z" />
        </>
      )}
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
