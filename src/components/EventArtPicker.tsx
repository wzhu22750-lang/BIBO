import { useState } from 'react'
import { EventArt } from './EventArt'
import { Icon } from './PixelArt'
import { eventArtConfig, eventArtGroups, eventArtOptions, filterEventArt } from '../lib/eventArt'
import type { EventArtGroup } from '../lib/eventArt'

export function EventArtPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [group, setGroup] = useState<EventArtGroup>('all'),
    [query, setQuery] = useState('')
  const options = filterEventArt(group, query)
  const selected = eventArtConfig(value)
  function reset() {
    setQuery('')
    setGroup('all')
  }
  return (
    <fieldset className="event-art-picker expanded-art-picker">
      <legend>
        挑一位像素小伙伴 <span>{eventArtOptions.length} 枚 SVG</span>
      </legend>
      <label className="art-search">
        搜索图标
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          placeholder="试试：小熊、旅行、考试、音乐…"
          aria-label="搜索像素图标"
        />
      </label>
      <div className="art-group-tabs" aria-label="图标分类">
        {eventArtGroups.map((item) => (
          <button
            type="button"
            key={item.id}
            className={group === item.id ? 'selected' : ''}
            aria-pressed={group === item.id}
            onClick={() => setGroup(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="art-grid-scroll" key={`${group}:${query}`}>
        <div className="event-art-options">
          {options.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`art-choice art-${item.tone} ${value === `icon:${item.id}` ? 'selected' : ''}`}
              aria-label={`选择${item.label}`}
              aria-pressed={value === `icon:${item.id}`}
              onClick={() => onChange(`icon:${item.id}`)}
            >
              <EventArt value={item.id} size={38} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        {!options.length && (
          <div className="art-search-empty">
            <EventArt value="cat" size={48} />
            <p>这里还没有找到这个小伙伴</p>
            <button type="button" onClick={reset}>
              清除筛选，看看全部图标
            </button>
          </div>
        )}
      </div>
      <div className={`art-selection art-${selected.tone}`}>
        <EventArt value={selected.id} size={29} />
        <span>
          已选：<strong>{selected.label}</strong>
        </span>
        <span className="art-match-count" role="status">
          {options.length} 个可选
        </span>
        <Icon name="check" size={13} />
      </div>
    </fieldset>
  )
}
