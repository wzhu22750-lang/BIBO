export type PingPushRecord = {
  id: string
  couple_id: string
  sender_id: string | null
  kind: string
}
export const PING_PUSH_CHANNEL = 'bibo_love_v3'
export type FcmMessage = {
  message: {
    token: string
    notification: { title: string; body: string }
    data: { route: string; ping_id: string; kind: string }
    android: {
      priority: 'HIGH'
      notification: {
        channel_id: string
        notification_priority: 'PRIORITY_HIGH'
        visibility: 'PRIVATE'
        default_sound: boolean
        default_vibrate_timings: boolean
      }
    }
  }
}
export function isUsablePushToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 20 &&
    value.length <= 4096 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
}
export function buildPingPush(record: PingPushRecord, token: string): FcmMessage {
  if (!isUsablePushToken(token)) throw new Error('FCM token 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Ping ID 无效')
  const kind = record.kind.trim().slice(0, 40) || '哔卟'
  return {
    message: {
      token,
      notification: {
        title: '收到一个小小的哔卟',
        body: '收到一个小小的哔卟，打开 BIBU！查看',
      },
      data: { route: '#home', ping_id: record.id, kind },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: PING_PUSH_CHANNEL,
          notification_priority: 'PRIORITY_HIGH',
          visibility: 'PRIVATE',
          default_sound: true,
          default_vibrate_timings: true,
        },
      },
    },
  }
}
export function isUnregisteredFcmError(_status: number, body: string) {
  return /UNREGISTERED|registration-token-not-registered/i.test(body)
}
