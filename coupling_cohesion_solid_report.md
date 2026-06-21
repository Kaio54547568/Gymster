# Tài liệu Đánh giá Coupling, Cohesion và SOLID

## HỆ THỐNG QUẢN LÝ PHÒNG TẬP GYMSTER
**Học phần:** Phát triển phần mềm theo chuẩn kỹ năng ITSS
**Nhóm thực hiện:** Nhóm 10

---

# I. Coupling & Cohesion

## 1. Giới thiệu chung về Coupling & Cohesion

*   **Cohesion (Tính kết dính):** Là mức độ các thành phần bên trong một module, component hoặc service cùng phục vụ một mục tiêu duy nhất. Cohesion càng cao thì mã nguồn càng dễ hiểu, dễ kiểm thử và dễ bảo trì.
*   **Coupling (Tính liên kết/phụ thuộc):** Là mức độ một module phụ thuộc vào các module khác. Coupling càng thấp (lỏng lẻo) thì khi thay đổi một phần của hệ thống, các phần còn lại càng ít bị ảnh hưởng.

---

## 2. Đánh giá Coupling & Cohesion phía Frontend

### 2.1. Đánh giá Cohesion phía Frontend

#### Ưu điểm:
*   **Phân chia theo Actor:** Các portal được chia rõ ràng theo actor nghiệp vụ: Admin quản trị, Staff vận hành, PT quản lý học viên/lịch tập, Member xem gói tập/lịch tập/đánh giá dịch vụ. Cách chia này giúp mỗi cụm màn hình có mục tiêu rõ ràng.
*   **Tách biệt Layout chung:** Thư mục `frontend/src/roles/shared` chứa các thành phần dùng chung như `RoleShell`, `AccountProfile`, `AccountSettings`, `LanguageContext`, `AppearanceContext`. Đây là cách tách layout/context hợp lý, tránh trộn logic giao diện chung vào từng portal.
*   **Các module tiện ích đơn nhiệm:** Một số module nhỏ có Cohesion cao như: `packageEntitlement.js` chỉ xử lý quy tắc số ngày nghỉ hợp lệ theo gói; `workoutScheduleGenerator.js` chỉ parse và sinh lịch tập; `workoutSessionConflict.js` chỉ kiểm tra xung đột lịch.
*   **Tách biệt logic để test:** Các file unit test tập trung vào những module nghiệp vụ thuần, chứng tỏ nhóm đã tách được một phần logic khỏi UI để kiểm thử độc lập.

#### Nhược điểm:
*   **Màn hình gộp nhiều vai trò (Fat UI):** Một số screen/component hiện đang đảm nhiệm quá nhiều phần việc. Ví dụ, `frontend/src/roles/pt/App.tsx` hiện có dung lượng lớn do tập trung quá nhiều màn hình và logic con trong cùng một file.
*   **Trộn lẫn trách nhiệm hiển thị và xử lý nghiệp vụ:** Một số trang hiện vừa render UI, vừa quản lý state, gọi service, xử lý thông báo/toast và validate form. Khi dự án mở rộng, việc gộp này gây khó khăn cho việc tái sử dụng.
*   **Service kiêm nhiệm nhiều nghiệp vụ:** Một số service bị giảm Cohesion do gộp nhiều loại logic. Ví dụ: `trainingRequestApi.js` vừa thực hiện ánh xạ (map) dữ liệu, vừa truy vấn member/trainer, vừa tạo notification, xử lý local fallback, và cập nhật workout session khi yêu cầu được chấp nhận.
*   **AuthService quá tải:** `authService.js` gộp cả local login, Supabase login, OAuth, session storage, kiểm tra định dạng dữ liệu (validate username/phone/birth date), ánh xạ người dùng và điều hướng role.

#### Đề xuất cải thiện:
*   Tách `pt/App.tsx` thành các module nhỏ: routes, layout, screens, hooks và domain helpers. Mỗi màn hình như `DashboardScreen`, `ScheduleProgressScreen`, `WorkoutGuidanceScreen` nên nằm trong một file riêng.
*   Tách logic gọi API và xử lý hiệu ứng phụ (side-effect) ra custom hook/service. Component UI chỉ nhận props, hiển thị dữ liệu và phát sự kiện người dùng.
*   Tách mapper, validator, notification workflow và repository trong các service lớn. Ví dụ `trainingRequestApi.js` có thể tách thành `trainingRequestRepository.js`, `trainingRequestMapper.js`, `trainingRequestNotificationService.js` và `trainingRequestWorkflowService.js`.
*   Giữ các pure function nghiệp vụ ở file riêng và bổ sung unit test tương tự các file `workoutScheduleGenerator.test.js` hay `workoutPlanModel.test.js`.

