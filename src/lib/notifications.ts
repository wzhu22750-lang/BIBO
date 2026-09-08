import { BiboNative } from '../native'
import { pingFeedback } from './ping'
let audio: AudioContext | undefined
let enabled = false
export async function enableFeedback() {
  if (typeof AudioContext === 'undefined') throw new Error('此设备不支持声音反馈')
  audio ??= new AudioContext()
  await audio.resume()
  enabled = true
  playFeedback()
}
export function disableFeedback() {
  enabled = false
}
export function playFeedback(kind = '哔卟哔卟') {
  if (!enabled) return
  try {
    if (audio?.state === 'running') {
      const start = audio.currentTime
      pingFeedback(kind).notes.forEach((frequency, index) => {
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
  } catch {
    // Audio can become unavailable while the app is suspended; delivery still succeeded.
  }
  void BiboNative.vibration.pulse(pingFeedback(kind).vibration).catch(() => {})
}
