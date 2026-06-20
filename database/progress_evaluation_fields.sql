-- Progress Evaluation for PT portal.
-- Reuse existing progress_records/body_metrics tables to avoid duplicated progress data.
alter table public.progress_records
  add column if not exists progress_text text,
  add column if not exists comment text,
  add column if not exists next_goal text;

alter table public.body_metrics
  add column if not exists blood_pressure text,
  add column if not exists resting_heart_rate integer check (resting_heart_rate is null or resting_heart_rate >= 0);

create index if not exists idx_progress_records_member_trainer_date
  on public.progress_records(member_id, trainer_id, record_date desc);
