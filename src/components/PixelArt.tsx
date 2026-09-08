import type { CSSProperties } from 'react'
import type { AvatarType } from '../lib/types'

export const AVATAR_LIST: { id: AvatarType; name: string; tag: string }[] = [
  { id: 'dog', name: '小狗', tag: '忠诚活泼' },
  { id: 'cat', name: '小猫', tag: '傲娇元气' },
  { id: 'bunny', name: '小兔', tag: '软萌温柔' },
  { id: 'bear', name: '小熊', tag: '憨厚温暖' },
  { id: 'panda', name: '熊猫', tag: '治愈呆萌' },
  { id: 'fox', name: '狐狸', tag: '灵动机智' },
  { id: 'penguin', name: '企鹅', tag: '摇摆可爱' },
  { id: 'duck', name: '鸭子', tag: '乐天快活' },
  { id: 'frog', name: '青蛙', tag: '幸运元气' },
  { id: 'hamster', name: '仓鼠', tag: '腮帮吃货' },
  { id: 'chick', name: '小鸡', tag: '萌趣好奇' },
  { id: 'koala', name: '考拉', tag: '安心慢热' },
]

export type IconName =
  | 'home'
  | 'chat'
  | 'calendar'
  | 'photo'
  | 'focus'
  | 'settings'
  | 'heart'
  | 'arrow'
  | 'plus'
  | 'close'
  | 'sound'
  | 'lock'
  | 'logout'
  | 'send'
  | 'star'
  | 'check'
  | 'upload'
  | 'spark'
