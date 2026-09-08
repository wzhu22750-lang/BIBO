import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildPingPush, isUnregisteredFcmError, type PingPushRecord } from '../_shared/pingPush.ts'
import { isDeviceRecentlyActive } from '../_shared/messagePush.ts'
import { googleAccessToken, parseServiceAccount, sendFcmMessage } from '../_shared/fcm.ts'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-bibo-webhook-secret',
}
function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: '仅支持 POST' }, 405)
  const expected = Deno.env.get('BIBO_WEBHOOK_SECRET')
  if (!expected || request.headers.get('x-bibo-webhook-secret') !== expected)
    return json({ error: 'Webhook 未授权' }, 401)
  const url = Deno.env.get('SUPABASE_URL'),
    service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    accountRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')
  if (!url || !service || !accountRaw)
    return json({ error: 'Push 发送服务尚未配置 service key / FCM service account' }, 503)
  let payload: { record?: PingPushRecord }
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Webhook payload 无效' }, 400)
  }
  const record = payload.record
  if (!record?.id || !record.couple_id || !record.sender_id)
    return json({ sent: 0, skipped: '匿名或无效 Ping' }, 200)
  let account
  try {
    account = parseServiceAccount(accountRaw)
  } catch (error) {
    return json({ error: String(error instanceof Error ? error.message : error) }, 503)
  }
  const admin = createClient(url, service)
  const { data: members, error: memberError } = await admin
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', record.couple_id)
  if (memberError) return json({ error: '读取空间成员失败', details: memberError.message }, 502)
  const partner = members?.find((row) => row.user_id !== record.sender_id)?.user_id
  if (!partner) return json({ sent: 0, skipped: '没有另一位成员' }, 200)
  const [{ data: profile }, { data: devices, error: deviceError }] = await Promise.all([
    admin.from('profiles').select('name').eq('id', record.sender_id).maybeSingle(),
    admin
      .from('device_installations')
      .select('token,last_seen_at')
      .eq('user_id', partner)
      .eq('platform', 'android'),
  ])
  if (deviceError) return json({ error: '读取 Push 设备失败', details: deviceError.message }, 502)
  if (!devices?.length) return json({ sent: 0, skipped: '对方没有登记 Android Push 设备' }, 200)
  // Realtime owns the foreground: a device that heartbeated recently already
  // presents the Ping in-app, so pushing would double-notify the same event.
  const targets = devices.filter(
    (device) =>
      typeof device.token === 'string' && !isDeviceRecentlyActive(device.last_seen_at as string),
  )
  if (!targets.length)
    return json({ sent: 0, skipped: '对方设备正在前台活跃，由 Realtime 呈现', skipped_active: devices.length }, 200)
  let access: string
  try {
    access = await googleAccessToken(account)
  } catch (error) {
    return json({ error: '获取 FCM access token 失败', details: String(error) }, 502)
  }
  let sent = 0,
    invalid = 0,
    failed = 0
  for (const device of targets) {
    const token = device.token as string
    const result = await sendFcmMessage(
      account,
      access,
      buildPingPush(record, token, profile?.name || 'TA'),
    )
    if (result.ok) {
      sent++
      continue
    }
    if (isUnregisteredFcmError(result.status, result.text)) {
      invalid++
      await admin.from('device_installations').delete().eq('user_id', partner).eq('token', token)
    } else failed++
  }
  if (failed > 0)
    return json({ sent, invalid, failed, error: '部分 FCM 请求失败；可由数据库 Webhook 重试' }, 502)
  return json({ sent, invalid, failed: 0 }, 200)
})
