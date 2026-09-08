begin;
create table public.device_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('android')),
  token text not null unique check (char_length(token) between 20 and 4096),
  app_version text not null default 'unknown' check (char_length(app_version) between 1 and 40),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index device_installations_user on public.device_installations(user_id, last_seen_at desc);
alter table public.device_installations enable row level security;
revoke all on public.device_installations from anon, authenticated;
grant select, insert, update, delete on public.device_installations to authenticated;
create policy device_installations_read on public.device_installations for select to authenticated using (user_id=(select auth.uid()));
create policy device_installations_insert on public.device_installations for insert to authenticated with check (user_id=(select auth.uid()));
create policy device_installations_update on public.device_installations for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy device_installations_delete on public.device_installations for delete to authenticated using (user_id=(select auth.uid()));
commit;
