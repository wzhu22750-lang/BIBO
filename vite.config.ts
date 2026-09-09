import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

/**
 * 解析构建版本号，用于线上排查「两台设备跑的到底是不是同一版代码」。
 * 优先取 Vercel 注入的 commit；本地/其他 CI 回退到 git。
 */
function resolveCommit() {
  const env = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env
  const fromVercel = env?.VERCEL_GIT_COMMIT_SHA
  if (fromVercel) return fromVercel.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __BIBU_BUILD__: JSON.stringify({
      commit: resolveCommit(),
      builtAt: new Date().toISOString(),
      mode,
    }),
  },
}))
