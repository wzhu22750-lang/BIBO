import { useState } from 'react'
import type { SpaceController } from '../hooks/useSpace'
import type { Photo } from '../lib/types'
import { useNow } from '../hooks/useNow'
import { dayNumber, dateLabel } from '../lib/dates'
import { EventArt } from './EventArt'
import { DEFAULT_PHOTO_ART } from '../lib/memories'
import { PhotoViewer } from '../pages/Photos'
import { timelineEntries, type TimelinePeriod } from '../lib/timeline'
export function RelationshipTimeline({ controller }: { controller: SpaceController }) {
  const now = useNow()
  const [period, setPeriod] = useState<TimelinePeriod>('all')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const entries = timelineEntries(controller.space!, period, now)
  return (
    <section className="relationship-timeline" aria-label="关系时间线">
      <h2>我们一起走过，也一起期待</h2>
      <p>按事件最初日期和回忆发生日期排列；周年的下一次提醒仍在下方期待列表中。</p>
      <div className="page-tabs" aria-label="时间线范围">
        {(
          [
            ['all', '全部'],
            ['past', '过去'],
            ['today', '今天'],
            ['future', '未来'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={period === value}
            className={period === value ? 'active' : ''}
            onClick={() => setPeriod(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {entries.length ? (
        <ol>
          {entries.map((entry) => (
            <li key={entry.id}>
              <time>
                {dateLabel(entry.at)}
                {entry.uploadDate ? ' · 上传日期（发生日期未记）' : ''}
              </time>
              {entry.photo ? (
                <button className="timeline-memory" onClick={() => setPhoto(entry.photo!)}>
                  <EventArt value={entry.photo!.emoji || DEFAULT_PHOTO_ART} size={24} />
                  <span>{entry.title || '一个共同瞬间'} · 打开回忆</span>
                </button>
              ) : (
                <div>
                  <EventArt value={entry.art!} size={24} />
                  <strong>{entry.title}</strong>
                  <span>
                    {dayNumber(entry.at) > dayNumber(now) ? ' · 值得期待' : ' · 属于我们的一天'}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p>这段时间还没有记录，写下一件小事或收藏一个瞬间吧。</p>
      )}
      <small>显示当前已加载的事件与照片；不是完整历史分页。</small>
      {photo && (
        <PhotoViewer photo={photo} controller={controller} onClose={() => setPhoto(null)} />
      )}
    </section>
  )
}
