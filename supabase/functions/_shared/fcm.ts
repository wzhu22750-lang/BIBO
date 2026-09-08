// Shared FCM HTTP v1 transport helpers for webhook-triggered push functions.
// Secrets stay server-side: FCM_SERVICE_ACCOUNT_JSON is only read from Deno.env.
export type FcmServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}
export function parseServiceAccount(raw: string): FcmServiceAccount {
  let account: FcmServiceAccount
  try {
    account = JSON.parse(raw)
  } catch {
    throw new Error('FCM_SERVICE_ACCOUNT_JSON 格式无效')
  }
  if (!account.project_id || !account.client_email || !account.private_key)
    throw new Error('FCM service account 字段不完整')
  return account
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
export async function googleAccessToken(account: {
  client_email: string
  private_key: string
}): Promise<string> {
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
export async function sendFcmMessage(
  account: { project_id: string },
  access: string,
  body: unknown,
): Promise<{ ok: boolean; status: number; text: string }> {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const text = await response.text()
  return { ok: response.ok, status: response.status, text }
}
