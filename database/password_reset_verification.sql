-- Adds password reset verification for forgot-password flow.
-- Run this in Supabase SQL Editor.

create table if not exists public.password_reset_verifications (
  password_reset_verification_id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  resend_count integer not null default 0 check (resend_count >= 0),
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_password_reset_verifications_email_created
  on public.password_reset_verifications (lower(email), created_at desc);

create index if not exists idx_password_reset_verifications_pending_email
  on public.password_reset_verifications (lower(email), expires_at)
  where verified_at is null;

drop trigger if exists set_password_reset_verifications_updated_at on public.password_reset_verifications;
create trigger set_password_reset_verifications_updated_at
before update on public.password_reset_verifications
for each row execute function public.set_updated_at();

alter table public.password_reset_verifications enable row level security;

drop policy if exists password_reset_verifications_no_client_select on public.password_reset_verifications;
create policy password_reset_verifications_no_client_select
on public.password_reset_verifications
for select
using (false);

drop policy if exists password_reset_verifications_no_client_insert on public.password_reset_verifications;
create policy password_reset_verifications_no_client_insert
on public.password_reset_verifications
for insert
with check (false);

drop policy if exists password_reset_verifications_no_client_update on public.password_reset_verifications;
create policy password_reset_verifications_no_client_update
on public.password_reset_verifications
for update
using (false)
with check (false);

drop policy if exists password_reset_verifications_no_client_delete on public.password_reset_verifications;
create policy password_reset_verifications_no_client_delete
on public.password_reset_verifications
for delete
using (false);