#### Ví dụ minh họa (Cohesion):

##### 🔴 Before: Low Cohesion (Gộp tất cả trong file UI)
```tsx
import { supabase } from "../../../services/supabaseClient";

// 1. Tiện ích định dạng (Helpers) đặt chung trong file UI
function formatVnd(amount: number) {
  return `${Number(amount || 0).toLocaleString('vi-VN')} VND`;
}

// 2. Gọi trực tiếp Supabase Database ngay trong file UI
async function fetchMembersFromSupabase() {
  const { data } = await supabase
    .from('members')
    .select('member_id, users(first_name)');
  return data;
}

export function RenewPackageUI() {
  // 3. Logic state và render UI ở dưới...
  return (
    <div>
      {/* UI Elements */}
    </div>
  );
}
```

##### 🟢 After: High Cohesion (Tách thành các lớp riêng biệt)
*   **`helpers/format.ts` (Chỉ đảm nhiệm định dạng dữ liệu):**
    ```typescript
    export const formatVnd = (amount: number) =>
      `${Number(amount || 0).toLocaleString('vi-VN')} VND`;
    ```
*   **`services/memberApi.ts` (Chỉ đảm nhiệm truy cập dữ liệu/API):**
    ```typescript
    import { supabase } from "./supabaseClient";

    export async function getMembersForRenewal() {
      const { data } = await supabase
        .from('members')
        .select('member_id, users(first_name)');
      return data || [];
    }
    ```
*   **`components/RenewPackageUI.tsx` (Chỉ tập trung xử lý giao diện):**
    ```tsx
    import React, { useEffect, useState } from "react";
    import { formatVnd } from "@/helpers/format";
    import { getMembersForRenewal } from "@/services/memberApi";

    export function RenewPackageUI() {
      const [members, setMembers] = useState([]);

      useEffect(() => {
        getMembersForRenewal().then(setMembers);
      }, []);

      return (
        <div>
          {members.map(m => (
            <p key={m.member_id}>{m.users?.first_name} - {formatVnd(1000000)}</p>
          ))}
        </div>
      );
    }
    ```

---

### 2.2. Đánh giá Coupling phía Frontend

#### Ưu điểm:
*   **Cách ly giữa các Portal:** Cấu trúc route guard trong `AppRoutes.jsx` giúp các portal admin/staff/pt/member ít phụ thuộc trực tiếp vào nhau. Người dùng chỉ được đưa vào portal phù hợp theo vai trò (role guard).
*   **Tách biệt tầng Service:** Service layer đóng vai trò trung gian giữa UI và Supabase. Các màn hình gọi hàm nghiệp vụ như `getCurrentMemberPackageForUser`, `updateTrainingRequestStatus` thay vì viết truy vấn Supabase trực tiếp trong component UI.
*   **Sử dụng Shared Component:** Các shared component/context giúp giảm phụ thuộc UI lặp lại giữa nhiều portal như `RoleShell`, `RoleNotificationsPage`, `AccountProfile`, `AccountSettings`.
*   **Cách ly dịch vụ AI bên thứ ba:** Backend AI được tách khỏi client, tránh để lộ Anthropic API key ở phía frontend, giúp giảm coupling giữa client và bên thứ ba.

#### Nhược điểm:
*   **Phụ thuộc trực tiếp vào SDK Supabase:** Nhiều service đang import trực tiếp `supabase` từ `supabaseClient.js`. Nếu sau này chuyển sang REST API/backend riêng hoặc cần mock khi viết test sẽ gặp khó khăn.
*   **Truy cập localStorage phân tán:** `localStorage` hiện được gọi trực tiếp ở nhiều nơi như `AppRoutes.jsx`, `authService.js` và các service fallback mà không có lớp quản lý tập trung.
*   **Trùng lặp mã nguồn UI:** Một số component giao diện trong thư mục của admin, staff, pt có cấu trúc và chức năng rất giống nhau nhưng chưa được gom chung vào thư viện dùng chung.
*   **Ràng buộc logic nghiệp vụ (Workflow coupling):** Một số luồng xử lý như training request, workout session và notification đang có sự ràng buộc khá chặt chẽ trong cùng một file service.

