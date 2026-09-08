import { EventOutboxPanel } from '../components/EventOutboxPanel'
import { LinkedRecordPanel } from '../components/LinkedRecordPanel'
import { RelationshipTimeline } from '../components/RelationshipTimeline'
import { eventCategories } from '../lib/memories'
import type { EventCategory } from '../lib/types'
import { useState } from 'react'
import type { EventItem } from '../lib/types'
import type { SpaceController } from '../hooks/useSpace'
import {
  daysUntil,
  dateLabel,
  localDateTimeInput,
  nextOccurrence,
  sortedEvents,
  togetherDays,
} from '../lib/dates'
import { Button, Modal, PageHeading, useTask, useToast } from '../components/ui'
import { Icon } from '../components/PixelArt'
import { EventArt, MapIcon } from '../components/EventArt'
import { EventArtPicker } from '../components/EventArtPicker'
import { eventArtConfig } from '../lib/eventArt'
export function EventCard({
  event,
  onDelete,
  onEdit,
}: {
  event: EventItem
  onDelete?: () => void
  onEdit?: () => void
}) {
  const remaining = daysUntil(event.target_at, event.yearly)
  return (
    <article className={`event-card ${event.kind === 'anniversary' ? 'anniversary' : ''}`}>
      <div className="event-top">
        <span className="event-emoji" aria-hidden="true">
          <EventArt value={event.emoji} size={24} />
        </span>
        <span className="event-type">
          {event.yearly ? '每年纪念' : event.kind === 'anniversary' ? '纪念日' : '共同倒计时'}
        </span>
        {onEdit && (
          <button
            className="icon-button edit-event"
            aria-label={`编辑${event.title}`}
            onClick={onEdit}
          >
            <Icon name="edit" size={12} />
          </button>
        )}
        {onDelete && (
          <button
            className="icon-button delete-event"
            aria-label={`删除${event.title}`}
            onClick={onDelete}
          >
            <Icon name="close" size={12} />
          </button>
        )}
      </div>
      <h3>{event.title}</h3>
      <div className="event-bottom">
        <span className="event-date">
          {dateLabel(nextOccurrence(event.target_at, event.yearly))}
        </span>
        <div className="event-days">
          {remaining === 0 ? (
            <strong className="today">就是今天！</strong>
          ) : (
            <>
              <small>{remaining < 0 ? '已过' : '还有'}</small>
              <strong>{Math.abs(remaining)}</strong>
              <small>天</small>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
export function EventForm({
  onClose,
  controller,
  event,
}: {
  onClose: () => void
  controller: SpaceController
  event?: EventItem
}) {
  const { busy, run } = useTask(),
    toast = useToast()
  const [title, setTitle] = useState(event?.title || ''),
    [category, setCategory] = useState<EventCategory>(event?.category || 'other'),
    [kind, setKind] = useState<'anniversary' | 'countdown'>(event?.kind || 'countdown'),
    [target, setTarget] = useState(event ? localDateTimeInput(event.target_at) : ''),
    [yearly, setYearly] = useState(event?.yearly || false),
    [emoji, setEmoji] = useState(event?.emoji || 'icon:heart')
  return (
    <Modal title={event ? '编辑这份期待' : '添加一份小期待'} onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            const input = {
              title: title.trim(),
              target_at: new Date(target).toISOString(),
              kind,
              yearly: kind === 'anniversary' && yearly,
              emoji,
              category,
            }
            const result = event
              ? await controller.updateEvent(event.id, input)
              : await controller.addEvent(input)
            toast(
              result.queued
                ? event
                  ? '修改意图已保存在本机，联网后同步'
                  : '期待已保存在本机，联网后同步到你们的空间'
                : event
                  ? '事件修改已保存'
                  : '新的期待，已加入我们的小宇宙',
            )
            onClose()
          })
        }}
      >
        <div className="segmented">
          <button
            type="button"
            className={kind === 'countdown' ? 'selected' : ''}
            onClick={() => setKind('countdown')}
          >
            共同倒计时
          </button>
          <button
            type="button"
            className={kind === 'anniversary' ? 'selected' : ''}
            onClick={() => setKind('anniversary')}
          >
            重要纪念日
          </button>
        </div>
        <label>
          给这一天起个名字
          <input
            autoFocus
            required
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="比如：一起去上海"
          />
        </label>
        <label>
          目标日期与时间
          <input
            type="datetime-local"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
        <label>
          事件类型
          <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
            {eventCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <EventArtPicker value={emoji} onChange={setEmoji} />
        {kind === 'anniversary' && (
          <label className="check-label">
            <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
            每年都要一起纪念
          </label>
        )}
        <p className="form-note">按本机时区保存具体时间；首页按自然日显示，临近的期待排在前面。</p>
        <Button disabled={busy || !title.trim()} type="submit" tone="green">
          {busy ? '保存中…' : event ? '保存事件修改' : '把期待存起来'}
          <Icon name={event ? 'check' : 'plus'} size={16} />
        </Button>
      </form>
    </Modal>
  )
}
function CelebrationCard({
  event,
  onDelete,
  onEdit,
}: {
  event: EventItem
  onDelete: () => void
  onEdit: () => void
}) {
  const art = eventArtConfig(event.emoji)
  const days = daysUntil(event.target_at, event.yearly)
  return (
    <article className={`celebration-card art-${art.tone} ${days < 0 ? 'past-event' : ''}`}>
      <div className="celebration-art">
        <EventArt value={event.emoji} size={64} />
        <span className="art-spark art-spark-one">
          <Icon name="spark" size={13} />
        </span>
        <span className="art-spark art-spark-two">
          <Icon name="star" size={9} />
        </span>
      </div>
      <div className="celebration-info">
        <div className="celebration-tags">
          <span className="category-chip">
            {eventCategories.find((c) => c.value === event.category)?.label || art.category}
          </span>
          <span className="repeat-chip">
            {event.yearly ? '每年纪念' : event.kind === 'anniversary' ? '纪念日' : '共同倒计时'}
          </span>
        </div>
        <h3>{event.title}</h3>
        <span className="celebration-date">
          <Icon name="calendar" size={13} />
          {dateLabel(nextOccurrence(event.target_at, event.yearly))}
        </span>
      </div>
      <div className={`celebration-count ${days === 0 ? 'is-today' : ''}`}>
        <span>{days === 0 ? '就是今天' : days < 0 ? '已经过去' : '距离这一天还有'}</span>
        <strong className={Math.abs(days) > 999 ? 'long-count' : ''}>
          {days === 0 ? 'TODAY' : Math.abs(days)}
        </strong>
        <span className="micro">{days === 0 ? 'MAKE A MEMORY!' : 'DAYS'}</span>
      </div>
      <button
        className="icon-button celebration-edit"
        aria-label={`编辑${event.title}`}
        onClick={onEdit}
      >
        <Icon name="edit" size={12} />
      </button>
      <button
        className="icon-button celebration-delete"
        aria-label={`删除${event.title}`}
        onClick={onDelete}
      >
        <Icon name="close" size={12} />
      </button>
      <div className="celebration-bottom">
        <span>
          {days < 0
            ? '一起走过，也值得收藏。'
            : days === 0
              ? '今天就去创造属于我们的回忆吧。'
              : '平凡的日子，因为有你而闪闪发光。'}
        </span>
        <Icon name="heart" size={12} />
      </div>
    </article>
  )
}

export function Events({
  controller,
  referenceId,
}: {
  controller: SpaceController
  referenceId?: string
}) {
  const [adding, setAdding] = useState(false),
    [deleting, setDeleting] = useState<EventItem | null>(null),
    [editing, setEditing] = useState<EventItem | null>(null),
    [filter, setFilter] = useState('all'),
    [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all')
  const { busy, run } = useTask(),
    toast = useToast()
  const space = controller.space!
  const ordered = sortedEvents(space.events)
  const events = ordered.filter(
    (e) =>
      (filter === 'all' || e.kind === filter) &&
      (categoryFilter === 'all' || (e.category || 'other') === categoryFilter),
  )
  const days = togetherDays(space.couple!.together_since)
  const milestones = [
    { target: 100, name: '100 天心动', art: 'heart' },
    { target: 365, name: '一周年纪念', art: 'bunny' },
    { target: 520, name: '520 我爱你', art: 'dog' },
    { target: 1000, name: '千日长相守', art: 'trophy' },
  ]
  const next = milestones.find((m) => days < m.target)
  return (
    <div className="expectations-page">
      {referenceId && (
        <LinkedRecordPanel
          key={`${space.couple!.id}:${referenceId}`}
          controller={controller}
          kind="event"
          id={referenceId}
        />
      )}
      <PageHeading
        eyebrow="GOOD THINGS TAKE TWO"
        title="值得期待"
        subtitle="把已经一起走过的、今天发生的、未来期待的，都留在这里。"
      />
      <div className="expectations-banner">
        <div className="banner-caption">
          <span className="banner-clock">
            <Icon name="calendar" size={28} />
          </span>
          <div>
            <span className="micro">ANNIVERSARY & COUNTDOWN</span>
            <p>我们共同等待的，每一个重要日子</p>
          </div>
        </div>
        <Button tone="pink" onClick={() => setAdding(true)}>
          <Icon name="plus" size={16} />
          添加期待
        </Button>
      </div>
      <section className="love-milestones" aria-label="恋爱里程碑">
        <div className="milestones-heading">
          <h2>
            <EventArt value="trophy" size={22} />
            恋爱成就收集册
          </h2>
          <span>
            已经一起 <b>{days}</b> 天
          </span>
        </div>
        <div className="milestone-grid">
          {milestones.map((m, i) => {
            const reached = days >= m.target
            return (
              <div
                key={m.target}
                className={`milestone-badge badge-${i} ${reached ? 'reached' : 'waiting'}`}
              >
                <span className="badge-status">
                  <Icon name={reached ? 'check' : 'lock'} size={11} />
                  {reached ? '已解锁' : '待解锁'}
                </span>
                <EventArt value={m.art} size={43} />
                <strong>
                  {m.target}
                  <small>天</small>
                </strong>
                <span className="badge-name">{m.name}</span>
                <span className="badge-progress">
                  {reached ? '又多了一份关于我们的回忆' : `还差 ${m.target - days} 天，一起慢慢来`}
                </span>
              </div>
            )
          })}
        </div>
        <div className="milestones-footer">
          <Icon name="spark" size={14} />
          {next
            ? `下一枚徽章：${next.name}，还有 ${next.target - days} 天。`
            : '四枚徽章全部点亮，我们的故事还在继续。'}
          <span className="micro">LOVE IS A CO-OP GAME.</span>
        </div>
      </section>
      <RelationshipTimeline controller={controller} />
      <EventOutboxPanel controller={controller} />
      <div className="expectations-list-heading">
        <div className="page-tabs" aria-label="期待分类">
          {[
            ['all', '全部期待'],
            ['countdown', '共同倒计时'],
            ['anniversary', '纪念日'],
          ].map(([value, name]) => (
            <button
              key={value}
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {name}
              <span>
                {value === 'all' ? ordered.length : ordered.filter((e) => e.kind === value).length}
              </span>
            </button>
          ))}
        </div>
        <label className="event-category-filter">
          按类型
          <select
            aria-label="按事件类型筛选"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as EventCategory | 'all')}
          >
            <option value="all">全部类型</option>
            {eventCategories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <span className="list-sort">
          <MapIcon size={16} />
          从近到远，慢慢靠近
        </span>
      </div>
      <div className="expectations-layout">
        <div className="celebration-list">
          {events.length ? (
            events.map((event) => (
              <CelebrationCard
                key={event.id}
                event={event}
                onEdit={() => setEditing(event)}
                onDelete={() => setDeleting(event)}
              />
            ))
          ) : (
            <div className="event-empty">
              <EventArt value="bunny" size={85} />
              <h3>下一份期待，由我们一起写</h3>
              <p>旅行、生日，或者下一次见面。</p>
            </div>
          )}
          <button className="new-expectation" onClick={() => setAdding(true)}>
            <span>
              <Icon name="plus" size={20} />
            </span>
            <div>
              <strong>再添一份小期待</strong>
              <small>想和你一起做的事，永远写不完。</small>
            </div>
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <aside className="expectations-aside">
          <div className="postcard-title">
            <span className="micro">A POSTCARD FROM THE FUTURE</span>
            <Icon name="heart" size={15} />
          </div>
          <div className="postcard-art">
            <span className="postcard-sun">
              <Icon name="star" size={32} />
            </span>
            <span className="postcard-message">下一站，见到你。</span>
            <div className="postcard-pals">
              <EventArt value="bunny" size={100} />
              <EventArt value="dog" size={100} />
            </div>
            <div className="postcard-ground" />
          </div>
          <div className="postcard-note">
            <h3>
              不用赶路，
              <br />
              我们一起慢慢来。
            </h3>
            <p>
              一场旅行、一块蛋糕、一个拥抱。
              <br />
              和你有关的小事，都值得倒数。
            </p>
            <div>
              <EventArt value="coffee" size={23} />
              <EventArt value="gift" size={23} />
              <EventArt value="plane" size={25} />
              <span className="micro">WITH YOU, ALWAYS.</span>
            </div>
          </div>
        </aside>
      </div>
      <div className="pixel-note">
        <Icon name="heart" size={22} />
        <p>
          未到的日子从近到远排列，过去的日子仍留在这里。
          <br />
          <span>每一份平凡的等待，都有一个关于我们的答案。</span>
        </p>
      </div>
      {adding && <EventForm controller={controller} onClose={() => setAdding(false)} />}
      {editing && (
        <EventForm event={editing} controller={controller} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <Modal title="告别这份期待？" onClose={() => setDeleting(null)}>
          <div className="form-stack">
            <p>「{deleting.title}」会从两个人的空间中移除，此操作不能撤销。</p>
            <Button
              tone="pink"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const result = await controller.deleteEvent(deleting.id)
                  setDeleting(null)
                  toast(result.queued ? '删除意图已保存在本机，联网后同步' : '已移除这份期待')
                })
              }
            >
              确认删除
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
