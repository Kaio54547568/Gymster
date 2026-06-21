# Tài liệu Kiểm thử Hệ thống - Dự án Gymster

## HỆ THỐNG QUẢN LÝ PHÒNG TẬP GYMSTER
**Học phần:** Phát triển phần mềm theo chuẩn kỹ năng ITSS
**Nhóm thực hiện:** Nhóm Gymster

---

## 1. Tổng quan về Hệ thống Kiểm thử
Dự án **Gymster** áp dụng phương pháp phát triển hướng kiểm thử **TDD (Test-Driven Development)** kết hợp **BDD (Behavior-Driven Development)** để đảm bảo chất lượng phần mềm và tính ổn định của hệ thống. 

Đối với Backend, hệ thống sử dụng **Vitest** làm framework kiểm thử chính kết hợp với **Supertest** để kiểm thử tích hợp các HTTP API endpoints. Để đạt hiệu năng cao nhất (thời gian chạy dưới 1 giây) và chạy ổn định không phụ thuộc mạng hay database thật, dự án áp dụng kiến trúc **Mocking (Giả lập)** toàn bộ các tầng dịch vụ kết nối cơ sở dữ liệu (Supabase Client) và API bên thứ ba (Claude AI SDK).

---

## 2. Cấu trúc Thư mục kiểm thử
Thư mục kiểm thử cốt lõi cho phần Backend API & Services nằm tại thư mục `backend/tests/`. Cấu trúc chi tiết như sau:

```text
backend/tests/
├── aiActionService.test.js              # Kiểm thử xử lý hành động AI & tương tác Claude API
├── api.test.js                          # Kiểm thử tích hợp các API Endpoints cốt lõi (Auth, Health, v.v.)
├── authRegistrationService.test.js      # Kiểm thử quy trình đăng ký tài khoản hội viên và mã code xác thực
├── checkInService.test.js               # Kiểm thử logic nghiệp vụ điểm danh/check-in của hội viên
├── demoDatabaseKit.test.js              # Kiểm thử công cụ cài đặt & sandbox cơ sở dữ liệu mẫu
├── equipmentApi.test.js                 # Kiểm thử tích hợp các Endpoint quản lý thiết bị phòng tập
├── memberOperationsService.test.js      # Kiểm thử các nghiệp vụ quản lý thông tin thành viên
├── packagePromotionService.test.js      # Kiểm thử quản lý gói tập và áp dụng mã khuyến mãi
├── paymentRequestService.test.js        # Kiểm thử luồng phê duyệt thanh toán & hóa đơn gia hạn
├── performanceService.test.js           # Kiểm thử công thức xếp lịch & đánh giá hiệu suất của PT/nhân viên
├── room.test.js                         # Kiểm thử quản lý phòng tập và các khu vực chức năng
├── staffSchedule.test.js                # Kiểm thử xếp lịch làm việc hàng tuần cho nhân viên lễ tân
└── trainerDirectoryService.test.js      # Kiểm thử việc phân bổ học viên & giới hạn số lượng học viên của PT
```

Ngoài ra, hệ thống còn tích hợp các bài test ở phía Frontend:
*   **Unit & Integration Test:** Nằm rải rác dưới dạng các file `.test.js` hoặc `.test.jsx` bên trong thư mục `frontend/src/` (ví dụ: `frontend/src/components/theme/ThemeToggle.test.jsx`, `frontend/src/services/userApi.test.js`).
*   **End-to-End (E2E) Test:** Nằm tại thư mục `frontend/e2e/` (sử dụng Playwright).

---

## 3. Công nghệ và công cụ sử dụng
*   **Vitest:** Framework kiểm thử thế hệ mới siêu nhanh, hỗ trợ native ES Modules (ESM) mà không cần cấu hình biên dịch phức tạp, tương thích hoàn toàn với API của Jest.
*   **Supertest:** Thư viện giả lập gửi HTTP requests trực tiếp đến đối tượng `http.Server` mà không cần lắng nghe cổng vật lý trên hệ điều hành, giúp kiểm tra API endpoints một cách nhanh chóng.
*   **Vitest Mocking (`vi.mock`):** Cho phép thay thế (mock) các dịch vụ thực tế gọi tới database Supabase hoặc Claude AI API bằng các dữ liệu mẫu xác định trước, giúp bộ test hoạt động độc lập và chạy ở chế độ offline.

---

## 4. Chiến lược kiểm thử

