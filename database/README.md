# Gymster Database Design

This folder contains the PostgreSQL-compatible database design files for the Gymster MVP. These files are intended for Supabase SQL Editor. Frontend pages connect through the service files under `frontend/src/services`.

## Files

- `schema.sql` - Creates the MVP tables, constraints, foreign keys, indexes, and `updated_at` triggers.
- `seed.sql` - Inserts initial records for users, employees, trainers, packages, package features, members, member packages, training requests, payments, invoices, workout sessions, notifications, and the extended portal tables.

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

All table and column names use `snake_case`. Primary keys are UUIDs. Tables that are expected to change over time include `created_at` and `updated_at` columns.

## Running In Supabase SQL Editor

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Create a new query.
4. Copy the full contents of `database/schema.sql` into the editor.
5. Click **Run**.
6. Create another new query.
7. Copy the full contents of `database/seed.sql` into the editor.
8. Click **Run**.

Run `schema.sql` before `seed.sql`. The seed file depends on tables, constraints, and foreign keys created by the schema file.

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
- Feedback Management: `service_feedback`, `complaints`
- Equipment Status: `equipment`, `rooms`, `maintenance_reports`
- Profile / Settings: `users`, `employees`, `notifications`

### Admin/Owner

- Executive Dashboard: `users`, `members`, `employees`, `packages`, `payments`, `workout_sessions`
- Revenue Analytics: `payments`, `invoices`, `packages`, `member_packages`
- Membership Analytics: `members`, `member_packages`, `packages`, `package_change_requests`
- Staff & Trainer Management: `users`, `employees`, `trainers`, `trainer_assignments`
- Employee Scheduling: `employee_schedules`, `employees`, `rooms`
- Performance Evaluation: `performance_reviews`, `employees`, `trainers`
- Payroll / Salary Slip: `payroll_periods`, `payslips`, `employees`
- Equipment Management: `equipment`, `rooms`, `maintenance_reports`, `maintenance_records`
- Maintenance Tracking: `maintenance_reports`, `maintenance_records`, `equipment`
- Feedback & Satisfaction: `service_feedback`, `complaints`
- Packages & Payments: `packages`, `package_features`, `payments`, `invoices`
- Profile / Settings: `users`, `employees`, `notifications`

## Notes

- This schema creates a public `users` table for the Gymster app data model. It does not configure Supabase Auth or connect to `auth.users` yet.
- The schema includes compatibility columns used by the current frontend migration, such as `users.first_name`, `users.last_name`, `packages.is_active`, `member_packages.used_sessions`, `member_packages.remaining_sessions`, `payments.payment_date`, `payments.transaction_code`, and `workout_sessions.session_title`.
- Initial RLS policies are created for frontend-only MVP testing. Replace them with authenticated, role-aware policies before production.
- Seed passwords are placeholder strings and must not be used for real authentication.
- Payment rows are application records. No real payment provider is integrated yet.
- The schema uses text fields with check constraints for statuses so the app can evolve without managing PostgreSQL enum migrations early.
- Re-running `schema.sql` is designed to be mostly safe because tables and indexes use `if not exists`; trigger definitions are refreshed.
- Re-running `seed.sql` updates the fixed UUID rows through `on conflict`.

## Suggested Next Step

For full backend integration, migrate each portal by feature:

1. Member: package, schedule, trainers, feedback, profile, settings.
2. Trainer/PT: assigned members, schedule, progress, workout plans, meal plans.
3. Staff: member management, renewal requests, receipts, feedback, equipment.
4. Admin/Owner: revenue, membership analytics, staff scheduling, payroll, equipment, maintenance, feedback.
