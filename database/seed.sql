-- Gymster MVP demo seed data.
-- Run this after database/schema.sql.

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
  account_status
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'admin@gymster.local',
    'admin',
    'demo-only:Admin@123',
    'Gymster',
    'Admin',
    '0900000001',
    '1988-01-01',
    'unspecified',
    'admin',
    'Managing gym operations, staff performance, memberships, and business growth.',
    'en',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'staff@gymster.local',
    'staff',
    'demo-only:Staff@123',
    'Gymster',
    'Staff',
    '0900000002',
    '1992-02-01',
    'unspecified',
    'staff',
    'Supporting daily gym operations, member services, payments, and equipment workflows.',
    'en',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'trainer@gymster.local',
    'trainer',
    'demo-only:Trainer@123',
    'Alex',
    'Carter',
    '0900000003',
    '1990-03-01',
    'male',
    'trainer',
    'Helping members build strength, confidence, and sustainable training habits.',
    'en',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'member@gymster.local',
    'member',
    'demo-only:Member@123',
    'Taylor',
    'Morgan',
    '0900000004',
    '1998-04-12',
    'unspecified',
    'member',
    'Committed to building strength, healthy routines, and consistent training habits.',
    'en',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'pending@gymster.local',
    'pending_member',
    'demo-only:Pending@123',
    'Jordan',
    'Lee',
    '0900000005',
    '2000-09-21',
    'unspecified',
    'member',
    'Complete membership onboarding to unlock the Member Portal.',
    'en',
    'pending_onboarding'
  )
on conflict (user_id) do update set
  email = excluded.email,
  username = excluded.username,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone_number = excluded.phone_number,
  date_of_birth = excluded.date_of_birth,
  headline = excluded.headline,
  preferred_language = excluded.preferred_language,
  role = excluded.role,
  account_status = excluded.account_status;

insert into public.employees (
  employee_id,
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
) values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'EMP-ADMIN-001',
    'Gymster Admin',
    'admin@gymster.local',
    '0900000001',
    'admin',
    'Management',
    '2024-01-01',
    25000000,
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    'EMP-STAFF-001',
    'Gymster Staff',
    'staff@gymster.local',
    '0900000002',
    'staff',
    'Front Desk',
    '2024-02-01',
    12000000,
    'active'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000003',
    'EMP-PT-001',
    'Alex Carter',
    'trainer@gymster.local',
    '0900000003',
    'trainer',
    'Personal Training',
    '2024-03-01',
    18000000,
    'active'
  )
on conflict (employee_id) do update set
  user_id = excluded.user_id,
  employee_code = excluded.employee_code,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  role = excluded.role,
  department = excluded.department,
  status = excluded.status;

insert into public.trainers (
  trainer_id,
  user_id,
  employee_id,
  trainer_code,
  specialty,
  bio,
  rating,
  current_active_members,
  max_active_members,
  available_schedule_slots,
  status
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003',
    'PT-001',
    'Strength Training',
    'Personal trainer focused on strength, form, and progressive overload.',
    4.8,
    8,
    12,
    '["Monday / Wednesday / Friday, 18:00 - 19:00", "Tuesday / Thursday, 19:00 - 20:00"]'::jsonb,
    'active'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    null,
    null,
    'PT-002',
    'Weight Loss',
    'Demo trainer for cardio and weight-loss programs.',
    4.6,
    10,
    10,
    '["Saturday / Sunday, 07:00 - 08:00"]'::jsonb,
    'full'
  )
on conflict (trainer_id) do update set
  user_id = excluded.user_id,
  employee_id = excluded.employee_id,
  trainer_code = excluded.trainer_code,
  specialty = excluded.specialty,
  bio = excluded.bio,
  rating = excluded.rating,
  current_active_members = excluded.current_active_members,
  max_active_members = excluded.max_active_members,
  available_schedule_slots = excluded.available_schedule_slots,
  status = excluded.status;

insert into public.packages (
  package_id,
  package_code,
  package_name,
  package_type,
  duration_months,
  price,
  description,
  session_limit,
  has_personal_trainer,
  is_popular,
  status
) values
  (
    '30000000-0000-4000-8000-000000000001',
    'BASIC-3M',
    'Basic Gym 3 Months',
    'gym',
    3,
    900000,
    'Access to gym facilities for three months.',
    null,
    false,
    false,
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'BASIC-6M',
    'Basic Gym 6 Months',
    'gym',
    6,
    1600000,
    'Access to gym facilities for six months.',
    null,
    false,
    true,
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'PT-3M',
    'PT Package 3 Months',
    'pt',
    3,
    3500000,
    'Personal training package with fixed weekly sessions.',
    24,
    true,
    false,
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    'VIP-PT-6M',
    'VIP PT Package 6 Months',
    'vip_pt',
    6,
    7800000,
    'VIP personal training package with extended coaching support.',
    60,
    true,
    true,
    'active'
  )
on conflict (package_id) do update set
  package_code = excluded.package_code,
  package_name = excluded.package_name,
  package_type = excluded.package_type,
  duration_months = excluded.duration_months,
  price = excluded.price,
  description = excluded.description,
  session_limit = excluded.session_limit,
  has_personal_trainer = excluded.has_personal_trainer,
  is_popular = excluded.is_popular,
  status = excluded.status;

