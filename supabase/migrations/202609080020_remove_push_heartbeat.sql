-- The foreground heartbeat path was removed: Push delivery no longer uses a
-- hidden last_seen_at/120-second suppression window. Remove the old callable
-- functions so stale clients cannot continue changing activity timestamps.
begin;

drop function if exists public.touch_device_activity();
drop function if exists public.touch_device_activity(text);

commit;
