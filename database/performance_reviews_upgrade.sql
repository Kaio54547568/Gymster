begin;

alter table public.performance_reviews
  add column if not exists review_type text,
  add column if not exists period_start date,
  add column if not exists period_end date,
  add column if not exists feedback_score numeric(5, 2) not null default 0,
  add column if not exists activity_score numeric(5, 2) not null default 0,
  add column if not exists admin_score numeric(5, 2) not null default 0,
  add column if not exists final_score numeric(5, 2) not null default 0,
  add column if not exists activity_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists feedback_breakdown jsonb,
  add column if not exists comment text not null default '',
  add column if not exists created_by uuid references public.users(user_id) on delete set null;

update public.performance_reviews pr
set review_type = case when e.role = 'trainer' then 'trainer' else 'staff' end,
    final_score = coalesce(pr.score, 0),
    admin_score = coalesce(pr.score, 0),
    comment = coalesce(pr.goals, '')
from public.employees e
where e.employee_id = pr.employee_id
  and (pr.review_type is null or pr.review_type = '');

alter table public.performance_reviews
  drop constraint if exists performance_reviews_review_type_check;
alter table public.performance_reviews
  add constraint performance_reviews_review_type_check
  check (review_type in ('staff', 'trainer'));

alter table public.performance_reviews
  drop constraint if exists performance_reviews_period_check;
alter table public.performance_reviews
  add constraint performance_reviews_period_check
  check (period_start is null or period_end is null or period_end >= period_start);

alter table public.performance_reviews
  drop constraint if exists performance_reviews_scores_check;
alter table public.performance_reviews
  add constraint performance_reviews_scores_check check (
    feedback_score between 0 and 100
    and activity_score between 0 and 100
    and admin_score between 0 and 100
    and final_score between 0 and 100
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'uq_performance_review_employee_type_period'
      and conrelid = 'public.performance_reviews'::regclass
  ) then
    alter table public.performance_reviews
      add constraint uq_performance_review_employee_type_period
      unique (employee_id, review_type, period_start, period_end);
  end if;
end;
$$;

create index if not exists idx_performance_reviews_period
  on public.performance_reviews(period_start, period_end);

alter table public.complaints
  add column if not exists resolved_by_employee_id uuid references public.employees(employee_id) on delete set null;

alter table public.maintenance_reports
  add column if not exists resolved_by_employee_id uuid references public.employees(employee_id) on delete set null;

create index if not exists idx_complaints_resolved_by
  on public.complaints(resolved_by_employee_id, resolved_at);
create index if not exists idx_maintenance_reports_resolved_by
  on public.maintenance_reports(resolved_by_employee_id, resolved_at);
create index if not exists idx_payments_reviewed_by
  on public.payments(reviewed_by_employee_id, reviewed_at);
create index if not exists idx_feedback_responded_by
  on public.service_feedback(responded_by_employee_id, responded_at);
create index if not exists idx_maintenance_records_handled_by
  on public.maintenance_records(handled_by_employee_id, completed_at);

commit;