insert into public.package_features (
  package_feature_id,
  package_id,
  feature_name,
  feature_description,
  display_order
) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Gym Access', 'Use standard gym training areas.', 1),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Gym Access', 'Use standard gym training areas.', 1),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', 'Longer Validity', 'Six months of membership access.', 2),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', 'Personal Trainer', 'Includes trainer assignment and PT schedule.', 1),
  ('31000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', '24 Sessions', 'Includes up to 24 PT sessions.', 2),
  ('31000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', 'VIP Personal Trainer', 'Priority PT support and coaching.', 1),
  ('31000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', '60 Sessions', 'Includes up to 60 PT sessions.', 2)
on conflict (package_feature_id) do update set
  package_id = excluded.package_id,
  feature_name = excluded.feature_name,
  feature_description = excluded.feature_description,
  display_order = excluded.display_order;

insert into public.members (
  member_id,
  user_id,
  member_code,
  emergency_contact_name,
  emergency_contact_phone,
  health_notes,
  join_date,
  status
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'MB-001',
    'Casey Morgan',
    '0911000004',
    'No known restrictions.',
    '2025-01-10',
    'active'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000005',
    'MB-002',
    null,
    null,
    null,
    null,
    'pending_onboarding'
  )
on conflict (member_id) do update set
  user_id = excluded.user_id,
  member_code = excluded.member_code,
  emergency_contact_name = excluded.emergency_contact_name,
  emergency_contact_phone = excluded.emergency_contact_phone,
  health_notes = excluded.health_notes,
  join_date = excluded.join_date,
  status = excluded.status;

insert into public.member_packages (
  member_package_id,
  member_id,
  package_id,
  trainer_id,
  status,
  start_date,
  end_date,
  sessions_total,
  sessions_used,
  activated_at
) values
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000001',
    'active',
    current_date - interval '30 days',
    current_date + interval '60 days',
    24,
    6,
    now() - interval '30 days'
  )
on conflict (member_package_id) do update set
  member_id = excluded.member_id,
  package_id = excluded.package_id,
  trainer_id = excluded.trainer_id,
  status = excluded.status,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  sessions_total = excluded.sessions_total,
  sessions_used = excluded.sessions_used,
  activated_at = excluded.activated_at;

insert into public.training_requests (
  training_request_id,
  member_id,
  trainer_id,
  package_id,
  member_package_id,
  requested_schedule,
  status,
  decline_reason,
  approved_at
) values
  (
    '60000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    'Monday / Wednesday / Friday, 18:00 - 19:00',
    'completed',
    '',
    now() - interval '31 days'
  )
