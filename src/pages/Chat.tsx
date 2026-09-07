import { useEffect, useRef, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { Button, Empty, PageHeading, useTask } from '../components/ui'
import { Icon, PixelPal } from '../components/PixelArt'
import { clock, dateLabel } from '../lib/dates'
export function Chat({ controller, demo }: { controller: SpaceController; demo: boolean }) {
  const space = controller.space!,
    [text, setText] = useState(''),
    [emoji, setEmoji] = useState(false),
    { busy, run } = useTask(),
    end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [space.messages.length])
  function submit() {
    if (!text.trim() || busy) return
    void run(async () => {
      await controller.message(text)
      setText('')
      input.current?.focus()
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="OUR PRIVATE FREQUENCY"
        title="悄悄话"
        subtitle="一些碎碎念，只想讲给你听。"
      />
      <section className="chat-window">
        <div className="chat-window-top">
          <span className="tiny-avatar pink">
            <PixelPal type={space.partner?.avatar || 'bunny'} />
          </span>
          <div>
            <h2>{space.partner?.name || '另一位玩家'}</h2>
            <span>
              {demo
                ? '本地演示 · 消息不会发送给真实用户'
                : space.partner
                  ? '只有彼此的私人频道'
                  : 'TA 加入后就能看到你留下的话'}
            </span>
          </div>
          <Icon name="lock" size={21} />
        </div>
        <div className="chat-messages" role="log" aria-label="聊天记录" aria-live="polite">
          <div className="chat-start-label">
            <Icon name="heart" size={13} />
            {demo ? '演示消息，来试着发一句吧' : '最近 200 条消息 · 仅你们两人可读'}
          </div>
          {!space.messages.length && (
            <Empty icon="💬" title="故事，从一句你好开始" description="在这里说点什么吧。" />
          )}
          {space.messages.map((message, i) => {
            const own = message.sender_id === space.me.id
            const date = dateLabel(message.created_at)
            return (
              <div key={message.id}>
                {(i === 0 || date !== dateLabel(space.messages[i - 1].created_at)) && (
                  <div className="chat-date">{date}</div>
                )}
                <div className={`message-row ${own ? 'own' : ''}`}>
                  <span className={`tiny-avatar ${own ? '' : 'pink'}`}>
                    <PixelPal type={own ? space.me.avatar : space.partner?.avatar || 'bunny'} />
                  </span>
                  <div className="message-content">
                    <span className="message-author">
                      {own ? space.me.name : space.partner?.name}{' '}
                      <time>{clock(message.created_at)}</time>
                    </span>
                    <p className="message-bubble">{message.content}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={end} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          {emoji && (
            <div className="chat-emojis">
              {[
                '💛',
                '💗',
                '🥰',
                '✨',
                '🌈',
                '🐱',
                '🐰',
                '🌼',
                '🍜',
                '💪',
                '晚安 🌙',
                '想你啦！',
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setText((t) => (t + item).slice(0, 2000))
                    input.current?.focus()
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          <div className="composer-main">
            <button
              type="button"
              className="emoji-toggle"
              aria-label="选择 Emoji"
              aria-expanded={emoji}
              onClick={() => setEmoji(!emoji)}
            >
              ☺
            </button>
            <textarea
              ref={input}
              aria-label="聊天消息"
              placeholder="输入一条只属于你们的悄悄话…"
              rows={1}
              maxLength={2000}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  submit()
                }
              }}
            />
            <Button
              tone="green"
              type="submit"
              disabled={!text.trim() || busy}
              aria-label="发送消息"
            >
              <span>{busy ? '发送中' : '发送'}</span>
              <Icon name="send" size={17} />
            </Button>
          </div>
          <div className="composer-note">
            <span>Enter 发送 · Shift + Enter 换行</span>
            <span>{text.length}/2000</span>
          </div>
        </form>
      </section>
    </>
  )
}
