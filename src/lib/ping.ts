// Wire values remain readable by older clients; legacy focus reminders keep their permissions.
export const lovePings = [
  {
    kind: '哔卟哔卟',
    label: '哔卟',
    art: 'heart',
    message: '叮！你被一颗小小的心击中了。',
    notes: [523, 784, 1047, 784],
    vibration: [100, 60, 100],
  },
  {
    kind: '想你',
    label: '想你',
    art: 'bunny',
    message: '这一刻，我正在想你。',
    notes: [659, 784, 988],
    vibration: [80, 80, 160],
  },
  {
    kind: '抱一下',
    label: '抱一下',
    art: 'bear',
    message: '隔着屏幕，也给你一个大大的拥抱。',
    notes: [392, 523, 659],
    vibration: [240],
  },
  {
    kind: '快来',
    label: '快来',
    art: 'plane',
    message: '有件小事，想和你一起分享！',
    notes: [784, 784, 1047],
    vibration: [60, 60, 60, 60, 120],
  },
  {
    kind: '晚安',
    label: '晚安',
    art: 'moon',
    message: '今天辛苦啦，愿你的梦里也有我。',
    notes: [659, 523, 392],
    vibration: [100],
  },
  {
    kind: '我回来啦',
    label: '我回来啦',
    art: 'dog',
    message: '忙完啦，回到我们的小窝。',
    notes: [523, 659, 784, 1047],
    vibration: [100, 50, 200],
  },
] as const
export type LovePingKind = (typeof lovePings)[number]['kind']
export type PingKind = LovePingKind | '去学习' | '去工作' | '休息一下'
export function pingFeedback(kind: string) {
  return lovePings.find((item) => item.kind === kind) || lovePings[0]
}
