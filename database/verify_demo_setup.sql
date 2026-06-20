-- Read-only verification for the Gymster demo database.
-- Run after schema.sql, member_payment_verification_upgrade.sql, seed.sql,
-- and demo_payment_checkout_upgrade.sql.

with required_columns(table_name, column_name) as (
  values
    ('employee_schedules', 'day_of_week'),
    ('employee_schedules', 'shift_code'),
    ('payments', 'proof_storage_path'),
    ('payments', 'proof_submitted_at'),
    ('member_packages', 'selected_slots'),
    ('equipment', 'origin'),
    ('equipment', 'warranty_expiry_date')
)
select
  rc.table_name,
  rc.column_name,
  case when c.column_name is not null then 'ok' else 'missing' end as status
from required_columns rc
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = rc.table_name
 and c.column_name = rc.column_name
order by rc.table_name, rc.column_name;

select
  tg.tgname as trigger_name,
  case tg.tgenabled
    when 'O' then 'enabled'
    when 'D' then 'disabled'
    when 'R' then 'replica'
    when 'A' then 'always'
    else tg.tgenabled::text
  end as status
from pg_trigger tg
join pg_class tbl on tbl.oid = tg.tgrelid
join pg_namespace ns on ns.oid = tbl.relnamespace
where ns.nspname = 'public'
  and tbl.relname = 'package_change_requests'
  and tg.tgname = 'check_package_change_request';

select
  to_regprocedure(
    'public.gymster_approve_payment_request(uuid)'
  ) is not null as payment_approval_rpc_installed,
  to_regprocedure(
    'public.gymster_complete_demo_payment(uuid,uuid,uuid,text,jsonb,text,text)'
  ) is not null as demo_checkout_rpc_installed;

select 'users' as entity, count(*) as row_count from public.users
union all
select 'members', count(*) from public.members
union all
select 'packages', count(*) from public.packages
union all
select 'employee_schedules', count(*) from public.employee_schedules
union all
select 'payments', count(*) from public.payments;
