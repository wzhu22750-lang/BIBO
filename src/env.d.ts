/// <reference types="vite/client" />

declare const __BIBU_BUILD__: {
  /** 构建时的 git commit 短哈希，用于线上版本排查 */
  commit: string
  /** 构建时间（ISO 字符串） */
  builtAt: string
  /** vite mode：production / development */
  mode: string
}
