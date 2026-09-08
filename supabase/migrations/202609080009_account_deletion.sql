-- Account deletion is two-phase: the caller-scoped RPC anonymizes relational ownership;
-- a trusted Edge Function removes private Storage objects and auth.users.
begin;

create table public.account_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expected_space uuid,
  storage_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(storage_paths) = 'array'),
  status text not null default 'prepared' check (status in ('prepared')),
  prepared_at timestamptz not null default now()
);
create unique index account_deletion_one_pending on public.account_deletion_jobs(user_id) where status='prepared';
alter table public.account_deletion_jobs enable row level security;
revoke all on public.account_deletion_jobs from public, anon, authenticated;

alter table public.messages alter column sender_id drop not null;
alter table public.events alter column created_by drop not null;
alter table public.photos alter column uploaded_by drop not null;
alter table public.pings alter column sender_id drop not null;

alter table public.messages drop constraint if exists messages_sender_id_fkey;
alter table public.messages add constraint messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete set null;
alter table public.events drop constraint if exists events_created_by_fkey;
alter table public.events add constraint events_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.photos drop constraint if exists photos_uploaded_by_fkey;
alter table public.photos add constraint photos_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles(id) on delete set null;
alter table public.pings drop constraint if exists pings_sender_id_fkey;
alter table public.pings add constraint pings_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete set null;

create function public.prepare_account_deletion(p_expected_space uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid; job_id uuid; job_space uuid; paths jsonb;
begin
  if uid is null then raise exception '请先登录' using errcode='42501'; end if;
  perform 1 from public.profiles where id=uid for update;
  -- A retry after Storage/admin failure must reuse the same captured paths.
  select id, expected_space into job_id, job_space from public.account_deletion_jobs where user_id=uid and status='prepared' for update;
  if job_id is not null then
    if p_expected_space is not null and p_expected_space is distinct from job_space then raise exception '空间已变化，请刷新后确认' using errcode='42501'; end if;
    return job_id;
  end if;
  select couple_id into cid from public.couple_members where user_id=uid;
  if p_expected_space is not null and cid is distinct from p_expected_space then
    raise exception '空间已变化，请刷新后确认' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(path), '[]'::jsonb) into paths from public.photos where uploaded_by=uid;
  insert into public.account_deletion_jobs(user_id,expected_space,storage_paths)
    values(uid,cid,paths) returning id into job_id;
  if cid is not null then
    perform 1 from public.couples where id=cid for update;
    delete from public.focus_sessions where user_id=uid;
    delete from public.couple_members where user_id=uid;
    if not exists(select 1 from public.couple_members where couple_id=cid) then
      update public.couples set closed_at=coalesce(closed_at,now()) where id=cid;
      delete from public.invitations where couple_id=cid;
    end if;
  end if;
  update public.messages set sender_id=null where sender_id=uid;
  update public.events set created_by=null where created_by=uid;
  update public.photos set uploaded_by=null where uploaded_by=uid;
  update public.pings set sender_id=null where sender_id=uid;
  return job_id;
end;
$$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon;
grant execute on function public.prepare_account_deletion(uuid) to authenticated;
commit;
