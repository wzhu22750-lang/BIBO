// Original 64-grid pixel friends. Colored SVG only; no raster art or emoji glyphs.
export const friendIds = ['bear', 'penguin', 'fox', 'frog', 'duck'] as const
export function PixelFriend({
  kind,
  size,
  className = '',
}: {
  kind: string
  size: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`event-art ${className}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {kind === 'bear' && (
        <>
          <path fill="#20211d" d="M8 4h16v4h16V4h16v16h-4v24h-4v8h4v8H12v-8h4v-8h-4V20H8z" />
          <path fill="#bc804b" d="M12 8h8v8h24V8h8v8h-4v24h-4v8H20v-8h-4V16h-4z" />
          <path fill="#ffe0a6" d="M24 28h16v16H24zM12 8h8v4h-8zm32 0h8v4h-8z" />
          <path fill="#20211d" d="M20 20h4v8h-4zm20 0h4v8h-4zM28 28h8v4h-8zM28 36h8v4h-8z" />
          <path fill="#ff9ab2" d="M16 28h8v4h-8zm24 0h8v4h-8z" />
          <path fill="#ffa6e8" d="M20 44h8v4h8v-4h8v8h-4v4H24v-4h-4z" />
          <path fill="#bc804b" d="M16 48h8v8h-8zm24 0h8v8h-8z" />
        </>
      )}
      {kind === 'penguin' && (
        <>
          <path fill="#20211d" d="M24 4h16v4h8v8h4v24h4v12h-8v8H16v-8H8V40h4V16h4V8h8z" />
          <path fill="#244d69" d="M24 8h16v4h4v8h4v32H16V20h4v-8h4z" />
          <path fill="#f7ffff" d="M20 16h8v4h8v-4h8v16h-4v4h4v16H20V36h4v-4h-4z" />
          <path fill="#20211d" d="M24 20h4v8h-4zm12 0h4v8h-4z" />
          <path fill="#ffc64d" d="M28 28h8v4h-8zM16 56h12v4H16zm20 0h12v4H36z" />
          <path fill="#ff83c7" d="M16 36h32v8H16zm20 8h8v8h-8z" />
          <path fill="#fff238" d="M20 36h4v8h-4zm12 0h4v8h-4z" />
        </>
      )}
      {kind === 'fox' && (
        <>
          <path fill="#20211d" d="M8 4h12v8h24V4h12v32h-8v8h-8v4h4v12H20V48h4v-4h-8v-8H8z" />
          <path fill="#ff9e45" d="M12 8h4v12h32V8h4v24h-8v8h-8v8h4v8H24v-8h4v-8h-8v-8h-8z" />
          <path fill="#ffd3bb" d="M12 12h4v8h-4zm36 0h4v8h-4z" />
          <path fill="#fff8e5" d="M12 28h12v4h16v-4h12v4h-8v8H20v-8h-8zM28 48h8v8h-8z" />
          <path fill="#20211d" d="M20 24h4v4h-4zm20 0h4v4h-4zM28 32h8v4h-8z" />
          <path fill="#2aeea4" d="M24 40h16v4H24zm12 4h8v4h-8z" />
          <path fill="#20211d" d="M44 44h8v-8h8v16h-4v4H40v-4h4z" />
          <path fill="#ff9e45" d="M48 44h8v8H44v-4h4z" />
          <path fill="#fff8e5" d="M56 40h4v8h-4z" />
        </>
      )}
      {kind === 'frog' && (
        <>
          <path fill="#20211d" d="M12 8h16v8h8V8h16v16h4v20h-8v8h8v8H8v-8h8v-8H8V24h4z" />
          <path fill="#5cdd80" d="M16 12h8v12h16V12h8v16h4v12h-8v12h8v4H12v-4h8V40h-8V28h4z" />
          <path fill="#fffef7" d="M16 12h8v8h-8zm24 0h8v8h-8zM24 44h16v12H24z" />
          <path fill="#20211d" d="M20 12h4v8h-4zm20 0h4v8h-4zM20 32h4v4h16v-4h4v8H20z" />
          <path fill="#ff96b2" d="M12 32h8v4h-8zm32 0h8v4h-8z" />
        </>
      )}
      {kind === 'duck' && (
        <>
          <path
            fill="#20211d"
            d="M24 4h20v4h8v8h4v8h8v8H52v8h-4v12h-4v8H16v-4H8V44H4V32h12v4h4V20h-4v-8h8z"
          />
          <path
            fill="#fff238"
            d="M24 12h4V8h16v4h4v16h-4v12h-4v8h-4v4H16v-4h-4V36h4v4h8V20h-4v-4h4z"
          />
          <path fill="#ffac43" d="M48 24h12v4H48zM20 56h8v4h-8zm12 0h8v4h-8z" />
          <path fill="#20211d" d="M40 16h4v8h-4zM20 40h4v4h12v4H20z" />
          <path fill="#fffbe6" d="M24 12h8v4h-8z" />
          <path fill="#ff91b8" d="M36 24h8v4h-8z" />
          <path fill="#04bcf0" d="M20 32h24v4H20zm16 4h8v8h-8z" />
        </>
      )}
    </svg>
  )
}