const paths: Record<IconName, string> = {
  home: 'M10 2h4v2h2v2h2v2h2v2h2v4h-4v8h-6v-6h-2v6H4v-8H2v-4h2V8h2V6h2V4h2zm0 6H8v2H6v10h2v-6h6v6h2V10h-2V8h-2V6h-2z',
  chat: 'M4 3h16v2h2v13h-2v2H9v2H5v-4H2V5h2zm0 2v11h3v3l3-3h10V5zm3 4h2v3H7zm4 0h2v3h-2zm4 0h2v3h-2z',
  calendar: 'M6 2h2v3h8V2h2v3h4v17H2V5h4zM4 7v3h16V7zm0 5v8h16v-8zm3 2h3v3H7zm7 0h3v3h-3z',
  photo: 'M2 3h20v18H2zm2 2v14h16V5zm2 2h4v4H6zm7 4h3v2h2v4H6v-2h3v-2h4z',
  focus:
    'M8 1h8v2H8zm3 3h2v2h5v2h2v2h2v8h-2v2h-2v2H6v-2H4v-2H2v-8h2V8h2V6h5zM6 10H4v8h2v2h12v-2h2v-8h-2V8H6zm5 0h2v5h4v2h-6z',
  settings:
    'M9 2h6v3h3V3h3v6h-3v6h3v6h-3v-2h-3v3H9v-3H6v2H3v-6h3V9H3V3h3v2h3zm1 7v2H8v3h2v2h4v-2h2v-3h-2V9z',
  heart: 'M4 3h5v2h2v2h2V5h2V3h5v2h2v8h-2v2h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-2H2V5h2z',
  arrow: 'M12 3h3v3h3v3h3v6h-3v3h-3v3h-3v-6H3V9h9zm3 6v6h3V9z',
  plus: 'M9 2h6v7h7v6h-7v7H9v-7H2V9h7z',
  close: 'M3 3h4v4h3v3h4V7h3V3h4v4h-4v3h-3v4h3v3h4v4h-4v-4h-3v-3h-4v3H7v4H3v-4h4v-3h3v-4H7V7H3z',
  sound: 'M11 3h3v18h-3v-3H8v-3H3V9h5V6h3zm6 4h2v10h-2zm4-4h2v18h-2z',
  lock: 'M8 2h8v2h2v6h3v12H3V10h3V4h2zm0 4v4h8V6h-2V4h-4v2zm3 8v5h2v-5z',
  logout: 'M2 2h11v3H5v14h8v3H2zm14 3h3v3h3v8h-3v3h-3v-5H9v-4h7z',
  send: 'M2 2h4v2h4v2h4v2h4v2h4v4h-4v2h-4v2h-4v2H6v2H2v-8h10v-4H2zm3 4v2h6V6zm0 10v2h6v-2z',
  star: 'M10 1h4v6h3v3h6v4h-6v3h-3v6h-4v-6H7v-3H1v-4h6V7h3z',
  check: 'M18 4h4v5h-3v3h-3v3h-3v3h-3v3H6v-3H3v-3H0v-5h4v3h3v3h3v-3h3v-3h3V7h2z',
  upload: 'M10 2h4v3h3v3h3v3h-5v6H9v-6H4V8h3V5h3zM2 16h3v4h14v-4h3v7H2z',
  spark: 'M9 0h3v5h3v3h5v3h-5v3h-3v5H9v-5H6v-3H1V8h5V5h3zm10 16h2v3h3v2h-3v3h-2v-3h-3v-2h3z',
}
export function Icon({
  name,
  size = 22,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      className={`pixel-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fillRule="evenodd" d={paths[name]} />
    </svg>
  )
}
export function PixelPal({
  type = 'cat',
  className = '',
  style,
}: {
  type?: AvatarType
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 80 88"
      className={`pixel-pal ${className}`}
      style={style}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {type === 'dog' && (
        <>
          <path
            fill="#171917"
            d="M12 4h16v4h24V4h16v16h-4v28h-4v8h4v8h8v16H16V64h8v-8h-4v-8h-8V20h4z"
          />
          <path fill="#ea9937" d="M16 8h12v8h24V8h12v28h-8v8H24v-8h-8z" />
          <path fill="#fff1d6" d="M24 16h4v4h-4zm28 0h4v4h-4zm-28 12h32v16H24zm4 20h24v8H28z" />
          <path fill="#ff8595" d="M20 8h4v8h-4zm36 0h4v8h-4zm-40 28h8v4h-8zm40 0h8v4h-8z" />
          <path fill="#171917" d="M24 24h8v8h-8zm24 0h8v8h-8zm-12 8h8v4h-8zm-4 8h16v4H32z" />
          <path fill="#04bcf0" d="M24 56h32v8h8v12H16V64h8z" />
          <path fill="#171917" d="M28 68h4v8h-4zm20 0h4v8h-4z" />
        </>
      )}
      {type === 'cat' && (
        <>
          <path fill="#171917" d="M12 8h16v8h24V8h16v40h-8v8h-4v8h8v16H16V64h8v-8h-4v-8h-8z" />
          <path fill="#ffbb53" d="M16 12h8v12h32V12h8v32h-8v8H24v-8h-8z" />
          <path fill="#ffe8b9" d="M24 32h32v16H24z" />
          <path fill="#ff817b" d="M16 16h4v8h-4zm44 0h4v8h-4zM20 36h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#171917" d="M24 28h8v8h-8zm24 0h8v8h-8zM36 36h8v4h-8zm-4 8h16v4H32z" />
          <path fill="#0beca0" d="M28 56h24v8h8v12H20V64h8z" />
          <path fill="#171917" d="M28 68h4v8h-4zm20 0h4v8h-4z" />
        </>
      )}
      {type === 'bunny' && (
        <>
          <path
            fill="#171917"
            d="M16 0h16v24h16V0h16v32h4v20h-8v8h-4v4h8v16H16V64h8v-4h-4v-8h-8V32h4z"
          />
          <path fill="#fff6ec" d="M20 4h8v28h24V4h8v32h4v12h-8v8H24v-8h-8V36h4z" />
          <path fill="#ff94d9" d="M24 8h4v20h-4zm28 0h4v20h-4zM20 44h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#171917" d="M28 36h4v8h-4zm20 0h4v8h-4zM36 44h8v4h-8z" />
          <path fill="#ff88e1" d="M28 60h24v8h8v8H20v-8h8z" />
          <path fill="#171917" d="M28 72h4v4h-4zm20 0h4v4h-4z" />
        </>
      )}
      {type === 'bear' && (
        <>
          <path
            fill="#171917"
            d="M8 4h20v4h24V4h20v20h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8z"
          />
          <path fill="#8d5b36" d="M12 8h12v8h32V8h12v28h-8v8H20v-8h-8z" />
          <path fill="#ffe0a6" d="M16 8h4v8h-4zm44 0h4v8h-4zm-36 24h32v16H24z" />
          <path fill="#ffa6e8" d="M16 36h8v4h-8zm40 0h8v4h-8zm-24 16h16v4H32zm-4 4h24v4H28z" />
          <path fill="#171917" d="M24 28h8v8h-8zm24 0h8v8h-8zm-12 4h8v4h-8zm0 8h8v4h-8z" />
          <path fill="#ffb703" d="M24 60h32v8h8v12H16V68h8z" />
          <path fill="#171917" d="M24 72h4v8h-4zm28 0h4v8h-4z" />
        </>
      )}
      {type === 'panda' && (
        <>
          <path
            fill="#171917"
            d="M8 4h20v4h24V4h20v20h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8z"
          />
          <path
            fill="#171917"
            d="M12 8h12v12H12zm44 0h12v12H56zm-36 16h16v16H20zm24 0h16v16H44zm-28 32h48v16h-4v8h-4v-8H24v8h-4v-8h-4z"
          />
          <path
            fill="#ffffff"
            d="M24 12h32v12h8v24h-8v8H24v-8h-8V24h8zm4 16h4v4h-4zm20 0h4v4h-4zm-4 36h32v12H24z"
          />
          <path fill="#ff94d9" d="M16 40h8v4h-8zm40 0h8v4h-8z" />
          <path fill="#171917" d="M36 36h8v4h-8zm-4 8h16v4H32z" />
          <path fill="#2aeea4" d="M24 56h32v8H24z" />
        </>
      )}
      {type === 'fox' && (
        <>
          <path
            fill="#171917"
            d="M8 0h16v8h32V0h16v28h-4v24h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V28H8z"
          />
          <path fill="#f97316" d="M12 4h8v16h40V4h8v28h-8v8H20v-8h-8z" />
          <path
            fill="#fffef7"
            d="M16 4h4v12h-4zm44 0h4v12h-4zm-44 28h16v12h16V32h16v8h-8v8H24v-8h-8zm16 24h16v16H32z"
          />
          <path fill="#ff94d9" d="M16 40h8v4h-8zm40 0h8v4h-8z" />
          <path fill="#171917" d="M24 24h8v6h-8zm24 0h8v6h-8zm-12 12h8v4h-8zm0 8h8v4h-8z" />
          <path fill="#0d9488" d="M20 56h40v8h4v12H16V64h4z" />
          <path fill="#171917" d="M28 68h4v8h-4zm20 0h4v8h-4z" />
        </>
      )}
      {type === 'penguin' && (
        <>
          <path fill="#171917" d="M20 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z" />
          <path fill="#1e293b" d="M24 8h32v8h8v36H16V16h8z" />
          <path fill="#f8fafc" d="M24 16h32v36h-4v8H28v-8h-4z" />
          <path fill="#171917" d="M28 24h6v8h-6zm18 0h6v8h-6z" />
          <path fill="#f59e0b" d="M34 32h12v6H34zm-14 40h12v4H20zm28 0h12v4H48z" />
          <path fill="#ffa6e8" d="M20 32h6v4h-6zm34 0h6v4h-6z" />
          <path fill="#ef4444" d="M20 48h40v8H20zm24 8h8v12h-8z" />
        </>
      )}
      {type === 'duck' && (
        <>
          <path fill="#171917" d="M20 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z" />
          <path fill="#facc15" d="M24 8h32v8h8v36H16V16h8z" />
          <path fill="#f97316" d="M28 32h24v8H28zm-8 40h12v4H20zm28 0h12v4H48z" />
          <path fill="#fb7185" d="M20 36h6v4h-6zm34 0h6v4h-6z" />
          <path fill="#171917" d="M28 24h6v8h-6zm18 0h6v8h-6z" />
          <path fill="#ffffff" d="M28 48h24v4H28z" />
          <path fill="#0284c7" d="M24 52h32v8h8v12H16V60h8z" />
        </>
      )}
      {type === 'frog' && (
        <>
          <path
            fill="#171917"
            d="M12 0h20v8h16V0h20v24h-4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24H8V0z"
          />
          <path fill="#4ade80" d="M16 4h12v12h24V4h12v32h-8v8H24v-8h-8z" />
          <path fill="#ffffff" d="M20 4h8v12h-8zm32 0h8v12h-8z" />
          <path fill="#171917" d="M24 8h4v6h-4zm32 0h4v6h-4zm-32 24h32v4H24z" />
          <path fill="#fef08a" d="M28 36h24v16H28z" />
          <path fill="#f43f5e" d="M16 32h8v4h-8zm40 0h8v4h-8z" />
          <path fill="#04bcf0" d="M24 56h32v8h8v12H16V64h8z" />
        </>
      )}
      {type === 'hamster' && (
        <>
          <path
            fill="#171917"
            d="M12 4h16v4h24V4h16v16h8v24h-8v8h-4v8h8v16H8V64h8v-8h-4v-8H4V24h8V4z"
          />
          <path fill="#e09f58" d="M16 8h12v8h24V8h12v20h8v16h-8v8H16v-8H8V28h8z" />
          <path fill="#fff5ea" d="M16 32h48v16H16z" />
          <path fill="#ff80bf" d="M20 8h4v6h-4zm36 0h4v6h-4zm-44 28h8v6h-8zm48 0h8v6h-8z" />
          <path fill="#171917" d="M24 24h8v8h-8zm24 0h8v8h-8zm-12 8h8v4h-8zm-2 8h12v4H34z" />
          <path fill="#f43f5e" d="M34 52h12v4H34zm-4 4h20v6H30zm4 6h12v4H34z" />
          <path fill="#c084fc" d="M24 64h32v8H24z" />
        </>
      )}
      {type === 'chick' && (
        <>
          <path
            fill="#171917"
            d="M32 0h16v4H32zm-12 4h40v4h8v16h4v28h-4v8h4v8h8v16H8V72h8v-8h4v-8h-4V24h4V8h4z"
          />
          <path fill="#ef4444" d="M36 0h8v4h-8z" />
          <path fill="#fde047" d="M24 8h32v8h8v36H16V16h8z" />
          <path fill="#f97316" d="M36 32h8v6h-8zm-12 40h8v4h-8zm24 0h8v4h-8z" />
          <path fill="#fb7185" d="M20 32h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#171917" d="M28 24h6v6h-6zm18 0h6v6h-6z" />
          <path fill="#22c55e" d="M24 52h32v8h8v12H16V60h8z" />
        </>
      )}
      {type === 'koala' && (
        <>
          <path
            fill="#171917"
            d="M4 8h16v8h40V8h16v24h-8v16h-4v8h4v8h8v16H4V72h8v-8h4v-8h-4V40H4V8z"
          />
          <path fill="#f1f5f9" d="M8 12h8v16H8zm56 0h8v16h-8z" />
          <path fill="#94a3b8" d="M16 16h48v32h-8v8H24v-8h-8z" />
          <path fill="#1e293b" d="M34 28h12v16H34z" />
          <path fill="#f472b6" d="M20 36h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#171917" d="M24 24h6v6h-6zm26 0h6v6h-6z" />
          <path fill="#facc15" d="M24 56h32v8h8v12H16V64h8z" />
        </>
      )}
    </svg>
  )
}
export function PixelFlower({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <path
        d="M24 0h16v8h8v8h8v8h8v16h-8v8h-8v8h-8v8H24v-8h-8v-8H8v-8H0V24h8v-8h8V8h8z"
        fill="#171917"
      />
      <path d="M24 4h16v16h20v20H40v20H24V40H4V24h20z" fill="#fffced" />
      <path d="M24 24h16v16H24z" fill="#fff238" />
      <path d="M24 24h4v4h-4zm12 0h4v4h-4zM28 32h8v4h-8z" fill="#171917" />
    </svg>
  )
}
