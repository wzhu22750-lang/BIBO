begin;
create function public.create_event_once(
  event_id uuid, space_id uuid, event_title text, event_target_at timestamptz,
  event_kind text, event_yearly boolean, event_emoji text, event_category text default 'other'
) returns public.events language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.events;
begin
  if uid is null or space_id is distinct from public.my_couple_id() then raise exception '当前账号无法向这个空间创建事件' using errcode='42501'; end if;
  insert into public.events(id,couple_id,created_by,title,target_at,kind,yearly,emoji,category)
    values(event_id,space_id,uid,btrim(event_title),event_target_at,event_kind,event_yearly,event_emoji,event_category)
    on conflict(id) do nothing;
  select * into row from public.events where id=event_id and couple_id=space_id;
  if row.id is null or row.created_by is distinct from uid or row.title is distinct from btrim(event_title)
    or row.target_at is distinct from event_target_at or row.kind is distinct from event_kind
    or row.yearly is distinct from event_yearly or row.emoji is distinct from event_emoji
    or row.category is distinct from event_category then
    raise exception '事件 ID 已被使用，请勿修改待同步内容' using errcode='22023';
  end if;
  return row;
end;
$$;
create function public.delete_event_once(event_id uuid, space_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or space_id is distinct from public.my_couple_id() then raise exception '当前账号无法删除这个空间的事件' using errcode='42501'; end if;
  delete from public.events where id=event_id and couple_id=space_id;
  return true;
end;
$$;
revoke all on function public.create_event_once(uuid,uuid,text,timestamptz,text,boolean,text,text) from public,anon;
revoke all on function public.delete_event_once(uuid,uuid) from public,anon;
grant execute on function public.create_event_once(uuid,uuid,text,timestamptz,text,boolean,text,text), public.delete_event_once(uuid,uuid) to authenticated;
commit;
