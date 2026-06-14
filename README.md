# Gymster

Gymster là ứng dụng quản lý phòng gym được xây dựng theo mô hình nhiều cổng portal: khách/landing, đăng nhập, hội viên, nhân viên, PT/trainer và admin/owner. Project hiện tại tập trung vào frontend React/Vite và đang migrate dần các luồng dữ liệu từ mock/localStorage sang Supabase.

Link web deployed: https://gymster-vert.vercel.app/
## Tổng Quan

Gymster hỗ trợ các nghiệp vụ chính của phòng gym:

- Quản lý hội viên, gói tập, gia hạn gói và lịch sử sử dụng.
- Onboarding hội viên mới: chọn gói, chọn PT, thanh toán và kích hoạt tài khoản.
- Quản lý lịch tập, buổi PT, yêu cầu training và thông báo.
- Vận hành quầy lễ tân: thêm hội viên, check-in, thu phí, hóa đơn, feedback, thiết bị.
- Portal PT: danh sách học viên, lịch tập, tiến độ, định hướng tập luyện và kế hoạch dinh dưỡng.
- Portal admin/owner: dashboard điều hành, doanh thu, hội viên, nhân sự, payroll, thiết bị, bảo trì và mức độ hài lòng.

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Supabase JS
- Recharts
- Lucide React
- Motion

## Cấu Trúc Thư Mục

```text
Gymster/
|-- frontend/              # Ứng dụng React/Vite chính
|   |-- src/
|   |   |-- components/    # Component dùng chung cho auth/layout/theme
|   |   |-- pages/         # Landing, Auth, Onboarding
|   |   |-- roles/         # Portal theo vai trò: admin, staff, pt, member
|   |   |-- routes/        # Route guard và route tổng
|   |   |-- services/      # API/service layer, Supabase client
|   |   |-- styles/        # Global styles và design tokens
|   |   `-- test_data/     # Tài khoản/demo data fallback
|   |-- .env.example
|   `-- package.json
|-- database/              # SQL schema, seed và Supabase helper scripts
|-- source_figma/          # Source UI tham khảo từ Figma cho từng portal
|-- skills.md              # Quy ước làm việc cho AI coding agents
|-- package.json           # Script root delegate vào frontend
`-- README.md
```

## Yêu Cầu Môi Trường

- Node.js và npm
- Supabase project nếu muốn chạy với database thật
- Trình duyệt hiện đại

## Cài Đặt

Clone project và cài dependency:

```bash
npm install
npm --prefix frontend install
```

Tạo file môi trường cho frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Trên PowerShell có thể dùng:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

Cập nhật `frontend/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Nếu thiếu hai biến này, app vẫn khởi động nhưng các chức năng phụ thuộc Supabase sẽ báo chưa được cấu hình.

## Chạy Local

Từ root project:

```bash
npm run dev
```

Hoặc chạy trực tiếp trong frontend:

```bash
npm --prefix frontend run dev
```

Các script khác:

```bash
npm run build
npm run preview
npm run lint
```

## Email Verification For Registration

Member email/password registration now uses a backend verification-code flow:

1. Run `database/email_registration_verification.sql` in Supabase SQL Editor.
2. Add backend environment variables in `backend/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
REGISTRATION_CODE_SECRET=change_this_to_a_long_random_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM="Gymster <no-reply@gymster.vn>"
```

3. Start both servers while developing:

```bash
npm run dev:backend
npm run dev
```

Google/Facebook OAuth registration still uses the existing Supabase OAuth flow and does not require this email-code step.

### Production deploy on Vercel

Deploy from the repository root, not from the `frontend/` subfolder, so Vercel can include both:

- static frontend build output from `frontend/dist`
- serverless auth functions from `api/auth/*`

In Vercel Project Settings, set:

- Root Directory: project root / repository root
- Build Command: `npm run build`
- Output Directory: `frontend/dist`

Add the same backend environment variables in Vercel Project Settings -> Environment Variables.

