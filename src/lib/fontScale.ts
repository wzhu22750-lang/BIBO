/**
 * 系统字体大小探测与自适应
 * ------------------------------------------------
 * Android WebView 会把「设置 → 显示 → 字体大小」的缩放系数同时作用在
 * 全部文本（包括 px 固定字号）上，但布局的宽度/间距仍是固定 px，
 * 于是系统字体调大后，固定尺寸的像素风控件就会相互挤压、溢出重叠。
 *
 * 这里用 1em 探针测量真实缩放系数：
 *   - 写入 CSS 变量 --fs-scale（实际系数）与 --fs-inv（倒数，用于 zoom 反缩放）
 *   - 写入档位属性 data-fs-grow / -big / -xl / -xxl，样式表按档位放宽布局
 */

export const DEFAULT_SCALE = 1
export const MIN_SCALE = 0.85
export const MAX_SCALE = 3

let cached = DEFAULT_SCALE

/** 依据 --fs-scale 判断命中的档位（纯函数，便于单测） */
export function fontScaleTiers(scale: number): Record<TierKey, boolean> {
  return {
    grow: scale >= 1.15,
    big: scale >= 1.3,
    xl: scale >= 1.5,
    xxl: scale >= 2,
  }
}

export type TierKey = 'grow' | 'big' | 'xl' | 'xxl'

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return DEFAULT_SCALE
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/** 用带有真实文本的探针测缩放系数：测量实际字形行盒高度与计算字号 */
function probeScale(): number {
  let probe: HTMLDivElement | null = null
  try {
    probe = document.createElement('div')
    probe.setAttribute('aria-hidden', 'true')
    // 放入真实中文与拉丁字符，测试实际字形行盒与字号放大
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;font-size:100px;line-height:1;visibility:hidden;white-space:nowrap;contain:paint;'
    probe.textContent = 'M国'
    document.body.appendChild(probe)
    const height = probe.getBoundingClientRect().height
    const compSize = parseFloat(window.getComputedStyle(probe).fontSize)
    const detectedHeight = height > 10 ? height / 100 : DEFAULT_SCALE
    const detectedComp = Number.isFinite(compSize) && compSize > 10 ? compSize / 100 : DEFAULT_SCALE
    return Math.max(detectedHeight, detectedComp)
  } catch {
    return DEFAULT_SCALE
  } finally {
    probe?.remove()
  }
}

/** 兜底：根字号与基线字号的比值（部分 Android WebView 会直接反映在 computed style 上） */
function computedFallback(): number {
  try {
    const size = parseFloat(getComputedStyle(document.documentElement).fontSize)
    return Number.isFinite(size) && size > 1 ? size / 14 : DEFAULT_SCALE
  } catch {
    return DEFAULT_SCALE
  }
}

export function getFontScale(): number {
  return cached
}

/** 重新探测并应用，返回值是当前实际缩放系数 */
export function applyFontScale(): number {
  const scale = clampScale(Math.max(probeScale(), computedFallback()))
  cached = scale
  const root = document.documentElement
  root.style.setProperty('--fs-scale', String(scale))
  root.style.setProperty('--fs-inv', String(1 / scale))
  root.setAttribute('data-fs', '')
  const tiers = fontScaleTiers(scale)
  ;(Object.keys(tiers) as TierKey[]).forEach((key) => {
    if (tiers[key]) root.setAttribute(`data-fs-${key}`, '')
    else root.removeAttribute(`data-fs-${key}`)
  })
  return scale
}

/** 监听系统字体设置变化（切回前台 / 切换页面 / 窗口尺寸变化时复测） */
export function watchFontScale(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const rerun = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      applyFontScale()
    }, 300)
  }
  document.addEventListener('visibilitychange', rerun)
  document.addEventListener('pageshow', rerun)
  window.addEventListener('resize', rerun)
  return () => {
    if (timer) clearTimeout(timer)
    document.removeEventListener('visibilitychange', rerun)
    document.removeEventListener('pageshow', rerun)
    window.removeEventListener('resize', rerun)
  }
}
