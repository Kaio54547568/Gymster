Hãy chỉnh sửa lại luồng thanh toán trong trang “Gói tập của tôi”.

Hiện tại sau khi hội viên xác nhận mua/gia hạn/chuyển gói, hệ thống đang đi thẳng sang bước xác nhận thanh toán hoặc biên lai. Tôi muốn sửa lại đúng quy trình hiện đại hơn:

Không được cập nhật gói tập ngay sau khi bấm “Xác nhận mua”.
Sau khi bấm “Xác nhận mua”, phải hiển thị bước thanh toán trước, bao gồm QR chuyển khoản hoặc thông tin phương thức thanh toán. Chỉ sau khi thanh toán thành công hoặc được xác nhận thì mới cập nhật gói tập và tạo biên lai.

==================================================
1. LUỒNG THANH TOÁN MỚI
==================================================

Luồng mới cần là:

1. Hội viên chọn gói / gia hạn / chuyển gói
2. Hệ thống hiển thị tóm tắt đơn hàng
3. Hội viên bấm “Xác nhận mua”
4. Hệ thống chuyển sang màn hình “Thanh toán”
5. Hệ thống hiển thị QR thanh toán hoặc thông tin thanh toán theo phương thức đã chọn
6. Hội viên thực hiện thanh toán
7. Hệ thống hiển thị trạng thái:
   - Đang chờ thanh toán
   - Đang chờ xác nhận
   - Thanh toán thành công
   - Thanh toán thất bại
8. Khi thanh toán thành công:
   - Cập nhật gói tập của hội viên
   - Cập nhật ngày bắt đầu
   - Cập nhật ngày hết hạn
   - Cập nhật số buổi còn lại
   - Tạo biên lai
9. Hiển thị modal hoặc màn hình “Biên lai thanh toán”

==================================================
2. SỬA Ý NGHĨA NÚT “XÁC NHẬN MUA”
==================================================

Nút “Xác nhận mua” không có nghĩa là đã thanh toán thành công.

Khi bấm “Xác nhận mua”:
- Không cập nhật gói tập ngay
- Không tạo biên lai ngay
- Không hiển thị trạng thái thành công ngay
- Chỉ tạo một đơn hàng/giao dịch tạm thời với trạng thái “Đang chờ thanh toán”
- Chuyển sang bước hiển thị QR/thông tin thanh toán

Tên nút có thể là:
- “Xác nhận mua”
- hoặc “Tiếp tục thanh toán”

Sau khi bấm nút, hiển thị màn hình thanh toán.

==================================================
3. MÀN HÌNH / TAB “THANH TOÁN”
==================================================

Trong tab “Thanh toán” của trang “Gói tập của tôi”, hãy chia thành các bước rõ ràng:

Step 1: Tóm tắt đơn hàng
Step 2: Thanh toán
Step 3: Xác nhận kết quả
Step 4: Biên lai

Có thể dùng stepper ngang ở đầu màn hình:

[1. Đơn hàng] → [2. Thanh toán] → [3. Xác nhận] → [4. Biên lai]

==================================================
4. STEP 1: TÓM TẮT ĐƠN HÀNG
==================================================

Hiển thị:
- Mã đơn hàng
- Mã hội viên
- Họ tên hội viên
- Loại giao dịch: Mua gói mới / Gia hạn gói / Chuyển gói
- Gói đã chọn
- Mã gói
- Thời hạn
- Ngày bắt đầu dự kiến
- Ngày hết hạn dự kiến
- Giá gói
- Mã khuyến mãi nếu có
- Số tiền giảm nếu có
- Tổng tiền cần thanh toán
- Phương thức thanh toán đã chọn

Nút:
- Quay lại chỉnh sửa
- Xác nhận mua / Tiếp tục thanh toán

Khi bấm “Xác nhận mua”:
- Chuyển sang Step 2: Thanh toán
- Tạo trạng thái giao dịch: “Đang chờ thanh toán”

==================================================
5. STEP 2: THANH TOÁN
==================================================

Hiển thị thông tin thanh toán theo phương thức hội viên chọn.

