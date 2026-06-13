-- Run once on an existing Gymster database to support member cancel/reschedule requests.

alter table public.training_requests add column if not exists request_id uuid unique default gen_random_uuid();
alter table public.training_requests add column if not exists expires_at timestamptz;
alter table public.training_requests add column if not exists request_type text not null default 'assignment';
alter table public.training_requests add column if not exists request_reason text not null default '';
alter table public.training_requests add column if not exists requested_date date;
alter table public.training_requests add column if not exists start_time time;
alter table public.training_requests add column if not exists end_time time;
alter table public.training_requests add column if not exists current_schedule text;
alter table public.training_requests add column if not exists source_workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null;

alter table public.training_requests drop constraint if exists training_requests_status_check;
alter table public.training_requests add constraint training_requests_status_check check (
  status in (
    'pending_pt_approval',
    'accepted',
    'approved',
    'declined',
    'expired',
    'cancelled',
    'completed'
  )
);

alter table public.training_requests drop constraint if exists training_requests_request_type_check;
alter table public.training_requests add constraint training_requests_request_type_check check (
  request_type in ('assignment', 'reschedule', 'makeup_pt_session', 'cancel_booking', 'cancel')
);

alter table public.notifications add column if not exists action_type text;
alter table public.notifications add column if not exists action_payload jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists updated_at timestamptz not null default now();

alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (
  notification_type in ('account', 'package', 'payment', 'training_request', 'schedule', 'medical_request', 'system')
);

create index if not exists idx_training_requests_request_id on public.training_requests(request_id);
create index if not exists idx_training_requests_request_type on public.training_requests(request_type);
create index if not exists idx_training_requests_requested_date on public.training_requests(requested_date);
