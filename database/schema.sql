-- Gymster MVP database schema for Supabase/PostgreSQL.
-- This file only defines database structure. It does not connect the frontend.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  user_id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text unique,
  auth_user_id uuid unique,
  auth_provider text,
  password_hash text,
  first_name text not null,
  last_name text not null default '',
  phone_number text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other', 'unspecified')),
  role text not null check (role in ('member', 'trainer', 'staff', 'admin', 'owner')),
  headline text not null default '',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'vi')),
  account_status text not null default 'active' check (
    account_status in (
      'pending_onboarding',
      'pending_pt_approval',
      'pending_payment',
      'active',
      'cancelled',
      'inactive',
      'suspended'
    )
  ),
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists first_name text;
alter table public.users add column if not exists last_name text;
alter table public.users add column if not exists auth_user_id uuid unique;
alter table public.users add column if not exists auth_provider text;
alter table public.users add column if not exists headline text not null default '';
alter table public.users add column if not exists preferred_language text not null default 'en';
alter table public.users drop constraint if exists users_preferred_language_check;
alter table public.users add constraint users_preferred_language_check check (preferred_language in ('en', 'vi'));

update public.users
set username = case email
  when 'owner@gymster.local' then 'owner01'
  when 'admin@gymster.local' then 'admin01'
  when 'staff@gymster.local' then 'staff00'
  when 'trainer@gymster.local' then 'trainer00'
  when 'member@gymster.local' then 'member00'
  else username
end
where email in (
  'owner@gymster.local',
  'admin@gymster.local',
  'staff@gymster.local',
  'trainer@gymster.local',
  'member@gymster.local'
);

update public.users
set username = lower(role) || substr(md5(user_id::text), 1, 12)
where username is not null
  and username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$';

alter table public.users drop constraint if exists users_username_format_check;
alter table public.users add constraint users_username_format_check check (
  username is null or username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$'
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'full_name'
  ) then
    execute $migration$
      update public.users
      set
        first_name = coalesce(nullif(first_name, ''), split_part(full_name, ' ', 1), username, email),
        last_name = coalesce(
          nullif(last_name, ''),
          nullif(trim(regexp_replace(full_name, '^\S+\s*', '')), ''),
          ''
        )
      where full_name is not null
    $migration$;
  end if;
end;
$$;

update public.users
set
  first_name = coalesce(nullif(first_name, ''), username, email),
  last_name = coalesce(last_name, '')
where first_name is null or first_name = '' or last_name is null;

update public.users
set date_of_birth = case role
  when 'admin' then date '1988-01-01'
  when 'owner' then date '1988-01-01'
  when 'staff' then date '1992-01-01'
  when 'trainer' then date '1990-01-01'
  else date '1995-01-01'
end
where date_of_birth is null;

update public.users u
set headline = coalesce(
  nullif(u.headline, ''),
  (select nullif(t.bio, '') from public.trainers t where t.user_id = u.user_id),
  (select nullif(m.health_notes, '') from public.members m where m.user_id = u.user_id),
  case
    when u.role in ('admin', 'owner') then 'Managing gym operations, staff performance, memberships, and business growth.'
    when u.role = 'staff' then 'Supporting daily gym operations, member services, payments, and equipment workflows.'
    when u.role = 'trainer' then 'Helping members build strength, confidence, and sustainable training habits.'
    when u.role = 'member' then 'Committed to building strength, healthy routines, and consistent training habits.'
    else 'Gymster account profile.'
  end
)
where u.headline is null or u.headline = '';

alter table public.users alter column date_of_birth set not null;

alter table public.users alter column first_name set not null;
alter table public.users alter column last_name set default '';
alter table public.users alter column last_name set not null;
alter table public.users drop column if exists full_name;

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'vi')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  email_notifications boolean not null default true,
  membership_expiring_alerts boolean not null default true,
  payment_completed_notifications boolean not null default false,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();

