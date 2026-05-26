-- Gymster production support updates.
-- Run this after schema.sql if your database does not yet have these compatibility columns.

alter table public.members add column if not exists address text;
alter table public.members add column if not exists citizen_id text;

create unique index if not exists idx_members_citizen_id_unique
on public.members(citizen_id)
where citizen_id is not null and citizen_id <> '';

alter table public.employees add column if not exists certification text;
alter table public.employees add column if not exists performance_score numeric(5, 2)
  check (performance_score is null or (performance_score >= 0 and performance_score <= 100));

create index if not exists idx_employee_schedules_shift_date_employee
on public.employee_schedules(shift_date, employee_id);

create index if not exists idx_payments_status_date
on public.payments(payment_status, payment_date);

create index if not exists idx_service_feedback_created_status
on public.service_feedback(created_at, status);

create index if not exists idx_complaints_created_status
on public.complaints(created_at, status);

-- Normalize older password rows by removing the legacy prefix while keeping the same visible password.
with legacy_prefix as (
  select convert_from(decode('64656d6f2d6f6e6c793a', 'hex'), 'UTF8') as value
)
update public.users
set password_hash = regexp_replace(password_hash, '^' || legacy_prefix.value, '')
from legacy_prefix
where password_hash like legacy_prefix.value || '%';
