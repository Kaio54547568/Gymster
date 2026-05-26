Hãy chỉnh sửa lại giao diện web app “Trang Hội viên” của hệ thống quản lý phòng tập Gym.

Hiện tại giao diện đang ở cấu trúc cũ, tách quá nhiều mục chức năng riêng lẻ trên sidebar. Tôi muốn sửa lại thành cấu trúc gọn hơn, hiện đại hơn, chỉ giữ 7 mục chính trên sidebar, đồng thời bổ sung đầy đủ quy trình thanh toán, xác nhận và in biên lai trong phần “Gói tập của tôi”.

Yêu cầu giữ nguyên:
- Giao diện dành cho Hội viên sau khi đã đăng nhập.
- Không thiết kế lại màn đăng ký / đăng nhập.
- Giữ theme đen đỏ hiện đại, mạnh mẽ, phù hợp với phòng gym.
- Giữ layout dashboard: sidebar trái, header trên, nội dung chính bên phải.
- Không làm mất các chức năng đã có, chỉ tổ chức lại vị trí hiển thị.

==================================================
1. SỬA LẠI SIDEBAR NAVIGATION
==================================================

Sidebar chỉ được hiển thị đúng 7 mục chính sau:

1. Trang chủ
2. Gói tập của tôi
3. Lịch tập của tôi
4. Huấn luyện viên
5. Đánh giá dịch vụ
6. Tài khoản cá nhân
7. Đăng xuất

Xóa hoặc ẩn khỏi sidebar các mục riêng lẻ sau:
- Mua gói tập
- Gia hạn gói tập
- Chuyển gói tập
- Thanh toán
- Lịch sử giao dịch
- Biên lai
- Lịch sử tập luyện
- Đặt lịch mới
- Chi tiết buổi tập
- Đổi mật khẩu
- Thông tin cá nhân

Lưu ý:
Các chức năng trên không bị xóa khỏi hệ thống. Chỉ chuyển chúng vào bên trong các trang cha tương ứng.

Cách gom chức năng:

Gói tập của tôi gồm:
- Xem gói hiện tại
- Mua gói mới
- Gia hạn gói
- Chuyển / nâng cấp gói
- Thanh toán
- Xác nhận thanh toán
- Xem biên lai
- In biên lai
- Tải PDF biên lai
- Lịch sử giao dịch

Lịch tập của tôi gồm:
- Xem calendar dạng Google Calendar
- Đặt lịch mới
- Xem chi tiết buổi tập
- Đổi lịch
- Hủy lịch
- Lịch sử tập luyện

Tài khoản cá nhân gồm:
- Thông tin cá nhân
- Cập nhật hồ sơ
- Đổi mật khẩu

==================================================
2. YÊU CẦU CHUNG VỀ UI
==================================================

Phong cách thiết kế:
- Theme chủ đạo: đen đỏ hiện đại
- Nền chính màu đen hoặc xám đen: #0B0B0F, #111217, #17181D
- Màu nhấn đỏ: #E50914, #FF2D2D, #D90429
- Chữ chính màu trắng
- Chữ phụ màu xám sáng
- Card nền xám đậm, bo góc lớn, shadow nhẹ hoặc border đỏ mờ
- Button chính màu đỏ, chữ trắng
- Button phụ nền trong suốt, viền đỏ
- Sidebar nền đen sâu
- Menu active có nền đỏ hoặc viền đỏ bên trái
- Badge trạng thái dễ phân biệt
- Giao diện giống dashboard premium fitness club / gym management app

Bố cục:
- Sidebar cố định bên trái
- Header phía trên nội dung chính
- Header có tên trang hiện tại, thanh tìm kiếm, chuông thông báo, avatar hội viên
- Nội dung chính nằm bên phải sidebar
- Dữ liệu mẫu sử dụng tiếng Việt
- Không dùng lorem ipsum

==================================================
3. TRANG “GÓI TẬP CỦA TÔI”
==================================================