create table if not exists public.members (
  member_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(user_id) on delete cascade,
  member_code text unique,
  emergency_contact_name text,
  emergency_contact_phone text,
  health_notes text,
  join_date date,
  status text not null default 'pending_onboarding' check (
    status in ('pending_onboarding', 'pending_payment', 'active', 'cancelled', 'inactive', 'suspended')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.gymster_activate_member_account(
  target_user_id uuid default null,
  target_member_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_user_id uuid := target_user_id;
  resolved_member_id uuid := target_member_id;
begin
  if resolved_member_id is null and resolved_user_id is not null then
    select member_id
      into resolved_member_id
      from public.members
     where user_id = resolved_user_id
     limit 1;
  end if;

  if resolved_user_id is null and resolved_member_id is not null then
    select user_id
      into resolved_user_id
      from public.members
     where member_id = resolved_member_id
     limit 1;
  end if;

  if resolved_user_id is null or resolved_member_id is null then
    raise exception 'Cannot activate member account without user_id and member_id';
  end if;

  update public.users
     set account_status = 'active',
         updated_at = now()
   where user_id = resolved_user_id;

  update public.members
     set status = 'active',
         join_date = coalesce(join_date, current_date),
         updated_at = now()
   where member_id = resolved_member_id;

  return jsonb_build_object(
    'user_id', resolved_user_id,
    'member_id', resolved_member_id,
    'account_status', 'active',
    'member_status', 'active'
  );
end;
$$;

grant execute on function public.gymster_activate_member_account(uuid, uuid) to anon, authenticated;

create table if not exists public.employees (
  employee_id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(user_id) on delete set null,
  employee_code text unique,
  full_name text not null,
  email text,
  phone_number text,
  role text not null check (role in ('trainer', 'staff', 'admin', 'owner')),
  department text,
  hire_date date,
  base_salary numeric(12, 2) check (base_salary is null or base_salary >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainers (
  trainer_id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(user_id) on delete set null,
  employee_id uuid unique references public.employees(employee_id) on delete set null,
  trainer_code text unique,
  specialty text not null,
  bio text,
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  current_active_members integer not null default 0 check (current_active_members >= 0),
  max_active_members integer not null default 0 check (max_active_members >= 0),
  available_schedule_slots jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'full', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_weekly_availability (
  trainer_weekly_availability_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(trainer_id) on delete cascade,
  day_of_week text not null check (
    day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  ),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, day_of_week, start_time, end_time)
);

create table if not exists public.packages (
  package_id uuid primary key default gen_random_uuid(),
  package_code text unique,
  package_name text not null,
  package_type text not null check (package_type in ('gym', 'pt', 'vip_pt')),
  duration_months integer not null check (duration_months > 0),
  price numeric(12, 2) not null check (price >= 0),
  description text,
  session_limit integer check (session_limit is null or session_limit >= 0),
  has_personal_trainer boolean not null default false,
  is_popular boolean not null default false,
  sessions_per_week integer not null default 1 check (sessions_per_week in (1, 2)),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_features (
  package_feature_id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(package_id) on delete cascade,
  feature_name text not null,
  feature_description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.member_packages (
  member_package_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  package_id uuid not null references public.packages(package_id) on delete restrict,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'active', 'expired', 'cancelled', 'paused')
  ),
  start_date date,
  end_date date,
  sessions_total integer check (sessions_total is null or sessions_total >= 0),
  sessions_used integer not null default 0 check (sessions_used >= 0),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_requests (
  training_request_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid not null references public.trainers(trainer_id) on delete restrict,
  package_id uuid not null references public.packages(package_id) on delete restrict,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  requested_schedule text not null,
  status text not null default 'pending_pt_approval' check (
    status in ('pending_pt_approval', 'approved', 'declined', 'cancelled', 'completed')
  ),
  decline_reason text not null default '',
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  package_id uuid references public.packages(package_id) on delete restrict,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  training_request_id uuid references public.training_requests(training_request_id) on delete set null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'VND',
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'credit_card', 'e_wallet')),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')
  ),
  transfer_content text,
  provider_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  payment_id uuid references public.payments(payment_id) on delete set null,
  member_id uuid not null references public.members(member_id) on delete cascade,
  employee_id uuid references public.employees(employee_id) on delete set null,
  subtotal_amount numeric(12, 2) not null check (subtotal_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  invoice_status text not null default 'issued' check (
    invoice_status in ('draft', 'issued', 'paid', 'cancelled', 'refunded')
  ),
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  workout_session_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  title text not null,
  exercise_type text,
  room_name text,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (
    status in ('scheduled', 'completed', 'incomplete', 'cancelled', 'rescheduled', 'missed')
  ),
  notes text,
  workout_content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  notification_type text not null check (
    notification_type in ('account', 'package', 'payment', 'training_request', 'schedule', 'medical_request', 'system')
  ),
  title text not null,
  message text not null,
  action_type text,
  action_payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_account_status on public.users(account_status);
create index if not exists idx_members_user_id on public.members(user_id);
create index if not exists idx_members_status on public.members(status);
create index if not exists idx_trainers_status on public.trainers(status);
create index if not exists idx_trainer_weekly_availability_trainer_id on public.trainer_weekly_availability(trainer_id);
create index if not exists idx_trainer_weekly_availability_day on public.trainer_weekly_availability(day_of_week);
create index if not exists idx_packages_type_status on public.packages(package_type, status);
create index if not exists idx_package_features_package_id on public.package_features(package_id);
create index if not exists idx_member_packages_member_id on public.member_packages(member_id);
create index if not exists idx_member_packages_package_id on public.member_packages(package_id);
create index if not exists idx_member_packages_status on public.member_packages(status);
create index if not exists idx_training_requests_member_id on public.training_requests(member_id);
create index if not exists idx_training_requests_trainer_id on public.training_requests(trainer_id);
create index if not exists idx_training_requests_status on public.training_requests(status);
create index if not exists idx_payments_member_id on public.payments(member_id);
create index if not exists idx_payments_status on public.payments(payment_status);
create index if not exists idx_invoices_member_id on public.invoices(member_id);
create index if not exists idx_workout_sessions_member_id on public.workout_sessions(member_id);
create index if not exists idx_workout_sessions_trainer_id on public.workout_sessions(trainer_id);
create index if not exists idx_workout_sessions_session_date on public.workout_sessions(session_date);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);

insert into public.trainer_weekly_availability (trainer_id, day_of_week, start_time, end_time, is_available)
select
  t.trainer_id,
  d.day_of_week,
  s.start_time::time,
  s.end_time::time,
  true
from public.trainers t
cross join (
  values
    ('monday'),
    ('tuesday'),
    ('wednesday'),
    ('thursday'),
    ('friday'),
    ('saturday'),
    ('sunday')
) as d(day_of_week)
cross join (
  values
    ('08:00', '10:00'),
    ('14:00', '16:00'),
    ('16:00', '18:00'),
    ('18:00', '20:00')
) as s(start_time, end_time)
on conflict (trainer_id, day_of_week, start_time, end_time) do nothing;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_trainers_updated_at on public.trainers;
create trigger set_trainers_updated_at
before update on public.trainers
for each row execute function public.set_updated_at();

drop trigger if exists set_packages_updated_at on public.packages;
create trigger set_packages_updated_at
before update on public.packages
for each row execute function public.set_updated_at();

drop trigger if exists set_member_packages_updated_at on public.member_packages;
create trigger set_member_packages_updated_at
before update on public.member_packages
for each row execute function public.set_updated_at();

drop trigger if exists set_training_requests_updated_at on public.training_requests;
create trigger set_training_requests_updated_at
before update on public.training_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row execute function public.set_updated_at();

create or replace function public.prevent_member_workout_pt_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.trainer_id is null
    and new.status not in ('cancelled', 'incomplete')
    and exists (
      select 1
      from public.workout_sessions pt_session
      where pt_session.member_id = new.member_id
        and pt_session.trainer_id is not null
        and pt_session.session_date = new.session_date
        and pt_session.status not in ('cancelled', 'incomplete')
        and pt_session.start_time < new.end_time
        and pt_session.end_time > new.start_time
      and pt_session.workout_session_id is distinct from new.workout_session_id
    )
  then
    raise exception 'This time overlaps your fixed PT schedule. Choose another time.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_member_workout_pt_overlap on public.workout_sessions;
create trigger prevent_member_workout_pt_overlap
before insert or update of session_date, start_time, end_time, trainer_id, status
on public.workout_sessions
for each row execute function public.prevent_member_workout_pt_overlap();

-- Additional portal tables for full Supabase migration across Member, Trainer/PT, Staff, and Admin/Owner.
-- These tables support the remaining UI areas that need application data.

create table if not exists public.rooms (
  room_id uuid primary key default gen_random_uuid(),
  room_code text unique,
  room_name text not null,
  room_type text,
  capacity integer check (capacity is null or capacity >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment (
  equipment_id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(room_id) on delete set null,
  equipment_code text unique,
  equipment_name text not null,
  category text,
  brand text,
  model text,
  purchase_date date,
  last_maintenance_date date,
  next_maintenance_date date,
  status text not null default 'active' check (
    status in ('active', 'broken', 'under_maintenance', 'retired')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_reports (
  maintenance_report_id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment(equipment_id) on delete set null,
  room_id uuid references public.rooms(room_id) on delete set null,
  reported_by_user_id uuid references public.users(user_id) on delete set null,
  issue_title text not null,
  issue_description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'submitted' check (
    status in ('submitted', 'in_review', 'in_progress', 'resolved', 'rejected')
  ),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_records (
  maintenance_record_id uuid primary key default gen_random_uuid(),
  maintenance_report_id uuid references public.maintenance_reports(maintenance_report_id) on delete set null,
  equipment_id uuid references public.equipment(equipment_id) on delete set null,
  handled_by_employee_id uuid references public.employees(employee_id) on delete set null,
  maintenance_type text not null default 'repair' check (
    maintenance_type in ('inspection', 'repair', 'replacement', 'cleaning', 'other')
  ),
  description text,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete set null,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  target_type text not null default 'service' check (
    target_type in ('service', 'trainer', 'class', 'equipment', 'facility', 'staff')
  ),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  tags text[] not null default '{}',
  status text not null default 'submitted' check (
    status in ('submitted', 'in_review', 'resolved', 'rejected')
  ),
  staff_response text,
  responded_by_employee_id uuid references public.employees(employee_id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  complaint_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete set null,
  assigned_employee_id uuid references public.employees(employee_id) on delete set null,
  complaint_type text not null default 'service' check (
    complaint_type in ('service', 'trainer', 'payment', 'equipment', 'facility', 'other')
  ),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (
    status in ('open', 'in_review', 'in_progress', 'resolved', 'closed', 'rejected')
  ),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_schedules (
  employee_schedule_id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  room_id uuid references public.rooms(room_id) on delete set null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  shift_type text not null default 'regular' check (
    shift_type in ('regular', 'overtime', 'training', 'leave', 'replacement')
  ),
  status text not null default 'scheduled' check (
    status in ('scheduled', 'completed', 'cancelled', 'missed')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_periods (
  payroll_period_id uuid primary key default gen_random_uuid(),
  period_name text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft' check (
    status in ('draft', 'processing', 'approved', 'paid', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_start, period_end)
);

create table if not exists public.payslips (
  payslip_id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(payroll_period_id) on delete cascade,
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  base_salary numeric(12, 2) not null default 0 check (base_salary >= 0),
  bonus_amount numeric(12, 2) not null default 0 check (bonus_amount >= 0),
  deduction_amount numeric(12, 2) not null default 0 check (deduction_amount >= 0),
  net_amount numeric(12, 2) not null default 0 check (net_amount >= 0),
  status text not null default 'draft' check (
    status in ('draft', 'approved', 'paid', 'cancelled')
  ),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_period_id, employee_id)
);

create table if not exists public.performance_reviews (
  performance_review_id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  reviewer_user_id uuid references public.users(user_id) on delete set null,
  review_period text,
  score numeric(4, 2) check (score is null or (score >= 0 and score <= 100)),
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  strengths text,
  improvement_areas text,
  goals text,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'approved', 'archived')
  ),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trainer_assignments (
  trainer_assignment_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(trainer_id) on delete cascade,
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'cancelled')
  ),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_goals (
  training_goal_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  goal_title text not null,
  target_value numeric(12, 2),
  current_value numeric(12, 2),
  unit text,
  target_date date,
  status text not null default 'active' check (
    status in ('active', 'completed', 'paused', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_records (
  progress_record_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  record_date date not null default current_date,
  weight_kg numeric(6, 2),
  body_fat_percent numeric(5, 2),
  muscle_mass_kg numeric(6, 2),
  calories_burned integer check (calories_burned is null or calories_burned >= 0),
  performance_score numeric(5, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.body_metrics (
  body_metric_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  recorded_by_trainer_id uuid references public.trainers(trainer_id) on delete set null,
  recorded_at timestamptz not null default now(),
  height_cm numeric(6, 2),
  weight_kg numeric(6, 2),
  body_fat_percent numeric(5, 2),
  muscle_mass_kg numeric(6, 2),
  chest_cm numeric(6, 2),
  waist_cm numeric(6, 2),
  hip_cm numeric(6, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_records (
  medical_record_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  condition_name text,
  allergies text,
  medications text,
  injury_notes text,
  emergency_notes text,
  clearance_status text not null default 'unspecified' check (
    clearance_status in ('unspecified', 'cleared', 'restricted', 'not_cleared')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table if not exists public.workout_plans (
  workout_plan_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  plan_name text not null,
  plan_goal text,
  start_date date,
  end_date date,
  status text not null default 'active' check (
    status in ('draft', 'active', 'completed', 'archived')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_plan_exercises (
  workout_plan_exercise_id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(workout_plan_id) on delete cascade,
  exercise_name text not null,
  exercise_type text,
  sets integer check (sets is null or sets >= 0),
  reps text,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  rest_seconds integer check (rest_seconds is null or rest_seconds >= 0),
  intensity text,
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  meal_plan_id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  plan_name text not null,
  goal text,
  calories_per_day integer check (calories_per_day is null or calories_per_day >= 0),
  protein_grams integer check (protein_grams is null or protein_grams >= 0),
  carbs_grams integer check (carbs_grams is null or carbs_grams >= 0),
  fat_grams integer check (fat_grams is null or fat_grams >= 0),
  meals jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (
    status in ('draft', 'active', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plan_assignments (
  meal_plan_assignment_id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(meal_plan_id) on delete cascade,
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  assigned_at timestamptz not null default now(),
  status text not null default 'active' check (
    status in ('active', 'completed', 'cancelled')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, member_id)
);

create table if not exists public.package_change_requests (
  package_change_request_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  current_member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  requested_package_id uuid not null references public.packages(package_id) on delete restrict,
  request_type text not null check (request_type in ('buy', 'renew', 'upgrade')),
  amount numeric(12, 2) check (amount is null or amount >= 0),
  payment_method text check (payment_method is null or payment_method in ('cash', 'bank_transfer', 'credit_card', 'e_wallet')),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'denied', 'pending_payment', 'paid', 'cancelled')
  ),
  requested_at timestamptz not null default now(),
  reviewed_by_employee_id uuid references public.employees(employee_id) on delete set null,
  reviewed_at timestamptz,
  deny_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_usage_history (
  member_usage_history_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  usage_type text not null default 'check_in' check (
    usage_type in ('check_in', 'workout_session', 'package_use', 'manual_adjustment')
  ),
  usage_date timestamptz not null default now(),
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_equipment_room_id on public.equipment(room_id);
create index if not exists idx_equipment_status on public.equipment(status);
create index if not exists idx_maintenance_reports_status on public.maintenance_reports(status);
create index if not exists idx_maintenance_reports_equipment_id on public.maintenance_reports(equipment_id);
create index if not exists idx_maintenance_records_equipment_id on public.maintenance_records(equipment_id);
create index if not exists idx_service_feedback_member_id on public.service_feedback(member_id);
create index if not exists idx_service_feedback_status on public.service_feedback(status);
create index if not exists idx_complaints_member_id on public.complaints(member_id);
create index if not exists idx_complaints_status on public.complaints(status);
create index if not exists idx_employee_schedules_employee_id on public.employee_schedules(employee_id);
create index if not exists idx_employee_schedules_shift_date on public.employee_schedules(shift_date);
create index if not exists idx_payslips_employee_id on public.payslips(employee_id);
create index if not exists idx_payslips_period_id on public.payslips(payroll_period_id);
create index if not exists idx_performance_reviews_employee_id on public.performance_reviews(employee_id);
create index if not exists idx_trainer_assignments_trainer_id on public.trainer_assignments(trainer_id);
create index if not exists idx_trainer_assignments_member_id on public.trainer_assignments(member_id);
create index if not exists idx_training_goals_member_id on public.training_goals(member_id);
create index if not exists idx_progress_records_member_id on public.progress_records(member_id);
create index if not exists idx_body_metrics_member_id on public.body_metrics(member_id);
create index if not exists idx_medical_records_member_id on public.medical_records(member_id);
create index if not exists idx_medical_history_requests_member_id on public.medical_history_requests(member_id);
create index if not exists idx_medical_history_requests_trainer_id on public.medical_history_requests(trainer_id);
create index if not exists idx_workout_plans_member_id on public.workout_plans(member_id);
create index if not exists idx_workout_plans_trainer_id on public.workout_plans(trainer_id);
create index if not exists idx_meal_plan_assignments_member_id on public.meal_plan_assignments(member_id);
create index if not exists idx_package_change_requests_member_id on public.package_change_requests(member_id);
create index if not exists idx_package_change_requests_status on public.package_change_requests(status);
create index if not exists idx_member_usage_history_member_id on public.member_usage_history(member_id);

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at before update on public.equipment
for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_reports_updated_at on public.maintenance_reports;
create trigger set_maintenance_reports_updated_at before update on public.maintenance_reports
for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_records_updated_at on public.maintenance_records;
create trigger set_maintenance_records_updated_at before update on public.maintenance_records
for each row execute function public.set_updated_at();

drop trigger if exists set_service_feedback_updated_at on public.service_feedback;
create trigger set_service_feedback_updated_at before update on public.service_feedback
for each row execute function public.set_updated_at();

drop trigger if exists set_complaints_updated_at on public.complaints;
create trigger set_complaints_updated_at before update on public.complaints
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_schedules_updated_at on public.employee_schedules;
create trigger set_employee_schedules_updated_at before update on public.employee_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_payroll_periods_updated_at on public.payroll_periods;
create trigger set_payroll_periods_updated_at before update on public.payroll_periods
for each row execute function public.set_updated_at();

drop trigger if exists set_payslips_updated_at on public.payslips;
create trigger set_payslips_updated_at before update on public.payslips
for each row execute function public.set_updated_at();

drop trigger if exists set_performance_reviews_updated_at on public.performance_reviews;
create trigger set_performance_reviews_updated_at before update on public.performance_reviews
for each row execute function public.set_updated_at();

drop trigger if exists set_trainer_assignments_updated_at on public.trainer_assignments;
create trigger set_trainer_assignments_updated_at before update on public.trainer_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_training_goals_updated_at on public.training_goals;
create trigger set_training_goals_updated_at before update on public.training_goals
for each row execute function public.set_updated_at();

drop trigger if exists set_progress_records_updated_at on public.progress_records;
create trigger set_progress_records_updated_at before update on public.progress_records
for each row execute function public.set_updated_at();

drop trigger if exists set_body_metrics_updated_at on public.body_metrics;
create trigger set_body_metrics_updated_at before update on public.body_metrics
for each row execute function public.set_updated_at();

drop trigger if exists set_medical_records_updated_at on public.medical_records;
create trigger set_medical_records_updated_at before update on public.medical_records
for each row execute function public.set_updated_at();

drop trigger if exists set_medical_history_requests_updated_at on public.medical_history_requests;
create trigger set_medical_history_requests_updated_at before update on public.medical_history_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_plans_updated_at on public.workout_plans;
create trigger set_workout_plans_updated_at before update on public.workout_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_plan_exercises_updated_at on public.workout_plan_exercises;
create trigger set_workout_plan_exercises_updated_at before update on public.workout_plan_exercises
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_plans_updated_at on public.meal_plans;
create trigger set_meal_plans_updated_at before update on public.meal_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_plan_assignments_updated_at on public.meal_plan_assignments;
create trigger set_meal_plan_assignments_updated_at before update on public.meal_plan_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_package_change_requests_updated_at on public.package_change_requests;
create trigger set_package_change_requests_updated_at before update on public.package_change_requests
for each row execute function public.set_updated_at();

-- Create function to validate package change requests
create or replace function public.validate_package_change_request()
returns trigger
language plpgsql
as $$
declare
  active_pkg_end_date date;
  active_pkg_days_remaining integer;
  has_pending_req boolean;
  has_queued_pkg boolean;
begin
  -- 1. Check if the member already has a pending package change request
  select exists (
    select 1
    from public.package_change_requests
    where member_id = new.member_id
      and status = 'pending'
      and package_change_request_id is distinct from new.package_change_request_id
  ) into has_pending_req;

  if has_pending_req then
    raise exception 'Bạn đã có một yêu cầu đổi/gia hạn gói đang chờ xử lý.';
  end if;

  -- 2. Check if the member has a queued future package (status = 'pending_payment' or active starting in the future)
  select exists (
    select 1
    from public.member_packages
    where member_id = new.member_id
      and (
        status = 'pending_payment'
        or (status = 'active' and start_date > current_date)
      )
  ) into has_queued_pkg;

  if has_queued_pkg then
    raise exception 'Bạn đã có một gói tập đang chờ thanh toán hoặc gói tập tương lai đã được lên lịch.';
  end if;

  -- 3. Check if the member has an active package and if it has more than 5 days remaining
  select end_date into active_pkg_end_date
  from public.member_packages
  where member_id = new.member_id
    and status = 'active'
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  order by created_at desc
  limit 1;

  if active_pkg_end_date is not null then
    active_pkg_days_remaining := active_pkg_end_date - current_date;
    if active_pkg_days_remaining > 5 then
      raise exception 'Gói hiện tại của bạn còn nhiều hơn 5 ngày (% ngày). Bạn chỉ được gửi yêu cầu gia hạn hoặc đổi gói khi gói hiện tại còn tối đa 5 ngày.', active_pkg_days_remaining;
    end if;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists and create it
drop trigger if exists check_package_change_request on public.package_change_requests;
create trigger check_package_change_request
before insert on public.package_change_requests
for each row execute function public.validate_package_change_request();

-- Compatibility fixes for the current frontend service layer.
-- These keep the database stable while older screens are migrated feature-by-feature.

alter table public.members add column if not exists full_name text;
alter table public.members add column if not exists phone_number text;
alter table public.members add column if not exists date_of_birth date;
alter table public.members add column if not exists gender text;

update public.members m
set
  full_name = coalesce(nullif(m.full_name, ''), nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '')),
  phone_number = coalesce(nullif(m.phone_number, ''), u.phone_number),
  date_of_birth = coalesce(m.date_of_birth, u.date_of_birth),
  gender = coalesce(nullif(m.gender, ''), u.gender)
from public.users u
where m.user_id = u.user_id;

alter table public.members drop constraint if exists members_status_check;
alter table public.members add constraint members_status_check check (
  status in (
    'pending',
    'pending_onboarding',
    'pending_payment',
    'active',
    'cancelled',
    'inactive',
    'suspended'
  )
);

alter table public.trainers add column if not exists full_name text;
alter table public.trainers add column if not exists avatar_url text;
alter table public.trainers add column if not exists available_slots jsonb not null default '[]'::jsonb;

update public.trainers t
set
  full_name = coalesce(
    nullif(t.full_name, ''),
    (select nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '') from public.users u where u.user_id = t.user_id),
    (select e.full_name from public.employees e where e.employee_id = t.employee_id),
    t.trainer_code
  ),
  avatar_url = coalesce(
    nullif(t.avatar_url, ''),
    (select u.avatar_url from public.users u where u.user_id = t.user_id)
  ),
  available_slots = case
    when t.available_slots = '[]'::jsonb then t.available_schedule_slots
    else t.available_slots
  end;

alter table public.packages add column if not exists is_active boolean not null default true;

update public.packages
set is_active = case
  when status = 'inactive' then false
  when status = 'archived' then false
  else true
end;

alter table public.member_packages add column if not exists used_sessions integer not null default 0 check (used_sessions >= 0);
alter table public.member_packages add column if not exists remaining_sessions integer check (remaining_sessions is null or remaining_sessions >= 0);

update public.member_packages
set
  used_sessions = coalesce(used_sessions, sessions_used, 0),
  remaining_sessions = coalesce(remaining_sessions, greatest(coalesce(sessions_total, 0) - coalesce(sessions_used, 0), 0));

alter table public.member_packages drop constraint if exists member_packages_status_check;
alter table public.member_packages add constraint member_packages_status_check check (
  status in (
    'pending_payment',
    'pending_pt_approval',
    'pending_renewal',
    'pending_staff_approval',
    'active',
    'expired',
    'cancelled',
    'paused'
  )
);

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

alter table public.makeup_sessions drop constraint if exists makeup_sessions_max_makeup_allowed_check;
alter table public.makeup_sessions add constraint makeup_sessions_max_makeup_allowed_check check (max_makeup_allowed between 0 and 2);

alter table public.packages add column if not exists max_leave_days integer;
update public.packages
set max_leave_days = coalesce(max_leave_days, duration_months * 2);

alter table public.payments add column if not exists payment_date timestamptz;
alter table public.payments add column if not exists transaction_code text;

update public.payments
set
  payment_date = coalesce(payment_date, paid_at, created_at),
  transaction_code = coalesce(nullif(transaction_code, ''), provider_reference, payment_id::text);

alter table public.invoices add column if not exists amount numeric(12, 2);
alter table public.invoices add column if not exists status text;

update public.invoices
set
  amount = coalesce(amount, total_amount),
  status = coalesce(nullif(status, ''), invoice_status);

alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (
  status is null or status in ('draft', 'issued', 'paid', 'cancelled', 'refunded')
);

alter table public.workout_sessions add column if not exists session_id uuid unique default gen_random_uuid();
alter table public.workout_sessions add column if not exists package_id uuid references public.packages(package_id) on delete set null;
alter table public.workout_sessions add column if not exists room_id uuid references public.rooms(room_id) on delete set null;
alter table public.workout_sessions add column if not exists session_title text;
alter table public.workout_sessions add column if not exists note text;
alter table public.workout_sessions add column if not exists workout_content jsonb not null default '[]'::jsonb;

update public.workout_sessions
set
  session_title = coalesce(nullif(session_title, ''), title),
  note = coalesce(nullif(note, ''), notes);

alter table public.workout_sessions drop constraint if exists workout_sessions_status_check;
alter table public.workout_sessions add constraint workout_sessions_status_check check (
  status in (
    'scheduled',
    'completed',
    'incomplete',
    'cancelled',
    'rescheduled',
    'pending_reschedule',
    'missed',
    'no_show'
  )
);

alter table public.notifications add column if not exists updated_at timestamptz not null default now();
alter table public.notifications add column if not exists action_type text;
alter table public.notifications add column if not exists action_payload jsonb not null default '{}'::jsonb;

alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (
  notification_type in ('account', 'package', 'payment', 'training_request', 'schedule', 'medical_request', 'system')
);

drop trigger if exists set_notifications_updated_at on public.notifications;
create trigger set_notifications_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

create index if not exists idx_packages_is_active on public.packages(is_active);
create index if not exists idx_training_requests_request_id on public.training_requests(request_id);
create index if not exists idx_workout_sessions_session_id on public.workout_sessions(session_id);
create index if not exists idx_payments_transaction_code on public.payments(transaction_code);

-- Open RLS policies for the current frontend-only MVP.
-- Replace these with authenticated, role-aware policies before production.
do $$
declare
  table_name text;
  tables text[] := array[
    'users',
    'members',
    'employees',
    'trainers',
    'trainer_weekly_availability',
    'packages',
    'package_features',
    'member_packages',
    'training_requests',
    'payments',
    'invoices',
    'workout_sessions',
    'notifications',
    'rooms',
    'equipment',
    'maintenance_reports',
    'maintenance_records',
    'service_feedback',
    'complaints',
    'employee_schedules',
    'payroll_periods',
    'payslips',
    'performance_reviews',
    'trainer_assignments',
    'training_goals',
    'progress_records',
    'body_metrics',
    'medical_records',
    'medical_history_requests',
    'workout_plans',
    'workout_plan_exercises',
    'meal_plans',
    'meal_plan_assignments',
    'package_change_requests',
    'member_usage_history',
    'makeup_sessions'
  ];
begin
  foreach table_name in array tables loop
    execute format('alter table public.%I enable row level security', table_name);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'gymster_app_select'
    ) then
      execute format('create policy gymster_app_select on public.%I for select using (true)', table_name);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'gymster_app_insert'
    ) then
      execute format('create policy gymster_app_insert on public.%I for insert with check (true)', table_name);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = 'gymster_app_update'
    ) then
      execute format('create policy gymster_app_update on public.%I for update using (true) with check (true)', table_name);
    end if;
  end loop;
end;
$$;
