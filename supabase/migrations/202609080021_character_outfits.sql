begin;

-- 1. 解除 avatar 硬编码动物列表，改为通用合法标识符正则约束，实现长期可扩展
alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check
  check (char_length(avatar) between 1 and 32 and avatar ~ '^[a-z0-9_-]+$');

-- 2. 新增 outfits 字段并限制必须为 JSON Object
alter table public.profiles add column if not exists outfits jsonb not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_outfits_object;
alter table public.profiles add constraint profiles_outfits_object
  check (jsonb_typeof(outfits) = 'object');

-- 3. 授予 authenticated 角色对 outfits 字段的更新权限
grant update(name, avatar, outfits) on public.profiles to authenticated;

commit;
