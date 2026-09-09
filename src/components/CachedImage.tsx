import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
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
  // refreshSource 每次渲染都是新函数（闭包捕获 photo.path），如果放进依赖数组，
  // 父组件任何重渲染都会重置 resolved、重新读 IndexedDB，导致照片闪烁重载。
  // 用 ref 保存最新引用，仅当 cacheKey/src 真正变化时才重新加载。
  const refreshSourceRef = useRef(refreshSource)
  refreshSourceRef.current = refreshSource

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
    void getCachedImage(src, key, refreshSourceRef.current)
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
  }, [cacheKey, src])

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