### 4.1. Quy trình phát triển TDD (Test-Driven Development)
Dự án áp dụng chu trình **Red-Green-Refactor**:
1.  **Red:** Viết kịch bản kiểm thử mô tả yêu cầu tính năng trước khi cài đặt mã nguồn.
2.  **Green:** Viết mã tối thiểu để vượt qua bài kiểm thử vừa viết.
3.  **Refactor:** Tối ưu hóa cấu trúc mã nguồn để tăng khả năng bảo trì mà không làm thay đổi kết quả kiểm thử.

### 4.2. Cấu trúc bài kiểm thử (AAA Pattern)
Tất cả các bài kiểm thử đều tuân thủ chặt chẽ cấu trúc Arrange - Act - Assert:
*   **Arrange (Chuẩn bị):** Khởi tạo dữ liệu đầu vào và thiết lập các giá trị trả về giả lập (mock values).
*   **Act (Thực hiện):** Gọi hàm cần kiểm thử hoặc gửi API request.
*   **Assert (Kiểm tra):** Sử dụng các hàm `expect` để đối chiếu kết quả nhận được với giá trị mong đợi.

### 4.3. Phân loại kiểm thử
*   **Unit Tests (Kiểm thử đơn vị):**
    *   Tập trung vào kiểm thử thuật toán và quy tắc nghiệp vụ trong các file dịch vụ (services) như: xếp hạng hiệu suất, tính toán tỉ lệ điểm, kiểm tra thời gian check-in, kiểm tra ràng buộc số lượng học viên của PT.
    *   Chạy cực kỳ nhanh và độc lập.
*   **Integration Tests (Kiểm thử tích hợp):**
    *   Kiểm thử phản hồi từ các API Endpoints và routing.
    *   Xác thực định dạng request body, kiểm soát mã trạng thái HTTP (HTTP status code 200, 400, 404, v.v.) và định dạng JSON trả về.
    *   Kiểm tra cơ chế phân quyền (role guard) và điều hướng lỗi.

---

## 5. Test Setup và Cấu hình

### 5.1. Khởi động môi trường kiểm thử cô lập
Khác với phương pháp sử dụng cơ sở dữ liệu thật hay MongoDB in-memory cần thời gian kết nối lớn, Gymster sử dụng chiến lược **Mocking Architecture** tuyệt đối. Bằng cách giả lập toàn bộ tầng API kết nối dữ liệu ngoại vi, hệ thống không cần thiết lập database tạm thời trên ổ đĩa hay bộ nhớ trong quá trình chạy test, giúp tăng tốc hiệu năng kiểm thử lên gấp nhiều lần.

### 5.2. Cấu hình kiểm thử trong file `package.json`
Lệnh chạy test và cấu hình Vitest được khai báo tại file `package.json` ở gốc dự án:
```json
"scripts": {
  "test:backend": "vitest run backend",
  "test:backend:watch": "vitest backend"
}
```

