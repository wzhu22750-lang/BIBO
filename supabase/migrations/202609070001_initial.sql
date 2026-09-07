-- BIBU MVP. Apply once using Supabase SQL Editor or `supabase db push`.
-- Private-by-default: membership changes only happen inside authenticated RPCs.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '新玩家' check (char_length(name) between 1 and 24),
  avatar text not null default 'cat' check (avatar in ('dog', 'cat', 'bunny', 'bear', 'panda', 'fox', 'penguin', 'duck', 'frog', 'hamster', 'chick', 'koala'))
);
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default '我们的小宇宙' check (char_length(name) between 1 and 60),
  together_since date not null default current_date,
  created_at timestamptz not null default now()
);
create table public.couple_members (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  slot smallint not null check (slot in (1, 2)),
  unique (couple_id, slot)
);
create table public.invitations (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '24 hours')
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index messages_couple_time on public.messages(couple_id, created_at desc);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(btrim(title)) between 1 and 60),
  target_at timestamptz not null,
  kind text not null check (kind in ('anniversary', 'countdown')),
  yearly boolean not null default false,
  emoji text not null default '♥' check (char_length(emoji) between 1 and 16),
  check (kind = 'anniversary' or not yearly)
);
create index events_couple on public.events(couple_id);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  path text not null unique,
  caption text not null default '' check (char_length(caption) <= 120),
  created_at timestamptz not null default now(),
  check (path like couple_id::text || '/' || uploaded_by::text || '/%')
);
create index photos_couple_time on public.photos(couple_id, created_at desc);
create table public.focus_sessions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  activity text not null check (char_length(activity) between 1 and 40),
  ends_at timestamptz not null,
  allow_reminders boolean not null default false
);
create index focus_couple on public.focus_sessions(couple_id);
create table public.pings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  kind text not null check (kind in ('哔卟哔卟', '去学习', '去工作', '休息一下')),
  created_at timestamptz not null default now()
);
create index pings_sender_time on public.pings(sender_id, created_at desc);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name) values (new.id, '新玩家');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
-- Also supports projects with existing Auth users.
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

create function public.my_couple_id() returns uuid language sql stable security definer set search_path = '' as $$
  select couple_id from public.couple_members where user_id = (select auth.uid());
$$;

create function public.create_space() returns text language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid; code text;
begin
  if uid is null then raise exception '请先登录'; end if;
  perform 1 from public.profiles where id = uid for update;
  if exists (select 1 from public.couple_members where user_id = uid) then raise exception '你已经有私人空间了'; end if;
  insert into public.couples default values returning id into cid;
  insert into public.couple_members values(uid, cid, 1);
  code := replace(gen_random_uuid()::text, '-', '');
  insert into public.invitations(couple_id, code_hash) values (cid, encode(sha256(convert_to(code, 'UTF8')), 'hex'));
  return code;
end;
$$;
create function public.refresh_invite() returns text language plpgsql security definer set search_path = '' as $$
declare cid uuid := public.my_couple_id(); code text;
begin
  if cid is null then raise exception '请先创建空间'; end if;
  perform 1 from public.couples where id = cid for update;
  if (select count(*) from public.couple_members where couple_id = cid) >= 2 then raise exception '空间已经有两位玩家'; end if;
  code := replace(gen_random_uuid()::text, '-', '');
  insert into public.invitations(couple_id, code_hash) values(cid, encode(sha256(convert_to(code, 'UTF8')), 'hex'))
  on conflict(couple_id) do update set code_hash = excluded.code_hash, expires_at = now() + interval '24 hours';
  return code;
