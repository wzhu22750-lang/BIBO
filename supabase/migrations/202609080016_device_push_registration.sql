-- A Firebase token belongs to the current app installation, not permanently to
-- the last account that used the device. Register through one server boundary so
-- an account switch can atomically move the token without exposing broad table
-- write privileges to the client.
begin;

revoke insert, update on public.device_installations from authenticated;

create function public.register_device_installation(
  device_token text, device_app_version text default 'unknown'
) returns public.device_installations
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); row public.device_installations; app_version text;
begin
  if uid is null then raise exception '请先登录' using errcode='42501'; end if;
  if device_token is null or char_length(device_token) not between 20 and 4096
    or btrim(device_token) <> device_token or device_token ~ '[[:cntrl:]]' then
    raise exception 'FCM token 无效' using errcode='22023';
  end if;
  app_version := btrim(coalesce(device_app_version, 'unknown'));
  if char_length(app_version) not between 1 and 40 then
    raise exception '应用版本无效' using errcode='22023';
  end if;

  -- A token is a bearer identifier for the current installation. Moving it
  -- removes the previous account's ability to receive pushes on this install.
  delete from public.device_installations
    where token = device_token and user_id is distinct from uid;
  insert into public.device_installations(user_id, platform, token, app_version, last_seen_at)
    values(uid, 'android', device_token, app_version, now())
    on conflict(token) do update set
      user_id = excluded.user_id,
      platform = excluded.platform,
      app_version = excluded.app_version,
      last_seen_at = excluded.last_seen_at
    returning * into row;
  return row;
end;
$$;

revoke all on function public.register_device_installation(text,text) from public, anon;
grant execute on function public.register_device_installation(text,text) to authenticated;
commit;
