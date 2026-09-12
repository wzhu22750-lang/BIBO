-- 照片墙排序：支持按「回忆时间」正序（最早在前）/ 倒序（最新在前）分页。
--
-- 变更点：
--   1. 排序关键字从「上传时间 created_at」改为「回忆时间」：
--      coalesce(occurred_on, (created_at at time zone 'utc')::date)，
--      与前端 memories.sortedMemories / 照片卡展示的日期保持一致；
--      同一天内再按上传时间、id 稳定排序。
--   2. 新增 order_asc（默认 false，即旧行为：倒序）与 before_date 游标。
--   3. 游标三元组为 (before_date, before_time, before_id)：
--      before_date 为回忆日期，before_time 为该回忆日期对应的上传时间（同日去重）。
--
-- 说明：函数签名变化（language sql -> plpgsql、参数增删）无法 CREATE OR REPLACE，
-- 因此先 DROP 再建，并重新授权（DROP 会一并丢弃原有 GRANT）。

drop function if exists public.photo_history(uuid, timestamptz, uuid, uuid);

create function public.photo_history(
  space_id uuid,
  before_date date default null,
  before_time timestamptz default null,
  before_id uuid default null,
  event_filter uuid default null,
  order_asc boolean default false
) returns setof public.photos language plpgsql stable security invoker set search_path = '' as $$
declare
  dir text := case when order_asc then 'asc' else 'desc' end;
  cmp text := case when order_asc then '>' else '<' end;
begin
  return query execute format($q$
    select p.* from public.photos p
    where p.couple_id = $1
      and p.couple_id = public.my_couple_id()
      and ($4 is null or p.event_id = $4)
      and (
        $3 is null
        or (coalesce(p.occurred_on, (p.created_at at time zone 'utc')::date), p.created_at, p.id) %s ($2, $5, $3)
      )
    order by coalesce(p.occurred_on, (p.created_at at time zone 'utc')::date) %s, p.created_at %s, p.id %s
    limit 31
  $q$, cmp, dir, dir, dir)
  using space_id, before_date, before_id, event_filter, before_time;
end;
$$;

revoke all on function public.photo_history(uuid, date, timestamptz, uuid, uuid, boolean) from public, anon;
grant execute on function public.photo_history(uuid, date, timestamptz, uuid, uuid, boolean) to authenticated;
