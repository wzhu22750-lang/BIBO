import { createClient } from '@supabase/supabase-js'

// 哔卟哔卟 默认 Supabase 项目（浏览器公开凭据，数据安全由 RLS 保证）。
// 所有用户开箱即用同一数据库，无需自己填写环境变量。
// 若想切换/指向其他项目，可用环境变量覆盖：VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY。
const DEFAULT_URL = 'https://zqwzdoejxsfscisudacu.supabase.co'
const DEFAULT_KEY = 'sb_publishable_nxRhiAvRRQ_lwAQ9vaz_Og_yEqfC-V8'

// 原生 App 的邮箱验证回跳地址（与 AndroidManifest 里的 scheme 一致）。
// 需在 Supabase 后台 Auth → URL Configuration → Redirect URLs 中加入该地址。
// 说明：验证码登录（Auth.tsx 的 OTP 流程）不再走邮箱回跳深链接，
// 6 位验证码在 App 内直接校验；该常量仍保留给深链接监听与未来的密码重置回跳。
export const AUTH_REDIRECT_DEEP_LINK = 'love.bibu.space://'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_KEY
export const configured = true
export const supabase = createClient(url, key, {
  auth: {
    // PKCE：验证链接只携带一次性 code，不携带 token，更适合原生深链接回跳。
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
export function db() {
  if (!supabase) throw new Error('尚未配置 Supabase')
  return supabase
}
export function errorText(error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string }
    return [e.message || '操作失败，请重试', e.code, e.details, e.hint].filter(Boolean).join(' · ')
  }
  return String(error)
}
export function must<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error
  if (result.data === null || result.data === undefined)
    throw new Error('没有返回数据，请检查权限或刷新后重试')
  return result.data as NonNullable<T>
}
