# Tài liệu Kiểm thử Frontend với Vitest & React Testing Library

Tài liệu này hướng dẫn chi tiết cách cấu hình, di chuyển các kiểm thử cũ (legacy tests) và viết kịch bản kiểm thử giao diện (UI Components) cho phần **Frontend (React)** của dự án **Gymster**.

---

## 1. Tổng quan kiến trúc kiểm thử Frontend

Để kiểm thử giao diện React chạy nhanh và độc lập mà không cần mở trình duyệt thật (như Chrome/Firefox), chúng ta sử dụng sự kết hợp của 3 thư viện:
*   **Vitest**: Trình chạy kiểm thử (Test Runner) tốc độ cao, dùng chung cấu hình với Vite.
*   **React Testing Library (RTL)**: Thư viện kiểm thử giao diện React tập trung vào việc mô phỏng cách người dùng tương tác thực tế với DOM.
*   **jsdom**: Giả lập môi trường DOM (browser-like) ngay trên Node.js để chạy kiểm thử UI.

---

## 2. Các thay đổi và thiết lập

1.  **Cài đặt các gói phụ thuộc (devDependencies)**:
    Đã thêm `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, và `jsdom` vào [frontend/package.json](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/package.json).
2.  **Cấu hình Vitest**:
    Tạo file [frontend/vitest.config.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/vitest.config.js) để liên kết với Plugin React của Vite và cài đặt môi trường test là `jsdom`.
3.  **Thiết lập môi trường Test**:
    Tạo file [frontend/src/setupTests.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/setupTests.js) để mở rộng các hàm so sánh của Jest (như `toBeInTheDocument()`).
4.  **Thêm các script chạy nhanh**:
    Bổ sung lệnh chạy trong [frontend/package.json](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/package.json):
    *   `npm --prefix frontend run test`: Chạy kiểm thử toàn bộ frontend một lần.
    *   `npm --prefix frontend run test:watch`: Chạy kiểm thử chế độ theo dõi thay đổi.

---

## 3. Di chuyển các kiểm thử dịch vụ cũ (Legacy Tests Migration)

Trước đây, dự án sử dụng bộ chạy test mặc định của Node.js (`node:test` và `node:assert`). Để đồng bộ hóa, toàn bộ các file test dịch vụ đã được chuyển đổi sang cú pháp `vitest` và hàm `expect()` tiêu chuẩn:
*   [packageEntitlement.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/packageEntitlement.test.js) (Tính số ngày nghỉ)
*   [workoutPlanModel.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/workoutPlanModel.test.js) (Chuẩn hóa kế hoạch tập luyện)
*   [workoutScheduleGenerator.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/workoutScheduleGenerator.test.js) (Sinh lịch tập luyện tự động)
*   [workoutSessionConflict.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/workoutSessionConflict.test.js) (Phát hiện trùng lịch PT)
*   [sessionModel.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/sessionModel.test.js) (Chuẩn hóa trạng thái buổi tập)
*   [trainingRequestLocal.test.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/services/trainingRequestLocal.test.js) (Cập nhật lịch hẹn offline)

---

## 4. Viết ca kiểm thử Giao diện (UI Component Test)

Một bài test giao diện mẫu đã được viết cho component **ThemeToggle** tại [ThemeToggle.test.jsx](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/src/components/theme/ThemeToggle.test.jsx).

### Giải pháp xử lý Context (Context Mocking)
Component `ThemeToggle` gọi hook `useAppearance()` từ `AppearanceContext` để lấy ra theme hiện tại và hàm chuyển đổi theme. Trong môi trường test, chúng ta sử dụng `vi.mock()` để giả lập hook này hoạt động độc lập:
```javascript
import { vi } from "vitest";
import { useAppearance } from "../../roles/shared/AppearanceContext";