on conflict (training_request_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  package_id = excluded.package_id,
  member_package_id = excluded.member_package_id,
  requested_schedule = excluded.requested_schedule,
  status = excluded.status,
  decline_reason = excluded.decline_reason,
  approved_at = excluded.approved_at;

insert into public.payments (
  payment_id,
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
  paid_at
) values
  (
    '70000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000003',
    '50000000-0000-4000-8000-000000000001',
    '60000000-0000-4000-8000-000000000001',
    3500000,
    'VND',
    'bank_transfer',
    'paid',
    'GYMSTER MB-001 PT-3M',
    'MOCK-BANK-TRANSFER-001',
    now() - interval '30 days'
  )
on conflict (payment_id) do update set
  member_id = excluded.member_id,
  package_id = excluded.package_id,
  member_package_id = excluded.member_package_id,
  training_request_id = excluded.training_request_id,
  amount = excluded.amount,
  currency = excluded.currency,
  payment_method = excluded.payment_method,
  payment_status = excluded.payment_status,
  transfer_content = excluded.transfer_content,
  provider_reference = excluded.provider_reference,
  paid_at = excluded.paid_at;

insert into public.invoices (
  invoice_id,
  invoice_number,
  payment_id,
  member_id,
  employee_id,
  subtotal_amount,
  discount_amount,
  tax_amount,
  total_amount,
  invoice_status,
  issued_at,
  due_at,
  paid_at
) values
  (
    '80000000-0000-4000-8000-000000000001',
    'INV-2026-0001',
    '70000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    3500000,
    0,
    0,
    3500000,
    'paid',
    now() - interval '30 days',
    now() - interval '23 days',
    now() - interval '30 days'
  )
on conflict (invoice_id) do update set
  invoice_number = excluded.invoice_number,
  payment_id = excluded.payment_id,
  member_id = excluded.member_id,
  employee_id = excluded.employee_id,
  subtotal_amount = excluded.subtotal_amount,
  discount_amount = excluded.discount_amount,
  tax_amount = excluded.tax_amount,
  total_amount = excluded.total_amount,
  invoice_status = excluded.invoice_status,
  issued_at = excluded.issued_at,
  due_at = excluded.due_at,
  paid_at = excluded.paid_at;

insert into public.workout_sessions (
  workout_session_id,
  member_id,
  trainer_id,
  member_package_id,
  title,
  exercise_type,
  room_name,
  session_date,
  start_time,
  end_time,
  status,
  notes
) values
  (
    '90000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Strength Training Session',
    'Strength',
    'PT Room 1',
    current_date + interval '2 days',
    '18:00',
    '19:00',
    'scheduled',
    'Demo upcoming PT session.'
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'Completed PT Session',
    'Strength',
    'PT Room 1',
    current_date - interval '3 days',
    '18:00',
    '19:00',
    'completed',
    'Demo completed PT session.'
  )
on conflict (workout_session_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  member_package_id = excluded.member_package_id,
  title = excluded.title,
  exercise_type = excluded.exercise_type,
  room_name = excluded.room_name,
  session_date = excluded.session_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  status = excluded.status,
  notes = excluded.notes;

insert into public.notifications (
  notification_id,
  user_id,
  notification_type,
  title,
  message,
  is_read,
  read_at
) values
  (
    'a0000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000004',
    'schedule',
    'Upcoming training session',
    'You have a PT session scheduled soon.',
    false,
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000005',
    'account',
    'Complete your membership',
    'Choose a package to continue onboarding.',
    false,
    null
  )
on conflict (notification_id) do update set
  user_id = excluded.user_id,
  notification_type = excluded.notification_type,
  title = excluded.title,
  message = excluded.message,
  is_read = excluded.is_read,
  read_at = excluded.read_at;

insert into public.rooms (
  room_id,
  room_code,
  room_name,
  room_type,
  capacity,
  status
) values
  ('b1000000-0000-4000-8000-000000000001', 'ROOM-GYM-01', 'Main Gym Floor', 'gym', 80, 'active'),
  ('b1000000-0000-4000-8000-000000000002', 'ROOM-PT-01', 'PT Studio 1', 'pt_studio', 8, 'active'),
  ('b1000000-0000-4000-8000-000000000003', 'ROOM-REC-01', 'Recovery Room', 'recovery', 10, 'maintenance')
on conflict (room_id) do update set
  room_code = excluded.room_code,
  room_name = excluded.room_name,
  room_type = excluded.room_type,
  capacity = excluded.capacity,
  status = excluded.status;

insert into public.equipment (
  equipment_id,
  room_id,
  equipment_code,
  equipment_name,
  category,
  brand,
  purchase_date,
  last_maintenance_date,
  next_maintenance_date,
  status,
  notes
) values
  (
    'b2000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    'EQ-TREAD-001',
    'Treadmill 01',
    'Cardio',
    'DemoFit',
    '2025-01-10',
    current_date - 30,
    current_date + 30,
    'active',
    'Demo treadmill for equipment management.'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000001',
    'EQ-BENCH-001',
    'Adjustable Bench 01',
    'Strength',
    'DemoFit',
    '2025-02-15',
    current_date - 10,
    current_date + 50,
    'under_maintenance',
    'Seat pad requires inspection.'
  )
on conflict (equipment_id) do update set
  room_id = excluded.room_id,
  equipment_code = excluded.equipment_code,
  equipment_name = excluded.equipment_name,
  category = excluded.category,
  brand = excluded.brand,
  purchase_date = excluded.purchase_date,
  last_maintenance_date = excluded.last_maintenance_date,
  next_maintenance_date = excluded.next_maintenance_date,
  status = excluded.status,
  notes = excluded.notes;

insert into public.maintenance_reports (
  maintenance_report_id,
  equipment_id,
  room_id,
  reported_by_user_id,
  issue_title,
  issue_description,
  priority,
  status
) values
  (
    'b3000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'Bench seat pad issue',
    'The adjustable bench seat pad needs inspection before peak hours.',
    'medium',
    'in_progress'
  )
on conflict (maintenance_report_id) do update set
  equipment_id = excluded.equipment_id,
  room_id = excluded.room_id,
  reported_by_user_id = excluded.reported_by_user_id,
  issue_title = excluded.issue_title,
  issue_description = excluded.issue_description,
  priority = excluded.priority,
  status = excluded.status;

insert into public.maintenance_records (
  maintenance_record_id,
  maintenance_report_id,
  equipment_id,
  handled_by_employee_id,
  maintenance_type,
  description,
  cost,
  completed_at
) values
  (
    'b4000000-0000-4000-8000-000000000001',
    'b3000000-0000-4000-8000-000000000001',
    'b2000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'inspection',
    'Initial inspection created from demo maintenance report.',
    0,
    null
  )
on conflict (maintenance_record_id) do update set
  maintenance_report_id = excluded.maintenance_report_id,
  equipment_id = excluded.equipment_id,
  handled_by_employee_id = excluded.handled_by_employee_id,
  maintenance_type = excluded.maintenance_type,
  description = excluded.description,
  cost = excluded.cost,
  completed_at = excluded.completed_at;

insert into public.service_feedback (
  feedback_id,
  member_id,
  trainer_id,
  workout_session_id,
  target_type,
  rating,
  comment,
  tags,
  status,
  staff_response
) values
  (
    'b5000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'trainer',
    5,
    'Great coaching and clear workout guidance.',
    array['coaching', 'pt'],
    'submitted',
    null
  )
on conflict (feedback_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  workout_session_id = excluded.workout_session_id,
  target_type = excluded.target_type,
  rating = excluded.rating,
  comment = excluded.comment,
  tags = excluded.tags,
  status = excluded.status,
  staff_response = excluded.staff_response;

insert into public.complaints (
  complaint_id,
  member_id,
  assigned_employee_id,
  complaint_type,
  title,
  description,
  priority,
  status
) values
  (
    'b6000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'facility',
    'Locker area temperature',
    'Locker room temperature was too warm during evening hours.',
    'low',
    'open'
  )
on conflict (complaint_id) do update set
  member_id = excluded.member_id,
  assigned_employee_id = excluded.assigned_employee_id,
  complaint_type = excluded.complaint_type,
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  status = excluded.status;

insert into public.employee_schedules (
  employee_schedule_id,
  employee_id,
  room_id,
  shift_date,
  start_time,
  end_time,
  shift_type,
  status,
  notes
) values
  (
    'b7000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000001',
    current_date,
    '08:00',
    '16:00',
    'regular',
    'scheduled',
    'Front desk coverage.'
  ),
  (
    'b7000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'b1000000-0000-4000-8000-000000000002',
    current_date + 1,
    '17:00',
    '21:00',
    'regular',
    'scheduled',
    'Evening PT sessions.'
  )
on conflict (employee_schedule_id) do update set
  employee_id = excluded.employee_id,
  room_id = excluded.room_id,
  shift_date = excluded.shift_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  shift_type = excluded.shift_type,
  status = excluded.status,
  notes = excluded.notes;

insert into public.payroll_periods (
  payroll_period_id,
  period_name,
  period_start,
  period_end,
  status
) values
  (
    'b8000000-0000-4000-8000-000000000001',
    'May 2026 Payroll',
    '2026-05-01',
    '2026-05-31',
    'approved'
  )
on conflict (payroll_period_id) do update set
  period_name = excluded.period_name,
  period_start = excluded.period_start,
  period_end = excluded.period_end,
  status = excluded.status;

insert into public.payslips (
  payslip_id,
  payroll_period_id,
  employee_id,
  base_salary,
  bonus_amount,
  deduction_amount,
  net_amount,
  status,
  paid_at,
  notes
) values
  (
    'b9000000-0000-4000-8000-000000000001',
    'b8000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    12000000,
    1000000,
    0,
    13000000,
    'approved',
    null,
    'Demo staff payslip.'
  ),
  (
    'b9000000-0000-4000-8000-000000000002',
    'b8000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    18000000,
    1500000,
    0,
    19500000,
    'approved',
    null,
    'Demo trainer payslip.'
  )
on conflict (payslip_id) do update set
  payroll_period_id = excluded.payroll_period_id,
  employee_id = excluded.employee_id,
  base_salary = excluded.base_salary,
  bonus_amount = excluded.bonus_amount,
  deduction_amount = excluded.deduction_amount,
  net_amount = excluded.net_amount,
  status = excluded.status,
  paid_at = excluded.paid_at,
  notes = excluded.notes;

insert into public.performance_reviews (
  performance_review_id,
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
) values
  (
    'ba000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '2026 Q2',
    92,
    5,
    'Strong coaching quality and retention.',
    'Document progress notes more consistently.',
    'Improve weekly progress tracking coverage.',
    'submitted',
    now()
  )
on conflict (performance_review_id) do update set
  employee_id = excluded.employee_id,
  reviewer_user_id = excluded.reviewer_user_id,
  review_period = excluded.review_period,
  score = excluded.score,
  rating = excluded.rating,
  strengths = excluded.strengths,
  improvement_areas = excluded.improvement_areas,
  goals = excluded.goals,
  status = excluded.status,
  reviewed_at = excluded.reviewed_at;

insert into public.trainer_assignments (
  trainer_assignment_id,
  trainer_id,
  member_id,
  member_package_id,
  status,
  notes
) values
  (
    'bb000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    'active',
    'Demo active PT assignment.'
  )
on conflict (trainer_assignment_id) do update set
  trainer_id = excluded.trainer_id,
  member_id = excluded.member_id,
  member_package_id = excluded.member_package_id,
  status = excluded.status,
  notes = excluded.notes;

insert into public.training_goals (
  training_goal_id,
  member_id,
  trainer_id,
  goal_title,
  target_value,
  current_value,
  unit,
  target_date,
  status
) values
  (
    'bc000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Increase strength score',
    90,
    76,
    'points',
    current_date + 60,
    'active'
  )
on conflict (training_goal_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  goal_title = excluded.goal_title,
  target_value = excluded.target_value,
  current_value = excluded.current_value,
  unit = excluded.unit,
  target_date = excluded.target_date,
  status = excluded.status;

insert into public.progress_records (
  progress_record_id,
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
) values
  (
    'bd000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    current_date - 3,
    72.5,
    18.5,
    34.2,
    420,
    82,
    'Good training consistency.'
  )
on conflict (progress_record_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  workout_session_id = excluded.workout_session_id,
  record_date = excluded.record_date,
  weight_kg = excluded.weight_kg,
  body_fat_percent = excluded.body_fat_percent,
  muscle_mass_kg = excluded.muscle_mass_kg,
  calories_burned = excluded.calories_burned,
  performance_score = excluded.performance_score,
  notes = excluded.notes;

insert into public.body_metrics (
  body_metric_id,
  member_id,
  recorded_by_trainer_id,
  height_cm,
  weight_kg,
  body_fat_percent,
  muscle_mass_kg,
  chest_cm,
  waist_cm,
  hip_cm,
  notes
) values
  (
    'be000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    175,
    72.5,
    18.5,
    34.2,
    96,
    82,
    94,
    'Baseline PT body metrics.'
  )
on conflict (body_metric_id) do update set
  member_id = excluded.member_id,
  recorded_by_trainer_id = excluded.recorded_by_trainer_id,
  height_cm = excluded.height_cm,
  weight_kg = excluded.weight_kg,
  body_fat_percent = excluded.body_fat_percent,
  muscle_mass_kg = excluded.muscle_mass_kg,
  chest_cm = excluded.chest_cm,
  waist_cm = excluded.waist_cm,
  hip_cm = excluded.hip_cm,
  notes = excluded.notes;

insert into public.medical_records (
  medical_record_id,
  member_id,
  condition_name,
  allergies,
  medications,
  injury_notes,
  emergency_notes,
  clearance_status
) values
  (
    'bf000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'None reported',
    'None',
    'None',
    'No active injuries reported.',
    'Contact emergency contact before high-intensity tests if needed.',
    'cleared'
  )
on conflict (medical_record_id) do update set
  member_id = excluded.member_id,
  condition_name = excluded.condition_name,
  allergies = excluded.allergies,
  medications = excluded.medications,
  injury_notes = excluded.injury_notes,
  emergency_notes = excluded.emergency_notes,
  clearance_status = excluded.clearance_status;

insert into public.workout_plans (
  workout_plan_id,
  member_id,
  trainer_id,
  plan_name,
  plan_goal,
  start_date,
  end_date,
  status,
  notes
) values
  (
    'c1000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Strength Foundation Plan',
    'Build consistent compound lift technique.',
    current_date,
    current_date + 30,
    'active',
    'Demo workout guidance plan.'
  )
on conflict (workout_plan_id) do update set
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  plan_name = excluded.plan_name,
  plan_goal = excluded.plan_goal,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  notes = excluded.notes;

insert into public.workout_plan_exercises (
  workout_plan_exercise_id,
  workout_plan_id,
  exercise_name,
  exercise_type,
  sets,
  reps,
  duration_minutes,
  intensity,
  notes,
  display_order
) values
  (
    'c2000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'Goblet Squat',
    'Strength',
    4,
    '10',
    null,
    'moderate',
    'Focus on stable posture.',
    1
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    'c1000000-0000-4000-8000-000000000001',
    'Row Machine',
    'Cardio',
    null,
    null,
    12,
    'moderate',
    'Keep pace steady.',
    2
  )
on conflict (workout_plan_exercise_id) do update set
  workout_plan_id = excluded.workout_plan_id,
  exercise_name = excluded.exercise_name,
  exercise_type = excluded.exercise_type,
  sets = excluded.sets,
  reps = excluded.reps,
  duration_minutes = excluded.duration_minutes,
  intensity = excluded.intensity,
  notes = excluded.notes,
  display_order = excluded.display_order;

insert into public.meal_plans (
  meal_plan_id,
  trainer_id,
  plan_name,
  goal,
  calories_per_day,
  protein_grams,
  carbs_grams,
  fat_grams,
  meals,
  status
) values
  (
    'c3000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Balanced Strength Meal Plan',
    'Support strength training and recovery.',
    2200,
    150,
    240,
    70,
    '[{"meal":"Breakfast","items":["Oats","Eggs","Fruit"]},{"meal":"Lunch","items":["Chicken breast","Rice","Vegetables"]},{"meal":"Dinner","items":["Fish","Sweet potato","Salad"]}]'::jsonb,
    'active'
  )
on conflict (meal_plan_id) do update set
  trainer_id = excluded.trainer_id,
  plan_name = excluded.plan_name,
  goal = excluded.goal,
  calories_per_day = excluded.calories_per_day,
  protein_grams = excluded.protein_grams,
  carbs_grams = excluded.carbs_grams,
  fat_grams = excluded.fat_grams,
  meals = excluded.meals,
  status = excluded.status;

insert into public.meal_plan_assignments (
  meal_plan_assignment_id,
  meal_plan_id,
  member_id,
  trainer_id,
  status,
  notes
) values
  (
    'c4000000-0000-4000-8000-000000000001',
    'c3000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'active',
    'Demo assigned meal plan.'
  )
on conflict (meal_plan_assignment_id) do update set
  meal_plan_id = excluded.meal_plan_id,
  member_id = excluded.member_id,
  trainer_id = excluded.trainer_id,
  status = excluded.status,
  notes = excluded.notes;

insert into public.package_change_requests (
  package_change_request_id,
  member_id,
  current_member_package_id,
  requested_package_id,
  request_type,
  amount,
  payment_method,
  status,
  reviewed_by_employee_id,
  reviewed_at,
  deny_reason
) values
  (
    'c5000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000004',
    'upgrade',
    7800000,
    'bank_transfer',
    'pending',
    null,
    null,
    null
  )
on conflict (package_change_request_id) do update set
  member_id = excluded.member_id,
  current_member_package_id = excluded.current_member_package_id,
  requested_package_id = excluded.requested_package_id,
  request_type = excluded.request_type,
  amount = excluded.amount,
  payment_method = excluded.payment_method,
  status = excluded.status,
  reviewed_by_employee_id = excluded.reviewed_by_employee_id,
  reviewed_at = excluded.reviewed_at,
  deny_reason = excluded.deny_reason;

insert into public.member_usage_history (
  member_usage_history_id,
  member_id,
  member_package_id,
  workout_session_id,
  usage_type,
  usage_date,
  description
) values
  (
    'c6000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000001',
    '90000000-0000-4000-8000-000000000002',
    'workout_session',
    now() - interval '3 days',
    'Completed demo PT session.'
  )
on conflict (member_usage_history_id) do update set
  member_id = excluded.member_id,
  member_package_id = excluded.member_package_id,
  workout_session_id = excluded.workout_session_id,
  usage_type = excluded.usage_type,
  usage_date = excluded.usage_date,
  description = excluded.description;

-- Keep compatibility columns populated for the current frontend service layer.

update public.members m
set
  full_name = coalesce(nullif(m.full_name, ''), nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '')),
  phone_number = coalesce(nullif(m.phone_number, ''), u.phone_number),
  date_of_birth = coalesce(m.date_of_birth, u.date_of_birth),
  gender = coalesce(nullif(m.gender, ''), u.gender)
from public.users u
where m.user_id = u.user_id;

update public.trainers t
set
  full_name = coalesce(
    nullif(t.full_name, ''),
    (select nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '') from public.users u where u.user_id = t.user_id),
    (select e.full_name from public.employees e where e.employee_id = t.employee_id),
    t.trainer_code
  ),
  avatar_url = coalesce(
    nullif(t.avatar_url, ''),
    (select u.avatar_url from public.users u where u.user_id = t.user_id)
  ),
  available_slots = case
    when t.available_slots = '[]'::jsonb then t.available_schedule_slots
    else t.available_slots
  end;

update public.packages
set is_active = case
  when status in ('inactive', 'archived') then false
  else true
end;

update public.member_packages
set
  used_sessions = coalesce(used_sessions, sessions_used, 0),
  remaining_sessions = coalesce(remaining_sessions, greatest(coalesce(sessions_total, 0) - coalesce(sessions_used, 0), 0));

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
  package_id = coalesce(ws.package_id, mp.package_id)
from public.member_packages mp
where ws.member_package_id = mp.member_package_id;

-- Larger demo dataset for portal migration testing.

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
)
select
  'member' || i || '@gymster.local',
  'member' || i,
  'demo-only:Member@123',
  'Member',
  lpad(i::text, 2, '0'),
  '09100000' || lpad(i::text, 2, '0'),
  date '1995-01-01' + (i * interval '31 days'),
  case when i % 3 = 0 then 'female' when i % 3 = 1 then 'male' else 'unspecified' end,
  'member',
  'Demo member account for membership, payments, and workout testing.',
  'en',
  'active'
from generate_series(1, 20) as i
on conflict (email) do update set
  username = excluded.username,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone_number = excluded.phone_number,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  headline = excluded.headline,
  preferred_language = excluded.preferred_language,
  role = excluded.role,
  account_status = excluded.account_status;

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
)
select
  'trainer' || i || '@gymster.local',
  'trainer' || i,
  'demo-only:Trainer@123',
  'Trainer',
  lpad(i::text, 2, '0'),
  '09200000' || lpad(i::text, 2, '0'),
  date '1990-01-01' + (i * interval '45 days'),
  case when i % 2 = 0 then 'female' else 'male' end,
  'trainer',
  'Demo trainer profile for PT scheduling and progress testing.',
  'en',
  'active'
from generate_series(1, 6) as i
on conflict (email) do update set
  username = excluded.username,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone_number = excluded.phone_number,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  headline = excluded.headline,
  preferred_language = excluded.preferred_language,
  role = excluded.role,
  account_status = excluded.account_status;

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
)
select
  'staff' || i || '@gymster.local',
  'staff' || i,
  'demo-only:Staff@123',
  'Staff',
  lpad(i::text, 2, '0'),
  '09300000' || lpad(i::text, 2, '0'),
  date '1992-01-01' + (i * interval '37 days'),
  'unspecified',
  'staff',
  'Demo staff account for member operations and service management.',
  'en',
  'active'
