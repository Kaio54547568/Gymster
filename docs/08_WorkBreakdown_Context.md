# 08 - Work Breakdown / Phan Chia Cong Viec Context

Tai lieu nay dung de dua cho GPT sinh bang ke hoach phan chia cong viec theo mau spreadsheet trong anh:

| Level | WBS | Task Description | Assigned To | Start | End | Notes |
| --- | --- | --- | --- | --- | --- | --- |

Muc tieu cua file nay la cung cap context du an Gymster, pham vi MVP, module, tac nhan, stack ky thuat va goi y cau truc sprint de GPT co the tao ra bang WBS chi tiet.

## Prompt co the copy cho GPT

```text
Hay dong vai project manager cho du an Gymster. Dua tren context ben duoi, hay tao bang phan chia cong viec theo mau:
Level | WBS | Task Description | Assigned To | Start | End | Notes

Yeu cau:
- Viet task bang tieng Anh ngan gon, notes bang tieng Viet.
- Level 1 la sprint/giai doan lon.
- Level 2 la nhom cong viec/module.
- Level 3 la feature/user story.
- Level 4 la task implementation/test/documentation cu the.
- WBS dung dinh dang 1, 1.1, 1.1.1, 1.1.1.1.
- Chia thanh 6-8 sprint cho MVP web app quan ly phong gym.
- Moi task co nguoi phu trach. Neu chua co ten team, dung placeholder: PM/BA, FE-1, FE-2, BE/DB, AI/Integration, QA, Docs.
- Moi task co Start/End theo dinh dang dd/mm/yyyy. Gia lap project bat dau vao [DIEN_NGAY_BAT_DAU].
- Uu tien dependency hop ly: analysis -> database/API -> UI -> integration -> testing -> docs/deployment.
- Khong bo sot cac portal: public/auth/onboarding, member, staff, PT/trainer, admin/owner.
- Them task unit test, integration test, responsive test, database seed, deployment va bao cao.

Context du an:
[Dan toan bo noi dung muc "Project Context" ben duoi vao day]
```

## Project Context

### Tong quan

- Ten du an: Gymster.
- Loai he thong: web app quan ly phong gym nhieu portal.
- Trang deployed da ghi trong README: `https://gymster-vert.vercel.app/`.
- App chinh nam trong `frontend/`.
- Project dang o trang thai MVP, da co UI/logic cho nhieu portal va dang migrate du lieu tu mock/localStorage sang Supabase.
- `source_figma/` la source UI tham khao tu Figma, khong phai app production chinh.
- `docs/` da co context cho Requirement Analysis, Architecture, Detailed Design, Programming, Unit Test, Good Design va Project Summary.

### Tech stack

- Frontend: React 19, Vite 8, React Router 7.
- Styling/UI: Tailwind CSS 4, lucide-react, motion, Recharts.
- Database: PostgreSQL/Supabase, SQL scripts trong `database/`.
- Backend phu tro: Node.js HTTP server trong `backend/server.js`.
- Serverless API/Vercel entry: `api/`.
- AI: Anthropic Claude endpoint va AI chat service.
- Speech service: Python FastAPI service trong `speech_service/`, endpoint `/health` va `/transcribe`.
- Test hien co: Node test runner cho mot so pure service logic trong `frontend/src/services/*.test.js`.

### Cau truc source chinh

```text
Gymster/
|-- frontend/
|   |-- src/
|   |   |-- pages/              # Landing, Auth, Onboarding
|   |   |-- routes/             # AppRoutes va role guard
|   |   |-- roles/
|   |   |   |-- admin/           # Admin/owner portal
|   |   |   |-- member/          # Member portal
|   |   |   |-- pt/              # PT/trainer portal
|   |   |   `-- staff/           # Staff portal
|   |   |-- roles/shared/        # Shared shell, profile, settings, notification
|   |   |-- services/            # API/service layer va business logic
|   |   |-- styles/              # Global CSS/design tokens
|   |   `-- test_data/           # Fallback demo users
|-- backend/
|   |-- server.js
|   `-- services/
|-- api/                         # Vercel/serverless handlers
|-- database/                    # schema.sql, seed.sql, upgrade scripts
|-- speech_service/              # FastAPI speech-to-text
|-- source_figma/                # Figma reference source
|-- docs/
`-- README.md
```