Trang “Gói tập của tôi” là nơi gom toàn bộ chức năng liên quan đến gói tập và thanh toán.

Không tạo menu sidebar riêng cho:
- Mua gói tập
- Gia hạn gói tập
- Chuyển gói tập
- Thanh toán
- Biên lai
- Lịch sử giao dịch

Bên trong trang “Gói tập của tôi”, tổ chức thành các tab hoặc section:

1. Gói hiện tại
2. Mua gói mới
3. Gia hạn / Chuyển gói
4. Thanh toán
5. Lịch sử giao dịch

Tab “Thanh toán” chỉ xuất hiện hoặc được active khi hội viên đang thực hiện mua gói, gia hạn hoặc chuyển gói.

--------------------------------------------------
3.1 TAB “GÓI HIỆN TẠI”
--------------------------------------------------

Hiển thị thông tin gói tập hiện tại của hội viên.

Nội dung cần có:
- Tên gói: Gói Gym 6 tháng
- Mã gói: GYM6M
- Loại gói: Gym
- Trạng thái: Đang hoạt động
- Ngày đăng ký: 10/04/2026
- Ngày hết hạn: 10/10/2026
- Số ngày còn lại: 30 ngày
- Tổng số buổi: 48
- Số buổi đã tập: 36
- Số buổi còn lại: 12
- Giá gói: 3.000.000đ
- Progress bar hoặc progress circle thể hiện 36/48 buổi đã sử dụng

Khu vực quyền lợi:
- Tập gym không giới hạn
- Sử dụng phòng cardio
- Hỗ trợ tư vấn dinh dưỡng cơ bản
- Được đặt lịch với HLV theo gói

Nút hành động:
- Gia hạn ngay
- Mua gói mới
- Chuyển / nâng cấp gói

Nếu gói sắp hết hạn:
- Hiển thị cảnh báo: “Gói tập của bạn còn 30 ngày. Hãy gia hạn để không bị gián đoạn luyện tập.”

Nếu không có gói đang hoạt động:
- Hiển thị empty state: “Bạn hiện không có gói tập nào đang hoạt động”
- Nút “Đăng ký gói mới”

--------------------------------------------------
3.2 TAB “MUA GÓI MỚI”
--------------------------------------------------

Hiển thị danh sách gói tập để hội viên lựa chọn.

Bộ lọc:
- Tất cả
- Gym
- Yoga
- Fitness
- Có PT
- Theo buổi
- Theo tháng

Mỗi card gói tập gồm:
- Mã gói
- Tên gói
- Giá
- Thời lượng
- Loại gói
- Quyền lợi chính
- Badge “Phổ biến” nếu là gói nổi bật
- Badge “Có PT” nếu có huấn luyện viên cá nhân
- Nút “Xem chi tiết”
- Nút “Đăng ký”

Dữ liệu mẫu:
1. Gói Gym 3 tháng
   - Mã gói: GYM3M
   - Giá: 1.500.000đ
   - Thời lượng: 3 tháng
   - Quyền lợi: Tập gym không giới hạn

2. Gói Gym 6 tháng
   - Mã gói: GYM6M
   - Giá: 3.000.000đ
   - Thời lượng: 6 tháng
   - Quyền lợi: Tập gym + cardio

3. Gói Yoga
   - Mã gói: YOGA3M
   - Giá: 2.000.000đ
   - Thời lượng: 3 tháng
   - Quyền lợi: Tham gia lớp yoga nhóm

4. Gói VIP có PT
   - Mã gói: VIPPT3M
   - Giá: 5.000.000đ
   - Thời lượng: 3 tháng
   - Quyền lợi: Có huấn luyện viên cá nhân, tư vấn dinh dưỡng

Khi hội viên bấm “Đăng ký”:
- Chuyển sang bước “Tóm tắt thanh toán”
- Active tab “Thanh toán”
- Không điều hướng sang sidebar khác

