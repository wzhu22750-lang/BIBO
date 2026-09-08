begin;
create index photos_couple_cursor on public.photos(couple_id, created_at desc, id desc);
create function public.photo_history(space_id uuid, before_time timestamptz default null, before_id uuid default null, event_filter uuid default null)
returns setof public.photos language sql stable security invoker set search_path = '' as $$
 select p.* from public.photos p
 where p.couple_id=space_id and p.couple_id=public.my_couple_id()
 and (event_filter is null or p.event_id=event_filter)
 and ((before_time is null and before_id is null) or (p.created_at,p.id)<(before_time,before_id))
 order by p.created_at desc,p.id desc limit 31;
$$;
revoke all on function public.photo_history(uuid,timestamptz,uuid,uuid) from public,anon;
grant execute on function public.photo_history(uuid,timestamptz,uuid,uuid) to authenticated;
commit;