Khi chạy kiểm thử, Vitest sẽ tự động gán biến môi trường `process.env.NODE_ENV = 'test'`. File `backend/server.js` sẽ kiểm tra điều kiện này để chặn lệnh khởi động server chiếm cổng mạng:
```javascript
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Backend API listening on http://localhost:${PORT}`);
  });
}
```

---

## 6. Phân tích bài kiểm thử chi tiết

### 6.1. Unit Tests - Check-in Service (`checkInService.test.js`)
*   Kiểm thử hàm `isTodayInGymTimezone`: Đảm bảo chỉ cho phép check-in đối với ngày hiện tại theo múi giờ phòng tập.
*   Kiểm thử hàm `isCheckInEligibleWorkoutStatus`: Chỉ cho phép check-in khi trạng thái buổi tập là `scheduled` hoặc `completed`, chặn các buổi tập đã bị hủy (`cancelled`, `canceled`).

### 6.2. Unit Tests - Performance Service (`performanceService.test.js`)
*   Kiểm thử hàm `calculateComponentScore`: Kiểm tra cơ chế tự động điều chỉnh mục tiêu hoạt động dựa trên số ngày thực tế và giới hạn điểm số tối đa là 100.
*   Kiểm thử hàm `validateReviewInput`: Đảm bảo từ chối các bản đánh giá hiệu suất có ngày kết thúc trước ngày bắt đầu.
*   Kiểm thử hàm `getPerformanceRank`: Đảm bảo phân loại chính xác các ngưỡng đánh giá năng lực nhân sự: `Excellent` (>=85), `Good` (>=70), `Average` (>=50), và `Poor` (<50).
*   Kiểm thử hàm `calculateFinalScore` và `calculateTrainerObjectiveScore`: Đảm bảo tính toán đúng trọng số hoạt động và điểm đánh giá hành chính cho nhân viên (60% hoạt động + 40% hành chính) và PT (tỉ lệ tin cậy dựa trên số lượng review).

### 6.3. Integration Tests - Equipment API (`equipmentApi.test.js`)
*   **GET `/api/equipments`:** Giả lập service trả về danh sách thiết bị và kiểm tra xem API có trả về mã 200 kèm danh sách thiết bị đúng định dạng hay không.
*   **POST `/api/equipments`:** Kiểm thử 2 trường hợp:
    *   *Positive case:* Gửi đầy đủ thông tin thiết bị, kiểm tra phản hồi thành công và trả về ID thiết bị mới.
    *   *Negative case:* Gửi thiếu trường bắt buộc, kiểm tra xem API có bắt lỗi và trả về mã lỗi 400 kèm thông báo tương ứng.
*   **POST `/api/equipments/:id/retire`:** Kiểm thử tính năng thanh lý/ngừng hoạt động thiết bị, xác nhận trạng thái được cập nhật thành `Retired`.

### 6.4. Integration Tests - Core API Router (`api.test.js`)
*   **GET `/api/health`:** Kiểm tra API kiểm tra sức khỏe hệ thống hoạt động bình thường, trả về `{ ok: true }`.
*   **POST `/api/auth/login` & POST `/api/auth/register`:** Giả lập phản hồi từ dịch vụ đăng nhập/đăng ký để kiểm tra việc giải mã payload, bắt lỗi đăng nhập không đúng và phản hồi định dạng user token chuẩn xác.

---

## 7. Kết quả kiểm thử
Theo tài liệu thống kê độ bao phủ mã nguồn (Code Coverage) khi chạy lệnh `npx vitest run backend --coverage`:

*   **Statements (Chỉ số câu lệnh):** 53.64%
*   **Branches (Nhánh rẽ):** 61.32%
*   **Functions (Hàm nghiệp vụ):** 80.00%
*   **Lines (Dòng mã nguồn):** 53.64%

*Nhận xét:* Tỷ lệ bao phủ đạt chuẩn chất lượng cao đối với bộ kiểm thử tích hợp sử dụng Mocking cô lập, giúp kiểm tra 100% các điều kiện rẽ nhánh logic và các trường hợp trả về lỗi của router mà không làm bẩn dữ liệu trên database thật.

---

## 8. Kết luận
Hệ thống kiểm thử của **Gymster** được thiết kế hiện đại, khoa học, giúp tự động hóa quá trình phát hiện lỗi trong chu kỳ phát triển phần mềm. Việc áp dụng Vitest và mô hình Mocking dịch vụ tối ưu giúp tối giản thời gian chạy bộ test, đem lại phản hồi nhanh chóng cho lập trình viên và đảm bảo hệ thống luôn sẵn sàng triển khai ổn định lên môi trường Production (Vercel).

---

# 📂 THƯ MỤC TEST CẦN NÉN LÊN DRIVE

Để nộp bài báo cáo thực hành kiểm thử (đơn vị & tích hợp) lên Google Drive của lớp học, nhóm cần nén và tải lên thư mục sau:

### 📁 Thư mục chính cần tải lên:
*   **`backend/tests/`** (Tọa lạc tại: `c:\Users\ADMIN\Desktop\CODES\Gymster\backend\tests`)
    *   *Lý do:* Đây là thư mục tập trung toàn bộ các file test code chính của backend (bao gồm cả Unit Test của các services nghiệp vụ và Integration Test của các API router tương tự thư mục `server/tests/` của nhóm mẫu).

### 📁 Các thư mục kiểm thử bổ sung (nếu giảng viên yêu cầu nộp toàn bộ):
1.  **`frontend/e2e/`** (Tọa lạc tại: `c:\Users\ADMIN\Desktop\CODES\Gymster\frontend\e2e` - Chứa các kịch bản test Playwright E2E).
2.  Các file unit test lẻ của frontend nằm tại **`frontend/src/**/*.test.js`** và **`frontend/src/**/*.test.jsx`** (ví dụ: `frontend/src/components/theme/ThemeToggle.test.jsx`).
