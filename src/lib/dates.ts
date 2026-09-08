const DAY = 86_400_000
export function dayNumber(value: Date) {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / DAY
}
export function togetherDays(since: string, now = new Date()) {
  return Math.max(0, dayNumber(now) - dayNumber(new Date(since + 'T00:00:00')))
}
export function nextOccurrence(target: string, yearly: boolean, now = new Date()) {
  const date = new Date(target)
  if (!yearly) return date
  const month = date.getMonth(),
    day = date.getDate()
  // Feb 29 is observed on Feb 28 in non-leap years.
  const inYear = (year: number) =>
    new Date(
      year,
      month,
      Math.min(day, new Date(year, month + 1, 0).getDate()),
      date.getHours(),
      date.getMinutes(),
    )
  let next = inYear(now.getFullYear())
  if (dayNumber(next) < dayNumber(now)) next = inYear(now.getFullYear() + 1)
  return next
}
export function daysUntil(target: string, yearly: boolean, now = new Date()) {
  return dayNumber(nextOccurrence(target, yearly, now)) - dayNumber(now)
}
export function sortedEvents<T extends { target_at: string; yearly: boolean }>(
  events: T[],
  now = new Date(),
) {
  return [...events].sort((a, b) => {
    const x = nextOccurrence(a.target_at, a.yearly, now).getTime()
    const y = nextOccurrence(b.target_at, b.yearly, now).getTime()
    const aPast = x < now.getTime() && dayNumber(new Date(x)) < dayNumber(now)
    const bPast = y < now.getTime() && dayNumber(new Date(y)) < dayNumber(now)
    return aPast !== bPast ? (aPast ? 1 : -1) : aPast ? y - x : x - y
  })
}
export function dateLabel(value: string | Date) {
  return new Date(value)
    .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replaceAll('/', '.')
}
export function localDateInput(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function clock(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
export function localDateTimeInput(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (!Number.isFinite(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