For a production mail provider, Resend SMTP works with this app's Nodemailer setup:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your_resend_api_key
MAIL_FROM="Gymster <no-reply@your-verified-domain.com>"
```

Verify your sending domain in the email provider before using it in `MAIL_FROM`.

## Database Và Supabase

Thư mục `database/` chứa các file SQL chính:

- `schema.sql`: tạo bảng, constraint, foreign key, index, trigger và một số compatibility columns cho frontend.
- `seed.sql`: dữ liệu mẫu cho users, employees, trainers, packages, members, payments, invoices, workout sessions, notifications và các bảng portal mở rộng.
- `member_activation_rpc.sql`: RPC kích hoạt tài khoản hội viên.
- `storage_pics_policies.sql`: policy cho bucket/avatar `pics`.
- `production_cleanup.sql`: script dọn dẹp/production hardening tham khảo.

Thứ tự chạy SQL trong Supabase SQL Editor:

1. Chạy `database/schema.sql`.
2. Chạy `database/member_care_upgrade.sql` nếu database đã tồn tại từ bản cũ.
3. Chạy `database/ai_makeup_booking_upgrade.sql` nếu database đã tồn tại từ bản cũ.
4. Chạy `database/workout_plan_crud_upgrade.sql` nếu database đã tồn tại từ bản cũ.
5. Chạy `database/member_manual_workout_upgrade.sql` nếu database đã tồn tại từ bản cũ.
6. Chạy `database/training_request_cancel_reschedule_upgrade.sql` nếu database đã tồn tại từ bản cũ.
7. Chạy `database/production_cleanup.sql` nếu cần các cột hỗ trợ production như `address`, `citizen_id`, `certification`, `performance_score`.
8. Chạy `database/seed.sql` để reset và dựng lại bộ data demo đầy đủ.
9. Chạy `database/email_registration_verification.sql` nếu dùng luồng đăng ký bằng mã email.
10. Nếu cần upload avatar/hình ảnh, tạo bucket `pics` và chạy `database/storage_pics_policies.sql`.

Chi tiết mapping bảng theo từng portal nằm trong `database/README.md`.

## Route Chính

- `/`: Landing page
- `/login`: Đăng nhập
- `/register`: Đăng ký
- `/auth/callback`: OAuth callback
- `/auth/complete-profile`: Hoàn tất profile sau OAuth
- `/onboarding/status`: Trạng thái đăng ký hội viên
- `/onboarding/packages`: Chọn gói tập
- `/onboarding/trainers`: Chọn PT
- `/onboarding/payment`: Thanh toán onboarding
- `/onboarding/success`: Hoàn tất onboarding
- `/admin/*`: Portal admin/owner
- `/staff/*`: Portal nhân viên
- `/pt/*`: Portal PT/trainer
- `/member/*`: Portal hội viên

Route guard sẽ điều hướng người dùng theo role. Role `owner` được map về admin, role `trainer` được map về PT.

## Tài Khoản Demo

Seed database có sẵn một số tài khoản mẫu:

| Role | Email | Username | Password |
| --- | --- | --- | --- |
| Admin | `admin@gymster.local` | `admin01` | `Admin@123` |
| Staff | `staff@gymster.local` | `staff00` | `Staff@123` |
| Trainer/PT | `trainer@gymster.local` | `trainer00` | `Trainer@123` |
| Member | `member@gymster.local` | `member00` | `Member@123` |

Trong `frontend/src/test_data/users.json` cũng có fallback demo users cho các luồng cũ. Lưu ý file fallback hiện có một số chữ tiếng Việt bị mojibake; nên ưu tiên dữ liệu seed Supabase khi test nghiệp vụ thật.

## Quy Ước Phát Triển

- Giữ thay đổi gọn trong module/portal liên quan.
- Ưu tiên viết logic truy xuất dữ liệu trong `frontend/src/services` thay vì gọi Supabase trực tiếp trong component.
- Không xóa mock/fallback data khi chưa có yêu cầu rõ.
- Giao diện theo phong cách premium gym dark red/black đang có.
- UI text hiện tại ưu tiên tiếng Anh, trừ khi task yêu cầu tiếng Việt.
- Khi sửa UI, kiểm tra responsive và các trang portal khác để tránh vỡ route/role guard.
- Nếu cập nhật file design system `DESIGN.md` trong tương lai, chạy:

```bash
npx "@google/design.md" lint DESIGN.md
```

## Ghi Chú Hiện Trạng

- Project frontend đang dùng cả `.jsx` và `.tsx`.
- Supabase Auth đã có luồng OAuth/callback, đồng thời app vẫn lưu current user/session metadata trong localStorage cho route guard hiện tại.
- Một số service đã có fallback khi Supabase chưa cấu hình, nhưng các chức năng database đầy đủ cần `.env.local` hợp lệ và SQL schema/seed đã được chạy.
- `source_figma/` là source tham khảo UI theo từng portal, không phải app chính để chạy production.
