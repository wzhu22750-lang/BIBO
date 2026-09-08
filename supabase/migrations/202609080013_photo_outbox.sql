begin;
create function public.create_photo_once(
  photo_id uuid, space_id uuid, photo_path text, photo_caption text,
  photo_occurred_on date default null, photo_story text default '',
  photo_event_id uuid default null, photo_message_id uuid default null
) returns public.photos language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.photos;
begin
 if uid is null or space_id is distinct from public.my_couple_id() then raise exception '当前账号无法登记这张照片' using errcode='42501'; end if;
 if photo_path is null or photo_path not like space_id::text || '/' || uid::text || '/%' then raise exception '照片路径与当前账号不匹配' using errcode='42501'; end if;
 insert into public.photos(id,couple_id,uploaded_by,path,caption,occurred_on,story,event_id,message_id)
   values(photo_id,space_id,uid,photo_path,btrim(photo_caption),photo_occurred_on,coalesce(photo_story,''),photo_event_id,photo_message_id)
   on conflict(id) do nothing;
 select * into row from public.photos where id=photo_id and couple_id=space_id;
 if row.id is null or row.uploaded_by is distinct from uid or row.path is distinct from photo_path
   or row.caption is distinct from btrim(photo_caption) or row.story is distinct from coalesce(photo_story,'')
   or row.occurred_on is distinct from photo_occurred_on or row.event_id is distinct from photo_event_id
   or row.message_id is distinct from photo_message_id then
   raise exception '照片 ID 已被使用，请勿修改待上传内容' using errcode='22023';
 end if;
 return row;
end;
$$;
revoke all on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid) from public,anon;
grant execute on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid) to authenticated;
commit;
