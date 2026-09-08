import { clearChatDraft, readChatDraft, writeChatDraft } from '../lib/chatDraftStorage'
import { clearSentDraft, type DraftSnapshot } from '../lib/chatDraft'
import { useMessageHistory } from '../hooks/useMessageHistory'
import { LinkedRecordPanel } from '../components/LinkedRecordPanel'
import { PhotoViewer } from './Photos'
import type { Photo } from '../lib/types'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { Button, Empty, useTask } from '../components/ui'
import { Icon, PixelPal } from '../components/PixelArt'
import { clock, dateLabel } from '../lib/dates'
export function Chat({
  controller,
  demo,
  referenceId,
}: {
  controller: SpaceController
  demo: boolean
  referenceId?: string
}) {
  const space = controller.space!,
    [draft, setDraft] = useState<DraftSnapshot>(() => readChatDraft(space.me.id, space.couple!.id)),
    [memory, setMemory] = useState<Photo | null>(null),
    [emoji, setEmoji] = useState(false),
    { busy, run } = useTask(),
    end = useRef<HTMLDivElement>(null)
  const text = draft.text
  const draftRef = useRef(draft)
  draftRef.current = draft
  function editText(update: string | ((text: string) => string)) {
    const previous = draftRef.current
    const next = {
      text: typeof update === 'function' ? update(previous.text) : update,
      revision: previous.revision + 1,
    }
    draftRef.current = next
    setDraft(next)
  }
  const history = useMessageHistory(space.couple!.id, space.messages, demo)
  const messages = history.messages
  const scroll = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const anchor = useRef<{ height: number; top: number } | null>(null)
  const [unread, setUnread] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        writeChatDraft(space.me.id, space.couple!.id, draftRef.current)
      } catch {
        /* Draft persistence is optional; message sending remains authoritative. */
      }
    }, 180)
    return () => clearTimeout(timer)
  }, [draft.revision, space.me.id, space.couple!.id])
  useLayoutEffect(() => {
    const container = scroll.current
    if (container && anchor.current && !history.busy) {
      container.scrollTop = anchor.current.top + container.scrollHeight - anchor.current.height
      anchor.current = null
    }
  }, [messages.length, history.busy])
  useEffect(() => {
    if (referenceId) return
    if (nearBottom.current) end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    else setUnread(true)
  }, [space.messages.at(-1)?.id, referenceId])
  function submit() {
    if (!text.trim() || busy) return
    const sent = { ...draftRef.current }
    void run(async () => {
      await controller.message(sent.text)
      const next = clearSentDraft(draftRef.current, sent)
      draftRef.current = next
      setDraft(next)
      if (!next.text) {
        try {
          clearChatDraft(space.me.id, space.couple!.id)
        } catch {
          /* Optional cleanup. */
        }
      }
      input.current?.focus()
    })
  }
  return (
    <>
      {referenceId && (
        <LinkedRecordPanel
          key={`${space.couple!.id}:${referenceId}`}
          controller={controller}
          kind="message"
          id={referenceId}
        />
      )}
      {!demo && (
        <section className="linked-record-panel" aria-label="消息同步队列">
          <p>
            消息先保存到本机，再同步到你们的空间。等待同步不是对方已收到。卸载应用或清除网站数据会删除本机待发送内容。
          </p>
          {controller.outbox.error && <p role="alert">本机队列异常：{controller.outbox.error}</p>}
          {controller.outbox.rows.map((row) => (
            <div key={row.id}>
              <p>{row.content}</p>
              <small>
                {row.status === 'blocked'
                  ? '发送失败，原文已保留'
                  : row.nextAttemptAt
                    ? `等待重试 · 最早 ${new Date(row.nextAttemptAt).toLocaleTimeString()}`
                    : '等待同步'}
                {row.error ? ` · ${row.error}` : ''}
              </small>
              <Button
                tone="white"
                disabled={busy}
                onClick={() => void run(() => controller.outbox.retry(row.id))}
              >
                重试同步
              </Button>
              <Button
                tone="white"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      '移除本机待发送记录？若此前请求已到达服务器，已发送的消息不会撤回。',
                    )
                  )
                    void run(() => controller.outbox.discard(row.id))
                }}
              >
                移除待发送
              </Button>
            </div>
          ))}
        </section>
      )}
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
        <div
          ref={scroll}
          onScroll={() => {
            const el = scroll.current
            if (el) {
              nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
              if (nearBottom.current) setUnread(false)
            }
          }}
          className="chat-messages"
          role="log"
          aria-label="聊天记录"
          aria-live="polite"
        >
          <div className="chat-start-label">
            <Icon name="heart" size={13} />
            {demo ? '演示消息，来试着发一句吧' : `已加载 ${messages.length} 条 · 仅你们两人可读`}
          </div>
          {history.hasMore && (
            <Button
              tone="white"
              disabled={history.busy}
              onClick={() =>
                void (async () => {
                  const el = scroll.current
                  if (el) anchor.current = { height: el.scrollHeight, top: el.scrollTop }
                  await history.loadOlder()
                  // React's next render restores the anchor when rows are prepended.
                })()
              }
            >
              {history.busy ? '正在读取历史…' : '加载更早的悄悄话'}
            </Button>
          )}
          {history.error && <p role="alert">历史读取失败，当前记录保留：{history.error}</p>}
          {!history.hasMore && !demo && messages.length > 0 && (
            <p className="chat-start-label">已加载到最早的消息</p>
          )}
          {!messages.length && (
            <Empty icon="💬" title="故事，从一句你好开始" description="在这里说点什么吧。" />
          )}
          {messages.map((message, i) => {
            const own = message.sender_id === space.me.id
            const date = dateLabel(message.created_at)
            return (
              <div key={message.id}>
                {(i === 0 || date !== dateLabel(messages[i - 1].created_at)) && (
                  <div className="chat-date">{date}</div>
                )}
                <div className={`message-row ${own ? 'own' : ''}`}>
                  <span className={`tiny-avatar ${own ? '' : 'pink'}`}>
                    <PixelPal type={own ? space.me.avatar : space.partner?.avatar || 'bunny'} />
                  </span>
                  <div className="message-content">
                    <span className="message-author">
                      {own
                        ? space.me.name
                        : message.sender_id === null
                          ? '已注销玩家'
                          : space.partner?.name}{' '}
                      <time>{clock(message.created_at)}</time>
                    </span>
                    <p className="message-bubble">{message.content}</p>
                    {space.photos
                      .filter((p) => p.message_id === message.id)
                      .map((photo) => (
                        <button
                          key={photo.id}
                          className="chat-memory-link"
                          onClick={() => setMemory(photo)}
                        >
                          关联回忆：{photo.caption || '打开这个瞬间'}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={end} />
        </div>
        {unread && (
          <Button
            tone="yellow"
            onClick={() => {
              end.current?.scrollIntoView({ block: 'nearest' })
              nearBottom.current = true
              setUnread(false)
            }}
          >
            有新消息 · 回到最新
          </Button>
        )}
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
                    editText((t) => (t + item).slice(0, 2000))
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
              onChange={(e) => editText(e.target.value)}
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
      {memory && (
        <PhotoViewer photo={memory} controller={controller} onClose={() => setMemory(null)} />
      )}
    </>
  )
}
