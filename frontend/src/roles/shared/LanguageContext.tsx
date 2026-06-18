import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { getCurrentUserSettings, updateCurrentUserLanguagePreference } from '../../services/userProfileApi';

export type AppLanguage = 'en' | 'vi';

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (text: string) => string;
};

const STORAGE_KEY = 'gymster-language';

const DICTIONARY: Record<string, string> = {
  'Admin Portal': 'Cổng quản trị',
  'Owner Portal': 'Cổng chủ phòng tập',
  'Staff Portal': 'Cổng nhân viên',
  'PT Portal': 'Cổng PT',
  'Member Portal': 'Cổng hội viên',
  'Executive Dashboard': 'Bảng điều hành',
  'Revenue Analytics': 'Phân tích doanh thu',
  'Membership Analytics': 'Phân tích hội viên',
  'Staff & Trainer Management': 'Quản lý nhân viên & huấn luyện viên',
  'Employee Scheduling': 'Lịch làm việc nhân viên',
  'Performance Evaluation': 'Đánh giá hiệu suất',
  'Payroll / Salary Slip': 'Bảng lương / Phiếu lương',
  'Equipment Management': 'Quản lý thiết bị',
  'Maintenance Reports': 'Báo cáo bảo trì',
  'Maintenance Tracking': 'Theo dõi bảo trì',
  'Feedback & Satisfaction': 'Phản hồi & báo cáo',
  'Feedback & Report': 'Phản hồi & báo cáo',
  'Reports & Statistics': 'Báo cáo & thống kê',
  'Packages & Payments': 'Gói tập & thanh toán',
  Dashboard: 'Bảng điều khiển',
  'Add Member': 'Thêm hội viên',
  'Member List': 'Danh sách hội viên',
  'Daily Check-in': 'Check-in hằng ngày',
  'Renew Package': 'Gia hạn gói',
  'Usage History': 'Lịch sử sử dụng',
  'Feedback Management': 'Quản lý phản hồi',
  'Equipment Status': 'Tình trạng thiết bị',
  Settings: 'Cài đặt',
  'Manage Trainees': 'Quản lý học viên',
  'Schedule & Progress': 'Lịch tập & tiến độ',
  'Workout Guidance': 'Hướng dẫn bài tập',
  'My Package': 'Gói tập của tôi',
  'My Schedule': 'Lịch tập của tôi',
  Trainers: 'Huấn luyện viên',
  'Rate Service': 'Đánh giá dịch vụ',
  Profile: 'Hồ sơ',
  Logout: 'Đăng xuất',
  Search: 'Tìm kiếm',
  'Search...': 'Tìm kiếm...',
  'Search members, packages, invoices...': 'Tìm hội viên, gói tập, hóa đơn...',
  'Search trainees, schedules...': 'Tìm học viên, lịch tập...',
  'Search equipment...': 'Tìm thiết bị...',
  'Search staff...': 'Tìm nhân viên...',
  Notifications: 'Thông báo',
  'Mark all as read': 'Đánh dấu tất cả đã đọc',
  'Mark as read': 'Đánh dấu đã đọc',
  'See all': 'Xem tất cả',
  All: 'Tất cả',
  Unread: 'Chưa đọc',
  'View Details': 'Xem chi tiết',
  'View All': 'Xem tất cả',
  'Add Trainee': 'Thêm học viên',
  'Create Workout Plan': 'Tạo giáo án',
  'Update Progress': 'Cập nhật tiến độ',
  'Evaluate Member': 'Đánh giá hội viên',
  'Add Schedule': 'Thêm lịch',
  'Create Schedule': 'Tạo lịch',
  'Edit Schedule': 'Sửa lịch',
  'Delete Schedule': 'Xóa lịch',
  Delete: 'Xóa',
  Update: 'Cập nhật',
  'Remove Assignment': 'Xóa phân công',
  Cancel: 'Hủy',
  Confirm: 'Xác nhận',
  Save: 'Lưu',
  Edit: 'Sửa',
  Add: 'Thêm',
  Remove: 'Xóa',
  'Save Evaluation': 'Lưu đánh giá',
  'Save Progress': 'Lưu tiến độ',
  'Confirm Assignment': 'Xác nhận phân công',
  'Add New Trainee': 'Thêm học viên mới',
  'Search members by name or ID...': 'Tìm hội viên theo tên hoặc mã...',
  Package: 'Gói tập',
  'Assignment Date': 'Ngày phân công',
  Trainee: 'Học viên',
  'Training Date': 'Ngày tập',
  'Training Time': 'Giờ tập',
  'Exercise Type': 'Loại bài tập',
  'Duration (minutes)': 'Thời lượng (phút)',
  'Training Session': 'Buổi tập',
  'Recorded Date': 'Ngày ghi nhận',
  'Completion Level': 'Mức hoàn thành',
  Note: 'Ghi chú',
  'PT PROFILE': 'Hồ sơ PT',
  'PT Profile': 'Hồ sơ PT',
  'Personal Information': 'Thông tin cá nhân',
  'First name': 'Tên',
  'Last name': 'Họ',
  Role: 'Vai trò',
  Dob: 'Ngày sinh',
  Specialty: 'Chuyên môn',
  Experience: 'Kinh nghiệm',
  Headlines: 'Tiêu đề hồ sơ',
  'Contact info': 'Thông tin liên hệ',
  'Email addresses': 'Địa chỉ email',
  'Primary email': 'Email chính',
  'Add email address': 'Thêm địa chỉ email',
  'Phone numbers': 'Số điện thoại',
  'Save Contact Info': 'Lưu thông tin liên hệ',
  'Change Password': 'Đổi mật khẩu',
  'Current Password': 'Mật khẩu hiện tại',
  'New Password': 'Mật khẩu mới',
  'Confirm New Password': 'Xác nhận mật khẩu mới',
  'Update Password': 'Cập nhật mật khẩu',
  Display: 'Hiển thị',
  'Dark mode': 'Chế độ tối',
  'Working Hours': 'Giờ làm việc',
  'Save Working Hours': 'Lưu giờ làm việc',
  'Trainer Certificate': 'Chứng chỉ huấn luyện viên',
  'Drag and drop a file or click to upload': 'Kéo thả file hoặc nhấn để tải lên',
  Uploaded: 'Đã tải lên',
  'Notification Preferences': 'Tùy chọn thông báo',
  'Membership Expiring Alerts': 'Cảnh báo gói sắp hết hạn',
  'Session Reminders': 'Nhắc lịch buổi tập',
  'Progress Updates': 'Cập nhật tiến độ',
  'Language Preferences': 'Tùy chọn ngôn ngữ',
  English: 'Tiếng Anh',
  Vietnamese: 'Tiếng Việt',
  'Save Profile': 'Lưu hồ sơ',
  'Profile Information': 'Thông tin hồ sơ',
  'Full Name': 'Họ và tên',
  Email: 'Email',
  'Phone Number': 'Số điện thoại',
  'Email Notifications': 'Thông báo qua email',
  'New Feedback Notifications': 'Thông báo phản hồi mới',
  'Equipment Issue Alerts': 'Cảnh báo sự cố thiết bị',
  'Payment Completed': 'Thanh toán hoàn tất',
  'Staff Account Permissions': 'Quyền tài khoản nhân viên',
  'Owner Account': 'Tài khoản chủ phòng tập',
  'Staff Account': 'Tài khoản nhân viên',
  'Owner Profile': 'Hồ sơ chủ phòng tập',
  'Staff Profile': 'Hồ sơ nhân viên',
  'Member Profile': 'Hồ sơ hội viên',
  'Member Account': 'Tài khoản hội viên',
  'Gym Owner': 'Chủ phòng tập',
  'Gym Member': 'Hội viên phòng tập',
  'Management Staff': 'Nhân viên quản lý',
  Owner: 'Chủ phòng tập',
  'Email and phone number are edited in Settings.': 'Email và số điện thoại được chỉnh sửa trong Cài đặt.',
  'Managing gym operations, staff performance, memberships, and business growth.':
    'Quản lý vận hành phòng tập, hiệu suất nhân viên, hội viên và tăng trưởng kinh doanh.',
  'Supporting daily gym operations, member services, payment workflows, and equipment issue handling.':
    'Hỗ trợ vận hành hằng ngày, dịch vụ hội viên, quy trình thanh toán và xử lý sự cố thiết bị.',
  'Account Permissions': 'Quyền tài khoản',
  'Manage owner-level preferences, password, display mode, language, and contact information for the gym account.':
    'Quản lý tùy chọn cấp chủ phòng tập, mật khẩu, giao diện, ngôn ngữ và thông tin liên hệ cho tài khoản phòng tập.',
  'Manage notification preferences, password, display mode, language, and contact information for the staff account.':
    'Quản lý tùy chọn thông báo, mật khẩu, giao diện, ngôn ngữ và thông tin liên hệ cho tài khoản nhân viên.',
  'Permission changes are managed by the system administrator. Contact support if this account needs a role update.':
    'Thay đổi quyền được quản lý bởi quản trị hệ thống. Hãy liên hệ hỗ trợ nếu tài khoản này cần cập nhật vai trò.',
  'Receive important account and operation updates via email':
    'Nhận các cập nhật quan trọng về tài khoản và vận hành qua email',
  'Turn off to use the light interface with blue as the primary color.':
    'Tắt để dùng giao diện sáng với xanh dương làm màu chủ đạo.',
  'Use English across the system': 'Sử dụng tiếng Anh cho toàn hệ thống',
  'Search packages, workouts, trainers...': 'Tìm gói tập, buổi tập, huấn luyện viên...',
  'Member Dashboard': 'Bảng điều khiển hội viên',
  'Current Package': 'Gói hiện tại',
  'Current package': 'Gói hiện tại',
  'No active package': 'Chưa có gói tập đang hoạt động',
  'Dashboard data could not be fully loaded.': 'Không thể tải đầy đủ dữ liệu dashboard.',
  'Monthly Workouts': 'Buổi tập trong tháng',
  'Completed Sessions': 'Buổi đã hoàn thành',
  'Days Remaining': 'Số ngày còn lại',
  'Used:': 'Đã dùng:',
  'Remaining:': 'Còn lại:',
  'Upcoming Workout': 'Buổi tập sắp tới',
  'Workout session': 'Buổi tập',
  'Add workout': 'Thêm buổi tập',
  'Create a personal workout outside your fixed PT schedule.': 'Tạo buổi tập cá nhân ngoài lịch PT cố định.',
  Date: 'Ngày',
  'Start time': 'Giờ bắt đầu',
  'End time': 'Giờ kết thúc',
  'Workout details': 'Chi tiết buổi tập',
  'Personal workout': 'Buổi tập cá nhân',
  'Example: Evening cardio': 'Ví dụ: Cardio buổi tối',
  'End time must be later than start time.': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'Enter the workout date, start time, and end time.': 'Vui lòng nhập ngày, giờ bắt đầu và giờ kết thúc.',
  'This time overlaps your fixed PT schedule. Choose another time.': 'Thời gian này trùng với lịch PT cố định. Vui lòng chọn thời gian khác.',
  'The workout could not be created.': 'Không thể tạo buổi tập.',
  Creating: 'Đang tạo',
  Close: 'Đóng',
  Add: 'Thêm',
  'Your workout sessions will appear in the schedule screen.': 'Các buổi tập sẽ hiển thị trong màn hình lịch tập.',
  'Your package has': 'Gói tập của bạn còn',
  'days remaining. Renew soon to avoid interrupted access.': 'ngày. Vui lòng gia hạn sớm để không bị gián đoạn truy cập.',
  'Package renewal required': 'Cần gia hạn gói tập',
  'Your package has expired or is not active. Renew or register a new package to continue using the system.':
    'Gói tập của bạn đã hết hạn hoặc chưa được kích hoạt. Vui lòng gia hạn hoặc đăng ký gói tập mới để tiếp tục sử dụng hệ thống.',
  'Renew / register package': 'Gia hạn / đăng ký gói tập',
  'Your trainer information': 'Thông tin PT của bạn',
  'Specialty:': 'Chuyên môn:',
  'Rating:': 'Đánh giá:',
  'Schedule:': 'Lịch tập:',
  'Book Workout': 'Đặt lịch tập',
  'Renew Package': 'Gia hạn gói',
  'View Trainers': 'Xem huấn luyện viên',
  'Buy / Renew / Upgrade': 'Mua / gia hạn / nâng cấp',
  Payment: 'Thanh toán',
  'Transaction History': 'Lịch sử giao dịch',
  'Workout Calendar': 'Lịch tập',
  'View Detail': 'Xem chi tiết',
  Reschedule: 'Đổi lịch',
  'Send Feedback': 'Gửi phản hồi',
  'Submit Feedback': 'Gửi đánh giá',
  'Register Package': 'Đăng ký gói',
  'Create Invoice': 'Tạo hóa đơn',
  'View Reports': 'Xem báo cáo',
  'Add Equipment': 'Thêm thiết bị',
  'Submit Report': 'Gửi báo cáo',
  'Create Payslip': 'Tạo phiếu lương',
  'Add Evaluation': 'Thêm đánh giá',
  'Select Package': 'Chọn gói',
  'Select Payment Method': 'Chọn phương thức thanh toán',
  'Confirm Payment': 'Xác nhận thanh toán',
  'Print Receipt': 'In biên lai',
  'Download PDF': 'Tải PDF',
  'Export Invoice': 'Xuất hóa đơn',
  'New Registration': 'Đăng ký mới',
  'SELECT PACKAGE': 'CHỌN GÓI',
  'SELECT MEMBER': 'CHỌN HỘI VIÊN',
  PAYMENT: 'THANH TOÁN',
  'SELECT YOUR PACKAGE': 'CHỌN GÓI TẬP CỦA BẠN',
  SELECTED: 'ĐÃ CHỌN',
  'SELECT THIS PACKAGE': 'CHỌN GÓI NÀY',
  CONTINUE: 'TIẾP TỤC',
  Back: 'Quay lại',
  'Change Member': 'Đổi hội viên',
  'PAYMENT METHOD': 'PHƯƠNG THỨC THANH TOÁN',
  'CREDIT CARD INFORMATION': 'THÔNG TIN THẺ TÍN DỤNG',
  'BANK ACCOUNT INFORMATION': 'THÔNG TIN TÀI KHOẢN',
  'SELECT E-WALLET': 'CHỌN VÍ ĐIỆN TỬ',
  'CASH PAYMENT': 'THANH TOÁN TIỀN MẶT',
  PROCESSING: 'ĐANG XỬ LÝ',
  'CONFIRM PAYMENT': 'XÁC NHẬN THANH TOÁN',
  'Select Trainee': 'Chọn học viên',
  'Evaluation Date': 'Ngày đánh giá',
  Excellent: 'Xuất sắc',
  Goal: 'Mục tiêu',
  Intensity: 'Cường độ',
  'Technique Note': 'Ghi chú kỹ thuật',
  Sets: 'Hiệp',
  Reps: 'Lần',
  Rest: 'Nghỉ',
  'Rest (s)': 'Nghỉ (giây)',
  Easy: 'Dễ',
  Medium: 'Trung bình',
  Hard: 'Khó',
  'Very Hard': 'Rất khó',
  Active: 'Hoạt động',
  Paused: 'Tạm dừng',
  Completed: 'Hoàn thành',
  Scheduled: 'Đã lên lịch',
  Done: 'Đã xong',
  Cancelled: 'Đã hủy',
  'In Progress': 'Đang thực hiện',
  Overdue: 'Quá hạn',
  'Search Criteria': 'Tiêu chí tìm kiếm',
  'Search Results': 'Kết quả tìm kiếm',
  'No Results Found': 'Không tìm thấy kết quả',
  'Assign Shift': 'Phân ca',
  Export: 'Xuất',
  Incomplete: 'Chưa hoàn thành',
  Overview: 'Tổng quan',
  Progress: 'Tiến độ',
  Evaluation: 'Đánh giá',
  'Member ID': 'Mã học viên',
  Status: 'Trạng thái',
  'Remaining Sessions': 'Buổi còn lại',
  'Select a trainee to open their member profile.': 'Chọn một học viên để mở trang thông tin cá nhân.',
  'No workout session': 'Không có buổi tập',
  'No workout sessions found.': 'Không tìm thấy buổi tập.',
  'Current Meal Plans': 'Thực đơn hiện tại',
  'No current meal plan assigned.': 'Chưa có thực đơn hiện tại.',
  'Medical History': 'Lịch sử y tế',
  'Request Medical History': 'Yêu cầu lịch sử y tế',
  'Medical history request sent to member.': 'Đã gửi yêu cầu lịch sử y tế tới hội viên.',
  'Medical history request could not be sent.': 'Không thể gửi yêu cầu lịch sử y tế.',
  'No medical history available for this member.': 'Hội viên chưa có thông tin lịch sử y tế.',
  'Body Metrics': 'Chỉ số cơ thể',
  'No body metrics available for this member.': 'Hội viên chưa có chỉ số cơ thể.',
  Height: 'Chiều cao',
  Weight: 'Cân nặng',
  'Body fat': 'Mỡ cơ thể',
  'Blood pressure': 'Huyết áp',
  'Resting heart rate': 'Nhịp tim khi nghỉ',
  'Fitness goal': 'Mục tiêu thể chất',
  'Latest measurement': 'Lần đo gần nhất',
  Injuries: 'Chấn thương',
  'Medication notes': 'Ghi chú thuốc',
  'Training restrictions': 'Giới hạn tập luyện',
  'Emergency contact': 'Liên hệ khẩn cấp',
  'Last updated': 'Cập nhật lần cuối',
  'Completed sessions': 'Số buổi đã hoàn thành',
  'Attendance rate': 'Tỷ lệ chuyên cần',
  'Current goal': 'Mục tiêu hiện tại',
  'Current goal updated.': 'Đã cập nhật mục tiêu hiện tại.',
  'Current goal could not be updated.': 'Không thể cập nhật mục tiêu hiện tại.',
  'Weight Loss': 'Giảm cân',
  Chest: 'Ngực',
  Back: 'Lưng',
  Shoulders: 'Vai',
  Arms: 'Tay',
  Core: 'Cơ lõi',
  Legs: 'Chân',
  Mobility: 'Linh hoạt',
  Endurance: 'Sức bền',
  'CREATE NEW WORKOUT': 'TẠO WORKOUT MỚI',
  'Add exercise': 'Thêm bài tập',
  'Add the first exercise': 'Thêm bài tập đầu tiên',
  'Enter a workout name.': 'Vui lòng nhập tên workout.',
  'Add at least one exercise.': 'Workout cần có ít nhất một bài tập.',
  'Enter a name for every exercise.': 'Vui lòng nhập tên cho tất cả bài tập.',
  'Exercise name': 'Tên bài tập',
  'Muscle group': 'Nhóm cơ',
  Difficulty: 'Độ khó',
  'Technique instruction': 'Hướng dẫn kỹ thuật',
  'Workout name': 'Tên workout',
  'General notes': 'Ghi chú chung',
  'Example: Upper Body Strength': 'Ví dụ: Sức mạnh thân trên',
  Mark: 'Đánh dấu',
  'Mark Completed': 'Đánh dấu hoàn thành',
  'Mark Incomplete': 'Đánh dấu chưa hoàn thành',
  'Complete medical history': 'Nhập lịch sử y tế',
  'Medical history required': 'Yêu cầu lịch sử y tế',
  'Medical history submitted': 'Đã gửi lịch sử y tế',
  'Share relevant information so your trainer can prepare a safe workout plan.': 'Chia sẻ thông tin cần thiết để PT chuẩn bị giáo án an toàn.',
  'Existing conditions': 'Tình trạng bệnh hiện có',
  'Current injuries': 'Chấn thương hiện tại',
  Allergies: 'Dị ứng',
  Medications: 'Thuốc đang sử dụng',
  'Emergency and safety notes': 'Ghi chú khẩn cấp và an toàn',
  'Training clearance': 'Điều kiện tập luyện',
  'Not specified': 'Chưa xác định',
  'Cleared for training': 'Đủ điều kiện tập luyện',
  'Training restrictions apply': 'Có giới hạn tập luyện',
  'Not cleared for training': 'Chưa đủ điều kiện tập luyện',
  'Submit medical history': 'Gửi lịch sử y tế',
  Submitting: 'Đang gửi',
  'Medical history submitted successfully.': 'Đã gửi lịch sử y tế thành công.',
  'Medical history could not be submitted.': 'Không thể gửi lịch sử y tế.',
  Breakfast: 'Bữa sáng',
  Lunch: 'Bữa trưa',
  Dinner: 'Bữa tối',
  Snacks: 'Bữa phụ',
  'Not set': 'Chưa thiết lập',
  'Total assignments': 'Tổng phân công',
  'Active trainees': 'Đang hoạt động',
  'Paused trainees': 'Tạm dừng',
  'Completed trainees': 'Hoàn thành',
  'Search by name, phone number, or member ID...': 'Tìm theo tên, số điện thoại, mã học viên...',
  'No trainees found': 'Không tìm thấy học viên nào',
  Age: 'Tuổi',
  Phone: 'Điện thoại',
  'Join date': 'Ngày tham gia',
  'Overall progress': 'Tiến độ tổng thể',
  'Training goals': 'Mục tiêu tập luyện',
  'No goals yet': 'Chưa có mục tiêu nào',
  'Body metrics': 'Chỉ số cơ thể',
  'No data yet': 'Chưa có dữ liệu',
  'Evaluation history': 'Lịch sử đánh giá',
  Strengths: 'Điểm mạnh',
  Improvements: 'Cần cải thiện',
  Recommendation: 'Khuyến nghị',
  'No evaluations yet': 'Chưa có đánh giá nào',
  'Track member schedules and update content for each workout session.': 'Theo dõi lịch tập của member và cập nhật nội dung cho từng buổi tập.',
  'Assigned members': 'Member đang phụ trách',
  'All members': 'Tất cả member',
  'sessions displayed': 'buổi tập đang hiển thị',
  'No workout sessions for the current filter.': 'Không có buổi tập cho bộ lọc hiện tại.',
  'Open calendar day': 'Mở lịch ngày',
  'Choose a prepared workout': 'Chọn giáo án đã chuẩn bị',
  'Enter content manually': 'Nhập nội dung thủ công',
  'This workout session is empty. Enter content or choose a workout.': 'Buổi tập hiện đang trống. Hãy nhập nội dung hoặc chọn giáo án.',
  Updating: 'Đang cập nhật',
  'Update content & notify member': 'Cập nhật nội dung & thông báo member',
  'Create reusable workouts for quickly updating workout sessions.': 'Tạo bộ giáo án để sử dụng nhanh khi cập nhật nội dung buổi tập.',
  'Workout list': 'Danh sách workout',
  'Workout goal': 'Mục tiêu',
  'Start date': 'Ngày bắt đầu',
  'End date': 'Ngày kết thúc',
  'Cancel edit': 'Hủy chỉnh sửa',
  Saving: 'Đang lưu',
  'Save changes': 'Lưu thay đổi',
  'Save workout': 'Lưu workout',
  'Total exercises': 'Tổng bài tập',
  'Total sets': 'Tổng sets',
  'Average rest time': 'Thời gian nghỉ TB',
  'Created workouts': 'Danh sách workout đã tạo',
  'View details, edit, or delete reusable workouts.': 'Xem chi tiết, chỉnh sửa hoặc xóa bộ giáo án.',
  'Loading workouts...': 'Đang tải workout...',
  'Reusable workout': 'Bộ giáo án dùng lại',
  'No goal yet.': 'Chưa có mục tiêu.',
  Details: 'Chi tiết',
  'Confirm delete': 'Xác nhận xóa',
  'No workouts created yet.': 'Chưa có workout nào được tạo.',
  'Edit this workout': 'Chỉnh sửa workout này',
  'Workout content': 'Nội dung buổi tập',
  'Meal Plan Templates and Assignments': 'Mẫu thực đơn và phân công',
  'Notification center': 'Trung tâm thông báo',
  'Review package, payment, workout, equipment, and other important updates.': 'Xem các cập nhật quan trọng về gói tập, thanh toán, buổi tập, thiết bị và hoạt động khác.',
  Total: 'Tổng',
  Warnings: 'Cảnh báo',
  Errors: 'Lỗi',
  'No notifications.': 'Không có thông báo.',
  'No unread notifications.': 'Không có thông báo chưa đọc.',
  'Collapse sidebar': 'Thu gọn sidebar',
  'Expand sidebar': 'Mở rộng sidebar',
  'This notification has been recorded. Open the related module for more details.': 'Thông báo này đã được ghi nhận. Mở module liên quan để xem chi tiết.',
  'Workout session content updated': 'Nội dung buổi tập đã được cập nhật',
  'now has workout content from your trainer.': 'đã được PT bổ sung nội dung.',
  'Open your schedule to view the details.': 'Mở lịch tập để xem chi tiết.',
  'Your trainer requested your medical history. Complete the form so your training plan can be prepared safely.': 'PT yêu cầu bạn nhập lịch sử y tế. Hãy hoàn thành biểu mẫu để giáo án được chuẩn bị an toàn.',
  'A member has submitted updated medical history. Open the member profile to review it.': 'Một hội viên đã gửi lịch sử y tế mới. Mở hồ sơ hội viên để xem.',
  'Leave blank when there is nothing to report': 'Để trống nếu không có thông tin cần khai báo',

  // Public & Auth Page Translations
  'Home': 'Trang chủ',
  'Packages': 'Gói tập',
  'Trainers': 'Huấn luyện viên',
  'Services': 'Dịch vụ',
  'About Us': 'Về chúng tôi',
  'Contact': 'Liên hệ',
  'Login': 'Đăng nhập',
  'Register': 'Đăng ký',
  'Register Now': 'Đăng ký ngay',
  'Create Account': 'Tạo tài khoản',
  'Forgot Password?': 'Quên mật khẩu?',
  'Forgot Password': 'Quên mật khẩu',
  'Reset Password': 'Đặt lại mật khẩu',
  'Back to Home': 'Về trang chủ',
  'Go Back': 'Quay lại',
  'Show': 'Xem',
  'Hide': 'Ẩn',
  'or': 'hoặc',
  'Email Address': 'Địa chỉ Email',
  'Enter your email': 'Nhập email của bạn',
  'Sending...': 'Đang gửi...',
  'Sent': 'Đã gửi',
  'Send Code': 'Gửi mã',
  'Verification code (6 digits)': 'Mã xác thực (6 chữ số)',
  'Verifying...': 'Đang xác thực...',
  'Continue': 'Tiếp tục',
  'New Password': 'Mật khẩu mới',
  'Enter new password': 'Nhập mật khẩu mới',
  'Confirm New Password': 'Xác nhận mật khẩu mới',
  'Re-enter new password': 'Nhập lại mật khẩu mới',
  'Updating...': 'Đang cập nhật...',
  'Update Password': 'Cập nhật mật khẩu',
  'Welcome Back': 'Chào mừng trở lại',
  'Log in with your Gymster username or email': 'Đăng nhập bằng tên đăng nhập hoặc email Gymster của bạn',
  'Username or email': 'Tên đăng nhập hoặc email',
  'Remember login': 'Ghi nhớ đăng nhập',
  'Don\'t have an account?': 'Chưa có tài khoản?',
  'At least 6 characters': 'Tối thiểu 6 ký tự',
  'Vui lòng nhập địa chỉ email.': 'Vui lòng nhập địa chỉ email.',
  'Mã xác thực đã được gửi.': 'Mã xác thực đã được gửi.',
  'Mã xác thực phải gồm 6 chữ số.': 'Mã xác thực phải gồm 6 chữ số.',
  'Mật khẩu mới phải từ 6 ký tự trở lên.': 'Mật khẩu mới phải từ 6 ký tự trở lên.',
  'Mật khẩu xác nhận không trùng khớp.': 'Mật khẩu xác nhận không trùng khớp.',

  // RegisterPage translations
  'Create Member Account': 'Tạo tài khoản hội viên',
  'Create your Gymster account first, then complete package, trainer, and payment setup in onboarding.': 'Tạo tài khoản Gymster trước, sau đó hoàn thành gói tập, PT và thanh toán khi đăng ký.',
  'Account Information': 'Thông tin tài khoản',
  'Select gender': 'Chọn giới tính',
  'Male': 'Nam',
  'Female': 'Nữ',
  'Gender': 'Giới tính',
  'Date of birth': 'Ngày sinh',
  'Phone number': 'Số điện thoại',
  'Confirm password': 'Xác nhận mật khẩu',
  'Verify and Create Account': 'Xác thực và Tạo tài khoản',
  'Edit registration info': 'Sửa thông tin đăng ký',
  'Back to login': 'Quay lại đăng nhập',
  'Already have an account?': 'Đã có tài khoản?',
  'Verification code': 'Mã xác thực',
  'Email Verification': 'Xác thực Email',
  'Enter the 6-digit code sent to': 'Nhập mã xác thực gồm 6 chữ số đã được gửi tới',
  'Your account will only be created after this code is confirmed.': 'Tài khoản của bạn chỉ được tạo sau khi mã xác nhận được xác thực.',
  'Resend code': 'Gửi lại mã',

  // LandingPage translations
  'Fitness Management Platform': 'Nền tảng quản lý phòng gym',
  'Gym Management Platform': 'Nền tảng quản lý phòng gym',
  'Premium fitness platform': 'Nền tảng fitness cao cấp',
  'Premium Fitness Platform': 'Nền tảng fitness cao cấp',
  'Nền tảng fitness cao cấp': 'Nền tảng fitness cao cấp',
  'Transform your gym experience with real operational data: members, trainers, packages, payments, and maintenance are all in one system.': 'Chuyển đổi trải nghiệm phòng tập bằng dữ liệu vận hành thực tế: hội viên, PT, gói tập, thanh toán và bảo trì đều nằm trong một hệ thống.',
  'Join Now': 'Tham gia ngay',
  'View Packages': 'Xem gói tập',
  'Members': 'Hội viên',
  'Data security and easy scalability according to gym size': 'An toàn dữ liệu và dễ mở rộng theo quy mô phòng tập',
  'Why Choose Gymster?': 'Tại sao chọn Gymster?',
  'Optimized for modern gym operational needs': 'Tối ưu hóa cho nhu cầu vận hành của phòng gym hiện đại',
  'Member Management': 'Quản lý hội viên',
  'Track profiles, packages, schedules, and payment status in one system.': 'Theo dõi hồ sơ, gói tập, lịch tập và trạng thái thanh toán trong một hệ thống.',
  'Book PT': 'Đặt lịch PT',
  'Connect members with trainers and update workout progress.': 'Kết nối hội viên với huấn luyện viên và cập nhật tiến độ tập luyện.',
  'Equipment Maintenance': 'Bảo trì thiết bị',
  'Receive reports from staff and track the status of each piece of equipment.': 'Nhận report từ nhân viên và theo dõi trạng thái xử lý của từng thiết bị.',
  'Operational Reports': 'Báo cáo vận hành',
  'Summarize revenue, members, staff, and feedback based on system data.': 'Tổng hợp doanh thu, hội viên, nhân sự và phản hồi dựa trên dữ liệu hệ thống.',
  'Gym Packages': 'Các gói tập phòng gym',
  'Flexible options to suit every training need': 'Lựa chọn linh hoạt phù hợp với mọi nhu cầu tập luyện',
  'Select package': 'Chọn gói tập',
  'Month': 'tháng',
  'months': 'tháng',
  'Professional Trainers': 'Đội ngũ huấn luyện viên chuyên nghiệp',
  'Ready to support you in achieving your fitness goals': 'Sẵn sàng đồng hành giúp bạn đạt mục tiêu hình thể',
  'Active Members': 'Hội viên hoạt động',
  'Certified PTs': 'PT đạt chứng chỉ',
  'Equipment Units': 'Thiết bị tập luyện',
  'Rating': 'Đánh giá trung bình',
  'Experience': 'Kinh nghiệm',
  'Specialty': 'Chuyên môn',
  'Connect with Gymster': 'Kết nối với Gymster',
  'Ready to transform your gym operations?': 'Sẵn sàng chuyển đổi quy trình vận hành phòng gym của bạn?',
  'Register an account today or contact us for detailed consultation.': 'Đăng ký tài khoản ngay hôm nay hoặc liên hệ với chúng tôi để được tư vấn chi tiết.',
  'Contact consultation': 'Liên hệ tư vấn',
  'Gym management software': 'Phần mềm quản lý phòng gym',
  'Gymster - All rights reserved.': 'Gymster - Bảo lưu mọi quyền.',

  // Settings translations
  'Use Vietnamese across the system': 'Sử dụng tiếng Việt cho toàn hệ thống',
};

