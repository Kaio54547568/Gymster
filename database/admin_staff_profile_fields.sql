alter table public.employees
add column if not exists gender text check (gender in ('male', 'female', 'other', 'unspecified'));

alter table public.employees
add column if not exists date_of_birth date;

alter table public.employees
add column if not exists member_limit integer not null default 10 check (member_limit >= 0);

alter table public.employees
add column if not exists current_active_members integer not null default 0 check (current_active_members >= 0);

update public.employees
set member_limit = 10
where role = 'staff';
