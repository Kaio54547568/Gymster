-- Supabase Storage setup for Gymster profile avatars.
-- Run this in Supabase SQL Editor after creating the "pics" bucket.
-- Current app auth is custom table based, so these MVP policies allow the
-- frontend anon key to read avatar files and upload new files into users/.
-- Tighten these policies or move uploads behind an Edge Function before production.

insert into storage.buckets (id, name, public)
values ('pics', 'pics', true)
on conflict (id) do update
set public = true;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'gymster_pics_public_read'
  ) then
    create policy gymster_pics_public_read
      on storage.objects
      for select
      using (bucket_id = 'pics');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'gymster_pics_public_insert'
  ) then
    create policy gymster_pics_public_insert
      on storage.objects
      for insert
      with check (bucket_id = 'pics' and name like 'users/%');
  end if;
end $$;