### Tac nhan / role trong he thong

- Guest/Visitor: xem landing, dang ky, dang nhap.
- Member/Hoi vien: onboarding, chon goi, chon PT, thanh toan, xem dashboard, goi tap, lich tap, trainers, feedback, profile/settings.
- Staff/Nhan vien: dashboard van hanh, them hoi vien, danh sach hoi vien, check-in, gia han goi, hoa don, lich su, feedback, thiet bi.
- PT/Trainer: dashboard, quan ly trainee, lich tap, workout guidance, workout plan CRUD, danh gia tien do, meal plan, bao cao thiet bi.
- Admin/Owner: dashboard dieu hanh, doanh thu, membership analytics, staff management, scheduling, performance, payroll, package/payment, equipment, maintenance, feedback.
- System/AI: AI chat, staff AI chat, Claude API, speech-to-text transcription.

### Route chinh

- Public/Auth: `/`, `/login`, `/register`, `/auth/callback`, `/auth/complete-profile`.
- Onboarding: `/onboarding/status`, `/onboarding/packages`, `/onboarding/trainers`, `/onboarding/payment`, `/onboarding/success`.
- Member: `/member/*`.
- Staff: `/staff/*`.
- PT/Trainer: `/pt/*`.
- Admin/Owner: `/admin/*`.
- Role guard map `owner` ve admin va `trainer` ve PT.

### Module nghiep vu can dua vao WBS

#### 1. Project setup va analysis

- Chot scope MVP, actor, user story, acceptance criteria.
- Doc README, docs context, database README va source structure.
- Setup local dev: `npm install`, `npm run dev`, `npm run dev:backend`, optional `npm run dev:speech`.
- Setup Supabase env va SQL order.
- Chuan hoa issue/task board theo sprint.

#### 2. Authentication, registration va onboarding

- Login, register, email verification code.
- OAuth callback va complete profile.
- Session/current user trong localStorage va refresh session.
- Role redirect theo admin/staff/pt/member.
- Member onboarding: registration status, package selection, trainer selection, payment, success.
- Member activation RPC trong database.

#### 3. Database/Supabase

Core tables:

- `users`, `user_settings`, `members`, `employees`, `trainers`.
- `packages`, `package_features`, `member_packages`, `package_change_requests`.
- `payments`, `invoices`.
- `training_requests`, `workout_sessions`, `trainer_assignments`.
- `workout_plans`, `workout_plan_exercises`, `training_goals`, `progress_records`, `body_metrics`, `medical_records`.
- `rooms`, `equipment`, `maintenance_reports`, `maintenance_records`.
- `service_feedback`, `complaints`, `notifications`.
- `employee_schedules`, `payroll_periods`, `payslips`, `performance_reviews`.
- `meal_plans`, `meal_plan_assignments`, `medical_history_requests`, `makeup_sessions`.

Database task nen co trong plan:

- Chay `database/schema.sql`.
- Chay upgrade scripts neu can: `member_care_upgrade.sql`, `ai_makeup_booking_upgrade.sql`, `workout_plan_crud_upgrade.sql`, `member_manual_workout_upgrade.sql`, `training_request_cancel_reschedule_upgrade.sql`, `vip_packages_sessions_upgrade.sql`.
- Chay `database/seed.sql` cho demo data.
- Chay `email_registration_verification.sql` neu dung email code.
- Tao bucket `pics` va chay `storage_pics_policies.sql` neu can avatar/image upload.
- Kiem tra RLS/policy cho MVP va ghi note production hardening.

#### 4. Member portal

- Dashboard: tong quan goi tap, workout sessions, payments, notifications.
- My Package: package hien tai, renew/register package, transaction history, package request.
- My Schedule: workout session calendar, cancel/reschedule, makeup session, conflict handling.
- Trainers: danh sach trainer, trainer detail, request PT.
- Rate Service: service feedback, complaints.
- Profile/Settings: thong tin ca nhan, doi mat khau, appearance/language, medical history.
- Lock content khi member active nhung package het han/chua usable.

#### 5. Staff portal

