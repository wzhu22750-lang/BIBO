-- Additive migration for the editable Home greeting. Do not re-run the initial
-- migration on an existing project; apply this migration after 017.
begin;
alter table public.couples
  add column if not exists greeting_title text not null default '今天也喜欢你，多一点'
    check (char_length(greeting_title) between 1 and 40),
  add column if not exists greeting_subtitle text not null default '生活不是每天都浪漫，但每天都有你。'
    check (char_length(greeting_subtitle) between 1 and 100);
grant update(greeting_title, greeting_subtitle) on public.couples to authenticated;
commit;