from generate_series(1, 6) as i
on conflict (email) do update set
  username = excluded.username,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone_number = excluded.phone_number,
  date_of_birth = excluded.date_of_birth,
  headline = excluded.headline,
  preferred_language = excluded.preferred_language,
  role = excluded.role,
  account_status = excluded.account_status;

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
  'MB-DEMO-' || lpad(i::text, 3, '0'),
  nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
  u.phone_number,
  u.date_of_birth,
  u.gender,
  'Emergency Contact ' || i,
  '09880000' || lpad(i::text, 2, '0'),
  case when i % 5 = 0 then 'Requires low-impact warmup.' else 'No known restrictions.' end,
  current_date - (i * 7),
  'active'
from generate_series(1, 20) as i
join public.users u on u.email = 'member' || i || '@gymster.local'
on conflict (user_id) do update set
  member_code = excluded.member_code,
  full_name = excluded.full_name,
  phone_number = excluded.phone_number,
  date_of_birth = excluded.date_of_birth,
  gender = excluded.gender,
  emergency_contact_name = excluded.emergency_contact_name,
  emergency_contact_phone = excluded.emergency_contact_phone,
  health_notes = excluded.health_notes,
  join_date = excluded.join_date,
  status = excluded.status;

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
  'EMP-STAFF-DEMO-' || lpad(i::text, 3, '0'),
  nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
  u.email,
  u.phone_number,
  'staff',
  case when i % 2 = 0 then 'Member Services' else 'Operations' end,
  current_date - (i * 45),
  10000000 + i * 500000,
  'active'
