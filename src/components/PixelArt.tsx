import type { CSSProperties } from 'react'
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
  type?: 'cat' | 'bunny'
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
      {type === 'cat' ? (
        <>
          <path fill="#171917" d="M12 8h16v8h24V8h16v40h-8v8h-4v8h8v16H16V64h8v-8h-4v-8h-8z" />
          <path fill="#ffbb53" d="M16 12h8v12h32V12h8v32h-8v8H24v-8h-8z" />
          <path fill="#ffe8b9" d="M24 32h32v16H24z" />
          <path fill="#ff817b" d="M16 16h4v8h-4zm44 0h4v8h-4zM20 36h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#171917" d="M24 28h8v8h-8zm24 0h8v8h-8zM36 36h8v4h-8zm-4 8h16v4H32z" />
          <path fill="#0beca0" d="M28 56h24v8h8v12H20V64h8z" />
          <path fill="#171917" d="M28 68h4v8h-4zm20 0h4v8h-4z" />
        </>
      ) : (
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
