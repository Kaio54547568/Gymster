-- Read-only verification for the standalone Gymster demo kit.
-- Run after:
--   00_reset_public.sql
--   01_complete_schema.sql
--   02_demo_seed.sql
--   npm run sync:auth-users

with checks(check_name, actual_value, expected_value) as (
  values
    ('users_total', (select count(*)::text from public.users), '12'),
    ('owner_total', (select count(*)::text from public.users where role='owner'), '1'),
    ('admin_total', (select count(*)::text from public.users where role='admin'), '1'),
    ('staff_total', (select count(*)::text from public.users where role='staff'), '2'),
    ('trainer_users_total', (select count(*)::text from public.users where role='trainer'), '2'),
    ('member_users_total', (select count(*)::text from public.users where role='member'), '6'),
    ('employees_total', (select count(*)::text from public.employees), '6'),
    ('trainers_total', (select count(*)::text from public.trainers), '2'),
    ('members_total', (select count(*)::text from public.members), '6'),
    ('packages_total', (select count(*)::text from public.packages), '5'),
    ('promotions_total', (select count(*)::text from public.package_promotions), '3'),
    ('rooms_total', (select count(*)::text from public.rooms), '3'),
    ('equipment_total', (select count(*)::text from public.equipment), '8'),
    ('member_packages_total', (select count(*)::text from public.member_packages), '6'),
    ('active_packages_total', (select count(*)::text from public.member_packages where status='active'), '4'),
    ('pending_activation_total', (select count(*)::text from public.member_packages where status='pending_activation'), '1'),
    ('expired_packages_total', (select count(*)::text from public.member_packages where status='expired'), '1'),
    ('members_without_package', (
      select count(*)::text from public.members m
      where not exists (select 1 from public.member_packages mp where mp.member_id=m.member_id)
    ), '1'),
    ('payments_paid', (select count(*)::text from public.payments where payment_status='paid'), '4'),
    ('payments_pending', (select count(*)::text from public.payments where payment_status='pending'), '1'),
    ('payments_refunded', (select count(*)::text from public.payments where payment_status='refunded'), '1'),
    ('trainer_reservations_reserved', (select count(*)::text from public.trainer_slot_reservations where status='reserved'), '1'),
    ('auth_links_complete', (select count(*)::text from public.users where auth_user_id is not null), '12'),
    ('auth_users_matched', (
      select count(*)::text
      from public.users u join auth.users au on au.id=u.auth_user_id and lower(au.email)=lower(u.email)
    ), '12')
)
select
  check_name,
  actual_value,
  expected_value,
  case when actual_value=expected_value then 'ok' else 'ERROR' end as status
from checks
order by check_name;

-- Required schema and RPC checks.
with required_objects(object_name, installed) as (
  values
    ('package_promotions table', to_regclass('public.package_promotions') is not null),
    ('trainer_slot_reservations table', to_regclass('public.trainer_slot_reservations') is not null),
    ('performance_reviews table', to_regclass('public.performance_reviews') is not null),
    ('member_usage_history table', to_regclass('public.member_usage_history') is not null),
    ('activate member RPC', to_regprocedure('public.gymster_activate_member_account(uuid,uuid)') is not null),
    ('replace staff schedule RPC', to_regprocedure('public.replace_staff_schedule(uuid,jsonb)') is not null),
    ('add workout RPC', to_regprocedure('public.gymster_add_workout_rpc(uuid,date,text,text,text)') is not null),
    ('cancel workout RPC', to_regprocedure('public.gymster_cancel_workout_rpc(uuid,uuid)') is not null),
    ('lifecycle RPC', to_regprocedure('public.gymster_sync_member_package_lifecycle(uuid)') is not null),
    ('package purchase RPC', to_regprocedure('public.gymster_complete_package_purchase(uuid,uuid,uuid,text,jsonb,text,text)') is not null),
    ('payment approval RPC', to_regprocedure('public.gymster_approve_payment_request(uuid)') is not null)
)
select object_name, case when installed then 'ok' else 'ERROR' end as status
from required_objects
order by object_name;

-- Uniqueness checks.
with duplicate_checks(check_name, duplicate_groups) as (
  values
    ('duplicate_email', (
      select count(*) from (
        select lower(email) from public.users group by lower(email) having count(*)>1
      ) d
    )),
    ('duplicate_username', (
      select count(*) from (
        select lower(username) from public.users where username is not null
        group by lower(username) having count(*)>1
      ) d
    )),
    ('duplicate_phone', (
      select count(*) from (
        select phone_number from public.users where phone_number is not null
        group by phone_number having count(*)>1
      ) d
    )),
    ('duplicate_member_code', (
      select count(*) from (
        select lower(member_code) from public.members group by lower(member_code) having count(*)>1
      ) d
    )),
    ('duplicate_citizen_id', (
      select count(*) from (
        select citizen_id from public.members where citizen_id is not null
        group by citizen_id having count(*)>1
      ) d
    ))
)
select check_name, duplicate_groups,
  case when duplicate_groups=0 then 'ok' else 'ERROR' end as status
from duplicate_checks;

-- Orphan and invariant checks.
with integrity_checks(check_name, problem_rows) as (
  values
    ('members_without_user', (
      select count(*) from public.members m
      left join public.users u on u.user_id=m.user_id where u.user_id is null
    )),
    ('trainers_without_employee', (
      select count(*) from public.trainers t
      left join public.employees e on e.employee_id=t.employee_id where e.employee_id is null
    )),
    ('member_packages_without_member', (
      select count(*) from public.member_packages mp
      left join public.members m on m.member_id=mp.member_id where m.member_id is null
    )),
    ('payments_without_member', (
      select count(*) from public.payments p
      left join public.members m on m.member_id=p.member_id where m.member_id is null
    )),
    ('payment_amount_snapshot_mismatch', (
      select count(*) from public.payments
      where final_amount is not null and amount<>final_amount
    )),
    ('multiple_active_packages', (
      select count(*) from (
        select member_id from public.member_packages where status='active'
        group by member_id having count(*)>1
      ) d
    )),
    ('multiple_pending_activation_packages', (
      select count(*) from (
        select member_id from public.member_packages where status='pending_activation'
        group by member_id having count(*)>1
      ) d
    )),
    ('reservation_has_real_assignment', (
      select count(*) from public.trainer_slot_reservations r
      join public.trainer_assignments a on a.member_package_id=r.member_package_id
      where r.status='reserved' and a.status='active'
    )),
    ('inactive_or_future_promotion_applied_today', (
      select count(*) from public.payments pay
      join public.package_promotions p on p.promotion_id=pay.promotion_id
      where pay.applied_at::date=current_date
        and (p.status<>'active' or current_date not between p.start_date and p.end_date)
    ))
)
select check_name, problem_rows,
  case when problem_rows=0 then 'ok' else 'ERROR' end as status
from integrity_checks;

-- Storage checks.
select required.bucket_id,
  case when b.id is not null then 'ok' else 'ERROR' end as status
from (values ('payment-proofs'),('pics')) required(bucket_id)
left join storage.buckets b on b.id=required.bucket_id
order by required.bucket_id;
