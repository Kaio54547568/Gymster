# Gymster Database Design

> For a small, fully independent demo reset with real Supabase Auth accounts,
> use [`database/demo/README.md`](demo/README.md). That installer does not use
> the large legacy `seed.sql` dataset.

This folder contains the PostgreSQL-compatible database design files for the Gymster MVP. These files are intended for Supabase SQL Editor. Frontend pages connect through the service files under `frontend/src/services`.

## Files

- `schema.sql` - Creates the MVP tables, constraints, foreign keys, indexes, and `updated_at` triggers.
- `seed.sql` - Rebuilds a complete coherent demo dataset for users, settings, employees, trainers, packages, members, PT schedules, payments, invoices, workout sessions, training requests, makeup sessions, notifications, and the extended portal tables.

## Scope

The schema covers the core MVP tables:

- `users`
- `members`
- `trainers`
- `employees`
- `packages`
- `package_features`
- `member_packages`
- `training_requests`
- `payments`
- `invoices`
- `workout_sessions`
- `notifications`

It also includes extension tables needed to migrate the remaining portal features away from application data:

- `rooms`
- `equipment`
- `maintenance_reports`
- `maintenance_records`
- `service_feedback`
- `complaints`
- `employee_schedules`
- `payroll_periods`
- `payslips`
- `performance_reviews`
- `trainer_assignments`
- `training_goals`
- `progress_records`
- `body_metrics`
- `medical_records`
- `workout_plans`
- `workout_plan_exercises`
- `meal_plans`
- `meal_plan_assignments`
- `package_change_requests`
- `member_usage_history`
- `user_settings`
- `trainer_weekly_availability`
- `medical_history_requests`
- `makeup_sessions`

All table and column names use `snake_case`. Primary keys are UUIDs. Tables that are expected to change over time include `created_at` and `updated_at` columns.

## Running In Supabase SQL Editor

### Fresh local/demo setup

1. Open your Supabase project and go to **SQL Editor**.
2. Run `database/reset_demo_schema.sql`. This deletes all data and objects in
   the `public` schema; use it only for a demo/development reset.
3. Run `database/schema.sql`.
4. Run `database/member_payment_verification_upgrade.sql` to install the
   payment-proof bucket and payment approval RPC.
5. Run `database/seed.sql`.
6. Run `database/demo_payment_checkout_upgrade.sql` to install the atomic
   immediate demo-payment checkout and close any retired pending requests.
7. Run `database/verify_demo_setup.sql`. Every required column
    should report `ok`, the package-change trigger should report `enabled`, and
    both RPC checks should return `true`.

For a fresh database, the required order is:
`reset_demo_schema.sql` -> `schema.sql` ->
`member_payment_verification_upgrade.sql` -> `seed.sql` ->
`demo_payment_checkout_upgrade.sql` -> `verify_demo_setup.sql`. Do not run
`employee_schedules_weekly_upgrade.sql` after `schema.sql` on a fresh database;
the weekly schedule model is already included in the main schema.

### Existing database upgrade setup

If your Supabase project already existed before the latest Gymster updates, run the upgrade files before reseeding:

1. Back up any data you need to keep.
2. `database/schema.sql`
3. `database/member_care_upgrade.sql`
4. `database/ai_makeup_booking_upgrade.sql`
5. `database/workout_plan_crud_upgrade.sql`
6. `database/member_manual_workout_upgrade.sql`
7. `database/training_request_cancel_reschedule_upgrade.sql`
8. `database/production_cleanup.sql` if you want the optional production support columns.
9. `database/member_payment_verification_upgrade.sql`
10. `database/seed.sql` only if you intentionally want to erase and rebuild demo data.
11. `database/demo_payment_checkout_upgrade.sql`
12. `database/password_reset_verification.sql` if using email-code password reset.
13. Create the `pics` storage bucket, then run `database/storage_pics_policies.sql` if using avatar/image upload.

`member_activation_rpc.sql` is kept for older databases; the current `schema.sql` already defines the activation RPC, but rerunning the standalone file is safe when you want to refresh that function.

## Portal Feature Table Map

### Member

- Dashboard: `member_packages`, `workout_sessions`, `payments`, `notifications`
- My Package: `member_packages`, `packages`, `payments`, `invoices`, `package_change_requests`
- My Schedule: `workout_sessions`, `rooms`, `trainer_assignments`
- Trainers: `trainers`, `trainer_assignments`, `training_requests`
- Rate Service: `service_feedback`, `complaints`
- Profile / Settings: `users`, `members`, `notifications`

