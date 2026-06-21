# Gymster - Hệ Thống Quản Lý Phòng Gym Đa Cổng Portal

Gymster là một giải pháp quản lý phòng gym toàn diện, hiện đại, hoạt động theo mô hình phân quyền nhiều cổng (multi-portal) bao gồm: khách hàng vãng lai (Landing page), quy trình Onboarding hội viên mới, cổng dành riêng cho Hội viên (Member), Nhân viên (Staff), Huấn luyện viên cá nhân (PT/Trainer) và Quản trị viên/Chủ phòng gym (Admin/Owner). 

Hệ thống được thiết kế tối ưu, kết hợp giữa frontend React 19 mượt mà, backend Node.js hiệu năng cao, cơ sở dữ liệu Supabase mạnh mẽ và dịch vụ nhận diện giọng nói (Speech-to-Text) thông minh bằng AI.

* **Link Web đã deploy (Production):** [https://gymster-vert.vercel.app/](https://gymster-vert.vercel.app/)

---

## 📌 Các Phân Hệ & Cổng Portal Chính

### 1. Landing Page & Quy trình Onboarding
* **Landing Page:** Giới thiệu dịch vụ phòng gym, bảng giá gói tập, danh sách huấn luyện viên nổi bật và công cụ tương tác.
* **Đăng ký & Onboarding:** Hội viên mới có thể tự chọn gói tập (tiêu chuẩn hoặc VIP), chọn Huấn luyện viên cá nhân (PT), điền thông tin cá nhân, thực hiện thanh toán trực tuyến (có đính kèm minh chứng thanh toán) và nhận kích hoạt tài khoản tự động.

### 2. Cổng Hội Viên (Member Portal)
* **Dashboard cá nhân:** Xem trạng thái gói tập, số buổi PT còn lại, lịch tập luyện sắp tới và thông báo từ hệ thống.
* **Quản lý lịch:** Theo dõi lịch tập cá nhân, đặt lịch/hủy lịch/đổi lịch tập với PT trực tuyến.
* **Gói tập:** Xem chi tiết gói tập hiện tại, lịch sử thanh toán, hóa đơn và gửi yêu cầu thay đổi/gia hạn gói tập.
* **Đánh giá dịch vụ:** Gửi phản hồi, khiếu nại hoặc đánh giá chất lượng dịch vụ của phòng gym và PT.
* **Hồ sơ cá nhân:** Cập nhật thông tin liên hệ, chỉ số cơ thể, mục tiêu tập luyện và cài đặt nhận thông báo.

### 3. Cổng Huấn Luyện Viên (PT/Trainer Portal)
* **Quản lý học viên:** Theo dõi danh sách hội viên đang phụ trách, xem chỉ số cơ thể, bệnh lý và tiến độ tập luyện của họ.
* **Lịch dạy:** Xem lịch dạy trong tuần, nhận hoặc từ chối các yêu cầu book lịch tập từ học viên.
* **Giáo án tập luyện & Dinh dưỡng:** Xây dựng và cập nhật kế hoạch tập luyện (Workout Plan) cũng như thực đơn dinh dưỡng (Meal Plan) riêng biệt cho từng học viên.
* **Đánh giá tiến độ:** Chấm điểm, nhận xét định kỳ dựa trên các chỉ số đo lường khách quan và chủ quan.

### 4. Cổng Nhân Viên (Staff Portal)
* **Vận hành quầy lễ tân:** Check-in hội viên bằng mã/email, thêm hội viên mới tại quầy, quản lý thông tin hội viên.
* **Xử lý gia hạn & Thanh toán:** Duyệt/tạo hóa đơn, xác nhận thanh toán trực tiếp hoặc trực tuyến, ghi nhận lịch sử giao dịch.
* **Quản lý phản hồi:** Tiếp nhận ý kiến đóng góp, khiếu nại của khách hàng để điều phối xử lý kịp thời.
* **Giám sát thiết bị:** Theo dõi tình trạng máy tập, báo cáo hư hỏng hoặc yêu cầu bảo trì thiết bị tại các phòng tập.

### 5. Cổng Admin/Chủ Phòng Gym (Admin/Owner Portal)
* **Báo cáo tài chính & Doanh thu:** Biểu đồ doanh thu chi tiết theo thời gian, theo loại gói tập, thống kê dòng tiền.
* **Phân tích hội viên:** Thống kê tỷ lệ giữ chân hội viên, lượng hội viên mới, tần suất tập luyện trung bình.
* **Quản trị nhân sự:** Quản lý thông tin nhân viên & PT, phân chia ca làm việc (Shift Scheduling), tính lương (Payroll/Payslips) và đánh giá hiệu suất làm việc (Performance Reviews).
* **Quản lý cơ sở vật chất:** Giám sát thiết bị, lịch bảo trì định kỳ, danh sách phòng tập (Rooms).
* **Cấu hình hệ thống:** Quản lý danh mục gói tập, tạo chương trình khuyến mãi/ưu đãi (Promotions).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
* **React 19** & **Vite 8**
* **React Router 7** (Quản lý định tuyến và phân quyền route guard)
* **Tailwind CSS 4** (Thiết kế giao diện hiện đại, responsive tốt)
* **Recharts** (Vẽ biểu đồ thống kê tài chính, dữ liệu hội viên sinh động)
* **Lucide React** (Bộ icon hiện đại)
* **Motion** (Tạo các hiệu ứng chuyển động mượt mà)

### Backend
* **Node.js (Custom HTTP Server):** Xử lý nghiệp vụ phức tạp, gửi email mã xác thực qua SMTP (Nodemailer), tạo hóa đơn PDF.
* **Claude API (Anthropic AI SDK):** Trợ lý ảo AI hỗ trợ tư vấn lộ trình tập luyện, dinh dưỡng và giải đáp thắc mắc.

### Speech-to-Text Service (Dịch vụ Giọng nói)
* **FastAPI (Python):** RESTful API hiệu năng cao.
* **FunASR SenseVoiceSmall:** Mô hình AI chuyển đổi giọng nói thành văn bản cực nhanh, độ chính xác cao và hỗ trợ đa ngôn ngữ.

### Database (Cơ sở dữ liệu)
* **Supabase (PostgreSQL):** Quản lý dữ liệu người dùng, bảo mật qua Row Level Security (RLS) và xử lý dữ liệu thông qua các Stored Procedures (RPC).

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
Gymster/
├── frontend/              # Mã nguồn giao diện chính (React/Vite)
│   ├── src/
│   │   ├── components/    # Components dùng chung (Auth, Layout, Theme, UI)
│   │   ├── pages/         # Trang Landing, Auth, Onboarding
│   │   ├── roles/         # Trang chức năng phân chia theo vai trò (admin, staff, pt, member)
│   │   ├── routes/        # Cấu hình routes, bảo mật Route Guards
│   │   ├── services/      # Lớp gọi API & cấu hình Supabase Client
│   │   ├── styles/        # CSS global và cấu hình thiết kế
│   │   └── test_data/     # Dữ liệu giả lập (mock data) dùng khi offline
│   ├── .env.example       # Mẫu biến môi trường của frontend
│   └── package.json       # Dependencies và scripts của frontend
├── backend/               # Server điều phối API & dịch vụ AI
│   ├── services/          # Các dịch vụ backend xử lý Auth, PDF, AI, Staff, Equipment...
│   ├── scripts/           # Các script đồng bộ tài khoản auth Supabase
│   ├── tests/             # Bài test chất lượng backend (Vitest)
│   ├── .env.example       # Mẫu biến môi trường của backend
│   └── package.json       # Dependencies của backend
├── database/              # Schema SQL, Seed mẫu và nâng cấp DB
│   ├── demo/              # Bộ cài đặt demo độc lập, tinh gọn
│   ├── schema.sql         # Cấu trúc bảng, trigger và khóa ngoại chính
│   ├── seed.sql           # Dữ liệu mẫu đồ sộ để phát triển và test
│   └── *.sql              # Các nâng cấp tính năng riêng lẻ (payment, schedule, AI...)
├── speech_service/        # Dịch vụ Speech-to-Text dùng Python FastAPI
│   ├── app.py             # Server FastAPI nhận file âm thanh và trả về text
│   ├── requirements.txt   # Các thư viện Python cần thiết
│   └── tests/             # Bài test dịch vụ speech
├── api/                   # Serverless Functions phục vụ deploy Vercel
├── vercel.json            # Cấu hình định tuyến và deploy Vercel
├── package.json           # Scripts quản lý chung ở thư mục gốc
└── skills.md              # Quy ước phát triển dành cho AI coding agents
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Cài đặt các gói phụ thuộc (Dependencies)
Chạy lệnh sau tại thư mục gốc để cài đặt dependencies cho cả thư mục gốc và frontend:
```bash
npm install
npm --prefix frontend install
```

Nếu bạn chạy cả backend cục bộ, cài đặt dependencies trong `backend/`:
```bash
npm --prefix backend install
```

### 2. Thiết lập Biến Môi Trường (Environment Variables)

#### Cấu hình cho Frontend:
Sao chép file cấu hình mẫu tại `frontend/`:
```bash
cp frontend/.env.example frontend/.env.local
# Hoặc trên Windows PowerShell:
Copy-Item frontend/.env.example frontend/.env.local
```
Mở file `frontend/.env.local` và cập nhật thông số kết nối Supabase của bạn:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

#### Cấu hình cho Backend:
Tương tự, tạo file cấu hình cho `backend/`:
```bash
cp backend/.env.example backend/.env
# Hoặc trên Windows PowerShell:
Copy-Item backend/.env.example backend/.env
```
Cập nhật thông tin tại `backend/.env`:
```env
ANTHROPIC_API_KEY=your_claude_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# (Tùy chọn) Cấu hình SMTP để gửi mã xác nhận/quên mật khẩu qua Email:
AUTH_CODE_SECRET=change_this_to_a_long_random_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM="Gymster <no-reply@gymster.vn>"
```

### 3. Chạy các dịch vụ ở chế độ phát triển (Development Mode)

Chạy đồng thời các dịch vụ từ thư mục gốc:

* **Chạy Frontend (React Vite) & Backend đồng thời:**
  ```bash
  # Khởi động backend server
  npm run dev:backend

  # Khởi động frontend
  npm run dev
  ```
  *(Hoặc chạy trực tiếp frontend bằng: `npm --prefix frontend run dev`)*

* **Chạy dịch vụ Speech-to-Text (FastAPI):**
  *(Yêu cầu môi trường Python ảo venv đã được tạo và cài đặt các thư viện trong `speech_service/requirements.txt`)*
  ```bash
  npm run dev:speech
  ```

---

## 💾 Thiết Lập Cơ Sở Dữ Liệu (Supabase / PostgreSQL)

Để thiết lập cơ sở dữ liệu mẫu, hãy đăng nhập vào trang quản trị Supabase, truy cập **SQL Editor** và chạy các file SQL trong thư mục `database/` theo đúng trình tự sau:

1. `database/reset_demo_schema.sql` *(Xóa toàn bộ schema `public` hiện tại để làm sạch dữ liệu).*
2. `database/schema.sql` *(Tạo cấu trúc bảng, RLS rules, triggers).*
3. `database/member_payment_verification_upgrade.sql` *(Tạo bucket và RPC duyệt thanh toán).*
4. `database/seed.sql` *(Đổ dữ liệu mẫu đầy đủ).*
5. `database/demo_payment_checkout_upgrade.sql` *(Tạo RPC xử lý thanh toán demo).*
6. `database/verify_demo_setup.sql` *(Kiểm tra toàn bộ cấu trúc DB hoạt động đúng).*

> ⚠️ **Lưu ý:** Không chạy file `employee_schedules_weekly_upgrade.sql` trên cơ sở dữ liệu mới vì cấu trúc này đã có sẵn trong file `schema.sql` chính.

---

## 🧪 Hệ Thống Kiểm Thử (Testing)

Dự án tích hợp đầy đủ các bài test từ Unit Test đến End-to-End (E2E):

* **Test Backend:**
  ```bash
  npm run test:backend
  ```
* **Test Dịch Vụ Giọng Nói (Speech Service):**
  ```bash
  npm run test:speech
  ```
* **Test Frontend (Unit & Integration):**
  ```bash
  npm --prefix frontend run test
  ```
* **Test End-to-End (Playwright):**
  ```bash
  # Chạy test E2E không đầu (headless)
  npm --prefix frontend run test:e2e
  
  # Chạy test E2E với giao diện trực quan (UI Mode)
  npm --prefix frontend run test:e2e:ui
  ```

---

## 👥 Tài Khoản Demo Hệ Thống

Để thuận tiện cho việc đánh giá các tính năng portal phân quyền, hệ thống đã cài sẵn các tài khoản demo sau:

| Vai Trò | Email Đăng Nhập | Tên Tài Khoản | Mật Khẩu |
| :--- | :--- | :--- | :--- |
| **Admin / Owner** | `admin@gymster.local` | `admin01` | `Admin@123` |
| **Nhân Viên (Staff)** | `staff@gymster.local` | `staff00` | `Staff@123` |
| **Huấn Luyện Viên (PT)** | `trainer@gymster.local` | `trainer00` | `Trainer@123` |
| **Hội Viên (Member)** | `member@gymster.local` | `member00` | `Member@123` |

---

## 🌐 Deploy Lên Production (Vercel)

Dự án hỗ trợ deploy toàn bộ (cả Frontend và Serverless API) trực tiếp lên Vercel từ **thư mục gốc**:

1. Tạo một dự án mới trên Vercel liên kết với Repository này.
2. Thiết lập cấu hình dự án trên Vercel:
   * **Root Directory:** Thư mục gốc dự án (Repository Root).
   * **Build Command:** `npm run build`
   * **Output Directory:** `frontend/dist`
3. Thêm các biến môi trường cần thiết vào Vercel (đặc biệt là các key kết nối Supabase và API Key Claude: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`).

---

## ✍️ Quy Ước Phát Triển Cho Lập Trình Viên

* **Design System:** Tuân thủ chặt chẽ tông màu chủ đạo **Đỏ đậm/Đen (Dark Red/Black)** mang phong cách thể thao, cao cấp. Tránh đưa các màu mặc định như xanh nước biển, tím vào UI.
* **Giao Tiếp Dữ Liệu:** Tập trung toàn bộ logic lấy và cập nhật dữ liệu vào thư mục `frontend/src/services`. Hạn chế tối đa việc gọi trực tiếp client Supabase bên trong các component UI.
* **Nội dung hiển thị:** Các chữ hiển thị mặc định trên giao diện là tiếng Anh (trừ khi có yêu cầu cụ thể hiển thị tiếng Việt).
* **Đồng bộ hóa:** Luôn kiểm tra tính tương thích trên thiết bị di động (Responsive) khi thay đổi layout các portal.
