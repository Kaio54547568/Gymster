# Tài liệu Kiểm thử End-to-End (E2E) với Playwright

Tài liệu này hướng dẫn chi tiết cách cấu hình, viết kịch bản và thực thi kiểm thử toàn trình (**End-to-End - E2E**) bằng **Playwright** cho phần **Frontend** của dự án **Gymster**.

---

## 1. Tổng quan kiểm thử E2E với Playwright

Kiểm thử E2E (End-to-End) mô phỏng chính xác cách thức người dùng cuối thao tác trên ứng dụng của bạn. Playwright sẽ:
1.  Tự động kích hoạt Web Server cục bộ (Vite).
2.  Khởi chạy trình duyệt thật (nhân Chromium) ở chế độ ẩn (headless).
3.  Truy cập vào các liên kết, kiểm tra giao diện hiển thị, click chuột, nhập liệu và đưa ra khẳng định kết quả.

---

## 2. Các thay đổi và thiết lập

1.  **Cài đặt các gói phụ thuộc (devDependencies)**:
    Đã thêm `@playwright/test` vào [frontend/package.json](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/package.json).
2.  **Tải trình duyệt Chromium**:
    Đã cài đặt Chromium của Playwright qua terminal để thực hiện chạy test.
3.  **Cấu hình Playwright**:
    Tạo file cấu hình [frontend/playwright.config.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/playwright.config.js) để:
    *   Đặt thư mục test là `./e2e`.
    *   Liên kết với URL mặc định `http://localhost:5173`.
    *   Tự động chạy `npm run dev` để dựng môi trường phát triển Vite trước khi chạy test và tự động tắt nó sau khi test xong.
4.  **Thêm các script chạy nhanh**:
    Bổ sung lệnh chạy trong [frontend/package.json](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/package.json):
    *   `npm --prefix frontend run test:e2e`: Chạy kiểm thử ẩn danh (chạy ngầm nhanh chóng trên terminal).
    *   `npm --prefix frontend run test:e2e:ui`: Mở giao diện tương tác trực quan của Playwright để xem và debug từng hành động click chuột, timeline lịch sử chạy test.

---

## 3. Cách chạy kiểm thử E2E

### Cách 1: Chạy ngầm nhanh (Headless Mode)
Tại gốc thư mục của dự án (Gymster), chạy lệnh sau:
```bash
npm --prefix frontend run test:e2e
```

Kết quả hiển thị thành công:
```bash
Running 2 tests using 2 workers
  2 passed (6.6s)
```

### Cách 2: Chạy trực quan giao diện (Playwright UI Mode)
Lệnh này cực kỳ hữu ích khi phát triển test case mới, cho phép bạn xem phim quay chậm hành vi test:
```bash
npm --prefix frontend run test:e2e:ui
```

---

## 4. Chi tiết các Test Case đã viết

Mã nguồn kiểm thử E2E mẫu nằm tại [frontend/e2e/basic.spec.js](file:///c:/Users/ADMIN/Desktop/CODES/Gymster/frontend/e2e/basic.spec.js).

### A. Kiểm tra tiêu đề trang
```javascript
import { test, expect } from "@playwright/test";

test("has title containing Gymster", async ({ page }) => {
  // 1. Truy cập vào trang chủ
  await page.goto("/");
  
  // 2. Xác minh tiêu đề trang web chứa từ khóa "Gymster"
  await expect(page).toHaveTitle(/Gymster/);
});
```

### B. Kiểm tra thành phần giao diện được render
```javascript
test("renders main layout container", async ({ page }) => {
  // 1. Truy cập vào trang chủ
  await page.goto("/");
  
  // 2. Xác minh thẻ có id="root" hiển thị trên màn hình
  const root = page.locator("#root");
  await expect(root).toBeVisible();
});
```
