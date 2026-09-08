-- Idempotent message insertion for a durable client outbox. No client-supplied sender/time.
begin;
create function public.send_message_once(message_id uuid, space_id uuid, message_content text)
returns public.messages language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.messages;
begin
  if uid is null or space_id is distinct from public.my_couple_id() then
    raise exception '当前账号无法向这个空间发送消息' using errcode = '42501';
  end if;
  if message_id is null or message_content is null or char_length(btrim(message_content)) not between 1 and 2000 then
    raise exception '消息需为 1–2000 字' using errcode = '22023';
  end if;
  insert into public.messages(id,couple_id,sender_id,content)
    values(message_id,space_id,uid,btrim(message_content)) on conflict(id) do nothing;
  select * into row from public.messages where id=message_id and couple_id=space_id and sender_id=uid;
  if row.id is null or row.content is distinct from btrim(message_content) then
    raise exception '消息 ID 已被使用，请勿修改待发送内容' using errcode = '22023';
  end if;
  return row;
end;
$$;
revoke all on function public.send_message_once(uuid,uuid,text) from public, anon;
grant execute on function public.send_message_once(uuid,uuid,text) to authenticated;
commit;
