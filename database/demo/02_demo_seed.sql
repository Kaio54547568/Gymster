-- Small, coherent Gymster demo dataset.
-- Run only after 01_complete_schema.sql.
-- Passwords are intentionally plaintext only until `npm run sync:auth-users`
-- creates Supabase Auth identities and replaces them with bcrypt hashes.

begin;

-- Users ---------------------------------------------------------------------
insert into public.users (
  user_id,email,username,password_hash,first_name,last_name,phone_number,
  date_of_birth,gender,role,headline,account_status
) values
  ('10000000-0000-4000-8000-000000000001','owner.demo@gymster.local','owner_demo','Owner@123','Minh','Tran','0908000001','1985-04-12','male','owner','Demo gym owner.','active'),
  ('10000000-0000-4000-8000-000000000002','admin.demo@gymster.local','admin_demo','Admin@123','Linh','Pham','0908000002','1988-08-09','female','admin','Demo operations administrator.','active'),
  ('10000000-0000-4000-8000-000000000003','staff01.demo@gymster.local','staff01_demo','Staff@123','An','Nguyen','0908000003','1994-02-20','female','staff','Front desk and membership support.','active'),
  ('10000000-0000-4000-8000-000000000004','staff02.demo@gymster.local','staff02_demo','Staff@123','Bao','Hoang','0908000004','1993-01-15','male','staff','Equipment and member operations.','active'),
  ('10000000-0000-4000-8000-000000000005','trainer01.demo@gymster.local','trainer01_demo','Trainer@123','Khoa','Le','0908000005','1990-11-03','male','trainer','Strength and conditioning coach.','active'),
  ('10000000-0000-4000-8000-000000000006','trainer02.demo@gymster.local','trainer02_demo','Trainer@123','Nhi','Tran','0908000006','1992-10-05','female','trainer','Mobility and fat-loss coach.','active'),
  ('10000000-0000-4000-8000-000000000101','member01.demo@gymster.local','member01_demo','Member@123','Mai','Do','0918000001','1998-05-18','female','member','Active gym member.','active'),
  ('10000000-0000-4000-8000-000000000102','member02.demo@gymster.local','member02_demo','Member@123','Tuan','Pham','0918000002','1995-02-13','male','member','Active PT member.','active'),
  ('10000000-0000-4000-8000-000000000103','member03.demo@gymster.local','member03_demo','Member@123','Luna','Ho','0918000003','1999-03-20','female','member','Session-based package member.','active'),
  ('10000000-0000-4000-8000-000000000104','member04.demo@gymster.local','member04_demo','Member@123','Quang','Le','0918000004','1992-04-03','male','member','Has an active package and a paid pending package.','active'),
  ('10000000-0000-4000-8000-000000000105','member05.demo@gymster.local','member05_demo','Member@123','Thao','Bui','0918000005','1996-05-25','female','member','Expired package member.','active'),
  ('10000000-0000-4000-8000-000000000106','member06.demo@gymster.local','member06_demo','Member@123','Nam','Do','0918000006','1990-06-18','male','member','New member without a package.','pending_onboarding');

insert into public.user_settings(user_id)
select user_id from public.users;

-- Employees and trainers ----------------------------------------------------
insert into public.employees (
  employee_id,user_id,employee_code,full_name,email,phone_number,gender,date_of_birth,
  role,department,member_limit,current_active_members,hire_date,base_salary,status
) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','EMP-OWN-001','Minh Tran','owner.demo@gymster.local','0908000001','male','1985-04-12','owner','Executive',20,0,current_date-900,45000000,'active'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','EMP-ADM-001','Linh Pham','admin.demo@gymster.local','0908000002','female','1988-08-09','admin','Management',20,0,current_date-800,32000000,'active'),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','EMP-STF-001','An Nguyen','staff01.demo@gymster.local','0908000003','female','1994-02-20','staff','Front Desk',10,0,current_date-500,13500000,'active'),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','EMP-STF-002','Bao Hoang','staff02.demo@gymster.local','0908000004','male','1993-01-15','staff','Operations',10,0,current_date-450,14000000,'active'),
  ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','EMP-PT-001','Khoa Le','trainer01.demo@gymster.local','0908000005','male','1990-11-03','trainer','Strength',10,1,current_date-700,22000000,'active'),
  ('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000006','EMP-PT-002','Nhi Tran','trainer02.demo@gymster.local','0908000006','female','1992-10-05','trainer','Mobility',10,0,current_date-650,20500000,'active');

