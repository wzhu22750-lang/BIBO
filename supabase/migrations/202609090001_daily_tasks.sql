begin;

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  task_date date not null,
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  task_type text not null check (task_type in ('interaction', 'photo', 'question', 'focus', 'memory', 'random')),
  created_at timestamptz not null default now(),
  unique (couple_id, task_date),
  unique (couple_id, id)
);

create index daily_tasks_couple_date on public.daily_tasks(couple_id, task_date desc);

create table public.daily_task_completions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  task_id uuid not null references public.daily_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  optional_content text not null default '' check (char_length(optional_content) <= 1000),
  unique (task_id, user_id),
  constraint fk_completion_couple_task foreign key (couple_id, task_id)
    references public.daily_tasks(couple_id, id) on delete cascade
);

create index daily_task_completions_task on public.daily_task_completions(task_id);
create index daily_task_completions_couple on public.daily_task_completions(couple_id, completed_at desc);

alter table public.daily_tasks enable row level security;
alter table public.daily_task_completions enable row level security;

revoke all on public.daily_tasks, public.daily_task_completions from anon, authenticated;
grant select, insert on public.daily_tasks to authenticated;
grant select, insert, update on public.daily_task_completions to authenticated;

create policy daily_tasks_read on public.daily_tasks for select to authenticated
  using (couple_id = (select public.my_couple_id()));

create policy daily_tasks_insert on public.daily_tasks for insert to authenticated
  with check (couple_id = (select public.my_couple_id()));

create policy daily_task_completions_read on public.daily_task_completions for select to authenticated
  using (couple_id = (select public.my_couple_id()));

create policy daily_task_completions_insert on public.daily_task_completions for insert to authenticated
  with check (
    couple_id = (select public.my_couple_id())
    and user_id = (select auth.uid())
  );

create policy daily_task_completions_update on public.daily_task_completions for update to authenticated
  using (
    couple_id = (select public.my_couple_id())
    and user_id = (select auth.uid())
  )
  with check (
    couple_id = (select public.my_couple_id())
    and user_id = (select auth.uid())
  );

-- Atomic ensure_daily_task RPC to handle concurrency perfectly
create function public.ensure_daily_task(
  p_date date,
  p_title text,
  p_description text default '',
  p_task_type text default 'interaction'
) returns public.daily_tasks
language plpgsql security definer set search_path = '' as $$
declare
  cid uuid := public.my_couple_id();
  v_task public.daily_tasks;
begin
  if cid is null then raise exception '请先绑定私人空间'; end if;
  if p_task_type not in ('interaction', 'photo', 'question', 'focus', 'memory', 'random') then
    raise exception '未知任务类型';
  end if;
  if char_length(btrim(p_title)) < 1 or char_length(btrim(p_title)) > 100 then
    raise exception '任务标题长度需在 1 到 100 字之间';
  end if;

  -- Check if task already exists
  select * into v_task from public.daily_tasks
    where couple_id = cid and task_date = p_date;
  if v_task.id is not null then
    return v_task;
  end if;

  -- Insert or return existing on conflict
  insert into public.daily_tasks (couple_id, task_date, title, description, task_type)
  values (cid, p_date, p_title, coalesce(p_description, ''), p_task_type)
  on conflict (couple_id, task_date)
  do update set title = public.daily_tasks.title
  returning * into v_task;

  return v_task;
end;
$$;

-- Atomic complete_daily_task RPC
create function public.complete_daily_task(
  p_task_id uuid,
  p_content text default ''
) returns public.daily_task_completions
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  cid uuid := public.my_couple_id();
  v_task public.daily_tasks;
  v_comp public.daily_task_completions;
begin
  if uid is null or cid is null then raise exception '请先绑定私人空间'; end if;
  select * into v_task from public.daily_tasks where id = p_task_id and couple_id = cid;
  if v_task.id is null then raise exception '任务不存在或无权限'; end if;

  insert into public.daily_task_completions (couple_id, task_id, user_id, optional_content)
  values (cid, p_task_id, uid, coalesce(p_content, ''))
  on conflict (task_id, user_id)
  do update set optional_content = excluded.optional_content, completed_at = now()
  returning * into v_comp;

  return v_comp;
end;
$$;

revoke all on function public.ensure_daily_task(date, text, text, text),
  public.complete_daily_task(uuid, text) from public, anon;
grant execute on function public.ensure_daily_task(date, text, text, text),
  public.complete_daily_task(uuid, text) to authenticated;

alter publication supabase_realtime add table public.daily_tasks, public.daily_task_completions;

commit;