--------------------------------------------------
3.3 TAB “GIA HẠN / CHUYỂN GÓI”
--------------------------------------------------

Tab này cho phép hội viên gia hạn gói hiện tại hoặc chuyển/nâng cấp sang gói khác.

Nội dung cần có:
- Card gói hiện tại
- Ngày hết hạn hiện tại
- Số ngày còn lại
- Trạng thái gói
- Danh sách gói có thể gia hạn hoặc chuyển đổi

Form gia hạn/chuyển gói:
- Chọn loại thao tác:
  + Gia hạn gói hiện tại
  + Chuyển sang gói mới
  + Nâng cấp lên gói VIP
- Chọn gói muốn gia hạn/chuyển
- Chọn thời hạn
- Hiển thị giá
- Hiển thị ngày bắt đầu hiệu lực dự kiến
- Hiển thị ngày hết hạn mới dự kiến
- Nút “Tiếp tục thanh toán”

Khi hội viên bấm “Tiếp tục thanh toán”:
- Chuyển sang tab “Thanh toán”
- Hiển thị tóm tắt giao dịch tương ứng

==================================================
4. BỔ SUNG QUY TRÌNH THANH TOÁN HIỆN ĐẠI
==================================================

Trong trang “Gói tập của tôi”, hãy bổ sung đầy đủ luồng thanh toán cho 3 thao tác:
- Mua gói mới
- Gia hạn gói
- Chuyển / nâng cấp gói

Không tạo menu sidebar riêng cho thanh toán. Thanh toán nằm trong trang “Gói tập của tôi”.

--------------------------------------------------
4.1 BƯỚC 1: TÓM TẮT GIAO DỊCH
--------------------------------------------------

Hiển thị card “Tóm tắt thanh toán” gồm:

Thông tin hội viên:
- Mã hội viên: HV003
- Họ tên: Nguyễn Văn A
- Email: nguyenvana@gmail.com
- Số điện thoại: 0912345678

Thông tin giao dịch:
- Loại giao dịch: Mua gói mới / Gia hạn gói / Chuyển gói
- Gói đã chọn
- Mã gói
- Loại gói
- Thời hạn
- Ngày bắt đầu hiệu lực
- Ngày hết hạn dự kiến
- Có PT hay không
- Giá gói
- Phí phát sinh nếu có
- Mã khuyến mãi
- Số tiền giảm
- Tổng tiền cần thanh toán
- Phương thức thanh toán
- Trạng thái thanh toán

Tổng tiền cần thanh toán phải hiển thị thật nổi bật.

--------------------------------------------------
4.2 BƯỚC 2: NHẬP MÃ KHUYẾN MÃI
--------------------------------------------------

Có ô nhập mã khuyến mãi:
- Placeholder: “Nhập mã khuyến mãi”
- Nút “Áp dụng”

Nếu mã hợp lệ:
- Hiển thị số tiền được giảm
- Cập nhật lại tổng tiền

Nếu mã không hợp lệ:
- Hiển thị lỗi: “Mã khuyến mãi không hợp lệ hoặc đã hết hạn”

Dữ liệu mẫu:
- Mã khuyến mãi: GYM2026
- Giảm giá: 10%

--------------------------------------------------
4.3 BƯỚC 3: CHỌN PHƯƠNG THỨC THANH TOÁN
--------------------------------------------------

Cho phép chọn một trong các phương thức:

1. Tiền mặt tại quầy
2. Chuyển khoản ngân hàng
3. Ví điện tử
4. Thẻ ngân hàng

Thiết kế dạng card lựa chọn phương thức thanh toán.

Nếu chọn “Tiền mặt tại quầy”:
- Hiển thị trạng thái: “Chờ xác nhận tại quầy”
- Ghi chú: “Vui lòng đến quầy lễ tân để hoàn tất thanh toán”