#### Đề xuất cải thiện:
*   **Tạo Repository Pattern cho Supabase:** Service nghiệp vụ sẽ phụ thuộc vào interface repository thay vì phụ thuộc trực tiếp vào supabase singleton.
*   **Chuẩn hóa kiểu trả về (Unified Response):** Đồng nhất cấu trúc dữ liệu trả về từ service, ví dụ: `{ data, error }` cho truy vấn và `{ ok, message, data }` cho lệnh thực thi.
*   **Xây dựng Shared UI Library:** Đưa các component UI trùng lặp lên thư mục `frontend/src/components/ui` hoặc `frontend/src/roles/shared/ui`.
*   **Tách sessionStorageService:** Quản lý truy cập `localStorage` tập trung ở một nơi duy nhất.

#### Ví dụ minh họa (Coupling):

##### 🔴 Before: High Coupling (Phụ thuộc trực tiếp vào SDK và cơ chế lưu trữ)
```tsx
// Ở bất kỳ file UI hay Service nào (ví dụ: authService.js, RenewPackageUI.tsx)
import { supabase } from "./supabaseClient";

// 1. Phụ thuộc trực tiếp vào SDK Supabase và cấu trúc bảng (schema)
const { data } = await supabase
  .from('members')
  .select('member_id, users(first_name, last_name, email)');

// 2. Đọc ghi localStorage thủ công khắp nơi bằng các string key cứng
window.localStorage.setItem(
  'gymster_current_user',
  JSON.stringify(user)
);
```

##### 🟢 After: Low Coupling (Thông qua Adapter & Service tập trung)
*   **`services/sessionStorageService.ts` (Quản lý session tập trung):**
    ```typescript
    export const SessionStorage = {
      getUser: () => JSON.parse(localStorage.getItem('gymster_current_user') || 'null'),
      setUser: (user: any) => localStorage.setItem('gymster_current_user', JSON.stringify(user)),
      clear: () => localStorage.removeItem('gymster_current_user')
    };
    ```
*   **`repositories/memberRepository.ts` (Lớp Adapter che giấu Supabase SDK):**
    ```typescript
    import { supabase } from "../services/supabaseClient";

    export const MemberRepository = {
      async getMembers() {
        const { data, error } = await supabase
          .from('members')
          .select('member_id, users(first_name, last_name, email)');
        
        if (error) throw error;

        // Trả về định dạng DTO chuẩn hóa (camelCase), che giấu cấu trúc DB thật
        return data.map((row: any) => ({
          id: row.member_id,
          name: `${row.users?.first_name} ${row.users?.last_name}`.trim(),
          email: row.users?.email,
        }));
      }
    };
    ```

---

## 3. Đánh giá Coupling & Cohesion phía Backend/Data Layer

### 3.1. Đánh giá Cohesion phía Backend/Data Layer

#### Ưu điểm:
*   **Tách biệt Service:** Các xử lý AI chat, Claude API, xác thực mã đăng ký và training request đã được tách vào `backend/services` thay vì viết toàn bộ trong file cấu hình khởi chạy `server.js`.
*   **Mô hình Proxy/Facade của Vercel API:** Các API route ngắn trong thư mục `api/` đóng vai trò proxy/facade, giúp frontend gọi endpoint đơn giản hơn và chuyển tiếp xử lý về backend dịch vụ.
*   **Tổ chức Database Domain rõ ràng:** Cơ sở dữ liệu được tổ chức theo từng domain nghiệp vụ: `users`, `members`, `trainers`, `packages`, `training_requests`, `workout_sessions`, `payments`, `equipment`, `notifications`... giúp tăng Cohesion của tầng dữ liệu.

#### Nhược điểm:
*   **Server.js đảm nhiệm nhiều vai trò:** File `backend/server.js` hiện vẫn tự xử lý phân luồng route thủ công bằng `if/else`, đọc JSON body, kiểm tra đầu vào thô sơ, gọi service và phản hồi dữ liệu. Khi dự án mở rộng, file này sẽ cực kỳ phức tạp.
*   **Service chứa quá nhiều bước nghiệp vụ:** Một số service như `authRegistrationService.js` và `trainingRequestService.js` đang chứa nhiều bước nghiệp vụ liên tiếp trong cùng một file.
*   **AI Service quá tải nghiệp vụ:** AI service hiện xử lý từ việc nhận diện intent, xử lý ngôn ngữ tự nhiên, phân tích ngày giờ, kiểm tra giờ hoạt động của gym và thực hiện hành động.

