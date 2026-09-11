export type PingPushRecord = {
  id: string
  couple_id: string
  sender_id: string | null
  kind: string
}
export const PING_PUSH_CHANNEL = 'bibo_love_v3'
// 个推透传载荷：客户端 BibuGTIntentService 据此渲染系统通知并深链。
export type GeTuiPingPayload = {
  kind: 'ping'
  title: string
  body: string
  route: '#home'
  ping_id: string
}
export function isUsablePushToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 20 &&
    value.length <= 4096 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  )
}
export function buildPingPush(record: PingPushRecord, cid: string): GeTuiPingPayload {
  if (!isUsablePushToken(cid)) throw new Error('个推 CID 无效')
  if (!/^[0-9a-f-]{20,80}$/i.test(record.id)) throw new Error('Ping ID 无效')
  return {
    kind: 'ping',
    title: '收到一个小小的哔卟',
    body: '收到一个小小的哔卟，打开 BIBU！查看',
    route: '#home',
    ping_id: record.id,
  }
}