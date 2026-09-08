export type PingPushRecord = {
  id: string
  couple_id: string
  sender_id: string | null
  kind: string
}
export type FcmMessage = {
  message: {
    token: string
    notification: { title: string; body: string }
    data: { route: string; ping_id: string; kind: string }
    android: { notification: { channel_id: string } }
  }
}
const labels: Record<string, string> = {
  哔卟哔卟: '哔卟哔卟',
  想你: '想你',
  抱一下: '抱一下',
  快来: '快来',
  晚安: '晚安',
  我回来啦: '我回来啦',
  去学习: '去学习',
  去工作: '去工作',
  休息一下: '休息一下',
}
export function isUsablePushToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 20 &&
    value.length <= 4096 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
}
export function buildPingPush(
  record: PingPushRecord,
  token: string,
  senderName = 'TA',
): FcmMessage {
  if (!isUsablePushToken(token)) throw new Error('FCM token 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Ping ID 无效')
  const kind = labels[record.kind] || '哔卟'
  return {
    message: {
      token,
      notification: {
        title: '收到一个小小的哔卟',
        body: `${senderName.slice(0, 24)} 发来「${kind}」`,
      },
      data: { route: '#home', ping_id: record.id, kind },
      android: { notification: { channel_id: 'bibo_love_v1' } },
    },
  }
}
export function isUnregisteredFcmError(status: number, body: string) {
  return (
    status === 404 || /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT/i.test(body)
  )
}
