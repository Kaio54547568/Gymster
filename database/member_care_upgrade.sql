-- Run once on an existing Gymster database for member-care and session updates.

alter table public.workout_sessions
add column if not exists workout_content jsonb not null default '[]'::jsonb;

alter table public.workout_sessions drop constraint if exists workout_sessions_status_check;
alter table public.workout_sessions add constraint workout_sessions_status_check check (
  status in ('scheduled', 'completed', 'incomplete', 'cancelled', 'rescheduled', 'pending_reschedule', 'missed', 'no_show')
);

alter table public.notifications add column if not exists action_type text;
alter table public.notifications add column if not exists action_payload jsonb not null default '{}'::jsonb;
alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (
  notification_type in ('account', 'package', 'payment', 'training_request', 'schedule', 'medical_request', 'system')
);

create table if not exists public.medical_history_requests (
  medical_history_request_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'cancelled')),
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_medical_history_requests_member_id on public.medical_history_requests(member_id);
create index if not exists idx_medical_history_requests_trainer_id on public.medical_history_requests(trainer_id);

drop trigger if exists set_medical_history_requests_updated_at on public.medical_history_requests;
create trigger set_medical_history_requests_updated_at before update on public.medical_history_requests
for each row execute function public.set_updated_at();

alter table public.medical_history_requests enable row level security;
drop policy if exists "medical_history_requests_select_all" on public.medical_history_requests;
create policy "medical_history_requests_select_all" on public.medical_history_requests for select using (true);
drop policy if exists "medical_history_requests_insert_all" on public.medical_history_requests;
create policy "medical_history_requests_insert_all" on public.medical_history_requests for insert with check (true);
drop policy if exists "medical_history_requests_update_all" on public.medical_history_requests;
create policy "medical_history_requests_update_all" on public.medical_history_requests for update using (true) with check (true);
