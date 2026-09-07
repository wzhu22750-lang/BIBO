export type Page = 'home' | 'chat' | 'events' | 'photos' | 'focus' | 'settings'
export const AVATAR_IDS = [
  'dog',
  'cat',
  'bunny',
  'bear',
  'panda',
  'fox',
  'penguin',
  'duck',
  'frog',
  'hamster',
  'chick',
  'koala',
] as const
export type AvatarType = (typeof AVATAR_IDS)[number]
export type Profile = { id: string; name: string; avatar: AvatarType }
export type Couple = { id: string; name: string; together_since: string }
export type Message = {
  id: string
  couple_id: string
  sender_id: string
  content: string
  created_at: string
}
export type EventItem = {
  id: string
  couple_id: string
  title: string
  target_at: string
  kind: 'anniversary' | 'countdown'
  yearly: boolean
  emoji: string
  created_by: string
}
export type Photo = {
  id: string
  couple_id: string
  uploaded_by: string
  path: string
  caption: string
  created_at: string
  url?: string
}
export type Focus = {
  user_id: string
  couple_id: string
  activity: string
  ends_at: string
  allow_reminders: boolean
}
export type Ping = {
  id: string
  couple_id: string
  sender_id: string
  kind: string
  created_at: string
}
export type Space = {
  me: Profile
  partner: Profile | null
  couple: Couple | null
  messages: Message[]
  events: EventItem[]
  photos: Photo[]
  focus: Focus[]
}
export type EventInput = Omit<EventItem, 'id' | 'couple_id' | 'created_by'>
