import type { MemoryInput, Space } from '../lib/types'
export function MemoryFields({
  value,
  onChange,
  space,
}: {
  value: MemoryInput
  onChange: (value: MemoryInput) => void
  space: Space
}) {
  return (
    <>
      <label>
        回忆发生日期（可留空）
        <input
          type="date"
          min="1900-01-01"
          max="9999-12-31"
          value={value.occurred_on || ''}
          onChange={(e) => onChange({ ...value, occurred_on: e.target.value || null })}
        />
      </label>
      <label>
        把这一天的故事留下来
        <textarea
          rows={4}
          maxLength={2000}
          value={value.story}
          onChange={(e) => onChange({ ...value, story: e.target.value })}
        />
      </label>
      <label>
        关联事件
        <select
          value={value.event_id || ''}
          onChange={(e) => onChange({ ...value, event_id: e.target.value || null })}
        >
          <option value="">不关联事件</option>
          {value.event_id && !space.events.some((e) => e.id === value.event_id) && (
            <option value={value.event_id}>当前列表未加载的已关联事件</option>
          )}
          {space.events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        关联一句悄悄话
        <select
          value={value.message_id || ''}
          onChange={(e) => onChange({ ...value, message_id: e.target.value || null })}
        >
          <option value="">不关联聊天</option>
          {value.message_id && !space.messages.some((m) => m.id === value.message_id) && (
            <option value={value.message_id}>当前列表未加载的已关联消息</option>
          )}
          {[...space.messages].reverse().map((message) => (
            <option key={message.id} value={message.id}>
              {message.sender_id === null
                ? '已注销玩家'
                : message.sender_id === space.me.id
                  ? '我'
                  : space.partner?.name || 'TA'}
              ：{message.content.slice(0, 45)}
            </option>
          ))}
        </select>
      </label>
      <p className="form-note">
        回忆日期不等于上传日期；上传照片时会自动识别拍摄日期，识别失败或想改时间时可手动填写。
        关联聊天当前可选择最近已加载的消息。
      </p>
    </>
  )
}