insert into public.trainers (
  trainer_id,user_id,employee_id,trainer_code,full_name,specialty,bio,rating,
  current_active_members,max_active_members,available_schedule_slots,available_slots,status
) values
  ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005','PT-001','Khoa Le','Strength & Conditioning','Progressive strength coaching.',4.8,1,8,'["Mon 18:00-20:00","Wed 18:00-20:00"]','["Mon 18:00-20:00","Wed 18:00-20:00"]','active'),
  ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000006','PT-002','Nhi Tran','Mobility & Fat Loss','Mobility, cardio and habit coaching.',4.6,0,8,'["Tue 14:00-16:00","Thu 14:00-16:00"]','["Tue 14:00-16:00","Thu 14:00-16:00"]','active');

insert into public.trainer_weekly_availability(trainer_id,day_of_week,start_time,end_time)
values
  ('30000000-0000-4000-8000-000000000001','monday','18:00','20:00'),
  ('30000000-0000-4000-8000-000000000001','wednesday','18:00','20:00'),
  ('30000000-0000-4000-8000-000000000001','saturday','08:00','10:00'),
  ('30000000-0000-4000-8000-000000000002','tuesday','14:00','16:00'),
  ('30000000-0000-4000-8000-000000000002','thursday','14:00','16:00'),
  ('30000000-0000-4000-8000-000000000002','sunday','08:00','10:00');

-- Packages and promotions ---------------------------------------------------
insert into public.packages (
  package_id,package_code,package_name,package_type,duration_months,validity_days,
  price,description,session_limit,min_purchase_sessions,max_purchase_sessions,
  has_personal_trainer,is_popular,max_leave_days,sessions_per_week,is_active,status
) values
  ('40000000-0000-4000-8000-000000000001','GYM-SESSION','Gym Access Per Session','session_based',1,30,50000,'Flexible pay-per-session access.',null,1,30,false,true,0,1,true,'active'),
  ('40000000-0000-4000-8000-000000000002','GYM-1M','Gym Access 1 Month','gym',1,null,390000,'One month unlimited gym access.',null,null,null,false,false,2,1,true,'active'),
  ('40000000-0000-4000-8000-000000000003','GYM-3M','Gym Access 3 Months','gym',3,null,990000,'Three months gym access.',null,null,null,false,true,6,1,true,'active'),
  ('40000000-0000-4000-8000-000000000004','PT-3M','PT Progress 3 Months','pt',3,null,4800000,'Twenty-four coached sessions.',24,null,null,true,true,6,1,true,'active'),
  ('40000000-0000-4000-8000-000000000005','VIP-PT-6M','VIP PT 6 Months','vip_pt',6,null,12800000,'VIP coaching and priority slots.',60,null,null,true,true,12,2,true,'active');

insert into public.package_features(package_id,feature_name,feature_description,display_order)
values
  ('40000000-0000-4000-8000-000000000001','Flexible quantity','Choose the number of sessions.',1),
  ('40000000-0000-4000-8000-000000000001','30-day validity','Starts when the package becomes active.',2),
  ('40000000-0000-4000-8000-000000000002','Unlimited gym access','Access during opening hours.',1),
  ('40000000-0000-4000-8000-000000000003','Better monthly value','Three-month membership.',1),
  ('40000000-0000-4000-8000-000000000004','24 PT sessions','Weekly trainer schedule included.',1),
  ('40000000-0000-4000-8000-000000000005','Priority PT slots','VIP scheduling and progress reviews.',1);