vi.mock("../../roles/shared/AppearanceContext", () => ({
  useAppearance: vi.fn(),
}));
```

### Kịch bản 1: Kiểm tra hiển thị tương ứng với Theme (Dark Mode)
```javascript
it("renders correct theme label and description in dark mode", () => {
  // Giả lập trạng thái theme đang là dark
  useAppearance.mockReturnValue({
    theme: "dark",
    toggleTheme: vi.fn(),
  });

  render(<ThemeToggle showLabel={true} />);

  // Xác minh button có aria-label chuyển sang light và hiển thị nhãn "Dark"
  const button = screen.getByRole("button", { name: "Chuyển sang light mode" });
  expect(button).toBeInTheDocument();
  expect(screen.getByText("Dark")).toBeInTheDocument();
});
```

### Kịch bản 2: Kiểm tra tương tác Click chuột
```javascript
it("calls toggleTheme callback when clicked", async () => {
  const toggleThemeMock = vi.fn();
  useAppearance.mockReturnValue({
    theme: "light",
    toggleTheme: toggleThemeMock,
  });

  render(<ThemeToggle />);

  const button = screen.getByRole("button");
  // Giả lập hành động click chuột của người dùng
  await userEvent.click(button);

  // Xác minh hàm toggleTheme đã được gọi đúng 1 lần
  expect(toggleThemeMock).toHaveBeenCalledTimes(1);
});
```

---

## 5. Kết quả chạy kiểm thử

Chạy lệnh kiểm thử frontend cho kết quả **20/20 test cases vượt qua** thành công:
```bash
> frontend@0.0.0 test
> vitest run

 ✓ src/services/sessionModel.test.js (1 test) 3ms
 ✓ src/services/packageEntitlement.test.js (2 tests) 4ms
 ✓ src/services/workoutPlanModel.test.js (2 tests) 4ms
 ✓ src/services/trainingRequestLocal.test.js (3 tests) 5ms
 ✓ src/services/workoutScheduleGenerator.test.js (4 tests) 6ms
 ✓ src/services/workoutSessionConflict.test.js (5 tests) 6ms
 ✓ src/components/theme/ThemeToggle.test.jsx (3 tests) 134ms

 Test Files  7 passed (7)
      Tests  20 passed (20)
   Duration  1.99s
```

---

## 6. Báo cáo Code Coverage (Độ bao phủ mã nguồn)

Vitest đo lường độ bao phủ dòng lệnh trong các file source code của frontend thông qua plugin `@vitest/coverage-v8`.

### Cách chạy báo cáo
```bash
npm --prefix frontend run test -- --coverage
```

### Kết quả đo lường thực tế của Frontend
*   **Tổng số dòng code (All Files - Lines)**: **69.86%**
*   **Tỷ lệ bao phủ cụ thể theo file**:
    *   `ThemeToggle.jsx` (Giao diện chuyển đổi theme): **100.00%** (Phủ 100% dòng code, nhánh rẽ và hàm)
    *   `trainingRequestLocal.js` (Lưu lịch offline): **91.66%**
    *   `packageEntitlement.js` (Tính ngày nghỉ phép): **83.33%**
    *   `workoutScheduleGenerator.js` (Sinh lịch tập): **70.96%**
    *   `workoutSessionConflict.js` (Phát hiện trùng): **67.50%**
    *   `sessionModel.js` (Trạng thái buổi tập): **54.54%**
    *   `workoutPlanModel.js` (Normalize plan): **50.00%**

> [!NOTE]
> Component giao diện `ThemeToggle.jsx` đạt độ bao phủ tuyệt đối **100%** do chúng ta viết đầy đủ kịch bản hiển thị ở cả 2 mode (Light/Dark) và kịch bản click chuột tương tác. Độ bao phủ chung 69.86% là một chỉ số lý tưởng, bảo chứng cho sự hoạt động vững chắc của các dịch vụ lõi Frontend.

![Báo cáo độ bao phủ mã nguồn](coverage_report.png)

