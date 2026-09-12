-- OTP 登录加固：handle_new_user 幂等化（防御性修改）
--
-- 验证码登录使用 supabase.auth.signInWithOtp({ shouldCreateUser: true })，
-- 新邮箱会向 auth.users 插入新行，触发既有触发器 on_auth_user_created
-- → handle_new_user() 自动创建 profiles 建档。该路径无需改动触发器本身。
--
-- 这里把建档 INSERT 改为 ON CONFLICT (id) DO NOTHING，防御极端场景：
-- 账号注销后 auth.users 级联清理尚未完成时，同邮箱重新注册导致的行冲突。
-- 函数为 CREATE OR REPLACE，可重复执行，不影响既有触发器。

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, name) values (new.id, '新玩家')
  on conflict (id) do nothing;
  return new;
end;
$$;