from generate_series(1, 6) as i
join public.users u on u.email = 'staff' || i || '@gymster.local'
on conflict (employee_code) do update set
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  role = excluded.role,
  department = excluded.department,
  hire_date = excluded.hire_date,
  base_salary = excluded.base_salary,
  status = excluded.status;

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
  'EMP-PT-DEMO-' || lpad(i::text, 3, '0'),
  nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
  u.email,
  u.phone_number,
  'trainer',
  'Personal Training',
  current_date - (i * 60),
  15000000 + i * 750000,
  'active'
from generate_series(1, 6) as i
join public.users u on u.email = 'trainer' || i || '@gymster.local'
on conflict (employee_code) do update set
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number,
  role = excluded.role,
  department = excluded.department,
  hire_date = excluded.hire_date,
  base_salary = excluded.base_salary,
  status = excluded.status;

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
  'PT-DEMO-' || lpad(i::text, 3, '0'),
  nullif(trim(concat_ws(' ', u.first_name, u.last_name)), ''),
  case
    when i % 3 = 0 then 'Mobility and Recovery'
    when i % 3 = 1 then 'Strength Training'
    else 'Weight Loss and HIIT'
  end,
  'Demo trainer profile for Supabase migration testing.',
  4.2 + (i::numeric / 10),
  3 + i,
  12,
  '["Monday / Wednesday / Friday, 18:00 - 19:00", "Saturday / Sunday, 07:00 - 08:00"]'::jsonb,
  '["Monday / Wednesday / Friday, 18:00 - 19:00", "Saturday / Sunday, 07:00 - 08:00"]'::jsonb,
  case when i = 6 then 'full' else 'active' end