insert into public.package_promotions (
  promotion_id,package_id,title,description,discount_percent,start_date,end_date,status,created_by
) values
  ('41000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','Quarterly Demo Sale','Effective promotion shown to members.',20,current_date-3,current_date+10,'active','10000000-0000-4000-8000-000000000001'),
  ('41000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000004','Upcoming PT Week','Upcoming notification only; not effective yet.',15,current_date+7,current_date+20,'active','10000000-0000-4000-8000-000000000001'),
  ('41000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','Inactive Test Promotion','Must not appear as current promotion.',10,current_date-5,current_date+5,'inactive','10000000-0000-4000-8000-000000000002');

-- Rooms and equipment -------------------------------------------------------
insert into public.rooms(room_id,room_code,room_name,room_type,capacity,status)
values
  ('50000000-0000-4000-8000-000000000001','GYM-FLOOR','Main Gym Floor','gym',60,'active'),
  ('50000000-0000-4000-8000-000000000002','PT-STUDIO','PT Studio','pt',12,'active'),
  ('50000000-0000-4000-8000-000000000003','RECOVERY','Recovery Room','recovery',8,'maintenance');

insert into public.equipment (
  equipment_id,room_id,equipment_code,equipment_name,category,brand,model,serial_number,
  purchase_date,last_maintenance_date,next_maintenance_date,status,origin,warranty_expiry_date
) values
  ('51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','EQ-TREAD-01','Treadmill 01','Cardio','Impulse','RT500','SN-DEMO-001',current_date-500,current_date-30,current_date+60,'active','Vietnam',current_date+230),
  ('51000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','EQ-BIKE-01','Air Bike 01','Cardio','Rogue','Echo','SN-DEMO-002',current_date-420,current_date-45,current_date+15,'in_use','USA',current_date+310),
  ('51000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','EQ-RACK-01','Power Rack 01','Strength','Eleiko','Prestera','SN-DEMO-003',current_date-650,current_date-60,current_date+30,'active','Sweden',current_date+80),
  ('51000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000001','EQ-BENCH-01','Adjustable Bench','Strength','Impulse','SL7011','SN-DEMO-004',current_date-360,current_date-80,current_date-5,'broken','China',current_date+365),
  ('51000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000002','EQ-CABLE-01','Cable Machine','Strength','Life Fitness','DAP','SN-DEMO-005',current_date-600,current_date-40,current_date+50,'active','USA',current_date+130),
  ('51000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000002','EQ-MAT-01','Training Mat Set','Mobility','Adidas','Studio','SN-DEMO-006',current_date-200,current_date-20,current_date+70,'active','Vietnam',current_date+530),
  ('51000000-0000-4000-8000-000000000007','50000000-0000-4000-8000-000000000003','EQ-MASSAGE-01','Massage Chair','Recovery','Kingsport','G56','SN-DEMO-007',current_date-300,current_date-100,current_date-10,'under_maintenance','Vietnam',current_date+430),
  ('51000000-0000-4000-8000-000000000008','50000000-0000-4000-8000-000000000001','EQ-ROW-01','Rowing Machine','Cardio','Concept2','RowErg','SN-DEMO-008',current_date-250,current_date-15,current_date+75,'active','USA',current_date+480);

-- Members -------------------------------------------------------------------
insert into public.members (
  member_id,user_id,member_code,full_name,phone_number,date_of_birth,gender,
  occupation,address,citizen_id,join_date,status
) values
  ('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000101','MB-DEMO-001','Mai Do','0918000001','1998-05-18','female','Designer','District 1, HCMC','079098000001',current_date-45,'active'),
  ('60000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000102','MB-DEMO-002','Tuan Pham','0918000002','1995-02-13','male','Engineer','District 3, HCMC','079095000002',current_date-70,'active'),
  ('60000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000103','MB-DEMO-003','Luna Ho','0918000003','1999-03-20','female','Student','Thu Duc, HCMC','079099000003',current_date-12,'active'),
  ('60000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000104','MB-DEMO-004','Quang Le','0918000004','1992-04-03','male','Accountant','District 7, HCMC','079092000004',current_date-100,'active'),
  ('60000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000105','MB-DEMO-005','Thao Bui','0918000005','1996-05-25','female','Teacher','Binh Thanh, HCMC','079096000005',current_date-160,'active'),
  ('60000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000106','MB-DEMO-006','Nam Do','0918000006','1990-06-18','male','Developer','Go Vap, HCMC','079090000006',null,'pending_onboarding');