end;
$$;
create function public.join_space(invite_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid;
begin
  if uid is null then raise exception '请先登录'; end if;
  perform 1 from public.profiles where id = uid for update;
  if exists(select 1 from public.couple_members where user_id = uid) then raise exception '你已经绑定了一个空间'; end if;
  select couple_id into cid from public.invitations
    where code_hash = encode(sha256(convert_to(lower(btrim(invite_code)), 'UTF8')), 'hex') and expires_at > now();
  if cid is null then raise exception '邀请码无效或已过期'; end if;
  -- Lock the space, then recheck the invitation after acquiring the lock.
  perform 1 from public.couples where id = cid for update;
  if not exists(select 1 from public.invitations where couple_id = cid and code_hash = encode(sha256(convert_to(lower(btrim(invite_code)), 'UTF8')), 'hex') and expires_at > now())
    then raise exception '邀请码无效或已过期'; end if;
  if (select count(*) from public.couple_members where couple_id = cid) >= 2 then raise exception '空间已满'; end if;
  insert into public.couple_members values(uid, cid, 2);
  update public.profiles set avatar = 'bunny' where id = uid;
  delete from public.invitations where couple_id = cid;
  return cid;
end;
$$;
create function public.send_ping(ping_kind text default '哔卟哔卟') returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid := public.my_couple_id(); other_uid uuid; active_focus public.focus_sessions; pid uuid;
begin
  if cid is null then raise exception '请先绑定私人空间'; end if;
  if ping_kind not in ('哔卟哔卟', '去学习', '去工作', '休息一下') then raise exception '未知提醒类型'; end if;
  perform 1 from public.couples where id = cid for update;
  select user_id into other_uid from public.couple_members where couple_id = cid and user_id <> uid;
  if other_uid is null then raise exception '等待另一位玩家加入后再发送吧'; end if;
  if exists(select 1 from public.pings where sender_id = uid and created_at > now() - interval '3 seconds') then raise exception '慢一点，3 秒后再哔卟'; end if;
  select * into active_focus from public.focus_sessions where user_id = other_uid and ends_at > now();
  if active_focus.user_id is not null and not active_focus.allow_reminders then raise exception '对方正在专注，未授权提醒'; end if;
  if ping_kind <> '哔卟哔卟' and (active_focus.user_id is null or not active_focus.allow_reminders) then raise exception '对方尚未开启并授权专注提醒'; end if;
  insert into public.pings(couple_id, sender_id, kind) values(cid, uid, ping_kind) returning id into pid;
  return pid;
end;
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.invitations enable row level security;
alter table public.messages enable row level security;
alter table public.events enable row level security;
alter table public.photos enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.pings enable row level security;

-- Explicit grants: no direct membership/invitation/ping writes, even if project defaults grant too much.
revoke all on public.profiles, public.couples, public.couple_members, public.invitations, public.messages, public.events, public.photos, public.focus_sessions, public.pings from anon, authenticated;
grant select on public.profiles, public.couples, public.couple_members, public.messages, public.events, public.photos, public.focus_sessions, public.pings to authenticated;
grant update(name, avatar) on public.profiles to authenticated;
grant update(name, together_since) on public.couples to authenticated;
grant insert(couple_id, sender_id, content) on public.messages to authenticated;
grant insert(couple_id, created_by, title, target_at, kind, yearly, emoji), delete on public.events to authenticated;
grant insert(couple_id, uploaded_by, path, caption) on public.photos to authenticated;
grant insert, update, delete on public.focus_sessions to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (
  id = (select auth.uid()) or id in (select user_id from public.couple_members where couple_id = (select public.my_couple_id()))
);
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy couples_read on public.couples for select to authenticated using (id = (select public.my_couple_id()));
create policy couples_update on public.couples for update to authenticated using (id = (select public.my_couple_id())) with check (id = (select public.my_couple_id()));
create policy members_read on public.couple_members for select to authenticated using (couple_id = (select public.my_couple_id()));
create policy messages_read on public.messages for select to authenticated using (couple_id = (select public.my_couple_id()));
create policy messages_insert on public.messages for insert to authenticated with check (couple_id = (select public.my_couple_id()) and sender_id = (select auth.uid()));
create policy events_read on public.events for select to authenticated using (couple_id = (select public.my_couple_id()));
create policy events_insert on public.events for insert to authenticated with check (couple_id = (select public.my_couple_id()) and created_by = (select auth.uid()));
create policy events_delete on public.events for delete to authenticated using (couple_id = (select public.my_couple_id()));
create policy photos_read on public.photos for select to authenticated using (couple_id = (select public.my_couple_id()));
create policy photos_insert on public.photos for insert to authenticated with check (couple_id = (select public.my_couple_id()) and uploaded_by = (select auth.uid()));
create policy focus_read on public.focus_sessions for select to authenticated using (couple_id = (select public.my_couple_id()));
create policy focus_insert on public.focus_sessions for insert to authenticated with check (couple_id = (select public.my_couple_id()) and user_id = (select auth.uid()) and ends_at <= now() + interval '180 minutes');
create policy focus_update on public.focus_sessions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and couple_id = (select public.my_couple_id()) and ends_at <= now() + interval '180 minutes');
create policy focus_delete on public.focus_sessions for delete to authenticated using (user_id = (select auth.uid()));
create policy pings_read on public.pings for select to authenticated using (couple_id = (select public.my_couple_id()));

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.my_couple_id(), public.create_space(), public.refresh_invite(), public.join_space(text), public.send_ping(text) from public, anon;
grant execute on function public.my_couple_id(), public.create_space(), public.refresh_invite(), public.join_space(text), public.send_ping(text) to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values('couple-photos', 'couple-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);
create policy couple_photo_read on storage.objects for select to authenticated using (
  bucket_id = 'couple-photos' and (storage.foldername(name))[1] = (select public.my_couple_id())::text
);
create policy couple_photo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'couple-photos' and (storage.foldername(name))[1] = (select public.my_couple_id())::text
  and (storage.foldername(name))[2] = (select auth.uid())::text
);
-- Cleanup permission is restricted to one's own uploads.
create policy couple_photo_delete on storage.objects for delete to authenticated using (
  bucket_id = 'couple-photos' and (storage.foldername(name))[1] = (select public.my_couple_id())::text
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

alter publication supabase_realtime add table public.messages, public.events, public.photos, public.focus_sessions, public.pings, public.couple_members, public.couples, public.profiles;