### Trainer/PT

- Dashboard: `trainer_assignments`, `workout_sessions`, `training_requests`, `progress_records`
- Manage Trainees: `trainer_assignments`, `members`, `member_packages`, `medical_records`, `body_metrics`
- Schedule & Progress: `workout_sessions`, `progress_records`, `training_goals`
- Workout Guidance: `workout_plans`, `workout_plan_exercises`
- Progress Evaluation: `performance_reviews`, `progress_records`, `body_metrics`
- Meal Plans: `meal_plans`, `meal_plan_assignments`
- Profile / Settings: `users`, `employees`, `trainers`, `notifications`

### Staff

- Dashboard: `members`, `member_packages`, `payments`, `maintenance_reports`, `notifications`
- Add Member / Member List / Member Detail: `users`, `members`, `member_packages`, `payments`
- Renewal Requests: `package_change_requests`, `member_packages`, `payments`, `invoices`
- Receipt / Usage History: `payments`, `invoices`, `member_usage_history`, `workout_sessions`
- Immediate demo checkout: run `database/demo_payment_checkout_upgrade.sql`.
  Staff reviews completed transactions at Payment History; approval/rejection is retired.
- Feedback Management: `service_feedback`, `complaints`
- Equipment Status: `equipment`, `rooms`, `maintenance_reports`
- Profile / Settings: `users`, `employees`, `notifications`

### Admin/Owner

- Executive Dashboard: `users`, `members`, `employees`, `packages`, `payments`, `workout_sessions`
- Revenue Analytics: `payments`, `invoices`, `packages`, `member_packages`
- Membership Analytics: `members`, `member_packages`, `packages`, `package_change_requests`
- Staff & Trainer Management: `users`, `employees`, `trainers`, `trainer_assignments`
- Employee Scheduling: `employee_schedules`, `employees`, `rooms`
- Performance Evaluation: `performance_reviews`, `employees`, `trainers`; run `database/performance_reviews_upgrade.sql` before enabling the Performance tab on an existing database.
  Staff and trainer reviews share the same final weighting: 60% objective score and 40% admin score. Trainer objective score blends 70% training operations with 30% member feedback adjusted by review-count confidence.
- Payroll / Salary Slip: `payroll_periods`, `payslips`, `employees`
- Equipment Management: `equipment`, `rooms`, `maintenance_reports`, `maintenance_records`
- Maintenance Tracking: `maintenance_reports`, `maintenance_records`, `equipment`
- Feedback & Satisfaction: `service_feedback`, `complaints`
- Package: `packages`, `package_features`, `package_promotions`, `member_packages`, `payments`, `invoices`, `trainer_slot_reservations`.
  Run `database/package_promotions_purchase_upgrade.sql` on an existing database to enable promotion snapshots, pending activation, and deferred PT reservations.
- Profile / Settings: `users`, `employees`, `notifications`

## Notes

- This schema creates a public `users` table for the Gymster app data model. It does not configure Supabase Auth or connect to `auth.users` yet.
- The schema includes compatibility columns used by the current frontend migration, such as `users.first_name`, `users.last_name`, `packages.is_active`, `member_packages.used_sessions`, `member_packages.remaining_sessions`, `payments.payment_date`, `payments.transaction_code`, and `workout_sessions.session_title`.
- Initial RLS policies are created for frontend-only MVP testing. Replace them with authenticated, role-aware policies before production.
- Seed passwords are placeholder strings and must not be used for real authentication.
- Payment rows are application records. No real payment provider is integrated yet.
- The schema uses text fields with check constraints for statuses so the app can evolve without managing PostgreSQL enum migrations early.
- Re-running `schema.sql` is designed to be mostly safe because tables and indexes use `if not exists`; trigger definitions are refreshed.
- Re-running `seed.sql` truncates the app-owned demo tables and rebuilds a clean local/demo dataset. Do not run it against production data you want to keep.
- During demo reset, `seed.sql` temporarily disables only the app-owned
  `check_package_change_request` business trigger. It never disables PostgreSQL
  foreign-key/system triggers.

## Suggested Next Step

For full backend integration, migrate each portal by feature:

1. Member: package, schedule, trainers, feedback, profile, settings.
2. Trainer/PT: assigned members, schedule, progress, workout plans, meal plans.
3. Staff: member management, renewal requests, receipts, feedback, equipment.
4. Admin/Owner: revenue, membership analytics, staff scheduling, payroll, equipment, maintenance, feedback.
