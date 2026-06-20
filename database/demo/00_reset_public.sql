-- Gymster demo reset.
-- DESTRUCTIVE: run only in the dedicated Gymster development/demo project.
-- Supabase Auth and Storage objects are reset separately by:
--   npm run reset:demo-auth -- --confirm RESET_GYMSTER_DEMO

begin;

drop schema if exists public cascade;
create schema public authorization postgres;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant create on schema public to postgres, service_role;

create extension if not exists pgcrypto with schema extensions;

commit;
