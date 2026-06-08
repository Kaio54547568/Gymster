alter table public.training_requests add column if not exists request_type text not null default 'assignment';
alter table public.training_requests add column if not exists requested_date date;
alter table public.training_requests add column if not exists start_time time;
alter table public.training_requests add column if not exists end_time time;

alter table public.training_requests drop constraint if exists training_requests_request_type_check;
alter table public.training_requests add constraint training_requests_request_type_check check (
  request_type in ('assignment', 'reschedule', 'makeup_pt_session')
);

create table if not exists public.makeup_sessions (
  makeup_session_id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.members(member_id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  fixed_schedule_cancel_count integer not null default 0 check (fixed_schedule_cancel_count >= 0),
  max_makeup_allowed integer not null default 0 check (max_makeup_allowed between 0 and 3),
  used_makeup_count integer not null default 0 check (used_makeup_count >= 0),
  remaining_makeup_count integer not null default 0 check (remaining_makeup_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, month, year)
);

create index if not exists idx_makeup_sessions_customer_month on public.makeup_sessions(customer_id, year, month);

alter table public.makeup_sessions enable row level security;

drop policy if exists gymster_app_select on public.makeup_sessions;
create policy gymster_app_select on public.makeup_sessions for select using (true);

drop policy if exists gymster_app_insert on public.makeup_sessions;
create policy gymster_app_insert on public.makeup_sessions for insert with check (true);

drop policy if exists gymster_app_update on public.makeup_sessions;
create policy gymster_app_update on public.makeup_sessions for update using (true) with check (true);
