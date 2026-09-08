begin;
alter table public.couples add column closed_at timestamptz;
create function public.close_relationship(expected_space uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid;
begin
 if uid is null or expected_space is null then raise exception '请先登录并确认空间' using errcode='42501'; end if;
 -- Serialize with create/join for this account, and invite/join/Ping for this space.
 perform 1 from public.profiles where id=uid for update;
 select couple_id into cid from public.couple_members where user_id=uid;
 if cid is distinct from expected_space then raise exception '空间已变化，请刷新后确认' using errcode='42501'; end if;
 perform 1 from public.couples where id=cid for update;
 if not exists(select 1 from public.couple_members where user_id=uid and couple_id=cid) then
  raise exception '成员关系已变化' using errcode='42501';
 end if;
 update public.couples set closed_at=now() where id=cid;
 delete from public.invitations where couple_id=cid;
 delete from public.focus_sessions where couple_id=cid;
 delete from public.couple_members where couple_id=cid;
 return cid;
end;
$$;
revoke all on function public.close_relationship(uuid) from public,anon;
grant execute on function public.close_relationship(uuid) to authenticated;
-- Defense against any future privileged membership writer accidentally reopening a sealed space.
create function public.reject_closed_membership() returns trigger language plpgsql set search_path = '' as $$
begin
 if exists(select 1 from public.couples where id=new.couple_id and closed_at is not null) then
  raise exception '旧空间已经封存，不能重新加入' using errcode='23514';
 end if;
 return new;
end;
$$;
create trigger membership_closed_guard before insert or update on public.couple_members
for each row execute function public.reject_closed_membership();
commit;
