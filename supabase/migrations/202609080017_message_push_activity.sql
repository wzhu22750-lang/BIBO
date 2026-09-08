-- Foreground heartbeat for Realtime/FCM responsibility split: while the app is
-- visible it periodically marks its own device rows as recently seen, so the
-- send-message-push / send-ping-push webhook functions can skip devices that
-- are already receiving messages through Supabase Realtime instead of firing a
-- duplicate system notification. Clients never write device rows directly
-- (insert/update revoked in 202609080016); this RPC touches only auth.uid()'s
-- own Android installations.
begin;

create function public.touch_device_activity() returns integer
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); touched integer;
begin
  if uid is null then raise exception '请先登录' using errcode='42501'; end if;
  update public.device_installations
    set last_seen_at = now()
    where user_id = uid and platform = 'android';
  get diagnostics touched = row_count;
  return touched;
end;
$$;

revoke all on function public.touch_device_activity() from public, anon;
grant execute on function public.touch_device_activity() to authenticated;
commit;
