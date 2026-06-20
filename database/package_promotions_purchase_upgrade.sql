begin;

create table if not exists public.package_promotions (
  promotion_id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(package_id) on delete cascade,
  title text not null,
  description text not null default '',
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid not null references public.users(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_package_promotions_active_period
  on public.package_promotions(package_id, status, start_date, end_date);

create or replace function public.prevent_overlapping_package_promotions()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' and exists (
    select 1
    from public.package_promotions p
    where p.package_id = new.package_id
      and p.status = 'active'
      and p.promotion_id is distinct from new.promotion_id
      and daterange(p.start_date, p.end_date, '[]') && daterange(new.start_date, new.end_date, '[]')
  ) then
    raise exception 'An active promotion already overlaps this package and period'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_package_promotion_overlap on public.package_promotions;
create trigger prevent_package_promotion_overlap
before insert or update on public.package_promotions
for each row execute function public.prevent_overlapping_package_promotions();

drop trigger if exists set_package_promotions_updated_at on public.package_promotions;
create trigger set_package_promotions_updated_at
before update on public.package_promotions
for each row execute function public.set_updated_at();

-- Tables created after the base schema grants do not automatically inherit
-- privileges in existing Supabase projects.
alter table public.package_promotions enable row level security;

drop policy if exists package_promotions_read on public.package_promotions;
create policy package_promotions_read
on public.package_promotions
for select
to anon, authenticated
using (true);

revoke all on table public.package_promotions from anon, authenticated;
grant select on table public.package_promotions to anon, authenticated;
grant all privileges on table public.package_promotions to service_role;

alter table public.member_packages drop constraint if exists member_packages_status_check;
alter table public.member_packages add constraint member_packages_status_check check (
  status in (
    'pending_payment',
    'pending_pt_approval',
    'pending_renewal',
    'pending_staff_approval',
    'pending_activation',
    'active',
    'expired',
    'cancelled',
    'paused'
  )
) not valid;

create unique index if not exists uq_member_pending_activation
  on public.member_packages(member_id)
  where status = 'pending_activation';

alter table public.payments
  add column if not exists package_name_snapshot text,
  add column if not exists promotion_id uuid references public.package_promotions(promotion_id) on delete set null,
  add column if not exists promotion_title_snapshot text,
  add column if not exists original_price numeric(12, 2),
  add column if not exists discount_percent numeric(5, 2) not null default 0,
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists final_amount numeric(12, 2),
  add column if not exists applied_at timestamptz;

update public.payments
set original_price = coalesce(original_price, amount),
    final_amount = coalesce(final_amount, amount),
    applied_at = coalesce(applied_at, payment_date, created_at)
where original_price is null or final_amount is null or applied_at is null;

alter table public.payments drop constraint if exists payments_snapshot_price_check;
alter table public.payments
  add constraint payments_snapshot_price_check check (
    original_price is null or (
      original_price >= 0
      and discount_percent between 0 and 100
      and discount_amount >= 0
      and final_amount >= 0
      and amount = final_amount
    )
  ) not valid;

alter table public.package_change_requests
  add column if not exists package_name_snapshot text,
  add column if not exists promotion_id uuid references public.package_promotions(promotion_id) on delete set null,
  add column if not exists promotion_title_snapshot text,
  add column if not exists original_price numeric(12, 2),
  add column if not exists discount_percent numeric(5, 2) not null default 0,
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists final_amount numeric(12, 2),
  add column if not exists applied_at timestamptz;

update public.package_change_requests
set original_price = coalesce(original_price, amount),
    final_amount = coalesce(final_amount, amount),
    applied_at = coalesce(applied_at, requested_at, created_at)
where original_price is null or final_amount is null or applied_at is null;

create table if not exists public.trainer_slot_reservations (
  reservation_id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(member_id) on delete cascade,
  member_package_id uuid not null unique references public.member_packages(member_package_id) on delete cascade,
  payment_id uuid not null unique references public.payments(payment_id) on delete cascade,
  trainer_id uuid not null references public.trainers(trainer_id) on delete restrict,
  selected_schedule text,
  selected_slots jsonb not null default '[]'::jsonb,
  start_date date not null,
  end_date date not null,
  status text not null default 'reserved' check (status in ('reserved', 'activated', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_trainer_reservations_capacity
  on public.trainer_slot_reservations(trainer_id, status, start_date, end_date);

create unique index if not exists uq_invoices_payment
  on public.invoices(payment_id)
  where payment_id is not null;

drop trigger if exists set_trainer_slot_reservations_updated_at on public.trainer_slot_reservations;
create trigger set_trainer_slot_reservations_updated_at
before update on public.trainer_slot_reservations
for each row execute function public.set_updated_at();

alter table public.trainer_slot_reservations enable row level security;
revoke all on table public.trainer_slot_reservations from anon, authenticated;
grant all privileges on table public.trainer_slot_reservations to service_role;

create or replace function public.validate_package_change_request()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.package_change_requests
    where member_id = new.member_id
      and status = 'pending'
      and package_change_request_id is distinct from new.package_change_request_id
  ) then
    raise exception 'You already have a pending package request';
  end if;

  if exists (
    select 1 from public.member_packages
    where member_id = new.member_id
      and status = 'pending_activation'
  ) then
    raise exception 'PENDING_ACTIVATION_EXISTS';
  end if;
  return new;
end;
$$;

create or replace function public.gymster_sync_member_package_lifecycle(target_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_pkg public.member_packages%rowtype;
  reservation public.trainer_slot_reservations%rowtype;
  slot jsonb;
  session_on date;
  target_dow integer;
  assignment_id uuid;
  activated_count integer := 0;
begin
  update public.member_packages
  set status = 'expired', updated_at = now()
  where member_id = target_member_id
    and status = 'active'
    and end_date < current_date;

  select * into pending_pkg
  from public.member_packages
  where member_id = target_member_id
    and status = 'pending_activation'
    and start_date <= current_date
  order by start_date, created_at
  limit 1
  for update;

  if found then
    select * into reservation
    from public.trainer_slot_reservations
    where member_package_id = pending_pkg.member_package_id
      and status = 'reserved'
    for update;

    if reservation.reservation_id is not null and not exists (
      select 1 from public.trainers
      where trainer_id = reservation.trainer_id and status in ('active', 'full')
    ) then
      return jsonb_build_object('activated', 0, 'blocked', 'trainer_unavailable');
    end if;

    update public.member_packages
    set status = 'active', activated_at = now(), updated_at = now()
    where member_package_id = pending_pkg.member_package_id;
    activated_count := 1;

    if reservation.reservation_id is not null then
      insert into public.trainer_assignments (
        trainer_id, member_id, member_package_id, status, notes
      ) values (
        reservation.trainer_id, reservation.member_id, reservation.member_package_id,
        'active', 'Activated from paid trainer slot reservation.'
      )
      on conflict (member_package_id, trainer_id) do nothing
      returning trainer_assignment_id into assignment_id;

      if assignment_id is not null then
        update public.trainers
        set current_active_members = current_active_members + 1, updated_at = now()
        where trainer_id = reservation.trainer_id;
      end if;

      for slot in select value from jsonb_array_elements(reservation.selected_slots)
      loop
        target_dow := case lower(slot->>'dayKey')
          when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
          when 'wednesday' then 3 when 'thursday' then 4 when 'friday' then 5
          when 'saturday' then 6 else null end;
        if target_dow is null then continue; end if;
        session_on := reservation.start_date + ((target_dow - extract(dow from reservation.start_date)::integer + 7) % 7);
        while session_on <= reservation.end_date loop
          insert into public.workout_sessions (
            member_id, trainer_id, member_package_id, title, exercise_type, room_name,
            session_date, start_time, end_time, status, notes
          ) values (
            reservation.member_id, reservation.trainer_id, reservation.member_package_id,
            'PT Session', 'Personal Training', 'PT Room', session_on,
            (slot->>'startTime')::time, (slot->>'endTime')::time, 'scheduled',
            'Created from activated trainer slot reservation.'
          )
          on conflict (member_package_id, trainer_id, session_date, start_time, end_time) do nothing;
          session_on := session_on + 7;
        end loop;
      end loop;

      update public.trainer_slot_reservations
      set status = 'activated', updated_at = now()
      where reservation_id = reservation.reservation_id;
    end if;
  end if;

  return jsonb_build_object('activated', activated_count);
end;
$$;

grant execute on function public.gymster_sync_member_package_lifecycle(uuid) to service_role;

create or replace function public.gymster_complete_package_purchase(
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
  target_promotion public.package_promotions%rowtype;
  active_pkg public.member_packages%rowtype;
  created_pkg public.member_packages%rowtype;
  created_payment public.payments%rowtype;
  existing_payment public.payments%rowtype;
  existing_member_package public.member_packages%rowtype;
  slot jsonb;
  session_on date;
  target_dow integer;
  assignment_id uuid;
  checkout_reference text;
  purchase_time timestamptz := now();
  start_on date;
  end_on date;
  next_status text;
  original_value numeric(12, 2);
  discount_value numeric(12, 2) := 0;
  final_value numeric(12, 2);
  reserved_count integer := 0;
  trainer_limit integer := 0;
  trainer_active_count integer := 0;
  required_slots integer := 0;
begin
  perform public.gymster_sync_member_package_lifecycle(target_member_id);

  if nullif(trim(target_checkout_key), '') is null then raise exception 'Checkout key is required'; end if;
  checkout_reference := 'DEMO-CHECKOUT:' || trim(target_checkout_key);
  select * into existing_payment from public.payments where provider_reference = checkout_reference for update;
  if found then
    select * into existing_member_package from public.member_packages
    where member_package_id = existing_payment.member_package_id;
    return jsonb_build_object(
      'payment_id', existing_payment.payment_id,
      'member_package_id', existing_payment.member_package_id,
      'package_status', existing_member_package.status,
      'start_date', existing_member_package.start_date,
      'end_date', existing_member_package.end_date,
      'reused', true
    );
  end if;

  select * into target_member from public.members where member_id = target_member_id for update;
  if not found then raise exception 'Member not found'; end if;
  select * into target_package from public.packages
  where package_id = target_package_id and status = 'active' and is_active = true;
  if not found then raise exception 'Active package not found'; end if;

  if exists (
    select 1 from public.member_packages
    where member_id = target_member_id and status = 'pending_activation'
  ) then
    raise exception 'PENDING_ACTIVATION_EXISTS' using errcode = 'P0001';
  end if;

  select * into active_pkg from public.member_packages
  where member_id = target_member_id and status = 'active'
    and (end_date is null or end_date >= current_date)
  order by end_date desc nulls last, created_at desc limit 1 for update;

  if active_pkg.member_package_id is null then
    start_on := current_date;
    next_status := 'active';
  else
    start_on := coalesce(active_pkg.end_date, current_date) + 1;
    next_status := 'pending_activation';
  end if;
  end_on := (start_on + make_interval(months => greatest(target_package.duration_months, 1)))::date;

  select * into target_promotion from public.package_promotions
  where package_id = target_package_id and status = 'active'
    and start_date <= current_date and end_date >= current_date
  limit 1;
  original_value := target_package.price;
  discount_value := round(original_value * coalesce(target_promotion.discount_percent, 0) / 100, 2);
  final_value := original_value - discount_value;

  target_selected_slots := coalesce(target_selected_slots, '[]'::jsonb);
  if target_package.has_personal_trainer then
    if target_trainer_id is null then raise exception 'Trainer is required for this package'; end if;
    required_slots := greatest(coalesce(target_package.sessions_per_week, 1), 1);
    if jsonb_typeof(target_selected_slots) <> 'array'
      or jsonb_array_length(target_selected_slots) <> required_slots then
      raise exception 'Exactly % weekly training slot(s) are required', required_slots;
    end if;
    select max_active_members, current_active_members into trainer_limit, trainer_active_count
    from public.trainers where trainer_id = target_trainer_id and status in ('active', 'full') for update;
    if not found then raise exception 'Trainer is unavailable'; end if;
    select count(*) into reserved_count from public.trainer_slot_reservations
    where trainer_id = target_trainer_id and status = 'reserved';
    if trainer_limit > 0 and trainer_active_count + reserved_count >= trainer_limit then
      raise exception 'Trainer has reached the member and reservation limit';
    end if;
  else
    target_trainer_id := null;
    target_selected_schedule := null;
    target_selected_slots := '[]'::jsonb;
  end if;

  insert into public.member_packages (
    member_id, package_id, trainer_id, status, start_date, end_date,
    sessions_total, sessions_used, selected_schedule, selected_slots, activated_at
  ) values (
    target_member_id, target_package_id, target_trainer_id, next_status, start_on, end_on,
    target_package.session_limit, 0, target_selected_schedule, target_selected_slots,
    case when next_status = 'active' then purchase_time else null end
  ) returning * into created_pkg;

  insert into public.payments (
    member_id, package_id, member_package_id, amount, currency, payment_method,
    payment_status, transfer_content, provider_reference, transaction_code,
    payment_date, proof_type, proof_submitted_at, paid_at,
    package_name_snapshot, promotion_id, promotion_title_snapshot,
    original_price, discount_percent, discount_amount, final_amount, applied_at
  ) values (
    target_member_id, target_package_id, created_pkg.member_package_id, final_value, 'VND',
    case when target_payment_method in ('cash','bank_transfer','credit_card','e_wallet') then target_payment_method else 'bank_transfer' end,
    'paid', 'PACKAGE PURCHASE', checkout_reference,
    'DEMO-' || to_char(purchase_time, 'YYYYMMDDHH24MISSMS'), purchase_time,
    'demo', purchase_time, purchase_time, target_package.package_name,
    target_promotion.promotion_id, target_promotion.title, original_value,
    coalesce(target_promotion.discount_percent, 0), discount_value, final_value, purchase_time
  ) returning * into created_payment;

  insert into public.invoices (
    invoice_number, payment_id, member_id, subtotal_amount, discount_amount,
    tax_amount, total_amount, invoice_status, issued_at, paid_at
  ) values (
    'INV-' || upper(substr(replace(created_payment.payment_id::text, '-', ''), 1, 12)),
    created_payment.payment_id, target_member_id, original_value, discount_value,
    0, final_value, 'paid', purchase_time, purchase_time
  ) on conflict (payment_id) where payment_id is not null do nothing;

  if target_trainer_id is not null and next_status = 'pending_activation' then
    insert into public.trainer_slot_reservations (
      member_id, member_package_id, payment_id, trainer_id, selected_schedule,
      selected_slots, start_date, end_date, status
    ) values (
      target_member_id, created_pkg.member_package_id, created_payment.payment_id,
      target_trainer_id, target_selected_schedule, target_selected_slots,
      start_on, end_on, 'reserved'
    );
  elsif target_trainer_id is not null then
    insert into public.trainer_assignments (
      trainer_id, member_id, member_package_id, status, notes
    ) values (
      target_trainer_id, target_member_id, created_pkg.member_package_id,
      'active', 'Created by paid package purchase.'
    )
    on conflict (member_package_id, trainer_id) do nothing
    returning trainer_assignment_id into assignment_id;
    if assignment_id is not null then
      update public.trainers set current_active_members = current_active_members + 1, updated_at = purchase_time
      where trainer_id = target_trainer_id;
    end if;
    for slot in select value from jsonb_array_elements(target_selected_slots)
    loop
      target_dow := case lower(slot->>'dayKey')
        when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
        when 'wednesday' then 3 when 'thursday' then 4 when 'friday' then 5
        when 'saturday' then 6 else null end;
      if target_dow is null then continue; end if;
      session_on := start_on + ((target_dow - extract(dow from start_on)::integer + 7) % 7);
      while session_on <= end_on loop
        insert into public.workout_sessions (
          member_id, trainer_id, member_package_id, title, exercise_type, room_name,
          session_date, start_time, end_time, status, notes
        ) values (
          target_member_id, target_trainer_id, created_pkg.member_package_id,
          'PT Session', 'Personal Training', 'PT Room', session_on,
          (slot->>'startTime')::time, (slot->>'endTime')::time, 'scheduled',
          'Created from paid active package.'
        ) on conflict (member_package_id, trainer_id, session_date, start_time, end_time) do nothing;
        session_on := session_on + 7;
      end loop;
    end loop;
  end if;

  update public.members set status = 'active', join_date = coalesce(join_date, current_date), updated_at = purchase_time
  where member_id = target_member_id;
  update public.users set account_status = 'active', updated_at = purchase_time
  where user_id = target_member.user_id;

  return jsonb_build_object(
    'payment_id', created_payment.payment_id,
    'member_package_id', created_pkg.member_package_id,
    'package_status', next_status,
    'start_date', start_on,
    'end_date', end_on,
    'original_price', original_value,
    'discount_percent', coalesce(target_promotion.discount_percent, 0),
    'discount_amount', discount_value,
    'final_amount', final_value,
    'reused', false
  );
end;
$$;

grant execute on function public.gymster_complete_package_purchase(
  uuid, uuid, uuid, text, jsonb, text, text
) to service_role;

create or replace function public.gymster_approve_payment_request(target_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment public.payments%rowtype;
  target_member_package public.member_packages%rowtype;
  target_package public.packages%rowtype;
  active_pkg public.member_packages%rowtype;
  approval_time timestamptz := now();
  start_on date;
  end_on date;
  next_status text;
  target_user_id uuid;
  slot jsonb;
  session_on date;
  target_dow integer;
  assignment_id uuid;
begin
  select * into target_payment from public.payments
  where payment_id = target_payment_id for update;
  if not found then raise exception 'Payment request not found'; end if;
  if target_payment.payment_status = 'paid' then
    return jsonb_build_object('payment_id', target_payment_id, 'status', 'paid');
  end if;
  if target_payment.payment_status <> 'pending' then
    raise exception 'Only pending payment requests can be approved';
  end if;

  perform public.gymster_sync_member_package_lifecycle(target_payment.member_id);
  select * into target_member_package from public.member_packages
  where member_package_id = target_payment.member_package_id for update;
  select * into target_package from public.packages
  where package_id = target_payment.package_id;

  if exists (
    select 1 from public.member_packages
    where member_id = target_payment.member_id
      and status = 'pending_activation'
      and member_package_id <> target_payment.member_package_id
  ) then
    raise exception 'PENDING_ACTIVATION_EXISTS' using errcode = 'P0001';
  end if;

  select * into active_pkg from public.member_packages
  where member_id = target_payment.member_id
    and status = 'active'
    and member_package_id <> target_payment.member_package_id
    and (end_date is null or end_date >= current_date)
  order by end_date desc nulls last, created_at desc limit 1 for update;

  if active_pkg.member_package_id is null then
    start_on := current_date;
    next_status := 'active';
  else
    start_on := coalesce(active_pkg.end_date, current_date) + 1;
    next_status := 'pending_activation';
  end if;
  end_on := (start_on + make_interval(months => greatest(coalesce(target_package.duration_months, 1), 1)))::date;

  update public.member_packages
  set status = next_status,
      start_date = start_on,
      end_date = end_on,
      activated_at = case when next_status = 'active' then approval_time else null end,
      updated_at = approval_time
  where member_package_id = target_member_package.member_package_id;

  update public.payments
  set payment_status = 'paid',
      amount = coalesce(final_amount, amount),
      paid_at = approval_time,
      payment_date = approval_time,
      reviewed_at = approval_time,
      rejection_reason = null,
      updated_at = approval_time
  where payment_id = target_payment_id;

  insert into public.invoices (
    invoice_number, payment_id, member_id, subtotal_amount, discount_amount,
    tax_amount, total_amount, invoice_status, issued_at, paid_at
  ) values (
    'INV-' || upper(substr(replace(target_payment_id::text, '-', ''), 1, 12)),
    target_payment_id, target_payment.member_id,
    coalesce(target_payment.original_price, target_payment.amount),
    coalesce(target_payment.discount_amount, 0), 0,
    coalesce(target_payment.final_amount, target_payment.amount),
    'paid', approval_time, approval_time
  ) on conflict (payment_id) where payment_id is not null do update
  set subtotal_amount = excluded.subtotal_amount,
      discount_amount = excluded.discount_amount,
      total_amount = excluded.total_amount,
      invoice_status = 'paid',
      paid_at = excluded.paid_at,
      updated_at = approval_time;

  if target_member_package.trainer_id is not null and next_status = 'pending_activation' then
    insert into public.trainer_slot_reservations (
      member_id, member_package_id, payment_id, trainer_id, selected_schedule,
      selected_slots, start_date, end_date, status
    ) values (
      target_payment.member_id, target_member_package.member_package_id, target_payment_id,
      target_member_package.trainer_id, target_member_package.selected_schedule,
      coalesce(target_member_package.selected_slots, '[]'::jsonb), start_on, end_on, 'reserved'
    )
    on conflict (member_package_id) do nothing;
  elsif target_member_package.trainer_id is not null then
    insert into public.trainer_assignments (
      trainer_id, member_id, member_package_id, status, notes
    ) values (
      target_member_package.trainer_id, target_payment.member_id,
      target_member_package.member_package_id, 'active',
      'Created when payment request was approved.'
    )
    on conflict (member_package_id, trainer_id) do nothing
    returning trainer_assignment_id into assignment_id;
    if assignment_id is not null then
      update public.trainers
      set current_active_members = current_active_members + 1, updated_at = approval_time
      where trainer_id = target_member_package.trainer_id;
    end if;
    for slot in select value from jsonb_array_elements(coalesce(target_member_package.selected_slots, '[]'::jsonb))
    loop
      target_dow := case lower(slot->>'dayKey')
        when 'sunday' then 0 when 'monday' then 1 when 'tuesday' then 2
        when 'wednesday' then 3 when 'thursday' then 4 when 'friday' then 5
        when 'saturday' then 6 else null end;
      if target_dow is null then continue; end if;
      session_on := start_on + ((target_dow - extract(dow from start_on)::integer + 7) % 7);
      while session_on <= end_on loop
        insert into public.workout_sessions (
          member_id, trainer_id, member_package_id, title, exercise_type, room_name,
          session_date, start_time, end_time, status, notes
        ) values (
          target_payment.member_id, target_member_package.trainer_id,
          target_member_package.member_package_id, 'PT Session', 'Personal Training',
          'PT Room', session_on, (slot->>'startTime')::time,
          (slot->>'endTime')::time, 'scheduled', 'Created from approved package payment.'
        ) on conflict (member_package_id, trainer_id, session_date, start_time, end_time) do nothing;
        session_on := session_on + 7;
      end loop;
    end loop;
  end if;

  select user_id into target_user_id from public.members where member_id = target_payment.member_id;
  update public.members set status = 'active', join_date = coalesce(join_date, current_date), updated_at = approval_time
  where member_id = target_payment.member_id;
  update public.users set account_status = 'active', updated_at = approval_time where user_id = target_user_id;

  return jsonb_build_object(
    'payment_id', target_payment_id,
    'member_package_id', target_member_package.member_package_id,
    'member_id', target_payment.member_id,
    'user_id', target_user_id,
    'package_status', next_status,
    'start_date', start_on,
    'end_date', end_on,
    'status', 'paid'
  );
end;
$$;

grant execute on function public.gymster_approve_payment_request(uuid) to service_role;

commit;
