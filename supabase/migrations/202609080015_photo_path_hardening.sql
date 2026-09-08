-- Keep Storage object names to the canonical couple/user/file shape. The recursive
-- deletion walker in the Edge Function remains necessary for legacy nested objects.
begin;

drop policy if exists couple_photo_upload on storage.objects;
create policy couple_photo_upload on storage.objects for insert to authenticated with check (
  bucket_id = 'couple-photos'
  and array_length(storage.foldername(name), 1) = 2
  and (storage.foldername(name))[1] = (select public.my_couple_id())::text
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create or replace function public.create_photo_once(
  photo_id uuid, space_id uuid, photo_path text, photo_caption text,
  photo_occurred_on date default null, photo_story text default '',
  photo_event_id uuid default null, photo_message_id uuid default null
) returns public.photos language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.photos; parts text[];
begin
  if uid is null or photo_id is null or space_id is distinct from public.my_couple_id() then
    raise exception '当前账号无法登记这张照片' using errcode='42501';
  end if;
  parts := string_to_array(coalesce(photo_path, ''), '/');
  if array_length(parts, 1) <> 3 or parts[1] is distinct from space_id::text then
    raise exception '照片路径与当前上传操作不匹配（ID 或路径已被修改）' using errcode='42501';
  end if;
  if parts[2] is distinct from uid::text then
    raise exception '照片路径与当前账号不匹配' using errcode='42501';
  end if;
  if coalesce(parts[3], '') not in (photo_id::text || '.jpg', photo_id::text || '.png', photo_id::text || '.webp') then
    raise exception '照片路径与当前上传操作不匹配（ID 或路径已被修改）' using errcode='42501';
  end if;
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

revoke all on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid) from public, anon;
grant execute on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid) to authenticated;
commit;
