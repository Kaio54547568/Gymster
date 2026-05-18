Hãy sửa và hoàn thiện phần thao tác với từng buổi tập trong trang “Lịch tập của tôi” của web app Trang Hội viên.

Bối cảnh:
Trang “Lịch tập của tôi” đang hiển thị calendar dạng Google Calendar. Khi hội viên click vào một buổi tập trên calendar, hệ thống mở modal “Chi tiết buổi tập”. Trong modal này cần xử lý đúng các hành động theo trạng thái buổi tập:
- Buổi tập sắp tới: cho phép Đổi lịch, Hủy lịch
- Buổi tập đã hoàn thành: cho phép Đánh giá buổi tập
- Buổi tập đã hủy: chỉ cho xem thông tin, không cho đổi/hủy/đánh giá

Yêu cầu sửa chi tiết:

==================================================
1. TRẠNG THÁI BUỔI TẬP
==================================================

Mỗi event/buổi tập cần có trường status:

- “Sắp tới”
- “Đã hoàn thành”
- “Đã hủy”
- “Chờ xác nhận”

Dựa vào status để hiển thị nút hành động trong modal chi tiết buổi tập.

Quy tắc hiển thị nút:

Nếu status = “Sắp tới”:
- Hiển thị nút “Đổi lịch”
- Hiển thị nút “Hủy lịch”
- Hiển thị nút “Đóng”
- Không hiển thị nút “Đánh giá buổi tập”

Nếu status = “Đã hoàn thành”:
- Hiển thị nút “Đánh giá buổi tập”
- Hiển thị nút “Đóng”
- Không hiển thị nút “Đổi lịch”
- Không hiển thị nút “Hủy lịch”

Nếu status = “Đã hủy”:
- Chỉ hiển thị nút “Đóng”
- Không hiển thị “Đổi lịch”
- Không hiển thị “Hủy lịch”
- Không hiển thị “Đánh giá buổi tập”

Nếu status = “Chờ xác nhận”:
- Hiển thị nút “Hủy yêu cầu”
- Hiển thị nút “Đóng”

==================================================
2. MODAL CHI TIẾT BUỔI TẬP
==================================================

Khi click vào event trên calendar, mở modal “Chi tiết buổi tập”.

Modal cần hiển thị:
- Tên buổi tập
- Môn tập
- Ngày tập
- Giờ bắt đầu
- Giờ kết thúc
- Huấn luyện viên
- Phòng tập / khu vực tập
- Trạng thái
- Nội dung buổi tập
- Mục tiêu buổi tập
- Ghi chú từ HLV
- Ghi chú của hội viên nếu có

Ví dụ:
Tên buổi tập: Gym cá nhân - Tập ngực và tay sau
Môn tập: Gym cá nhân
Thời gian: 18:00 - 19:00, Thứ ba 12/05/2026
Huấn luyện viên: Nguyễn Văn Nam
Phòng tập: Phòng Gym tầng 2
Trạng thái: Sắp tới
Mục tiêu: Tăng sức mạnh phần thân trên

Nội dung buổi tập:
1. Khởi động 10 phút
2. Bench Press: 4 hiệp x 10 lần
3. Dumbbell Fly: 3 hiệp x 12 lần
4. Triceps Pushdown: 3 hiệp x 12 lần
5. Giãn cơ cuối buổi 5 phút

==================================================
3. CHỨC NĂNG ĐỔI LỊCH
==================================================

Chỉ cho phép đổi lịch với buổi tập có status = “Sắp tới”.

Khi hội viên bấm “Đổi lịch”:
- Mở modal/form “Đổi lịch tập”
- Form được điền sẵn dữ liệu cũ:
  + Môn tập
  + Huấn luyện viên
  + Ngày tập
  + Giờ tập
  + Phòng tập
  + Ghi chú
- Hội viên có thể sửa:
  + Ngày tập mới
  + Giờ tập mới
  + Huấn luyện viên nếu cần
  + Phòng tập nếu cần
  + Ghi chú

Validate khi đổi lịch:
- Ngày mới không được để trống
- Giờ mới không được để trống
- Ngày/giờ mới không được nằm trong quá khứ
- Nếu buổi tập còn dưới 2 tiếng nữa thì không cho đổi lịch
- Nếu HLV đã kín lịch ở khung giờ mới thì báo lỗi
- Nếu phòng tập/khu vực đã kín thì báo lỗi

