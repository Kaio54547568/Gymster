-- Immediate demo-payment checkout.
-- Run after schema.sql and member_payment_verification_upgrade.sql.

alter table public.member_packages
  add column if not exists trainer_id uuid references public.trainers(trainer_id) on delete set null,
  add column if not exists sessions_total integer,
  add column if not exists sessions_used integer not null default 0,
  add column if not exists selected_schedule text,
  add column if not exists selected_slots jsonb not null default '[]'::jsonb,
  add column if not exists activated_at timestamptz;

alter table public.packages
  add column if not exists sessions_per_week integer not null default 1;

alter table public.payments
  add column if not exists payment_date timestamptz,
  add column if not exists transaction_code text,
  add column if not exists proof_type text not null default 'demo',
  add column if not exists proof_submitted_at timestamptz,
  add column if not exists paid_at timestamptz;

create unique index if not exists uq_payments_demo_checkout_key
  on public.payments(provider_reference)
  where provider_reference like 'DEMO-CHECKOUT:%';

create unique index if not exists uq_trainer_assignment_package_trainer
  on public.trainer_assignments(member_package_id, trainer_id);

create unique index if not exists uq_workout_session_package_slot
  on public.workout_sessions(member_package_id, trainer_id, session_date, start_time, end_time);

-- Close requests from the retired approval workflow. Never promote an unpaid request.
update public.payments
set payment_status = 'cancelled',
    updated_at = now()
where payment_status = 'pending';

update public.member_packages mp
set status = 'cancelled',
    updated_at = now()
where mp.status = 'pending_payment'
  and exists (
    select 1
    from public.payments p
    where p.member_package_id = mp.member_package_id
      and p.payment_status = 'cancelled'
  );

-- Paid, active memberships are authoritative.
update public.members m
set status = 'active',
    join_date = coalesce(m.join_date, current_date),
    updated_at = now()
where exists (
  select 1
  from public.member_packages mp
  join public.payments p on p.member_package_id = mp.member_package_id
  where mp.member_id = m.member_id
    and mp.status = 'active'
    and p.payment_status = 'paid'
);

update public.users u
set account_status = 'active',
    updated_at = now()
where exists (
  select 1
  from public.members m
  where m.user_id = u.user_id
    and m.status = 'active'
);

-- Members left only with cancelled legacy requests return to onboarding.
update public.members m
set status = 'pending_onboarding',
    updated_at = now()
where m.status in ('pending_payment', 'pending_verification')
  and not exists (
    select 1
    from public.member_packages mp
    where mp.member_id = m.member_id
      and mp.status = 'active'
  );

update public.users u
set account_status = 'pending_onboarding',
    updated_at = now()
where u.account_status in ('pending_payment', 'pending_verification')
  and exists (
    select 1
    from public.members m
    where m.user_id = u.user_id
      and m.status = 'pending_onboarding'
  );

