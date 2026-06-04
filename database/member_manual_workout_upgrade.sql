-- Run once on an existing Gymster database.
-- Prevents a member-created workout from overlapping an active PT session.

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
