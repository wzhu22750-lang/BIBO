import { pingFeedback } from '../lib/ping'
import { useEffect } from 'react'
import { EventArt } from './EventArt'
import { Icon } from './PixelArt'
import { Button, Modal } from './ui'
export function PingEffect({
  ping,
  onClose,
}: {
  ping: { id: string; name: string; kind: string }
  onClose: () => void
}) {
  const feedback = pingFeedback(ping.kind)
  useEffect(() => {
    const timer = setTimeout(onClose, 6500)
    return () => clearTimeout(timer)
  }, [onClose, ping.id])
  return (
    <Modal title="INCOMING LOVE!" onClose={onClose} className="ping-modal">
      <div className="ping-scene">
        <div className="emoji-rain" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 31) % 100}%`,
                animationDelay: `${(i % 8) * -0.3}s`,
                animationDuration: `${1.8 + (i % 3) * 0.4}s`,
              }}
            >
              <EventArt value={i % 3 === 0 ? 'heart' : feedback.art} size={32} />
            </span>
          ))}
        </div>
        <EventArt value={feedback.art} size={90} />
        <span className="micro">SPECIAL DELIVERY</span>
        <h2>
          {ping.name}
          <br />
          发来{ping.kind}！
        </h2>
        <p>{feedback.message}</p>
        <Button tone="yellow" onClick={onClose}>
          接住这份想念 <Icon name="check" size={16} />
        </Button>
      </div>
    </Modal>
  )
}
