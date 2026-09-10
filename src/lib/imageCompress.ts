/**
 * 上传前本地压缩：限长边 + 有损重编码，显著降低占用。
 * 完全在客户端完成，静默执行，用户无感知。
 */
type CompressOptions = {
  /** 长边上限（px），超出则等比缩小 */
  maxEdge?: number
  /** 有损质量 0–1 */
  quality?: number
}

export type CompressResult = {
  /** 可直接上传的文件（压缩失败时为原文件） */
  file: File
  originalSize: number
  size: number
  width: number
  height: number
  /** 是否真正压缩（false = 保留原文件） */
  compressed: boolean
}

const DEFAULT_MAX_EDGE = 1280
const DEFAULT_QUALITY = 0.72
/** 已经很小且尺寸达标时不做无意义重编码 */
const SKIP_UNDER_BYTES = 200 * 1024

/** 等比缩放到长边不超过 maxEdge；放大一律不做。 */
export function fitWithin(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height)
  if (!Number.isFinite(longest) || longest <= 0 || maxEdge <= 0) {
    return { width, height, scale: 1 }
  }
  const scale = Math.min(1, maxEdge / longest)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        // 浏览器不支持该编码类型时会回退成 PNG，这里按类型校验后放弃。
        (blob) => resolve(blob && blob.type === type ? blob : null),
        type,
        quality,
      )
    } catch {
      resolve(null)
    }
  })
}

async function decode(file: File): Promise<ImageBitmap | null> {
  if (typeof createImageBitmap !== 'function') return null
  try {
    // from-image：按 EXIF 方向解码，避免竖拍照片被旋转。
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    try {
      return await createImageBitmap(file)
    } catch {
      return null
    }
  }
}

export async function compressPhoto(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const originalSize = file.size
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE
  const quality = options.quality ?? DEFAULT_QUALITY
  const fallback: CompressResult = {
    file,
    originalSize,
    size: originalSize,
    width: 0,
    height: 0,
    compressed: false,
  }
  if (typeof document === 'undefined') return fallback

  const bitmap = await decode(file)
  if (!bitmap) return fallback

  const { width, height } = bitmap
  const fitted = fitWithin(width, height, maxEdge)
  if (fitted.scale === 1 && originalSize <= SKIP_UNDER_BYTES) {
    bitmap.close()
    return { ...fallback, width, height }
  }

  const canvas = document.createElement('canvas')
  canvas.width = fitted.width
  canvas.height = fitted.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { ...fallback, width, height }
  }
  ctx.drawImage(bitmap, 0, 0, fitted.width, fitted.height)
  bitmap.close()

  // 优先 WebP；不支持时按原图格式回退（PNG 保留透明通道）。
  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  if (!blob) {
    blob = await canvasToBlob(
      canvas,
      file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      quality,
    )
  }
  if (!blob || blob.size >= originalSize) {
    return { ...fallback, width, height }
  }

  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
  const compressedFile = new File([blob], `${base}.${ext}`, {
    type: blob.type,
    lastModified: Date.now(),
  })
  return {
    file: compressedFile,
    originalSize,
    size: compressedFile.size,
    width: fitted.width,
    height: fitted.height,
    compressed: true,
  }
}