Nếu chọn “Chuyển khoản ngân hàng”:
- Hiển thị QR chuyển khoản lớn ở trung tâm hoặc bên phải
- Hiển thị thông tin tài khoản:
  + Ngân hàng: Vietcombank
  + Chủ tài khoản: GYM CENTER
  + Số tài khoản: 0123456789
  + Số tiền: đúng tổng tiền cần thanh toán
  + Nội dung chuyển khoản: mã đơn hàng + mã hội viên
- Ví dụ nội dung chuyển khoản:
  “DH20260512001 HV003”
- Có nút:
  + Sao chép số tài khoản
  + Sao chép nội dung chuyển khoản
  + Tôi đã chuyển khoản
  + Hủy giao dịch

Nếu chưa có QR thật:
- Dùng placeholder QR code rõ ràng
- Ghi chú: “QR thanh toán mẫu”
- QR phải nhìn giống khu vực scan thanh toán, không chỉ là icon nhỏ

Nếu chọn “Ví điện tử”:
- Hiển thị QR ví điện tử hoặc nút “Mở cổng thanh toán ví điện tử”
- Trạng thái: “Đang chờ thanh toán”
- Có nút “Tôi đã thanh toán”

Nếu chọn “Thẻ ngân hàng”:
- Hiển thị form/card mô phỏng cổng thanh toán thẻ hoặc nút “Thanh toán bằng thẻ”
- Sau khi bấm thanh toán, hiển thị trạng thái xử lý

Nếu chọn “Tiền mặt tại quầy”:
- Không hiển thị QR
- Hiển thị hướng dẫn:
  “Vui lòng đến quầy lễ tân để thanh toán. Giao dịch sẽ được kích hoạt sau khi nhân viên xác nhận.”
- Trạng thái: “Chờ thanh toán tại quầy”

==================================================
6. TRẠNG THÁI Ở STEP THANH TOÁN
==================================================

Ở Step 2 cần có badge trạng thái:

- Đang chờ thanh toán
- Đã gửi yêu cầu xác nhận
- Đang chờ nhân viên xác nhận
- Thanh toán thành công
- Thanh toán thất bại
- Giao dịch đã hủy

Khi hội viên bấm “Tôi đã chuyển khoản” hoặc “Tôi đã thanh toán”:
- Không tự động cập nhật gói ngay
- Chuyển trạng thái sang “Đang chờ nhân viên xác nhận”
- Hiển thị thông báo:
  “Yêu cầu xác nhận thanh toán đã được gửi. Vui lòng chờ nhân viên kiểm tra giao dịch.”

Nếu muốn mô phỏng thanh toán online thành công:
- Có thể có nút demo “Mô phỏng thanh toán thành công”
- Khi bấm nút này mới chuyển sang Step 3: Xác nhận kết quả

==================================================
7. STEP 3: XÁC NHẬN KẾT QUẢ THANH TOÁN
==================================================

Step này hiển thị kết quả sau thanh toán.

Trường hợp thành công:
- Icon thành công
- Tiêu đề: “Thanh toán thành công”
- Nội dung:
  “Gói tập của bạn đã được cập nhật thành công.”
- Hiển thị:
  + Mã giao dịch
  + Gói tập
  + Tổng tiền đã thanh toán
  + Phương thức thanh toán
  + Thời gian thanh toán
- Nút “Xem biên lai”

Trường hợp chờ xác nhận:
- Icon đồng hồ
- Tiêu đề: “Đang chờ xác nhận thanh toán”
- Nội dung:
  “Giao dịch của bạn đang chờ nhân viên xác nhận. Gói tập sẽ được cập nhật sau khi thanh toán được xác nhận.”
- Nút:
  + Quay về Gói tập của tôi
  + Xem lịch sử giao dịch

Trường hợp thất bại:
- Icon lỗi
- Tiêu đề: “Thanh toán thất bại”
- Nội dung:
  “Giao dịch chưa được hoàn tất. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.”
- Nút:
  + Thử lại thanh toán
  + Chọn phương thức khác

Chỉ khi trạng thái là “Thanh toán thành công”:
- Cập nhật gói tập
- Tạo biên lai
- Cho phép xem biên lai

==================================================
8. STEP 4: BIÊN LAI
==================================================

Sau khi thanh toán thành công, hiển thị biên lai.