#### Đề xuất cải thiện:
*   Tách `server.js` thành các router chuyên biệt: `authRoutes.js`, `aiRoutes.js`, `trainingRequestRoutes.js`.
*   Tạo các middleware xử lý chung: body parser, validate request, error handler.
*   Tách AI Service thành các lớp chuyên biệt: `intentParser`, `entityResolver`, `actionExecutor`, `responseBuilder`.

#### Ví dụ minh họa (Cohesion phía Backend):

##### 🔴 Before: Low Cohesion (Mọi logic từ routing, parsing đến xử lý gộp chung trong server.js)
```javascript
// backend/server.js
import http from "node:http";
import { loginWithPassword } from "./services/authRegistrationService.js";

const server = http.createServer((req, res) => {
  if (req.url === "/api/auth/login" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.identifier || !payload.password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ ok: false, message: "Missing fields" }));
        }
        const result = await loginWithPassword(payload);
        res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, message: "Server Error" }));
      }
    });
  }
});
```

##### 🟢 After: High Cohesion (Tách thành Middleware và Routing riêng biệt)
*   **`backend/middlewares/bodyParser.js`:**
    ```javascript
    export function parseJsonBody(req) {
      return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => { body += chunk; });
        req.on("end", () => {
          try {
            req.body = JSON.parse(body);
            resolve();
          } catch (e) {
            reject(new Error("Invalid JSON"));
          }
        });
      });
    }
    ```
*   **`backend/routes/authRoutes.js`:**
    ```javascript
    import { loginWithPassword } from "../services/authRegistrationService.js";

    export async function handleLogin(req, res) {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, message: "Missing credentials" }));
      }
      const result = await loginWithPassword(req.body);
      res.writeHead(result.ok ? 200 : 400, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    }
    ```

---

### 3.2. Đánh giá Coupling phía Backend/Data Layer

#### Ưu điểm:
*   **Cách ly AI Service:** AI Backend hoạt động độc lập giúp frontend không bị ràng buộc với Claude SDK.
*   **Sơ đồ quan hệ dữ liệu chuẩn hóa:** Schema database được thiết kế chuẩn chỉ, có quan hệ khóa ngoại chặt chẽ, giúp tầng dịch vụ ánh xạ dữ liệu theo domain tương ứng một cách mạch lạc.
*   **Mô hình hóa Helper độc lập:** Các helper thuần túy (pure helpers) ở frontend được test độc lập mà không cần khởi động trình duyệt hay kết nối Supabase.

#### Nhược điểm:
*   **Frontend ràng buộc chặt với Schema DB:** Việc frontend gọi trực tiếp tên bảng và tên cột của Supabase khiến bất kỳ thay đổi nào của cơ sở dữ liệu cũng ảnh hưởng trực tiếp đến UI.
*   **Xử lý chuyển đổi dữ liệu lai (Hybrid logic):** Một số service đang xử lý song song cả logic cơ sở dữ liệu mới và cơ chế fallback dữ liệu cũ (local json) trong cùng một phương thức.
*   **Chưa có cơ chế DI (Dependency Injection):** Hệ thống chưa sử dụng Dependency Injection Container hoặc các interface chính thức, dẫn đến việc khó thay thế hoặc giả lập (mock) repository khi chạy kiểm thử.

#### Đề xuất cải thiện:
*   Tập trung toàn bộ các câu truy vấn Supabase vào tầng Repository. Tầng Service nghiệp vụ chỉ gọi các phương thức Repository qua interface/contract.
*   Đẩy các rule nghiệp vụ quan trọng (kiểm tra thanh toán, check-in phòng tập, đổi lịch) lên backend server hoặc viết thông qua các chính sách RLS/Trigger của Supabase.
*   Tạo adapter cho local fallback để đảm bảo trả về dữ liệu cùng định dạng với Supabase.

---

# II. Nguyên lý SOLID