Nếu chọn “Chuyển khoản ngân hàng”:
- Hiển thị thông tin tài khoản nhận tiền:
  + Ngân hàng: Vietcombank
  + Chủ tài khoản: GYM CENTER
  + Số tài khoản: 0123456789
  + Nội dung chuyển khoản: HV003 GYM6M
- Hiển thị mã giao dịch hoặc mã đơn hàng
- Có khu vực QR chuyển khoản
- Trạng thái: “Chờ xác nhận chuyển khoản”

Nếu chọn “Ví điện tử”:
- Hiển thị trạng thái: “Chuyển sang cổng thanh toán ví điện tử”
- Có nút “Thanh toán qua ví điện tử”

Nếu chọn “Thẻ ngân hàng”:
- Hiển thị trạng thái: “Chuyển sang cổng thanh toán thẻ”
- Có nút “Thanh toán bằng thẻ”

--------------------------------------------------
4.4 BƯỚC 4: XÁC NHẬN THANH TOÁN
--------------------------------------------------

Sau khi hội viên chọn phương thức thanh toán, hiển thị modal “Xác nhận thanh toán”.

Modal xác nhận gồm:
- Họ tên hội viên
- Mã hội viên
- Gói đăng ký
- Loại giao dịch: Mua mới / Gia hạn / Chuyển gói
- Tổng tiền
- Phương thức thanh toán
- Ngày giao dịch
- Trạng thái dự kiến

Nút trong modal:
- Xác nhận thanh toán
- Quay lại chỉnh sửa
- Hủy giao dịch

Nếu bấm “Xác nhận thanh toán”:
- Hiển thị trạng thái sau thanh toán

--------------------------------------------------
4.5 BƯỚC 5: TRẠNG THÁI SAU THANH TOÁN
--------------------------------------------------

Sau khi xác nhận, hiển thị một trong các trạng thái:

1. Thanh toán thành công
2. Đang chờ xác nhận
3. Thanh toán thất bại
4. Giao dịch đã hủy

Nếu thanh toán thành công:
- Cập nhật gói tập của hội viên
- Cập nhật ngày bắt đầu
- Cập nhật ngày hết hạn
- Cập nhật số buổi tập còn lại
- Hiển thị thông báo: “Thanh toán thành công. Gói tập của bạn đã được cập nhật.”

Nếu đang chờ xác nhận:
- Không cập nhật gói ngay
- Hiển thị thông báo: “Giao dịch đang chờ nhân viên xác nhận.”
- Trạng thái giao dịch là “Chờ xác nhận”

Nếu thanh toán thất bại:
- Hiển thị thông báo lỗi
- Có nút “Thử lại thanh toán”

Nếu giao dịch bị hủy:
- Hiển thị thông báo: “Giao dịch đã được hủy”
- Có nút “Quay lại Gói tập của tôi”

==================================================
5. BIÊN LAI / HÓA ĐƠN THANH TOÁN
==================================================

Sau khi thanh toán thành công hoặc giao dịch được ghi nhận, hiển thị màn hình/modal “Biên lai thanh toán”.

Biên lai cần có giao diện giống hóa đơn hiện đại, dễ đọc, có thể in hoặc tải PDF.

Thông tin trên biên lai:

Thông tin phòng tập:
- Logo / tên phòng tập
- Địa chỉ phòng tập
- Số điện thoại hỗ trợ

Thông tin biên lai:
- Mã biên lai: BL0008
- Mã giao dịch: GD20260512001
- Ngày giờ thanh toán: 12/05/2026 19:30
- Trạng thái thanh toán: Thành công / Chờ xác nhận

Thông tin hội viên:
- Mã hội viên: HV003
- Họ tên hội viên: Nguyễn Văn A
- Email
- Số điện thoại

Thông tin giao dịch:
- Loại giao dịch: Mua gói mới / Gia hạn gói / Chuyển gói
- Tên gói tập
- Mã gói
- Thời hạn gói
- Ngày bắt đầu hiệu lực
- Ngày hết hạn
- Số buổi được cộng thêm nếu có
- Phương thức thanh toán
- Nhân viên xác nhận nếu có
- Ghi chú nếu có