Biên lai gồm:
- Logo / tên phòng tập
- Mã biên lai
- Mã giao dịch
- Mã đơn hàng
- Mã hội viên
- Họ tên hội viên
- Email / số điện thoại
- Loại giao dịch
- Tên gói tập
- Mã gói
- Thời hạn gói
- Ngày bắt đầu hiệu lực
- Ngày hết hạn
- Số tiền gốc
- Số tiền giảm giá
- Tổng tiền đã thanh toán
- Phương thức thanh toán
- Trạng thái thanh toán
- Ngày giờ thanh toán

Nút:
- In biên lai
- Tải PDF
- Gửi qua email
- Quay về Gói tập của tôi

==================================================
9. CẬP NHẬT LỊCH SỬ GIAO DỊCH
==================================================

Khi bấm “Xác nhận mua”:
- Tạo giao dịch mới trong lịch sử với trạng thái “Đang chờ thanh toán”

Khi bấm “Tôi đã chuyển khoản”:
- Cập nhật trạng thái giao dịch thành “Đang chờ xác nhận”

Khi thanh toán thành công:
- Cập nhật trạng thái giao dịch thành “Thành công”
- Cho phép xem biên lai

Khi thanh toán thất bại:
- Cập nhật trạng thái giao dịch thành “Thất bại”

Khi hủy:
- Cập nhật trạng thái giao dịch thành “Đã hủy”

Bảng lịch sử giao dịch phải hiển thị:
- Mã giao dịch
- Mã đơn hàng
- Ngày giao dịch
- Loại giao dịch
- Gói tập
- Số tiền
- Phương thức thanh toán
- Trạng thái
- Nút “Xem biên lai” chỉ hiển thị khi giao dịch thành công

==================================================
10. YÊU CẦU UI
==================================================

- Giữ theme đen đỏ hiện đại
- QR thanh toán phải nổi bật, dễ nhìn, giống màn hình thanh toán thật
- Tổng tiền cần thanh toán phải hiển thị lớn
- Mã đơn hàng và nội dung chuyển khoản phải dễ copy
- Có nút copy cho số tài khoản và nội dung chuyển khoản
- Có stepper thể hiện tiến trình thanh toán
- Không cập nhật gói tập trước khi thanh toán thành công
- Không tạo biên lai trước khi thanh toán thành công
- Giao dịch chờ xác nhận vẫn xuất hiện trong lịch sử giao dịch nhưng chưa có biên lai chính thức
- Không tạo sidebar riêng cho thanh toán
- Thanh toán vẫn nằm trong trang “Gói tập của tôi”
- Dữ liệu mẫu bằng tiếng Việt
- Không dùng lorem ipsum

==================================================
11. NẾU ĐANG CODE REACT
==================================================

Hãy cập nhật state và handler theo logic sau:

State cần có:
- selectedPackage
- currentTransaction
- paymentStep
- paymentMethod
- paymentStatus
- transactions
- receipt

Giá trị paymentStep:
- order_summary
- payment_qr
- payment_result
- receipt

Giá trị paymentStatus:
- pending_payment
- waiting_confirmation
- success
- failed
- cancelled

Handler cần có:
- handleConfirmPurchase()
- handlePaymentMethodSelect(method)
- handleApplyPromoCode(code)
- handleCopyBankAccount()
- handleCopyTransferContent()
- handleUserPaid()
- handleSimulatePaymentSuccess()
- handlePaymentFailed()
- handleCancelTransaction()
- handleGenerateReceipt()
- handlePrintReceipt()
- handleDownloadReceiptPdf()
- handleSendReceiptEmail()

Logic:
- handleConfirmPurchase chỉ tạo transaction trạng thái pending_payment và chuyển paymentStep sang payment_qr
- handleUserPaid chuyển paymentStatus sang waiting_confirmation
- handleSimulatePaymentSuccess chuyển paymentStatus sang success, cập nhật gói tập, tạo receipt và chuyển paymentStep sang payment_result
- handleGenerateReceipt chỉ chạy khi paymentStatus = success
- Không cho tạo receipt nếu paymentStatus chưa success
- Không cho cập nhật gói tập nếu paymentStatus chưa success