Thông báo lỗi mẫu:
- “Vui lòng chọn ngày tập mới”
- “Vui lòng chọn giờ tập mới”
- “Không thể đổi lịch sang thời gian trong quá khứ”
- “Không thể đổi lịch vì đã quá sát giờ tập”
- “Huấn luyện viên đã kín lịch trong khung giờ này”
- “Phòng tập đã kín trong khung giờ này”

Sau khi đổi lịch thành công:
- Cập nhật event trên calendar
- Giữ nguyên id của event
- Cập nhật date, startTime, endTime, trainerName, room, note
- Đóng modal đổi lịch
- Đóng hoặc cập nhật modal chi tiết
- Hiển thị toast/thông báo: “Đổi lịch thành công”
- Event vẫn có status = “Sắp tới”

Không tạo route riêng cho đổi lịch. Đổi lịch phải là modal nằm trong trang “Lịch tập của tôi”.

==================================================
4. CHỨC NĂNG HỦY LỊCH
==================================================

Chỉ cho phép hủy lịch với buổi tập có status = “Sắp tới” hoặc “Chờ xác nhận”.

Khi hội viên bấm “Hủy lịch”:
- Mở modal xác nhận hủy lịch
- Không hủy ngay lập tức khi vừa bấm nút

Modal xác nhận hủy cần hiển thị:
- Tiêu đề: “Xác nhận hủy lịch”
- Nội dung:
  “Bạn có chắc chắn muốn hủy buổi tập này không?”
- Thông tin buổi tập:
  + Tên buổi tập
  + Ngày tập
  + Giờ tập
  + Huấn luyện viên
  + Phòng tập
- Ô nhập lý do hủy, không bắt buộc:
  + Placeholder: “Nhập lý do hủy nếu có”
- Nút:
  + Xác nhận hủy
  + Quay lại

Validate khi hủy:
- Nếu buổi tập còn dưới 2 tiếng nữa thì không cho hủy
- Nếu buổi tập đã hoàn thành thì không cho hủy
- Nếu buổi tập đã hủy rồi thì không cho hủy lại

Thông báo lỗi mẫu:
- “Không thể hủy lịch do đã quá sát giờ tập”
- “Buổi tập đã hoàn thành, không thể hủy”
- “Buổi tập này đã được hủy trước đó”

Sau khi hủy thành công:
- Không xóa event khỏi calendar
- Cập nhật status của event thành “Đã hủy”
- Event trên calendar chuyển sang style “Đã hủy”
- Nếu buổi tập dùng số buổi trong gói và hủy đúng hạn, cộng lại 1 buổi tập vào số buổi còn lại
- Đóng modal xác nhận hủy
- Hiển thị toast/thông báo: “Hủy lịch thành công”
- Trong modal chi tiết, sau khi hủy thì chỉ còn nút “Đóng”

Yêu cầu UI cho event đã hủy:
- Màu xám tối
- Có thể gạch ngang tên event
- Badge “Đã hủy”

Không tạo route riêng cho hủy lịch. Hủy lịch phải là modal xác nhận trong trang “Lịch tập của tôi”.

==================================================
5. CHỨC NĂNG ĐÁNH GIÁ BUỔI ĐÃ TẬP
==================================================

Chỉ cho phép đánh giá với buổi tập có status = “Đã hoàn thành”.

Khi hội viên bấm “Đánh giá buổi tập”:
- Mở modal/form “Đánh giá buổi tập”
- Không chuyển sang route mới
- Form đánh giá gắn với buổi tập đã chọn

Form đánh giá gồm:
- Tên buổi tập
- Ngày tập
- Huấn luyện viên
- Phòng tập
- Chọn số sao từ 1 đến 5
- Nội dung đánh giá
- Checkbox hoặc lựa chọn nhanh:
  + HLV hướng dẫn dễ hiểu
  + Bài tập phù hợp
  + Cường độ hợp lý
  + Phòng tập sạch sẽ
  + Thiết bị đầy đủ
- Nút:
  + Gửi đánh giá
  + Hủy

