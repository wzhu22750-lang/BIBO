import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const configured = Boolean(url && key)
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