## 1. Giới thiệu chung về nguyên lý SOLID

*   **S - Single Responsibility Principle (SRP):** Một lớp/module/component chỉ nên có một lý do duy nhất để thay đổi.
*   **O - Open/Closed Principle (OCP):** Module nên mở rộng để phát triển tính năng mới (Open for extension) nhưng hạn chế sửa đổi trực tiếp mã nguồn cũ (Closed for modification).
*   **L - Liskov Substitution Principle (LSP):** Các lớp con phải có khả năng thay thế lớp cha mà không làm thay đổi tính đúng đắn của chương trình.
*   **I - Interface Segregation Principle (ISP):** Thay vì sử dụng một interface lớn, nên chia nhỏ thành nhiều interface chuyên biệt để client không phải phụ thuộc vào các method mà nó không dùng.
*   **D - Dependency Inversion Principle (DIP):** Module cấp cao không nên phụ thuộc trực tiếp vào module cấp thấp. Cả hai nên phụ thuộc vào sự trừu tượng (abstraction/interface).

---

## 2. Phân tích chi tiết áp dụng SOLID trong Gymster

### 2.1. Single Responsibility Principle (SRP)

#### Ưu điểm:
*   **Phân vùng Portal rõ ràng:** Sự phân chia cấu trúc thư mục admin, staff, pt, member giúp giới hạn phạm vi tác động của actor nghiệp vụ.
*   **Module nghiệp vụ đơn nhiệm:** Các helper như `packageEntitlement`, `workoutPlanModel`, `workoutScheduleGenerator`, `workoutSessionConflict` chỉ đảm nhận một việc duy nhất và hoạt động độc lập.
*   **Tách biệt Layout & App Context:** `RoleShell`, `LanguageContext` tách biệt hoàn toàn trách nhiệm hiển thị cấu trúc trang và cấu hình ngôn ngữ khỏi logic của màn hình chi tiết.

#### Nhược điểm:
*   Màn hình tổng hợp PT (`pt/App.tsx`) chứa quá nhiều màn hình con, quản lý state và hàm xử lý sự kiện trong cùng một file.
*   `authService.js` kiêm nhiệm cả local auth, Supabase auth, OAuth, quản lý session và kiểm tra định dạng thông tin đầu vào.

#### Ví dụ minh họa (SRP):

##### 🔴 Before: `authService.js` gộp chung nhiều trách nhiệm (Xác thực, Caching, Validating)
```javascript
export const authService = {
  async loginWithPassword(email, password) {
    // 1. Thực hiện gọi API Supabase Auth
    return await supabase.auth.signInWithPassword({ email, password });
  },
  validateEmail(email) {
    // 2. Logic kiểm tra định dạng email
    return /\S+@\S+\.\S+/.test(email);
  },
  saveSession(user) {
    // 3. Logic lưu trữ session vào localStorage
    localStorage.setItem("user", JSON.stringify(user));
  }
};
```

##### 🟢 After: Tách biệt thành các lớp đơn nhiệm
*   **`validators/authValidator.ts`:**
    ```typescript
    export const AuthValidator = {
      validateEmail: (email: string) => /\S+@\S+\.\S+/.test(email)
    };
    ```
*   **`services/sessionManager.ts`:**
    ```typescript
    export const SessionManager = {
      saveSession: (user: any) => localStorage.setItem("user", JSON.stringify(user))
    };
    ```
*   **`services/authService.ts`:**
    ```typescript
    import { supabase } from "./supabaseClient";

    export const AuthService = {
      async loginWithPassword(email: string, password: string) {
        return await supabase.auth.signInWithPassword({ email, password });
      }
    };
    ```

---

### 2.2. Open/Closed Principle (OCP)

#### Ưu điểm:
*   **Dễ mở rộng Route:** Việc bổ sung portal mới hoặc màn hình mới có thể thực hiện dễ dàng bằng cách thêm khai báo route trong `AppRoutes.jsx` mà không cần sửa đổi mã nguồn xử lý định tuyến cốt lõi.
*   **Dịch vụ AI linh hoạt:** Việc tách biệt AI service giúp dễ dàng nâng cấp mô hình AI hoặc bổ sung prompt mới mà không ảnh hưởng đến giao diện frontend.

