import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p/latin-400.css'
import './styles.css'
import './expectations.css'
import App from './App'

// 线上排查用：让用户报错时可以直接报出构建版本与运行环境
console.info(
  `[BIBU] build ${__BIBU_BUILD__.commit} · ${__BIBU_BUILD__.builtAt} · ${__BIBU_BUILD__.mode}`,
)
console.info('[BIBU] ua', navigator.userAgent)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import './home.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.warn('离线页面缓存初始化失败', error)
    })
  })
}
