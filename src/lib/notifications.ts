let audio: AudioContext | undefined
let enabled = false
export async function enableFeedback() {
  audio ??= new AudioContext()
  await audio.resume()
  enabled = true
  playFeedback()
}
export function disableFeedback() {
  enabled = false
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