#### Nhược điểm:
*   **Lạm dụng câu lệnh rẽ nhánh rải rác:** Cơ chế chuyển đổi trạng thái (status mapping) của training request, workout session còn nằm rải rác ở nhiều component. Nếu thêm trạng thái mới sẽ phải sửa ở nhiều file.
*   **Quy trình thanh toán cứng nhắc:** Quy trình onboarding thanh toán (`payment flow`) chưa có cơ chế Strategy/Factory, gây khó khăn khi tích hợp thêm các cổng thanh toán mới (như Momo, VNPay, Stripe).

#### Ví dụ minh họa (OCP):

##### 🔴 Before: Xử lý các loại thanh toán bằng cấu trúc rẽ nhánh if-else
```javascript
// services/paymentService.js
export async function processPayment(method, amount) {
  if (method === "cash") {
    // xử lý tiền mặt
    return { ok: true, method: "cash" };
  } else if (method === "bank_transfer") {
    // xử lý chuyển khoản ngân hàng
    return { ok: true, method: "bank" };
  } else {
    throw new Error("Unsupported payment method");
  }
}
```

##### 🟢 After: Áp dụng Strategy Pattern để mở rộng phương thức thanh toán không cần sửa code cũ
*   **Định nghĩa Interface/Strategy:**
    ```typescript
    interface PaymentStrategy {
      process(amount: number): Promise<{ ok: boolean; transactionId?: string }>;
    }
    ```
*   **Cài đặt các phương thức thanh toán cụ thể:**
    ```typescript
    export class CashPayment implements PaymentStrategy {
      async process(amount: number) {
        return { ok: true, transactionId: "CASH-" + Date.now() };
      }
    }

    export class BankTransferPayment implements PaymentStrategy {
      async process(amount: number) {
        return { ok: true, transactionId: "BANK-" + Date.now() };
      }
    }
    ```
*   **Lớp điều phối (Context) đóng với sửa đổi:**
    ```typescript
    export class PaymentProcessor {
      private strategies: Record<string, PaymentStrategy> = {};

      registerStrategy(method: string, strategy: PaymentStrategy) {
        this.strategies[method] = strategy;
      }

      async execute(method: string, amount: number) {
        const strategy = this.strategies[method];
        if (!strategy) throw new Error(`Method ${method} not registered.`);
        return await strategy.process(amount);
      }
    }
    ```

---

### 2.3. Liskov Substitution Principle (LSP)

#### Ưu điểm:
*   Các hàm tiện ích thuần túy (pure helpers) được thiết kế nhận tham số đầu vào rõ ràng và trả về dữ liệu ổn định, giúp dễ dàng thay thế thuật toán bên trong mà không làm hỏng ứng dụng.
*   Logic local fallback cố gắng trả về cùng cấu trúc trường dữ liệu tương tự dữ liệu lấy từ Supabase (ví dụ: cung cấp đầy đủ `id`, `status`, `statusLabel`).

#### Nhược điểm:
*   **Kiểu dữ liệu trả về chưa đồng nhất:** Có service trả về dạng `{ data, error }`, có service trả về `{ ok, message }`, hoặc có nơi trả về raw data trực tiếp, gây bối rối cho phía client khi sử dụng.
*   **Bất đồng bộ cấu trúc dữ liệu cũ/mới:** Local fallback và Supabase schema đôi khi vẫn lệch tên trường (ví dụ: snake_case vs camelCase) khiến tầng giao diện phải xử lý kiểm tra điều kiện ngoại lệ.

#### Ví dụ minh họa (LSP):

##### 🔴 Before: Trả về kiểu dữ liệu không đồng nhất gây lỗi khi thay đổi lớp Service
```typescript
// Service cũ sử dụng Local Fallback
export async function getLocalTrainers() {
  return [{ id: "pt-1", full_name: "Anh Tuan" }]; // Trả về raw array
}

// Service mới sử dụng Supabase
export async function getSupabaseTrainers() {
  return { data: [{ id: "pt-1", full_name: "Anh Tuan" }], error: null }; // Trả về wrapper object
}
```

##### 🟢 After: Chuẩn hóa kiểu trả về (Unified Contract) để dễ dàng thay thế
```typescript
export interface ServiceResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface TrainerDTO {
  id: string;
  fullName: string;
}

// Cả 2 service đều trả về cùng một Contract
export async function getTrainersLocal(): Promise<ServiceResponse<TrainerDTO[]>> {
  return { ok: true, data: [{ id: "pt-1", fullName: "Anh Tuan" }] };
}

export async function getTrainersSupabase(): Promise<ServiceResponse<TrainerDTO[]>> {
  // logic...
  return { ok: true, data: [{ id: "pt-1", fullName: "Anh Tuan" }] };
}
```

