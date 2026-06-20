-- Gymster consolidated demo schema.
-- Run only after 00_reset_public.sql.

begin;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create sequence public.member_code_seq start 1;

create or replace function public.generate_member_code()
returns text language plpgsql as $$
declare candidate text;
begin
  loop
    candidate := 'MB-' || lpad(nextval('public.member_code_seq')::text, 6, '0');
    exit when not exists (
      select 1 from public.members where lower(member_code) = lower(candidate)
    );
  end loop;
  return candidate;
end;
$$;

create table public.users (
  user_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  auth_provider text,
  email text not null,
  username text,
  password_hash text,
  first_name text not null,
  last_name text not null default '',
  phone_number text,
  date_of_birth date not null,
  gender text not null default 'unspecified'
    check (gender in ('male','female','other','unspecified')),
  role text not null check (role in ('member','trainer','staff','admin','owner')),
  headline text not null default '',
  preferred_language text not null default 'vi' check (preferred_language in ('en','vi')),
  account_status text not null default 'active'
    check (account_status in (
      'pending_onboarding','pending_pt_approval','pending_payment',
      'pending_verification','active','cancelled','inactive','suspended'
    )),
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_format_check check (
    username is null or username ~ '^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$'
  )
);
create unique index idx_users_email_lower on public.users(lower(email));
create unique index idx_users_username_lower on public.users(lower(username))
  where username is not null and username <> '';
create unique index idx_users_phone_number_unique on public.users(phone_number)
  where phone_number is not null and phone_number <> '';
create index idx_users_role_status on public.users(role, account_status);