create or replace function public.gymster_complete_demo_payment(
  target_member_id uuid,
  target_package_id uuid,
  target_trainer_id uuid default null,
  target_selected_schedule text default null,
  target_selected_slots jsonb default '[]'::jsonb,
  target_checkout_key text default null,
  target_payment_method text default 'bank_transfer'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member public.members%rowtype;
  target_package public.packages%rowtype;
  target_trainer public.trainers%rowtype;
  existing_payment public.payments%rowtype;
  created_payment public.payments%rowtype;
  created_member_package public.member_packages%rowtype;
  slot jsonb;
  session_on date;
  target_dow integer;
  checkout_reference text;
  transaction_value text;
  activated_time timestamptz := now();
  start_on date := current_date;
  end_on date;
  required_slots integer;
  assignment_id uuid;
  session_count integer := 0;
begin
  if nullif(trim(target_checkout_key), '') is null then
    raise exception 'Checkout key is required';
  end if;

  checkout_reference := 'DEMO-CHECKOUT:' || trim(target_checkout_key);

  select * into existing_payment
  from public.payments
  where provider_reference = checkout_reference
  for update;

  if found then
    if existing_payment.member_id <> target_member_id
      or existing_payment.package_id <> target_package_id then
      raise exception 'Checkout key is already in use';
    end if;
    return jsonb_build_object(
      'payment_id', existing_payment.payment_id,
      'member_package_id', existing_payment.member_package_id,
      'member_id', existing_payment.member_id,
      'reused', true
    );
  end if;

  select * into target_member
  from public.members
  where member_id = target_member_id
  for update;
  if not found then
    raise exception 'Member not found';
  end if;

  select * into target_package
  from public.packages
  where package_id = target_package_id
    and status = 'active';
  if not found then
    raise exception 'Active package not found';
  end if;

  target_selected_slots := coalesce(target_selected_slots, '[]'::jsonb);
  if jsonb_typeof(target_selected_slots) <> 'array' then
    raise exception 'Selected slots must be a JSON array';
  end if;

  required_slots := case when coalesce(target_package.sessions_per_week, 1) = 2 then 2 else 1 end;
  if target_package.has_personal_trainer then
    if target_trainer_id is null then
      raise exception 'Trainer is required for this package';
    end if;
    if jsonb_array_length(target_selected_slots) <> required_slots then
      raise exception 'The selected PT schedule is incomplete';
    end if;

    select * into target_trainer
    from public.trainers
    where trainer_id = target_trainer_id
      and status in ('active', 'full')
    for update;
    if not found then
      raise exception 'Trainer is unavailable';
    end if;
    if target_trainer.max_active_members > 0
      and target_trainer.current_active_members >= target_trainer.max_active_members then
      raise exception 'Trainer has reached the member limit';
    end if;
  else
    target_trainer_id := null;
    target_selected_schedule := null;
    target_selected_slots := '[]'::jsonb;
  end if;

  if target_payment_method not in ('cash', 'bank_transfer', 'credit_card', 'e_wallet') then
    target_payment_method := 'bank_transfer';
  end if;

  end_on := (start_on + make_interval(months => greatest(target_package.duration_months, 1)))::date;
  transaction_value := 'DEMO-' || to_char(activated_time, 'YYYYMMDDHH24MISSMS')
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.member_packages (
    member_id,
    package_id,
    trainer_id,
    status,
    start_date,
    end_date,
    sessions_total,
    sessions_used,
    selected_schedule,
    selected_slots,
    activated_at
  )
  values (
    target_member_id,
    target_package_id,
    target_trainer_id,
    'active',
    start_on,
    end_on,
    target_package.session_limit,
    0,
    target_selected_schedule,
    target_selected_slots,
    activated_time
  )
  returning * into created_member_package;

  insert into public.payments (
    member_id,
    package_id,
    member_package_id,
    amount,
    currency,
    payment_method,
    payment_status,
    transfer_content,
    provider_reference,
    transaction_code,
    payment_date,
    proof_type,
    proof_submitted_at,
    paid_at
  )
  values (
    target_member_id,
    target_package_id,
    created_member_package.member_package_id,
    target_package.price,
    'VND',
    target_payment_method,
    'paid',
    'DEMO PAYMENT - INSTANT ACTIVATION',
    checkout_reference,
    transaction_value,
    activated_time,
    'demo',
    activated_time,
    activated_time
  )
  returning * into created_payment;

  update public.members
  set status = 'active',
      join_date = coalesce(join_date, current_date),
      updated_at = activated_time
  where member_id = target_member_id;

  update public.users
  set account_status = 'active',
      updated_at = activated_time
  where user_id = target_member.user_id;

  if target_trainer_id is not null then
    insert into public.trainer_assignments (
      trainer_id,
      member_id,
      member_package_id,
      status,
      notes
    )
    values (
      target_trainer_id,
      target_member_id,
      created_member_package.member_package_id,
      'active',
      'Created by immediate demo payment checkout.'
    )
    on conflict (member_package_id, trainer_id) do nothing
    returning trainer_assignment_id into assignment_id;

    if assignment_id is not null then
      update public.trainers
      set current_active_members = current_active_members + 1,
          updated_at = activated_time
      where trainer_id = target_trainer_id;
    end if;

    for slot in select value from jsonb_array_elements(target_selected_slots)
    loop
      if nullif(slot->>'dayKey', '') is null
        or nullif(slot->>'startTime', '') is null
        or nullif(slot->>'endTime', '') is null then
        raise exception 'A selected PT schedule slot is invalid';
      end if;

      target_dow := case lower(slot->>'dayKey')
        when 'sunday' then 0
        when 'monday' then 1
        when 'tuesday' then 2
        when 'wednesday' then 3
        when 'thursday' then 4
        when 'friday' then 5
        when 'saturday' then 6
        else null
      end;
      if target_dow is null then
        raise exception 'A selected PT schedule day is invalid';
      end if;

      session_on := start_on + ((target_dow - extract(dow from start_on)::integer + 7) % 7);
      while session_on <= end_on loop
        insert into public.workout_sessions (
          member_id,
          trainer_id,
          member_package_id,
          title,
          exercise_type,
          room_name,
          session_date,
          start_time,
          end_time,
          status,
          notes
        )
        values (
          target_member_id,
          target_trainer_id,
          created_member_package.member_package_id,
          'PT Session',
          'Personal Training',
          'PT Room',
          session_on,
          (slot->>'startTime')::time,
          (slot->>'endTime')::time,
          'scheduled',
          'Created from demo checkout schedule: ' || coalesce(target_selected_schedule, '')
        )
        on conflict (member_package_id, trainer_id, session_date, start_time, end_time) do nothing;
        session_count := session_count + 1;
        session_on := session_on + 7;
      end loop;
    end loop;
  end if;

  return jsonb_build_object(
    'payment_id', created_payment.payment_id,
    'member_package_id', created_member_package.member_package_id,
    'member_id', target_member_id,
    'user_id', target_member.user_id,
    'workout_session_count', session_count,
    'reused', false
  );
end;
$$;

grant execute on function public.gymster_complete_demo_payment(
  uuid, uuid, uuid, text, jsonb, text, text
) to service_role;
