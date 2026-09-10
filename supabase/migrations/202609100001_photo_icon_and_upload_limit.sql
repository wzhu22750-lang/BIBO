-- 照片：上传上限 5MB→10MB；新增可选像素图标（像素小伙伴）；
-- create_photo_once 增加 photo_emoji 参数并可幂等校验。
begin;

-- 1) 私有照片桶上传上限 10MB（项目全局上限 50MB，允许）
update storage.buckets set file_size_limit = 10485760 where id = 'couple-photos';

-- 2) 照片图标：复用 events.emoji 的 icon: 标识体系
alter table public.photos add column emoji text not null default 'icon:heart'
  check (char_length(emoji) between 1 and 64);
grant insert(emoji), update(emoji) on public.photos to authenticated;

-- 3) create_photo_once：新增 photo_emoji（末尾带默认值，旧的 8 参调用仍可用）
drop function if exists public.create_photo_once(uuid, uuid, text, text, date, text, uuid, uuid);
create function public.create_photo_once(
  photo_id uuid, space_id uuid, photo_path text, photo_caption text,
  photo_occurred_on date default null, photo_story text default '',
  photo_event_id uuid default null, photo_message_id uuid default null,
  photo_emoji text default 'icon:heart'
) returns public.photos language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  row public.photos;
  parts text[];
  v_emoji text := coalesce(nullif(btrim(photo_emoji), ''), 'icon:heart');
begin
  if uid is null or photo_id is null or space_id is distinct from public.my_couple_id() then
    raise exception '当前账号无法登记这张照片' using errcode='42501';
  end if;
  if char_length(v_emoji) < 1 or char_length(v_emoji) > 64 then
    raise exception '照片图标无效' using errcode='22023';
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
  insert into public.photos(id,couple_id,uploaded_by,path,caption,occurred_on,story,event_id,message_id,emoji)
    values(photo_id,space_id,uid,photo_path,btrim(photo_caption),photo_occurred_on,coalesce(photo_story,''),photo_event_id,photo_message_id,v_emoji)
    on conflict(id) do nothing;
  select * into row from public.photos where id=photo_id and couple_id=space_id;
  if row.id is null or row.uploaded_by is distinct from uid or row.path is distinct from photo_path
    or row.caption is distinct from btrim(photo_caption) or row.story is distinct from coalesce(photo_story,'')
    or row.occurred_on is distinct from photo_occurred_on or row.event_id is distinct from photo_event_id
    or row.message_id is distinct from photo_message_id or row.emoji is distinct from v_emoji then
    raise exception '照片 ID 已被使用，请勿修改待上传内容' using errcode='22023';
  end if;
  return row;
end;
$$;

revoke all on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid,text) from public, anon;
grant execute on function public.create_photo_once(uuid,uuid,text,text,date,text,uuid,uuid,text) to authenticated;

commit;