Thông tin tiền:
- Số tiền gốc
- Phí phát sinh nếu có
- Mã khuyến mãi
- Số tiền giảm giá
- Tổng tiền đã thanh toán

Nút thao tác trên biên lai:
- In biên lai
- Tải PDF
- Gửi biên lai qua email
- Quay về Gói tập của tôi

Yêu cầu UI cho biên lai:
- Bố cục rõ ràng như hóa đơn hiện đại
- Tổng tiền phải nổi bật
- Trạng thái thanh toán dùng badge
- Có đường phân cách các phần
- Có thể hiển thị trong modal hoặc trang con bên trong “Gói tập của tôi”
- Không tạo sidebar riêng cho biên lai

==================================================
6. LỊCH SỬ GIAO DỊCH
==================================================

Trong trang “Gói tập của tôi”, thêm tab hoặc section “Lịch sử giao dịch”.

Bảng lịch sử giao dịch gồm:
- Mã giao dịch
- Ngày giao dịch
- Loại giao dịch
- Gói tập
- Số tiền
- Phương thức thanh toán
- Trạng thái
- Nút “Xem biên lai”

Trạng thái giao dịch:
- Thành công
- Chờ xác nhận
- Thất bại
- Đã hủy

Dữ liệu mẫu:
1. GD20260512001
   - Ngày: 12/05/2026
   - Loại giao dịch: Gia hạn gói
   - Gói tập: Gói Gym 6 tháng
   - Số tiền: 3.000.000đ
   - Phương thức: Chuyển khoản ngân hàng
   - Trạng thái: Thành công

2. GD20260410002
   - Ngày: 10/04/2026
   - Loại giao dịch: Mua gói mới
   - Gói tập: Gói Gym 6 tháng
   - Số tiền: 3.000.000đ
   - Phương thức: Tiền mặt
   - Trạng thái: Thành công

3. GD20260305003
   - Ngày: 05/03/2026
   - Loại giao dịch: Chuyển gói
   - Gói tập: Gói VIP có PT
   - Số tiền: 2.000.000đ
   - Phương thức: Ví điện tử
   - Trạng thái: Chờ xác nhận

Khi bấm “Xem biên lai”:
- Mở modal hoặc drawer hiển thị biên lai tương ứng
- Có nút in, tải PDF, gửi email

==================================================
7. TRANG “LỊCH TẬP CỦA TÔI”
==================================================

Trang này giữ lại các chức năng:
- Xem calendar dạng Google Calendar
- Đặt lịch mới
- Xem chi tiết buổi tập
- Đổi lịch
- Hủy lịch
- Lịch sử tập luyện

Không tạo sidebar riêng cho:
- Lịch sử tập luyện
- Đặt lịch mới
- Chi tiết buổi tập

Tổ chức bên trong trang bằng tab hoặc section:
1. Calendar
2. Lịch sử tập luyện

Yêu cầu:
- Calendar giống Google Calendar nhưng dùng theme đen đỏ
- Có toolbar: Hôm nay, previous, next, Tháng/Tuần/Ngày, Đặt lịch mới
- Khi click vào event, mở modal “Chi tiết buổi tập”
- Lịch sử tập luyện nằm trong tab riêng
- Có bộ lọc ngày, tìm kiếm bài tập, calories burned và nút xem chi tiết

==================================================
8. TRANG “TÀI KHOẢN CÁ NHÂN”
==================================================

Trang này gom:
- Thông tin cá nhân
- Cập nhật hồ sơ
- Đổi mật khẩu

Không tạo sidebar riêng cho:
- Thông tin cá nhân
- Đổi mật khẩu

Tổ chức bên trong trang bằng tab:
1. Thông tin cá nhân
2. Đổi mật khẩu