---

### 2.4. Interface Segregation Principle (ISP)

#### Ưu điểm:
*   Các màn hình (screens) của mỗi Portal chỉ import và khai báo các API/Service thực sự phục vụ cho vai trò của mình.
*   Các màn hình thuộc Member Route được phân tách thành từng file độc lập: `MemberDashboard`, `MyPackagePage`, `MySchedulePage`... giúp client chỉ tải đúng thành phần cần thiết.

#### Nhược điểm:
*   **Interface của file Service quá lớn:** Một số service lớn như `trainingRequestApi.js` gộp chung quá nhiều tính năng (cả truy vấn danh sách, phê duyệt, từ chối, cập nhật, gửi thông báo). Điều này ép các component nhỏ phải phụ thuộc vào toàn bộ file service lớn khi chỉ cần dùng 1 hàm duy nhất.

#### Ví dụ minh họa (ISP):

##### 🔴 Before: Một file Service lớn chứa quá nhiều phương thức phục vụ các tác vụ khác nhau
```typescript
// api/trainingRequestApi.ts
export const trainingRequestApi = {
  getRequestsForMember: (memberId: string) => { /*...*/ },
  getRequestsForTrainer: (trainerId: string) => { /*...*/ },
  approveRequest: (requestId: string) => { /*...*/ },
  rejectRequest: (requestId: string) => { /*...*/ },
  sendNotification: (userId: string, msg: string) => { /*...*/ }
};
```

##### 🟢 After: Chia nhỏ Service thành các Service chuyên trách theo nghiệp vụ
*   **`services/trainingRequestQueryService.ts` (Chỉ chuyên truy vấn):**
    ```typescript
    export const TrainingRequestQueryService = {
      getRequestsForMember: (memberId: string) => { /*...*/ },
      getRequestsForTrainer: (trainerId: string) => { /*...*/ }
    };
    ```
*   **`services/trainingRequestCommandService.ts` (Chỉ chuyên thao tác xử lý):**
    ```typescript
    export const TrainingRequestCommandService = {
      approveRequest: (requestId: string) => { /*...*/ },
      rejectRequest: (requestId: string) => { /*...*/ }
    };
    ```

---

### 2.5. Dependency Inversion Principle (DIP)

#### Ưu điểm:
*   Tách biệt logic nghiệp vụ AI (Claude API) ở backend giúp frontend giao tiếp qua giao thức HTTP API trung gian thay vì phụ thuộc vào thư viện cụ thể.
*   Tách biệt custom hooks giúp UI độc lập với nguồn gốc dữ liệu.

#### Nhược điểm:
*   **Phụ thuộc trực tiếp vào Singleton Database client:** Các file Service trong frontend đang import trực tiếp singleton `supabase` từ `@/services/supabaseClient`. Điều này gây ra sự phụ thuộc chặt chẽ vào thư viện Supabase SDK.
*   **Không có cơ chế Dependency Injection (DI):** Việc khởi tạo và sử dụng trực tiếp đối tượng lớp dưới (Supabase) khiến việc chuyển đổi sang hệ quản trị DB khác hoặc API Backend khác đòi hỏi phải sửa lại toàn bộ mã nguồn của các service.

#### Ví dụ minh họa (DIP):

##### 🔴 Before: Service phụ thuộc trực tiếp vào triển khai cụ thể của DB SDK (Supabase)
```javascript
// services/userService.js
import { supabase } from "./supabaseClient";

export async function getUserProfile(userId) {
  // Phụ thuộc trực tiếp vào Supabase Client SDK
  const { data } = await supabase.from("users").select("*").eq("id", userId);
  return data;
}
```

##### 🟢 After: Service phụ thuộc vào Interface trừu tượng (Dependency Inversion)
*   **Định nghĩa Interface Repository (Sự trừu tượng):**
    ```typescript
    export interface UserRepository {
      getUserById(id: string): Promise<any>;
    }
    ```
