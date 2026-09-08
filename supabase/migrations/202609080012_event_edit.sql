begin;
create function public.update_event_once(
  event_id uuid, space_id uuid, event_title text, event_target_at timestamptz,
  event_kind text, event_yearly boolean, event_emoji text, event_category text default 'other'
) returns public.events language plpgsql security definer set search_path = '' as $$
declare row public.events;
begin
  if auth.uid() is null or space_id is distinct from public.my_couple_id() then raise exception '当前账号无法编辑这个空间的事件' using errcode='42501'; end if;
  update public.events set title=btrim(event_title), target_at=event_target_at, kind=event_kind,
    yearly=event_yearly, emoji=event_emoji, category=event_category
    where id=event_id and couple_id=space_id;
  select * into row from public.events where id=event_id and couple_id=space_id;
  if row.id is null then raise exception '事件不存在或已被删除' using errcode='P0002'; end if;
  return row;
end;
$$;
revoke all on function public.update_event_once(uuid,uuid,text,timestamptz,text,boolean,text,text) from public,anon;
grant execute on function public.update_event_once(uuid,uuid,text,timestamptz,text,boolean,text,text) to authenticated;
commit;
