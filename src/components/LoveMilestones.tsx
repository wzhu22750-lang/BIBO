import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import { useNow } from '../hooks/useNow'
import { togetherDays } from '../lib/dates'
import { buildMilestones, getNextWaitingMilestone, type MilestoneCategory } from '../lib/milestones'
import { EventArt } from './EventArt'
import { Icon } from './PixelArt'

export function LoveMilestones({ controller }: { controller: SpaceController }) {
  const now = useNow()
  const space = controller.space
  if (!space) return null

  const days = space.couple?.together_since ? togetherDays(space.couple.together_since, now) : 0
  const milestones = buildMilestones(space, now)
  const unlockedCount = milestones.filter((m) => m.reached).length
  const nextWaiting = getNextWaitingMilestone(milestones)

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('bibo-milestones-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [activeCategory, setActiveCategory] = useState<MilestoneCategory>('all')

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('bibo-milestones-collapsed', String(next))
      } catch {}
      return next
    })
  }

  const categoryCounts = {
    days: milestones.filter((m) => m.category === 'days').length,
    photos: milestones.filter((m) => m.category === 'photos').length,
    events: milestones.filter((m) => m.category === 'events').length,
    interaction: milestones.filter((m) => m.category === 'interaction').length,
  }

  const filteredMilestones =
    activeCategory === 'all' ? milestones : milestones.filter((m) => m.category === activeCategory)

  const percent = Math.round((unlockedCount / milestones.length) * 100)

  return (
    <section className={`love-milestones ${collapsed ? 'collapsed' : ''}`} aria-label="恋爱里程碑">
      <div className="milestones-heading">
        <div className="milestones-heading-main">
          <h2>
            <EventArt value="trophy" size={22} />
            恋爱成就收集册
          </h2>
          <span className="milestones-meta">
            已经一起 <b>{days}</b> 天 · 已解锁 <b>{unlockedCount}</b>/{milestones.length} 枚
          </span>
        </div>
        <button
          type="button"
          className="milestones-toggle-btn"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? '展开恋爱成就册' : '收起恋爱成就册'}
        >
          <span>{collapsed ? '展开成就册' : '收起'}</span>
          <Icon name="arrow" size={10} className={`toggle-arrow ${collapsed ? 'down' : 'up'}`} />
        </button>
      </div>

      {collapsed ? (
        <div
          className="milestones-collapsed-preview"
          onClick={toggleCollapsed}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleCollapsed()
            }
          }}
          aria-label="展开恋爱成就收集册查看全部徽章"
        >
          <div className="milestones-mini-progress">
            <div
              className="milestones-mini-bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="milestones-mini-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="milestones-mini-percent">{percent}%</span>
          </div>
          <div className="milestones-mini-hint">
            <Icon name="spark" size={12} />
            <span>
              {nextWaiting
                ? `下一枚徽章：${nextWaiting.name} · ${nextWaiting.waitingDesc}`
                : '全部徽章已全部点亮，我们的故事还在继续！'}
            </span>
            <span className="click-to-expand">点击展开 »</span>
          </div>
        </div>
      ) : (
        <>
          <div className="milestones-tabs" aria-label="成就类型分类">
            {(
              [
                ['all', `全部 (${milestones.length})`],
                ['days', `相伴时光 (${categoryCounts.days})`],
                ['photos', `独家回忆 (${categoryCounts.photos})`],
                ['events', `心愿约定 (${categoryCounts.events})`],
                ['interaction', `双向奔赴 (${categoryCounts.interaction})`],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                className={activeCategory === cat ? 'active' : ''}
                onClick={() => setActiveCategory(cat as MilestoneCategory)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="milestone-grid">
            {filteredMilestones.map((m, i) => {
              return (
                <div
                  key={m.id}
                  className={`milestone-badge badge-${m.color} badge-${i} ${
                    m.reached ? 'reached' : 'waiting'
                  }`}
                >
                  <span className="badge-status">
                    <Icon name={m.reached ? 'check' : 'lock'} size={11} />
                    {m.reached ? '已解锁' : '待解锁'}
                  </span>
                  <EventArt value={m.art} size={43} />
                  <strong>
                    {m.target}
                    <small>{m.unit}</small>
                  </strong>
                  <span className="badge-name">{m.name}</span>
                  <span className="badge-progress">
                    {m.reached ? m.reachedDesc : m.waitingDesc}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="milestones-footer">
            <div className="milestones-footer-left">
              <Icon name="spark" size={14} />
              <span>
                {nextWaiting
                  ? `下一枚徽章：${nextWaiting.name}，${nextWaiting.waitingDesc}`
                  : `${milestones.length} 枚徽章全部点亮，我们的故事还在继续。`}
              </span>
            </div>
            <div className="milestones-footer-right">
              <button type="button" className="milestones-collapse-link" onClick={toggleCollapsed}>
                收起成就册
              </button>
              <span className="micro">LOVE IS A CO-OP GAME.</span>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
