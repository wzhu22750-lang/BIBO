let audio: AudioContext | undefined
let enabled = false
const FEEDBACK_KEY = 'bibu-feedback-v1'

export function loadFeedbackEnabled(): boolean {
  try {
    return localStorage.getItem(FEEDBACK_KEY) === '1'
  } catch {
    return false
  }
}

export function storeFeedbackEnabled(on: boolean) {
  try {
    if (on) localStorage.setItem(FEEDBACK_KEY, '1')
    else localStorage.removeItem(FEEDBACK_KEY)
  } catch {
    // 存储不可用时忽略，仅本次会话生效
  }
}

export async function enableFeedback() {
  audio ??= new AudioContext()
  await audio.resume()
  enabled = true
  playFeedback()
}
export function disableFeedback() {
  enabled = false
  if (restoreHandler) {
    window.removeEventListener('pointerdown', restoreHandler)
    window.removeEventListener('touchstart', restoreHandler)
    window.removeEventListener('keydown', restoreHandler)
    restoreHandler = undefined
  }
}
// 退出/刷新后自动恢复：震动立即可用，声音在用户第一次点击页面时自动恢复
// （浏览器只允许在用户手势里出声，所以把 resume 挂到首次交互上，无需手动重新授权）
let restoreHandler: (() => void) | undefined
export function restoreFeedback() {
  enabled = true
  if (restoreHandler) return
  const handler = () => {
    if (!enabled) return
    try {
      audio ??= new AudioContext()
    } catch {
      return
    }
    if (audio.state === 'suspended') void audio.resume()
    if (audio.state === 'running') {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('keydown', handler)
      restoreHandler = undefined
    }
  }
  restoreHandler = handler
  window.addEventListener('pointerdown', handler)
  window.addEventListener('touchstart', handler)
  window.addEventListener('keydown', handler)
}
export function playFeedback() {
  if (!enabled) return
  if (audio?.state === 'running') {
    const start = audio.currentTime
    ;[523.25, 783.99, 1046.5, 783.99].forEach((frequency, index) => {
      const oscillator = audio!.createOscillator(),
        gain = audio!.createGain()
      oscillator.type = 'square'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.045, start + index * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, start + index * 0.12 + 0.1)
      oscillator.connect(gain)
      gain.connect(audio!.destination)
      oscillator.start(start + index * 0.12)
      oscillator.stop(start + index * 0.12 + 0.11)
      oscillator.onended = () => {
        oscillator.disconnect()
        gain.disconnect()
      }
    })
  }
  navigator.vibrate?.([100, 60, 100, 60, 180])
}