from generate_series(1, 6) as i
join public.users u on u.email = 'trainer' || i || '@gymster.local'
join public.employees e on e.user_id = u.user_id
on conflict (trainer_code) do update set
  user_id = excluded.user_id,
  employee_id = excluded.employee_id,
  full_name = excluded.full_name,
  specialty = excluded.specialty,
  bio = excluded.bio,
  rating = excluded.rating,
  current_active_members = excluded.current_active_members,
  max_active_members = excluded.max_active_members,
  available_schedule_slots = excluded.available_schedule_slots,
  available_slots = excluded.available_slots,
  status = excluded.status;

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
  ('GYM-1M', 'Basic Gym 1 Month', 'gym', 1, 350000, 'Short-term gym access package.', null, false, false, true, 'active'),
  ('GYM-12M', 'Basic Gym 12 Months', 'gym', 12, 2900000, 'Annual gym access package.', null, false, true, true, 'active'),
  ('PT-1M', 'PT Package 1 Month', 'pt', 1, 1500000, 'Starter PT package with fixed weekly sessions.', 8, true, false, true, 'active'),
  ('PT-6M', 'PT Package 6 Months', 'pt', 6, 6500000, 'Long-term personal training package.', 48, true, true, true, 'active'),
  ('VIP-PT-12M', 'VIP PT Package 12 Months', 'vip_pt', 12, 14500000, 'Annual VIP PT coaching package.', 120, true, true, true, 'active')