Tab “Thông tin cá nhân” gồm:
- Ảnh đại diện
- Mã hội viên
- Họ tên
- Email
- Số điện thoại
- Ngày sinh
- Giới tính
- Địa chỉ
- Trạng thái tài khoản
- Ngày đăng ký
- Nút “Lưu thay đổi”

Tab “Đổi mật khẩu” gồm:
- Mật khẩu hiện tại
- Mật khẩu mới
- Xác nhận mật khẩu mới
- Checklist yêu cầu mật khẩu
- Nút “Cập nhật mật khẩu”

==================================================
9. COMPONENT CẦN BỔ SUNG / CẬP NHẬT
==================================================

Hãy refactor hoặc tạo thêm các component sau:

Sidebar và layout:
- MemberSidebar
- MemberHeader
- StatusBadge

Gói tập:
- PackageSummaryCard
- PackageCard
- PackageDetailModal
- PackageTabs
- CurrentPackageSection
- BuyPackageSection
- RenewOrChangePackageSection

Thanh toán:
- PaymentSummaryCard
- PaymentMethodSelector
- PromoCodeInput
- PaymentConfirmationModal
- PaymentStatusBadge
- ReceiptModal
- ReceiptPreview
- TransactionHistoryTable
- TransactionDetailDrawer

Lịch tập:
- CalendarToolbar
- WorkoutCalendar
- WorkoutEvent
- WorkoutDetailModal
- BookingWorkoutModal
- WorkoutHistoryTable
- WorkoutHistoryFilter

Tài khoản:
- ProfileForm
- ChangePasswordForm

Khác:
- EmptyState
- ProgressCircle
- NotificationCard

==================================================
10. ROUTE / CẤU TRÚC CODE NẾU ĐANG GEN REACT
==================================================

Nếu đang chỉnh code React, hãy refactor routes/components theo cấu trúc:

- /member/dashboard
- /member/package
- /member/schedule
- /member/trainers
- /member/reviews
- /member/account

Không tạo route sidebar riêng cho:
- /member/buy-package
- /member/renew-package
- /member/change-package
- /member/payment
- /member/receipt
- /member/transactions
- /member/workout-history
- /member/change-password
- /member/profile

Các chức năng đó chuyển thành tab, modal, drawer hoặc section bên trong route cha tương ứng.

Cụ thể:
- Mua gói, gia hạn, chuyển gói, thanh toán, biên lai, lịch sử giao dịch nằm trong /member/package
- Calendar, đặt lịch, chi tiết buổi tập, lịch sử tập luyện nằm trong /member/schedule
- Thông tin cá nhân và đổi mật khẩu nằm trong /member/account

==================================================
11. KẾT QUẢ MONG MUỐN
==================================================

Sau khi sửa, sidebar chỉ còn:

1. Trang chủ
2. Gói tập của tôi
3. Lịch tập của tôi
4. Huấn luyện viên
5. Đánh giá dịch vụ
6. Tài khoản cá nhân
7. Đăng xuất

Trong đó:

Gói tập của tôi:
- Xem gói hiện tại
- Mua gói mới
- Gia hạn gói
- Chuyển / nâng cấp gói
- Thanh toán
- Xác nhận thanh toán
- Biên lai
- In biên lai
- Tải PDF
- Lịch sử giao dịch

Lịch tập của tôi:
- Xem calendar
- Đặt lịch mới
- Xem chi tiết buổi tập
- Đổi lịch
- Hủy lịch
- Lịch sử tập luyện

Tài khoản cá nhân:
- Thông tin cá nhân
- Đổi mật khẩu

Yêu cầu cuối:
- Giữ theme đen đỏ hiện đại
- Sidebar phải gọn, rõ, dễ dùng
- Không làm mất chức năng cũ
- Chỉ tổ chức lại chức năng vào đúng trang cha
- Quy trình thanh toán phải rõ ràng, hiện đại, có xác nhận và biên lai
- Biên lai có thể in, tải PDF hoặc gửi qua email
- Dữ liệu mẫu bằng tiếng Việt
- Không dùng lorem ipsum