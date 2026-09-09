-- Serialize focus consent changes with send_ping's couple-row lock and force
-- photo metadata writes through the fixed-ID/idempotent RPC.
begin;

revoke insert on public.photos from authenticated;

revoke insert, update, delete on public.focus_sessions from authenticated;

create or replace function public.set_focus_session(
  space_id uuid,
  focus_activity text,
  duration_minutes integer,
  reminders_allowed boolean
) returns public.focus_sessions
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cid uuid := public.my_couple_id();
  row public.focus_sessions;
begin
  if uid is null or cid is null or space_id is distinct from cid then
    raise exception '当前账号无法修改这个空间的专注' using errcode = '42501';
  end if;
  if focus_activity is null or char_length(btrim(focus_activity)) not between 1 and 40 then
    raise exception '专注内容需为 1–40 字' using errcode = '22023';
  end if;
  if duration_minutes is null or duration_minutes not between 1 and 180 then
    raise exception '专注时长需为 1–180 分钟' using errcode = '22023';
  end if;

  -- send_ping takes the same lock before reading consent. This makes a focus
  -- change and a Ping authorization decision linearizable per couple.
  perform 1 from public.couples where id = cid for update;
  insert into public.focus_sessions(user_id, couple_id, activity, ends_at, allow_reminders)
    values(uid, cid, btrim(focus_activity), now() + duration_minutes * interval '1 minute', coalesce(reminders_allowed, false))
    on conflict(user_id) do update set
      couple_id = excluded.couple_id,
      activity = excluded.activity,
      ends_at = excluded.ends_at,
      allow_reminders = excluded.allow_reminders
    returning * into row;
  return row;
end;
$$;

create or replace function public.end_focus_session(space_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cid uuid := public.my_couple_id();
  affected integer;
begin
  if uid is null or cid is null or space_id is distinct from cid then
    raise exception '当前账号无法结束这个空间的专注' using errcode = '42501';
  end if;
  perform 1 from public.couples where id = cid for update;
  delete from public.focus_sessions where user_id = uid and couple_id = cid;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.set_focus_session(uuid, text, integer, boolean) from public, anon;
revoke all on function public.end_focus_session(uuid) from public, anon;
grant execute on function public.set_focus_session(uuid, text, integer, boolean), public.end_focus_session(uuid) to authenticated;

-- Existing rows created by the initial migration use these defaults, but an
-- ordered upgrade must still apply the constraints to the already-existing
-- columns. Fail explicitly rather than silently truncating user copy.
update public.couples
set greeting_title = '今天也喜欢你，多一点'
where greeting_title is null;
update public.couples
set greeting_subtitle = '生活不是每天都浪漫，但每天都有你。'
where greeting_subtitle is null;

do $$
begin
  if exists (select 1 from public.couples where char_length(greeting_title) not between 1 and 40)
    then raise exception '已有 couples.greeting_title 不满足 1–40 字约束';
  end if;
  if exists (select 1 from public.couples where char_length(greeting_subtitle) not between 1 and 100)
    then raise exception '已有 couples.greeting_subtitle 不满足 1–100 字约束';
  end if;
end;
$$;

alter table public.couples
  alter column greeting_title set default '今天也喜欢你，多一点',
  alter column greeting_title set not null,
  alter column greeting_subtitle set default '生活不是每天都浪漫，但每天都有你。',
  alter column greeting_subtitle set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'couples_greeting_title_length') then
    alter table public.couples add constraint couples_greeting_title_length
      check (char_length(greeting_title) between 1 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'couples_greeting_subtitle_length') then
    alter table public.couples add constraint couples_greeting_subtitle_length
      check (char_length(greeting_subtitle) between 1 and 100);
  end if;
end;
$$;

commit;
