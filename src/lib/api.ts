import { db, must, errorText } from './supabase'
import type { Couple, EventInput, EventItem, Focus, Message, Photo, Profile, Space } from './types'
export async function loadSpace(userId: string): Promise<Space> {
  const me = must(await db().from('profiles').select('*').eq('id', userId).single()) as Profile
  const membership = await db()
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (membership.error) throw membership.error
  const empty: Space = {
    me,
    partner: null,
    couple: null,
    messages: [],
    events: [],
    photos: [],
    focus: [],
  }
  if (!membership.data) return empty
  const id = membership.data.couple_id as string
  const [couple, members, messages, events, photos, focus] = await Promise.all([
    db().from('couples').select('*').eq('id', id).single(),
    db().from('couple_members').select('user_id').eq('couple_id', id),
    db()
      .from('messages')
      .select('*')
      .eq('couple_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    db().from('events').select('*').eq('couple_id', id),
    db()
      .from('photos')
      .select('*')
      .eq('couple_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
    db().from('focus_sessions').select('*').eq('couple_id', id),
  ])
  const otherId = must(members).find((m) => m.user_id !== userId)?.user_id
  const partner = otherId
    ? (must(await db().from('profiles').select('*').eq('id', otherId).single()) as Profile)
    : null
  const rows = must(photos) as Photo[]
  const signed = rows.length
    ? must(
        await db()
          .storage.from('couple-photos')
          .createSignedUrls(
            rows.map((p) => p.path),
            3600,
          ),
      )
    : []
  const photoRows = rows.map((photo, i) => ({ ...photo, url: signed[i]?.signedUrl || undefined }))
  return {
    me,
    partner,
    couple: must(couple) as Couple,
    messages: (must(messages) as Message[]).reverse(),
    events: must(events) as EventItem[],
    photos: photoRows,
    focus: must(focus) as Focus[],
  }
}
export async function sendMessage(coupleId: string, userId: string, content: string) {
  return must(
    await db()
      .from('messages')
      .insert({ couple_id: coupleId, sender_id: userId, content })
      .select()
      .single(),
  )
}
export async function addEvent(coupleId: string, userId: string, input: EventInput) {
  return must(
    await db()
      .from('events')
      .insert({ ...input, couple_id: coupleId, created_by: userId })
      .select()
      .single(),
  )
}
export async function deleteEvent(id: string) {
  return must(await db().from('events').delete().eq('id', id).select('id').single())
}
export async function uploadPhoto(coupleId: string, userId: string, file: File, caption: string) {
  validatePhoto(file)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${coupleId}/${userId}/${crypto.randomUUID()}.${ext}`
  must(
    await db()
      .storage.from('couple-photos')
      .upload(path, file, { contentType: file.type, upsert: false }),
  )
  const result = await db()
    .from('photos')
    .insert({ couple_id: coupleId, uploaded_by: userId, path, caption })
    .select()
    .single()
  if (result.error) {
    const cleanup = await db().storage.from('couple-photos').remove([path])
    if (cleanup.error)
      throw new Error(`${result.error.message}；清理未完成，请联系管理员删除孤立文件：${path}`)
    throw result.error
  }
  return must(result)
}
export function validatePhoto(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('请选择 JPG、PNG 或 WebP 图片（不支持 SVG / HEIC）')
  if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5 MB')
}
export async function setFocus(
  coupleId: string,
  userId: string,
  activity: string,
  minutes: number,
  allow: boolean,
) {
  return must(
    await db()
      .from('focus_sessions')
      .upsert({
        user_id: userId,
        couple_id: coupleId,
        activity,
        ends_at: new Date(Date.now() + minutes * 60000).toISOString(),
        allow_reminders: allow,
      })
      .select()
      .single(),
  )
}
export async function endFocus(userId: string) {
  return must(await db().from('focus_sessions').delete().eq('user_id', userId).select().single())
}
export async function sendPing(kind: string) {
  return must(await db().rpc('send_ping', { ping_kind: kind }))
}
export async function saveSettings(
  userId: string,
  coupleId: string | undefined,
  name: string,
  since: string,
) {
  // Each write must return its row. If the second write fails, surface the partial save explicitly.
  must(await db().from('profiles').update({ name }).eq('id', userId).select().single())
  if (coupleId) {
    const result = await db()
      .from('couples')
      .update({ together_since: since })
      .eq('id', coupleId)
      .select()
      .single()
    if (result.error || !result.data)
      throw new Error(
        `昵称已保存，但在一起日期保存失败：${result.error ? errorText(result.error) : '未返回记录'}`,
      )
  }
}
