// 44 colored pixel icons derived from pixelarticons with authentic retro color palettes.
export const coloredPixelIconIds = [
  'trophy',
  'gift',
  'coffee',
  'book',
  'briefcase',
  'code',
  'flag',
  'camera',
  'music',
  'headphone',
  'gamepad',
  'movie',
  'shopping',
  'sun',
  'moon',
  'tent',
  'compass',
  'backpack',
  'star',
  'balloon',
  'car',
  'bus',
  'ship',
  'earth',
  'fire',
  'cloud',
  'party',
  'crown',
  'gem',
  'bell',
  'coins',
  'tea',
  'apple',
  'wine',
  'mail',
  'bed',
  'clock',
  'pencil',
  'shield',
  'potion',
  'sparkles',
  'hourglass',
  'fish',
  'robot',
] as const

export type ColoredPixelIconId = (typeof coloredPixelIconIds)[number]

export function ColoredPixelIcon({
  id,
  size = 52,
  className = '',
}: {
  id: string
  size?: number
  className?: string
}) {
  return (
    <svg
      className={`event-art colored-pixel-art ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* 1. trophy */}
      {id === 'trophy' && (
        <>
          <path fill="#fff238" d="M8 5h8v10H8zm10 2h2v4h-2zm-14 0h2v4H4z" />
          <path fill="#facc15" d="M8 15h8v2H8zm3 2h2v2h-2z" />
          <path fill="#bc804b" d="M9 19h6v2H9z" />
          <path
            fill="#20211d"
            d="M16 17H13V19H15V21H9V19H11V17H8V15H16V17ZM18 5H22V11H20V7H18V11H20V13H18V15H16V5H8V15H6V13H4V11H6V7H4V11H2V5H6V3H18V5Z"
          />
        </>
      )}

      {/* 2. gift */}
      {id === 'gift' && (
        <>
          <path fill="#ffa6e8" d="M4 8h16v12H4z" />
          <path fill="#fff238" d="M11 8h2v12h-2zM4 11h16v2H4zM6 2h12v4H6z" />
          <path fill="#ff79c9" d="M8 4h2v2H8zm6 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M4 6h16v2H4zM2 8h2v4H2zm2 4h16v2H4zm16-4h2v4h-2zM6 4h2v2H6zm2-2h3v2H8zm3 2h2v2h-2zm2-2h3v2h-3zm3 2h2v2h-2zM4 14h2v6H4zm2 6h12v2H6zm12-6h2v6h-2zm-7-6h2v4h-2zm0 6h2v6h-2z"
          />
        </>
      )}

      {/* 3. coffee */}
      {id === 'coffee' && (
        <>
          <path fill="#2aeea4" d="M4 6h12v10H4zm12 2h4v6h-4z" />
          <path fill="#8d5b36" d="M6 6h8v4H6z" />
          <path fill="#e5f9ff" d="M7 2h2v2H7zm4 0h2v2h-2z" />
          <path fill="#fffef7" d="M2 18h18v2H2z" />
          <path
            fill="#20211d"
            d="M4 4h16v2H4zm0 2h2v8H4zm2 8h10v2H6zm14-8h2v4h-2zm-2 4h2v2h-2zm-2-4h2v8h-2zM2 18h18v2H2z"
          />
        </>
      )}

      {/* 4. book */}
      {id === 'book' && (
        <>
          <path fill="#04bcf0" d="M2 3h20v16H2z" />
          <path fill="#fffef7" d="M2 5h9v12H2zm11 0h9v12h-9z" />
          <path fill="#ff5252" d="M11 3h2v16h-2z" />
          <path fill="#bae6fd" d="M4 7h5v2H4zm0 4h5v2H4zm9-4h5v2h-5zm0 4h5v2h-5z" />
          <path
            fill="#20211d"
            d="M2 3h9v2H2zM0 19h11v2H0zM13 3h9v2h-9zm0 16h11v2H13zM11 5h2v18h-2zM0 5h2v14H0zm22 0h2v14h-2zm-7 2h5v2h-5zm0 4h5v2h-5zm0 4h2v2h-2z"
          />
        </>
      )}

      {/* 5. briefcase */}
      {id === 'briefcase' && (
        <>
          <path fill="#a56830" d="M4 8h16v12H4z" />
          <path fill="#20211d" d="M8 2h8v4H8z" />
          <path fill="#fffef7" d="M10 4h4v2h-4z" />
          <path fill="#fff238" d="M11 9h2v4h-2zm-4 3h2v2H7zm10 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M2 8h2v12H2zm18 0h2v12h-2zM4 6h16v2H4zm0 14h16v2H4zM8 4h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2z"
          />
        </>
      )}

      {/* 6. code */}
      {id === 'code' && (
        <>
          <path fill="#20211d" d="M2 4h20v16H2z" />
          <path fill="#2aeea4" d="M5 9h4v6H5zm10 0h4v6h-4z" />
          <path fill="#ffa6e8" d="M11 7h2v10h-2z" />
          <path
            fill="#20211d"
            d="M11 18H9v-4h2v4Zm-4-1H5v-2h2v2Zm12-2v2h-2v-2h2ZM5 15H3v-2h2v2Zm16 0h-2v-2h2v2Zm-8-1h-2v-4h2v4ZM3 13H1v-2h2v2Zm20 0h-2v-2h2v2ZM5 11H3V9h2v2Zm16 0h-2V9h2v2Zm-6-1h-2V6h2v4ZM7 9H5V7h2v2Zm12 0h-2V7h2v2Z"
          />
        </>
      )}

      {/* 7. flag */}
      {id === 'flag' && (
        <>
          <path fill="#ff5252" d="M6 4h14v8H6z" />
          <path fill="#ffa6e8" d="M16 6h4v4h-4z" />
          <path fill="#fff238" d="M3 1h4v3H3z" />
          <path fill="#20211d" d="M4 2h2v20H4z" />
          <path
            fill="#20211d"
            d="M4 4h16v2H4zm12 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zM4 12h16v2H4z"
          />
        </>
      )}

      {/* 8. camera */}
      {id === 'camera' && (
        <>
          <path fill="#c1a0ff" d="M2 7h20v12H2zm4-4h12v4H6z" />
          <path fill="#20211d" d="M8 9h8v8H8z" />
          <path fill="#04bcf0" d="M10 11h4v4h-4z" />
          <path fill="#fffef7" d="M12 12h2v2h-2z" />
          <path fill="#fff238" d="M16 5h3v2h-3z" />
          <path
            fill="#20211d"
            d="M4 5h4v2H4zm4-2h8v2H8zm8 2h4v2h-4zM2 7h2v12H2zm2 12h16v2H4zM20 7h2v12h-2zM10 8h4v2h-4zm0 6h4v2h-4zm-2-4h2v4H8zm6 0h2v4h-2z"
          />
        </>
      )}

      {/* 9. music */}
      {id === 'music' && (
        <>
          <path fill="#ffa6e8" d="M2 12h7v7H2zm10 2h7v7h-7z" />
          <path fill="#c1a0ff" d="M8 4h12v4H8z" />
          <path
            fill="#20211d"
            d="M4 12h4v2H4zm-2 2h2v4H2zm2 4h4v2H4zM8 6h2v12H8zm10 0h2v12h-2zm-6 8h2v4h-2zm2-2h4v2h-4zm0 6h4v2h-4zM10 4h8v2h-8z"
          />
        </>
      )}

      {/* 10. headphone */}
      {id === 'headphone' && (
        <>
          <path fill="#20211d" d="M5 5h14v10H5z" />
          <path fill="#fffef7" d="M7 5h10v8H7z" />
          <path fill="#04bcf0" d="M3 13h5v8H3zm13 0h5v8h-5z" />
          <path fill="#ffa6e8" d="M5 15h2v4H5zm14 0h2v4h-2z" />
          <path
            fill="#20211d"
            d="M14 13h7v2h-7zm2 6h3v2h-3zm-2-6h2v8h-2zm5-6h2v12h-2zM3 13h7v2H3zm2 6h3v2H5zm-2-6h2v12H3zm5 6h2v8H8zM7 3h10v2H7zM5 5h2v2H5zm12 0h2v2h-2z"
          />
        </>
      )}

      {/* 11. gamepad */}
      {id === 'gamepad' && (
        <>
          <path fill="#c1a0ff" d="M4 6h16v12H4z" />
          <path fill="#20211d" d="M6 10h6v4H6zM8 9h2v6H8z" />
          <path fill="#2aeea4" d="M14 10h2v2h-2z" />
          <path fill="#ff5252" d="M16 12h2v2h-2z" />
          <path
            fill="#20211d"
            d="M4 4h16v2H4zm0 14h16v2H4zM2 6h2v12H2zm18 0h2v12h-2zM8 9h2v6H8zm-2 2h6v2H6zm8-2h2v2h-2zm2 4h2v2h-2z"
          />
        </>
      )}

      {/* 12. movie */}
      {id === 'movie' && (
        <>
          <path fill="#fff238" d="M4 7h12v10H4z" />
          <path fill="#04bcf0" d="M16 7h4v10h-4z" />
          <path fill="#e5f9ff" d="M18 9h2v6h-2z" />
          <path fill="#20211d" d="M6 9h3v3H6zm0 4h3v3H6z" />
          <path
            fill="#20211d"
            d="M20 17V7h2v10zm-2-2V9h2v6zM2 7h2v10H2zm14 0h2v10h-2zM4 5h12v2H4zm0 12h12v2H4z"
          />
        </>
      )}

      {/* 13. shopping */}
      {id === 'shopping' && (
        <>
          <path fill="#ffa6e8" d="M3 8h18v12H3z" />
          <path fill="#fffef7" d="M7 4h10v4H7z" />
          <path fill="#fff238" d="M10 11h4v4h-4z" />
          <path
            fill="#20211d"
            d="M3 6h18v2H3zm2 14h14v2H5zM3 8h2v12H3zm16 0h2v12h-2zm-12-4h2v6H7zm2-2h6v2H9zm6 2h2v6h-2z"
          />
        </>
      )}

      {/* 14. sun */}
      {id === 'sun' && (
        <>
          <path fill="#fff238" d="M7 7h10v10H7z" />
          <path fill="#ff9e45" d="M9 9h6v6H9z" />
          <path
            fill="#20211d"
            d="M13 22h-2v-3h2v3Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2Zm-4-2H9v-2h6v2Zm-6-2H7V9h2v6Zm8 0h-2V9h2v6ZM5 13H2v-2h3v2Zm17 0h-3v-2h3v2Zm-7-4H9V7h6v2ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Zm-6-2h-2V2h2v3Z"
          />
        </>
      )}

      {/* 15. moon */}
      {id === 'moon' && (
        <>
          <path fill="#fff238" d="M6 4h12v16H6z" />
          <path fill="#e5f9ff" d="M15 4h2v2h-2zm3 6h2v2h-2z" />
          <path
            fill="#20211d"
            d="M18 22H8v-2h10v2ZM8 20H6v-2h2v2Zm12 0h-2v-2h2v2ZM6 18H4v-2h2v2Zm16 0h-2v-4h-2v-2h2v-2h2v8ZM4 16H2V6h2v10Zm14 0h-6v-2h6v2Zm-6-2h-2v-2h2v2Zm-2-2H8V6h2v6ZM6 6H4V4h2v2Zm8-2h-2v2h-2V4H6V2h8v2Z"
          />
        </>
      )}

      {/* 16. tent */}
      {id === 'tent' && (
        <>
          <path fill="#2aeea4" d="M3 7h18v12H3z" />
          <path fill="#15803d" d="M9 13h6v6H9z" />
          <path fill="#8d5b36" d="M1 19h22v2H1z" />
          <path fill="#fff238" d="M11 5h2v2h-2z" />
          <path
            fill="#20211d"
            d="M1 19h22v2H1zm2-2h2v3H3zm2-3h2v3H5zm2-3h2v3H7zm2-3h2v3H9zm2-3h2v3h-2zM9 3h2v2H9zm4 5h2v3h-2zm2 3h2v3h-2zm2 3h2v3h-2zm2 3h2v3h-2zM9 17h2v2H9zm4 0h2v2h-2zm-2-2h2v2h-2zm2-12h2v2h-2z"
          />
        </>
      )}

      {/* 17. compass */}
      {id === 'compass' && (
        <>
          <path fill="#fffef7" d="M4 4h16v16H4z" />
          <path fill="#fff238" d="M6 2h12v3H6zm0 17h12v3H6z" />
          <path fill="#ff5252" d="M12 6h4v6h-4z" />
          <path fill="#04bcf0" d="M8 12h4v6H8z" />
          <path fill="#20211d" d="M11 11h2v2h-2z" />
          <path
            fill="#20211d"
            d="M18 22H6V20H18V22ZM6 20H4V18H6V20ZM20 20H18V18H20V20ZM10 16H12V18H10V19H8V10H10V16ZM4 18H2V6H4V18ZM22 18H20V6H22V18ZM14 16H12V14H14V16ZM16 14H14V8H12V6H14V5H16V14ZM13 13H11V11H13V13ZM12 10H10V8H12V10ZM6 6H4V4H6V6ZM20 6H18V4H20V6ZM18 4H6V2H18V4Z"
          />
        </>
      )}

      {/* 18. backpack */}
      {id === 'backpack' && (
        <>
          <path fill="#04bcf0" d="M5 8h14v12H5z" />
          <path fill="#fff238" d="M7 14h10v6H7z" />
          <path fill="#ffa6e8" d="M8 4h8v4H8z" />
          <path
            fill="#20211d"
            d="M5 6h14v2H5zM3 8h2v12H3zm2 12h14v2H5zM19 8h2v12h-2zm-12 8h2v6H7zm8 0h2v6h-2zm-6-2h6v2H9zm-2-4h10v2H7zm1-6h2v2H8zm6 0h2v2h-2zm-4-2h4v2h-4z"
          />
        </>
      )}

      {/* 19. star */}
      {id === 'star' && (
        <>
          <path fill="#fff238" d="M3 3h18v18H3z" />
          <path fill="#ff9e45" d="M9 9h6v6H9z" />
          <path fill="#fffef7" d="M11 11h2v2h-2z" />
          <path
            fill="#20211d"
            d="M5 20H8V22H3V16H5V20ZM21 22H16V20H19V16H21V22ZM10 20H8V18H10V20ZM16 20H14V18H16V20ZM14 18H10V16H14V18ZM7 16H5V13H7V16ZM19 16H17V13H19V16ZM5 13H3V11H5V13ZM21 13H19V11H21V13ZM9 9H3V11H1V7H9V9ZM23 11H21V9H15V7H23V11ZM11 7H9V3H11V7ZM15 7H13V3H15V7ZM13 3H11V1H13V3Z"
          />
        </>
      )}

      {/* 20. balloon */}
      {id === 'balloon' && (
        <>
          <path fill="#ffa6e8" d="M7 3h10v12H7z" />
          <path fill="#fffef7" d="M9 5h3v3H9z" />
          <path fill="#ff5252" d="M10 15h4v2h-4z" />
          <path fill="#20211d" d="M11 17h2v6h-2z" />
          <path
            fill="#20211d"
            d="M9 1h6v2H9zM7 3h2v2H7zm8 0h2v2h-2zm-4 2h2v2h-2zm2 2h2v2h-2zM5 5h2v8H5zm12 0h2v8h-2zM7 13h2v2H7zm2 2h2v2H9zm4 4h4v2h-4zm-2-4h4v2h-4zm4-2h2v2h-2zm2 8h2v2h-2zm-6-4h2v2h-2z"
          />
        </>
      )}

      {/* 21. car */}
      {id === 'car' && (
        <>
          <path fill="#04bcf0" d="M4 7h16v8H4zm-2 4h20v4H2z" />
          <path fill="#e5f9ff" d="M4 7h6v4H4zm8 2h8v2h-8z" />
          <path fill="#fff238" d="M0 11h2v3H0z" />
          <path fill="#ff5252" d="M22 11h2v3h-2z" />
          <path fill="#20211d" d="M4 13h6v4H4zm10 0h6v4h-6z" />
          <path fill="#fffef7" d="M6 14h2v2H6zm10 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M4 13h6v2H4zm10 0h6v2h-6zM4 17h6v2H4zm10 0h6v2h-6zM2 15h4v2H2zm6 0h8v2H8zm10 0h4v2h-4zm4-4h2v4h-2zm-6-4h2v2h-2zM4 5h12v2H4zm-4 6h2v4H0zm12-2h10v2H12zM2 7h2v4H2zm8 0h2v2h-2z"
          />
        </>
      )}

      {/* 22. bus */}
      {id === 'bus' && (
        <>
          <path fill="#2aeea4" d="M2 5h18v12H2z" />
          <path fill="#e5f9ff" d="M2 7h5v4H2zm7 0h7v4H9zm9 0h2v4h-2z" />
          <path fill="#fff238" d="M0 13h2v2H0z" />
          <path fill="#20211d" d="M4 15h6v4H4zm10 0h6v4h-6z" />
          <path fill="#fffef7" d="M6 16h2v2H6zm10 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M4 15h6v2H4zm10 0h6v2h-6zM4 19h6v2H4zm10 0h6v2h-6zM0 7h2v10H0zm2-2h18v2H2zm20 4h2v8h-2zM2 11h20v2H2zm2 6h2v2H4zm4 0h8v2H8zm-6 0h2v2H2zm16 0h4v2h-4zm2-10h2v2h-2zm-6 0h2v4h-2zM7 7h2v4H7z"
          />
        </>
      )}

      {/* 23. ship */}
      {id === 'ship' && (
        <>
          <path fill="#04bcf0" d="M2 10h18v6H2z" />
          <path fill="#fffef7" d="M6 6h8v4H6z" />
          <path fill="#ff5252" d="M8 4h2v4H8z" />
          <path fill="#fff238" d="M6 12h2v2H6zm6 0h2v2h-2zm6 0h2v2h-2z" />
          <path fill="#0284c7" d="M0 16h24v6H0z" />
          <path fill="#20211d" d="M14 8h2v2h-2zm4 8h2v2h-2zM8 4h2v4H8z" />
          <path
            fill="#20211d"
            d="M6 6h8v2H6zm-4 4h20v2H2zm18 2h2v4h-2zM2 12h2v6H2zm4-4h2v2H6zm-6 8h4v2H0zm4 2h4v2H4zm4-2h4v2H8zm4 2h4v2h-4zm4-2h4v2h-4zm4 2h4v2h-4z"
          />
        </>
      )}

      {/* 24. earth */}
      {id === 'earth' && (
        <>
          <path fill="#04bcf0" d="M4 4h16v16H4z" />
          <path
            fill="#2aeea4"
            d="M8 4h2v4H8zm2 4h4v2h-4zm4 2h4v2h-4zm4-2h2v2h-2zM4 12h2v2H4zm6 4h2v4h-2zm-4-2h4v2H6zm8 2h2v4h-2zm2-2h4v2h-4z"
          />
          <path
            fill="#20211d"
            d="M6 2h12v2H6zm0 18h12v2H6zM18 4h2v2h-2zM4 18h2v2H4zM4 4h2v2H4zm14 14h2v2h-2zM2 6h2v12H2zm18 0h2v12h-2z"
          />
        </>
      )}

      {/* 25. fire */}
      {id === 'fire' && (
        <>
          <path fill="#ff5252" d="M5 8h14v11H5z" />
          <path fill="#ff9e45" d="M7 10h10v7H7z" />
          <path fill="#fff238" d="M9 12h6v5H9z" />
          <path fill="#8d5b36" d="M5 19h14v3H5z" />
          <path
            fill="#20211d"
            d="M9 2h2v4H9zM7 6h2v2H7zM5 8h2v2H5zm8 2h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm2 2h2v6h-2zM3 10h2v8H3zm8-4h2v4h-2zm6 12h2v2h-2zM7 20h10v2H7zm-2-2h2v2H5zm4-2h6v4H9zm2-2h2v3h-2z"
          />
        </>
      )}

      {/* 26. cloud */}
      {id === 'cloud' && (
        <>
          <path fill="#fff238" d="M8 2h10v8H8z" />
          <path fill="#e5f9ff" d="M2 12h14v10H2z" />
          <path fill="#bae6fd" d="M4 18h10v2H4z" />
          <path
            fill="#20211d"
            d="M14 22H4v-2h10v2ZM4 20H2v-4h2v4Zm12 0h-2v-4h2v4Zm-6-2H8v-2h2v2Zm-2-2H4v-2h4v2Zm6 0h-2v-2h2v2Zm-2-2H8v-2h4v2Zm12-1h-4v-2h4v2Zm-6-1h-2v-2h2v2ZM8 10H6V8h2v2Zm8 0h-2V8h2v2Zm-2-2H8V6h6v2ZM6 6H4V4h2v2Zm14 0h-2V4h2v2ZM4 4H2V2h2v2Zm9 0h-2V0h2v4Zm9 0h-2V2h2v2Z"
          />
        </>
      )}

      {/* 27. party */}
      {id === 'party' && (
        <>
          <path fill="#fff238" d="M4 14h10v6H4z" />
          <path fill="#ffa6e8" d="M6 16h4v3H6z" />
          <path fill="#fff238" d="M12 2h4v4h-4zM20 5h2v2h-2z" />
          <path fill="#ffa6e8" d="M16 6h4v3h-4zM3 6h2v2H3z" />
          <path fill="#04bcf0" d="M18 12h4v4h-4zM10 2h2v3h-2z" />
          <path fill="#2aeea4" d="M18 19h2v2h-2zM8 2h2v2H8z" />
          <path
            fill="#20211d"
            d="M4 20H6V22H2V18H4V20ZM20 21H18V19H20V21ZM10 20H6V18H10V20ZM6 18H4V14H6V18ZM14 18H10V16H14V18ZM10 16H8V14H10V16ZM16 16H14V12H16V16ZM22 16H20V14H22V16ZM8 14H6V10H8V14ZM20 14H18V12H20V14ZM14 12H12V10H14V12ZM12 10H8V8H12V10ZM20 9H16V7H20V9ZM5 8H3V6H5V8ZM22 7H20V5H22V7ZM12 6H10V4H12V6ZM10 4H8V2H10V4ZM17 4H15V2H17V4Z"
          />
        </>
      )}

      {/* 28. crown */}
      {id === 'crown' && (
        <>
          <path fill="#fff238" d="M3 5h18v12H3z" />
          <path fill="#ffa6e8" d="M3 15h18v4H3z" />
          <path fill="#ff5252" d="M10 9h4v4h-4z" />
          <path fill="#04bcf0" d="M5 9h2v2H5zm12 0h2v2h-2z" />
          <path fill="#fffef7" d="M3 3h2v2H3zm8 0h2v2h-2zm8 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M3 3h2v12H3zm16 0h2v12h-2zm-8 0h2v2h-2zM9 5h2v2H9zM5 5h2v2H5zm0 0h2v2H3zm4 4h2v2H7zm6-2h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2zM5 15h14v2H5zm-2 4h18v2H3z"
          />
        </>
      )}

      {/* 29. gem */}
      {id === 'gem' && (
        <>
          <path fill="#e5f9ff" d="M7 3h10v6H7z" />
          <path fill="#57d8ff" d="M3 7h18v6H3z" />
          <path fill="#04bcf0" d="M5 11h14v8H5z" />
          <path fill="#0284c7" d="M9 17h6v4H9z" />
          <path
            fill="#20211d"
            d="M7 1h10v2H7zM5 3h2v2H5zm12 0h2v2h-2zm2 2h2v2h-2zm0 8h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2-2h2v2H9zm-2-2h2v2H7zm-2-2h2v2H5zm-2-2h2v2H3zm0-8h2v2H3zM1 7h2v6H1zm20 0h2v6h-2zM3 9h18v2H3zm6-6h2v3H9zM7 6h2v3H7zm8 0h2v3h-2zm-8 5h2v2H7zm2 2h2v3H9zm2 3h2v3h-2zm2-3h2v3h-2zm2-2h2v2h-2zm-2-8h2v3h-2z"
          />
        </>
      )}

      {/* 30. bell */}
      {id === 'bell' && (
        <>
          <path fill="#fff238" d="M5 4h14v11H5z" />
          <path fill="#f59e0b" d="M9 16h6v4H9z" />
          <path fill="#ffa6e8" d="M1 4h2v2H1zm20 0h2v2h-2zm-2-2h2v2h-2zM3 2h2v2H3z" />
          <path
            fill="#20211d"
            d="M14 22H10V20H14V22ZM10 20H8V18H10V20ZM16 20H14V18H16V20ZM5 15H19V13H21V17H3V13H5V15ZM7 13H5V6H7V13ZM19 13H17V6H19V13ZM3 6H1V4H3V6ZM9 6H7V4H9V6ZM17 6H15V4H17V6ZM23 6H21V4H23V6ZM5 4H3V2H5V4ZM15 4H9V2H15V4ZM21 4H19V2H21V4Z"
          />
        </>
      )}

      {/* 31. coins */}
      {id === 'coins' && (
        <>
          <path fill="#fff238" d="M4 4h10v10H4z" />
          <path fill="#facc15" d="M10 8h10v12h-10z" />
          <path fill="#fef08a" d="M7 6h4v4H7zm7 6h4v4h-4z" />
          <path
            fill="#20211d"
            d="M6 2h6v2H6zM4 4h2v2H4zm8 0h2v2h-2zm-8 8h2v2H4zm8 0h2v2h-2zm-6 2h6v2H6zM2 6h2v6H2zm12 0h2v6h-2zm0 2h4v2h-4zm-4 10h2v2h-2zm8-8h2v2h-2zm-6 10h2v2h-2zm6-2h2v2h-2zm-8 2h6v2h-6zm-4-6h2v4H8zm12-2h2v6h-2zM7 6h4v2H7zm2 0h2v6H9zm6 8h2v4h-2zm-1-2h3v2h-3z"
          />
        </>
      )}

      {/* 32. tea */}
      {id === 'tea' && (
        <>
          <path fill="#2aeea4" d="M4 8h12v10H4zm12 2h4v4h-4z" />
          <path fill="#d97706" d="M6 8h8v4H6z" />
          <path fill="#e5f9ff" d="M7 0h8v4H7z" />
          <path
            fill="#20211d"
            d="M4 6h16v2H4zm0 2h2v10H4zm2 10h10v2H6zM20 8h2v4h-2zm-2 4h2v2h-2zm-2-4h2v10h-2zM7 2h2v2H7zm6 0h2v2h-2zM9 0h2v2H9zm6 0h2v2h-2zm-5 8h2v4h-2zm-2 4h6v4H8z"
          />
        </>
      )}

      {/* 33. apple */}
      {id === 'apple' && (
        <>
          <path fill="#ff5252" d="M3 8h16v13H3z" />
          <path fill="#ffb4b4" d="M5 10h3v4H5z" />
          <path fill="#8d5b36" d="M11 3h3v5h-3z" />
          <path fill="#2aeea4" d="M14 6h4v3h-4z" />
          <path
            fill="#20211d"
            d="M11 8h3v2h-3zm3-2h4v2h-4zm4 2h2v3h-2zm-2 3h2v4h-2zm2 4h2v5h-2zm-4 5h4v2h-4zm-3-2h3v2h-3zm-4 2h4v2H7zm-2-2h2v2H5zm-2-8h2v8H3zm2-2h2v2H5zm2-2h4v2H7zm5-3h2v2h-2zm2-2h2v2h-2z"
          />
        </>
      )}

      {/* 34. wine */}
      {id === 'wine' && (
        <>
          <path fill="#15803d" d="M5 9h14v12H5z" />
          <path fill="#be123c" d="M9 1h6v6H9z" />
          <path fill="#fffef7" d="M7 11h10v7H7z" />
          <path fill="#ff5252" d="M10 13h4v3h-4z" />
          <path
            fill="#20211d"
            d="M9 1h6v2H9zm0 2h2v4H9zm4 0h2v4h-2zM7 7h2v2H7zm8 0h2v2h-2zm2 2h2v12h-2zM5 9h2v12H5zm2 12h10v2H7z"
          />
        </>
      )}

      {/* 35. mail */}
      {id === 'mail' && (
        <>
          <path fill="#fffef7" d="M2 4h20v14H2z" />
          <path fill="#f1f5f9" d="M4 6h16v8H4z" />
          <path fill="#ff79c9" d="M10 9h4v4h-4z" />
          <path
            fill="#20211d"
            d="M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z"
          />
        </>
      )}

      {/* 36. bed */}
      {id === 'bed' && (
        <>
          <path fill="#a56830" d="M2 4h2v16H2zm18 8h2v8h-2z" />
          <path fill="#ffa6e8" d="M6 12h14v6H6z" />
          <path fill="#fffef7" d="M4 8h6v4H4z" />
          <path fill="#e5f9ff" d="M4 12h16v4H4z" />
          <path
            fill="#20211d"
            d="M2 4h2v16H2zm18 6h2v10h-2zm-18 6h20v2H2zm2-8h16v2H4zm2 2h2v6H6z"
          />
        </>
      )}

      {/* 37. clock */}
      {id === 'clock' && (
        <>
          <path fill="#fff238" d="M4 4h16v16H4z" />
          <path fill="#fffef7" d="M6 6h12v12H6z" />
          <path fill="#04bcf0" d="M3 2h4v3H3zm14 0h4v3h-4z" />
          <path fill="#20211d" d="M11 7h2v6h-2zm2 7h3v2h-3z" />
          <path
            fill="#20211d"
            d="M6 2h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zM4 4h2v2H4zm2 18h12v-2H6zm12-2h2v-2h-2zM4 20h2v-2H4zm7-14h2v7h-2zm2 7h2v2h-2zm2 2h2v2h-2z"
          />
        </>
      )}

      {/* 38. pencil */}
      {id === 'pencil' && (
        <>
          <path fill="#fff238" d="M8 8h10v10H8z" />
          <path fill="#ffa6e8" d="M16 2h6v6h-6z" />
          <path fill="#cbd5e1" d="M14 6h4v4h-4z" />
          <path fill="#fef3c7" d="M4 14h6v6H4z" />
          <path fill="#20211d" d="M2 18h3v3H2z" />
          <path
            fill="#20211d"
            d="M4 16H6V18H8V20H10V22H2V14H4V16ZM12 20H10V18H12V20ZM14 18H12V16H14V18ZM10 16H8V14H10V16ZM16 16H14V14H16V16ZM6 14H4V12H6V14ZM12 14H10V12H12V14ZM18 14H16V12H18V14ZM8 12H6V10H8V12ZM14 12H12V10H14V12ZM20 12H18V10H20V12ZM10 10H8V8H10V10ZM18 10H16V8H18V10ZM22 10H20V8H22V10ZM12 8H10V6H12V8ZM16 8H14V6H16V8ZM20 8H18V6H20V8ZM14 6H12V4H14V6ZM18 6H16V4H18V6ZM16 4H14V2H16V4Z"
          />
        </>
      )}

      {/* 39. shield */}
      {id === 'shield' && (
        <>
          <path fill="#0ea5e9" d="M4 4h16v12H4zm2 12h12v4H6zm2 4h8v2H8z" />
          <path fill="#fff238" d="M11 6h2v8h-2zm-3 3h8v2H8z" />
          <path fill="#7dd3fc" d="M4 4h2v10H4z" />
          <path
            fill="#20211d"
            d="M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z"
          />
        </>
      )}

      {/* 40. potion */}
      {id === 'potion' && (
        <>
          <path fill="#e5f9ff" d="M4 10h16v10H4z" />
          <path fill="#ff4d6d" d="M6 12h12v8H6z" />
          <path fill="#ffa6e8" d="M8 14h2v2H8zm4-1h2v2h-2z" />
          <path fill="#bc804b" d="M8 2h8v4H8z" />
          <path
            fill="#20211d"
            d="M8 6h8v2H8zm0-4h8v2H8zm0 6h2v2H8zm6 0h2v2h-2zM6 20h12v2H6zm-2-8h2v8H4zm14 0h2v8h-2zM6 10h2v2H6zm10 0h2v2h-2zM6 4h2v2H6zm10 0h2v2h-2z"
          />
        </>
      )}

      {/* 41. sparkles */}
      {id === 'sparkles' && (
        <>
          <path fill="#fff238" d="M9 9h6v6H9zm2-4h2v14h-2zm-6 6h14v2H5z" />
          <path fill="#ffa6e8" d="M18 1h4v4h-4z" />
          <path fill="#04bcf0" d="M2 18h4v4H2z" />
          <path fill="#fffef7" d="M11 11h2v2h-2z" />
          <path
            fill="#20211d"
            d="M11 1h2v4h-2zm0 22h2v-4h-2zM9 5h2v4H9zm0 14h2v-4H9zm4-14h2v4h-2zm0 14h2v-4h-2zM5 9h4v2H5zm14 0h-4v2h4zM1 11h4v2H1zm22 0h-4v2h4zM5 13h4v2H5zm14 0h-4v2h4zm0-12h2v6h-2zM17 3h6v2h-6zM3 17h2v2H3zm-2 2h2v2H1zm2 2h2v2H3zm2-2h2v2H5z"
          />
        </>
      )}

      {/* 42. hourglass */}
      {id === 'hourglass' && (
        <>
          <path fill="#a56830" d="M6 2h12v3H6zm0 17h12v3H6z" />
          <path fill="#e5f9ff" d="M8 5h8v14H8z" />
          <path fill="#facc15" d="M9 6h6v3H9zm0 15h6v3H9zm2-8h2v5h-2z" />
          <path
            fill="#20211d"
            d="M16 22H8v-2h8v2Zm-8-2H6v-4h2v4Zm10 0h-2v-4h2v4Zm-8-4H8v-2h2v2Zm6 0h-2v-2h2v2Zm-6-6h4v4h-4v-4Zm0 0H8V8h2v2Zm6 0h-2V8h2v2ZM8 8H6V4h2v4Zm10 0h-2V4h2v4Zm-2-4H8V2h8v2Z"
          />
        </>
      )}

      {/* 43. fish */}
      {id === 'fish' && (
        <>
          <path fill="#ff7043" d="M4 7h14v10H4z" />
          <path fill="#fff238" d="M6 13h10v3H6z" />
          <path fill="#ffa940" d="M2 8h3v8H2z" />
          <path fill="#fffef7" d="M15 9h2v2h-2z" />
          <path fill="#20211d" d="M16 9h1v1h-1z" />
          <path fill="#57d8ff" d="M18 3h2v2h-2zm2 3h2v2h-2z" />
          <path
            fill="#20211d"
            d="M20 9h2v6h-2zm-2-2h2v2h-2zm0 8h2v2h-2zm-6 2h6v2h-6zm0-12h6v2h-6zM2 7h2v10H2zm2 2h2v2H4zm0 4h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm0 4h2v2H8zm2 2h2v2h-2zm0-8h2v2h-2zm5 3h2v2h-2z"
          />
        </>
      )}

      {/* 44. robot */}
      {id === 'robot' && (
        <>
          <path fill="#bae6fd" d="M4 8h16v12H4z" />
          <path fill="#fff238" d="M8 10h2v2H8zm6 0h2v2h-2z" />
          <path fill="#ff5252" d="M10 2h4v2h-4z" />
          <path fill="#ffa6e8" d="M5 13h2v2H5zm12 0h2v2h-2z" />
          <path fill="#38bdf8" d="M0 12h2v2H0zm22 0h2v2h-2z" />
          <path
            fill="#20211d"
            d="M4 6h16v2H4zm0 14h16v2H4zM2 8h2v12H2zm18 0h2v12h-2zm-9-4h2v4h-2zm-3 6h2v2H8zm6 0h2v2h-2zm-1-8h4v2h-4zM0 12h2v2H0zm22 0h2v2h-2zM7 14h10v2H7zm2 2h6v2H9z"
          />
        </>
      )}
    </svg>
  )
}
