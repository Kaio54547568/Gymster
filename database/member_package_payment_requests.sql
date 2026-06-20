alter table public.member_packages
  add column if not exists selected_schedule text,
  add column if not exists selected_slots jsonb not null default '[]'::jsonb;

create index if not exists idx_member_packages_selected_trainer
  on public.member_packages(trainer_id, status);
