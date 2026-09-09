import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildPingPush, isUnregisteredFcmError, type PingPushRecord } from '../_shared/pingPush.ts'
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
  const expected = Deno.env.get('BIBU_WEBHOOK_SECRET') || Deno.env.get('BIBO_WEBHOOK_SECRET')
  const secretHeader =
    request.headers.get('x-bibu-webhook-secret') || request.headers.get('x-bibo-webhook-secret')
  if (!expected || secretHeader !== expected) return json({ error: 'Webhook 未授权' }, 401)
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
  // The webhook secret authenticates the caller, but its JSON body is still
  // untrusted. Read the persisted Ping and use it as the source of truth.
  const { data: persistedPing, error: pingError } = await admin
    .from('pings')
    .select('id, couple_id, sender_id, kind')
    .eq('id', record.id)
    .eq('couple_id', record.couple_id)
    .maybeSingle()
  if (pingError) return json({ error: '校验 Ping 记录失败', details: pingError.message }, 502)
  if (!persistedPing || persistedPing.sender_id !== record.sender_id)
    return json({ sent: 0, skipped: 'Ping 不存在或已匿名化' }, 200)
  const verifiedRecord = persistedPing as PingPushRecord
  const { data: members, error: memberError } = await admin
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', verifiedRecord.couple_id)
  if (memberError) return json({ error: '读取空间成员失败', details: memberError.message }, 502)
  const partner = members?.find((row) => row.user_id !== verifiedRecord.sender_id)?.user_id
  if (!partner) return json({ sent: 0, skipped: '没有另一位成员' }, 200)
  const { data: devices, error: deviceError } = await admin
    .from('device_installations')
    .select('token')
    .eq('user_id', partner)
    .eq('platform', 'android')
  if (deviceError) return json({ error: '读取 Push 设备失败', details: deviceError.message }, 502)
  if (!devices?.length) return json({ sent: 0, skipped: '对方没有登记 Android Push 设备' }, 200)
  const targets = devices.filter(
    (device) => typeof device.token === 'string' && device.token.length >= 20,
  )
  if (!targets.length) return json({ sent: 0, skipped: '对方没有有效 Android Push Token' }, 200)
  console.log(
    `[send-ping-push] Ping ${verifiedRecord.id} -> Partner ${partner} (${targets.length} targets)`,
  )
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
    const result = await sendFcmMessage(account, access, buildPingPush(verifiedRecord, token))
    console.log(
      `[send-ping-push] Token ${token.slice(0, 10)}... status: ${result.status}, ok: ${result.ok}`,
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
