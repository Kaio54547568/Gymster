-- Gymster initial seed data.
-- Run after database/schema.sql.
--
-- This script resets all app tables and rebuilds a coherent business
-- dataset for member, trainer/PT, staff, and admin/owner workflows.
-- Seed passwords are stored as plain placeholder values for local development.

begin;

truncate table
  public.member_usage_history,
  public.package_change_requests,
  public.meal_plan_assignments,
  public.meal_plans,
  public.workout_plan_exercises,
  public.workout_plans,
  public.medical_records,
  public.body_metrics,
  public.progress_records,
  public.training_goals,
  public.trainer_assignments,
  public.performance_reviews,
  public.payslips,
  public.payroll_periods,
  public.employee_schedules,
  public.complaints,
  public.service_feedback,
  public.maintenance_records,
  public.maintenance_reports,
  public.equipment,
  public.rooms,
  public.notifications,
  public.workout_sessions,
  public.invoices,
  public.payments,
  public.training_requests,
  public.member_packages,
  public.package_features,
  public.packages,
  public.trainers,
  public.employees,
  public.members,
  public.users
restart identity cascade;

insert into public.users (
  user_id,
  email,
  username,
  password_hash,
  first_name,
  last_name,
  phone_number,
  date_of_birth,
  gender,
  role,
  headline,
  preferred_language,
  account_status,
  avatar_url,
  last_login_at
) values
  ('00000000-0000-4000-8000-000000000001', 'owner@gymster.local', 'owner01', 'Owner@123', 'Minh', 'Tran', '0901000001', date '1984-04-12', 'male', 'owner', 'Owns business strategy, revenue targets, and operating standards for Gymster District 1.', 'vi', 'active', null, now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000002', 'admin@gymster.local', 'admin01', 'Admin@123', 'Linh', 'Pham', '0901000002', date '1988-08-09', 'female', 'admin', 'Manages packages, payroll, reports, and staff performance across the club.', 'vi', 'active', null, now() - interval '1 hour'),
  ('00000000-0000-4000-8000-000000000003', 'staff@gymster.local', 'staff00', 'Staff@123', 'An', 'Nguyen', '0901000003', date '1994-02-20', 'female', 'staff', 'Handles front desk operations, memberships, payments, and member support.', 'vi', 'active', null, now() - interval '35 minutes'),
  ('00000000-0000-4000-8000-000000000004', 'trainer@gymster.local', 'trainer00', 'Trainer@123', 'Khoa', 'Le', '0901000004', date '1990-11-03', 'male', 'trainer', 'Strength coach focused on safe progression, form, and sustainable habits.', 'vi', 'active', null, now() - interval '20 minutes'),
  ('00000000-0000-4000-8000-000000000005', 'member@gymster.local', 'member00', 'Member@123', 'Mai', 'Do', '0901000005', date '1998-05-18', 'female', 'member', 'Active PT member training for strength, posture, and better weekly consistency.', 'vi', 'active', null, now() - interval '10 minutes');

insert into public.users (
  email,
  username,
  password_hash,
  first_name,
  last_name,
  phone_number,
  date_of_birth,
  gender,
  role,
  headline,
  preferred_language,
  account_status
) values
  ('staff01@gymster.local', 'staff01', 'Staff@123', 'Bao', 'Hoang', '0902000001', date '1993-01-15', 'male', 'staff', 'Front desk specialist for check-ins, renewals, and daily reports.', 'vi', 'active'),
  ('staff02@gymster.local', 'staff02', 'Staff@123', 'Chi', 'Vu', '0902000002', date '1996-07-24', 'female', 'staff', 'Member services staff responsible for onboarding and payment follow-up.', 'vi', 'active'),
  ('staff03@gymster.local', 'staff03', 'Staff@123', 'Duy', 'Pham', '0902000003', date '1991-12-04', 'male', 'staff', 'Operations staff coordinating rooms, equipment, and maintenance tickets.', 'vi', 'active'),
  ('staff04@gymster.local', 'staff04', 'Staff@123', 'Ha', 'Bui', '0902000004', date '1995-09-27', 'female', 'staff', 'Customer support staff handling feedback, complaints, and retention actions.', 'vi', 'active'),
  ('trainer01@gymster.local', 'trainer01', 'Trainer@123', 'Son', 'Dang', '0903000001', date '1989-03-16', 'male', 'trainer', 'Hypertrophy and strength trainer for intermediate lifters.', 'vi', 'active'),
  ('trainer02@gymster.local', 'trainer02', 'Trainer@123', 'Nhi', 'Tran', '0903000002', date '1992-10-05', 'female', 'trainer', 'Fat-loss and HIIT coach with habit-based nutrition guidance.', 'vi', 'active'),
  ('trainer03@gymster.local', 'trainer03', 'Trainer@123', 'Long', 'Vo', '0903000003', date '1987-06-22', 'male', 'trainer', 'Mobility and rehabilitation trainer for returning members.', 'vi', 'active'),
  ('trainer04@gymster.local', 'trainer04', 'Trainer@123', 'Vy', 'Lam', '0903000004', date '1994-04-30', 'female', 'trainer', 'Pilates, core stability, and posture correction coach.', 'vi', 'active'),
  ('trainer05@gymster.local', 'trainer05', 'Trainer@123', 'Huy', 'Phan', '0903000005', date '1991-09-14', 'male', 'trainer', 'Athletic conditioning coach for performance and endurance.', 'vi', 'active'),
  ('trainer06@gymster.local', 'trainer06', 'Trainer@123', 'Tara', 'Nguyen', '0903000006', date '1993-02-11', 'female', 'trainer', 'VIP transformation coach for long-term body recomposition.', 'en', 'active'),
  ('member01@gymster.local', 'member01', 'Member@123', 'Hanh', 'Nguyen', '0910000001', date '1997-01-07', 'female', 'member', 'Member focused on fat loss and better cardio endurance.', 'vi', 'active'),
  ('member02@gymster.local', 'member02', 'Member@123', 'Tuan', 'Pham', '0910000002', date '1995-02-13', 'male', 'member', 'Office worker building strength and improving posture.', 'vi', 'active'),
  ('member03@gymster.local', 'member03', 'Member@123', 'Luna', 'Ho', '0910000003', date '1999-03-20', 'female', 'member', 'Beginner learning consistent gym habits.', 'en', 'active'),
  ('member04@gymster.local', 'member04', 'Member@123', 'Quang', 'Le', '0910000004', date '1992-04-03', 'male', 'member', 'Member preparing for a 10K run.', 'vi', 'active'),
  ('member05@gymster.local', 'member05', 'Member@123', 'Thao', 'Bui', '0910000005', date '1996-05-25', 'female', 'member', 'PT member working on mobility after a knee strain.', 'vi', 'active'),
  ('member06@gymster.local', 'member06', 'Member@123', 'Nam', 'Do', '0910000006', date '1990-06-18', 'male', 'member', 'Long-term member on annual gym access.', 'vi', 'active'),
  ('member07@gymster.local', 'member07', 'Member@123', 'Anh', 'Vo', '0910000007', date '2000-07-09', 'female', 'member', 'Student member training three evenings per week.', 'vi', 'active'),
  ('member08@gymster.local', 'member08', 'Member@123', 'Kiet', 'Tran', '0910000008', date '1988-08-29', 'male', 'member', 'VIP PT member targeting body recomposition.', 'vi', 'active'),
  ('member09@gymster.local', 'member09', 'Member@123', 'Oanh', 'Dang', '0910000009', date '1994-09-11', 'female', 'member', 'Member maintaining fitness after weight loss.', 'vi', 'active'),
  ('member10@gymster.local', 'member10', 'Member@123', 'Phuc', 'Huynh', '0910000010', date '1993-10-21', 'male', 'member', 'Strength-focused member with evening PT sessions.', 'vi', 'active'),
  ('member11@gymster.local', 'member11', 'Member@123', 'Trang', 'Ly', '0910000011', date '1998-11-05', 'female', 'member', 'Member waiting for payment confirmation after onboarding.', 'vi', 'pending_payment'),
  ('member12@gymster.local', 'member12', 'Member@123', 'Viet', 'Mai', '0910000012', date '1989-12-17', 'male', 'member', 'Pending PT approval for selected trainer.', 'vi', 'pending_pt_approval'),
  ('member13@gymster.local', 'member13', 'Member@123', 'Ngan', 'Pham', '0910000013', date '2001-01-28', 'female', 'member', 'New member still completing onboarding details.', 'vi', 'pending_onboarding'),
  ('member14@gymster.local', 'member14', 'Member@123', 'Bao', 'Le', '0910000014', date '1986-02-06', 'male', 'member', 'Member with expired package ready for renewal.', 'vi', 'active'),
  ('member15@gymster.local', 'member15', 'Member@123', 'My', 'Tran', '0910000015', date '1997-03-19', 'female', 'member', 'Member paused due to travel schedule.', 'vi', 'active'),
  ('member16@gymster.local', 'member16', 'Member@123', 'Lam', 'Nguyen', '0910000016', date '1991-04-23', 'male', 'member', 'Inactive member for retention testing.', 'vi', 'inactive'),
  ('member17@gymster.local', 'member17', 'Member@123', 'Yen', 'Hoang', '0910000017', date '1995-05-08', 'female', 'member', 'Suspended account for policy workflow testing.', 'vi', 'suspended'),
  ('member18@gymster.local', 'member18', 'Member@123', 'Dat', 'Vu', '0910000018', date '1992-06-14', 'male', 'member', 'Annual gym member with regular check-ins.', 'vi', 'active'),
  ('member19@gymster.local', 'member19', 'Member@123', 'Loan', 'Dao', '0910000019', date '1998-07-30', 'female', 'member', 'Member recently upgraded to VIP PT.', 'vi', 'active'),
  ('member20@gymster.local', 'member20', 'Member@123', 'Rin', 'Kao', '0910000020', date '1994-08-12', 'other', 'member', 'English-speaking member using flexible PT slots.', 'en', 'active'),
  ('member21@gymster.local', 'member21', 'Member@123', 'Binh', 'Ngo', '0910000021', date '1987-09-04', 'male', 'member', 'Returning member renewing after a break.', 'vi', 'active'),
  ('member22@gymster.local', 'member22', 'Member@123', 'Nhu', 'Dinh', '0910000022', date '1999-10-16', 'female', 'member', 'Beginner PT member focused on confidence and form.', 'vi', 'active'),
  ('member23@gymster.local', 'member23', 'Member@123', 'Quan', 'Ta', '0910000023', date '1990-11-27', 'male', 'member', 'Member with pending upgrade request.', 'vi', 'active'),
  ('member24@gymster.local', 'member24', 'Member@123', 'Mina', 'Lee', '0910000024', date '1996-12-02', 'female', 'member', 'Cancelled member kept for historical analytics.', 'en', 'cancelled');

insert into public.employees (
  user_id,
  employee_code,
  full_name,
  email,
  phone_number,
  role,
  department,
  hire_date,
  base_salary,
  status
)
select
  u.user_id,
  e.employee_code,
  e.full_name,
  u.email,
  u.phone_number,
  e.role,
  e.department,
  e.hire_date,
  e.base_salary,
  e.status
from (
  values
    ('owner@gymster.local', 'EMP-OWN-001', 'Minh Tran', 'owner', 'Executive', date '2023-01-01', 45000000::numeric, 'active'),
    ('admin@gymster.local', 'EMP-ADM-001', 'Linh Pham', 'admin', 'Management', date '2023-02-01', 32000000::numeric, 'active'),
    ('staff@gymster.local', 'EMP-STF-001', 'An Nguyen', 'staff', 'Front Desk', date '2024-01-15', 13500000::numeric, 'active'),
    ('staff01@gymster.local', 'EMP-STF-002', 'Bao Hoang', 'staff', 'Front Desk', date '2024-02-10', 12800000::numeric, 'active'),
    ('staff02@gymster.local', 'EMP-STF-003', 'Chi Vu', 'staff', 'Member Services', date '2024-03-01', 13200000::numeric, 'active'),
    ('staff03@gymster.local', 'EMP-STF-004', 'Duy Pham', 'staff', 'Operations', date '2023-11-20', 14200000::numeric, 'active'),
    ('staff04@gymster.local', 'EMP-STF-005', 'Ha Bui', 'staff', 'Customer Experience', date '2024-04-08', 12600000::numeric, 'active'),
    ('trainer@gymster.local', 'EMP-PT-001', 'Khoa Le', 'trainer', 'Personal Training', date '2023-05-05', 22000000::numeric, 'active'),
    ('trainer01@gymster.local', 'EMP-PT-002', 'Son Dang', 'trainer', 'Personal Training', date '2023-07-12', 20500000::numeric, 'active'),
    ('trainer02@gymster.local', 'EMP-PT-003', 'Nhi Tran', 'trainer', 'Personal Training', date '2023-08-01', 19800000::numeric, 'active'),
    ('trainer03@gymster.local', 'EMP-PT-004', 'Long Vo', 'trainer', 'Personal Training', date '2024-01-02', 21000000::numeric, 'active'),
    ('trainer04@gymster.local', 'EMP-PT-005', 'Vy Lam', 'trainer', 'Personal Training', date '2024-02-14', 19000000::numeric, 'active'),
    ('trainer05@gymster.local', 'EMP-PT-006', 'Huy Phan', 'trainer', 'Personal Training', date '2023-09-18', 21500000::numeric, 'active'),
    ('trainer06@gymster.local', 'EMP-PT-007', 'Tara Nguyen', 'trainer', 'VIP Coaching', date '2023-10-30', 24500000::numeric, 'active')
) as e(email, employee_code, full_name, role, department, hire_date, base_salary, status)
join public.users u on u.email = e.email;

insert into public.trainers (
  user_id,
  employee_id,
  trainer_code,
  full_name,
  specialty,
  bio,
  rating,
  current_active_members,
  max_active_members,
  available_schedule_slots,
  available_slots,
  status
)
select
  u.user_id,
  e.employee_id,
  t.trainer_code,
  t.full_name,
  t.specialty,
  t.bio,
  t.rating,
  t.current_active_members,
  t.max_active_members,
  t.slots::jsonb,
  t.slots::jsonb,
  t.status
from (
  values
    ('trainer@gymster.local', 'PT-001', 'Khoa Le', 'Strength Training', 'Builds progressive strength programs with careful form checks and clear session notes.', 4.90::numeric, 7, 12, '["Mon 18:00-19:00","Wed 18:00-19:00","Fri 18:00-19:00","Sat 09:00-10:00"]', 'active'),
    ('trainer01@gymster.local', 'PT-002', 'Son Dang', 'Hypertrophy', 'Specializes in muscle gain, free weights, and structured overload plans.', 4.75::numeric, 8, 12, '["Tue 19:00-20:00","Thu 19:00-20:00","Sun 08:00-09:00"]', 'active'),
    ('trainer02@gymster.local', 'PT-003', 'Nhi Tran', 'Weight Loss and HIIT', 'Combines HIIT, nutrition habits, and accountability for fat-loss members.', 4.85::numeric, 10, 10, '["Mon 07:00-08:00","Wed 07:00-08:00","Fri 07:00-08:00"]', 'full'),
    ('trainer03@gymster.local', 'PT-004', 'Long Vo', 'Mobility and Recovery', 'Works with restricted movements, return-to-training plans, and low-impact progressions.', 4.65::numeric, 6, 10, '["Tue 18:00-19:00","Thu 18:00-19:00","Sat 10:00-11:00"]', 'active'),
    ('trainer04@gymster.local', 'PT-005', 'Vy Lam', 'Pilates and Core', 'Focuses on posture, core control, balance, and beginner-friendly confidence.', 4.70::numeric, 5, 10, '["Mon 12:00-13:00","Wed 12:00-13:00","Sat 15:00-16:00"]', 'active'),
    ('trainer05@gymster.local', 'PT-006', 'Huy Phan', 'Athletic Conditioning', 'Builds conditioning blocks for runners and sport-focused members.', 4.60::numeric, 7, 12, '["Tue 06:30-07:30","Thu 06:30-07:30","Sun 09:00-10:00"]', 'active'),
    ('trainer06@gymster.local', 'PT-007', 'Tara Nguyen', 'VIP Transformation', 'Runs VIP body recomposition programs with monthly metrics reviews.', 4.95::numeric, 9, 10, '["Mon 20:00-21:00","Wed 20:00-21:00","Fri 20:00-21:00"]', 'active')
) as t(email, trainer_code, full_name, specialty, bio, rating, current_active_members, max_active_members, slots, status)
join public.users u on u.email = t.email
join public.employees e on e.user_id = u.user_id;

insert into public.packages (
  package_code,
  package_name,
  package_type,
  duration_months,
  price,
  description,
  session_limit,
  has_personal_trainer,
  is_popular,
  is_active,
  status
) values
  ('GYM-1M', 'Gym Access 1 Month', 'gym', 1, 390000, 'Monthly access to gym floor, locker room, and basic check-in tracking.', null, false, false, true, 'active'),
  ('GYM-3M', 'Gym Access 3 Months', 'gym', 3, 990000, 'Quarterly gym membership for members building a routine.', null, false, false, true, 'active'),
  ('GYM-6M', 'Gym Access 6 Months', 'gym', 6, 1750000, 'Semiannual membership with better price per month.', null, false, true, true, 'active'),
  ('GYM-12M', 'Gym Access 12 Months', 'gym', 12, 3150000, 'Annual access for long-term members and retention analytics.', null, false, true, true, 'active'),
  ('PT-1M', 'PT Starter 1 Month', 'pt', 1, 1800000, 'Eight private coaching sessions for beginners or short goals.', 8, true, false, true, 'active'),
  ('PT-3M', 'PT Progress 3 Months', 'pt', 3, 4800000, 'Twenty-four sessions with trainer assignment, goals, and progress records.', 24, true, true, true, 'active'),
  ('PT-6M', 'PT Performance 6 Months', 'pt', 6, 8600000, 'Forty-eight sessions for transformation, strength, or conditioning cycles.', 48, true, true, true, 'active'),
  ('VIP-PT-6M', 'VIP PT 6 Months', 'vip_pt', 6, 12800000, 'Sixty VIP sessions with priority trainer slots and monthly body metrics.', 60, true, true, true, 'active'),
  ('VIP-PT-12M', 'VIP PT 12 Months', 'vip_pt', 12, 22800000, 'Annual VIP coaching with premium scheduling and ongoing nutrition support.', 120, true, false, true, 'active'),
  ('GYM-OLD', 'Archived 2024 Gym Package', 'gym', 6, 1200000, 'Archived historical package for reporting filters.', null, false, false, false, 'archived');

insert into public.package_features (
  package_id,
  feature_name,
  feature_description,
  display_order
)
select
  p.package_id,
  f.feature_name,
  f.feature_description,
  f.display_order
from (
  values
    ('GYM-1M', 'Unlimited gym floor access', 'Access during operating hours.', 1),
    ('GYM-1M', 'Locker and shower access', 'Use member changing facilities.', 2),
    ('GYM-3M', 'Quarterly access', 'Three months of gym access.', 1),
    ('GYM-3M', 'Basic body metrics check', 'One optional staff-assisted measurement.', 2),
    ('GYM-6M', 'Popular gym membership', 'Six months access with better value.', 1),
    ('GYM-6M', 'Renewal reminder', 'Staff follow-up before expiry.', 2),
    ('GYM-12M', 'Annual access', 'Twelve months gym access.', 1),
    ('GYM-12M', 'Two body metrics checks', 'Quarterly check-in support.', 2),
    ('PT-1M', '8 PT sessions', 'Starter coaching package.', 1),
    ('PT-1M', 'Trainer approval workflow', 'PT must approve the request before activation.', 2),
    ('PT-3M', '24 PT sessions', 'Three training sessions per week for eight weeks or flexible use.', 1),
    ('PT-3M', 'Goals and progress records', 'Trainer tracks training goals and progress.', 2),
    ('PT-6M', '48 PT sessions', 'Long-term coaching cycle.', 1),
    ('PT-6M', 'Meal plan assignment', 'Trainer can assign a meal plan.', 2),
    ('VIP-PT-6M', '60 VIP PT sessions', 'Priority trainer slots and monthly reviews.', 1),
    ('VIP-PT-6M', 'VIP support', 'Priority rescheduling and retention support.', 2),
    ('VIP-PT-12M', '120 VIP PT sessions', 'Annual transformation package.', 1),
    ('VIP-PT-12M', 'Quarterly executive review', 'Admin-level revenue and performance tracking.', 2)
) as f(package_code, feature_name, feature_description, display_order)
join public.packages p on p.package_code = f.package_code;

insert into public.members (
  user_id,
  member_code,
  full_name,
  phone_number,
  date_of_birth,
  gender,
  emergency_contact_name,
  emergency_contact_phone,
  health_notes,
  join_date,
  status
)
select
  u.user_id,
  m.member_code,
  concat_ws(' ', u.first_name, u.last_name),
  u.phone_number,
  u.date_of_birth,
  u.gender,
  m.emergency_contact_name,
  m.emergency_contact_phone,
  m.health_notes,
  m.join_date,
  m.status
from (
  values
    ('member@gymster.local', 'MB-000', 'Lan Do', '0981000000', 'No restrictions. Prefers evening PT.', current_date - 150, 'active'),
    ('member01@gymster.local', 'MB-001', 'Minh Nguyen', '0981000001', 'No known restrictions.', current_date - 180, 'active'),
    ('member02@gymster.local', 'MB-002', 'Hoa Pham', '0981000002', 'Desk posture concerns; avoid heavy overhead work initially.', current_date - 160, 'active'),
    ('member03@gymster.local', 'MB-003', 'Kai Ho', '0981000003', 'Beginner; requires form coaching.', current_date - 145, 'active'),
    ('member04@gymster.local', 'MB-004', 'Trang Le', '0981000004', 'Runner; monitor calf tightness.', current_date - 120, 'active'),
    ('member05@gymster.local', 'MB-005', 'Duc Bui', '0981000005', 'Prior knee strain; use low-impact warmups.', current_date - 110, 'active'),
    ('member06@gymster.local', 'MB-006', 'Mai Do', '0981000006', 'No restrictions.', current_date - 100, 'active'),
    ('member07@gymster.local', 'MB-007', 'Vy Vo', '0981000007', 'Student schedule; evening sessions only.', current_date - 95, 'active'),
    ('member08@gymster.local', 'MB-008', 'Anh Tran', '0981000008', 'VIP member; monthly metrics review.', current_date - 90, 'active'),
    ('member09@gymster.local', 'MB-009', 'Nam Dang', '0981000009', 'Maintaining weight-loss result.', current_date - 80, 'active'),
    ('member10@gymster.local', 'MB-010', 'Nhi Huynh', '0981000010', 'Strength program; no restrictions.', current_date - 75, 'active'),
    ('member11@gymster.local', 'MB-011', 'Long Ly', '0981000011', 'Awaiting payment before activation.', current_date - 4, 'pending_payment'),
    ('member12@gymster.local', 'MB-012', 'Uyen Mai', '0981000012', 'Awaiting trainer approval.', current_date - 3, 'pending_payment'),
    ('member13@gymster.local', 'MB-013', 'Tung Pham', '0981000013', 'Onboarding profile incomplete.', null, 'pending_onboarding'),
    ('member14@gymster.local', 'MB-014', 'Kim Le', '0981000014', 'Expired package; renewal needed.', current_date - 370, 'active'),
    ('member15@gymster.local', 'MB-015', 'Lam Tran', '0981000015', 'Travel pause requested.', current_date - 210, 'active'),
    ('member16@gymster.local', 'MB-016', 'Phuong Nguyen', '0981000016', 'Inactive for retention workflow.', current_date - 500, 'inactive'),
    ('member17@gymster.local', 'MB-017', 'Thai Hoang', '0981000017', 'Suspended pending admin review.', current_date - 230, 'suspended'),
    ('member18@gymster.local', 'MB-018', 'Linh Vu', '0981000018', 'Annual member; frequent check-ins.', current_date - 250, 'active'),
    ('member19@gymster.local', 'MB-019', 'Dai Dao', '0981000019', 'Recent VIP upgrade.', current_date - 60, 'active'),
    ('member20@gymster.local', 'MB-020', 'Jin Kao', '0981000020', 'English support requested.', current_date - 45, 'active'),
    ('member21@gymster.local', 'MB-021', 'Hieu Ngo', '0981000021', 'Returning member.', current_date - 20, 'active'),
    ('member22@gymster.local', 'MB-022', 'Thu Dinh', '0981000022', 'Beginner PT member.', current_date - 18, 'active'),
    ('member23@gymster.local', 'MB-023', 'Bach Ta', '0981000023', 'Considering VIP upgrade.', current_date - 28, 'active'),
    ('member24@gymster.local', 'MB-024', 'Mina Lee', '0981000024', 'Cancelled after relocation.', current_date - 300, 'cancelled')
) as m(email, member_code, emergency_contact_name, emergency_contact_phone, health_notes, join_date, status)
join public.users u on u.email = m.email;

insert into public.rooms (room_code, room_name, room_type, capacity, status) values
  ('ROOM-GYM-01', 'Main Gym Floor', 'gym', 95, 'active'),
  ('ROOM-FREE-01', 'Free Weights Zone', 'strength', 35, 'active'),
  ('ROOM-CARDIO-01', 'Cardio Zone', 'cardio', 40, 'active'),
  ('ROOM-PT-01', 'PT Studio 1', 'pt_studio', 8, 'active'),
  ('ROOM-PT-02', 'PT Studio 2', 'pt_studio', 8, 'active'),
  ('ROOM-CLASS-01', 'Group Class Studio', 'class', 28, 'active'),
  ('ROOM-REC-01', 'Recovery Room', 'recovery', 10, 'maintenance'),
  ('ROOM-LOCKER-01', 'Locker Area', 'facility', 60, 'active');

insert into public.equipment (
  room_id,
  equipment_code,
  equipment_name,
  category,
  brand,
  model,
  purchase_date,
  last_maintenance_date,
  next_maintenance_date,
  status,
  notes
)
select
  r.room_id,
  e.equipment_code,
  e.equipment_name,
  e.category,
  e.brand,
  e.model,
  e.purchase_date,
  e.last_maintenance_date,
  e.next_maintenance_date,
  e.status,
  e.notes
from (
  values
    ('ROOM-CARDIO-01', 'EQ-TREAD-001', 'Treadmill 01', 'Cardio', 'Technogym', 'Run 600', date '2024-02-10', current_date - 40, current_date + 20, 'active', 'High-use machine near window.'),
    ('ROOM-CARDIO-01', 'EQ-TREAD-002', 'Treadmill 02', 'Cardio', 'Technogym', 'Run 600', date '2024-02-10', current_date - 40, current_date + 20, 'active', 'Normal operating condition.'),
    ('ROOM-CARDIO-01', 'EQ-BIKE-001', 'Air Bike 01', 'Cardio', 'Assault', 'Classic', date '2023-09-15', current_date - 25, current_date + 35, 'under_maintenance', 'Resistance belt slipping under heavy load.'),
    ('ROOM-FREE-01', 'EQ-RACK-001', 'Power Rack 01', 'Strength', 'Rogue', 'Monster Lite', date '2023-05-22', current_date - 60, current_date + 30, 'active', 'Inspect J-cups monthly.'),
    ('ROOM-FREE-01', 'EQ-BENCH-001', 'Adjustable Bench 01', 'Strength', 'Impulse', 'IT7011', date '2023-06-05', current_date - 15, current_date + 15, 'active', 'Seat pad replaced last month.'),
    ('ROOM-FREE-01', 'EQ-BENCH-002', 'Adjustable Bench 02', 'Strength', 'Impulse', 'IT7011', date '2023-06-05', current_date - 120, current_date - 5, 'broken', 'Backrest lock pin stuck; keep out of use.'),
    ('ROOM-GYM-01', 'EQ-CABLE-001', 'Cable Crossover', 'Strength', 'Life Fitness', 'CMDAP', date '2024-01-18', current_date - 45, current_date + 45, 'active', 'Lubricate pulley monthly.'),
    ('ROOM-PT-01', 'EQ-KB-001', 'Kettlebell Set', 'Functional', 'Again Faster', 'KB Set', date '2024-03-12', current_date - 30, current_date + 60, 'active', 'Shared PT studio set.'),
    ('ROOM-CLASS-01', 'EQ-MAT-001', 'Yoga Mat Set', 'Class', 'Manduka', 'Studio', date '2024-04-20', current_date - 20, current_date + 40, 'active', 'Clean after classes.'),
    ('ROOM-REC-01', 'EQ-MASSAGE-001', 'Massage Chair', 'Recovery', 'OSIM', 'uLove', date '2023-12-02', current_date - 90, current_date + 10, 'under_maintenance', 'Remote panel intermittently resets.')
) as e(room_code, equipment_code, equipment_name, category, brand, model, purchase_date, last_maintenance_date, next_maintenance_date, status, notes)
join public.rooms r on r.room_code = e.room_code;

insert into public.member_packages (
  member_id,
  package_id,
  trainer_id,
  status,
  start_date,
  end_date,
  sessions_total,
  sessions_used,
  used_sessions,
  remaining_sessions,
  activated_at
)
select
  m.member_id,
  p.package_id,
  t.trainer_id,
  x.status,
  current_date + (x.start_offset * interval '1 day'),
  current_date + (x.end_offset * interval '1 day'),
  x.sessions_total,
  x.sessions_used,
  x.sessions_used,
  case when x.sessions_total is null then null else greatest(x.sessions_total - x.sessions_used, 0) end,
  case when x.status in ('active', 'expired', 'paused') then now() + (x.start_offset * interval '1 day') else null end
from (
  values
    ('MB-000', 'PT-3M', 'PT-001', 'active', -42, 48, 24, 8),
    ('MB-001', 'PT-3M', 'PT-003', 'active', -70, 20, 24, 15),
    ('MB-002', 'GYM-6M', null, 'active', -110, 70, null, 0),
    ('MB-003', 'PT-1M', 'PT-005', 'active', -15, 15, 8, 2),
    ('MB-004', 'GYM-12M', null, 'active', -200, 165, null, 0),
    ('MB-005', 'PT-6M', 'PT-004', 'active', -80, 100, 48, 18),
    ('MB-006', 'GYM-3M', null, 'active', -20, 70, null, 0),
    ('MB-007', 'PT-3M', 'PT-002', 'active', -34, 56, 24, 6),
    ('MB-008', 'VIP-PT-6M', 'PT-007', 'active', -60, 120, 60, 14),
    ('MB-009', 'GYM-12M', null, 'active', -210, 155, null, 0),
    ('MB-010', 'PT-6M', 'PT-001', 'active', -95, 85, 48, 22),
    ('MB-011', 'GYM-3M', null, 'pending_payment', 0, 90, null, 0),
    ('MB-012', 'PT-3M', 'PT-006', 'pending_pt_approval', 0, 90, 24, 0),
    ('MB-014', 'GYM-6M', null, 'expired', -220, -40, null, 0),
    ('MB-014', 'GYM-12M', null, 'pending_renewal', 1, 366, null, 0),
    ('MB-015', 'PT-3M', 'PT-004', 'paused', -45, 45, 24, 7),
    ('MB-016', 'GYM-1M', null, 'expired', -80, -50, null, 0),
    ('MB-017', 'GYM-3M', null, 'cancelled', -100, -10, null, 0),
    ('MB-018', 'GYM-12M', null, 'active', -250, 115, null, 0),
    ('MB-019', 'VIP-PT-6M', 'PT-007', 'active', -25, 155, 60, 5),
    ('MB-020', 'PT-1M', 'PT-002', 'active', -10, 20, 8, 1),
    ('MB-021', 'GYM-3M', null, 'active', -18, 72, null, 0),
    ('MB-022', 'PT-3M', 'PT-005', 'active', -18, 72, 24, 3),
    ('MB-023', 'GYM-6M', null, 'active', -28, 152, null, 0),
    ('MB-024', 'GYM-3M', null, 'cancelled', -270, -180, null, 0)
) as x(member_code, package_code, trainer_code, status, start_offset, end_offset, sessions_total, sessions_used)
join public.members m on m.member_code = x.member_code
join public.packages p on p.package_code = x.package_code
left join public.trainers t on t.trainer_code = x.trainer_code;

insert into public.training_requests (
  member_id,
  trainer_id,
  package_id,
  member_package_id,
  requested_schedule,
  status,
  decline_reason,
  approved_at,
  declined_at,
  expires_at
)
select
  m.member_id,
  t.trainer_id,
  p.package_id,
  mp.member_package_id,
  x.requested_schedule,
  x.status,
  x.decline_reason,
  case when x.status in ('accepted', 'approved', 'completed') then now() - interval '20 days' else null end,
  case when x.status = 'declined' then now() - interval '2 days' else null end,
  now() + (x.expires_in_days * interval '1 day')
from (
  values
    ('MB-000', 'PT-001', 'PT-3M', 'Mon/Wed/Fri 18:00', 'completed', '', 30),
    ('MB-001', 'PT-003', 'PT-3M', 'Mon/Wed/Fri 07:00', 'completed', '', 15),
    ('MB-005', 'PT-004', 'PT-6M', 'Tue/Thu 18:00, Sat 10:00', 'approved', '', 20),
    ('MB-007', 'PT-002', 'PT-3M', 'Tue/Thu 19:00', 'accepted', '', 10),
    ('MB-008', 'PT-007', 'VIP-PT-6M', 'Mon/Wed/Fri 20:00', 'approved', '', 60),
    ('MB-010', 'PT-001', 'PT-6M', 'Mon/Fri 18:00', 'completed', '', 40),
    ('MB-012', 'PT-006', 'PT-3M', 'Tue/Thu 06:30', 'pending_pt_approval', '', 3),
    ('MB-015', 'PT-004', 'PT-3M', 'Sat 10:00', 'cancelled', '', -5),
    ('MB-020', 'PT-002', 'PT-1M', 'Sun 08:00', 'approved', '', 15),
    ('MB-022', 'PT-005', 'PT-3M', 'Mon/Wed 12:00', 'approved', '', 20),
    ('MB-023', 'PT-007', 'VIP-PT-6M', 'Fri 20:00', 'declined', 'Trainer capacity is full for the requested slot.', -1)
) as x(member_code, trainer_code, package_code, requested_schedule, status, decline_reason, expires_in_days)
join public.members m on m.member_code = x.member_code
join public.trainers t on t.trainer_code = x.trainer_code
join public.packages p on p.package_code = x.package_code
left join public.member_packages mp on mp.member_id = m.member_id and mp.package_id = p.package_id and (mp.trainer_id = t.trainer_id or mp.trainer_id is null);

insert into public.payments (
  member_id,
  package_id,
  member_package_id,
  training_request_id,
  amount,
  currency,
  payment_method,
  payment_status,
  transfer_content,
  provider_reference,
  paid_at,
  payment_date,
  transaction_code
)
select
  m.member_id,
  p.package_id,
  mp.member_package_id,
  tr.training_request_id,
  x.amount,
  'VND',
  x.payment_method,
  x.payment_status,
  x.transfer_content,
  x.transaction_code,
  case when x.payment_status in ('paid', 'refunded') then now() - (x.days_ago * interval '1 day') else null end,
  now() - (x.days_ago * interval '1 day'),
  x.transaction_code
from (
  values
    ('MB-000', 'PT-3M', 'GYMSTER MB-000 PT-3M', 'bank_transfer', 'paid', 4800000::numeric, 42, 'TXN-2026-0000'),
    ('MB-001', 'PT-3M', 'GYMSTER MB-001 PT-3M', 'e_wallet', 'paid', 4800000::numeric, 70, 'TXN-2026-0001'),
    ('MB-002', 'GYM-6M', 'GYMSTER MB-002 GYM-6M', 'cash', 'paid', 1750000::numeric, 110, 'TXN-2026-0002'),
    ('MB-003', 'PT-1M', 'GYMSTER MB-003 PT-1M', 'credit_card', 'paid', 1800000::numeric, 15, 'TXN-2026-0003'),
    ('MB-004', 'GYM-12M', 'GYMSTER MB-004 GYM-12M', 'bank_transfer', 'paid', 3150000::numeric, 200, 'TXN-2026-0004'),
    ('MB-005', 'PT-6M', 'GYMSTER MB-005 PT-6M', 'bank_transfer', 'paid', 8600000::numeric, 80, 'TXN-2026-0005'),
    ('MB-006', 'GYM-3M', 'GYMSTER MB-006 GYM-3M', 'cash', 'paid', 990000::numeric, 20, 'TXN-2026-0006'),
    ('MB-007', 'PT-3M', 'GYMSTER MB-007 PT-3M', 'e_wallet', 'paid', 4800000::numeric, 34, 'TXN-2026-0007'),
    ('MB-008', 'VIP-PT-6M', 'GYMSTER MB-008 VIP-PT-6M', 'bank_transfer', 'paid', 12800000::numeric, 60, 'TXN-2026-0008'),
    ('MB-009', 'GYM-12M', 'GYMSTER MB-009 GYM-12M', 'credit_card', 'paid', 3150000::numeric, 210, 'TXN-2026-0009'),
    ('MB-010', 'PT-6M', 'GYMSTER MB-010 PT-6M', 'bank_transfer', 'paid', 8600000::numeric, 95, 'TXN-2026-0010'),
    ('MB-011', 'GYM-3M', 'GYMSTER MB-011 GYM-3M', 'bank_transfer', 'pending', 990000::numeric, 2, 'TXN-2026-0011'),
    ('MB-012', 'PT-3M', 'GYMSTER MB-012 PT-3M', 'e_wallet', 'pending', 4800000::numeric, 1, 'TXN-2026-0012'),
    ('MB-014', 'GYM-6M', 'GYMSTER MB-014 GYM-6M', 'cash', 'paid', 1750000::numeric, 220, 'TXN-2026-0014A'),
    ('MB-014', 'GYM-12M', 'GYMSTER MB-014 RENEW GYM-12M', 'bank_transfer', 'pending', 3150000::numeric, 1, 'TXN-2026-0014B'),
    ('MB-015', 'PT-3M', 'GYMSTER MB-015 PT-3M', 'credit_card', 'paid', 4800000::numeric, 45, 'TXN-2026-0015'),
    ('MB-016', 'GYM-1M', 'GYMSTER MB-016 GYM-1M', 'cash', 'paid', 390000::numeric, 80, 'TXN-2026-0016'),
    ('MB-017', 'GYM-3M', 'GYMSTER MB-017 GYM-3M', 'cash', 'refunded', 990000::numeric, 100, 'TXN-2026-0017'),
    ('MB-018', 'GYM-12M', 'GYMSTER MB-018 GYM-12M', 'bank_transfer', 'paid', 3150000::numeric, 250, 'TXN-2026-0018'),
    ('MB-019', 'VIP-PT-6M', 'GYMSTER MB-019 VIP-PT-6M', 'credit_card', 'paid', 12800000::numeric, 25, 'TXN-2026-0019'),
    ('MB-020', 'PT-1M', 'GYMSTER MB-020 PT-1M', 'e_wallet', 'paid', 1800000::numeric, 10, 'TXN-2026-0020'),
    ('MB-021', 'GYM-3M', 'GYMSTER MB-021 GYM-3M', 'cash', 'paid', 990000::numeric, 18, 'TXN-2026-0021'),
    ('MB-022', 'PT-3M', 'GYMSTER MB-022 PT-3M', 'bank_transfer', 'paid', 4800000::numeric, 18, 'TXN-2026-0022'),
    ('MB-023', 'GYM-6M', 'GYMSTER MB-023 GYM-6M', 'bank_transfer', 'paid', 1750000::numeric, 28, 'TXN-2026-0023'),
    ('MB-024', 'GYM-3M', 'GYMSTER MB-024 GYM-3M', 'credit_card', 'cancelled', 990000::numeric, 270, 'TXN-2026-0024')
) as x(member_code, package_code, transfer_content, payment_method, payment_status, amount, days_ago, transaction_code)
join public.members m on m.member_code = x.member_code
join public.packages p on p.package_code = x.package_code
left join public.member_packages mp on mp.member_id = m.member_id and mp.package_id = p.package_id
left join public.training_requests tr on tr.member_id = m.member_id and tr.package_id = p.package_id;

insert into public.invoices (
  invoice_number,
  payment_id,
  member_id,
  employee_id,
  subtotal_amount,
  discount_amount,
  tax_amount,
  total_amount,
  amount,
  invoice_status,
  status,
  issued_at,
  due_at,
  paid_at
)
select
  'INV-2026-' || lpad((row_number() over (order by pay.payment_date, pay.transaction_code))::text, 4, '0'),
  pay.payment_id,
  pay.member_id,
  e.employee_id,
  pay.amount,
  case when pay.amount >= 8000000 then 300000 else 0 end,
  0,
  greatest(pay.amount - case when pay.amount >= 8000000 then 300000 else 0 end, 0),
  greatest(pay.amount - case when pay.amount >= 8000000 then 300000 else 0 end, 0),
  case
    when pay.payment_status = 'paid' then 'paid'
    when pay.payment_status = 'refunded' then 'refunded'
    when pay.payment_status = 'cancelled' then 'cancelled'
    else 'issued'
  end,
  case
    when pay.payment_status = 'paid' then 'paid'
    when pay.payment_status = 'refunded' then 'refunded'
    when pay.payment_status = 'cancelled' then 'cancelled'
    else 'issued'
  end,
  pay.payment_date,
  pay.payment_date + interval '7 days',
  pay.paid_at
from public.payments pay
cross join lateral (
  select employee_id
  from public.employees
  where employee_code in ('EMP-STF-001', 'EMP-STF-002', 'EMP-STF-003')
  order by employee_code
  limit 1
) e;

insert into public.workout_sessions (
  member_id,
  trainer_id,
  member_package_id,
  package_id,
  room_id,
  title,
  session_title,
  exercise_type,
  room_name,
  session_date,
  start_time,
  end_time,
  status,
  notes,
  note
)
select
  mp.member_id,
  mp.trainer_id,
  mp.member_package_id,
  mp.package_id,
  r.room_id,
  concat('PT Session ', gs.session_no, ' - ', p.package_code),
  concat('PT Session ', gs.session_no, ' - ', p.package_code),
  case gs.session_no % 5
    when 0 then 'Mobility'
    when 1 then 'Strength'
    when 2 then 'Hypertrophy'
    when 3 then 'Conditioning'
    else 'Core'
  end,
  r.room_name,
  current_date + ((gs.session_no - 8) * interval '3 days'),
  case when gs.session_no % 2 = 0 then time '18:00' else time '07:00' end,
  case when gs.session_no % 2 = 0 then time '19:00' else time '08:00' end,
  case
    when gs.session_no <= least(coalesce(mp.sessions_used, 0), 8) then 'completed'
    when gs.session_no = 9 and mp.status = 'paused' then 'rescheduled'
    when gs.session_no = 10 and mp.status = 'pending_pt_approval' then 'pending_reschedule'
    when gs.session_no = 11 and mp.status = 'active' then 'scheduled'
    else 'scheduled'
  end,
  'Seeded PT session connected to package and trainer assignment.',
  'Seeded PT session connected to package and trainer assignment.'
from public.member_packages mp
join public.packages p on p.package_id = mp.package_id
join public.rooms r on r.room_code = case when p.package_type = 'vip_pt' then 'ROOM-PT-02' else 'ROOM-PT-01' end
cross join generate_series(1, 12) as gs(session_no)
where mp.trainer_id is not null
  and mp.status in ('active', 'paused', 'pending_pt_approval')
limit 120;

insert into public.workout_sessions (
  member_id,
  package_id,
  member_package_id,
  room_id,
  title,
  session_title,
  exercise_type,
  room_name,
  session_date,
  start_time,
  end_time,
  status,
  notes,
  note
)
select
  mp.member_id,
  mp.package_id,
  mp.member_package_id,
  r.room_id,
  concat('Gym Check-in ', gs.check_no),
  concat('Gym Check-in ', gs.check_no),
  case when gs.check_no % 2 = 0 then 'Free Training' else 'Cardio' end,
  r.room_name,
  current_date - (gs.check_no * interval '4 days'),
  time '17:30',
  time '19:00',
  'completed',
  'General gym usage check-in.',
  'General gym usage check-in.'
from public.member_packages mp
join public.packages p on p.package_id = mp.package_id
join public.rooms r on r.room_code = 'ROOM-GYM-01'
cross join generate_series(1, 4) as gs(check_no)
where p.package_type = 'gym'
  and mp.status in ('active', 'expired')
limit 60;

insert into public.trainer_assignments (
  trainer_id,
  member_id,
  member_package_id,
  status,
  assigned_at,
  ended_at,
  notes
)
select
  mp.trainer_id,
  mp.member_id,
  mp.member_package_id,
  case when mp.status = 'paused' then 'paused' else 'active' end,
  coalesce(mp.activated_at, now() - interval '10 days'),
  null,
  'Assignment created from active PT/VIP package.'
from public.member_packages mp
where mp.trainer_id is not null
  and mp.status in ('active', 'paused');

insert into public.training_goals (
  member_id,
  trainer_id,
  goal_title,
  target_value,
  current_value,
  unit,
  target_date,
  status
)
select
  ta.member_id,
  ta.trainer_id,
  case row_number() over (order by ta.assigned_at, ta.trainer_assignment_id) % 4
    when 0 then 'Improve squat form score'
    when 1 then 'Reduce body fat percentage'
    when 2 then 'Increase weekly training consistency'
    else 'Improve cardio endurance'
  end,
  case row_number() over (order by ta.assigned_at, ta.trainer_assignment_id) % 4
    when 0 then 90
    when 1 then 22
    when 2 then 12
    else 30
  end,
  case row_number() over (order by ta.assigned_at, ta.trainer_assignment_id) % 4
    when 0 then 72
    when 1 then 27
    when 2 then 8
    else 22
  end,
  case row_number() over (order by ta.assigned_at, ta.trainer_assignment_id) % 4
    when 0 then 'score'
    when 1 then 'percent'
    when 2 then 'sessions/month'
    else 'minutes'
  end,
  current_date + interval '60 days',
  'active'
from public.trainer_assignments ta;

insert into public.progress_records (
  member_id,
  trainer_id,
  workout_session_id,
  record_date,
  weight_kg,
  body_fat_percent,
  muscle_mass_kg,
  calories_burned,
  performance_score,
  notes
)
select
  ws.member_id,
  ws.trainer_id,
  ws.workout_session_id,
  ws.session_date,
  58 + ((row_number() over (order by ws.session_date, ws.workout_session_id)) % 28),
  18 + ((row_number() over (order by ws.session_date, ws.workout_session_id)) % 12),
  24 + ((row_number() over (order by ws.session_date, ws.workout_session_id)) % 14),
  320 + ((row_number() over (order by ws.session_date, ws.workout_session_id)) % 8) * 35,
  70 + ((row_number() over (order by ws.session_date, ws.workout_session_id)) % 25),
  'Trainer progress record generated from completed session.'
from public.workout_sessions ws
where ws.trainer_id is not null
  and ws.status = 'completed'
order by ws.session_date desc
limit 45;

insert into public.body_metrics (
  member_id,
  recorded_by_trainer_id,
  recorded_at,
  height_cm,
  weight_kg,
  body_fat_percent,
  muscle_mass_kg,
  chest_cm,
  waist_cm,
  hip_cm,
  notes
)
select
  m.member_id,
  t.trainer_id,
  now() - ((row_number() over (order by m.member_code)) * interval '5 days'),
  158 + ((row_number() over (order by m.member_code)) % 28),
  52 + ((row_number() over (order by m.member_code)) % 35),
  17 + ((row_number() over (order by m.member_code)) % 16),
  22 + ((row_number() over (order by m.member_code)) % 18),
  82 + ((row_number() over (order by m.member_code)) % 18),
  68 + ((row_number() over (order by m.member_code)) % 22),
  88 + ((row_number() over (order by m.member_code)) % 20),
  'Baseline body metrics for member profile and PT dashboards.'
from public.members m
left join lateral (
  select trainer_id
  from public.member_packages mp
  where mp.member_id = m.member_id and mp.trainer_id is not null
  order by mp.created_at desc
  limit 1
) t on true;

insert into public.medical_records (
  member_id,
  condition_name,
  allergies,
  medications,
  injury_notes,
  emergency_notes,
  clearance_status
)
select
  m.member_id,
  case when m.member_code in ('MB-005', 'MB-015') then 'Prior knee strain' else null end,
  case when m.member_code in ('MB-020') then 'Peanut allergy' else 'None reported' end,
  case when m.member_code in ('MB-017') then 'Requires admin verification' else 'None reported' end,
  case when m.member_code = 'MB-005' then 'Avoid high-impact jumping until trainer clears progression.' else null end,
  'Emergency contact is available in member profile.',
  case
    when m.member_code = 'MB-017' then 'not_cleared'
    when m.member_code in ('MB-005', 'MB-015') then 'restricted'
    else 'cleared'
  end
from public.members m;

insert into public.workout_plans (
  member_id,
  trainer_id,
  plan_name,
  plan_goal,
  start_date,
  end_date,
  status,
  notes
)
select
  ta.member_id,
  ta.trainer_id,
  concat('Plan for ', m.member_code),
  case t.specialty
    when 'Weight Loss and HIIT' then 'Improve conditioning and reduce body fat safely.'
    when 'Mobility and Recovery' then 'Restore range of motion and rebuild training confidence.'
    when 'VIP Transformation' then 'Body recomposition with monthly reviews.'
    else 'Improve strength, consistency, and movement quality.'
  end,
  current_date - interval '14 days',
  current_date + interval '76 days',
  'active',
  'Current active workout plan for PT member.'
from public.trainer_assignments ta
join public.members m on m.member_id = ta.member_id
join public.trainers t on t.trainer_id = ta.trainer_id;

insert into public.workout_plan_exercises (
  workout_plan_id,
  exercise_name,
  exercise_type,
  sets,
  reps,
  duration_minutes,
  intensity,
  notes,
  display_order
)
select
  wp.workout_plan_id,
  ex.exercise_name,
  ex.exercise_type,
  ex.sets,
  ex.reps,
  ex.duration_minutes,
  ex.intensity,
  ex.notes,
  ex.display_order
from public.workout_plans wp
cross join (
  values
    ('Goblet Squat', 'Strength', 4, '8-10', null::integer, 'Moderate', 'Use full control and neutral spine.', 1),
    ('Incline Dumbbell Press', 'Strength', 3, '10-12', null::integer, 'Moderate', 'Stop two reps before form breaks.', 2),
    ('Lat Pulldown', 'Strength', 3, '10-12', null::integer, 'Moderate', 'Pull elbows down, not back.', 3),
    ('Bike Intervals', 'Conditioning', null::integer, null::text, 18, 'Hard', 'Six rounds of 40 seconds hard and 80 seconds easy.', 4)
) as ex(exercise_name, exercise_type, sets, reps, duration_minutes, intensity, notes, display_order);

insert into public.meal_plans (
  trainer_id,
  plan_name,
  goal,
  calories_per_day,
  protein_grams,
  carbs_grams,
  fat_grams,
  meals,
  status
)
select
  t.trainer_id,
  x.plan_name,
  x.goal,
  x.calories_per_day,
  x.protein_grams,
  x.carbs_grams,
  x.fat_grams,
  x.meals::jsonb,
  'active'
from (
  values
    ('PT-001', 'Strength Lean Mass Plan', 'Build lean mass with steady protein intake.', 2350, 155, 280, 70, '[{"name":"Breakfast","items":["oats","eggs","banana"]},{"name":"Lunch","items":["rice","chicken","vegetables"]},{"name":"Dinner","items":["salmon","sweet potato","salad"]}]'),
    ('PT-003', 'Fat Loss Balanced Plan', 'Moderate deficit with high protein and simple meal prep.', 1800, 135, 175, 55, '[{"name":"Breakfast","items":["greek yogurt","berries"]},{"name":"Lunch","items":["brown rice","turkey","greens"]},{"name":"Dinner","items":["tofu","vegetables","soup"]}]'),
    ('PT-004', 'Recovery Support Plan', 'Joint-friendly nutrition with enough protein for recovery.', 2050, 125, 230, 65, '[{"name":"Breakfast","items":["eggs","wholegrain toast"]},{"name":"Lunch","items":["fish","rice","vegetables"]},{"name":"Dinner","items":["chicken soup","fruit"]}]'),
    ('PT-007', 'VIP Recomposition Plan', 'High-protein recomposition plan with flexible meals.', 2200, 165, 210, 70, '[{"name":"Breakfast","items":["protein smoothie","oats"]},{"name":"Lunch","items":["beef","rice","salad"]},{"name":"Dinner","items":["shrimp","noodles","vegetables"]}]')
) as x(trainer_code, plan_name, goal, calories_per_day, protein_grams, carbs_grams, fat_grams, meals)
join public.trainers t on t.trainer_code = x.trainer_code;

insert into public.meal_plan_assignments (
  meal_plan_id,
  member_id,
  trainer_id,
  assigned_at,
  status,
  notes
)
select
  mpl.meal_plan_id,
  ta.member_id,
  ta.trainer_id,
  now() - interval '9 days',
  'active',
  'Assigned according to member package goal.'
from public.trainer_assignments ta
join public.trainers t on t.trainer_id = ta.trainer_id
join public.meal_plans mpl on mpl.trainer_id = t.trainer_id
where t.trainer_code in ('PT-001', 'PT-003', 'PT-004', 'PT-007');

insert into public.package_change_requests (
  member_id,
  current_member_package_id,
  requested_package_id,
  request_type,
  amount,
  payment_method,
  status,
  requested_at,
  reviewed_by_employee_id,
  reviewed_at,
  deny_reason
)
select
  m.member_id,
  current_mp.member_package_id,
  requested.package_id,
  x.request_type,
  requested.price,
  x.payment_method,
  x.status,
  now() - (x.days_ago * interval '1 day'),
  reviewer.employee_id,
  case when x.status in ('approved', 'denied', 'paid') then now() - ((x.days_ago - 1) * interval '1 day') else null end,
  case when x.status = 'denied' then x.deny_reason else null end
from (
  values
    ('MB-011', 'GYM-3M', 'buy', 'bank_transfer', 'pending_payment', 2, null),
    ('MB-014', 'GYM-12M', 'renew', 'bank_transfer', 'pending', 1, null),
    ('MB-015', 'PT-6M', 'upgrade', 'credit_card', 'approved', 5, null),
    ('MB-018', 'PT-1M', 'upgrade', 'e_wallet', 'denied', 8, 'Member requested a PT slot outside trainer availability.'),
    ('MB-019', 'VIP-PT-12M', 'upgrade', 'bank_transfer', 'pending', 3, null),
    ('MB-020', 'PT-3M', 'upgrade', 'e_wallet', 'approved', 4, null),
    ('MB-021', 'GYM-6M', 'renew', 'cash', 'paid', 6, null),
    ('MB-022', 'VIP-PT-6M', 'upgrade', 'bank_transfer', 'pending', 2, null),
    ('MB-023', 'VIP-PT-6M', 'upgrade', 'bank_transfer', 'pending', 1, null)
) as x(member_code, requested_package_code, request_type, payment_method, status, days_ago, deny_reason)
join public.members m on m.member_code = x.member_code
join public.packages requested on requested.package_code = x.requested_package_code
left join lateral (
  select member_package_id
  from public.member_packages mp
  where mp.member_id = m.member_id
  order by mp.created_at desc
  limit 1
) current_mp on true
left join lateral (
  select employee_id
  from public.employees
  where employee_code = 'EMP-STF-003'
) reviewer on true;

insert into public.service_feedback (
  member_id,
  trainer_id,
  workout_session_id,
  target_type,
  rating,
  comment,
  tags,
  status,
  staff_response,
  responded_by_employee_id,
  responded_at
)
select
  m.member_id,
  t.trainer_id,
  ws.workout_session_id,
  x.target_type,
  x.rating,
  x.comment,
  x.tags,
  x.status,
  x.staff_response,
  e.employee_id,
  case when x.status = 'resolved' then now() - interval '1 day' else null end
from (
  values
    ('MB-000', 'PT-001', 'trainer', 5, 'Coach explained each lift clearly and adjusted volume well.', array['coaching','strength'], 'submitted', null),
    ('MB-001', 'PT-003', 'trainer', 5, 'HIIT sessions are challenging but realistic.', array['pt','hiit'], 'resolved', 'Shared with trainer and noted for recognition.'),
    ('MB-002', null, 'facility', 4, 'Gym floor is clean during morning hours.', array['facility'], 'submitted', null),
    ('MB-005', 'PT-004', 'trainer', 5, 'Recovery exercises helped my knee feel stable.', array['recovery'], 'resolved', 'Thank you for the update.'),
    ('MB-008', 'PT-007', 'service', 4, 'VIP rescheduling was fast.', array['vip','support'], 'in_review', null),
    ('MB-014', null, 'service', 3, 'Renewal reminder should arrive earlier.', array['renewal'], 'in_review', null),
    ('MB-018', null, 'equipment', 3, 'Air bike resistance felt inconsistent.', array['equipment'], 'submitted', null),
    ('MB-020', 'PT-002', 'trainer', 4, 'Good session but room was crowded.', array['pt','room'], 'submitted', null),
    ('MB-022', 'PT-005', 'trainer', 5, 'Beginner instructions were very clear.', array['beginner'], 'resolved', 'Sent appreciation to trainer.'),
    ('MB-023', null, 'service', 4, 'Bank transfer confirmation was quick.', array['payment'], 'submitted', null)
) as x(member_code, trainer_code, target_type, rating, comment, tags, status, staff_response)
join public.members m on m.member_code = x.member_code
left join public.trainers t on t.trainer_code = x.trainer_code
left join lateral (
  select workout_session_id
  from public.workout_sessions s
  where s.member_id = m.member_id and (t.trainer_id is null or s.trainer_id = t.trainer_id)
  order by s.session_date desc
  limit 1
) ws on true
left join public.employees e on e.employee_code = 'EMP-STF-005';

insert into public.complaints (
  member_id,
  assigned_employee_id,
  complaint_type,
  title,
  description,
  priority,
  status,
  resolution_note,
  resolved_at
)
select
  m.member_id,
  e.employee_id,
  x.complaint_type,
  x.title,
  x.description,
  x.priority,
  x.status,
  x.resolution_note,
  case when x.status in ('resolved', 'closed') then now() - interval '2 days' else null end
from (
  values
    ('MB-002', 'facility', 'Locker area crowding', 'Evening locker area was crowded and wet near showers.', 'medium', 'in_review', null),
    ('MB-006', 'payment', 'Receipt email not received', 'Member paid cash but did not receive invoice email.', 'medium', 'resolved', 'Invoice was resent and email verified.'),
    ('MB-010', 'trainer', 'Late session start', 'PT session started 12 minutes late twice this month.', 'high', 'in_progress', null),
    ('MB-014', 'service', 'Renewal follow-up delay', 'Expired member did not get timely renewal support.', 'medium', 'open', null),
    ('MB-018', 'equipment', 'Air bike resistance issue', 'Resistance slips at high intensity.', 'high', 'in_progress', null),
    ('MB-020', 'facility', 'PT room too crowded', 'PT room had overlapping sessions.', 'low', 'open', null),
    ('MB-017', 'other', 'Account suspension review', 'Member requested explanation for suspended account.', 'urgent', 'in_review', null),
    ('MB-024', 'service', 'Cancellation confirmation', 'Member asked for final cancellation confirmation.', 'low', 'closed', 'Cancellation confirmation sent.')
) as x(member_code, complaint_type, title, description, priority, status, resolution_note)
join public.members m on m.member_code = x.member_code
join public.employees e on e.employee_code = 'EMP-STF-005';

insert into public.maintenance_reports (
  equipment_id,
  room_id,
  reported_by_user_id,
  issue_title,
  issue_description,
  priority,
  status,
  resolved_at
)
select
  eq.equipment_id,
  eq.room_id,
  u.user_id,
  x.issue_title,
  x.issue_description,
  x.priority,
  x.status,
  case when x.status = 'resolved' then now() - interval '3 days' else null end
from (
  values
    ('EQ-BIKE-001', 'Air bike resistance slipping', 'Resistance belt slips during high-power intervals.', 'high', 'in_progress'),
    ('EQ-BENCH-002', 'Bench lock pin stuck', 'Backrest lock pin cannot secure incline setting.', 'urgent', 'in_progress'),
    ('EQ-MASSAGE-001', 'Massage chair remote resets', 'Remote panel restarts randomly while member is using recovery room.', 'medium', 'in_review'),
    ('EQ-TREAD-001', 'Treadmill belt noise', 'Light squeaking sound above speed 10.', 'low', 'resolved'),
    ('EQ-MAT-001', 'Mat replacement request', 'Five mats have worn corners after evening classes.', 'medium', 'submitted')
) as x(equipment_code, issue_title, issue_description, priority, status)
join public.equipment eq on eq.equipment_code = x.equipment_code
join public.users u on u.email = 'staff03@gymster.local';

insert into public.maintenance_records (
  maintenance_report_id,
  equipment_id,
  handled_by_employee_id,
  maintenance_type,
  description,
  cost,
  completed_at
)
select
  mr.maintenance_report_id,
  mr.equipment_id,
  e.employee_id,
  case
    when mr.status = 'resolved' then 'repair'
    when mr.priority = 'urgent' then 'inspection'
    else 'inspection'
  end,
  concat('Maintenance action for: ', mr.issue_title),
  case
    when mr.status = 'resolved' then 450000
    when mr.priority = 'urgent' then 0
    else 150000
  end,
  mr.resolved_at
from public.maintenance_reports mr
join public.employees e on e.employee_code = 'EMP-STF-004';

insert into public.employee_schedules (
  employee_id,
  room_id,
  shift_date,
  start_time,
  end_time,
  shift_type,
  status,
  notes
)
select
  e.employee_id,
  r.room_id,
  current_date + (d.day_offset * interval '1 day'),
  case when e.role = 'trainer' then time '14:00' else time '08:00' end,
  case when e.role = 'trainer' then time '22:00' else time '16:00' end,
  case when d.day_offset = 6 then 'overtime' else 'regular' end,
  case when d.day_offset < 0 then 'completed' else 'scheduled' end,
  'Seeded roster entry for staff and trainer scheduling.'
from public.employees e
join public.rooms r on r.room_code = case
  when e.role = 'trainer' then 'ROOM-PT-01'
  when e.department = 'Operations' then 'ROOM-GYM-01'
  else 'ROOM-LOCKER-01'
end
cross join generate_series(-3, 10) as d(day_offset)
where e.role in ('staff', 'trainer');

insert into public.payroll_periods (period_name, period_start, period_end, status) values
  ('2026-03 Payroll', date '2026-03-01', date '2026-03-31', 'paid'),
  ('2026-04 Payroll', date '2026-04-01', date '2026-04-30', 'approved'),
  ('2026-05 Payroll', date '2026-05-01', date '2026-05-31', 'processing');

insert into public.payslips (
  payroll_period_id,
  employee_id,
  base_salary,
  bonus_amount,
  deduction_amount,
  net_amount,
  status,
  paid_at,
  notes
)
select
  pp.payroll_period_id,
  e.employee_id,
  coalesce(e.base_salary, 0),
  case when e.role = 'trainer' then 1200000 else 600000 end,
  case when e.role = 'owner' then 0 else 250000 end,
  coalesce(e.base_salary, 0) + case when e.role = 'trainer' then 1200000 else 600000 end - case when e.role = 'owner' then 0 else 250000 end,
  case pp.status when 'paid' then 'paid' when 'approved' then 'approved' else 'draft' end,
  case when pp.status = 'paid' then pp.period_end + interval '3 days' else null end,
  concat('Payslip for ', pp.period_name)
from public.payroll_periods pp
cross join public.employees e;

insert into public.performance_reviews (
  employee_id,
  reviewer_user_id,
  review_period,
  score,
  rating,
  strengths,
  improvement_areas,
  goals,
  status,
  reviewed_at
)
select
  e.employee_id,
  reviewer.user_id,
  '2026 H1',
  case
    when e.role = 'trainer' then 88
    when e.role = 'staff' then 84
    when e.role = 'admin' then 91
    else 95
  end,
  case
    when e.role in ('owner', 'admin') then 5
    else 4
  end,
  case
    when e.role = 'trainer' then 'Strong member retention and clear session documentation.'
    when e.role = 'staff' then 'Reliable service handling and fast issue follow-up.'
    else 'Clear operational leadership and reporting discipline.'
  end,
  'Keep improving documentation consistency and cross-team handover quality.',
  'Maintain service quality while increasing package renewal conversion.',
  'approved',
  now() - interval '14 days'
from public.employees e
join public.users reviewer on reviewer.email = 'admin@gymster.local';

insert into public.member_usage_history (
  member_id,
  member_package_id,
  workout_session_id,
  usage_type,
  usage_date,
  description
)
select
  ws.member_id,
  ws.member_package_id,
  ws.workout_session_id,
  case when ws.trainer_id is not null then 'workout_session' else 'check_in' end,
  ws.session_date + ws.start_time,
  concat('Usage recorded from ', ws.title)
from public.workout_sessions ws
where ws.status = 'completed'
order by ws.session_date desc
limit 80;

insert into public.notifications (
  user_id,
  notification_type,
  title,
  message,
  is_read,
  read_at
)
select
  u.user_id,
  n.notification_type,
  n.title,
  n.message,
  n.is_read,
  case when n.is_read then now() - interval '1 day' else null end
from (
  values
    ('member@gymster.local', 'schedule', 'Upcoming PT session', 'Your next PT session is scheduled soon in PT Studio 1.', false),
    ('member01@gymster.local', 'package', 'Package usage update', 'You have used 15 of 24 PT sessions.', false),
    ('member11@gymster.local', 'payment', 'Payment pending', 'Your new gym package is waiting for payment confirmation.', false),
    ('member12@gymster.local', 'training_request', 'PT request pending', 'Your trainer request is waiting for PT approval.', false),
    ('member14@gymster.local', 'package', 'Renewal recommended', 'Your previous gym package has expired. Review renewal options.', true),
    ('trainer@gymster.local', 'schedule', 'Today PT schedule', 'You have active PT sessions to review today.', false),
    ('trainer06@gymster.local', 'training_request', 'VIP upgrade request', 'A member requested VIP PT with your schedule.', false),
    ('staff@gymster.local', 'payment', 'Pending payment queue', 'There are member payments pending staff review.', false),
    ('staff03@gymster.local', 'system', 'Maintenance alert', 'Two equipment reports are high priority.', false),
    ('admin@gymster.local', 'system', 'Monthly payroll processing', 'May payroll is currently in processing status.', false),
    ('owner@gymster.local', 'system', 'Revenue snapshot ready', 'Paid invoices and package mix are ready for review.', true)
) as n(email, notification_type, title, message, is_read)
join public.users u on u.email = n.email;

-- Compatibility columns used by the current frontend service layer.

update public.members m
set
  full_name = nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
  phone_number = u.phone_number,
  date_of_birth = u.date_of_birth,
  gender = u.gender
from public.users u
where m.user_id = u.user_id;

update public.trainers t
set
  full_name = coalesce(nullif(t.full_name, ''), nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''), e.full_name, t.trainer_code),
  avatar_url = coalesce(nullif(t.avatar_url, ''), u.avatar_url),
  available_slots = case
    when t.available_slots = '[]'::jsonb then t.available_schedule_slots
    else t.available_slots
  end
from public.users u
left join public.employees e on e.user_id = u.user_id
where t.user_id = u.user_id;

update public.packages
set is_active = status = 'active';

update public.member_packages
set
  used_sessions = coalesce(used_sessions, sessions_used, 0),
  remaining_sessions = case
    when sessions_total is null then null
    else greatest(sessions_total - coalesce(sessions_used, 0), 0)
  end;

update public.payments
set
  payment_date = coalesce(payment_date, paid_at, created_at),
  transaction_code = coalesce(nullif(transaction_code, ''), provider_reference, payment_id::text);

update public.invoices
set
  amount = coalesce(amount, total_amount),
  status = coalesce(nullif(status, ''), invoice_status);

update public.workout_sessions ws
set
  session_title = coalesce(nullif(ws.session_title, ''), ws.title),
  note = coalesce(nullif(ws.note, ''), ws.notes),
  package_id = coalesce(ws.package_id, mp.package_id),
  room_name = coalesce(
    ws.room_name,
    (select room_name from public.rooms r where r.room_id = ws.room_id)
  )
from public.member_packages mp
where ws.member_package_id = mp.member_package_id;

commit;