-- Member packages -----------------------------------------------------------
insert into public.member_packages (
  member_package_id,member_id,package_id,trainer_id,status,start_date,end_date,
  sessions_total,sessions_used,used_sessions,remaining_sessions,selected_schedule,selected_slots,activated_at
) values
  ('70000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003',null,'active',current_date-20,current_date+69,null,0,0,null,null,'[]',now()-interval '20 days'),
  ('70000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','active',current_date-35,current_date+54,24,8,8,16,'Mon 18:00-20:00','[{"dayKey":"monday","startTime":"18:00","endTime":"20:00","label":"Monday 18:00"}]',now()-interval '35 days'),
  ('70000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001',null,'active',current_date-5,current_date+24,10,3,3,7,null,'[]',now()-interval '5 days'),
  ('70000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000002',null,'active',current_date-25,current_date+5,null,0,0,null,null,'[]',now()-interval '25 days'),
  ('70000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','pending_activation',current_date+6,current_date+95,24,0,0,24,'Tue 14:00-16:00','[{"dayKey":"tuesday","startTime":"14:00","endTime":"16:00","label":"Tuesday 14:00"}]',null),
  ('70000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000002',null,'expired',current_date-70,current_date-40,null,0,0,null,null,'[]',now()-interval '70 days');

-- Payments and invoices -----------------------------------------------------
insert into public.payments (
  payment_id,member_id,package_id,member_package_id,amount,payment_method,payment_status,
  provider_reference,transaction_code,payment_date,proof_type,proof_submitted_at,
  package_name_snapshot,promotion_id,promotion_title_snapshot,purchased_sessions,unit_price,
  original_price,discount_percent,discount_amount,final_amount,applied_at,reviewed_by_employee_id,reviewed_at,paid_at
) values
  ('80000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000001',792000,'bank_transfer','paid','DEMO-PAY-001','TX-DEMO-001',now()-interval '20 days','demo',now()-interval '20 days','Gym Access 3 Months','41000000-0000-4000-8000-000000000001','Quarterly Demo Sale',null,null,990000,20,198000,792000,now()-interval '20 days','20000000-0000-4000-8000-000000000003',now()-interval '20 days',now()-interval '20 days'),
  ('80000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000002',4800000,'credit_card','paid','DEMO-PAY-002','TX-DEMO-002',now()-interval '35 days','demo',now()-interval '35 days','PT Progress 3 Months',null,null,null,null,4800000,0,0,4800000,now()-interval '35 days','20000000-0000-4000-8000-000000000003',now()-interval '35 days',now()-interval '35 days'),
  ('80000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000003',500000,'cash','paid','DEMO-PAY-003','TX-DEMO-003',now()-interval '5 days','demo',now()-interval '5 days','Gym Access Per Session',null,null,10,50000,500000,0,0,500000,now()-interval '5 days','20000000-0000-4000-8000-000000000003',now()-interval '5 days',now()-interval '5 days'),
  ('80000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000005',4800000,'bank_transfer','paid','DEMO-PAY-004','TX-DEMO-004',now()-interval '1 day','demo',now()-interval '1 day','PT Progress 3 Months',null,null,null,null,4800000,0,0,4800000,now()-interval '1 day','20000000-0000-4000-8000-000000000003',now()-interval '1 day',now()-interval '1 day'),
  ('80000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000005','40000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000006',390000,'bank_transfer','refunded','DEMO-PAY-005','TX-DEMO-005',now()-interval '70 days','demo',now()-interval '70 days','Gym Access 1 Month',null,null,null,null,390000,0,0,390000,now()-interval '70 days','20000000-0000-4000-8000-000000000004',now()-interval '40 days',now()-interval '70 days'),
  ('80000000-0000-4000-8000-000000000006','60000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000003',null,792000,'bank_transfer','pending','DEMO-PAY-006','TX-DEMO-006',now(),'demo',now(),'Gym Access 3 Months','41000000-0000-4000-8000-000000000001','Quarterly Demo Sale',null,null,990000,20,198000,792000,now(),null,null,null);

