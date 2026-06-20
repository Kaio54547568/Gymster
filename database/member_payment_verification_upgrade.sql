-- Member registration payment verification workflow.

alter table public.users drop constraint if exists users_account_status_check;

-- Normalize legacy registration statuses before enforcing the new constraint.
update public.users
set account_status = 'pending_onboarding',
    updated_at = now()
where lower(account_status) in ('pending', 'pending_registration');

alter table public.users add constraint users_account_status_check check (
  account_status in (
    'pending_onboarding',
    'pending_pt_approval',
    'pending_payment',
    'pending_verification',
    'active',
    'cancelled',
    'inactive',
    'suspended'
  )
);

alter table public.members drop constraint if exists members_status_check;

-- Older registration code stored new member profiles as "pending".
update public.members
set status = 'pending_onboarding',
    updated_at = now()
where lower(status) in ('pending', 'pending_registration');

alter table public.members add constraint members_status_check check (
  status in (
    'pending_onboarding',
    'pending_payment',
    'pending_verification',
    'active',
    'cancelled',
    'inactive',
    'suspended'
  )
);

alter table public.payments
  add column if not exists payment_date timestamptz,
  add column if not exists transaction_code text,
  add column if not exists proof_type text not null default 'demo',
  add column if not exists proof_storage_path text,
  add column if not exists proof_file_name text,
  add column if not exists proof_mime_type text,
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by_employee_id uuid references public.employees(employee_id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.payments drop constraint if exists payments_proof_type_check;
alter table public.payments add constraint payments_proof_type_check check (
  proof_type in ('demo', 'upload')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  3145728,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create unique index if not exists uq_trainer_assignment_package_trainer
  on public.trainer_assignments(member_package_id, trainer_id);

create unique index if not exists uq_workout_session_package_slot
  on public.workout_sessions(member_package_id, trainer_id, session_date, start_time, end_time);

create index if not exists idx_payments_member_created
  on public.payments(member_id, created_at desc);

create or replace function public.gymster_approve_payment_request(target_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment public.payments%rowtype;
  target_package public.packages%rowtype;
  target_member_package public.member_packages%rowtype;
  target_user_id uuid;
  approval_time timestamptz := now();
  start_on date := current_date;
  end_on date;
begin
  select * into target_payment
  from public.payments
  where payment_id = target_payment_id
  for update;

  if not found then
    raise exception 'Payment request not found';
  end if;

  if target_payment.payment_status = 'paid' then
    return jsonb_build_object('payment_id', target_payment_id, 'status', 'paid');
  end if;

  if target_payment.payment_status <> 'pending' then
    raise exception 'Only pending payment requests can be approved';
  end if;

  select * into target_member_package
  from public.member_packages
  where member_package_id = target_payment.member_package_id
  for update;

  select * into target_package
  from public.packages
  where package_id = target_payment.package_id;

  end_on := (start_on + make_interval(months => greatest(coalesce(target_package.duration_months, 1), 1)))::date;

  update public.member_packages
  set status = 'active',
      start_date = start_on,
      end_date = end_on,
      activated_at = approval_time,
      updated_at = approval_time
  where member_package_id = target_payment.member_package_id;

  update public.payments
  set payment_status = 'paid',
      paid_at = approval_time,
      payment_date = approval_time,
      reviewed_at = approval_time,
      rejection_reason = null,
      updated_at = approval_time
  where payment_id = target_payment_id;

  select user_id into target_user_id
  from public.members
  where member_id = target_payment.member_id;

  update public.members
  set status = 'active',
      join_date = coalesce(join_date, current_date),
      updated_at = approval_time
  where member_id = target_payment.member_id;

  update public.users
  set account_status = 'active',
      updated_at = approval_time
  where user_id = target_user_id;

  return jsonb_build_object(
    'payment_id', target_payment_id,
    'member_package_id', target_payment.member_package_id,
    'member_id', target_payment.member_id,
    'user_id', target_user_id,
    'status', 'paid'
  );
end;
$$;

grant execute on function public.gymster_approve_payment_request(uuid) to service_role;