- Dashboard van hanh.
- Add Member: tao hoi vien, thong tin ca nhan, package/payment ban dau.
- Member List/Detail: xem va cap nhat thong tin hoi vien.
- Daily Check-in: ghi nhan buoi tap trong ngay.
- Renew Package: tao/gia han goi, payment, invoice.
- Receipt/Usage History: xem thanh toan, hoa don, lich su su dung.
- Feedback Management: xu ly feedback/complaint.
- Equipment Status: thiet bi, report maintenance, mark maintained.
- Notifications/Profile/Settings.

#### 6. PT/Trainer portal

- Dashboard PT: KPI hoc vien, lich tap, request, progress.
- Manage Trainees: danh sach hoc vien duoc assign, detail hoc vien.
- Schedule & Progress: xem lich, cap nhat trang thai session, progress/goals.
- Workout Guidance: tao/sua/xoa workout plan, exercise list, muscle group guidance.
- Progress Evaluation: danh gia tien do, metrics, recommendation.
- Meal Plans: tao meal plan va assign cho member.
- Equipment Report: gui bao cao thiet bi loi sang staff/admin.
- Notifications/Profile/Settings.

#### 7. Admin/Owner portal

- Executive Dashboard: KPI tong quan.
- Revenue Analytics: doanh thu, payment/invoice/package breakdown.
- Membership Analytics: tang truong hoi vien, goi dang dung, churn/renewal.
- Staff Management: quan ly employees/trainers.
- Scheduling: employee schedules, rooms.
- Performance Evaluation: performance reviews.
- Payroll: payroll periods, payslips.
- Equipment Management: thiet bi va phong.
- Maintenance Tracking: maintenance reports/records.
- Feedback & Satisfaction: service feedback, complaints.
- Packages & Payments: CRUD packages, package features, payment overview.
- Profile/Settings/Notifications.

#### 8. AI va integration

- Backend Node server endpoints:
  - `GET /api/health`.
  - `POST /api/claude/messages`.
  - `POST /api/ai/chat`.
  - `POST /api/staff/ai/chat`.
  - `POST /api/auth/login`.
  - `POST /api/auth/register/request-code`.
  - `POST /api/auth/register/verify-code`.
  - `POST /api/training-requests`.
  - `POST /api/training-requests/status`.
- Vercel handlers trong `api/` mirror mot so endpoint backend.
- AI chat service cho member/general va staff.
- Speech-to-text service: FastAPI, `POST /transcribe`, frontend service `speechToTextApi.js`.

#### 9. Service layer va business logic

Service files quan trong:

- Auth/user: `authService.js`, `userApi.js`, `userProfileApi.js`, `onboardingService.js`.
- Package/payment/invoice: `packageApi.js`, `memberPackageApi.js`, `packageEntitlement.js`, `paymentApi.js`, `invoiceApi.js`.
- Training/session: `trainingRequestApi.js`, `trainingRequestLocal.js`, `trainerAvailabilityApi.js`, `workoutSessionApi.js`, `workoutSessionConflict.js`, `workoutScheduleGenerator.js`.
- Workout/medical/member care: `workoutPlanApi.js`, `workoutPlanModel.js`, `medicalHistoryApi.js`, `memberCareApi.js`.
- Portal data: `adminDataApi.js`, `staffDashboardApi.js`, `staffOperationsApi.js`, `ptDataApi.js`, `memberEngagementApi.js`, `landingApi.js`.
- AI/speech: `aiChatApi.js`, `staffAiChatApi.js`, `claudeApi.js`, `speechToTextApi.js`.
- Notifications: `notificationApi.js`.

#### 10. Testing va quality

Test hien co:

- `packageEntitlement.test.js`: rule so ngay nghi theo goi.
- `sessionModel.test.js`: normalize status/label cua workout session.
- `trainingRequestLocal.test.js`: update local reschedule request va local id.
- `workoutPlanModel.test.js`: normalize/validate workout plan draft.
- `workoutScheduleGenerator.test.js`: sinh lich tap theo lich co dinh.
- `workoutSessionConflict.test.js`: phat hien trung lich PT va rule truoc 2 gio.

Command test:

```bash
node --test frontend/src/services/*.test.js
```

Task test nen them vao WBS:

