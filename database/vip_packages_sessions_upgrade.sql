-- Upgrade script to add sessions_per_week column to packages table
alter table public.packages add column if not exists sessions_per_week integer not null default 1 check (sessions_per_week in (1, 2));
