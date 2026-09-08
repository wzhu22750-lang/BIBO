begin;
create index messages_couple_cursor on public.messages(couple_id, created_at desc, id desc);
create function public.message_history(space_id uuid, before_time timestamptz, before_id uuid, page_size integer default 50)
returns setof public.messages language sql stable security invoker set search_path = '' as $$
  select m.* from public.messages m
  where m.couple_id=space_id and m.couple_id=public.my_couple_id()
    and (m.created_at,m.id)<(before_time,before_id)
  order by m.created_at desc,m.id desc
  limit least(greatest(coalesce(page_size,50),1),100);
$$;
revoke all on function public.message_history(uuid,timestamptz,uuid,integer) from public, anon;
grant execute on function public.message_history(uuid,timestamptz,uuid,integer) to authenticated;
commit;
