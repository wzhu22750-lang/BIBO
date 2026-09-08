import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p/latin-400.css'
import './styles.css'
import './expectations.css'
import App from './App'
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
