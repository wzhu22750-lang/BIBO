import { useEffect, useState } from 'react'
import { Button, Modal, PixelSelect } from './ui'

type DateParts = { year: number; month: number; day: number }
type TimeParts = { hour: number; minute: number }

type DatePickerProps = {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  yearMin?: number
  yearMax?: number
  placeholder?: string
  clearable?: boolean
}

type TimePickerProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const pad = (value: number) => String(value).padStart(2, '0')
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
const currentTime = () => {
  const date = new Date()
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
function dateParts(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  const date = new Date()
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
}
function timeParts(value: string): TimeParts {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (match) return { hour: Number(match[1]), minute: Number(match[2]) }
  const date = new Date()
  return { hour: date.getHours(), minute: date.getMinutes() }
}
function formatDate(value: DateParts) {
  return `${String(value.year).padStart(4, '0')}-${pad(value.month)}-${pad(value.day)}`
}
function formatTime(value: TimeParts) {
  return `${pad(value.hour)}:${pad(value.minute)}`
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}
function clampDate(value: DateParts, min?: string, max?: string) {
  const next = { ...value, day: Math.min(value.day, daysInMonth(value.year, value.month)) }
  const formatted = formatDate(next)
  if (min && formatted < min) return dateParts(min)
  if (max && formatted > max) return dateParts(max)
  return next
}
function labelDate(value: string, placeholder: string) {
  if (!value) return placeholder
  const [year, month, day] = value.split('-')
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`
}
function labelTime(value: string, placeholder: string) {
  return value || placeholder
}
export function PixelDatePicker({
  value,
  onChange,
  min,
  max,
  yearMin = 1900,
  yearMax = new Date().getFullYear() + 10,
  placeholder = '选择日期',
  clearable = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => clampDate(dateParts(value || today()), min, max))
  useEffect(() => {
    if (open) setDraft(clampDate(dateParts(value || today()), min, max))
  }, [open, value, min, max])
  const days = daysInMonth(draft.year, draft.month)
  function save() {
    const next = clampDate({ ...draft, day: Math.min(draft.day, days) }, min, max)
    onChange(formatDate(next))
    setOpen(false)
  }
  return (
    <>
      <button
        type="button"
        className="pixel-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{labelDate(value, placeholder)}</span>
        <span aria-hidden="true">▣</span>
      </button>
      {open && (
        <Modal title="选择日期" onClose={() => setOpen(false)} className="pixel-picker-modal">
          <div className="pixel-picker-grid">
            <label>
              年
              <input
                type="number"
                min={yearMin}
                max={yearMax}
                inputMode="numeric"
                value={draft.year}
                onChange={(event) => {
                  const year = Number(event.target.value)
                  if (!Number.isInteger(year)) return
                  setDraft((current) => ({
                    ...current,
                    year,
                    day: Math.min(current.day, daysInMonth(year, current.month)),
                  }))
                }}
              />
            </label>
            <div>
              <span style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>月</span>
              <PixelSelect
                value={String(draft.month)}
                aria-label="选择月份"
                onChange={(val) => {
                  const month = Number(val)
                  setDraft((current) => ({
                    ...current,
                    month,
                    day: Math.min(current.day, daysInMonth(current.year, month)),
                  }))
                }}
                options={Array.from({ length: 12 }, (_, index) => index + 1).map((month) => ({
                  value: String(month),
                  label: `${month} 月`,
                }))}
              />
            </div>
            <div>
              <span style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>日</span>
              <PixelSelect
                value={String(draft.day)}
                aria-label="选择日期"
                onChange={(val) =>
                  setDraft((current) => ({ ...current, day: Number(val) }))
                }
                options={Array.from({ length: days }, (_, index) => index + 1).map((day) => ({
                  value: String(day),
                  label: `${day} 日`,
                }))}
              />
            </div>
          </div>
          <div className="pixel-picker-actions">
            <Button tone="green" onClick={save}>
              确认日期
            </Button>
            {clearable && (
              <Button
                tone="pink"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
              >
                清空日期
              </Button>
            )}
            <Button tone="white" onClick={() => setOpen(false)}>
              取消
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function PixelTimePicker({ value, onChange, placeholder = '选择时间' }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(() => timeParts(value || currentTime()))
  useEffect(() => {
    if (open) setDraft(timeParts(value || currentTime()))
  }, [open, value])
  function save() {
    onChange(formatTime(draft))
    setOpen(false)
  }
  return (
    <>
      <button
        type="button"
        className="pixel-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{labelTime(value, placeholder)}</span>
        <span aria-hidden="true">◷</span>
      </button>
      {open && (
        <Modal title="选择时间" onClose={() => setOpen(false)} className="pixel-picker-modal">
          <div className="pixel-picker-grid pixel-time-grid">
            <div>
              <span style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>时</span>
              <PixelSelect
                value={String(draft.hour)}
                aria-label="选择小时"
                onChange={(val) =>
                  setDraft((current) => ({ ...current, hour: Number(val) }))
                }
                options={Array.from({ length: 24 }, (_, hour) => hour).map((hour) => ({
                  value: String(hour),
                  label: `${pad(hour)} 时`,
                }))}
              />
            </div>
            <div>
              <span style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>分</span>
              <PixelSelect
                value={String(draft.minute)}
                aria-label="选择分钟"
                onChange={(val) =>
                  setDraft((current) => ({ ...current, minute: Number(val) }))
                }
                options={Array.from({ length: 60 }, (_, minute) => minute).map((minute) => ({
                  value: String(minute),
                  label: `${pad(minute)} 分`,
                }))}
              />
            </div>
          </div>
          <div className="pixel-picker-actions">
            <Button tone="green" onClick={save}>
              确认时间
            </Button>
            <Button tone="white" onClick={() => setOpen(false)}>
              取消
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export function PixelDateTimePicker({
  value,
  onChange,
  min,
  max,
  placeholder = '选择日期和时间',
}: Omit<DatePickerProps, 'placeholder'> & { placeholder?: string }) {
  const [date = '', time = ''] = value.split('T')
  const selected = date && time
  return (
    <div className="pixel-datetime-picker" aria-label={placeholder}>
      <PixelDatePicker
        value={date}
        min={min?.slice(0, 10)}
        max={max?.slice(0, 10)}
        yearMin={1900}
        yearMax={9999}
        placeholder={selected ? '选择日期' : placeholder}
        onChange={(nextDate) => onChange(`${nextDate}T${time || currentTime()}`)}
      />
      <PixelTimePicker
        value={time}
        onChange={(nextTime) => onChange(`${date || today()}T${nextTime}`)}
      />
    </div>
  )
}
