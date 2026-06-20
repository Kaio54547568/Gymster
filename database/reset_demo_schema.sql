-- DESTRUCTIVE: remove all Gymster objects and data from the public schema.
-- Use only when rebuilding a demo/development Supabase project from scratch.

drop schema if exists public cascade;
create schema public authorization postgres;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres;
