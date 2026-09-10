import type { MemoryInput, Space } from '../lib/types'
import { DEFAULT_PHOTO_ART } from '../lib/memories'
import { PixelDatePicker } from './PixelPickers'
import { PixelSelect } from './ui'
import { EventArtPicker } from './EventArtPicker'

export function MemoryFields({
  value,
  onChange,
  space,
}: {
  value: MemoryInput
  onChange: (value: MemoryInput) => void
  space: Space
}) {
  const eventOptions = [
    { value: '', label: '不关联事件' },
    ...(value.event_id && !space.events.some((e) => e.id === value.event_id)
      ? [{ value: value.event_id, label: '当前列表未加载的已关联事件' }]
      : []),
    ...space.events.map((event) => ({ value: event.id, label: event.title })),
  ]

  return (
    <>
      <div>
        <span style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 650 }}>
          回忆发生日期（可留空）
        </span>
        <PixelDatePicker
          value={value.occurred_on || ''}
          min="1900-01-01"
          max="9999-12-31"
          yearMax={9999}
          clearable
          onChange={(next) => onChange({ ...value, occurred_on: next || null })}
        />
      </div>
      <label>
        把这一天的故事留下来
        <textarea
          rows={4}
          maxLength={2000}
          value={value.story}
          onChange={(e) => onChange({ ...value, story: e.target.value })}
        />
      </label>
      <div>
        <span style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 650 }}>
          关联事件
        </span>
        <PixelSelect
          value={value.event_id || ''}
          onChange={(val) => onChange({ ...value, event_id: val || null })}
          options={eventOptions}
          aria-label="关联事件"
        />
      </div>
      <EventArtPicker
        value={value.emoji || DEFAULT_PHOTO_ART}
        onChange={(next) => onChange({ ...value, emoji: next })}
      />
      <p className="form-note">
        回忆日期不等于上传日期；上传照片时会自动识别拍摄日期，识别失败或想改时间时可手动填写。
        选中的像素小伙伴会显示在照片卡片上。
      </p>
    </>
  )
}