*   **Triển khai SupabaseRepository (Lớp cấp thấp):**
    ```typescript
    import { supabase } from "../services/supabaseClient";
    import { UserRepository } from "./userRepository";

    export class SupabaseUserRepository implements UserRepository {
      async getUserById(id: string) {
        const { data } = await supabase.from("users").select("*").eq("id", id);
        return data;
      }
    }
    ```
*   **Service cấp cao phụ thuộc vào Interface chứ không phụ thuộc Supabase SDK:**
    ```typescript
    import { UserRepository } from "../repositories/userRepository";

    export class UserService {
      private userRepo: UserRepository;

      // Inject repository vào thông qua constructor (Dependency Injection)
      constructor(userRepo: UserRepository) {
        this.userRepo = userRepo;
      }

      async getUserProfile(userId: string) {
        return await this.userRepo.getUserById(userId);
      }
    }
    ```

---

## 3. Kết luận phần SOLID

Qua đánh giá 5 nguyên lý SOLID, dự án Gymster đã đáp ứng tương đối tốt ở các phần có cấu trúc rõ ràng như phân chia portal theo vai trò, sử dụng service layer làm trung gian, thiết kế các shared layout/context và có một số module nghiệp vụ thuần tách biệt để viết unit test.

Tuy nhiên, một số file UI lớn và service gộp nghiệp vụ vẫn còn tồn tại. Việc refactor trong tương lai cần tập trung vào SRP và DIP để tăng tính độc lập kiểm thử và khả năng mở rộng lâu dài.

| Nguyên lý | Mức đáp ứng hiện tại | Hướng cải thiện chính |
| :--- | :--- | :--- |
| **SRP** (Single Responsibility) | Khá | Tách màn hình lớn thành các component con, tách hooks độc lập, phân rã service kiêm nhiệm. |
| **OCP** (Open/Closed) | Khá | Dùng Strategy/Factory/Config cho các trạng thái hoạt động, phương thức thanh toán, loại phòng. |
| **LSP** (Liskov Substitution) | Khá | Chuẩn hóa interface/type contract chung cho dữ liệu trả về giữa các service của dự án. |
| **ISP** (Interface Segregation) | Khá | Phân nhỏ các service API lớn thành các service nhỏ chuyên trách theo nghiệp vụ truy vấn/cập nhật. |
| **DIP** (Dependency Inversion) | Khá | Bổ sung các tầng Repository trừu tượng, tránh để service nghiệp vụ import trực tiếp SDK của cơ sở dữ liệu. |

---

# III. Kế hoạch cải thiện đề xuất và kết luận

Tổng thể, dự án **Gymster** sở hữu một nền tảng thiết kế tốt: chia cấu trúc module theo vai trò rõ ràng, có service layer làm trung gian, hệ thống database schema chi tiết và đầy đủ các bộ unit test cho các logic nghiệp vụ quan trọng. Tuy vậy, dự án vẫn cần cải thiện các điểm nghẽn về cấu trúc để sẵn sàng cho quy mô phát triển lớn hơn.

### Các bước cải thiện ngắn hạn:
1.  **Tách nhỏ file UI lớn:** Phân tách file `pt/App.tsx` thành các screen/component và hook riêng lẻ.
2.  **Phân rã Service lớn:** Chia nhỏ `authService.js`, `trainingRequestApi.js` và `workoutSessionApi.js` thành các file service đơn nhiệm.
3.  **Đồng nhất kiểu dữ liệu trả về:** Chuẩn hóa cấu trúc kết quả trả về của các dịch vụ để caller dễ xử lý.
4.  **Tái sử dụng UI Component:** Di chuyển các component giao diện tương đồng ở các portal về thư mục dùng chung `shared/ui`.

### Các bước cải thiện dài hạn:
1.  **Dịch chuyển nghiệp vụ về Backend:** Xây dựng backend đầy đủ để xử lý và kiểm soát các ràng buộc nghiệp vụ quan trọng như thanh toán, check-in, phân quyền, phân lịch thay vì chỉ xử lý ở phía client.
2.  **Áp dụng Repository Pattern:** Thiết kế các adapter/repository theo domain để độc lập hóa tầng giao diện khỏi database/API bên thứ ba.
3.  **Tăng độ phủ kiểm thử:** Bổ sung unit test cho các workflow và route guard để bảo vệ hệ thống khi thực hiện tái cấu trúc mã nguồn (refactoring).
