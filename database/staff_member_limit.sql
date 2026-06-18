alter table public.employees
add column if not exists member_limit integer not null default 10 check (member_limit >= 0);

update public.employees
set member_limit = 10
where role = 'staff';
