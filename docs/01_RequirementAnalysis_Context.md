# 01 - Requirement Analysis Context

## Muc tieu he thong

Gymster la he thong quan ly phong gym giup so hoa cac nghiep vu chinh: quan ly hoi vien, goi tap, thanh toan, lich tap, PT, nhan vien, thiet bi, bao tri, feedback va dashboard dieu hanh. He thong duoc thiet ke theo nhieu portal rieng cho tung nhom nguoi dung de moi vai tro chi thay cac chuc nang lien quan.

## Tac nhan chinh

| Tac nhan | Mo ta | Quyen/chuc nang chinh |
| --- | --- | --- |
| Khach vang lai | Nguoi chua dang nhap | Xem landing page, goi tap, trainer, dang ky/dang nhap |
| Hoi vien | Khach hang phong gym | Xem dashboard, goi tap, lich tap, trainer, feedback, profile, gia han/doi goi |
| Nhan vien/le tan | Van hanh phong gym hang ngay | Them hoi vien, quan ly hoi vien, check-in, gia han goi, hoa don, lich su su dung, feedback, thiet bi |
| PT/trainer | Huan luyen vien ca nhan | Quan ly hoc vien, lich tap, tien do, workout plan, meal plan, danh gia, bao cao thiet bi |
| Admin/Owner | Quan ly/chu phong gym | Dashboard dieu hanh, doanh thu, hoi vien, nhan su, payroll, lich lam viec, thiet bi, bao tri, feedback, package/payment |
| AI Assistant | Tro ly trong app | Ho tro hoi dap va thuc hien mot so hanh dong nhu tao lich/request theo context nguoi dung |

## Functional requirements

### Auth va phan quyen

- Nguoi dung dang nhap bang username/email + password.
- Co ho tro OAuth Google/Facebook qua Supabase Auth.
- He thong luu session hien tai trong localStorage voi thoi han 1 ngay hoac 2 tuan neu "remember login".
- Route guard dieu huong theo role:
  - `admin` va `owner` -> `/admin`.
  - `staff` -> `/staff`.
  - `pt` va `trainer` -> `/pt`.
  - `member` -> `/member`.
- Public route redirect user da dang nhap ve home theo role.

### Onboarding hoi vien

- Hoi vien moi co trang thai `PendingOnboarding`, `PendingPTApproval`, `PendingPayment`, `Active`, `Cancelled`.
- Hoi vien chon goi tap, chon PT, chon lich co dinh, thanh toan va kich hoat tai khoan.
- Trang onboarding gom:
  - `/onboarding/status`
  - `/onboarding/packages`
  - `/onboarding/trainers`
  - `/onboarding/payment`
  - `/onboarding/success`
- Member portal co trang `/member/select-package` khi hoi vien chua active.

### Hoi vien

- Xem dashboard ca nhan, goi tap dang dung, so buoi con lai va canh bao sap het han.
- Xem va quan ly goi tap: lich su goi, thanh toan, hoa don, yeu cau gia han/doi goi.
- Xem lich tap, tao buoi tap thu cong, huy/doi lich, booking buoi PT bu.
- Xem danh sach trainer va gui request chon PT.
- Gui feedback ve dich vu va complaint.
- Cap nhat profile, avatar, ngon ngu, mat khau va cai dat tai khoan.
- Khi member active nhung khong co goi kha dung, cac trang noi dung bi khoa va yeu cau gia han/dang ky goi.

### Staff

- Xem dashboard van hanh: hoi vien, doanh thu, renewal, feedback, thiet bi.
- Them hoi vien moi; tao user/member, goi/tai khoan o trang thai cho thanh toan.
- Quan ly danh sach hoi vien, xem chi tiet, sua thong tin, vo hieu hoa tai khoan bang mat khau staff.
- Check-in hoi vien theo ngay, ghi vao `member_usage_history`, tang so buoi da dung va giam so buoi con lai.
- Xu ly yeu cau gia han/doi goi tu `package_change_requests`.
- Xem hoa don, payment, lich su su dung.
- Quan ly feedback/complaint va phan hoi.
- Xem trang thai thiet bi, tao maintenance report, mark thiet bi da bao tri.

### PT/Trainer

- Xem dashboard PT voi hoc vien, lich tap, muc tieu, tien do.
- Quan ly trainee duoc gan qua `trainer_assignments`.
- Xem chi tiet hoc vien: thong tin, goi tap, medical history, body metrics, progress.
- Xem lich, cap nhat trang thai buoi tap, them noi dung workout cho session.
- Tao/sua/xoa workout plan va exercises.
- Xu ly training request: assignment, reschedule, makeup PT session, cancel booking.
- Tao meal plan va gan cho hoi vien.
- Bao cao thiet bi hong tu portal PT.

