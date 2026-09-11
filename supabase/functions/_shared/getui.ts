// 个推 REST API v2 传输层（Webhook 推送用）。
// 密钥只存在于服务端环境变量：GETUI_APP_ID / GETUI_APP_KEY / GETUI_MASTER_SECRET。
// 客户端 APK 只内嵌 GETUI_APPID（App Id），不包含任何密钥。
// Deno 仅存在于 Supabase Edge Runtime；用 declare 声明让 ts-node/vitest 也能引入本文件。
declare const Deno: { env: { get(key: string): string | undefined } }
const REST_BASE =
  (typeof Deno !== 'undefined' && Deno.env.get('GETUI_REST_BASE')) || 'https://restapi.getui.com'

export type GeTuiEnv = {
  appId: string
  appKey: string
  masterSecret: string
}

export function parseGeTuiEnv(env: Record<string, string | undefined>): GeTuiEnv | undefined {
  const appId = env.GETUI_APP_ID?.trim() ?? ''
  const appKey = env.GETUI_APP_KEY?.trim() ?? ''
  const masterSecret = env.GETUI_MASTER_SECRET?.trim() ?? ''
  if (!appId || !appKey || !masterSecret) return undefined
  return { appId, appKey, masterSecret }
}

// ---------------------------------------------------------------------------
// SHA-256（hex，小写）。个推 REST API v2 鉴权签名标准：
// sign = sha256(appkey + timestamp + mastersecret)
// Web Crypto API 在 Deno Edge Runtime、Node.js 18+ 与现代浏览器均内置。
// ---------------------------------------------------------------------------
export async function sha256hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ---------------------------------------------------------------------------
// 鉴权与发送
// ---------------------------------------------------------------------------
let cachedToken: { value: string; expiresAt: number } | undefined
const TOKEN_TTL_MS = 6 * 3600 * 1000 // 个推 token 有效期 24h，留余量提前刷新

async function authToken(env: GeTuiEnv): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value
  const timestamp = String(Date.now())
  const sign = await sha256hex(`${env.appKey}${timestamp}${env.masterSecret}`)
  const res = await fetch(`${REST_BASE}/v2/${env.appId}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appkey: env.appKey, timestamp, sign }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.code !== 0 || !body.data?.token) {
    throw new Error(`个推鉴权失败 (HTTP ${res.status}): ${body.msg ?? '未知错误'}`)
  }
  cachedToken = { value: body.data.token, expiresAt: Date.now() + TOKEN_TTL_MS }
  return body.data.token
}

export type GeTuiTransmissionPayload = {
  kind: 'ping' | 'message'
  title: string
  body: string
  route: string
  ping_id?: string
  message_id?: string
}

/**
 * 向单个 CID 推透传消息（JSON 载荷）。客户端 BibuGTIntentService 收到后渲染系统通知。
 * push_channel.strategy.default = 1：在线走个推自建通道，离线尝试厂商通道。
 */
export async function sendGeTuiTransmission(
  env: GeTuiEnv,
  cid: string,
  payload: GeTuiTransmissionPayload,
): Promise<{ ok: boolean; status: number; text: string }> {
  const token = await authToken(env)
  const res = await fetch(`${REST_BASE}/v2/${env.appId}/push/single/cid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', token },
    body: JSON.stringify({
      request_id: crypto.randomUUID(),
      cid,
      settings: { ttl: 3600000 },
      push_message: { transmission: { content: JSON.stringify(payload) } },
      push_channel: { strategy: { default: 1 } },
    }),
  })
  const text = await res.text()
  const code = parseGeTuiCode(text)
  return { ok: res.ok && code === 0, status: res.status, text }
}

export function parseGeTuiCode(text: string): number | null {
  try {
    const body = JSON.parse(text)
    return typeof body.code === 'number' ? body.code : null
  } catch {
    return null
  }
}

/** 设备侧 CID 已失效（卸载/注销）：应删除 device_installations 行。 */
export function isInvalidCidError(status: number, body: string): boolean {
  if (status === 0 || status >= 500) return false
  return /cid.*(?:无效|不存在|非法|失效|invalid|not exist|notfound)/i.test(body) ||
    /(?:没有找到|no.*cid)/i.test(body)
}