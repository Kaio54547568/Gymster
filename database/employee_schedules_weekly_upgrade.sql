-- Migration: Upgrade employee_schedules to weekly schedule pattern
drop table if exists public.employee_schedules cascade;

create table public.employee_schedules (
  employee_schedule_id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(employee_id) on delete cascade,
  day_of_week text not null check (day_of_week in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  shift_code text not null check (shift_code in ('shift_1', 'shift_2', 'shift_3', 'shift_4')),
  start_time time not null,
  end_time time not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_employee_schedule_slot unique (employee_id, day_of_week, shift_code),
  constraint chk_employee_schedule_times check (
    (shift_code = 'shift_1' and start_time = '08:00:00'::time and end_time = '10:00:00'::time) or
    (shift_code = 'shift_2' and start_time = '14:00:00'::time and end_time = '16:00:00'::time) or
    (shift_code = 'shift_3' and start_time = '16:00:00'::time and end_time = '18:00:00'::time) or
    (shift_code = 'shift_4' and start_time = '18:00:00'::time and end_time = '20:00:00'::time)
  )
);

create index idx_employee_schedules_employee_id on public.employee_schedules(employee_id);

create trigger set_employee_schedules_updated_at before update on public.employee_schedules
  for each row execute function set_updated_at();

-- Database function to replace schedule atomically
create or replace function public.replace_staff_schedule(
  p_employee_id uuid,
  p_selections jsonb -- [{"dayOfWeek": "monday", "shiftCode": "shift_1"}, ...]
) returns jsonb as $$
declare
  v_role text;
  v_exists boolean;
  v_item jsonb;
  v_day text;
  v_shift text;
  v_start time;
  v_end time;
begin
  -- 1. Check if employee exists and has role 'staff'
  select role, true into v_role, v_exists from public.employees where employee_id = p_employee_id;
  if not coalesce(v_exists, false) then
    return jsonb_build_object('ok', false, 'message', 'Employee not found.');
  end if;
  if v_role <> 'staff' then
    return jsonb_build_object('ok', false, 'message', 'Working schedule only applies to staff.');
  end if;

  -- 2. Validate selections is not empty
  if jsonb_array_length(p_selections) = 0 then
    return jsonb_build_object('ok', false, 'message', 'Staff must have at least one active shift.');
  end if;

  -- 3. Mark all current shifts of this employee as inactive
  update public.employee_schedules
  set status = 'inactive', updated_at = now()
  where employee_id = p_employee_id;

  -- 4. Upsert new selections
  for v_item in select * from jsonb_array_elements(p_selections) loop
    v_day := lower(v_item->>'dayOfWeek');
    v_shift := lower(v_item->>'shiftCode');

    if v_day not in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') then
      raise exception 'Invalid day of week: %', v_day;
    end if;

    if v_shift = 'shift_1' then
      v_start := '08:00:00'::time; v_end := '10:00:00'::time;
    elsif v_shift = 'shift_2' then
      v_start := '14:00:00'::time; v_end := '16:00:00'::time;
    elsif v_shift = 'shift_3' then
      v_start := '16:00:00'::time; v_end := '18:00:00'::time;
    elsif v_shift = 'shift_4' then
      v_start := '18:00:00'::time; v_end := '20:00:00'::time;
    else
      raise exception 'Invalid shift code: %', v_shift;
    end if;

    -- Upsert
    insert into public.employee_schedules (employee_id, day_of_week, shift_code, start_time, end_time, status)
    values (p_employee_id, v_day, v_shift, v_start, v_end, 'active')
    on conflict (employee_id, day_of_week, shift_code)
    do update set status = 'active', start_time = v_start, end_time = v_end, updated_at = now();
  end loop;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'message', SQLERRM);
end;
$$ language plpgsql security definer;
