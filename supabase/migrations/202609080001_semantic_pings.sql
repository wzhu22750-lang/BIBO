-- Preserve all old rows and existing RPC grants / RLS.
begin;
alter table public.pings drop constraint pings_kind_check;
alter table public.pings add constraint pings_kind_check check (kind in ('哔卟哔卟', '去学习', '去工作', '休息一下', '想你', '抱一下', '快来', '晚安', '我回来啦'));
create or replace function public.send_ping(ping_kind text default '哔卟哔卟') returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid := public.my_couple_id(); other_uid uuid; active_focus public.focus_sessions; pid uuid;
begin
  if cid is null then raise exception '请先绑定私人空间'; end if;
  if ping_kind is null or ping_kind not in ('哔卟哔卟', '去学习', '去工作', '休息一下', '想你', '抱一下', '快来', '晚安', '我回来啦') then raise exception '未知提醒类型'; end if;
  perform 1 from public.couples where id = cid for update;
  select user_id into other_uid from public.couple_members where couple_id = cid and user_id <> uid;
  if other_uid is null then raise exception '等待另一位玩家加入后再发送吧'; end if;
  if exists(select 1 from public.pings where sender_id = uid and created_at > now() - interval '3 seconds') then raise exception '慢一点，3 秒后再哔卟'; end if;
  select * into active_focus from public.focus_sessions where user_id = other_uid and ends_at > now();
  if active_focus.user_id is not null and not active_focus.allow_reminders then raise exception '对方正在专注，未授权提醒'; end if;
  if ping_kind in ('去学习', '去工作', '休息一下') and (active_focus.user_id is null or not active_focus.allow_reminders) then raise exception '对方尚未开启并授权专注提醒'; end if;
  insert into public.pings(couple_id, sender_id, kind) values(cid, uid, ping_kind) returning id into pid;
  return pid;
end;
$$;

create index pings_couple_time on public.pings(couple_id, created_at desc, id desc);
commit;