- Unit test cho auth validation/register/login.
- Unit test cho package/payment/renewal.
- Unit test cho training request status va reschedule/cancel.
- Unit test cho workout plan CRUD model.
- Integration test Supabase service voi seed data.
- UI smoke test cho routes cua 4 portal.
- Responsive test landing/auth/member/staff/PT/admin.
- QA test role guard: sai role bi redirect ve home dung.
- QA test deployment build: `npm run build`.

### Ghi chu hien trang/rui ro

- Frontend dung ca `.jsx` va `.tsx`, can chia task theo module de tranh conflict.
- Mot so text tieng Viet trong README/code bi loi encoding mojibake.
- App co fallback localStorage/mock khi Supabase chua cau hinh; task plan can tach "demo fallback" va "Supabase integration".
- PT portal hien la file lon, co rui ro coupling cao; nen co task refactor/tach component neu con thoi gian.
- RLS/policy hien phu hop MVP testing; production can role-aware policy chat hon.
- Chua co script `test` trong `frontend/package.json`, nen test command dang chay truc tiep bang Node.
- Payment la record noi bo, chua co cong thanh toan that.
- Backend AI can env key, khong nen expose API key tren client.

## Goi y cau truc sprint cho GPT

GPT co the dung cau truc nay lam khung, sau do bung thanh Level 2/3/4:

1. Sprint 1 - Project Setup & Requirement Analysis
   - Setup repo/env, review docs/source, define actors, user stories, MVP scope, backlog.
2. Sprint 2 - Database, Auth & Onboarding Foundation
   - Supabase schema/seed, auth/register/email verification, role guard, onboarding flow.
3. Sprint 3 - Member Portal
   - Member dashboard, package, schedule, trainers, feedback, profile/settings, package lock.
4. Sprint 4 - Staff Operations Portal
   - Add member, member list/detail, check-in, renewal, receipts, feedback, equipment.
5. Sprint 5 - PT/Trainer Portal
   - Trainees, schedule/progress, workout plan, evaluation, meal plan, equipment report.
6. Sprint 6 - Admin/Owner Portal
   - Dashboard, revenue/membership analytics, staff, scheduling, payroll, packages, maintenance.
7. Sprint 7 - AI, Speech & Integration
   - Claude AI chat, staff AI, training request server API, speech-to-text, notifications.
8. Sprint 8 - Testing, Documentation & Deployment
   - Unit/integration/UI test, bug fix, build/deploy, report/docs, final demo.

## Goi y phan cong vai tro

Neu chua co ten thanh vien, co the dung placeholder:

- PM/BA: scope, SRS, user story, acceptance criteria, backlog, coordination.
- FE-1: public/auth/onboarding/member UI.
- FE-2: staff/PT/admin UI.
- BE/DB: Supabase schema, seed, service integration, API endpoint.
- AI/Integration: Claude, AI chat, speech-to-text, Vercel/serverless integration.
- QA: unit test, integration test, browser smoke test, bug tracking.
- Docs: diagrams, final report, test evidence, setup/deployment guide.

Neu co danh sach thanh vien thuc te, thay placeholder vao cot `Assigned To` va co gang khong giao qua nhieu task song song cho mot nguoi trong cung ngay.

## Output mong muon tu GPT

GPT nen tra ve bang Markdown hoac CSV voi cac cot:

```text
Level,WBS,Task Description,Assigned To,Start,End,Notes
```

Goi y format:

```text
1,1,Sprint 1: Project Setup & Requirement Analysis,All,dd/mm/yyyy,dd/mm/yyyy,"Khoi tao va chot pham vi MVP"
2,1.1,Project initiation,PM/BA,dd/mm/yyyy,dd/mm/yyyy,"Xac dinh muc tieu, scope, thanh vien"
3,1.1.1,Define project scope and objectives,PM/BA,dd/mm/yyyy,dd/mm/yyyy,"Chot MVP Gymster"
4,1.1.1.1,Review README and existing docs,PM/BA,dd/mm/yyyy,dd/mm/yyyy,"Doc docs/00-07 va README"
```

Nen yeu cau GPT tao du so dong de dung cho spreadsheet, nhung khong can qua chi tiet den muc tung button CSS. Muc do tot la 80-150 dong cho toan bo MVP.

