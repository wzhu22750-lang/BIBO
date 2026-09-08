-- Close the relationship after account deletion without removing the surviving member.
-- This additive migration patches deployments that already applied 009: shared history
-- remains readable by the surviving member, but the old couple can never be rebound.
begin;

create or replace function public.join_space(invite_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); cid uuid;
begin
  if uid is null then raise exception '请先登录'; end if;
  perform 1 from public.profiles where id = uid for update;
  if exists(select 1 from public.couple_members where user_id = uid) then raise exception '你已经绑定了一个空间'; end if;
  select couple_id into cid from public.invitations
    where code_hash = encode(sha256(convert_to(lower(btrim(invite_code)), 'UTF8')), 'hex') and expires_at > now();
  if cid is null then raise exception '邀请码无效或已过期'; end if;
  perform 1 from public.couples where id = cid for update;
  if exists(select 1 from public.couples where id = cid and closed_at is not null) then
    raise exception '空间已经封存，不能加入' using errcode='42501';
  end if;
  if not exists(select 1 from public.invitations where couple_id = cid and code_hash = encode(sha256(convert_to(lower(btrim(invite_code)), 'UTF8')), 'hex') and expires_at > now())
    then raise exception '邀请码无效或已过期'; end if;
  if (select count(*) from public.couple_members where couple_id = cid) >= 2 then raise exception '空间已满'; end if;
  insert into public.couple_members values(uid, cid, 2);
  update public.profiles set avatar = 'bunny' where id = uid;
  delete from public.invitations where couple_id = cid;
  return cid;
end;
$$;

create or replace function public.refresh_invite() returns text language plpgsql security definer set search_path = '' as $$
declare cid uuid := public.my_couple_id(); code text;
begin
  if cid is null then raise exception '请先创建空间'; end if;
  perform 1 from public.couples where id = cid for update;
  if exists(select 1 from public.couples where id = cid and closed_at is not null) then
    raise exception '空间已经封存，不能生成新邀请码' using errcode='42501';
  end if;
  if (select count(*) from public.couple_members where couple_id = cid) >= 2 then raise exception '空间已经有两位玩家'; end if;
  code := replace(gen_random_uuid()::text, '-', '');
  insert into public.invitations(couple_id, code_hash) values(cid, encode(sha256(convert_to(code, 'UTF8')), 'hex'))
  on conflict(couple_id) do update set code_hash = excluded.code_hash, expires_at = now() + interval '24 hours';
  return code;
end;
$$;

create or replace function public.prepare_account_deletion(p_expected_space uuid default null)
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
    -- The surviving member may keep reading shared history, but this relationship
    -- must never be rebound to a new user after one account is deleted.
    update public.couples set closed_at=coalesce(closed_at,now()) where id=cid;
    delete from public.invitations where couple_id=cid;
  end if;
  update public.messages set sender_id=null where sender_id=uid;
  update public.events set created_by=null where created_by=uid;
  update public.photos set uploaded_by=null where uploaded_by=uid;
  update public.pings set sender_id=null where sender_id=uid;
  return job_id;
end;
$$;

revoke all on function public.join_space(text), public.refresh_invite(), public.prepare_account_deletion(uuid) from public, anon;
grant execute on function public.join_space(text), public.refresh_invite(), public.prepare_account_deletion(uuid) to authenticated;
commit;
