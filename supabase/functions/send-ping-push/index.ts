import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildPingPush, isUnregisteredFcmError, type PingPushRecord } from '../_shared/pingPush.ts'
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
function b64(value: string | Uint8Array) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
function pemDer(pem: string) {
  const raw = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
  const binary = atob(raw)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer
}
async function googleAccessToken(account: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000),
    header = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    claim = b64(
      JSON.stringify({
        iss: account.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      }),
    )
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemDer(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = b64(
    new Uint8Array(
      await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(`${header}.${claim}`),
      ),
    ),
  )
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${signature}`,
    }),
  })
  const data = (await response.json()) as { access_token?: string; error?: string }
  if (!response.ok || !data.access_token)
    throw new Error(`Google OAuth token failed: ${data.error || response.status}`)
  return data.access_token
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
  let account: { project_id: string; client_email: string; private_key: string }
  try {
    account = JSON.parse(accountRaw)
  } catch {
    return json({ error: 'FCM_SERVICE_ACCOUNT_JSON 格式无效' }, 503)
  }
  if (!account.project_id || !account.client_email || !account.private_key)
    return json({ error: 'FCM service account 字段不完整' }, 503)
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
      .select('token')
      .eq('user_id', partner)
      .eq('platform', 'android'),
  ])
  if (deviceError) return json({ error: '读取 Push 设备失败', details: deviceError.message }, 502)
  if (!devices?.length) return json({ sent: 0, skipped: '对方没有登记 Android Push 设备' }, 200)
  let access: string
  try {
    access = await googleAccessToken(account)
  } catch (error) {
    return json({ error: '获取 FCM access token 失败', details: String(error) }, 502)
  }
  let sent = 0,
    invalid = 0,
    failed = 0
  for (const device of devices) {
    if (typeof device.token !== 'string') continue
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPingPush(record, device.token, profile?.name || 'TA')),
      },
    )
    const text = await response.text()
    if (response.ok) {
      sent++
      continue
    }
    if (isUnregisteredFcmError(response.status, text)) {
      invalid++
      await admin
        .from('device_installations')
        .delete()
        .eq('user_id', partner)
        .eq('token', device.token)
    } else failed++
  }
  if (failed > 0)
    return json({ sent, invalid, failed, error: '部分 FCM 请求失败；可由数据库 Webhook 重试' }, 502)
  return json({ sent, invalid, failed: 0 }, 200)
})
