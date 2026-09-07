export const eventArtOptions = [
  { id: 'heart', label: '恋爱心动', category: '恋爱纪念', tone: 'pink' },
  { id: 'bunny', label: '送信小兔', category: '想见你', tone: 'pink' },
  { id: 'dog', label: '出游小狗', category: '一起出发', tone: 'yellow' },
  { id: 'cake', label: '生日蛋糕', category: '生日快乐', tone: 'lilac' },
  { id: 'sea', label: '海边假期', category: '一起旅行', tone: 'blue' },
  { id: 'train', label: '见面列车', category: '奔向彼此', tone: 'green' },
  { id: 'plane', label: '旅行飞机', category: '一起旅行', tone: 'blue' },
  { id: 'trophy', label: '里程奖杯', category: '特别里程', tone: 'yellow' },
  { id: 'gift', label: '惊喜礼物', category: '小小惊喜', tone: 'pink' },
  { id: 'coffee', label: '咖啡约会', category: '日常约会', tone: 'green' },
  { id: 'tree', label: '节日小树', category: '节日约定', tone: 'green' },
  { id: 'home', label: '一起回家', category: '共同生活', tone: 'yellow' },
] as const
export type EventArtId = (typeof eventArtOptions)[number]['id']
// Keep the existing DB field and CHECK length. Old emoji values render as SVG;
// new choices store stable identifiers, never executable markup or URLs.
const legacy: Record<string, EventArtId> = {
  '💛': 'heart',
  '♥': 'heart',
  '💗': 'heart',
  '🌊': 'sea',
  '🎂': 'cake',
  '🚃': 'train',
  '✈️': 'plane',
  '🎓': 'trophy',
  '🎄': 'tree',
  '🏠': 'home',
}
export function eventArtId(value: string): EventArtId {
  const id = value.replace(/^icon:/, '')
  return eventArtOptions.find((option) => option.id === id)?.id || legacy[value] || 'heart'
}
export function eventArtConfig(value: string) {
  return eventArtOptions.find((option) => option.id === eventArtId(value))!
}
