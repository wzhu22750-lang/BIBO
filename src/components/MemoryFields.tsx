import type { MemoryInput, Space } from '../lib/types'
import { PixelDatePicker } from './PixelPickers'
import { PixelSelect } from './ui'
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

  const messageOptions = [
    { value: '', label: '不关联聊天' },
    ...(value.message_id && !space.messages.some((m) => m.id === value.message_id)
      ? [{ value: value.message_id, label: '当前列表未加载的已关联消息' }]
      : []),
    ...[...space.messages].reverse().map((message) => ({
      value: message.id,
      label: `${
        message.sender_id === null
          ? '已注销玩家'
          : message.sender_id === space.me.id
            ? '我'
            : space.partner?.name || 'TA'
      }：${message.content.slice(0, 45)}`,
    })),
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
      <div>
        <span style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 650 }}>
          关联一句悄悄话
        </span>
        <PixelSelect
          value={value.message_id || ''}
          onChange={(val) => onChange({ ...value, message_id: val || null })}
          options={messageOptions}
          aria-label="关联悄悄话"
        />
      </div>
      <p className="form-note">
        回忆日期不等于上传日期；上传照片时会自动识别拍摄日期，识别失败或想改时间时可手动填写。
        关联聊天当前可选择最近已加载的消息。
      </p>
    </>
  )
}
