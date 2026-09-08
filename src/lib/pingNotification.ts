import { pingFeedback } from './ping'
import type { NotificationInput } from '../native'
export function positiveHash(value: string) {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return ((hash >>> 0) % 2147483646) + 1
}
export function incomingPingNotification(
  id: string,
  kind: string,
  partnerName = 'TA',
): NotificationInput {
  const feedback = pingFeedback(kind)
  return {
    id: positiveHash(id),
    title: '收到一个小小的哔卟',
    body: `${partnerName} 发来「${feedback.label}」`,
    route: '#home',
  }
}
