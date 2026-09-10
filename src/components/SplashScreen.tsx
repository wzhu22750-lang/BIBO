import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Icon } from './PixelArt'

/**
 * 启动屏动画（约 2.5s + 0.4s 退场）。
 *
 * 全部为代码生成的像素方块：只动画 transform / opacity，GPU 友好；
 * 不依赖图片、视频或 GIF。app 主体在它下方正常初始化，因此不阻塞启动。
 *
 * 时间轴：
 *   0.00s  中心像素出现
 *   0.30s  像素粒子扩散成一个小小像素世界
 *   1.00s  两个像素（你我）从两侧走入
 *   1.30s  中间连出一颗心
 *   1.75s  世界与两个像素向中心汇聚
 *   1.95s  BIBU！字样出现，完成 logo
 *   2.45s  整体淡出，进入主界面
 */

const NAVY = '#0a1020'
const BLUE = '#04bcf0'
const BLUE_LIGHT = '#7fd8ff'
const PINK = '#ffa6e8'
const WHITE = '#eaf4ff'

const CELL = 17
const EXIT_AT_MS = 2450

type WorldPixel = {
  x: number
  y: number
  size: number
  color: string
  delay: number
}

/** 曼哈顿距离 2 与 4 的菱形环，构成一个小小像素世界 */
function buildWorld(): WorldPixel[] {
  const grid = 9
  const center = (grid - 1) / 2
  const pixels: WorldPixel[] = []
  for (let gx = 0; gx < grid; gx += 1) {
    for (let gy = 0; gy < grid; gy += 1) {
      const dx = gx - center
      const dy = gy - center
      const manhattan = Math.abs(dx) + Math.abs(dy)
      if (manhattan !== 2 && manhattan !== 4) continue
      const inner = manhattan === 2
      pixels.push({
        x: dx * CELL,
        y: dy * CELL,
        size: inner ? 6 : 9,
        color: inner ? BLUE_LIGHT : (gx + gy) % 2 === 0 ? BLUE : PINK,
        delay: (manhattan - 2) * 0.09,
      })
    }
  }
  return pixels
}

function Logo({ visible }: { visible: boolean }) {
  return (
    <motion.div
      className="splash-logo"
      initial={false}
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.72, y: 10 }}
      transition={{ type: 'spring', stiffness: 210, damping: 20 }}
    >
      <span className="splash-logo-word">
        BIBU<span>!</span>
      </span>
      <span className="splash-logo-cn">哔 卟 哔 卟</span>
    </motion.div>
  )
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const world = useMemo(buildWorld, [])
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  // 0 中心像素 → 1 像素世界 → 2 两个用户 → 3 连心 → 4 汇聚 → 5 logo
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (reduced) {
      const timer = setTimeout(onDone, 900)
      return () => clearTimeout(timer)
    }
    const timers = [
      setTimeout(() => setPhase(1), 280),
      setTimeout(() => setPhase(2), 950),
      setTimeout(() => setPhase(3), 1250),
      setTimeout(() => setPhase(4), 1650),
      setTimeout(() => setPhase(5), 1850),
      setTimeout(onDone, EXIT_AT_MS),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone, reduced])

  if (reduced) {
    return (
      <motion.div
        className="splash-screen"
        aria-hidden="true"
        style={{ background: NAVY }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="splash-logo-wrap">
          <Logo visible />
        </div>
      </motion.div>
    )
  }

  const merging = phase >= 4

  return (
    <motion.div
      className="splash-screen"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeIn' }}
    >
      {/* 中心光晕 */}
      <motion.span
        className="splash-glow"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.35 }}
        animate={{ opacity: [0, 0.85, 0.55], scale: [0.35, 1, 1.15] }}
        transition={{ duration: 2.3, delay: 0.15, ease: 'easeOut' }}
      />

      <div className="splash-stage-wrap">
        <div className="splash-stage">
          {/* 1. 中心像素 */}
          <motion.span
            className="splash-pixel splash-pixel-center"
            aria-hidden="true"
            style={{ width: 14, height: 14, marginLeft: -7, marginTop: -7, background: WHITE }}
            initial={{ opacity: 0, scale: 0 }}
            animate={merging ? { opacity: 0, scale: 0.3 } : { opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          />

          {/* 2. 像素世界：从中心向外扩散 */}
          {world.map((pixel) => (
            <motion.span
              key={`${pixel.x}:${pixel.y}`}
              className="splash-pixel"
              aria-hidden="true"
              style={{
                width: pixel.size,
                height: pixel.size,
                marginLeft: -pixel.size / 2,
                marginTop: -pixel.size / 2,
                background: pixel.color,
                boxShadow: `0 0 6px ${pixel.color}`,
              }}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={
                merging
                  ? { opacity: 0, scale: 0, x: 0, y: 0 }
                  : phase >= 1
                    ? { opacity: 1, scale: 1, x: pixel.x, y: pixel.y }
                    : { opacity: 0, scale: 0, x: 0, y: 0 }
              }
              transition={
                merging
                  ? { duration: 0.4, ease: 'easeIn' }
                  : { type: 'spring', stiffness: 200, damping: 20, delay: pixel.delay }
              }
            />
          ))}

          {/* 3. 连接线 */}
          <motion.span
            className="splash-link"
            aria-hidden="true"
            initial={false}
            animate={
              merging
                ? { opacity: 0, scaleX: 0 }
                : phase >= 3
                  ? { opacity: 0.85, scaleX: 1 }
                  : { opacity: 0, scaleX: 0 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />

          {/* 3. 两个用户像素 */}
          <motion.span
            className="splash-pixel splash-user splash-user-me"
            aria-hidden="true"
            initial={false}
            animate={
              merging
                ? { opacity: 0, x: 0, scale: 0.2 }
                : phase >= 2
                  ? { opacity: 1, x: -28, scale: 1 }
                  : { opacity: 0, x: -84, scale: 0.4 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          />
          <motion.span
            className="splash-pixel splash-user splash-user-you"
            aria-hidden="true"
            initial={false}
            animate={
              merging
                ? { opacity: 0, x: 0, scale: 0.2 }
                : phase >= 2
                  ? { opacity: 1, x: 28, scale: 1 }
                  : { opacity: 0, x: 84, scale: 0.4 }
            }
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          />

          {/* 3/4/5. 心：连心 → 汇聚 → logo 标记 */}
          <motion.span
            className="splash-heart"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0 }}
            animate={
              phase >= 3
                ? { opacity: 1, scale: merging ? 1.16 : 1 }
                : { opacity: 0, scale: 0 }
            }
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <Icon name="heart" size={30} />
          </motion.span>

          {/* 5. BIBU！字样 */}
          <div className="splash-logo-slot">
            <Logo visible={phase >= 5} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
