# Gymster

Gymster la ung dung quan ly phong gym duoc xay dung theo mo hinh nhieu cong portal: khach/landing, dang nhap, hoi vien, nhan vien, PT/trainer va admin/owner. Project hien tai tap trung vao frontend React/Vite va dang migrate dan cac luong du lieu tu mock/localStorage sang Supabase.

## Tong quan

Gymster ho tro cac nghiep vu chinh cua phong gym:

- Quan ly hoi vien, goi tap, gia han goi va lich su su dung.
- Onboarding hoi vien moi: chon goi, chon PT, thanh toan va kich hoat tai khoan.
- Quan ly lich tap, buoi PT, yeu cau training va thong bao.
- Van hanh quay le tan: them hoi vien, check-in, thu phi, hoa don, feedback, thiet bi.
- Portal PT: danh sach hoc vien, lich tap, tien do, dinh huong tap luyen va ke hoach dinh duong.
- Portal admin/owner: dashboard dieu hanh, doanh thu, hoi vien, nhan su, payroll, thiet bi, bao tri va muc do hai long.

## Tech stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Supabase JS
- Recharts
- Lucide React
- Motion

## Cau truc thu muc

```text
Gymster/
|-- frontend/              # Ung dung React/Vite chinh
|   |-- src/
|   |   |-- components/    # Component dung chung cho auth/layout/theme
|   |   |-- pages/         # Landing, Auth, Onboarding
|   |   |-- roles/         # Portal theo vai tro: admin, staff, pt, member
|   |   |-- routes/        # Route guard va route tong
|   |   |-- services/      # API/service layer, Supabase client
|   |   |-- styles/        # Global styles va design tokens
|   |   `-- test_data/     # Tai khoan/demo data fallback
|   |-- .env.example
|   `-- package.json
|-- database/              # SQL schema, seed va Supabase helper scripts
|-- source_figma/          # Source UI tham khao tu Figma cho tung portal
|-- skills.md              # Quy uoc lam viec cho AI coding agents
|-- package.json           # Script root delegate vao frontend
`-- README.md
```

## Yeu cau moi truong

- Node.js va npm
- Supabase project neu muon chay voi database that
- Trinh duyet hien dai

## Cai dat

Clone project va cai dependency:

```bash
npm install
npm --prefix frontend install
```

Tao file moi truong cho frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Cap nhat `frontend/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Neu thieu hai bien nay, app van khoi dong nhung cac chuc nang phu thuoc Supabase se bao chua duoc cau hinh.

## Chay local

Tu root project:

```bash
npm run dev
```

Hoac chay truc tiep trong frontend:

```bash
npm --prefix frontend run dev
```

Cac script khac:

```bash
npm run build
npm run preview
npm run lint
```

## Database va Supabase

Thu muc `database/` chua cac file SQL chinh:

- `schema.sql`: tao bang, constraint, foreign key, index, trigger va mot so compatibility columns cho frontend.
- `seed.sql`: du lieu mau cho users, employees, trainers, packages, members, payments, invoices, workout sessions, notifications va cac bang portal mo rong.
- `member_activation_rpc.sql`: RPC kich hoat tai khoan hoi vien.
- `storage_pics_policies.sql`: policy cho bucket/avatar `pics`.
- `production_cleanup.sql`: script don dep/production hardening tham khao.

Thiet lap database trong Supabase SQL Editor:

1. Chay `database/schema.sql`.
2. Chay `database/seed.sql`.
3. Neu can luong kich hoat hoi vien, chay `database/member_activation_rpc.sql`.
4. Neu can upload avatar/hinh anh, tao bucket `pics` va chay `database/storage_pics_policies.sql`.

Chi tiet mapping bang theo tung portal nam trong `database/README.md`.

## Route chinh

- `/`: Landing page
- `/login`: Dang nhap
- `/register`: Dang ky
- `/auth/callback`: OAuth callback
- `/auth/complete-profile`: Hoan tat profile sau OAuth
- `/onboarding/status`: Trang thai dang ky hoi vien
- `/onboarding/packages`: Chon goi tap
- `/onboarding/trainers`: Chon PT
- `/onboarding/payment`: Thanh toan onboarding
- `/onboarding/success`: Hoan tat onboarding
- `/admin/*`: Portal admin/owner
- `/staff/*`: Portal nhan vien
- `/pt/*`: Portal PT/trainer
- `/member/*`: Portal hoi vien

Route guard se dieu huong nguoi dung theo role. Role `owner` duoc map ve admin, role `trainer` duoc map ve PT.

## Tai khoan demo

Seed database co san mot so tai khoan mau:

| Role | Email | Username | Password |
| --- | --- | --- | --- |
| Admin | `admin@gymster.local` | `admin01` | `Admin@123` |
| Staff | `staff@gymster.local` | `staff00` | `Staff@123` |
| Trainer/PT | `trainer@gymster.local` | `trainer00` | `Trainer@123` |
| Member | `member@gymster.local` | `member00` | `Member@123` |

Trong `frontend/src/test_data/users.json` cung co fallback demo users cho cac luong cu. Luu y file fallback hien co mot so chu tieng Viet bi mojibake; nen uu tien du lieu seed Supabase khi test nghiep vu that.

## Quy uoc phat trien

- Giu thay doi gon trong module/portal lien quan.
- Uu tien viet logic truy xuat du lieu trong `frontend/src/services` thay vi goi Supabase truc tiep trong component.
- Khong xoa mock/fallback data khi chua co yeu cau ro.
- Giao dien theo phong cach premium gym dark red/black dang co.
- UI text hien tai uu tien tieng Anh, tru khi task yeu cau tieng Viet.
- Khi sua UI, kiem tra responsive va cac trang portal khac de tranh vo route/role guard.
- Neu cap nhat file design system `DESIGN.md` trong tuong lai, chay:

```bash
npx "@google/design.md" lint DESIGN.md
```

## Ghi chu hien trang

- Project frontend dang dung ca `.jsx` va `.tsx`.
- Supabase Auth da co luong OAuth/callback, dong thoi app van luu current user/session metadata trong localStorage cho route guard hien tai.
- Mot so service da co fallback khi Supabase chua cau hinh, nhung cac chuc nang database day du can `.env.local` hop le va SQL schema/seed da duoc chay.
- `source_figma/` la source tham khao UI theo tung portal, khong phai app chinh de chay production.