Validate khi gửi đánh giá:
- Nếu chưa chọn số sao, báo lỗi: “Vui lòng chọn số sao đánh giá”
- Nếu nội dung đánh giá dưới 10 ký tự, báo lỗi: “Nội dung đánh giá tối thiểu 10 ký tự”
- Nếu buổi tập chưa hoàn thành, báo lỗi: “Chỉ có thể đánh giá buổi tập đã hoàn thành”
- Nếu buổi tập đã được đánh giá rồi, báo lỗi hoặc hiển thị trạng thái “Bạn đã đánh giá buổi tập này”

Sau khi gửi đánh giá thành công:
- Lưu review gắn với workoutId/eventId
- Cập nhật event.hasReview = true
- Đóng modal đánh giá
- Hiển thị thông báo: “Cảm ơn bạn đã đánh giá buổi tập”
- Trong modal chi tiết buổi tập đã hoàn thành, thay nút “Đánh giá buổi tập” bằng badge hoặc text:
  “Bạn đã đánh giá buổi tập này”

Dữ liệu review cần có:
- reviewId
- workoutId
- memberId
- trainerId nếu có
- ratingStars
- comment
- quickTags
- createdAt

Yêu cầu UI:
- Rating sao lớn, dễ click
- Textarea rõ ràng
- Quick tags dạng chip có thể chọn
- Nút gửi màu đỏ
- Sau khi gửi có trạng thái thành công

==================================================
6. CẬP NHẬT EVENT TRÊN CALENDAR
==================================================

Calendar phải phản ánh đúng trạng thái event:

Sắp tới:
- Event màu đỏ
- Badge “Sắp tới”

Đã hoàn thành:
- Event màu xám sáng hoặc đỏ nhạt
- Badge “Đã hoàn thành”

Đã hủy:
- Event màu xám tối
- Gạch ngang tên event
- Badge “Đã hủy”

Chờ xác nhận:
- Event màu cam
- Badge “Chờ xác nhận”

Khi đổi lịch:
- Event di chuyển sang ngày/giờ mới

Khi hủy lịch:
- Event vẫn còn trên calendar nhưng đổi style sang “Đã hủy”

Khi đánh giá:
- Event có thêm icon hoặc label nhỏ “Đã đánh giá”

==================================================
7. NẾU ĐANG CODE REACT
==================================================

Hãy kiểm tra và sửa các state/handler sau:

State cần có:
- events hoặc workouts
- selectedWorkout
- isWorkoutDetailOpen
- isRescheduleModalOpen
- isCancelConfirmOpen
- isReviewModalOpen
- rescheduleForm
- cancelReason
- reviewForm
- formErrors

Handler cần có:
- handleEventClick(event)
- handleOpenReschedule(workout)
- handleSubmitReschedule()
- handleOpenCancelConfirm(workout)
- handleConfirmCancel()
- handleOpenReview(workout)
- handleSubmitReview()
- updateWorkoutStatus(workoutId, newStatus)
- updateWorkoutSchedule(workoutId, newData)

Luồng đổi lịch:
Click event
→ mở WorkoutDetailModal
→ bấm “Đổi lịch”
→ mở RescheduleWorkoutModal
→ validate form
→ cập nhật event trong state
→ đóng modal
→ toast “Đổi lịch thành công”

Luồng hủy lịch:
Click event
→ mở WorkoutDetailModal
→ bấm “Hủy lịch”
→ mở CancelWorkoutModal
→ bấm “Xác nhận hủy”
→ validate thời gian
→ cập nhật status = “Đã hủy”
→ cập nhật event style
→ toast “Hủy lịch thành công”

Luồng đánh giá:
Click event đã hoàn thành
→ mở WorkoutDetailModal
→ bấm “Đánh giá buổi tập”
→ mở WorkoutReviewModal
→ nhập đánh giá
→ validate
→ lưu review
→ cập nhật hasReview = true
→ toast “Cảm ơn bạn đã đánh giá buổi tập”

==================================================
8. YÊU CẦU CUỐI
==================================================

- Giữ theme đen đỏ hiện đại
- Không tạo route/sidebar mới cho đổi lịch, hủy lịch, đánh giá
- Tất cả thao tác nằm trong trang “Lịch tập của tôi”
- Modal phải rõ ràng, dễ dùng
- Validate đầy đủ
- Calendar phải cập nhật ngay sau thao tác
- Không làm mất chức năng đặt lịch mới hiện có
- Không làm mất chức năng xem chi tiết buổi tập
- Dữ liệu mẫu bằng tiếng Việt
- Không dùng lorem ipsum