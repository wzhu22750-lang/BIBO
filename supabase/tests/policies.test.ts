import { PGlite } from '@electric-sql/pglite'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
let pg: PGlite
let legacyBefore: Record<string, unknown>
let legacyAfter: Record<string, unknown>
let legacyEvent: Record<string, unknown>
const A = '10000000-0000-0000-0000-000000000001'
const B = '10000000-0000-0000-0000-000000000002'
const C = '10000000-0000-0000-0000-000000000003'
const D = '10000000-0000-0000-0000-000000000004'
let code: string, couple: string, otherCouple: string
async function asUser(id: string) {
  await pg.exec(
    `reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false);`,
  )
}
async function scalar(sql: string, args: unknown[] = []) {
  const result = await pg.query<Record<string, unknown>>(sql, args)
  return Object.values(result.rows[0])[0]
}
beforeAll(async () => {
  pg = new PGlite()
  // Minimal Supabase system-schema stand-ins. This tests real PostgreSQL RLS,
  // not the hosted Auth/Realtime/Storage HTTP services.
  await pg.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(text) returns text[] language sql immutable as $$ select (string_to_array($1, '/'))[1:array_length(string_to_array($1, '/'),1)-1] $$;
    alter table storage.objects enable row level security;
    grant usage on schema auth, public, storage to authenticated, anon;
    grant select, insert, delete on storage.objects to authenticated;
    create publication supabase_realtime;
  `)
  await pg.exec(readFileSync('supabase/migrations/202609070001_initial.sql', 'utf8'))
  // Seed actual pre-upgrade rows before either additive migration.
  await pg.exec(`
    insert into auth.users values ('90000000-0000-0000-0000-000000000001');
    insert into public.couples(id, together_since) values ('90000000-0000-0000-0000-000000000002','2019-01-01');
    insert into public.events(id,couple_id,created_by,title,target_at,kind,yearly,emoji)
      values ('90000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000001','旧周年','2020-02-29T12:00:00Z','anniversary',true,'♥');
    insert into public.photos(id,couple_id,uploaded_by,path,caption,created_at)
      values ('90000000-0000-0000-0000-000000000004','90000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000002/90000000-0000-0000-0000-000000000001/old.jpg','旧照片','2020-03-01T12:00:00Z');
  `)
  legacyBefore = (await pg.query<Record<string, unknown>>('select * from public.photos')).rows[0]
  await pg.exec(readFileSync('supabase/migrations/202609080001_semantic_pings.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080002_shared_memories.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080003_message_outbox.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080004_message_history.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080005_photo_deletion.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080006_invitation_management.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080007_photo_history.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080008_relationship_lifecycle.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080009_account_deletion.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080010_device_push_tokens.sql', 'utf8'))
  await pg.exec(readFileSync('supabase/migrations/202609080011_event_outbox.sql', 'utf8'))
  legacyAfter = (await pg.query<Record<string, unknown>>('select * from public.photos')).rows[0]
  legacyEvent = (await pg.query<Record<string, unknown>>('select * from public.events')).rows[0]
  await pg.exec(
    "delete from public.couples where id='90000000-0000-0000-0000-000000000002'; delete from auth.users where id='90000000-0000-0000-0000-000000000001';",
  )
  await pg.query('insert into auth.users(id) values($1),($2),($3),($4)', [A, B, C, D])
}, 30000)
afterAll(async () => {
  await pg?.close()
})
describe.sequential('private two-player database boundary', () => {
  it('upgrades existing rows without inventing a memory date or rewriting original data', () => {
    expect(legacyAfter).toEqual({
      ...legacyBefore,
      occurred_on: null,
      story: '',
      event_id: null,
      message_id: null,
    })
    expect(legacyEvent.category).toBe('other')
    expect(legacyEvent.kind).toBe('anniversary')
    expect(legacyEvent.yearly).toBe(true)
    expect(new Date(legacyEvent.target_at as string).toISOString()).toBe('2020-02-29T12:00:00.000Z')
  })
  it('creates a profile and atomic private space', async () => {
    await asUser(A)
    code = (await scalar('select public.create_space()')) as string
    couple = (await scalar('select public.my_couple_id()')) as string
    expect(code).toMatch(/^[0-9a-f]{32}$/)
    expect(await scalar('select count(*)::int from public.profiles')).toBe(1)
  })
  it('denies direct membership changes and invite reads', async () => {
    await expect(
      pg.query('insert into public.couple_members values($1,$2,2)', [C, couple]),
    ).rejects.toThrow()
    await expect(pg.query('select * from public.invitations')).rejects.toThrow()
  })
  it('binds exactly one invited partner and consumes the invitation', async () => {
    await asUser(B)
    expect(await scalar('select public.join_space($1)', [code])).toBe(couple)
    expect(await scalar('select count(*)::int from public.profiles')).toBe(2)
    await asUser(C)
    await expect(pg.query('select public.join_space($1)', [code])).rejects.toThrow('邀请码无效')
    expect(await scalar('select count(*)::int from public.couple_members')).toBe(0)
  })
  it('prevents a second space and prevents inviting a third member', async () => {
    await asUser(A)
    await expect(pg.query('select public.create_space()')).rejects.toThrow('已经')
    await expect(pg.query('select public.refresh_invite()')).rejects.toThrow('两位')
  })
  it('isolates two spaces and prevents sender spoofing', async () => {
    await asUser(C)
    await pg.query('select public.create_space()')
    otherCouple = (await scalar('select public.my_couple_id()')) as string
    await asUser(A)
    await pg.query('insert into public.messages(couple_id,sender_id,content) values($1,$2,$3)', [
      couple,
      A,
      'private hello',
    ])
    await expect(
      pg.query('insert into public.messages(couple_id,sender_id,content) values($1,$2,$3)', [
        couple,
        B,
        'spoofed',
      ]),
    ).rejects.toThrow()
    await expect(
      pg.query('insert into public.messages(couple_id,sender_id,content) values($1,$2,$3)', [
        otherCouple,
        A,
        'cross space',
      ]),
    ).rejects.toThrow()
    await asUser(B)
    expect(await scalar('select count(*)::int from public.messages')).toBe(1)
    await asUser(C)
    expect(await scalar('select count(*)::int from public.messages')).toBe(0)
  })
  it('does not permit arbitrary created_at timestamps', async () => {
    await asUser(A)
    await expect(
      pg.query(
        'insert into public.messages(couple_id,sender_id,content,created_at) values($1,$2,$3,now())',
        [couple, A, 'forged timestamp'],
      ),
    ).rejects.toThrow()
  })
  it('keeps own profile writable and partner profile immutable', async () => {
    await asUser(A)
    expect(
      (
        await pg.query('update public.profiles set name=$1 where id=$2 returning id', [
          'changed',
          A,
        ])
      ).rows.length,
    ).toBe(1)
    expect(
      (await pg.query('update public.profiles set name=$1 where id=$2 returning id', ['forged', B]))
        .rows.length,
    ).toBe(0)
  })
  it('requires the other person to opt in to focus reminders', async () => {
    await asUser(A)
    await expect(pg.query("select public.send_ping('去学习')")).rejects.toThrow('尚未开启')
    await asUser(B)
    await pg.query(
      "insert into public.focus_sessions values($1,$2,'学习',now()+interval '25 minutes',false)",
      [B, couple],
    )
    await asUser(A)
    await expect(pg.query("select public.send_ping('哔卟哔卟')")).rejects.toThrow('未授权')
    expect(
      (
        await pg.query(
          'update public.focus_sessions set allow_reminders=true where user_id=$1 returning user_id',
          [B],
        )
      ).rows,
    ).toHaveLength(0)
    await asUser(B)
    await pg.query('update public.focus_sessions set allow_reminders=true where user_id=$1', [B])
    await asUser(A)
    expect(await scalar("select public.send_ping('去学习')")).toBeTypeOf('string')
  })
  it('rate limits repeated pings and disallows direct ping insertion', async () => {
    await asUser(A)
    await expect(pg.query("select public.send_ping('哔卟哔卟')")).rejects.toThrow('3 秒')
    await expect(
      pg.query("insert into public.pings(couple_id,sender_id,kind) values($1,$2,'哔卟哔卟')", [
        couple,
        A,
      ]),
    ).rejects.toThrow()
  })
  it('supports every love ping outside focus while preserving quiet focus and rate limits', async () => {
    await pg.exec('reset role; delete from public.pings; delete from public.focus_sessions;')
    for (const kind of ['哔卟哔卟', '想你', '抱一下', '快来', '晚安', '我回来啦']) {
      await asUser(A)
      expect(await scalar('select public.send_ping($1)', [kind])).toBeTypeOf('string')
      await expect(pg.query("select public.send_ping('想你')")).rejects.toThrow('3 秒')
      await pg.exec('reset role; delete from public.pings;')
    }
    await asUser(A)
    await expect(pg.query("select public.send_ping('unknown')")).rejects.toThrow('未知')
    await expect(pg.query('select public.send_ping(null)')).rejects.toThrow('未知')
    await expect(pg.query("select public.send_ping('去工作')")).rejects.toThrow('尚未开启')
    await asUser(B)
    await pg.query(
      "insert into public.focus_sessions values($1,$2,'休息',now()+interval '25 minutes',false)",
      [B, couple],
    )
    await asUser(A)
    await expect(pg.query("select public.send_ping('抱一下')")).rejects.toThrow('未授权')
  })
  it('keeps shared dates writable only inside the member space', async () => {
    await asUser(A)
    await pg.query(
      "insert into public.events(couple_id,created_by,title,target_at,kind,yearly,emoji) values($1,$2,'见面',now(),'countdown',false,'💛')",
      [couple, A],
    )
    await asUser(C)
    expect(await scalar('select count(*)::int from public.events')).toBe(0)
    expect((await pg.query('delete from public.events returning id')).rows).toHaveLength(0)
    await asUser(B)
    expect((await pg.query('delete from public.events returning id')).rows).toHaveLength(1)
  })
  it('keeps storage private and limits uploads to the current user folder', async () => {
    await asUser(A)
    await pg.query("insert into storage.objects(bucket_id,name) values('couple-photos',$1)", [
      `${couple}/${A}/photo.jpg`,
    ])
    await expect(
      pg.query("insert into storage.objects(bucket_id,name) values('couple-photos',$1)", [
        `${couple}/${B}/forged.jpg`,
      ]),
    ).rejects.toThrow()
    await asUser(B)
    expect(await scalar('select count(*)::int from storage.objects')).toBe(1)
    expect((await pg.query('delete from storage.objects returning id')).rows).toHaveLength(0)
    await asUser(C)
    expect(await scalar('select count(*)::int from storage.objects')).toBe(0)
    await expect(
      pg.query("insert into storage.objects(bucket_id,name) values('couple-photos',$1)", [
        `${couple}/${C}/cross.jpg`,
      ]),
    ).rejects.toThrow()
    await pg.exec('reset role')
    expect(await scalar("select public from storage.buckets where id='couple-photos'")).toBe(false)
  })
  it('invalidates refreshed and expired invitations', async () => {
    await asUser(C)
    const first = await scalar('select public.refresh_invite()')
    const second = await scalar('select public.refresh_invite()')
    await asUser(D)
    await expect(pg.query('select public.join_space($1)', [first])).rejects.toThrow('无效')
    await pg.exec('reset role')
    await pg.query(
      "update public.invitations set expires_at = now() - interval '1 minute' where couple_id = $1",
      [otherCouple],
    )
    await asUser(D)
    await expect(pg.query('select public.join_space($1)', [second])).rejects.toThrow('过期')
  })
  it('prevents anonymous RPC use and private table reads', async () => {
    await pg.exec('reset role; set role anon;')
    await expect(pg.query('select public.create_space()')).rejects.toThrow()
    await expect(pg.query('select * from public.messages')).rejects.toThrow()
  })
  it('enforces same-space memory links and uploader-only edits, preserving photos on event deletion', async () => {
    await asUser(A)
    const event = await scalar(
      "insert into public.events(couple_id,created_by,title,target_at,kind,category) values($1,$2,'旅行',now(),'countdown','travel') returning id",
      [couple, A],
    )
    const message = await scalar(
      "insert into public.messages(couple_id,sender_id,content) values($1,$2,'一起看海') returning id",
      [couple, A],
    )
    const photo = await scalar(
      "insert into public.photos(couple_id,uploaded_by,path,caption,occurred_on,story,event_id,message_id) values($1,$2,$3,'合照','2020-02-29','那天很开心',$4,$5) returning id",
      [couple, A, `${couple}/${A}/memory.jpg`, event, message],
    )
    await asUser(C)
    const foreignEvent = await scalar(
      "insert into public.events(couple_id,created_by,title,target_at,kind) values($1,$2,'别人的旅行',now(),'countdown') returning id",
      [otherCouple, C],
    )
    const foreignMessage = await scalar(
      "insert into public.messages(couple_id,sender_id,content) values($1,$2,'private') returning id",
      [otherCouple, C],
    )
    expect((await pg.query('select * from public.photos where id=$1', [photo])).rows).toHaveLength(
      0,
    )
    await asUser(A)
    await expect(
      pg.query('update public.photos set event_id=$1 where id=$2', [foreignEvent, photo]),
    ).rejects.toThrow()
    await expect(
      pg.query('update public.photos set message_id=$1 where id=$2', [foreignMessage, photo]),
    ).rejects.toThrow()
    await expect(
      pg.query("update public.photos set occurred_on='2025-02-30' where id=$1", [photo]),
    ).rejects.toThrow()
    await expect(
      pg.query('update public.photos set story=$1 where id=$2', ['x'.repeat(2001), photo]),
    ).rejects.toThrow()
    await expect(
      pg.query('update public.photos set uploaded_by=$1 where id=$2', [B, photo]),
    ).rejects.toThrow()
    expect(
      (
        await pg.query("update public.photos set story='新的故事' where id=$1 returning id", [
          photo,
        ])
      ).rows,
    ).toHaveLength(1)
    await asUser(B)
    expect(
      (
        await pg.query("update public.photos set story='不能代写' where id=$1 returning id", [
          photo,
        ])
      ).rows,
    ).toHaveLength(0)
    await pg.query('delete from public.events where id=$1', [event])
    const stored = (
      await pg.query<{ event_id: unknown; couple_id: string; story: string; message_id: string }>(
        'select * from public.photos where id=$1',
        [photo],
      )
    ).rows[0]
    expect(stored.event_id).toBeNull()
    expect(stored.couple_id).toBe(couple)
    expect(stored.story).toBe('新的故事')
    expect(stored.message_id).toBe(message)
  })
  it('idempotently confirms messages and refuses reuse, impersonation and other spaces', async () => {
    const id = '80000000-0000-0000-0000-000000000001'
    await asUser(A)
    const send = () =>
      pg.query('select * from public.send_message_once($1,$2,$3)', [id, couple, 'same text'])
    const first = (await send()).rows[0]
    expect((await send()).rows[0]).toEqual(first)
    expect(await scalar('select count(*)::int from public.messages where id=$1', [id])).toBe(1)
    await expect(
      pg.query('select public.send_message_once($1,$2,$3)', [id, couple, 'different']),
    ).rejects.toThrow('ID')
    await expect(
      pg.query('select public.send_message_once($1,$2,$3)', [id, otherCouple, 'same text']),
    ).rejects.toThrow('无法')
    await asUser(B)
    await expect(send()).rejects.toThrow('ID')
    await asUser(C)
    await expect(send()).rejects.toThrow('无法')
    await pg.exec('reset role; set role anon')
    await expect(send()).rejects.toThrow()
  })
  it('paginates equal-timestamp messages without gaps and applies RLS to history', async () => {
    await pg.exec('reset role')
    const at = '2001-01-01T00:00:00Z'
    for (let n = 1; n <= 105; n++)
      await pg.query(
        'insert into public.messages(id,couple_id,sender_id,content,created_at) values($1,$2,$3,$4,$5)',
        [`70000000-0000-0000-0000-${String(n).padStart(12, '0')}`, couple, A, `history ${n}`, at],
      )
    await asUser(A)
    const page = async (id: string, size = 50) =>
      (
        await pg.query<{ id: string }>('select * from public.message_history($1,$2,$3,$4)', [
          couple,
          at,
          id,
          size,
        ])
      ).rows
    const first = await page('70000000-0000-0000-0000-000000000106')
    const second = await page(first.at(-1)!.id)
    const third = await page(second.at(-1)!.id)
    expect([first.length, second.length, third.length]).toEqual([50, 50, 5])
    expect(new Set([...first, ...second, ...third].map((r) => r.id)).size).toBe(105)
    expect((await page('70000000-0000-0000-0000-000000000106', 1000)).length).toBe(100)
    await asUser(C)
    expect(await page('70000000-0000-0000-0000-000000000106')).toEqual([])
    await pg.exec('reset role; set role anon')
    await expect(page('70000000-0000-0000-0000-000000000106')).rejects.toThrow()
  })
  it('allows only the uploader to delete photo metadata without deleting linked content', async () => {
    await asUser(A)
    const event = await scalar(
      "insert into public.events(couple_id,created_by,title,target_at,kind) values($1,$2,'keep event',now(),'countdown') returning id",
      [couple, A],
    )
    const photo = await scalar(
      "insert into public.photos(couple_id,uploaded_by,path,caption,event_id) values($1,$2,$3,'delete me',$4) returning id",
      [couple, A, `${couple}/${A}/delete-test.jpg`, event],
    )
    expect(
      (await pg.query('select * from public.photo_deletion_target($1,$2)', [photo, couple])).rows,
    ).toHaveLength(1)
    await asUser(B)
    expect(
      (await pg.query('select * from public.photo_deletion_target($1,$2)', [photo, couple])).rows,
    ).toHaveLength(0)
    expect(
      (await pg.query('delete from public.photos where id=$1 returning id', [photo])).rows,
    ).toHaveLength(0)
    await asUser(C)
    expect(
      (await pg.query('delete from public.photos where id=$1 returning id', [photo])).rows,
    ).toHaveLength(0)
    await asUser(A)
    expect(
      (await pg.query('delete from public.photos where id=$1 returning id', [photo])).rows,
    ).toHaveLength(1)
    expect(await scalar('select count(*)::int from public.events where id=$1', [event])).toBe(1)
  })
  it('reports only current-space invite expiry, revokes old codes and permits new invitations', async () => {
    await asUser(C)
    const old = await scalar('select public.refresh_invite()')
    const status = (await pg.query('select * from public.invitation_status()')).rows[0]
    expect(status.active).toBe(true)
    expect(Object.keys(status).sort()).toEqual(['active', 'expires_at'])
    await asUser(A)
    expect((await pg.query('select * from public.invitation_status()')).rows).toHaveLength(0)
    await asUser(C)
    expect(await scalar('select public.revoke_invitation()')).toBe(true)
    expect(await scalar('select public.revoke_invitation()')).toBe(true)
    expect((await pg.query('select * from public.invitation_status()')).rows).toHaveLength(0)
    await asUser(D)
    await expect(pg.query('select public.join_space($1)', [old])).rejects.toThrow('无效')
    await expect(pg.query('select public.revoke_invitation()')).rejects.toThrow('空间')
    await asUser(C)
    const fresh = await scalar('select public.refresh_invite()')
    await asUser(D)
    expect(await scalar('select public.join_space($1)', [fresh])).toBe(otherCouple)
    await asUser(C)
    expect((await pg.query('select * from public.invitation_status()')).rows).toHaveLength(0)
    expect(await scalar('select public.revoke_invitation()')).toBe(true)
    expect(await scalar('select count(*)::int from public.couple_members')).toBe(2)
    await pg.exec('reset role; set role anon')
    await expect(pg.query('select public.revoke_invitation()')).rejects.toThrow()
    await expect(pg.query('select * from public.invitation_status()')).rejects.toThrow()
  })
  it('pages all matching event photos with stable cursor and excludes other spaces', async () => {
    await asUser(A)
    const event = await scalar(
      "insert into public.events(couple_id,created_by,title,target_at,kind) values($1,$2,'paged photos',now(),'countdown') returning id",
      [couple, A],
    )
    const at = '2002-01-01T00:00:00Z'
    await pg.exec('reset role')
    for (let n = 1; n <= 65; n++)
      await pg.query(
        'insert into public.photos(id,couple_id,uploaded_by,path,caption,created_at,event_id) values($1,$2,$3,$4,$5,$6,$7)',
        [
          `60000000-0000-0000-0000-${String(n).padStart(12, '0')}`,
          couple,
          A,
          `${couple}/${A}/page-${n}.jpg`,
          `photo ${n}`,
          at,
          event,
        ],
      )
    await asUser(A)
    const fetch = async (before: string | null) =>
      (
        await pg.query<{ id: string; created_at: string }>(
          'select * from public.photo_history($1,$2,$3,$4)',
          [couple, before ? at : null, before, event],
        )
      ).rows
    const first = await fetch(null)
    expect(first).toHaveLength(31)
    const second = await fetch(first[29].id)
    expect(second).toHaveLength(31)
    const third = await fetch(second[29].id)
    expect(third).toHaveLength(5)
    expect(
      new Set([...first.slice(0, 30), ...second.slice(0, 30), ...third].map((p) => p.id)).size,
    ).toBe(65)
    await asUser(C)
    expect(await fetch(null)).toEqual([])
    await pg.exec('reset role; set role anon')
    await expect(fetch(null)).rejects.toThrow()
  })
  it('seals a relationship, revokes both members, and keeps old data out of new bindings', async () => {
    await asUser(A)
    await expect(pg.query('select public.close_relationship($1)', [otherCouple])).rejects.toThrow(
      '空间',
    )
    const count = await scalar('select count(*)::int from public.messages')
    expect(Number(count)).toBeGreaterThan(0)
    expect(await scalar('select public.close_relationship($1)', [couple])).toBe(couple)
    expect(await scalar('select public.my_couple_id()')).toBeNull()
    expect(await scalar('select count(*)::int from public.messages')).toBe(0)
    await asUser(B)
    expect(await scalar('select public.my_couple_id()')).toBeNull()
    expect(await scalar('select count(*)::int from public.photos')).toBe(0)
    await expect(pg.query("select public.send_ping('想你')")).rejects.toThrow()
    const newCode = await scalar('select public.create_space()')
    const next = await scalar('select public.my_couple_id()')
    expect(next).not.toBe(couple)
    await asUser(A)
    expect(await scalar('select public.join_space($1)', [newCode])).toBe(next)
    expect(await scalar('select count(*)::int from public.messages')).toBe(0)
    await expect(pg.query('select public.close_relationship($1)', [couple])).rejects.toThrow('空间')
    await pg.exec('reset role')
    expect(
      await scalar('select closed_at is not null from public.couples where id=$1', [couple]),
    ).toBe(true)
    expect(
      await scalar('select count(*)::int from public.messages where couple_id=$1', [couple]),
    ).toBe(count)
    expect(
      await scalar('select count(*)::int from public.invitations where couple_id=$1', [couple]),
    ).toBe(0)
    await expect(
      pg.query('update public.couple_members set couple_id=$1 where user_id=$2', [couple, A]),
    ).rejects.toThrow('封存')
    await pg.exec('set role anon')
    await expect(pg.query('select public.close_relationship($1)', [next])).rejects.toThrow()
  })
  it('creates and deletes events idempotently through the server boundary', async () => {
    await asUser(C)
    const id = '50000000-0000-4000-8000-000000000001'
    const input = ['同一份期待', '2030-01-02T03:04:05Z', 'countdown', false, 'icon:heart', 'date']
    const first = (
      await pg.query('select * from public.create_event_once($1,$2,$3,$4,$5,$6,$7,$8)', [
        id,
        otherCouple,
        ...input,
      ])
    ).rows[0]
    const second = (
      await pg.query('select * from public.create_event_once($1,$2,$3,$4,$5,$6,$7,$8)', [
        id,
        otherCouple,
        ...input,
      ])
    ).rows[0]
    expect(second).toEqual(first)
    await expect(
      pg.query('select * from public.create_event_once($1,$2,$3,$4,$5,$6,$7,$8)', [
        id,
        otherCouple,
        'tampered',
        ...input.slice(1),
      ]),
    ).rejects.toThrow('ID')
    await asUser(D)
    expect(await scalar('select public.delete_event_once($1,$2)', [id, otherCouple])).toBe(true)
    expect(await scalar('select count(*)::int from public.events where id=$1', [id])).toBe(0)
    expect(await scalar('select public.delete_event_once($1,$2)', [id, otherCouple])).toBe(true)
    await asUser(A)
    await expect(
      pg.query('select public.create_event_once($1,$2,$3,$4,$5,$6,$7,$8)', [
        id,
        otherCouple,
        ...input,
      ]),
    ).rejects.toThrow('空间')
    await pg.exec('reset role; set role anon')
    await expect(
      pg.query('select public.delete_event_once($1,$2)', [id, otherCouple]),
    ).rejects.toThrow()
  })
  it('isolates device Push tokens to the owning account and cascades them on deletion', async () => {
    await asUser(D)
    const token = 'fcm-token-for-user-d-0000000001'
    const row = await scalar(
      "insert into public.device_installations(user_id,platform,token,app_version) values($1,'android',$2,'test') returning id",
      [D, token],
    )
    expect(row).toBeTypeOf('string')
    await asUser(C)
    expect(await scalar('select count(*)::int from public.device_installations')).toBe(0)
    expect(
      (await pg.query('delete from public.device_installations where id=$1 returning id', [row]))
        .rows,
    ).toHaveLength(0)
    await asUser(D)
    expect(
      (
        await pg.query(
          'update public.device_installations set app_version=$1 where id=$2 returning id',
          ['new', row],
        )
      ).rows,
    ).toHaveLength(1)
    await pg.exec('reset role; set role anon')
    await expect(pg.query('select * from public.device_installations')).rejects.toThrow()
    await pg.exec('reset role')
    await pg.query('delete from auth.users where id=$1', [D])
    expect(
      await scalar('select count(*)::int from public.device_installations where id=$1', [row]),
    ).toBe(0)
  })
  it('prepares account deletion atomically, anonymizes shared authorship, and is idempotent', async () => {
    await asUser(A)
    const current = (await scalar('select public.my_couple_id()')) as string
    const message = await scalar(
      "insert into public.messages(couple_id,sender_id,content) values($1,$2,'保留的共同话语') returning id",
      [current, A],
    )
    const event = await scalar(
      "insert into public.events(couple_id,created_by,title,target_at,kind) values($1,$2,'保留的期待',now(),'countdown') returning id",
      [current, A],
    )
    const photo = await scalar(
      "insert into public.photos(couple_id,uploaded_by,path,caption) values($1,$2,$3,'匿名后的回忆') returning id",
      [current, A, `${current}/${A}/account-delete.jpg`],
    )
    const first = await scalar('select public.prepare_account_deletion($1)', [current])
    expect(first).toBeTypeOf('string')
    expect(await scalar('select public.prepare_account_deletion($1)', [current])).toBe(first)
    await expect(
      pg.query('select public.prepare_account_deletion($1)', [otherCouple]),
    ).rejects.toThrow('空间')
    expect(await scalar('select public.my_couple_id()')).toBeNull()
    await asUser(B)
    expect(
      await scalar('select count(*)::int from public.messages where id=$1 and sender_id is null', [
        message,
      ]),
    ).toBe(1)
    expect(
      await scalar('select count(*)::int from public.events where id=$1 and created_by is null', [
        event,
      ]),
    ).toBe(1)
    expect(
      await scalar('select count(*)::int from public.photos where id=$1 and uploaded_by is null', [
        photo,
      ]),
    ).toBe(1)
    await pg.exec('reset role')
    expect(
      await scalar('select count(*)::int from public.account_deletion_jobs where id=$1', [first]),
    ).toBe(1)
    const jobPaths = (
      await pg.query<{ storage_paths: string }>(
        'select storage_paths::text from public.account_deletion_jobs where id=$1',
        [first],
      )
    ).rows[0].storage_paths
    expect(JSON.parse(jobPaths)).toContain(`${current}/${A}/account-delete.jpg`)
    expect(
      await scalar('select count(*)::int from public.couple_members where couple_id=$1', [current]),
    ).toBe(1)
    expect(
      await scalar('select closed_at is null from public.couples where id=$1', [current]),
    ).toBe(true)
    await pg.query('delete from auth.users where id=$1', [A])
    expect(await scalar('select count(*)::int from public.profiles where id=$1', [A])).toBe(0)
    expect(
      await scalar('select count(*)::int from public.account_deletion_jobs where id=$1', [first]),
    ).toBe(0)
    expect(
      await scalar('select count(*)::int from public.messages where id=$1 and sender_id is null', [
        message,
      ]),
    ).toBe(1)
    await pg.exec('set role anon')
    await expect(
      pg.query('select public.prepare_account_deletion($1)', [current]),
    ).rejects.toThrow()
  })
})
