import { PGlite } from '@electric-sql/pglite'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
let pg: PGlite
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
  await pg.query('insert into auth.users(id) values($1),($2),($3),($4)', [A, B, C, D])
}, 30000)
afterAll(async () => {
  await pg?.close()
})
describe.sequential('private two-player database boundary', () => {
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
})
