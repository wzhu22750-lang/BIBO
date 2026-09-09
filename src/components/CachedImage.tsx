import { useEffect, useState, type ImgHTMLAttributes } from 'react'
import { getCachedImage, subscribeCachedImage } from '../lib/imageCache'

type CachedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  cacheKey?: string
  refreshSource?: () => Promise<string | undefined>
}

/**
 * Image primitive shared by every private photo surface. It shows a small
 * pixel loading/error state while the IndexedDB/WebView cache is consulted,
 * and falls back to the signed URL if local persistence is unavailable.
 */
export function CachedImage({
  src,
  cacheKey,
  refreshSource,
  alt = '',
  className = '',
  ...props
}: CachedImageProps) {
  const [resolved, setResolved] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setResolved(null)
    setFailed(false)
    if (!src && !cacheKey) return () => {}
    const key = cacheKey || src || ''
    const unsubscribe = key
      ? subscribeCachedImage(key, (url) => {
          if (!active) return
          if (url) {
            setFailed(false)
            setResolved(url)
          } else {
            setResolved(null)
            setFailed(true)
          }
        })
      : () => {}
    void getCachedImage(src, key, refreshSource)
      .then((value) => {
        if (active && value) setResolved(value)
        else if (active) setFailed(true)
      })
      .catch(() => {
        if (!active) return
        if (src) setResolved(src)
        else setFailed(true)
      })
    return () => {
      active = false
      unsubscribe()
    }
  }, [cacheKey, refreshSource, src])

  if (failed || (!resolved && !src && !cacheKey))
    return (
      <span className={`cached-image-state cached-image-error ${className}`}>
        照片暂不可用，请刷新重试
      </span>
    )
  if (!resolved)
    return (
      <span className={`cached-image-state cached-image-loading ${className}`} role="status">
        正在读取照片…
      </span>
    )
  return (
    <img
      {...props}
      className={className}
      src={resolved}
      alt={alt}
      loading={props.loading || 'lazy'}
      decoding={props.decoding || 'async'}
      onError={(event) => {
        setFailed(true)
        props.onError?.(event)
      }}
    />
  )
}