const VI_TO_EN = Object.fromEntries(Object.entries(DICTIONARY).map(([en, vi]) => [vi, en]));
const PROTECTED_PATTERNS = [/^GYMSTER$/i, /^GYMX$/i];

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
  const currentUser = getCurrentUser();
  const userLanguage = currentUser?.preferredLanguage || currentUser?.preferred_language;
  if (userLanguage === 'vi' || userLanguage === 'en') return userLanguage;
  return window.localStorage.getItem(STORAGE_KEY) === 'vi' ? 'vi' : 'en';
}

function preserveWrap(original: string, translated: string) {
  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}

function translateText(text: string, language: AppLanguage) {
  const trimmed = text.trim();
  if (!trimmed || PROTECTED_PATTERNS.some((pattern) => pattern.test(trimmed))) return text;

  const fromMap = language === 'vi' ? DICTIONARY : VI_TO_EN;
  const exact = fromMap[trimmed];
  if (exact) return preserveWrap(text, exact);

  let translated = trimmed;
  for (const [source, target] of Object.entries(fromMap).sort((a, b) => b[0].length - a[0].length)) {
    if (translated.includes(source)) {
      translated = translated.split(source).join(target);
    }
  }

  return translated === trimmed ? text : preserveWrap(text, translated);
}

function translateElement(root: HTMLElement, language: AppLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'svg', 'path', 'textarea', 'input'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('[data-i18n-fixed]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
  textNodes.forEach((node) => {
    const nextValue = translateText(node.nodeValue ?? '', language);
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  });

  root.querySelectorAll<HTMLElement>('[placeholder], [aria-label], [title], [alt]').forEach((element) => {
    if (element.closest('[data-i18n-fixed]')) return;
    ['placeholder', 'aria-label', 'title', 'alt'].forEach((attr) => {
      const value = element.getAttribute(attr);
      if (!value) return;
      const nextValue = translateText(value, language);
      if (nextValue !== value) element.setAttribute(attr, nextValue);
    });
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
    const currentUser = getCurrentUser();
    if (currentUser) {
      const nextUser = {
        ...currentUser,
        preferredLanguage: nextLanguage,
        preferred_language: nextLanguage,
      };
      setCurrentUser(nextUser);
      void updateCurrentUserLanguagePreference(nextUser, nextLanguage);
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    const userLanguage = currentUser?.preferredLanguage || currentUser?.preferred_language;
    if ((userLanguage === 'vi' || userLanguage === 'en') && userLanguage !== language) {
      setLanguageState(userLanguage);
      window.localStorage.setItem(STORAGE_KEY, userLanguage);
      document.documentElement.lang = userLanguage;
    }

    let isMounted = true;
    if (currentUser) {
      void getCurrentUserSettings(currentUser).then((result) => {
        const savedLanguage = result.data?.preferredLanguage;
        if (!isMounted || (savedLanguage !== 'vi' && savedLanguage !== 'en') || savedLanguage === language) return;
        setLanguageState(savedLanguage);
        window.localStorage.setItem(STORAGE_KEY, savedLanguage);
        document.documentElement.lang = savedLanguage;
        setCurrentUser({
          ...currentUser,
          preferredLanguage: savedLanguage,
          preferred_language: savedLanguage,
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (text: string) => translateText(text, language).trim(),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

export function useRoleTranslationEffect(ref: RefObject<HTMLElement>) {
  const { language } = useLanguage();

  useEffect(() => {
    if (!ref.current) return undefined;
    const root = ref.current;
    translateElement(root, language);

    const observer = new MutationObserver(() => {
      translateElement(root, language);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'],
    });

    return () => observer.disconnect();
  }, [language, ref]);
}