insert into public.invoices (
  invoice_id,invoice_number,payment_id,member_id,employee_id,subtotal_amount,
  discount_amount,tax_amount,total_amount,amount,invoice_status,status,issued_at,paid_at
) values
  ('81000000-0000-4000-8000-000000000001','INV-DEMO-001','80000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000003',990000,198000,0,792000,792000,'paid','paid',now()-interval '20 days',now()-interval '20 days'),
  ('81000000-0000-4000-8000-000000000002','INV-DEMO-002','80000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000003',4800000,0,0,4800000,4800000,'paid','paid',now()-interval '35 days',now()-interval '35 days'),
  ('81000000-0000-4000-8000-000000000003','INV-DEMO-003','80000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003',500000,0,0,500000,500000,'paid','paid',now()-interval '5 days',now()-interval '5 days'),
  ('81000000-0000-4000-8000-000000000004','INV-DEMO-004','80000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000003',4800000,0,0,4800000,4800000,'paid','paid',now()-interval '1 day',now()-interval '1 day'),
  ('81000000-0000-4000-8000-000000000005','INV-DEMO-005','80000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000004',390000,0,0,390000,390000,'refunded','refunded',now()-interval '70 days',now()-interval '70 days');

-- PT assignment, reservation and sessions ----------------------------------
insert into public.trainer_assignments (
  trainer_assignment_id,trainer_id,member_id,member_package_id,status,assigned_at,notes
) values
  ('82000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','active',now()-interval '35 days','Active PT demo assignment.');

insert into public.trainer_slot_reservations (
  reservation_id,member_id,member_package_id,payment_id,trainer_id,selected_schedule,
  selected_slots,start_date,end_date,status
) values
  ('83000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000005','80000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','Tue 14:00-16:00','[{"dayKey":"tuesday","startTime":"14:00","endTime":"16:00","label":"Tuesday 14:00"}]',current_date+6,current_date+95,'reserved');

insert into public.workout_sessions (
  workout_session_id,member_id,trainer_id,package_id,member_package_id,room_id,title,session_title,
  exercise_type,room_name,session_date,start_time,end_time,status,notes,note
) values
  ('84000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','PT Strength Session','PT Strength Session','Personal Training','PT Studio',current_date-7,'18:00','20:00','completed','Completed demo PT session.','Completed demo PT session.'),
  ('84000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002','Upcoming PT Session','Upcoming PT Session','Personal Training','PT Studio',current_date+3,'18:00','20:00','scheduled','Upcoming demo PT session.','Upcoming demo PT session.'),
  ('84000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000003',null,'40000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001','Self Workout','Self Workout','self_workout','Main Gym Floor',current_date+2,'16:00','18:00','scheduled','Consumes one session.','Consumes one session.');

insert into public.training_requests (
  training_request_id,member_id,trainer_id,package_id,member_package_id,request_type,
  requested_schedule,requested_date,start_time,end_time,status
) values
  ('85000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000005','assignment','Tue 14:00-16:00',current_date+6,'14:00','16:00','approved');

-- Check-in and operational history -----------------------------------------
insert into public.member_usage_history (
  member_id,member_package_id,workout_session_id,usage_type,usage_date,
  check_in_date,checked_in_by_employee_id,description
) values
  ('60000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',null,'check_in',current_date-2+time '09:15',current_date-2,'20000000-0000-4000-8000-000000000003','Front desk check-in.'),
  ('60000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',null,'check_in',current_date-1+time '17:40',current_date-1,'20000000-0000-4000-8000-000000000003','Front desk check-in.'),
  ('60000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002','84000000-0000-4000-8000-000000000001','workout_session',current_date-7+time '18:00',null,null,'Completed PT session.'),
  ('60000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000003',null,'check_in',current_date-1+time '15:30',current_date-1,'20000000-0000-4000-8000-000000000004','Session member check-in.');

