import { createClient } from '@supabase/supabase-js'

// 哔卟哔卟 默认 Supabase 项目（浏览器公开凭据，数据安全由 RLS 保证）。
// 所有用户开箱即用同一数据库，无需自己填写环境变量。
// 若想切换/指向其他项目，可用环境变量覆盖：VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY。
const DEFAULT_URL = 'https://zqwzdoejxsfscisudacu.supabase.co'
const DEFAULT_KEY = 'sb_publishable_nxRhiAvRRQ_lwAQ9vaz_Og_yEqfC-V8'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || DEFAULT_KEY
export const configured = true
export const supabase = configured
  ? createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null
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
