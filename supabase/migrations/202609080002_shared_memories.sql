-- Additive memory metadata. Unknown dates stay NULL; upload timestamps are not rewritten.
begin;
alter table public.events add column category text not null default 'other'
  check (category in ('anniversary', 'date', 'travel', 'birthday', 'other'));
alter table public.events add constraint events_couple_identity unique(couple_id, id);
alter table public.messages add constraint messages_couple_identity unique(couple_id, id);
alter table public.photos
  add column occurred_on date check (occurred_on between date '1900-01-01' and date '9999-12-31'),
  add column story text not null default '' check (char_length(story) <= 2000),
  add column event_id uuid,
  add column message_id uuid,
  add constraint photo_event_same_space foreign key(couple_id, event_id)
    references public.events(couple_id, id) on delete set null (event_id),
  add constraint photo_message_same_space foreign key(couple_id, message_id)
    references public.messages(couple_id, id) on delete set null (message_id);
create index photos_event on public.photos(couple_id, event_id) where event_id is not null;
create index photos_message on public.photos(couple_id, message_id) where message_id is not null;
create index photos_memory_date on public.photos(couple_id, occurred_on desc, id desc);
grant insert(category) on public.events to authenticated;
grant insert(occurred_on, story, event_id, message_id), update(caption, occurred_on, story, event_id, message_id) on public.photos to authenticated;
create policy photos_update on public.photos for update to authenticated
  using(couple_id = (select public.my_couple_id()) and uploaded_by = (select auth.uid()))
  with check(couple_id = (select public.my_couple_id()) and uploaded_by = (select auth.uid()));
commit;
