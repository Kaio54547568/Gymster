# 06 - Good Design Context

## Muc tieu danh gia

File nay gom context de viet tai lieu "Danh gia Coupling, Cohesion, SOLID" cho Gymster. Noi dung dua tren source hien tai: React portal app, service layer, Supabase schema va backend AI phu tro.

## Diem thiet ke tot

### 1. Tach portal theo vai tro

Moi vai tro co entry/module rieng:

- Admin: `frontend/src/roles/admin`
- Staff: `frontend/src/roles/staff`
- PT: `frontend/src/roles/pt`
- Member: `frontend/src/roles/member`

Loi ich:

- Giam nham lan UI/quyen giua cac vai tro.
- De mapping requirement theo actor.
- Route guard trung tam trong `AppRoutes.jsx`.

### 2. Co service layer rieng

Data access va business logic chu yeu nam trong `frontend/src/services`, vi du:

- `authService`
- `memberPackageApi`
- `trainingRequestApi`
- `workoutSessionApi`
- `staffOperationsApi`
- `adminDataApi`

Loi ich:

- UI khong can biet truc tiep chi tiet table SQL.
- Mapper giup tach schema snake_case khoi UI camelCase.
- Cac ham pure nhu `packageEntitlement`, `workoutPlanModel`, `workoutScheduleGenerator`, `workoutSessionConflict` co the unit test.

### 3. Shared layout/context

Dung cac module chung:

- `RoleShell`
- `AppearanceContext`
- `LanguageContext`
- `RoleNotificationsPage`
- `AccountProfile`, `AccountSettings`

Loi ich:

- Giam lap code layout/account.
- Tao trai nghiem portal dong nhat.
- Tach concern theme/language khoi screen.

### 4. Fallback local/mock cho MVP

Nhieu service co xu ly khi `supabase === null`, dung localStorage/test data.

Loi ich:

- Demo duoc UI khi chua cau hinh database.
- Giam rui ro trong qua trinh migrate tu mock sang Supabase.

### 5. Database co domain ro

Schema chia thanh cac nhom:

- Account/membership.
- Training/PT.
- Payment/invoice.
- Facility/maintenance.
- HR/payroll.
- Feedback/notification.

Loi ich:

- Phu hop voi cac bounded context nghiep vu.
- De ve ERD va trace tu UI den DB.

## Coupling analysis

### Coupling thap/tot

- Route guard khong phu thuoc chi tiet UI cua tung portal, chi can `currentUser.role`.
- Service mapper giup UI giam phu thuoc truc tiep vao schema DB.
- Backend AI tach rieng khoi frontend, API key khong nam tren client.
- Unit-tested pure modules khong phu thuoc Supabase/browser.

### Coupling cao/can cai thien

- `frontend/src/roles/pt/App.tsx` gom rat nhieu screen, type, helper, state va UI trong mot file lon. Coupling giua cac man hinh PT cao.
- Mot so service vua query DB, vua map data, vua tao notification, vua update side-effect; vi du `trainingRequestApi` co nhieu luong nghiep vu trong cung file.
- LocalStorage session la dependency ngam cua route guard va nhieu service.
- Mot so compatibility logic cho schema moi/cu lam service phuc tap hon.

### Huong giam coupling

- Tach PT portal thanh:
  - `screens/`
  - `components/`
  - `hooks/`
  - `domain/`
- Tach workflow side-effect trong `trainingRequestApi` thanh cac service nho:
  - request repository
  - notification service
  - workout session command service
  - makeup session service
- Tao adapter Supabase rieng de test duoc service bang mock.

## Cohesion analysis

### Cohesion tot

- `packageEntitlement.js`: chi xu ly rule ngay nghi theo goi.
- `workoutScheduleGenerator.js`: chi parse/sinh session theo lich co dinh.
- `workoutPlanModel.js`: chi normalize/validate workout plan.
- `workoutSessionConflict.js`: chi kiem tra trung lich.
- Admin screens moi file dai dien mot report/feature rieng.
- Staff components tach theo nghiep vu: MemberList, DailyCheckIn, EquipmentStatus, FeedbackManagement.

### Cohesion chua tot

- `pt/App.tsx` vua la router/shell, vua la data model, vua chua nhieu screen va modal.
- Mot so API service gom qua nhieu responsibility do dang migrate schema/fallback.
- `authService.js` gom login local, Supabase login, OAuth, session storage, username validation, user mapping trong cung file.

### Huong tang cohesion

- Tach `authService` thanh:
  - `sessionStorage`
  - `roleMapper`
  - `oauthService`
  - `credentialAuthService`
  - `userMapper`
- Tach validators thanh file pure de test.
- Tach mapper DB row theo domain.

## SOLID analysis

### Single Responsibility Principle

Dat tot:

- Cac utility pure module co mot trach nhiem ro.
- Portal folder tach theo actor.

Can cai thien:

- `pt/App.tsx`, `authService.js`, `trainingRequestApi.js` dang co nhieu trach nhiem.

### Open/Closed Principle

Dat tot:

- Role route map co the mo rong role moi bang `ROLE_HOME`.
- Service mapper giup them field UI ma it anh huong component.

Can cai thien:

- Nhieu status mapping hard-code trong service; nen tach thanh constants/config.

### Liskov Substitution Principle

Context:

- Khong co ke thua class nhieu, nen LSP khong phai diem trong tam.
- Co the ap dung o muc adapter: local fallback va Supabase service nen tra cung shape `{ data, error }`.

Dat tot:

- Nhieu ham local fallback tra object giong Supabase path.

Can cai thien:

- Mot so service tra `{ ok, message }`, mot so tra `{ data, error }`; nen chuan hoa theo command/query.

### Interface Segregation Principle

Dat tot:

- Portal chi import service can dung.
- Shared components tach layout/profile/settings.

Can cai thien:

- PT App mot file lon lam screen phu thuoc nhieu type/helper khong can thiet.
- Nen tach hooks theo tung screen de component chi nhan props can dung.

### Dependency Inversion Principle

Dat tot:

- UI phu thuoc service layer thay vi Supabase truc tiep trong nhieu flow.

Can cai thien:

- Service layer phu thuoc truc tiep `supabase` singleton. De test/mock tot hon, nen inject repository/client.
- Backend AI da dung service rieng, co the tiep tuc ap dung pattern cho nghiep vu.

## Design pattern/co che dang dung

- Adapter/Mapper: map DB row sang UI model.
- Repository-like service: cac file `*Api.js`.
- Guard: `RoleRoute`, `PublicRoute`.
- Provider/Context: language, appearance.
- Fallback strategy: Supabase path vs localStorage path.
- Event bus nhe: custom events `gymster:user-updated`, `gymster:training-requests-updated`, `gymster:schedule-updated`.

## Rui ro thiet ke

- Client-side business rules co the bi bypass neu production khong co backend/RLS nghiem.
- RLS demo khong du an toan production.
- Mojibake tieng Viet lam giam chat luong UX/documentation.
- File PT lon kho review/test.
- Mixed `.jsx`/`.tsx` khong sai, nhung can convention ro neu team phat trien tiep.

## Ket luan danh gia

Gymster co nen tang thiet ke kha tot cho MVP: phan vai tro ro, service layer day du, database domain phong phu, co test cho pure business logic. Diem can cai thien chinh la giam do lon va coupling cua mot so service/screen, chuan hoa result shape, tach mapper/validator/workflow side-effect de de test va de maintain hon.