insert into public.service_feedback (
  member_id,trainer_id,workout_session_id,target_type,rating,comment,tags,status,
  staff_response,responded_by_employee_id,responded_at
) values
  ('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','84000000-0000-4000-8000-000000000001','trainer',5,'Clear coaching and good progression.',array['trainer','strength'],'resolved','Shared with the trainer.','20000000-0000-4000-8000-000000000003',now()-interval '2 days'),
  ('60000000-0000-4000-8000-000000000001',null,null,'facility',4,'The gym floor is clean and easy to use.',array['facility'],'submitted',null,null,null);

insert into public.complaints (
  member_id,assigned_employee_id,resolved_by_employee_id,complaint_type,title,
  description,priority,status,resolution_note,resolved_at
) values
  ('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','equipment','Bench unavailable','The adjustable bench was marked broken.','medium','resolved','Moved member to another bench.',now()-interval '1 day'),
  ('60000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000003',null,'payment','Refund confirmation','Member is waiting for refund confirmation.','medium','in_review',null,null);

insert into public.maintenance_reports (
  maintenance_report_id,equipment_id,room_id,reported_by_user_id,resolved_by_employee_id,
  issue_title,issue_description,priority,status,resolved_at
) values
  ('86000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004',null,'Bench lock pin broken','Incline setting cannot lock safely.','high','in_progress',null),
  ('86000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000007','50000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','Massage chair inspection','Remote controller intermittently resets.','medium','resolved',now()-interval '2 days');

insert into public.maintenance_records (
  maintenance_report_id,equipment_id,handled_by_employee_id,maintenance_type,
  description,cost,completed_at
) values
  ('86000000-0000-4000-8000-000000000002','51000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000004','inspection','Controller and power supply inspected.',250000,now()-interval '2 days');

-- Staff schedules -----------------------------------------------------------
insert into public.employee_schedules(employee_id,day_of_week,shift_code,start_time,end_time,status)
values
  ('20000000-0000-4000-8000-000000000003','monday','shift_1','08:00','10:00','active'),
  ('20000000-0000-4000-8000-000000000003','tuesday','shift_1','08:00','10:00','active'),
  ('20000000-0000-4000-8000-000000000003','wednesday','shift_2','14:00','16:00','active'),
  ('20000000-0000-4000-8000-000000000003','thursday','shift_2','14:00','16:00','active'),
  ('20000000-0000-4000-8000-000000000004','wednesday','shift_3','16:00','18:00','active'),
  ('20000000-0000-4000-8000-000000000004','thursday','shift_3','16:00','18:00','active'),
  ('20000000-0000-4000-8000-000000000004','friday','shift_4','18:00','20:00','active'),
  ('20000000-0000-4000-8000-000000000004','saturday','shift_4','18:00','20:00','active');

-- Performance, payroll, training content -----------------------------------
insert into public.performance_reviews (
  employee_id,reviewer_user_id,review_period,review_type,period_start,period_end,
  feedback_score,activity_score,admin_score,final_score,activity_breakdown,
  feedback_breakdown,comment,created_by,score,rating,status,reviewed_at
) values
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','Last 30 days','staff',current_date-29,current_date,0,82,88,84.4,'{"feedbackHandled":{"count":2,"target":20,"weight":30},"paymentsHandled":{"count":4,"target":30,"weight":30},"maintenanceHandled":{"count":1,"target":10,"weight":20}}',null,'Reliable member support.','10000000-0000-4000-8000-000000000002',84.4,4,'approved',now()),
  ('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002','Last 30 days','trainer',current_date-29,current_date,96,86,90,87.6,'{"activeStudents":{"count":1,"target":10,"weight":30},"completedSessions":{"count":8,"target":40,"weight":50}}','{"averageRating":4.8,"reviewCount":1,"status":"rated"}','Strong coaching feedback.','10000000-0000-4000-8000-000000000002',87.6,5,'approved',now());