create table public.user_settings (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  preferred_language text not null default 'vi' check (preferred_language in ('en','vi')),
  theme text not null default 'dark' check (theme in ('dark','light')),
  email_notifications boolean not null default true,
  membership_expiring_alerts boolean not null default true,
  payment_completed_notifications boolean not null default true,
  settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.members (
  member_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(user_id) on delete cascade,
  member_code text not null default public.generate_member_code(),
  full_name text not null,
  phone_number text,
  date_of_birth date,
  gender text check (gender in ('male','female','other','unspecified')),
  occupation text,
  address text,
  citizen_id text,
  emergency_contact_name text,
  emergency_contact_phone text,
  health_notes text,
  join_date date,
  status text not null default 'pending_onboarding'
    check (status in (
      'pending','pending_onboarding','pending_payment','pending_verification',
      'active','cancelled','inactive','suspended'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index idx_members_member_code_lower on public.members(lower(member_code));
create unique index idx_members_citizen_id_unique on public.members(citizen_id)
  where citizen_id is not null and citizen_id <> '';
create index idx_members_status on public.members(status);

create table public.employees (
  employee_id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(user_id) on delete set null,
  employee_code text not null unique,
  full_name text not null,
  email text,
  phone_number text,
  gender text check (gender in ('male','female','other','unspecified')),
  date_of_birth date,
  role text not null check (role in ('trainer','staff','admin','owner')),
  department text,
  certification text,
  performance_score numeric(5,2) check (performance_score is null or performance_score between 0 and 100),
  member_limit integer not null default 10 check (member_limit >= 0),
  current_active_members integer not null default 0 check (current_active_members >= 0),
  hire_date date,
  base_salary numeric(12,2) check (base_salary is null or base_salary >= 0),
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_employees_role_status on public.employees(role, status);

create table public.trainers (
  trainer_id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.users(user_id) on delete set null,
  employee_id uuid unique references public.employees(employee_id) on delete set null,
  trainer_code text not null unique,
  full_name text not null,
  specialty text not null,
  bio text,
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  current_active_members integer not null default 0 check (current_active_members >= 0),
  max_active_members integer not null default 10 check (max_active_members >= 0),
  available_schedule_slots jsonb not null default '[]'::jsonb,
  available_slots jsonb not null default '[]'::jsonb,
  avatar_url text,
  status text not null default 'active' check (status in ('active','inactive','full','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trainer_weekly_availability (
  trainer_weekly_availability_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(trainer_id) on delete cascade,
  day_of_week text not null
    check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, day_of_week, start_time, end_time),
  check (end_time > start_time)
);

create table public.packages (
  package_id uuid primary key default gen_random_uuid(),
  package_code text not null unique,
  package_name text not null,
  package_type text not null check (package_type in ('gym','pt','vip_pt','session_based')),
  duration_months integer not null default 1 check (duration_months > 0),
  validity_days integer,
  price numeric(12,2) not null check (price >= 0),
  description text,
  session_limit integer check (session_limit is null or session_limit >= 0),
  min_purchase_sessions integer,
  max_purchase_sessions integer,
  has_personal_trainer boolean not null default false,
  is_popular boolean not null default false,
  max_leave_days integer,
  sessions_per_week integer not null default 1 check (sessions_per_week in (1,2)),
  is_active boolean not null default true,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    package_type <> 'session_based'
    or (validity_days > 0 and min_purchase_sessions > 0 and max_purchase_sessions >= min_purchase_sessions)
  )
);
create index idx_packages_type_status on public.packages(package_type, status, is_active);

create table public.package_features (
  package_feature_id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(package_id) on delete cascade,
  feature_name text not null,
  feature_description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.package_promotions (
  promotion_id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(package_id) on delete cascade,
  title text not null,
  description text not null default '',
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid not null references public.users(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index idx_package_promotions_period
  on public.package_promotions(package_id, status, start_date, end_date);

create or replace function public.prevent_overlapping_package_promotions()
returns trigger language plpgsql as $$
begin
  if new.status = 'active' and exists (
    select 1 from public.package_promotions p
    where p.package_id = new.package_id
      and p.status = 'active'
      and p.promotion_id is distinct from new.promotion_id
      and daterange(p.start_date, p.end_date, '[]')
          && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception 'An active promotion already overlaps this package and period'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;
create trigger prevent_package_promotion_overlap
before insert or update on public.package_promotions
for each row execute function public.prevent_overlapping_package_promotions();

create table public.member_packages (
  member_package_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  package_id uuid not null references public.packages(package_id) on delete restrict,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment','pending_pt_approval','pending_renewal','pending_staff_approval',
      'pending_activation','active','expired','cancelled','paused'
    )),
  start_date date,
  end_date date,
  sessions_total integer check (sessions_total is null or sessions_total >= 0),
  sessions_used integer not null default 0 check (sessions_used >= 0),
  used_sessions integer not null default 0 check (used_sessions >= 0),
  remaining_sessions integer check (remaining_sessions is null or remaining_sessions >= 0),
  selected_schedule text,
  selected_slots jsonb not null default '[]'::jsonb,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date),
  check (sessions_total is null or sessions_used <= sessions_total)
);
create unique index uq_member_pending_activation on public.member_packages(member_id)
  where status = 'pending_activation';
create unique index uq_member_active_package on public.member_packages(member_id)
  where status = 'active';
create index idx_member_packages_member_status on public.member_packages(member_id, status);

create table public.training_requests (
  training_request_id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid not null references public.trainers(trainer_id) on delete restrict,
  package_id uuid not null references public.packages(package_id) on delete restrict,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  request_type text not null default 'assignment'
    check (request_type in ('assignment','reschedule','makeup_pt_session','cancel_booking','cancel')),
  request_reason text not null default '',
  requested_schedule text not null default '',
  requested_date date,
  start_time time,
  end_time time,
  current_schedule text,
  source_workout_session_id uuid,
  status text not null default 'pending_pt_approval'
    check (status in ('pending_pt_approval','accepted','approved','declined','expired','cancelled','completed')),
  decline_reason text not null default '',
  expires_at timestamptz,
  approved_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  payment_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  package_id uuid references public.packages(package_id) on delete restrict,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  training_request_id uuid references public.training_requests(training_request_id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'VND',
  payment_method text not null check (payment_method in ('cash','bank_transfer','credit_card','e_wallet')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','cancelled','refunded')),
  transfer_content text,
  provider_reference text unique,
  payment_date timestamptz,
  transaction_code text unique,
  proof_type text not null default 'demo' check (proof_type in ('demo','upload')),
  proof_storage_path text,
  proof_file_name text,
  proof_mime_type text,
  proof_submitted_at timestamptz,
  package_name_snapshot text,
  promotion_id uuid references public.package_promotions(promotion_id) on delete set null,
  promotion_title_snapshot text,
  purchased_sessions integer,
  unit_price numeric(12,2),
  original_price numeric(12,2),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  final_amount numeric(12,2),
  applied_at timestamptz,
  rejection_reason text,
  reviewed_by_employee_id uuid references public.employees(employee_id) on delete set null,
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_price is null or (
    original_price >= 0 and final_amount >= 0 and amount = final_amount
  ))
);
create index idx_payments_member_created on public.payments(member_id, created_at desc);
create index idx_payments_status on public.payments(payment_status);

create table public.invoices (
  invoice_id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  payment_id uuid unique references public.payments(payment_id) on delete set null,
  member_id uuid not null references public.members(member_id) on delete cascade,
  employee_id uuid references public.employees(employee_id) on delete set null,
  subtotal_amount numeric(12,2) not null check (subtotal_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  amount numeric(12,2),
  invoice_status text not null default 'issued'
    check (invoice_status in ('draft','issued','paid','cancelled','refunded')),
  status text check (status is null or status in ('draft','issued','paid','cancelled','refunded')),
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  room_id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  room_name text not null,
  room_type text,
  capacity integer check (capacity is null or capacity >= 0),
  status text not null default 'active' check (status in ('active','inactive','maintenance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_sessions (
  workout_session_id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  package_id uuid references public.packages(package_id) on delete set null,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  room_id uuid references public.rooms(room_id) on delete set null,
  title text not null,
  session_title text,
  exercise_type text,
  room_name text,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled'
    check (status in (
      'scheduled','completed','incomplete','cancelled','rescheduled',
      'pending_reschedule','missed','no_show'
    )),
  notes text,
  note text,
  workout_content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
create unique index uq_workout_session_package_slot
  on public.workout_sessions(member_package_id, trainer_id, session_date, start_time, end_time)
  where member_package_id is not null and trainer_id is not null;
create index idx_workout_sessions_member_date on public.workout_sessions(member_id, session_date);

alter table public.training_requests
  add constraint training_requests_source_session_fk
  foreign key (source_workout_session_id)
  references public.workout_sessions(workout_session_id)
  on delete set null;

create table public.trainer_assignments (
  trainer_assignment_id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(trainer_id) on delete cascade,
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_trainer_assignment_package_trainer
  on public.trainer_assignments(member_package_id, trainer_id)
  where member_package_id is not null;

create table public.trainer_slot_reservations (
  reservation_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid not null unique references public.member_packages(member_package_id) on delete cascade,
  payment_id uuid not null unique references public.payments(payment_id) on delete cascade,
  trainer_id uuid not null references public.trainers(trainer_id) on delete restrict,
  selected_schedule text,
  selected_slots jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date not null,
  status text not null default 'reserved' check (status in ('reserved','activated','released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  promotion_id uuid references public.package_promotions(promotion_id) on delete cascade,
  notification_type text not null
    check (notification_type in ('account','package','payment','training_request','schedule','medical_request','system')),
  title text not null,
  message text not null,
  action_type text,
  action_payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_notifications_promotion_user
  on public.notifications(user_id, promotion_id) where promotion_id is not null;

create table public.equipment (
  equipment_id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(room_id) on delete set null,
  equipment_code text not null unique,
  equipment_name text not null,
  category text,
  description text,
  brand text,
  model text,
  serial_number text unique,
  purchase_date date,
  last_maintenance_date date,
  next_maintenance_date date,
  status text not null default 'active'
    check (status in ('active','in_use','broken','under_maintenance','retired')),
  notes text,
  origin text not null,
  warranty_expiry_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (purchase_date is null or warranty_expiry_date >= purchase_date)
);

create table public.maintenance_reports (
  maintenance_report_id uuid primary key default gen_random_uuid(),
  equipment_id uuid references public.equipment(equipment_id) on delete set null,
  room_id uuid references public.rooms(room_id) on delete set null,
  reported_by_user_id uuid references public.users(user_id) on delete set null,
  resolved_by_employee_id uuid references public.employees(employee_id) on delete set null,
  issue_title text not null,
  issue_description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'submitted'
    check (status in ('submitted','in_review','in_progress','resolved','rejected')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_records (
  maintenance_record_id uuid primary key default gen_random_uuid(),
  maintenance_report_id uuid references public.maintenance_reports(maintenance_report_id) on delete set null,
  equipment_id uuid references public.equipment(equipment_id) on delete set null,
  handled_by_employee_id uuid references public.employees(employee_id) on delete set null,
  maintenance_type text not null default 'repair'
    check (maintenance_type in ('inspection','repair','replacement','cleaning','other')),
  description text,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_feedback (
  feedback_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete set null,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  target_type text not null default 'service'
    check (target_type in ('service','trainer','class','equipment','facility','staff')),
  rating integer not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  status text not null default 'submitted'
    check (status in ('submitted','in_review','resolved','rejected')),
  staff_response text,
  responded_by_employee_id uuid references public.employees(employee_id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.complaints (
  complaint_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete set null,
  assigned_employee_id uuid references public.employees(employee_id) on delete set null,
  resolved_by_employee_id uuid references public.employees(employee_id) on delete set null,
  complaint_type text not null default 'service'
    check (complaint_type in ('service','trainer','payment','equipment','facility','other')),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open'
    check (status in ('open','in_review','in_progress','resolved','closed','rejected')),
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employee_schedules (
  employee_schedule_id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  day_of_week text not null
    check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  shift_code text not null check (shift_code in ('shift_1','shift_2','shift_3','shift_4')),
  start_time time not null,
  end_time time not null,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, day_of_week, shift_code),
  check (
    (shift_code = 'shift_1' and start_time = '08:00' and end_time = '10:00') or
    (shift_code = 'shift_2' and start_time = '14:00' and end_time = '16:00') or
    (shift_code = 'shift_3' and start_time = '16:00' and end_time = '18:00') or
    (shift_code = 'shift_4' and start_time = '18:00' and end_time = '20:00')
  )
);

create table public.payroll_periods (
  payroll_period_id uuid primary key default gen_random_uuid(),
  period_name text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft','processing','approved','paid','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_start, period_end),
  check (period_end >= period_start)
);

create table public.payslips (
  payslip_id uuid primary key default gen_random_uuid(),
  payroll_period_id uuid not null references public.payroll_periods(payroll_period_id) on delete cascade,
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  base_salary numeric(12,2) not null default 0,
  bonus_amount numeric(12,2) not null default 0,
  allowance_amount numeric(12,2) not null default 0,
  deduction_amount numeric(12,2) not null default 0,
  net_amount numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','approved','paid','cancelled')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_period_id, employee_id)
);

create table public.performance_reviews (
  performance_review_id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  reviewer_user_id uuid references public.users(user_id) on delete set null,
  review_period text,
  review_type text not null check (review_type in ('staff','trainer')),
  period_start date not null,
  period_end date not null,
  feedback_score numeric(5,2) not null default 0 check (feedback_score between 0 and 100),
  activity_score numeric(5,2) not null default 0 check (activity_score between 0 and 100),
  admin_score numeric(5,2) not null default 0 check (admin_score between 0 and 100),
  final_score numeric(5,2) not null default 0 check (final_score between 0 and 100),
  activity_breakdown jsonb not null default '{}'::jsonb,
  feedback_breakdown jsonb,
  comment text not null default '',
  created_by uuid references public.users(user_id) on delete set null,
  score numeric(5,2) check (score is null or score between 0 and 100),
  rating integer check (rating is null or rating between 1 and 5),
  strengths text,
  improvement_areas text,
  goals text,
  status text not null default 'approved'
    check (status in ('draft','submitted','approved','archived')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, review_type, period_start, period_end),
  check (period_end >= period_start)
);

create table public.package_change_requests (
  package_change_request_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  current_member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  requested_package_id uuid not null references public.packages(package_id) on delete restrict,
  request_type text not null check (request_type in ('buy','renew','upgrade')),
  amount numeric(12,2),
  payment_method text check (payment_method is null or payment_method in ('cash','bank_transfer','credit_card','e_wallet')),
  status text not null default 'pending'
    check (status in ('pending','approved','denied','pending_payment','paid','cancelled')),
  package_name_snapshot text,
  promotion_id uuid references public.package_promotions(promotion_id) on delete set null,
  promotion_title_snapshot text,
  purchased_sessions integer,
  unit_price numeric(12,2),
  original_price numeric(12,2),
  discount_percent numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  final_amount numeric(12,2),
  applied_at timestamptz,
  requested_at timestamptz not null default now(),
  reviewed_by_employee_id uuid references public.employees(employee_id) on delete set null,
  reviewed_at timestamptz,
  deny_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_member_pending_package_request
  on public.package_change_requests(member_id)
  where status in ('pending','pending_payment');

create table public.member_usage_history (
  member_usage_history_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid references public.member_packages(member_package_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  usage_type text not null default 'check_in'
    check (usage_type in ('check_in','workout_session','package_use','manual_adjustment')),
  usage_date timestamptz not null default now(),
  check_in_date date,
  checked_in_by_employee_id uuid references public.employees(employee_id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);
create unique index uq_member_daily_check_in
  on public.member_usage_history(member_id, check_in_date)
  where usage_type = 'check_in';
create index idx_member_check_in_history
  on public.member_usage_history(member_id, check_in_date desc)
  where usage_type = 'check_in';

create table public.training_goals (
  training_goal_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  goal_title text not null,
  target_value numeric(12,2),
  current_value numeric(12,2),
  unit text,
  target_date date,
  status text not null default 'active' check (status in ('active','completed','paused','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.progress_records (
  progress_record_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  workout_session_id uuid references public.workout_sessions(workout_session_id) on delete set null,
  record_date date not null default current_date,
  weight_kg numeric(6,2),
  body_fat_percent numeric(5,2),
  muscle_mass_kg numeric(6,2),
  calories_burned integer,
  performance_score numeric(5,2),
  progress_text text,
  comment text,
  next_goal text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.body_metrics (
  body_metric_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  recorded_by_trainer_id uuid references public.trainers(trainer_id) on delete set null,
  recorded_at timestamptz not null default now(),
  height_cm numeric(6,2),
  weight_kg numeric(6,2),
  body_fat_percent numeric(5,2),
  muscle_mass_kg numeric(6,2),
  chest_cm numeric(6,2),
  waist_cm numeric(6,2),
  hip_cm numeric(6,2),
  blood_pressure text,
  resting_heart_rate integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_records (
  medical_record_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  condition_name text,
  allergies text,
  medications text,
  injury_notes text,
  emergency_notes text,
  clearance_status text not null default 'unspecified'
    check (clearance_status in ('unspecified','cleared','restricted','not_cleared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_history_requests (
  medical_history_request_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  status text not null default 'pending' check (status in ('pending','submitted','cancelled')),
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_plans (
  workout_plan_id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  plan_name text not null,
  plan_goal text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('draft','active','completed','archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workout_plan_exercises (
  workout_plan_exercise_id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans(workout_plan_id) on delete cascade,
  exercise_name text not null,
  exercise_type text,
  sets integer,
  reps text,
  duration_minutes integer,
  rest_seconds integer,
  intensity text,
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_plans (
  meal_plan_id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  plan_name text not null,
  goal text,
  calories_per_day integer,
  protein_grams integer,
  carbs_grams integer,
  fat_grams integer,
  meals jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_plan_assignments (
  meal_plan_assignment_id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(meal_plan_id) on delete cascade,
  member_id uuid not null references public.members(member_id) on delete cascade,
  trainer_id uuid references public.trainers(trainer_id) on delete set null,
  assigned_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_plan_id, member_id)
);

create table public.makeup_sessions (
  makeup_session_id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.members(member_id) on delete cascade,
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  fixed_schedule_cancel_count integer not null default 0,
  max_makeup_allowed integer not null default 0 check (max_makeup_allowed between 0 and 2),
  used_makeup_count integer not null default 0,
  remaining_makeup_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, month, year)
);

-- Core RPCs -----------------------------------------------------------------

create or replace function public.gymster_activate_member_account(
  target_user_id uuid default null,
  target_member_id uuid default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := target_user_id; mid uuid := target_member_id;
begin
  if mid is null then select member_id into mid from public.members where user_id = uid; end if;
  if uid is null then select user_id into uid from public.members where member_id = mid; end if;
  if uid is null or mid is null then raise exception 'Member account not found'; end if;
  update public.users set account_status = 'active' where user_id = uid;
  update public.members set status = 'active', join_date = coalesce(join_date,current_date) where member_id = mid;
  return jsonb_build_object('user_id',uid,'member_id',mid,'account_status','active');
end;
$$;

create or replace function public.replace_staff_schedule(
  p_employee_id uuid,
  p_selections jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare item jsonb; d text; s text; st time; et time;
begin
  if not exists (select 1 from public.employees where employee_id=p_employee_id and role='staff')
    then return jsonb_build_object('ok',false,'message','Staff employee not found.'); end if;
  if jsonb_array_length(coalesce(p_selections,'[]'::jsonb))=0
    then return jsonb_build_object('ok',false,'message','At least one shift is required.'); end if;
  update public.employee_schedules set status='inactive' where employee_id=p_employee_id;
  for item in select value from jsonb_array_elements(p_selections) loop
    d := lower(item->>'dayOfWeek'); s := lower(item->>'shiftCode');
    st := case s when 'shift_1' then '08:00' when 'shift_2' then '14:00'
      when 'shift_3' then '16:00' when 'shift_4' then '18:00' end;
    et := case s when 'shift_1' then '10:00' when 'shift_2' then '16:00'
      when 'shift_3' then '18:00' when 'shift_4' then '20:00' end;
    if st is null then raise exception 'Invalid shift code'; end if;
    insert into public.employee_schedules(employee_id,day_of_week,shift_code,start_time,end_time,status)
    values(p_employee_id,d,s,st,et,'active')
    on conflict(employee_id,day_of_week,shift_code)
    do update set start_time=excluded.start_time,end_time=excluded.end_time,status='active';
  end loop;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.gymster_add_workout_rpc(
  p_member_id uuid, p_session_date date, p_shift_code text, p_title text, p_notes text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare mp record; st time; et time; wid uuid; local_now timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
begin
  st := case p_shift_code when 'shift_1' then '08:00' when 'shift_2' then '14:00'
    when 'shift_3' then '16:00' when 'shift_4' then '18:00' end;
  et := case p_shift_code when 'shift_1' then '10:00' when 'shift_2' then '16:00'
    when 'shift_3' then '18:00' when 'shift_4' then '20:00' end;
  if st is null then raise exception 'Invalid shift code'; end if;
  if p_session_date < local_now::date or (p_session_date=local_now::date and st<=local_now::time)
    then raise exception 'Cannot book a workout in the past'; end if;
  if exists(select 1 from public.workout_sessions where member_id=p_member_id
    and session_date=p_session_date and start_time=st and end_time=et
    and status not in ('cancelled','missed','no_show'))
    then raise exception 'You already have a workout or PT session in this shift'; end if;
  select m.member_package_id,m.package_id,p.package_type,m.start_date,m.end_date,m.remaining_sessions
    into mp from public.member_packages m join public.packages p on p.package_id=m.package_id
    where m.member_id=p_member_id and m.status='active' for update;
  if not found then raise exception 'No active package found'; end if;
  if p_session_date not between mp.start_date and mp.end_date then raise exception 'Date outside package period'; end if;
  if mp.package_type='session_based' then
    if coalesce(mp.remaining_sessions,0)<=0 then raise exception 'No remaining sessions'; end if;
    update public.member_packages set sessions_used=sessions_used+1,used_sessions=used_sessions+1,
      remaining_sessions=remaining_sessions-1 where member_package_id=mp.member_package_id;
  end if;
  insert into public.workout_sessions(member_id,package_id,member_package_id,title,session_title,
    exercise_type,session_date,start_time,end_time,status,notes,note)
  values(p_member_id,mp.package_id,mp.member_package_id,coalesce(nullif(p_title,''),'Self Workout'),
    coalesce(nullif(p_title,''),'Self Workout'),'self_workout',p_session_date,st,et,'scheduled',p_notes,p_notes)
  returning workout_session_id into wid;
  return jsonb_build_object('ok',true,'workout_session_id',wid,'member_package_id',mp.member_package_id);
end;
$$;

create or replace function public.gymster_cancel_workout_rpc(
  p_workout_id uuid, p_member_id uuid
) returns jsonb language plpgsql security definer set search_path=public as $$
declare w record; pkg_type text; refundable boolean := false;
begin
  select * into w from public.workout_sessions
  where workout_session_id=p_workout_id and member_id=p_member_id for update;
  if not found then raise exception 'Workout not found'; end if;
  if w.status in ('completed','cancelled') then raise exception 'Workout cannot be cancelled'; end if;
  select p.package_type into pkg_type from public.member_packages mp
  join public.packages p on p.package_id=mp.package_id
  where mp.member_package_id=w.member_package_id;
  refundable := pkg_type='session_based'
    and (w.session_date+w.start_time) - (now() at time zone 'Asia/Ho_Chi_Minh') >= interval '2 hours';
  if refundable then
    update public.member_packages set sessions_used=greatest(sessions_used-1,0),
      used_sessions=greatest(used_sessions-1,0),remaining_sessions=remaining_sessions+1
    where member_package_id=w.member_package_id;
  end if;
  update public.workout_sessions set status='cancelled' where workout_session_id=p_workout_id;
  return jsonb_build_object('ok',true,'refunded',refundable);
end;
$$;

create or replace function public.gymster_sync_member_package_lifecycle(target_member_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare pending record; reservation record;
begin
  update public.member_packages set status='expired'
  where member_id=target_member_id and status='active' and end_date<current_date;
  select * into pending from public.member_packages
  where member_id=target_member_id and status='pending_activation' and start_date<=current_date
  order by start_date limit 1 for update;
  if not found then return jsonb_build_object('activated',0); end if;
  select * into reservation from public.trainer_slot_reservations
  where member_package_id=pending.member_package_id and status='reserved' for update;
  if reservation.reservation_id is not null and not exists(
    select 1 from public.trainers where trainer_id=reservation.trainer_id and status in ('active','full')
  ) then return jsonb_build_object('activated',0,'blocked','trainer_unavailable'); end if;
  update public.member_packages set status='active',activated_at=now()
  where member_package_id=pending.member_package_id;
  if reservation.reservation_id is not null then
    insert into public.trainer_assignments(trainer_id,member_id,member_package_id,status,notes)
    values(reservation.trainer_id,reservation.member_id,reservation.member_package_id,'active','Activated reservation')
    on conflict(member_package_id,trainer_id) do nothing;
    update public.trainer_slot_reservations set status='activated'
    where reservation_id=reservation.reservation_id;
  end if;
  return jsonb_build_object('activated',1);
end;
$$;

create or replace function public.gymster_complete_package_purchase(
  target_member_id uuid,
  target_package_id uuid,
  target_trainer_id uuid default null,
  target_selected_schedule text default null,
  target_selected_slots jsonb default '[]'::jsonb,
  target_checkout_key text default null,
  target_payment_method text default 'bank_transfer'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare p record; promo record; active_mp record; new_mp record; new_pay record;
  start_on date; end_on date; next_status text; original numeric; discount numeric; final numeric;
begin
  if nullif(trim(target_checkout_key),'') is null then raise exception 'Checkout key is required'; end if;
  if exists(select 1 from public.payments where provider_reference='DEMO-CHECKOUT:'||trim(target_checkout_key)) then
    select pay.*,mp.status package_status,mp.start_date,mp.end_date into new_pay
    from public.payments pay join public.member_packages mp on mp.member_package_id=pay.member_package_id
    where pay.provider_reference='DEMO-CHECKOUT:'||trim(target_checkout_key);
    return jsonb_build_object('payment_id',new_pay.payment_id,'member_package_id',new_pay.member_package_id,
      'package_status',new_pay.package_status,'start_date',new_pay.start_date,'end_date',new_pay.end_date,'reused',true);
  end if;
  if not exists(select 1 from public.members where member_id=target_member_id) then raise exception 'Member not found'; end if;
  select * into p from public.packages where package_id=target_package_id and status='active' and is_active;
  if not found then raise exception 'Active package not found'; end if;
  if exists(select 1 from public.member_packages where member_id=target_member_id and status='pending_activation')
    then raise exception 'PENDING_ACTIVATION_EXISTS'; end if;
  select * into active_mp from public.member_packages where member_id=target_member_id
    and status='active' and end_date>=current_date for update;
  if found then start_on:=active_mp.end_date+1; next_status:='pending_activation';
  else start_on:=current_date; next_status:='active'; end if;
  end_on := case when p.package_type='session_based' then start_on+coalesce(p.validity_days,30)-1
    else (start_on+make_interval(months=>p.duration_months))::date-1 end;
  select * into promo from public.package_promotions where package_id=p.package_id
    and status='active' and current_date between start_date and end_date limit 1;
  original:=p.price; discount:=round(original*coalesce(promo.discount_percent,0)/100,2); final:=original-discount;
  insert into public.member_packages(member_id,package_id,trainer_id,status,start_date,end_date,sessions_total,
    sessions_used,used_sessions,remaining_sessions,selected_schedule,selected_slots,activated_at)
  values(target_member_id,p.package_id,target_trainer_id,next_status,start_on,end_on,p.session_limit,0,0,p.session_limit,
    target_selected_schedule,coalesce(target_selected_slots,'[]'::jsonb),case when next_status='active' then now() end)
  returning * into new_mp;
  insert into public.payments(member_id,package_id,member_package_id,amount,payment_method,payment_status,
    provider_reference,transaction_code,payment_date,proof_type,proof_submitted_at,paid_at,package_name_snapshot,
    promotion_id,promotion_title_snapshot,original_price,discount_percent,discount_amount,final_amount,applied_at)
  values(target_member_id,p.package_id,new_mp.member_package_id,final,target_payment_method,'paid',
    'DEMO-CHECKOUT:'||trim(target_checkout_key),'DEMO-'||replace(gen_random_uuid()::text,'-',''),now(),'demo',now(),now(),
    p.package_name,promo.promotion_id,promo.title,original,coalesce(promo.discount_percent,0),discount,final,now())
  returning * into new_pay;
  insert into public.invoices(invoice_number,payment_id,member_id,subtotal_amount,discount_amount,tax_amount,
    total_amount,amount,invoice_status,status,paid_at)
  values('INV-'||upper(substr(replace(new_pay.payment_id::text,'-',''),1,12)),new_pay.payment_id,target_member_id,
    original,discount,0,final,final,'paid','paid',now());
  if target_trainer_id is not null and next_status='pending_activation' then
    insert into public.trainer_slot_reservations(member_id,member_package_id,payment_id,trainer_id,
      selected_schedule,selected_slots,start_date,end_date)
    values(target_member_id,new_mp.member_package_id,new_pay.payment_id,target_trainer_id,
      target_selected_schedule,coalesce(target_selected_slots,'[]'::jsonb),start_on,end_on);
  elsif target_trainer_id is not null then
    insert into public.trainer_assignments(trainer_id,member_id,member_package_id,status)
    values(target_trainer_id,target_member_id,new_mp.member_package_id,'active');
  end if;
  update public.members set status='active',join_date=coalesce(join_date,current_date) where member_id=target_member_id;
  update public.users set account_status='active'
  where user_id=(select user_id from public.members where member_id=target_member_id);
  return jsonb_build_object('payment_id',new_pay.payment_id,'member_package_id',new_mp.member_package_id,
    'package_status',next_status,'start_date',start_on,'end_date',end_on,'original_price',original,
    'discount_percent',coalesce(promo.discount_percent,0),'discount_amount',discount,'final_amount',final,'reused',false);
end;
$$;

create or replace function public.gymster_approve_payment_request(target_payment_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare pay record; mp record; active_mp record; start_on date; end_on date; next_status text;
begin
  select * into pay from public.payments where payment_id=target_payment_id for update;
  if not found then raise exception 'Payment request not found'; end if;
  if pay.payment_status='paid' then return jsonb_build_object('payment_id',target_payment_id,'status','paid'); end if;
  if pay.payment_status<>'pending' then raise exception 'Only pending payments can be approved'; end if;
  select * into mp from public.member_packages where member_package_id=pay.member_package_id for update;
  select * into active_mp from public.member_packages where member_id=pay.member_id and status='active'
    and member_package_id<>mp.member_package_id and end_date>=current_date;
  if found then start_on:=active_mp.end_date+1; next_status:='pending_activation';
  else start_on:=current_date; next_status:='active'; end if;
  end_on:=(start_on+make_interval(months=>(select duration_months from public.packages where package_id=pay.package_id)))::date-1;
  update public.member_packages set status=next_status,start_date=start_on,end_date=end_on,
    activated_at=case when next_status='active' then now() end where member_package_id=mp.member_package_id;
  update public.payments set payment_status='paid',amount=coalesce(final_amount,amount),paid_at=now(),
    payment_date=now(),reviewed_at=now() where payment_id=target_payment_id;
  insert into public.invoices(invoice_number,payment_id,member_id,subtotal_amount,discount_amount,tax_amount,
    total_amount,amount,invoice_status,status,paid_at)
  values('INV-'||upper(substr(replace(target_payment_id::text,'-',''),1,12)),target_payment_id,pay.member_id,
    coalesce(pay.original_price,pay.amount),pay.discount_amount,0,coalesce(pay.final_amount,pay.amount),
    coalesce(pay.final_amount,pay.amount),'paid','paid',now())
  on conflict(payment_id) do update set invoice_status='paid',status='paid',paid_at=now();
  return jsonb_build_object('payment_id',target_payment_id,'member_package_id',mp.member_package_id,
    'package_status',next_status,'start_date',start_on,'end_date',end_on,'status','paid');
end;
$$;

-- updated_at triggers --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','user_settings','members','employees','trainers','trainer_weekly_availability',
    'packages','package_promotions','member_packages','training_requests','payments','invoices',
    'rooms','workout_sessions','trainer_assignments','trainer_slot_reservations','notifications',
    'equipment','maintenance_reports','maintenance_records','service_feedback','complaints',
    'employee_schedules','payroll_periods','payslips','performance_reviews','package_change_requests',
    'training_goals','progress_records','body_metrics','medical_records','medical_history_requests',
    'workout_plans','workout_plan_exercises','meal_plans','meal_plan_assignments','makeup_sessions'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || t || '_updated_at',
      t
    );
  end loop;
end;
$$;

-- Supabase Storage buckets used by Gymster.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('payment-proofs','payment-proofs',false,3145728,array['image/jpeg','image/png','application/pdf']),
  ('pics','pics',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Demo RLS: authenticated users read app data; backend service role performs writes.
do $$
declare t text;
begin
  foreach t in array array[
    'users','user_settings','members','employees','trainers','trainer_weekly_availability',
    'packages','package_features','package_promotions','member_packages','training_requests',
    'payments','invoices','rooms','workout_sessions','trainer_assignments',
    'trainer_slot_reservations','notifications','equipment','maintenance_reports',
    'maintenance_records','service_feedback','complaints','employee_schedules','payroll_periods',
    'payslips','performance_reviews','package_change_requests','member_usage_history',
    'training_goals','progress_records','body_metrics','medical_records',
    'medical_history_requests','workout_plans','workout_plan_exercises','meal_plans',
    'meal_plan_assignments','makeup_sessions'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy demo_authenticated_read on public.%I for select to authenticated using (true)',t);
    execute format('create policy demo_authenticated_insert on public.%I for insert to authenticated with check (true)',t);
    execute format('create policy demo_authenticated_update on public.%I for update to authenticated using (true) with check (true)',t);
    execute format('create policy demo_authenticated_delete on public.%I for delete to authenticated using (true)',t);
  end loop;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to authenticated;
grant select on public.packages, public.package_features, public.package_promotions to anon;
grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to service_role;
grant execute on function public.gymster_activate_member_account(uuid,uuid) to authenticated;
grant execute on function public.gymster_add_workout_rpc(uuid,date,text,text,text) to authenticated;
grant execute on function public.gymster_cancel_workout_rpc(uuid,uuid) to authenticated;

create policy demo_anon_package_read on public.packages
  for select to anon using (is_active=true and status='active');
create policy demo_anon_package_feature_read on public.package_features
  for select to anon using (true);
create policy demo_anon_promotion_read on public.package_promotions
  for select to anon using (status='active');

drop policy if exists gymster_demo_pics_read on storage.objects;
drop policy if exists gymster_demo_pics_write on storage.objects;
drop policy if exists gymster_demo_pics_update on storage.objects;
drop policy if exists gymster_demo_pics_delete on storage.objects;
create policy gymster_demo_pics_read on storage.objects
  for select to public using (bucket_id='pics');
create policy gymster_demo_pics_write on storage.objects
  for insert to authenticated with check (bucket_id='pics');
create policy gymster_demo_pics_update on storage.objects
  for update to authenticated using (bucket_id='pics') with check (bucket_id='pics');
create policy gymster_demo_pics_delete on storage.objects
  for delete to authenticated using (bucket_id='pics');

commit;
