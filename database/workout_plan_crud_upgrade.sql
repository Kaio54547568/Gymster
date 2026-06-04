-- Run this once on an existing Gymster database.
-- It allows reusable workout templates and preserves each exercise's rest time.

alter table public.workout_plans
alter column member_id drop not null;

alter table public.workout_plan_exercises
add column if not exists rest_seconds integer
check (rest_seconds is null or rest_seconds >= 0);
