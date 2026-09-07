import { useState } from 'react'
import { Icon, PixelFlower, PixelPal } from '../components/PixelArt'
import { Empty, PageHeading, Panel } from '../components/ui'
import { clock, dateLabel, sortedEvents, togetherDays } from '../lib/dates'
import type { Page, Photo } from '../lib/types'
import type { SpaceController } from '../hooks/useSpace'
import type { BibuAction } from '../hooks/useBibu'
import { EventCard, EventForm } from './Events'
import { PhotoCard, PhotoViewer } from './Photos'
export function Home({
  controller,
  navigate,
  demo,
  bibu,
}: {
  controller: SpaceController
  navigate: (page: Page) => void
  demo: boolean
  bibu: BibuAction
}) {
  const space = controller.space!
  const [adding, setAdding] = useState(false),
    [photo, setPhoto] = useState<Photo | null>(null)
  const events = sortedEvents(space.events).slice(0, 3)
  const days = togetherDays(space.couple!.together_since)
  const last = space.messages.at(-1)
  const focus = space.focus.find(
    (f) => f.user_id === space.me.id && new Date(f.ends_at).getTime() > Date.now(),
  )
  return (
    <>
      <PageHeading
        eyebrow="WELCOME TO OUR LITTLE UNIVERSE"
        title="今天也喜欢你，多一点"
        subtitle="生活不是每天都浪漫，但每天都有你。"
      >
        <span className="today-label">
          <Icon name="calendar" size={16} />
          {dateLabel(new Date())}
          <span>星期{'日一二三四五六'[new Date().getDay()]}</span>
        </span>
      </PageHeading>
      <div className="hero-grid">
        <section className="together-card">
          <div className="card-window-bar">
            <span className="micro">
              <i /> OUR LOVE STORY.EXE
            </span>
            <div aria-hidden="true">— □ ×</div>
          </div>
          <div className="together-content">
            <div className="together-text">
              <span className="hero-label">我们已经一起走过</span>
              <div
                className={`day-counter ${days > 9999 ? 'extra-long' : days > 999 ? 'long' : ''}`}
              >
                <strong>{days}</strong>
                <span>
                  天<small className="micro">DAYS</small>
                </span>
              </div>
              <span className="since-label">
                从 {dateLabel(space.couple!.together_since + 'T00:00:00')} 开始，未完待续{' '}
                <span>↗</span>
              </span>
            </div>
            <div className="hero-pals">
              <span className="love-bubble">
                <Icon name="heart" size={29} />
              </span>
              <Icon name="spark" size={31} className="hero-spark" />
              <div className="pal-ground">
                <PixelPal type={space.me.avatar} />
                <PixelPal type={space.partner?.avatar || 'bunny'} />
              </div>
              <div className="pal-name">
                <span>{space.me.name}</span>
                <span>×</span>
                <span>{space.partner?.name || '等待加入'}</span>
              </div>
            </div>
            <PixelFlower className="hero-flower" />
          </div>
          <div className="together-footer">
            <span>
              <Icon name="lock" size={12} /> 仅限 {space.me.name} &{' '}
              {space.partner?.name || '另一位玩家'}
            </span>
            <span className="micro">2 PLAYERS · 1 WORLD</span>
          </div>
        </section>
        <section className="bibu-card">
          <div className="bibu-intro">
            <span className="micro">A LITTLE PING, A LOT OF LOVE</span>
            <Icon name="spark" size={23} />
          </div>
          <div className="bibu-inner">
            <div className="bibu-copy">
              <h2>
                想你了？
                <br />
                哔卟一下！
              </h2>
              <p>戳一下，把想念发射给 TA</p>
              <span className="micro">PRESS TO SEND LOVE →</span>
            </div>
            <button
              className={`bibu-button ${bibu.busy ? 'pressed' : ''}`}
              disabled={bibu.disabled}
              onClick={() => void bibu.send()}
              aria-label="发送哔卟哔卟"
            >
              <Icon name="heart" size={36} />
              <strong>{bibu.cooling ? 'SENT!' : 'BIBU!'}</strong>
              <small>{bibu.cooling ? '想念发射中' : '哔 卟 哔 卟'}</small>
            </button>
          </div>
          <div className="bibu-bottom">
            <span>✦ {demo ? '演示模式 · 点击预览提醒效果' : '对方需在线 · 声音需先授权'}</span>
            <span>♥</span>
          </div>
        </section>
      </div>
      <div className="home-section-title">
        <h2>
          <Icon name="calendar" />
          下一站，值得期待<span className="micro">UP NEXT</span>
        </h2>
        <button className="text-button" onClick={() => navigate('events')}>
          所有期待 <Icon name="arrow" size={14} />
        </button>
      </div>
      {events.length ? (
        <div className="home-events">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          <button
            className="add-event-card"
            onClick={() => setAdding(true)}
            aria-label="添加新的期待"
          >
            <Icon name="plus" size={24} />
            <span>
              再添一个
              <br />
              小期待
            </span>
          </button>
        </div>
      ) : (
        <button className="empty-add" onClick={() => setAdding(true)}>
          ＋ 写下我们的第一份期待
        </button>
      )}
      <div className="home-lower">
        <Panel
          title="回忆存档"
          tag="OUR MEMORIES"
          className="memories-panel"
          action={
            <button className="text-button" onClick={() => navigate('photos')}>
              去照片墙 <Icon name="arrow" size={14} />
            </button>
          }
        >
          <div className="home-photos">
            {space.photos.slice(0, 3).map((p, i) => (
              <PhotoCard photo={p} key={p.id} index={i} onClick={() => setPhoto(p)} />
            ))}
            {!space.photos.length && (
              <Empty title="回忆相册还是空的" description="去照片墙收藏第一个瞬间吧。" />
            )}
          </div>
          <div className="memories-footer">
            <span>把我们的日常，存成永远。</span>
            <span className="micro">LIFE LOOKS BETTER WITH YOU ♡</span>
          </div>
        </Panel>
        <div className="home-side">
          <Panel
            title="悄悄话"
            tag="JUST US"
            action={<Icon name="chat" size={19} />}
            className="chat-preview"
          >
            <div className="chat-preview-content">
              <span className="tiny-avatar pink">
                <PixelPal
                  type={
                    last?.sender_id === space.me.id
                      ? space.me.avatar
                      : space.partner?.avatar || 'bunny'
                  }
                />
              </span>
              <div>
                <div className="message-meta">
                  <b>
                    {last
                      ? last.sender_id === space.me.id
                        ? space.me.name
                        : space.partner?.name
                      : '还没有悄悄话'}
                  </b>
                  <time>{last && clock(last.created_at)}</time>
                </div>
                <p>{last?.content || '今天，想对 TA 说些什么？'}</p>
              </div>
            </div>
            <button className="chat-reply" onClick={() => navigate('chat')}>
              回一句甜甜的话…
              <Icon name="send" size={17} />
            </button>
          </Panel>
          <button className="focus-preview" onClick={() => navigate('focus')}>
            <div className="focus-preview-icon">
              <Icon name="focus" size={29} />
            </div>
            <div>
              <h3>{focus ? `正在${focus.activity}` : '各自努力，一起变好'}</h3>
              <p>{focus ? '专注进行中 · 点此查看计时' : '开启专注陪伴，做彼此的加油站'}</p>
            </div>
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
      <div className="home-signoff">
        <span className="micro">✳ THIS MUST BE THE PLACE ✳</span>
        <span>宇宙很大，但我的小窝刚好装下你。</span>
      </div>
      {adding && <EventForm controller={controller} onClose={() => setAdding(false)} />}{' '}
      {photo && <PhotoViewer photo={photo} onClose={() => setPhoto(null)} />}
    </>
  )
}