insert into public.payroll_periods(payroll_period_id,period_name,period_start,period_end,status)
values ('87000000-0000-4000-8000-000000000001','Current Demo Month',date_trunc('month',current_date)::date,(date_trunc('month',current_date)+interval '1 month'-interval '1 day')::date,'approved');

insert into public.payslips(payroll_period_id,employee_id,base_salary,bonus_amount,allowance_amount,deduction_amount,net_amount,status)
select '87000000-0000-4000-8000-000000000001',employee_id,base_salary,
  case when role='trainer' then 1000000 else 500000 end,300000,100000,
  base_salary+case when role='trainer' then 1000000 else 500000 end+200000,'approved'
from public.employees where role in ('staff','trainer');

insert into public.training_goals(member_id,trainer_id,goal_title,target_value,current_value,unit,target_date)
values ('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Increase squat strength',100,80,'kg',current_date+45);

insert into public.progress_records(member_id,trainer_id,workout_session_id,record_date,weight_kg,body_fat_percent,performance_score,progress_text)
values ('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','84000000-0000-4000-8000-000000000001',current_date-7,72.5,18.2,88,'Good form and consistent effort.');

insert into public.body_metrics(member_id,recorded_by_trainer_id,height_cm,weight_kg,body_fat_percent,muscle_mass_kg,waist_cm)
values ('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001',175,72.5,18.2,33.4,82);

insert into public.workout_plans(workout_plan_id,member_id,trainer_id,plan_name,plan_goal,start_date,end_date,status)
values ('88000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','Demo Strength Plan','Build foundational strength.',current_date-14,current_date+42,'active');

insert into public.workout_plan_exercises(workout_plan_id,exercise_name,exercise_type,sets,reps,intensity,display_order)
values
  ('88000000-0000-4000-8000-000000000001','Goblet Squat','Strength',4,'8-10','Moderate',1),
  ('88000000-0000-4000-8000-000000000001','Lat Pulldown','Strength',3,'10-12','Moderate',2);

insert into public.meal_plans(meal_plan_id,trainer_id,plan_name,goal,calories_per_day,protein_grams,carbs_grams,fat_grams,meals)
values ('89000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','Balanced Strength Plan','Support strength progress.',2200,150,240,65,'[{"name":"Breakfast","items":["oats","eggs"]},{"name":"Lunch","items":["rice","chicken","vegetables"]}]');

insert into public.meal_plan_assignments(meal_plan_id,member_id,trainer_id,status)
values ('89000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','active');

-- Pending request without a created package keeps member06 a true no-package member.
insert into public.package_change_requests (
  member_id,requested_package_id,request_type,amount,payment_method,status,
  package_name_snapshot,promotion_id,promotion_title_snapshot,original_price,
  discount_percent,discount_amount,final_amount,applied_at
) values
  ('60000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000003','buy',792000,'bank_transfer','pending_payment','Gym Access 3 Months','41000000-0000-4000-8000-000000000001','Quarterly Demo Sale',990000,20,198000,792000,now());

-- Notifications -------------------------------------------------------------
insert into public.notifications (
  user_id,promotion_id,notification_type,title,message,action_type,action_payload,is_read
) values
  ('10000000-0000-4000-8000-000000000101','41000000-0000-4000-8000-000000000001','package','Quarterly Demo Sale','Gym Access 3 Months is 20% off until the displayed end date.','open_package','{"packageId":"40000000-0000-4000-8000-000000000003"}',false),
  ('10000000-0000-4000-8000-000000000102','41000000-0000-4000-8000-000000000002','package','Upcoming PT Week','A 15% PT promotion starts next week.','open_package','{"packageId":"40000000-0000-4000-8000-000000000004","upcoming":true}',false),
  ('10000000-0000-4000-8000-000000000003',null,'system','Daily front desk summary','Review one pending payment and today check-ins.','open_staff_dashboard','{}',false),
  ('10000000-0000-4000-8000-000000000001',null,'system','Demo revenue ready','Paid and refunded transactions are available for analytics.','open_revenue','{}',false);

commit;
