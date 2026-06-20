begin;

alter table public.member_usage_history
  add column if not exists check_in_date date,
  add column if not exists checked_in_by_employee_id uuid
    references public.employees(employee_id) on delete set null;

update public.member_usage_history
set check_in_date = (usage_date at time zone 'Asia/Ho_Chi_Minh')::date
where usage_type = 'check_in'
  and check_in_date is null;

delete from public.member_usage_history older
using public.member_usage_history newer
where older.usage_type = 'check_in'
  and newer.usage_type = 'check_in'
  and older.member_id = newer.member_id
  and older.check_in_date = newer.check_in_date
  and older.member_usage_history_id < newer.member_usage_history_id;

create unique index if not exists uq_member_daily_check_in
  on public.member_usage_history(member_id, check_in_date)
  where usage_type = 'check_in';

create index if not exists idx_member_check_in_history
  on public.member_usage_history(member_id, check_in_date desc)
  where usage_type = 'check_in';

commit;
