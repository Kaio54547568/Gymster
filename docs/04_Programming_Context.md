# 04 - Programming Context

## Cach chay du an

Tu root:

```bash
npm install
npm --prefix frontend install
npm run dev
```

Build/preview/lint:

```bash
npm run build
npm run preview
npm run lint
```

Backend AI:

```bash
npm run dev:backend
```

Frontend env:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Backend env:

```env
ANTHROPIC_API_KEY=your_key
PORT=3001
```

## Cau truc lap trinh

### Frontend

- `frontend/src/main.jsx`: app providers va router.
- `frontend/src/routes/AppRoutes.jsx`: route guard va route tree.
- `frontend/src/pages`: landing/auth/onboarding.
- `frontend/src/roles`: portal theo role.
- `frontend/src/services`: service/API layer, business rules, Supabase queries, local fallback.
- `frontend/src/styles`: global CSS/design tokens.
- `frontend/src/test_data/users.json`: demo fallback users.

### Backend

- `backend/server.js`: HTTP server thu cong bang `node:http`.
- `backend/services/claudeService.js`: Anthropic client.
- `backend/services/aiChatService.js`: AI chat general/member.
- `backend/services/staffAiChatService.js`: AI chat staff.
- `backend/services/localGymsterStore.js`: local store phu tro AI action.

### Database

- `database/schema.sql`: schema, constraints, indexes, triggers.
- `database/seed.sql`: seed demo data.
- `database/*_upgrade.sql`: script nang cap tinh nang.

## Coding conventions dang co

- Frontend dung ca `.jsx` va `.tsx`.
- UI component theo Tailwind utility classes.
- Portal admin/staff/member tach file screen/component; PT portal hien gom nhieu logic trong mot file lon `frontend/src/roles/pt/App.tsx`.
- Data access nen dat trong `frontend/src/services`.
- Service mapper chuyen snake_case DB sang camelCase/UI model.
- Nhieu service tra ve object `{ data, error }`; mutation co the tra `{ ok, message }`.
- Co fallback localStorage/mock khi Supabase khong available.

## Routing summary

| Route | Component |
| --- | --- |
| `/` | LandingPage |
| `/login` | LoginPage |
| `/register` | RegisterPage |
| `/auth/callback` | AuthCallbackPage |
| `/auth/complete-profile` | SocialProfilePage |
| `/onboarding/status` | RegistrationStatusPage |
| `/onboarding/packages` | PackageSelectionPage |
| `/onboarding/trainers` | TrainerSelectionPage |
| `/onboarding/payment` | OnboardingPaymentPage |
| `/onboarding/success` | OnboardingSuccessPage |
| `/admin/*` | AdminApp |
| `/staff/*` | StaffApp |
| `/pt/*` | PtApp |
| `/member/*` | MemberApp |

## Admin routes

- `/admin`
- `/admin/revenue`
- `/admin/membership`
- `/admin/staff`
- `/admin/scheduling`
- `/admin/performance`
- `/admin/payroll`
- `/admin/equipment`
- `/admin/maintenance-tracking`
- `/admin/feedback`
- `/admin/packages`
- `/admin/notifications`
- `/admin/settings`
- `/admin/profile`

## Staff routes

- `/staff/dashboard`
- `/staff/add-member`
- `/staff/members`
- `/staff/members/:id`
- `/staff/check-in`
- `/staff/renew-package`
- `/staff/renew-package/:memberId`
- `/staff/receipt/:id`
- `/staff/history`
- `/staff/feedback`
- `/staff/feedback/:id`
- `/staff/equipment`
- `/staff/notifications`
- `/staff/settings`
- `/staff/profile`

## Member routes

- `/member`
- `/member/my-package`
- `/member/my-schedule`
- `/member/trainers`
- `/member/rate-service`
- `/member/notifications`
- `/member/profile`
- `/member/settings`
- `/member/select-package`

## PT screens

PT portal dung state `screen` thay vi nested browser routes:

- `dashboard`
- `trainees`
- `member-detail`
- `schedule`
- `workout`
- `equipment-report`
- `evaluation`
- `meal-plan`
- `notifications`
- `profile`
- `settings`

## Service function groups

### Auth

- `loginUser`
- `signInWithOAuthProvider`
- `completeOAuthLogin`
- `getPendingOAuthProfile`
- `completeOAuthProfile`
- `getCurrentUser`
- `setCurrentUser`
- `refreshCurrentSession`
- `logoutUser`
- `getUserHome`

### Member/package/payment

- `getMemberPackagesForUser`
- `getCurrentMemberPackageForUser`
- `createMemberPackage`
- `createPackageChangeRequest`
- `getPackageChangeRequests`
- `updatePackageChangeRequestStatus`
- `fetchPackagesFromSupabase`
- `createPayment`
- `getPaymentsForMember`
- `getInvoicesForMember`

### Schedule/PT

- `createTrainingRequest`
- `getTrainingRequestsForTrainer`
- `getTrainingRequestsForMember`
- `updateTrainingRequestStatus`
- `createWorkoutSessionsForSchedule`
- `getWorkoutSessionsForMember`
- `createManualWorkoutSessionForMember`
- `cancelWorkoutSessionForMember`
- `getWorkoutSessionsForTrainer`
- `updateWorkoutSessionStatus`
- `updateWorkoutSessionContent`
- `requestSessionReschedule`

### Staff

- `getStaffMembers`
- `createStaffMember`
- `updateStaffMember`
- `disableStaffMember`
- `getStaffCheckInsForDate`
- `checkInStaffMember`
- `getStaffUsageHistory`
- `getStaffFeedbackItems`
- `updateStaffFeedbackItem`
- `getStaffEquipmentStatus`
- `createStaffMaintenanceReport`
- `markStaffEquipmentMaintained`

### Admin

- `fetchExecutiveDashboardData`
- `fetchMembershipAnalyticsData`
- `fetchAdminStaffData`
- `fetchAdminScheduleData`
- `fetchPayrollData`
- `fetchPerformanceData`
- `fetchEquipmentManagementData`
- `fetchFeedbackSatisfactionData`
- `fetchReportCards`
- `fetchRevenueBreakdowns`

## Nhung diem can luu y khi code

- Khong xoa fallback local/mock neu chua thay the het bang Supabase.
- Neu them query Supabase, can xu ly truong hop `supabase === null`.
- Neu status co ca schema moi/cu, can normalize nhu cac service hien tai.
- Khi update DB, nen cap nhat UI model mapper tuong ung.
- Cac message tieng Viet trong code co mot so doan bi mojibake; khi sua nen viet lai bang Unicode dung.
- PT portal file rat lon, neu sua tinh nang lon nen tach component/hook dan dan.
- Route guard phu thuoc localStorage event `gymster:user-updated` va `CURRENT_SESSION_KEY`.

## Goi y commit/code organization

- Nhom thay doi theo feature/portal.
- Business logic nen nam trong service/model testable.
- UI chi nen goi service va render state.
- Neu them test, dat gan service trong `frontend/src/services/*.test.js`.