on conflict (package_code) do update set
  package_name = excluded.package_name,
  package_type = excluded.package_type,
  duration_months = excluded.duration_months,
  price = excluded.price,
  description = excluded.description,
  session_limit = excluded.session_limit,
  has_personal_trainer = excluded.has_personal_trainer,
  is_popular = excluded.is_popular,
  is_active = excluded.is_active,
  status = excluded.status;

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
  case when p.has_personal_trainer then t.trainer_id else null end,
  'active',
  current_date - (i * 5),
  current_date + (p.duration_months * interval '1 month') - (i * interval '5 days'),
  coalesce(p.session_limit, 0),
  case when p.session_limit is null then 0 else least(p.session_limit, i % 10) end,
  case when p.session_limit is null then 0 else least(p.session_limit, i % 10) end,
  case when p.session_limit is null then null else greatest(p.session_limit - least(p.session_limit, i % 10), 0) end,
  now() - (i * interval '5 days')
from generate_series(1, 20) as i
join public.members m on m.member_code = 'MB-DEMO-' || lpad(i::text, 3, '0')
join public.packages p on p.package_code = case
  when i % 4 = 0 then 'PT-6M'
  when i % 4 = 1 then 'BASIC-6M'
  when i % 4 = 2 then 'GYM-12M'
  else 'PT-3M'
end
left join public.trainers t on t.trainer_code = 'PT-DEMO-' || lpad(((i % 5) + 1)::text, 3, '0')
where not exists (
  select 1 from public.member_packages mp
  where mp.member_id = m.member_id and mp.package_id = p.package_id
);