### Admin/Owner

- Xem executive dashboard: revenue, active members, open issues, feedback count, distribution goi.
- Phan tich doanh thu theo thang, goi, phuong thuc thanh toan.
- Phan tich hoi vien: tang truong, active/expired, VIP, nhom tuoi.
- Quan ly nhan su/trainer, lich lam viec, availability.
- Xem performance review va payroll.
- Quan ly thiet bi, phong, maintenance tracking/report.
- Xem feedback/satisfaction va package/payment.
- Xem notifications, settings, profile.

### Backend AI

- Endpoint health check: `GET /api/health`.
- Endpoint Claude raw message: `POST /api/claude/messages`.
- Endpoint AI chat member/general: `POST /api/ai/chat`.
- Endpoint AI chat staff: `POST /api/staff/ai/chat`.
- Backend yeu cau `ANTHROPIC_API_KEY` trong `backend/.env`.

## Non-functional requirements

- UI premium gym dark red/black, responsive cho desktop/mobile.
- Tach portal theo role de giam sai quyen thao tac.
- Data access uu tien qua `frontend/src/services`, khong goi Supabase truc tiep trong UI neu co the.
- Co fallback local/mock khi Supabase chua cau hinh de demo duoc mot so flow.
- Database dung UUID, snake_case, constraint, index, trigger `updated_at`.
- Can thay RLS demo bang policy authenticated/role-aware truoc production.
- Password seed/demo khong duoc dung cho production.

## Business rules

- Role `owner` duoc xem nhu `admin`; role `trainer` duoc xem nhu `pt`.
- Goi PT co session limit va so ngay nghi hop le tinh theo thoi luong goi.
- Moi thang cho phep so ngay nghi/bu PT theo rule trong `packageEntitlement`.
- Check-in trong cung mot ngay khong duoc ghi trung.
- Hoi vien khong co goi active/usable bi khoa noi dung member portal, chi co the vao trang gia han/dang ky goi.
- PT chap nhan request doi lich thi update `workout_sessions`; tu choi thi ghi ly do va gui notification.
- Request makeup PT duoc chap nhan se tao session moi va cap nhat bang/summary makeup.
- Bao cao thiet bi hong se tao `maintenance_reports`, cap nhat `equipment.status = broken` va thong bao admin/owner.

## User stories mau

| ID | User story | Acceptance criteria |
| --- | --- | --- |
| US-01 | La hoi vien moi, toi muon chon goi va PT de bat dau tap. | Chon duoc package, trainer, schedule; tao package/request/payment; tai khoan chuyen den trang thai phu hop. |
| US-02 | La hoi vien, toi muon xem lich tap va xin doi lich khi ban. | Lich hien thi theo package/session; gui request reschedule cho PT; nhan notification khi PT xu ly. |
| US-03 | La staff, toi muon check-in hoi vien tai quay. | He thong kiem tra goi active, khong trung ngay, ghi usage history va cap nhat so buoi. |
| US-04 | La staff, toi muon tao hoi vien moi. | Tao user + member, validate username, gan PT neu co, trang thai pending payment. |
| US-05 | La PT, toi muon quan ly workout plan cho hoc vien. | Tao/sua/xoa plan, gom nhieu exercise, validate ten plan va exercises. |
| US-06 | La PT, toi muon chap nhan/tu choi request doi lich. | Status request cap nhat; neu accept thi session doi ngay/gio; member nhan notification. |
| US-07 | La admin, toi muon xem doanh thu va thong ke hoi vien. | Dashboard lay data tu payments, members, member_packages, packages, feedback/complaints. |
| US-08 | La nhan vien/PT, toi muon bao cao thiet bi hong. | Tao maintenance report, thiet bi chuyen broken, admin/owner nhan notification. |

## Use case chinh

```mermaid
flowchart LR
  "Khach vang lai" --> "Dang ky / dang nhap"
  "Hoi vien" --> "Quan ly goi tap"
  "Hoi vien" --> "Quan ly lich tap"
  "Hoi vien" --> "Gui feedback"
  "Staff" --> "Them va cap nhat hoi vien"
  "Staff" --> "Check-in hoi vien"
  "Staff" --> "Xu ly goi / hoa don"
  "PT" --> "Quan ly trainee"
  "PT" --> "Workout plan / tien do"
  "PT" --> "Xu ly training request"
  "Admin/Owner" --> "Dashboard va analytics"
  "Admin/Owner" --> "Nhan su / payroll"
  "Admin/Owner" --> "Thiet bi / bao tri"
```
