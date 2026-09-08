begin;
grant delete on public.photos to authenticated;
create policy photos_delete on public.photos for delete to authenticated
  using(couple_id=(select public.my_couple_id()) and uploaded_by=(select auth.uid()));
create function public.photo_deletion_target(photo_id uuid, space_id uuid)
returns setof public.photos language sql stable security invoker set search_path = '' as $$
  select p.* from public.photos p where p.id=photo_id and p.couple_id=space_id
    and p.couple_id=public.my_couple_id() and p.uploaded_by=auth.uid();
$$;
revoke all on function public.photo_deletion_target(uuid,uuid) from public, anon;
grant execute on function public.photo_deletion_target(uuid,uuid) to authenticated;
commit;
