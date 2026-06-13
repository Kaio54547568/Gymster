-- Adds email-code verification for member self-registration.
-- Run this in Supabase SQL Editor before enabling the new registration flow.

create extension if not exists "pgcrypto";

create table if not exists public.registration_verifications (
  registration_verification_id uuid primary key default gen_random_uuid(),
  email text not null,
  username text not null,
  payload jsonb not null,
  code_hash text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  resend_count integer not null default 0 check (resend_count >= 0),
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registration_verifications_email_created
  on public.registration_verifications (lower(email), created_at desc);

create index if not exists idx_registration_verifications_pending_email
  on public.registration_verifications (lower(email), expires_at)
  where verified_at is null;

drop trigger if exists set_registration_verifications_updated_at on public.registration_verifications;
create trigger set_registration_verifications_updated_at
before update on public.registration_verifications
for each row execute function public.set_updated_at();

alter table public.registration_verifications enable row level security;

drop policy if exists registration_verifications_no_client_select on public.registration_verifications;
create policy registration_verifications_no_client_select
on public.registration_verifications
for select
using (false);

drop policy if exists registration_verifications_no_client_insert on public.registration_verifications;
create policy registration_verifications_no_client_insert
on public.registration_verifications
for insert
with check (false);

drop policy if exists registration_verifications_no_client_update on public.registration_verifications;
create policy registration_verifications_no_client_update
on public.registration_verifications
for update
using (false)
with check (false);

drop policy if exists registration_verifications_no_client_delete on public.registration_verifications;
create policy registration_verifications_no_client_delete
on public.registration_verifications
for delete
using (false);
