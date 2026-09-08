begin;
create function public.invitation_status()
returns table(active boolean, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select (i.expires_at > now()), i.expires_at from public.invitations i
 where i.couple_id=public.my_couple_id();
$$;
create function public.revoke_invitation() returns boolean
language plpgsql security definer set search_path = '' as $$
declare cid uuid := public.my_couple_id();
begin
 if cid is null then raise exception '请先创建空间' using errcode='42501'; end if;
 -- Same lock as join/refresh: once revocation commits, old codes cannot be consumed.
 perform 1 from public.couples where id=cid for update;
 delete from public.invitations where couple_id=cid;
 return true;
end;
$$;
revoke all on function public.invitation_status() from public,anon;
revoke all on function public.revoke_invitation() from public,anon;
grant execute on function public.invitation_status() to authenticated;
grant execute on function public.revoke_invitation() to authenticated;
commit;
