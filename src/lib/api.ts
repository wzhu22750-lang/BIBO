import { photoPage } from './photoHistory'
import { deleteOwnedPhoto, type PhotoDeletionStore } from './photoDeletion'
import { validReferenceId, type ReferenceKind } from './routes'
import type { LinkedRecord } from './types'
import { memoryInput } from './memories'
import { mergePings, PING_HISTORY_LIMIT } from './pingHistory'
import type { PingKind } from './ping'
import { db, must, errorText } from './supabase'
import type {
  AvatarType,
  Couple,
  EventInput,
  EventItem,
  Focus,
  Message,
  MemoryInput,
  Photo,
  Profile,
  Space,
} from './types'
import { normalizeOutfits } from './pet/normalize'
import type { CharacterOutfits } from './pet/types'

export async function refreshPhotoUrl(path: string): Promise<string> {
  const result = await db().storage.from('couple-photos').createSignedUrl(path, 3600)
  return must(result).signedUrl
}
export async function loadSpace(userId: string, signal?: AbortSignal): Promise<Space> {
  const abort = signal || new AbortController().signal
  const me = must(
    await db().from('profiles').select('*').eq('id', userId).abortSignal(abort).single(),
  ) as Profile
  const membership = await db()
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
    .abortSignal(abort)
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
    pings: [],
  }
  if (!membership.data) return empty
  const id = membership.data.couple_id as string
  const [couple, members, messages, events, photos, focus, pings] = await Promise.all([
    db().from('couples').select('*').eq('id', id).abortSignal(abort).single(),
    db().from('couple_members').select('user_id').eq('couple_id', id).abortSignal(abort),
    db()
      .from('messages')
      .select('*')
      .eq('couple_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(200)
      .abortSignal(abort),
    db().from('events').select('*').eq('couple_id', id).abortSignal(abort),
    db()
      .from('photos')
      .select('*')
      .eq('couple_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(200)
      .abortSignal(abort),
    db().from('focus_sessions').select('*').eq('couple_id', id).abortSignal(abort),
    db()
      .from('pings')
      .select('*')
      .eq('couple_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PING_HISTORY_LIMIT)
      .abortSignal(abort),
  ])
  const otherId = must(members).find((m) => m.user_id !== userId)?.user_id
  const partner = otherId
    ? (must(
        await db().from('profiles').select('*').eq('id', otherId).abortSignal(abort).single(),
      ) as Profile)
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
  me.outfits = normalizeOutfits(me.outfits)
  if (partner) {
    partner.outfits = normalizeOutfits(partner.outfits)
  }
  return {
    me,
    partner,
    couple: must(couple) as Couple,
    messages: (must(messages) as Message[]).reverse(),
    events: must(events) as EventItem[],
    photos: photoRows,
    focus: must(focus) as Focus[],
    pings: mergePings(id, must(pings)),
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
export async function uploadPhoto(
  coupleId: string,
  userId: string,
  file: File,
  caption: string,
  memory: Partial<MemoryInput> = {},
) {
  // Keep the legacy API entry point, but route it through the same fixed-ID
  // RPC/storage contract used by the durable outbox. A lost response must not
  // delete a committed object or create a duplicate on the next attempt.
  return uploadPhotoOnce(coupleId, userId, crypto.randomUUID(), file, caption, memoryInput(memory))
}
export function validatePhoto(file: Pick<File, 'type' | 'size'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('请选择 JPG、PNG 或 WebP 图片（不支持 SVG / HEIC）')
  if (file.size > 5 * 1024 * 1024) throw new Error('图片不能超过 5 MB')
}
export async function setFocus(
  coupleId: string,
  _userId: string,
  activity: string,
  minutes: number,
  allow: boolean,
) {
  return must(
    await db().rpc('set_focus_session', {
      space_id: coupleId,
      focus_activity: activity,
      duration_minutes: minutes,
      reminders_allowed: allow,
    }),
  )
}
export async function endFocus(coupleId: string) {
  return must(await db().rpc('end_focus_session', { space_id: coupleId }))
}
export async function sendPing(kind: PingKind) {
  return must(await db().rpc('send_ping', { ping_kind: kind }))
}
export async function saveSettings(
  userId: string,
  coupleId: string | undefined,
  name: string,
  since: string,
  avatar?: AvatarType,
  outfits?: CharacterOutfits,
) {
  // Each write must return its row. If the second write fails, surface the partial save explicitly.
  const profileUpdates: { name: string; avatar?: AvatarType; outfits?: CharacterOutfits } = { name }
  if (avatar) profileUpdates.avatar = avatar
  if (outfits !== undefined) profileUpdates.outfits = normalizeOutfits(outfits)
  must(await db().from('profiles').update(profileUpdates).eq('id', userId).select().single())
  if (coupleId) {
    const result = await db()
      .from('couples')
      .update({ together_since: since })
      .eq('id', coupleId)
      .select()
      .single()
    if (result.error || !result.data)
      throw new Error(
        `个人档案已保存，但在一起日期保存失败：${result.error ? errorText(result.error) : '未返回记录'}`,
      )
  }
}
export async function updateGreeting(coupleId: string, title: string, subtitle: string) {
  return must(
    await db()
      .from('couples')
      .update({ greeting_title: title.trim(), greeting_subtitle: subtitle.trim() })
      .eq('id', coupleId)
      .select('id, greeting_title, greeting_subtitle')
      .single(),
  )
}

export async function updateMemory(
  id: string,
  caption: string,
  memory: MemoryInput,
): Promise<Photo> {
  return must(
    await db()
      .from('photos')
      .update({ caption, ...memoryInput(memory) })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function readLinkedRecord(
  coupleId: string,
  kind: ReferenceKind,
  id: string,
): Promise<LinkedRecord | null> {
  if (!validReferenceId(id)) throw new Error('关联记录 ID 无效')
  const result = await db()
    .from(kind === 'message' ? 'messages' : 'events')
    .select('*')
    .eq('couple_id', coupleId)
    .eq('id', id)
    .maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return null
  return kind === 'message'
    ? { kind, record: result.data as Message }
    : { kind, record: result.data as EventItem }
}

export async function sendMessageOnce(
  id: string,
  coupleId: string,
  content: string,
  signal?: AbortSignal,
): Promise<Message> {
  const request = db().rpc('send_message_once', {
    message_id: id,
    space_id: coupleId,
    message_content: content,
  })
  return must(await (signal ? request.abortSignal(signal) : request)) as Message
}

export async function loadMessageHistory(
  coupleId: string,
  before: Pick<Message, 'id' | 'created_at'>,
): Promise<Message[]> {
  return must(
    await db().rpc('message_history', {
      space_id: coupleId,
      before_time: before.created_at,
      before_id: before.id,
      page_size: 50,
    }),
  ) as Message[]
}

const photoDeletionStore: PhotoDeletionStore = {
  async read(id, coupleId, userId) {
    // Availability of this migration-bound RPC is checked before touching Storage.
    const result = await db()
      .rpc('photo_deletion_target', { photo_id: id, space_id: coupleId })
      .maybeSingle()
    if (result.error) throw result.error
    const row = result.data as Photo | null
    return row?.uploaded_by === userId ? row : null
  },
  async removeFile(path) {
    const result = await db().storage.from('couple-photos').remove([path])
    if (result.error) throw result.error
  },
  async fileExists(path) {
    const split = path.lastIndexOf('/'),
      name = path.slice(split + 1)
    const result = await db()
      .storage.from('couple-photos')
      .list(path.slice(0, split), { search: name, limit: 100 })
    const rows = must(result)
    if (rows.length >= 100) throw new Error('文件检查结果不完整，未删除回忆记录')
    return rows.some((row) => row.name === name)
  },
  async removeRow(id, coupleId, userId) {
    return must(
      await db()
        .from('photos')
        .delete()
        .eq('id', id)
        .eq('couple_id', coupleId)
        .eq('uploaded_by', userId)
        .select('id')
        .single(),
    ).id as string
  },
}
export async function deletePhoto(id: string, coupleId: string, userId: string) {
  return deleteOwnedPhoto(photoDeletionStore, id, coupleId, userId)
}

export async function loadPhotoPage(
  coupleId: string,
  before: import('./photoHistory').PhotoCursor | null,
  eventId: string | null,
): Promise<import('./photoHistory').PhotoPage> {
  const rows = must(
    await db().rpc('photo_history', {
      space_id: coupleId,
      before_time: before?.created_at || null,
      before_id: before?.id || null,
      event_filter: eventId,
    }),
  ) as Photo[]
  const page = photoPage(rows)
  const visible = page.photos
  const signed = visible.length
    ? must(
        await db()
          .storage.from('couple-photos')
          .createSignedUrls(
            visible.map((p) => p.path),
            3600,
          ),
      )
    : []
  return {
    photos: visible.map((p, i) => ({ ...p, url: signed[i]?.signedUrl || undefined })),
    hasMore: page.hasMore,
  }
}

export async function deleteAccount(
  expectedSpace: string | null,
): Promise<{ deleted: true; prepared_space: string | null }> {
  const result = await db().functions.invoke('delete-account', {
    body: { expected_space: expectedSpace },
  })
  if (result.error) throw result.error
  if (!result.data || result.data.deleted !== true)
    throw new Error('账号注销结果未确认，请不要重复提交，刷新后检查登录状态')
  return result.data as { deleted: true; prepared_space: string | null }
}

export async function registerDeviceInstallation(
  _userId: string,
  token: string,
  appVersion = 'unknown',
) {
  // The server derives ownership from auth.uid() and atomically transfers a
  // token from an old account when this installation changes accounts.
  return must(
    await db().rpc('register_device_installation', {
      device_token: token,
      device_app_version: appVersion,
    }),
  )
}
export async function removeDeviceInstallation(userId: string, token: string) {
  const result = await db()
    .from('device_installations')
    .delete()
    .eq('user_id', userId)
    .eq('token', token)
    .select('id')
    .maybeSingle()
  if (result.error) throw result.error
  return result.data as { id: string } | null
}

export async function removeAllDeviceInstallations(userId: string) {
  const result = await db().from('device_installations').delete().eq('user_id', userId)
  if (result.error) throw result.error
}

export async function createEventOnce(
  eventId: string,
  coupleId: string,
  input: EventInput,
  signal?: AbortSignal,
): Promise<EventItem> {
  const request = db().rpc('create_event_once', {
    event_id: eventId,
    space_id: coupleId,
    event_title: input.title,
    event_target_at: input.target_at,
    event_kind: input.kind,
    event_yearly: input.yearly,
    event_emoji: input.emoji,
    event_category: input.category || 'other',
  })
  return must(await (signal ? request.abortSignal(signal) : request)) as EventItem
}
export async function deleteEventOnce(
  eventId: string,
  coupleId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const request = db().rpc('delete_event_once', { event_id: eventId, space_id: coupleId })
  return must(await (signal ? request.abortSignal(signal) : request)) as boolean
}

export async function updateEventOnce(
  eventId: string,
  coupleId: string,
  input: EventInput,
  signal?: AbortSignal,
): Promise<EventItem> {
  const request = db().rpc('update_event_once', {
    event_id: eventId,
    space_id: coupleId,
    event_title: input.title,
    event_target_at: input.target_at,
    event_kind: input.kind,
    event_yearly: input.yearly,
    event_emoji: input.emoji,
    event_category: input.category || 'other',
  })
  return must(await (signal ? request.abortSignal(signal) : request)) as EventItem
}

function hasDefiniteServerFailure(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const value = error as { code?: unknown; status?: unknown }
  if (typeof value.code === 'string' && value.code.length > 0) return true
  const status = Number(value.status)
  return Number.isInteger(status) && status >= 400 && status < 500 && status !== 408
}

export async function uploadPhotoOnce(
  coupleId: string,
  userId: string,
  operationId: string,
  file: File,
  caption: string,
  memory: MemoryInput,
  signal?: AbortSignal,
): Promise<Photo> {
  validatePhoto(file)
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${coupleId}/${userId}/${operationId}.${ext}`
  const upload = db()
    .storage.from('couple-photos')
    .upload(path, file, { contentType: file.type, upsert: true })
  // Supabase Storage upload returns a promise without abortSignal in the current SDK; outer deadline still releases the queue, but late storage work may continue.
  const uploaded = await upload
  if (uploaded.error) throw uploaded.error
  const request = db().rpc('create_photo_once', {
    photo_id: operationId,
    space_id: coupleId,
    photo_path: path,
    photo_caption: caption,
    photo_occurred_on: memory.occurred_on,
    photo_story: memory.story,
    photo_event_id: memory.event_id,
    photo_message_id: memory.message_id,
  })
  try {
    return must(await (signal ? request.abortSignal(signal) : request)) as Photo
  } catch (error) {
    // A typed server rejection proves the metadata transaction did not commit;
    // clean up the object. Timeout/transport errors remain ambiguous and retain
    // the object for same-path retry so a committed row is not deleted.
    if (hasDefiniteServerFailure(error)) {
      const cleanup = await db().storage.from('couple-photos').remove([path])
      if (cleanup.error)
        throw new Error(`${errorText(error)}；清理未完成，请稍后重试：${errorText(cleanup.error)}`)
    }
    throw error
  }
}
