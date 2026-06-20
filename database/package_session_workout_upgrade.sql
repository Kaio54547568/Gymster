-- Upgrade schema for session-based packages, workout slots, and quantity pricing

-- 1. Modify packages
alter table public.packages drop constraint if exists packages_package_type_check;
alter table public.packages add constraint packages_package_type_check check (package_type in ('gym', 'pt', 'vip_pt', 'session_based'));

alter table public.packages add column if not exists validity_days integer;
alter table public.packages add column if not exists min_purchase_sessions integer;
alter table public.packages add column if not exists max_purchase_sessions integer;

-- 2. Modify member_packages
alter table public.member_packages add column if not exists remaining_sessions integer generated always as (sessions_total - sessions_used) stored;

-- 3. Modify payments and package_change_requests
alter table public.payments add column if not exists purchased_sessions integer;
alter table public.payments add column if not exists unit_price numeric(12, 2);

alter table public.package_change_requests add column if not exists purchased_sessions integer;
alter table public.package_change_requests add column if not exists unit_price numeric(12, 2);

-- Note: We are KEEPING discount_percent as requested by user.

-- 4. Modify notifications
alter table public.notifications add column if not exists promotion_id uuid references public.package_promotions(promotion_id) on delete cascade;
-- To avoid duplicates, we add a unique index if promotion_id is not null
create unique index if not exists uq_notifications_promotion_user on public.notifications(user_id, promotion_id) where promotion_id is not null;

-- 5. Seed 'Gym Access Per Session' package
do $$
declare
  v_package_id uuid;
begin
  if not exists (select 1 from public.packages where package_code = 'GYM-SESSION-01') then
    insert into public.packages (
      package_code,
      package_name,
      package_type,
      duration_months,
      price,
      description,
      has_personal_trainer,
      is_popular,
      status,
      validity_days,
      min_purchase_sessions,
      max_purchase_sessions
    ) values (
      'GYM-SESSION-01',
      'Gym Access Per Session',
      'session_based',
      1,
      50000.00,
      'Flexible gym access per session. Valid for 30 days.',
      false,
      true,
      'active',
      30,
      1,
      30
    ) returning package_id into v_package_id;

    insert into public.package_features (package_id, feature_name, display_order)
    values
      (v_package_id, '1 workout session', 1),
      (v_package_id, 'Access to all equipment', 2),
      (v_package_id, 'Valid for 30 days', 3);
  end if;
end;
$$;

-- 6. RPC: Add Workout
create or replace function public.gymster_add_workout_rpc(
  p_member_id uuid,
  p_session_date date,
  p_shift_code text,
  p_title text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_package record;
  v_start_time time;
  v_end_time time;
  v_now timestamp := now();
  v_today date := (v_now at time zone 'Asia/Ho_Chi_Minh')::date;
  v_current_time time := (v_now at time zone 'Asia/Ho_Chi_Minh')::time;
  v_workout_id uuid;
begin
  -- Validate Shift
  if p_shift_code = 'shift_1' then v_start_time := '08:00'; v_end_time := '10:00';
  elsif p_shift_code = 'shift_2' then v_start_time := '14:00'; v_end_time := '16:00';
  elsif p_shift_code = 'shift_3' then v_start_time := '16:00'; v_end_time := '18:00';
  elsif p_shift_code = 'shift_4' then v_start_time := '18:00'; v_end_time := '20:00';
  else raise exception 'Invalid shift code';
  end if;

  -- Validate Date
  if p_session_date < v_today then
    raise exception 'Cannot book a past date';
  end if;
  if p_session_date = v_today and v_start_time <= v_current_time then
    raise exception 'Shift has already started';
  end if;

  -- Check overlaps (same member, same day, same time slot, not cancelled/missed)
  if exists (
    select 1 from public.workout_sessions
    where member_id = p_member_id
      and session_date = p_session_date
      and start_time = v_start_time
      and end_time = v_end_time
      and status not in ('cancelled', 'missed')
  ) then
    raise exception 'You already have a workout scheduled for this shift';
  end if;

  -- Find Active Package
  select mp.member_package_id, mp.package_id, p.package_type, mp.start_date, mp.end_date, mp.remaining_sessions
  into v_member_package
  from public.member_packages mp
  join public.packages p on mp.package_id = p.package_id
  where mp.member_id = p_member_id
    and mp.status = 'active'
  for update; -- Lock row

  if not found then
    raise exception 'No active package found';
  end if;

  -- Check package date range
  if p_session_date < coalesce(v_member_package.start_date, p_session_date) or p_session_date > coalesce(v_member_package.end_date, p_session_date) then
    raise exception 'Workout date is outside of package valid period';
  end if;

  -- Session limits
  if v_member_package.package_type = 'session_based' then
    if v_member_package.remaining_sessions <= 0 then
      raise exception 'No remaining sessions in package';
    end if;

    update public.member_packages
    set sessions_used = sessions_used + 1,
        updated_at = now()
    where member_package_id = v_member_package.member_package_id;
  end if;

  insert into public.workout_sessions (
    member_id,
    member_package_id,
    title,
    session_date,
    start_time,
    end_time,
    status,
    notes,
    exercise_type
  ) values (
    p_member_id,
    v_member_package.member_package_id,
    p_title,
    p_session_date,
    v_start_time,
    v_end_time,
    'scheduled',
    p_notes,
    'self_workout'
  ) returning workout_session_id into v_workout_id;

  return jsonb_build_object(
    'ok', true,
    'workout_session_id', v_workout_id,
    'member_package_id', v_member_package.member_package_id
  );
end;
$$;

-- 7. RPC: Cancel Workout
create or replace function public.gymster_cancel_workout_rpc(
  p_workout_id uuid,
  p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workout record;
  v_member_package record;
  v_now timestamp := now();
  v_session_start_ts timestamp;
  v_diff_mins numeric;
  v_refund boolean := false;
begin
  select w.workout_session_id, w.status, w.session_date, w.start_time, w.member_package_id
  into v_workout
  from public.workout_sessions w
  where w.workout_session_id = p_workout_id
    and w.member_id = p_member_id
  for update;

  if not found then
    raise exception 'Workout not found';
  end if;

  if v_workout.status in ('completed', 'cancelled') then
    raise exception 'Workout is already %', v_workout.status;
  end if;

  v_session_start_ts := v_workout.session_date + v_workout.start_time;
  v_diff_mins := extract(epoch from (v_session_start_ts - (v_now at time zone 'Asia/Ho_Chi_Minh'))) / 60;

  if v_diff_mins >= 120 and v_workout.member_package_id is not null then
    select p.package_type into v_member_package
    from public.member_packages mp
    join public.packages p on mp.package_id = p.package_id
    where mp.member_package_id = v_workout.member_package_id;

    if v_member_package.package_type = 'session_based' then
      v_refund := true;
      update public.member_packages
      set sessions_used = greatest(0, sessions_used - 1),
          updated_at = now()
      where member_package_id = v_workout.member_package_id;
    end if;
  end if;

  update public.workout_sessions
  set status = 'cancelled',
      updated_at = now()
  where workout_session_id = p_workout_id;

  return jsonb_build_object(
    'ok', true,
    'refunded', v_refund
  );
end;
$$;
