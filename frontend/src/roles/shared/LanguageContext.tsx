import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
  'Feedback & Satisfaction': 'Phản hồi & mức độ hài lòng',
  'Reports & Statistics': 'Báo cáo & thống kê',
  'Packages & Payments': 'Gói tập & thanh toán',
  Dashboard: 'Bảng điều khiển',
  'Add Member': 'Thêm hội viên',
  'Member List': 'Danh sách hội viên',
  'Renew Package': 'Gia hạn gói',
  'Usage History': 'Lịch sử sử dụng',
  'Feedback Management': 'Quản lý phản hồi',
  'Equipment Status': 'Tình trạng thiết bị',
  Settings: 'Cài đặt',
  'Manage Trainees': 'Quản lý học viên',
  'Schedule & Progress': 'Lịch tập & tiến độ',
  'Workout Guidance': 'Hướng dẫn bài tập',
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
  'Gym Owner': 'Chủ phòng tập',
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
};

const VI_TO_EN = Object.fromEntries(Object.entries(DICTIONARY).map(([en, vi]) => [vi, en]));
const PROTECTED_PATTERNS = [/^GYMSTER$/i, /^GYMX$/i];

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';
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
  };

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
