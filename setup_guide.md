# Hướng Dẫn Sử Dụng, Cài Đặt và Kiểm Thử Hệ Thống Gymster

Tài liệu này hướng dẫn chi tiết các bước tải xuống, cấu hình môi trường, cài đặt cơ sở dữ liệu và vận hành hệ thống **Gymster** cho cả hai phần Frontend (FE) và Backend (BE - bao gồm API Server và Speech Service).

---

## 1. Hướng Dẫn Cài Đặt, Cấu Hình và Kiểm Thử Backend (BE)

### 1.1 Tải và Cài đặt Visual Studio Code (VS Code)
1.  Truy cập trang web chính thức của VS Code: [https://code.visualstudio.com/download](https://code.visualstudio.com/download)
2.  Chọn phiên bản hệ điều hành phù hợp với máy tính của bạn (Windows, macOS hoặc Linux) để tải về.
3.  Sau khi tải xong, khởi chạy file cài đặt (ví dụ: `VSCodeSetup.exe` trên Windows) và thực hiện theo các bước mặc định để hoàn tất cài đặt.

### 1.2 Thiết Lập Cơ Sở Dữ Liệu Supabase (Thay thế MongoDB)
Dự án Gymster sử dụng dịch vụ đám mây **Supabase (PostgreSQL)** thay thế cho cơ sở dữ liệu MongoDB để quản lý dữ liệu hiệu quả và bảo mật hơn.
1.  Truy cập vào trang chủ Supabase: [https://supabase.com](https://supabase.com) và đăng nhập bằng tài khoản GitHub của bạn.
2.  Tạo một Project mới, đặt tên dự án là `Gymster` và thiết lập mật khẩu cơ sở dữ liệu.
3.  Chờ dự án khởi tạo xong, truy cập vào phần **SQL Editor** trong thanh menu bên trái của Supabase Dashboard.
4.  Để tạo cấu trúc dữ liệu demo, lần lượt sao chép nội dung các file SQL trong thư mục `database/` của dự án và chạy (Run) theo trình tự sau:
    1.  `reset_demo_schema.sql` (Làm sạch schema)
    2.  `schema.sql` (Tạo bảng, RLS, Trigger)
    3.  `member_payment_verification_upgrade.sql` (Tải lên bucket & RPC kiểm duyệt thanh toán)
    4.  `seed.sql` (Đổ dữ liệu demo)
    5.  `demo_payment_checkout_upgrade.sql` (Tích hợp thanh toán demo)
    6.  `verify_demo_setup.sql` (Kiểm tra xem hệ thống DB đã sẵn sàng chưa)
5.  Truy cập vào mục **Project Settings** -> **API** để lấy hai thông số:
    *   **Project URL** (Địa chỉ kết nối cơ sở dữ liệu)
    *   **service_role** API Key (Khóa bảo mật có toàn quyền thực thi, lưu ý: giữ bí mật khóa này).

### 1.3 Thiết Lập Môi Trường Backend (Environment)
1.  Đảm bảo máy tính của bạn đã được cài đặt **Node.js** (Phiên bản 18 trở lên). Tải về tại: [https://nodejs.org](https://nodejs.org).
2.  Tại thư mục `backend/` của dự án, tạo file `.env` từ file `.env.example` và điền đầy đủ các thông số sau:

```env
# Kết nối Supabase
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cấu hình AI Assistant (Claude API)
ANTHROPIC_API_KEY=your_claude_api_key_here

# (Tùy chọn) Cấu hình SMTP gửi mã xác nhận/quên mật khẩu qua Email
AUTH_CODE_SECRET=change_this_to_a_long_random_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM="Gymster <no-reply@gymster.vn>"
```

### 1.4 Khởi Chạy Backend API Server
Mở terminal/CMD tại thư mục gốc của dự án và thực hiện các lệnh sau:
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt thư viện phụ thuộc
npm install

# Khởi chạy server ở chế độ phát triển
npm run dev
```
Khi đó, Backend API Server sẽ được khởi chạy trên cổng **3001** (`http://localhost:3001`).

### 1.5 Cấu Hình và Khởi Chạy Speech-to-Text Service (FastAPI)
Dịch vụ giọng nói AI được viết bằng Python FastAPI sử dụng model `FunASR SenseVoiceSmall`.
1.  Yêu cầu máy tính cài đặt sẵn **Python** (Phiên bản 3.9 trở lên).
2.  Di chuyển vào thư mục `speech_service/`, tạo môi trường ảo Python và cài đặt các thư viện cần thiết:
    ```bash
    cd speech_service
    python -m venv .venv
    
    # Kích hoạt môi trường ảo trên Windows (PowerShell):
    .\.venv\Scripts\Activate.ps1
    # Hoặc kích hoạt trên macOS/Linux:
    source .venv/bin/activate

    # Cài đặt thư viện phụ thuộc
    pip install -r requirements.txt
    ```
3.  Trở lại thư mục gốc của dự án, chạy lệnh khởi tạo dịch vụ giọng nói:
    ```bash
    npm run dev:speech
    ```
    Dịch vụ sẽ khởi động tại địa chỉ `http://127.0.0.1:8000`.

---

## 2. Hướng Dẫn Cài Đặt, Cấu Hình và Kiểm Thử Frontend (FE)

### 2.1 Tải và Cài đặt Node.js
1.  Vào trang chủ Node.js: [https://nodejs.org](https://nodejs.org) để tải về bộ cài đặt phiên bản LTS mới nhất (khuyên dùng bản 18 hoặc 20).
2.  Sau khi tải xong, chạy file cài đặt `.msi` (trên Windows) hoặc `.pkg` (trên macOS) để tiến hành cài đặt.

### 2.2 Tạo Fork từ GitHub
1.  Truy cập vào kho lưu trữ mã nguồn dự án trên GitHub.
2.  Chọn nút **Fork** ở góc trên bên phải để sao chép dự án về tài khoản cá nhân của bạn.
3.  Lấy địa chỉ link HTTPS của repo đã fork (Ví dụ: `https://github.com/username/Gymster.git`).

### 2.3 Clone Mã Nguồn Dự Án Về Máy
Mở VS Code, mở terminal mới và thực hiện lệnh clone:
```bash
git clone https://github.com/username/Gymster.git
cd Gymster
```

### 2.4 Cài Đặt Thư Viện Node Modules
Tại thư mục gốc của dự án, cài đặt dependencies cho cả thư mục gốc và frontend:
```bash
npm install
npm --prefix frontend install
```

### 2.5 Cấu Hình Môi Trường Frontend
Tạo file `.env.local` tại thư mục `frontend/` từ file `.env.example`:
```bash
# macOS/Linux:
cp frontend/.env.example frontend/.env.local
# Windows (PowerShell):
Copy-Item frontend/.env.example frontend/.env.local
```
Mở file `frontend/.env.local` và điền API URL và Publishable Key của dự án Supabase đã tạo ở bước 1.2:
```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
```

### 2.6 Khởi Chạy Frontend
Tại thư mục gốc dự án, chạy lệnh sau:
```bash
npm run dev
```
Ứng dụng frontend React + Vite sẽ chạy trên cổng mặc định là **5173** (`http://localhost:5173`).

---

## 3. Danh Sách Tài Khoản Demo Hệ Thống

Dữ liệu seed mẫu trong file `database/seed.sql` đã thiết lập sẵn các tài khoản tương ứng với các phân hệ phân quyền portal trong Gymster như sau:

| Loại Tài Khoản | Tên Đăng Nhập / Email | Tên Người Dùng | Mật Khẩu Mặc Định |
| :--- | :--- | :--- | :--- |
| **Admin / Owner** | `admin@gymster.local` | `admin01` | `Admin@123` |
| **Nhân Viên (Staff)** | `staff@gymster.local` | `staff00` | `Staff@123` |
| **Huấn Luyện Viên (PT)** | `trainer@gymster.local` | `trainer00` | `Trainer@123` |
| **Hội Viên (Member)** | `member@gymster.local` | `member00` | `Member@123` |

---

## 4. Quy Trình Chạy Bộ Kiểm Thử (Testing)

Dự án tích hợp đầy đủ các bài test để kiểm tra mã nguồn tự động:

*   **Chạy kiểm thử cho Backend:**
    ```bash
    npm run test:backend
    ```
*   **Chạy kiểm thử cho Dịch Vụ Giọng Nói (Speech Service):**
    ```bash
    npm run test:speech
    ```
*   **Chạy kiểm thử Frontend (Vitest):**
    ```bash
    npm --prefix frontend run test
    ```
*   **Chạy kiểm thử End-to-End (Playwright):**
    ```bash
    npm --prefix frontend run test:e2e
    ```