insert into public.payments (
  member_id,
  package_id,
  member_package_id,
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
  mp.member_id,
  mp.package_id,
  mp.member_package_id,
  p.price,
  'VND',
  case when i % 4 = 0 then 'cash' when i % 4 = 1 then 'bank_transfer' when i % 4 = 2 then 'credit_card' else 'e_wallet' end,
  case when i % 9 = 0 then 'pending' when i % 13 = 0 then 'failed' else 'paid' end,
  'GYMSTER PAYMENT DEMO ' || i,
  'DEMO-TXN-' || lpad(i::text, 4, '0'),
  case when i % 9 = 0 then null else now() - (i * interval '3 days') end,
  now() - (i * interval '3 days'),
  'DEMO-TXN-' || lpad(i::text, 4, '0')
from generate_series(1, 20) as i
join public.members m on m.member_code = 'MB-DEMO-' || lpad(i::text, 3, '0')
join public.member_packages mp on mp.member_id = m.member_id
join public.packages p on p.package_id = mp.package_id
where not exists (
  select 1 from public.payments pay
  where pay.transaction_code = 'DEMO-TXN-' || lpad(i::text, 4, '0')
);

insert into public.invoices (
  invoice_number,
  payment_id,
  member_id,
  subtotal_amount,
  discount_amount,
  tax_amount,
  total_amount,
  amount,
  invoice_status,
  status,
  issued_at,
  paid_at
)
select
  'INV-DEMO-' || lpad(i::text, 4, '0'),
  pay.payment_id,
  pay.member_id,
  pay.amount,
  0,
  0,
  pay.amount,
  pay.amount,
  case when pay.payment_status = 'paid' then 'paid' else 'issued' end,
  case when pay.payment_status = 'paid' then 'paid' else 'issued' end,
  pay.created_at,
  pay.paid_at
from generate_series(1, 20) as i
join public.payments pay on pay.transaction_code = 'DEMO-TXN-' || lpad(i::text, 4, '0')
on conflict (invoice_number) do update set
  payment_id = excluded.payment_id,
  member_id = excluded.member_id,
  subtotal_amount = excluded.subtotal_amount,
  total_amount = excluded.total_amount,
  amount = excluded.amount,
  invoice_status = excluded.invoice_status,
  status = excluded.status,
  issued_at = excluded.issued_at,
  paid_at = excluded.paid_at;

insert into public.package_change_requests (
  member_id,
  current_member_package_id,
  requested_package_id,
  request_type,
  amount,
  payment_method,
  status,
  deny_reason
)
select
  mp.member_id,
  mp.member_package_id,
  p2.package_id,
  case when i % 3 = 0 then 'upgrade' when i % 3 = 1 then 'renew' else 'buy' end,
  p2.price,
  case when i % 2 = 0 then 'bank_transfer' else 'cash' end,
  case when i % 5 = 0 then 'denied' when i % 4 = 0 then 'approved' else 'pending' end,
  case when i % 5 = 0 then 'Demo denial reason for staff review testing.' else null end
from generate_series(1, 12) as i
join public.members m on m.member_code = 'MB-DEMO-' || lpad(i::text, 3, '0')
join public.member_packages mp on mp.member_id = m.member_id
join public.packages p2 on p2.package_code = case when i % 2 = 0 then 'VIP-PT-6M' else 'PT-6M' end
where not exists (
  select 1 from public.package_change_requests req
  where req.member_id = mp.member_id and req.requested_package_id = p2.package_id
);

insert into public.workout_sessions (
  member_id,
  trainer_id,
  member_package_id,
  package_id,
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
  'Demo PT Session ' || i,
  'Demo PT Session ' || i,
  case when i % 3 = 0 then 'Mobility' when i % 3 = 1 then 'Strength' else 'HIIT' end,
  'PT Studio 1',
  current_date + ((i % 14) * interval '1 day'),
  time '18:00',
  time '19:00',
  case when i % 7 = 0 then 'completed' else 'scheduled' end,
  'Generated demo workout session.',
  'Generated demo workout session.'
from generate_series(1, 40) as i
join public.member_packages mp on mp.trainer_id is not null
where not exists (
  select 1 from public.workout_sessions ws
  where ws.member_package_id = mp.member_package_id
    and ws.title = 'Demo PT Session ' || i
)
limit 40;

insert into public.service_feedback (
  member_id,
  trainer_id,
  target_type,
  rating,
  comment,
  tags,
  status,
  staff_response
)
select
  m.member_id,
  t.trainer_id,
  case when i % 3 = 0 then 'facility' when i % 3 = 1 then 'trainer' else 'service' end,
  3 + (i % 3),
  'Generated member feedback #' || i,
  array['demo', 'migration'],
  case when i % 4 = 0 then 'resolved' when i % 4 = 1 then 'in_review' else 'submitted' end,
  case when i % 4 = 0 then 'Thank you for the feedback.' else null end
from generate_series(1, 20) as i
join public.members m on m.member_code = 'MB-DEMO-' || lpad(((i % 20) + 1)::text, 3, '0')
left join public.trainers t on t.trainer_code = 'PT-DEMO-' || lpad(((i % 5) + 1)::text, 3, '0')
where not exists (
  select 1 from public.service_feedback sf
  where sf.member_id = m.member_id and sf.comment = 'Generated member feedback #' || i
);

insert into public.complaints (
  member_id,
  complaint_type,
  title,
  description,
  priority,
  status
)
select
  m.member_id,
  case when i % 3 = 0 then 'equipment' when i % 3 = 1 then 'facility' else 'service' end,
  'Generated complaint #' || i,
  'Generated complaint description for migration testing.',
  case when i % 4 = 0 then 'high' else 'medium' end,
  case when i % 4 = 0 then 'in_progress' when i % 4 = 1 then 'resolved' else 'open' end
from generate_series(1, 12) as i
join public.members m on m.member_code = 'MB-DEMO-' || lpad(((i % 20) + 1)::text, 3, '0')
where not exists (
  select 1 from public.complaints c
  where c.member_id = m.member_id and c.title = 'Generated complaint #' || i
);
