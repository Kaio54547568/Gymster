import { useState } from "react";
import {
  LayoutDashboard, Users, CalendarDays, Dumbbell, BarChart2,
  Bell, Settings, LogOut, Search, Plus, Edit2, Trash2, Eye,
  X, ChevronRight, TrendingUp, Clock, Award,
  Activity, ArrowLeft, CheckCircle, AlertTriangle,
  User, Phone, Mail, Lock, Camera, Star,
  Info, Zap, Target
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Screen =
  | "dashboard"
  | "trainees"
  | "member-detail"
  | "schedule"
  | "workout"
  | "evaluation"
  | "notifications"
  | "settings";

type AssignmentStatus = "Active" | "Paused" | "Completed";
type ScheduleStatus = "Scheduled" | "Done" | "Cancelled";
type GoalStatus = "In Progress" | "Completed" | "Overdue";

interface Member {
  id: string; name: string; phone: string; email: string;
  package: string; avatar: string; joinDate: string; age: number; gender: string;
}
interface TrainerAssignment {
  assignmentId: string; memberId: string; assignmentDate: string;
  status: AssignmentStatus; sessionsRemaining: number; progress: number; totalSessions: number;
}
interface TrainingSchedule {
  scheduleId: string; memberId: string; trainingDate: string;
  trainingTime: string; exerciseType: string; status: ScheduleStatus; duration: number;
}
interface ProgressRecord {
  progressId: string; memberId: string; scheduleId: string;
  recordedDate: string; completionLevel: number; note: string;
}
interface Exercise {
  exerciseId: string; exerciseName: string; sets: number; reps: number;
  restTime: number; difficulty: string; muscleGroup: string; instruction: string;
}
interface TrainingGoal {
  goalId: string; memberId: string; goalName: string; targetValue: string;
  deadline: string; status: GoalStatus; progress: number;
}
interface BodyMetric {
  metricId: string; memberId: string; weight: number; bodyFatRate: number; measuredDate: string;
}
interface ProgressEvaluation {
  evaluationId: string; memberId: string; evaluationDate: string; overallComment: string;
  strengths: string; improvements: string; recommendation: string; rating: number;
}
interface AppNotification {
  id: string; type: "info" | "warning" | "success" | "error";
  title: string; message: string; time: string; read: boolean;
}

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const TRAINER = {
  name: "Nguyễn Văn Minh", specialty: "PT Strength & Conditioning",
  phone: "0909 123 456", email: "minh.nguyen@gymfit.vn",
  experience: "5 năm", avatar: "NVM",
};

const MEMBERS: Member[] = [
  { id: "MEM001", name: "Trần Hoàng Anh", phone: "0901 234 567", email: "hoanganh@gmail.com", package: "VIP 6 tháng", avatar: "THA", joinDate: "15/01/2025", age: 28, gender: "Nam" },
  { id: "MEM002", name: "Nguyễn Minh Tuấn", phone: "0912 345 678", email: "minhtuan@gmail.com", package: "Premium 3 tháng", avatar: "NMT", joinDate: "01/02/2025", age: 32, gender: "Nam" },
  { id: "MEM003", name: "Phạm Đức Long", phone: "0923 456 789", email: "duclong@gmail.com", package: "Standard 1 tháng", avatar: "PDL", joinDate: "10/03/2025", age: 25, gender: "Nam" },
  { id: "MEM004", name: "Lê Hải Nam", phone: "0934 567 890", email: "hainam@gmail.com", package: "Premium 3 tháng", avatar: "LHN", joinDate: "20/02/2025", age: 35, gender: "Nam" },
  { id: "MEM005", name: "Võ Thị Lan", phone: "0945 678 901", email: "thilan@gmail.com", package: "VIP 6 tháng", avatar: "VTL", joinDate: "01/01/2025", age: 26, gender: "Nữ" },
];

const ASSIGNMENTS: TrainerAssignment[] = [
  { assignmentId: "ASG001", memberId: "MEM001", assignmentDate: "15/01/2025", status: "Active", sessionsRemaining: 12, progress: 75, totalSessions: 24 },
  { assignmentId: "ASG002", memberId: "MEM002", assignmentDate: "01/02/2025", status: "Active", sessionsRemaining: 8, progress: 60, totalSessions: 20 },
  { assignmentId: "ASG003", memberId: "MEM003", assignmentDate: "10/03/2025", status: "Paused", sessionsRemaining: 6, progress: 40, totalSessions: 10 },
  { assignmentId: "ASG004", memberId: "MEM004", assignmentDate: "20/02/2025", status: "Active", sessionsRemaining: 4, progress: 85, totalSessions: 24 },
  { assignmentId: "ASG005", memberId: "MEM005", assignmentDate: "01/01/2025", status: "Completed", sessionsRemaining: 0, progress: 100, totalSessions: 24 },
];

const SCHEDULES: TrainingSchedule[] = [
  { scheduleId: "SCH001", memberId: "MEM001", trainingDate: "06/05/2025", trainingTime: "07:00", exerciseType: "Strength Training", status: "Scheduled", duration: 60 },
  { scheduleId: "SCH002", memberId: "MEM002", trainingDate: "06/05/2025", trainingTime: "09:00", exerciseType: "Cardio & HIIT", status: "Scheduled", duration: 45 },
  { scheduleId: "SCH003", memberId: "MEM004", trainingDate: "06/05/2025", trainingTime: "11:00", exerciseType: "Flexibility", status: "Done", duration: 60 },
  { scheduleId: "SCH004", memberId: "MEM001", trainingDate: "07/05/2025", trainingTime: "07:00", exerciseType: "Upper Body", status: "Scheduled", duration: 60 },
  { scheduleId: "SCH005", memberId: "MEM003", trainingDate: "07/05/2025", trainingTime: "14:00", exerciseType: "Lower Body", status: "Scheduled", duration: 60 },
  { scheduleId: "SCH006", memberId: "MEM002", trainingDate: "05/05/2025", trainingTime: "09:00", exerciseType: "Core Training", status: "Done", duration: 45 },
  { scheduleId: "SCH007", memberId: "MEM004", trainingDate: "04/05/2025", trainingTime: "11:00", exerciseType: "Full Body", status: "Cancelled", duration: 60 },
  { scheduleId: "SCH008", memberId: "MEM005", trainingDate: "06/05/2025", trainingTime: "15:00", exerciseType: "Yoga & Recovery", status: "Done", duration: 50 },
];

const PROGRESS_RECORDS: ProgressRecord[] = [
  { progressId: "PR001", memberId: "MEM001", scheduleId: "SCH001", recordedDate: "06/05/2025", completionLevel: 90, note: "Hoàn thành tốt các bài tập, tăng tạ thành công" },
  { progressId: "PR002", memberId: "MEM002", scheduleId: "SCH006", recordedDate: "05/05/2025", completionLevel: 75, note: "Cần cải thiện kỹ thuật plank" },
  { progressId: "PR003", memberId: "MEM004", scheduleId: "SCH003", recordedDate: "06/05/2025", completionLevel: 95, note: "Xuất sắc, vượt mục tiêu đề ra" },
  { progressId: "PR004", memberId: "MEM001", scheduleId: "SCH001", recordedDate: "28/04/2025", completionLevel: 80, note: "Tốt, cần chú ý hơn kỹ thuật deadlift" },
];

const TRAINING_GOALS: TrainingGoal[] = [
  { goalId: "TG001", memberId: "MEM001", goalName: "Giảm 5kg trong 2 tháng", targetValue: "75kg → 70kg", deadline: "15/06/2025", status: "In Progress", progress: 60 },
  { goalId: "TG002", memberId: "MEM001", goalName: "Tăng cơ phần thân trên", targetValue: "Bench Press 80kg", deadline: "01/07/2025", status: "In Progress", progress: 45 },
  { goalId: "TG003", memberId: "MEM002", goalName: "Cải thiện sức bền", targetValue: "Chạy 10km < 60 phút", deadline: "30/05/2025", status: "In Progress", progress: 70 },
  { goalId: "TG004", memberId: "MEM004", goalName: "Tập phục hồi chấn thương", targetValue: "Phục hồi đầu gối 100%", deadline: "01/06/2025", status: "In Progress", progress: 85 },
  { goalId: "TG005", memberId: "MEM003", goalName: "Giảm mỡ bụng", targetValue: "Body fat < 18%", deadline: "30/06/2025", status: "In Progress", progress: 30 },
  { goalId: "TG006", memberId: "MEM005", goalName: "Tăng cường sức bền tim mạch", targetValue: "VO2 max > 45", deadline: "01/07/2025", status: "Completed", progress: 100 },
];

const BODY_METRICS: BodyMetric[] = [
  { metricId: "BM001", memberId: "MEM001", weight: 76.5, bodyFatRate: 22.0, measuredDate: "01/03" },
  { metricId: "BM002", memberId: "MEM001", weight: 75.2, bodyFatRate: 21.2, measuredDate: "15/03" },
  { metricId: "BM003", memberId: "MEM001", weight: 74.0, bodyFatRate: 20.5, measuredDate: "01/04" },
  { metricId: "BM004", memberId: "MEM001", weight: 73.1, bodyFatRate: 19.5, measuredDate: "15/04" },
  { metricId: "BM005", memberId: "MEM001", weight: 72.4, bodyFatRate: 18.8, measuredDate: "01/05" },
];

const EVALUATIONS: ProgressEvaluation[] = [
  { evaluationId: "EVL001", memberId: "MEM001", evaluationDate: "01/05/2025", overallComment: "Trần Hoàng Anh có tiến bộ rõ rệt trong tháng qua. Khả năng bền bỉ và kỹ thuật đã được cải thiện đáng kể.", strengths: "Kiên trì, kỹ thuật tốt, chịu khó tập luyện, thái độ tích cực", improvements: "Cần cải thiện chế độ ăn uống, ngủ đủ giấc 7-8 tiếng", recommendation: "Tăng cường bài tập cardio 3 buổi/tuần, bổ sung protein sau buổi tập", rating: 4 },
];

const NOTIFICATIONS: AppNotification[] = [
  { id: "N001", type: "success", title: "Thành viên mới được phân công", message: "Trần Hoàng Anh đã được phân công cho bạn từ hôm nay", time: "5 phút trước", read: false },
  { id: "N002", type: "warning", title: "Nhắc nhở buổi tập", message: "Buổi tập với Nguyễn Minh Tuấn lúc 09:00 hôm nay", time: "30 phút trước", read: false },
  { id: "N003", type: "error", title: "Thành viên hủy buổi tập", message: "Phạm Đức Long đã hủy buổi tập ngày 07/05/2025", time: "1 giờ trước", read: true },
  { id: "N004", type: "warning", title: "Cần cập nhật tiến độ", message: "Lê Hải Nam — buổi tập hôm qua chưa được cập nhật", time: "2 giờ trước", read: false },
  { id: "N005", type: "info", title: "Đánh giá đang chờ xử lý", message: "3 thành viên cần được đánh giá tiến độ tháng này", time: "1 ngày trước", read: true },
  { id: "N006", type: "info", title: "Chương trình tập mới", message: "Workout guidance mới cho Võ Thị Lan đã được tạo thành công", time: "2 ngày trước", read: true },
];

const INITIAL_EXERCISES: Exercise[] = [
  { exerciseId: "EX001", exerciseName: "Bench Press", sets: 4, reps: 10, restTime: 90, difficulty: "Trung bình", muscleGroup: "Ngực", instruction: "Nằm ngửa, hạ tạ xuống ngực, đẩy lên thẳng. Giữ lưng thẳng." },
  { exerciseId: "EX002", exerciseName: "Squat", sets: 4, reps: 12, restTime: 90, difficulty: "Trung bình", muscleGroup: "Đùi - Mông", instruction: "Đứng rộng bằng vai, hạ người xuống, giữ lưng thẳng, gối không vượt mũi bàn chân." },
  { exerciseId: "EX003", exerciseName: "Deadlift", sets: 3, reps: 8, restTime: 120, difficulty: "Khó", muscleGroup: "Toàn thân", instruction: "Giữ lưng thẳng, kéo tạ từ sàn lên theo đường thẳng, dồn lực vào gót." },
];

// Chart data
const WEEKLY_SESSIONS = [
  { day: "T2", sessions: 4, target: 5 },
  { day: "T3", sessions: 6, target: 5 },
  { day: "T4", sessions: 3, target: 5 },
  { day: "T5", sessions: 7, target: 5 },
  { day: "T6", sessions: 5, target: 5 },
  { day: "T7", sessions: 8, target: 5 },
  { day: "CN", sessions: 2, target: 3 },
];

const PROGRESS_CHART = [
  { name: "Trần H.Anh", progress: 75 },
  { name: "Ng.M.Tuấn", progress: 60 },
  { name: "Phạm Đ.Long", progress: 40 },
  { name: "Lê H.Nam", progress: 85 },
  { name: "Võ T.Lan", progress: 100 },
];

const ATTENDANCE_DATA = [
  { name: "Hoàn thành", value: 68, color: "#FF3B3B" },
  { name: "Vắng mặt", value: 12, color: "#3a3a3a" },
  { name: "Đã hủy", value: 20, color: "#555555" },
];

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function getMember(id: string): Member | undefined {
  return MEMBERS.find(m => m.id === id);
}

function getAssignment(memberId: string): TrainerAssignment | undefined {
  return ASSIGNMENTS.find(a => a.memberId === memberId);
}

function statusColor(status: string): string {
  if (["Active", "Done", "Completed"].includes(status)) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (["Paused", "Scheduled", "In Progress"].includes(status)) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  if (["Cancelled", "Overdue"].includes(status)) return "text-red-400 bg-red-400/10 border-red-400/30";
  return "text-gray-400 bg-gray-400/10 border-gray-400/30";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Active: "Hoạt động", Paused: "Tạm dừng", Completed: "Hoàn thành",
    Scheduled: "Đã lên lịch", Done: "Đã xong", Cancelled: "Đã hủy",
    "In Progress": "Đang thực hiện", Overdue: "Quá hạn",
  };
  return map[status] || status;
}

const tooltipStyle = { backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" };

// ─────────────────────────────────────────────
// BASE COMPONENTS
// ─────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

function Avatar({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "size-14" : size === "md" ? "size-10" : "size-8";
  const text = size === "lg" ? "text-sm" : "text-xs";
  return (
    <div className={`${sz} bg-[#FF3B3B]/15 border border-[#FF3B3B]/25 rounded-full flex items-center justify-center text-[#FF3B3B] ${text} font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function Bar2({ value, max = 100, color = "#FF3B3B" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5">
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#222] border border-white/10 text-white placeholder-[#555] text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-[#222] border border-white/10 text-white placeholder-[#555] text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors resize-none"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PrimaryBtn({ label, icon: Icon, onClick, small }: { label: string; icon?: React.ElementType; onClick?: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 bg-[#FF3B3B] hover:bg-[#cc2e2e] active:scale-95 text-white font-semibold rounded-lg transition-all ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
    >
      {Icon && <Icon className={small ? "size-3" : "size-4"} />}
      {label}
    </button>
  );
}

function GhostBtn({ label, icon: Icon, onClick, small }: { label: string; icon?: React.ElementType; onClick?: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 bg-transparent hover:bg-white/5 active:scale-95 text-[#BDBDBD] hover:text-white border border-white/10 hover:border-white/20 font-medium rounded-lg transition-all ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
    >
      {Icon && <Icon className={small ? "size-3" : "size-4"} />}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trainees", label: "Manage Trainees", icon: Users },
  { id: "schedule", label: "Schedule & Progress", icon: CalendarDays },
  { id: "workout", label: "Workout Guidance", icon: Dumbbell },
  { id: "evaluation", label: "Progress Evaluation", icon: BarChart2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

function Sidebar({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const isActive = (id: string) => screen === id || (id === "trainees" && screen === "member-detail");
  return (
    <aside className="w-60 bg-[#111] border-r border-white/5 flex flex-col shrink-0 h-full">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="size-9 bg-[#FF3B3B] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <Dumbbell className="size-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none tracking-wide">GymFit</div>
            <div className="text-[#FF3B3B] text-xs mt-0.5 font-medium">PT Module</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id as Screen)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
              isActive(id)
                ? "bg-[#FF3B3B]/12 text-[#FF3B3B] border border-[#FF3B3B]/20"
                : "text-[#888] hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="font-medium">{label}</span>
            {id === "notifications" && (
              <span className="ml-auto bg-[#FF3B3B] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">4</span>
            )}
            {isActive(id) && <div className="ml-auto size-1.5 rounded-full bg-[#FF3B3B]" />}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <Avatar initials={TRAINER.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{TRAINER.name}</div>
            <div className="text-[#666] text-xs truncate">PT Trainer</div>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#666] hover:bg-red-500/10 hover:text-[#FF3B3B] transition-all">
          <LogOut className="size-4" />
          <span className="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// TOP NAVBAR
// ─────────────────────────────────────────────
function TopNavbar({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <header className="h-14 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-white/5 flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#555]" />
        <input
          type="text"
          placeholder="Tìm kiếm học viên, lịch tập..."
          className="w-full bg-[#1a1a1a] border border-white/8 text-white placeholder-[#555] text-sm pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
        />
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <span className="text-[#555] text-xs hidden lg:block">Thứ Ba, 06/05/2025</span>
        <button
          onClick={() => onNavigate("notifications")}
          className="relative size-8 bg-[#1a1a1a] border border-white/8 rounded-lg flex items-center justify-center text-[#666] hover:text-white hover:border-white/15 transition-all"
        >
          <Bell className="size-3.5" />
          <span className="absolute top-1 right-1 size-1.5 bg-[#FF3B3B] rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar initials={TRAINER.avatar} size="sm" />
          <div className="hidden lg:block">
            <div className="text-white text-xs font-semibold leading-none">{TRAINER.name}</div>
            <div className="text-[#555] text-xs mt-0.5">{TRAINER.specialty}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// SCREEN 1: DASHBOARD
// ─────────────────────────────────────────────
function DashboardScreen({ onNavigate, onViewMember }: { onNavigate: (s: Screen) => void; onViewMember: (id: string) => void }) {
  const todaySch = SCHEDULES.filter(s => s.trainingDate === "06/05/2025");
  const stats = [
    { icon: Users, label: "Tổng học viên", value: "5", sub: "+1 tháng này" },
    { icon: CalendarDays, label: "Buổi hôm nay", value: "4", sub: "3 lịch tập" },
    { icon: Clock, label: "Sắp tới", value: "2", sub: "Trong 2 giờ" },
    { icon: CheckCircle, label: "Đã hoàn thành", value: "2", sub: "Hôm nay" },
    { icon: TrendingUp, label: "TB Tiến độ", value: "72%", sub: "Tất cả HV" },
    { icon: AlertTriangle, label: "Cần đánh giá", value: "3", sub: "Đang chờ", alert: true },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          TRAINER DASHBOARD
        </h1>
        <p className="text-[#555] text-sm mt-1">Chào buổi sáng, <span className="text-[#BDBDBD]">{TRAINER.name}</span> — Chúc bạn có ngày tập luyện hiệu quả!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(({ icon: Icon, label, value, sub, alert }) => (
          <div key={label} className={`bg-[#181818] border rounded-xl p-4 ${alert ? "border-[#FF3B3B]/25" : "border-white/5"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`size-7 rounded-lg flex items-center justify-center ${alert ? "bg-[#FF3B3B]/15" : "bg-white/5"}`}>
                <Icon className={`size-3.5 ${alert ? "text-[#FF3B3B]" : "text-[#666]"}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${alert ? "text-[#FF3B3B]" : "text-white"}`}>{value}</div>
            <div className="text-[#BDBDBD] text-xs font-medium mt-0.5">{label}</div>
            <div className="text-[#555] text-xs mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#181818] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-sm">Buổi tập trong tuần</h3>
            <span className="text-[#555] text-xs">Tuần 05–11/05/2025</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={WEEKLY_SESSIONS}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF3B3B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF3B3B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="day" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="sessions" stroke="#FF3B3B" strokeWidth={2} fill="url(#grad1)" name="Buổi tập" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Tỷ lệ tham dự</h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={ATTENDANCE_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={70} paddingAngle={3} dataKey="value">
                {ATTENDANCE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {ATTENDANCE_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[#BDBDBD]">{d.name}</span>
                </div>
                <span className="text-white font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#181818] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-5">Tiến độ học viên</h3>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={PROGRESS_CHART} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#999", fontSize: 11 }} axisLine={false} tickLine={false} width={76} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Tiến độ"]} />
              <Bar dataKey="progress" fill="#FF3B3B" radius={[0, 4, 4, 0]} name="Tiến độ" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Thao tác nhanh</h3>
          <div className="space-y-2">
            {[
              { icon: Plus, label: "Thêm học viên", screen: "trainees" as Screen },
              { icon: Dumbbell, label: "Tạo HDTL mới", screen: "workout" as Screen },
              { icon: Activity, label: "Cập nhật tiến độ", screen: "schedule" as Screen },
              { icon: Award, label: "Đánh giá HV", screen: "evaluation" as Screen },
            ].map(({ icon: Icon, label, screen }) => (
              <button
                key={label}
                onClick={() => onNavigate(screen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#222] hover:bg-[#FF3B3B]/8 border border-white/5 hover:border-[#FF3B3B]/20 rounded-lg text-sm text-[#BDBDBD] hover:text-[#FF3B3B] transition-all"
              >
                <Icon className="size-3.5" />
                <span className="font-medium">{label}</span>
                <ChevronRight className="size-3.5 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-semibold text-sm">Lịch tập hôm nay — 06/05/2025</h3>
          <button onClick={() => onNavigate("schedule")} className="text-[#FF3B3B] text-xs font-medium hover:underline">Xem tất cả</button>
        </div>
        <div className="divide-y divide-white/5">
          {todaySch.map(sch => {
            const m = getMember(sch.memberId);
            if (!m) return null;
            return (
              <div key={sch.scheduleId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                <div className="text-center w-14">
                  <div className="text-[#FF3B3B] text-sm font-bold">{sch.trainingTime}</div>
                  <div className="text-[#555] text-xs">{sch.duration}ph</div>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <Avatar initials={m.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{m.name}</div>
                  <div className="text-[#555] text-xs">{sch.exerciseType}</div>
                </div>
                <Badge status={sch.status} />
                <button onClick={() => onViewMember(m.id)} className="text-[#555] hover:text-[#FF3B3B] transition-colors">
                  <Eye className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 2: MANAGE TRAINEES
// ─────────────────────────────────────────────
function ManageTraineesScreen({
  onViewMember, onAddTrainee, onRemove,
}: {
  onViewMember: (id: string) => void;
  onAddTrainee: () => void;
  onRemove: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = ASSIGNMENTS.filter(a => {
    const m = getMember(a.memberId);
    if (!m) return false;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search) || m.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const countBy = (s: string) => ASSIGNMENTS.filter(a => a.status === s).length;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MANAGE TRAINEES</h1>
          <p className="text-[#555] text-xs mt-1">ManageTraineeListScreen · ManageTraineeListController</p>
        </div>
        <PrimaryBtn icon={Plus} label="Thêm học viên" onClick={onAddTrainee} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Tổng phân công", value: ASSIGNMENTS.length, color: "text-white" },
          { label: "Đang hoạt động", value: countBy("Active"), color: "text-emerald-400" },
          { label: "Tạm dừng", value: countBy("Paused"), color: "text-amber-400" },
          { label: "Hoàn thành", value: countBy("Completed"), color: "text-[#666]" },
        ].map(stat => (
          <div key={stat.label} className="bg-[#181818] border border-white/5 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[#555] text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#555]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, mã học viên..."
            className="w-full bg-[#181818] border border-white/8 text-white placeholder-[#555] text-sm pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Paused", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filter === s ? "bg-[#FF3B3B] text-white" : "bg-[#181818] border border-white/8 text-[#666] hover:text-white"}`}
            >
              {s === "All" ? "Tất cả" : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Học viên", "Mã HV", "Gói tập", "Ngày PH", "Trạng thái", "Buổi còn", "Tiến độ", ""].map(h => (
                  <th key={h} className="text-left text-[#444] text-[10px] font-bold uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const m = getMember(a.memberId);
                if (!m) return null;
                return (
                  <tr key={a.assignmentId} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={m.avatar} size="sm" />
                        <div>
                          <div className="text-white text-sm font-medium">{m.name}</div>
                          <div className="text-[#555] text-xs">{m.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[#555] text-xs font-mono">{m.id}</td>
                    <td className="px-4 py-3.5 text-[#BDBDBD] text-xs">{m.package}</td>
                    <td className="px-4 py-3.5 text-[#555] text-xs">{a.assignmentDate}</td>
                    <td className="px-4 py-3.5"><Badge status={a.status} /></td>
                    <td className="px-4 py-3.5">
                      <span className="text-white text-sm font-bold">{a.sessionsRemaining}</span>
                      <span className="text-[#555] text-xs">/{a.totalSessions}</span>
                    </td>
                    <td className="px-4 py-3.5 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><Bar2 value={a.progress} /></div>
                        <span className="text-white text-xs font-semibold w-7">{a.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onViewMember(m.id)} className="size-7 flex items-center justify-center text-[#555] hover:text-[#FF3B3B] hover:bg-[#FF3B3B]/10 rounded-lg transition-all" title="Xem chi tiết">
                          <Eye className="size-3" />
                        </button>
                        <button className="size-7 flex items-center justify-center text-[#555] hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all" title="Cập nhật">
                          <Edit2 className="size-3" />
                        </button>
                        <button onClick={() => onRemove(m.id)} className="size-7 flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Xóa phân công">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="size-10 mx-auto mb-3 text-[#333]" />
            <p className="text-[#555] text-sm">Không tìm thấy học viên nào</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 3: MEMBER DETAIL
// ─────────────────────────────────────────────
function MemberDetailScreen({
  memberId, onBack, onNavigate, showToast,
}: {
  memberId: string;
  onBack: () => void;
  onNavigate: (s: Screen) => void;
  showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const m = getMember(memberId);
  const a = getAssignment(memberId);
  if (!m) return null;

  const memberGoals = TRAINING_GOALS.filter(g => g.memberId === memberId);
  const memberSchedules = SCHEDULES.filter(s => s.memberId === memberId);
  const memberRecords = PROGRESS_RECORDS.filter(r => r.memberId === memberId);
  const memberMetrics = BODY_METRICS.filter(bm => bm.memberId === memberId);
  const memberEvals = EVALUATIONS.filter(e => e.memberId === memberId);

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "schedule", label: "Lịch tập" },
    { id: "progress", label: "Tiến độ" },
    { id: "evaluation", label: "Đánh giá" },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="size-8 flex items-center justify-center bg-[#181818] border border-white/8 rounded-lg text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MEMBER DETAIL</h1>
          <p className="text-[#555] text-xs">Chi tiết học viên — TrainerAssignment #{a?.assignmentId}</p>
        </div>
      </div>

      {/* Member header */}
      <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
        <div className="flex items-start gap-5">
          <Avatar initials={m.avatar} size="lg" />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-white text-xl font-bold">{m.name}</h2>
                <p className="text-[#555] text-sm mt-0.5">{m.id} · {m.package}</p>
              </div>
              {a && <Badge status={a.status} />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { icon: User, label: "Tuổi", value: `${m.age} tuổi` },
                { icon: Phone, label: "Điện thoại", value: m.phone },
                { icon: Mail, label: "Email", value: m.email },
                { icon: CalendarDays, label: "Ngày tham gia", value: m.joinDate },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="size-3.5 text-[#555] shrink-0" />
                  <div>
                    <div className="text-[#555] text-xs">{label}</div>
                    <div className="text-white text-xs font-medium">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            {a && (
              <div className="mt-4 flex items-center gap-6">
                <div>
                  <div className="text-[#555] text-xs mb-1">Tiến độ tổng thể</div>
                  <div className="flex items-center gap-3">
                    <div className="w-40"><Bar2 value={a.progress} /></div>
                    <span className="text-white text-sm font-bold">{a.progress}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#555] text-xs">Buổi còn lại</div>
                  <div className="text-white text-sm font-bold mt-1">{a.sessionsRemaining}/{a.totalSessions}</div>
                </div>
                <div>
                  <div className="text-[#555] text-xs">Ngày phân công</div>
                  <div className="text-white text-sm font-bold mt-1">{a.assignmentDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <PrimaryBtn icon={Plus} label="Thêm lịch tập" small onClick={() => { onNavigate("schedule"); }} />
        <PrimaryBtn icon={Dumbbell} label="Tạo HDTL" small onClick={() => { onNavigate("workout"); }} />
        <GhostBtn icon={Activity} label="Cập nhật tiến độ" small onClick={() => { onNavigate("schedule"); }} />
        <GhostBtn icon={Award} label="Đánh giá" small onClick={() => { onNavigate("evaluation"); }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#181818] border border-white/5 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.id ? "bg-[#FF3B3B] text-white" : "text-[#666] hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SectionCard title="Mục tiêu tập luyện">
            <div className="space-y-3">
              {memberGoals.length > 0 ? memberGoals.map(g => (
                <div key={g.goalId} className="bg-[#222] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-white text-xs font-semibold">{g.goalName}</div>
                    <Badge status={g.status} />
                  </div>
                  <div className="text-[#555] text-xs mb-2">{g.targetValue} · Hạn: {g.deadline}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><Bar2 value={g.progress} /></div>
                    <span className="text-white text-xs font-bold">{g.progress}%</span>
                  </div>
                </div>
              )) : <p className="text-[#555] text-xs">Chưa có mục tiêu nào</p>}
            </div>
          </SectionCard>
          <SectionCard title="Chỉ số cơ thể">
            {memberMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={memberMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="measuredDate" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="weight" stroke="#FF3B3B" strokeWidth={2} dot={{ fill: "#FF3B3B", r: 3 }} name="Cân nặng (kg)" />
                  <Line type="monotone" dataKey="bodyFatRate" stroke="#FF7B7B" strokeWidth={1.5} dot={{ fill: "#FF7B7B", r: 2 }} name="Mỡ cơ thể (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-[#555] text-xs">Chưa có dữ liệu</p>}
          </SectionCard>
        </div>
      )}

      {tab === "schedule" && (
        <SectionCard title="Lịch tập">
          <div className="space-y-2">
            {memberSchedules.map(s => (
              <div key={s.scheduleId} className="flex items-center gap-4 bg-[#222] rounded-lg p-3">
                <div className="text-center w-12">
                  <div className="text-[#FF3B3B] text-sm font-bold">{s.trainingTime}</div>
                </div>
                <div className="flex-1">
                  <div className="text-white text-xs font-medium">{s.exerciseType}</div>
                  <div className="text-[#555] text-xs">{s.trainingDate} · {s.duration} phút · {s.scheduleId}</div>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === "progress" && (
        <SectionCard title="Hồ sơ tiến độ (ProgressRecord)">
          <div className="space-y-3">
            {memberRecords.map(r => (
              <div key={r.progressId} className="bg-[#222] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#555] text-xs">{r.recordedDate} · {r.progressId}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20"><Bar2 value={r.completionLevel} /></div>
                    <span className="text-white text-xs font-bold">{r.completionLevel}%</span>
                  </div>
                </div>
                <p className="text-[#BDBDBD] text-xs">{r.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === "evaluation" && (
        <SectionCard title="Lịch sử đánh giá (ProgressEvaluation)">
          <div className="space-y-4">
            {memberEvals.map(e => (
              <div key={e.evaluationId} className="bg-[#222] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#555] text-xs">{e.evaluationDate} · {e.evaluationId}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`size-3 ${i < e.rating ? "text-amber-400" : "text-[#333]"}`} fill={i < e.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-[#BDBDBD] text-xs mb-2">{e.overallComment}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-emerald-400 font-semibold">Điểm mạnh:</span><span className="text-[#BDBDBD] ml-1">{e.strengths}</span></div>
                  <div><span className="text-amber-400 font-semibold">Cần cải thiện:</span><span className="text-[#BDBDBD] ml-1">{e.improvements}</span></div>
                </div>
                <div className="mt-2 text-xs"><span className="text-[#FF3B3B] font-semibold">Khuyến nghị:</span><span className="text-[#BDBDBD] ml-1">{e.recommendation}</span></div>
              </div>
            ))}
            {memberEvals.length === 0 && <p className="text-[#555] text-xs">Chưa có đánh giá nào</p>}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 4: SCHEDULE & PROGRESS
// ─────────────────────────────────────────────
function ScheduleProgressScreen({
  onAddSchedule, onUpdateProgress,
}: {
  onAddSchedule: () => void;
  onUpdateProgress: () => void;
}) {
  const days = ["04/05", "05/05", "06/05", "07/05", "08/05", "09/05", "10/05"];
  const dayLabels = ["T7", "CN", "T2", "T3", "T4", "T5", "T6"];
  const [selectedDay, setSelectedDay] = useState("06/05");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const todaySch = SCHEDULES.filter(s => s.trainingDate.startsWith(selectedDay));

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SCHEDULE & PROGRESS</h1>
          <p className="text-[#555] text-xs mt-1">ScheduleProgressScreen · ScheduleProgressController</p>
        </div>
        <div className="flex gap-2">
          <GhostBtn icon={Activity} label="Cập nhật tiến độ" small onClick={onUpdateProgress} />
          <PrimaryBtn icon={Plus} label="Thêm lịch tập" small onClick={onAddSchedule} />
        </div>
      </div>

      {/* Day selector */}
      <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
        <div className="text-[#555] text-xs font-semibold mb-3 uppercase tracking-widest">Tuần 04 – 10/05/2025</div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, i) => {
            const count = SCHEDULES.filter(s => s.trainingDate.startsWith(d)).length;
            const isSelected = selectedDay === d;
            const isToday = d === "06/05";
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`flex flex-col items-center py-3 rounded-xl transition-all ${isSelected ? "bg-[#FF3B3B] text-white" : "bg-[#222] text-[#666] hover:bg-[#2a2a2a] hover:text-white"}`}
              >
                <span className="text-xs font-semibold">{dayLabels[i]}</span>
                <span className={`text-lg font-bold mt-0.5 ${isToday && !isSelected ? "text-[#FF3B3B]" : ""}`}>{d.split("/")[0]}</span>
                {count > 0 && (
                  <div className={`mt-1 flex gap-0.5 ${isSelected ? "opacity-80" : ""}`}>
                    {Array.from({ length: Math.min(count, 4) }).map((_, j) => (
                      <div key={j} className={`size-1 rounded-full ${isSelected ? "bg-white" : "bg-[#FF3B3B]"}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Schedule list */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">{selectedDay}/2025 — {todaySch.length} buổi tập</h3>
          </div>
          {todaySch.length === 0 && (
            <div className="bg-[#181818] border border-white/5 rounded-xl py-12 text-center">
              <CalendarDays className="size-10 mx-auto mb-3 text-[#333]" />
              <p className="text-[#555] text-sm">Không có buổi tập nào</p>
            </div>
          )}
          {todaySch.map(sch => {
            const m = getMember(sch.memberId);
            if (!m) return null;
            return (
              <div key={sch.scheduleId} className="bg-[#181818] border border-white/5 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-lg px-3 py-2 text-center shrink-0">
                    <div className="text-[#FF3B3B] text-lg font-bold leading-none">{sch.trainingTime}</div>
                    <div className="text-[#FF3B3B]/60 text-xs mt-0.5">{sch.duration}ph</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-white font-semibold text-sm">{m.name}</div>
                        <div className="text-[#BDBDBD] text-xs mt-0.5">{sch.exerciseType}</div>
                        <div className="text-[#555] text-xs mt-0.5">{sch.scheduleId} · {m.id}</div>
                      </div>
                      <Badge status={sch.status} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex items-center gap-1.5 text-xs text-[#666] hover:text-white bg-[#222] hover:bg-[#2a2a2a] px-2.5 py-1.5 rounded-lg transition-all">
                        <Edit2 className="size-3" /> Sửa lịch
                      </button>
                      {sch.status === "Done" && (
                        <button onClick={onUpdateProgress} className="flex items-center gap-1.5 text-xs text-[#FF3B3B] hover:text-white bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20 px-2.5 py-1.5 rounded-lg transition-all">
                          <Activity className="size-3" /> Cập nhật tiến độ
                        </button>
                      )}
                      <button onClick={() => setShowDeleteConfirm(sch.scheduleId)} className="flex items-center gap-1.5 text-xs text-[#555] hover:text-red-400 bg-[#222] hover:bg-red-400/10 px-2.5 py-1.5 rounded-lg transition-all">
                        <Trash2 className="size-3" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress panel */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Tiến độ gần đây (ProgressRecord)">
            <div className="space-y-3">
              {PROGRESS_RECORDS.slice(0, 4).map(r => {
                const m = getMember(r.memberId);
                return (
                  <div key={r.progressId} className="flex items-start gap-3">
                    {m && <Avatar initials={m.avatar} size="sm" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-white text-xs font-medium truncate">{m?.name}</div>
                        <span className={`text-xs font-bold ${r.completionLevel >= 90 ? "text-emerald-400" : r.completionLevel >= 70 ? "text-amber-400" : "text-red-400"}`}>
                          {r.completionLevel}%
                        </span>
                      </div>
                      <div className="mt-1"><Bar2 value={r.completionLevel} /></div>
                      <p className="text-[#555] text-xs mt-1 truncate">{r.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Tổng kết tuần">
            <div className="space-y-2">
              {[
                { label: "Đã hoàn thành", value: SCHEDULES.filter(s => s.status === "Done").length, color: "text-emerald-400" },
                { label: "Đã lên lịch", value: SCHEDULES.filter(s => s.status === "Scheduled").length, color: "text-amber-400" },
                { label: "Đã hủy", value: SCHEDULES.filter(s => s.status === "Cancelled").length, color: "text-red-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[#666] text-xs">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Xóa lịch tập"
          message="Bạn có chắc chắn muốn xóa lịch tập này không?"
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={() => setShowDeleteConfirm(null)}
          danger
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 5: WORKOUT GUIDANCE
// ─────────────────────────────────────────────
function WorkoutGuidanceScreen({ showToast }: { showToast: (msg: string) => void }) {
  const [selectedMember, setSelectedMember] = useState("MEM001");
  const [goal, setGoal] = useState("Tăng sức mạnh và khối lượng cơ bắp phần thân trên");
  const [intensity, setIntensity] = useState("High");
  const [techniqueNote, setTechniqueNote] = useState("Chú ý giữ lưng thẳng trong Squat và Deadlift. Thở ra khi nâng tạ, thở vào khi hạ xuống. Khởi động kỹ trước khi vào bài chính.");
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [showResult, setShowResult] = useState(false);

  const addExercise = () => {
    const e: Exercise = {
      exerciseId: `EX${Date.now()}`,
      exerciseName: "Lat Pulldown",
      sets: 3, reps: 12, restTime: 60,
      difficulty: "Trung bình", muscleGroup: "Lưng",
      instruction: "Kéo thanh xuống trước ngực, giữ lưng thẳng",
    };
    setExercises(prev => [...prev, e]);
  };

  const removeExercise = (id: string) => setExercises(prev => prev.filter(e => e.exerciseId !== id));

  const updateEx = (id: string, field: keyof Exercise, value: string | number) =>
    setExercises(prev => prev.map(e => e.exerciseId === id ? { ...e, [field]: value } : e));

  const m = getMember(selectedMember);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>WORKOUT GUIDANCE</h1>
          <p className="text-[#555] text-xs mt-1">WorkoutGuidanceScreen · WorkoutGuidanceController</p>
        </div>
        <div className="flex gap-2">
          <GhostBtn label="Xem kết quả" small onClick={() => setShowResult(true)} />
          <PrimaryBtn icon={Zap} label="Lưu & Giao" small onClick={() => { showToast("Đã lưu và giao workout guidance thành công!"); }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Config panel */}
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Cấu hình WorkoutGuidance">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Học viên (Member)</label>
                <select
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors"
                >
                  {ASSIGNMENTS.filter(a => a.status === "Active").map(a => {
                    const mem = getMember(a.memberId);
                    return mem ? <option key={mem.id} value={mem.id}>{mem.name}</option> : null;
                  })}
                </select>
                {m && (
                  <div className="flex items-center gap-2 mt-2 px-2">
                    <Avatar initials={m.avatar} size="sm" />
                    <div className="text-xs text-[#555]">{m.package} · {m.phone}</div>
                  </div>
                )}
              </div>
              <Textarea label="Mục tiêu (Goal)" value={goal} onChange={setGoal} rows={2} />
              <Select
                label="Cường độ (Intensity)"
                value={intensity}
                onChange={setIntensity}
                options={["Low", "Medium", "High", "Very High"]}
              />
              <Textarea label="Ghi chú kỹ thuật (TechniqueNote)" value={techniqueNote} onChange={setTechniqueNote} rows={4} />
            </div>
          </SectionCard>

          <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
            <div className="text-xs text-[#555] space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Tổng bài tập</span>
                <span className="text-white font-semibold">{exercises.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tổng sets</span>
                <span className="text-white font-semibold">{exercises.reduce((s, e) => s + e.sets, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Thời gian nghỉ TB</span>
                <span className="text-white font-semibold">{Math.round(exercises.reduce((s, e) => s + e.restTime, 0) / exercises.length)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cường độ</span>
                <span className={`font-semibold ${intensity === "High" || intensity === "Very High" ? "text-[#FF3B3B]" : "text-amber-400"}`}>{intensity}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Exercise builder */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Danh sách bài tập (Exercise)</h3>
            <PrimaryBtn icon={Plus} label="Thêm bài tập" small onClick={addExercise} />
          </div>
          {exercises.map((ex, idx) => (
            <div key={ex.exerciseId} className="bg-[#181818] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-6 bg-[#FF3B3B]/15 border border-[#FF3B3B]/25 rounded-lg flex items-center justify-center text-[#FF3B3B] text-xs font-bold">{idx + 1}</div>
                  <input
                    value={ex.exerciseName}
                    onChange={e => updateEx(ex.exerciseId, "exerciseName", e.target.value)}
                    className="bg-transparent text-white font-semibold text-sm focus:outline-none border-b border-transparent focus:border-[#FF3B3B]/40 pb-0.5 transition-colors"
                  />
                </div>
                <button onClick={() => removeExercise(ex.exerciseId)} className="size-6 flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                  <X className="size-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "Sets", field: "sets" as keyof Exercise, value: ex.sets },
                  { label: "Reps", field: "reps" as keyof Exercise, value: ex.reps },
                  { label: "Nghỉ (s)", field: "restTime" as keyof Exercise, value: ex.restTime },
                ].map(({ label, field, value }) => (
                  <div key={label}>
                    <div className="text-[#555] text-xs mb-1">{label}</div>
                    <input
                      type="number"
                      value={value as number}
                      onChange={e => updateEx(ex.exerciseId, field, Number(e.target.value))}
                      className="w-full bg-[#222] border border-white/8 text-white text-sm px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[#555] text-xs mb-1">Nhóm cơ</div>
                  <input
                    value={ex.muscleGroup}
                    onChange={e => updateEx(ex.exerciseId, "muscleGroup", e.target.value)}
                    className="w-full bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
                  />
                </div>
                <div>
                  <div className="text-[#555] text-xs mb-1">Độ khó</div>
                  <select
                    value={ex.difficulty}
                    onChange={e => updateEx(ex.exerciseId, "difficulty", e.target.value)}
                    className="w-full bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
                  >
                    {["Dễ", "Trung bình", "Khó", "Rất khó"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="text-[#555] text-xs mb-1">Hướng dẫn kỹ thuật</div>
                <input
                  value={ex.instruction}
                  onChange={e => updateEx(ex.exerciseId, "instruction", e.target.value)}
                  className="w-full bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showResult && (
        <WorkoutResultModal exercises={exercises} goal={goal} intensity={intensity} member={m} onClose={() => setShowResult(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 6: PROGRESS EVALUATION
// ─────────────────────────────────────────────
function ProgressEvaluationScreen({ showToast }: { showToast: (msg: string) => void }) {
  const [selectedMember, setSelectedMember] = useState("MEM001");
  const [evalDate, setEvalDate] = useState("06/05/2025");
  const [comment, setComment] = useState("Học viên có sự tiến bộ tốt trong giai đoạn này.");
  const [strengths, setStrengths] = useState("Kiên trì, kỹ thuật tốt, nhiệt tình");
  const [improvements, setImprovements] = useState("Cần cải thiện chế độ nghỉ ngơi và dinh dưỡng");
  const [recommendation, setRecommendation] = useState("Tăng cường cardio, chú ý chế độ ăn");
  const [rating, setRating] = useState(4);
  const [showSuccess, setShowSuccess] = useState(false);

  const m = getMember(selectedMember);
  const goals = TRAINING_GOALS.filter(g => g.memberId === selectedMember);
  const metrics = BODY_METRICS.filter(bm => bm.memberId === selectedMember);
  const records = PROGRESS_RECORDS.filter(r => r.memberId === selectedMember);

  const handleSave = () => {
    setShowSuccess(true);
    showToast("Đã lưu đánh giá thành công!");
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PROGRESS EVALUATION</h1>
        <p className="text-[#555] text-xs mt-1">ProgressEvaluationScreen · ProgressEvaluationController</p>
      </div>

      {/* Member selector */}
      <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-5">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Chọn học viên</label>
            <select
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors"
            >
              {MEMBERS.map(mem => <option key={mem.id} value={mem.id}>{mem.name}</option>)}
            </select>
          </div>
          {m && (
            <div className="flex items-center gap-3">
              <Avatar initials={m.avatar} size="md" />
              <div>
                <div className="text-white font-semibold text-sm">{m.name}</div>
                <div className="text-[#555] text-xs">{m.package} · {m.id}</div>
                <div className="text-[#555] text-xs">{m.age} tuổi · {m.gender}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Goals + Records */}
        <div className="space-y-4">
          <SectionCard title="Mục tiêu (TrainingGoal)">
            <div className="space-y-3">
              {goals.map(g => (
                <div key={g.goalId} className="bg-[#222] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="text-white text-xs font-semibold leading-tight">{g.goalName}</div>
                    <Badge status={g.status} />
                  </div>
                  <div className="text-[#555] text-xs mb-2">{g.targetValue}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><Bar2 value={g.progress} /></div>
                    <span className="text-white text-xs font-bold">{g.progress}%</span>
                  </div>
                  <div className="text-[#555] text-xs mt-1">Hạn: {g.deadline}</div>
                </div>
              ))}
              {goals.length === 0 && <p className="text-[#555] text-xs">Chưa có mục tiêu</p>}
            </div>
          </SectionCard>

          <SectionCard title="Tiến độ gần đây (ProgressRecord)">
            <div className="space-y-2">
              {records.map(r => (
                <div key={r.progressId} className="bg-[#222] rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#555] text-xs">{r.recordedDate}</span>
                    <span className="text-white text-xs font-bold">{r.completionLevel}%</span>
                  </div>
                  <div className="mb-1.5"><Bar2 value={r.completionLevel} /></div>
                  <p className="text-[#BDBDBD] text-xs truncate">{r.note}</p>
                </div>
              ))}
              {records.length === 0 && <p className="text-[#555] text-xs">Chưa có dữ liệu</p>}
            </div>
          </SectionCard>
        </div>

        {/* Center: Charts */}
        <div className="space-y-4">
          {metrics.length > 0 ? (
            <>
              <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Xu hướng cân nặng (kg) — BodyMetric</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="measuredDate" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 78]} tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`]} />
                    <Line type="monotone" dataKey="weight" stroke="#FF3B3B" strokeWidth={2} dot={{ fill: "#FF3B3B", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
                <h3 className="text-white font-semibold text-sm mb-4">Tỷ lệ mỡ cơ thể (%) — BodyMetric</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="measuredDate" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[17, 24]} tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`]} />
                    <Line type="monotone" dataKey="bodyFatRate" stroke="#FF7B7B" strokeWidth={2} dot={{ fill: "#FF7B7B", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-[#181818] border border-white/5 rounded-xl p-12 text-center">
              <Activity className="size-10 mx-auto mb-3 text-[#333]" />
              <p className="text-[#555] text-sm">Chưa có dữ liệu chỉ số cơ thể</p>
            </div>
          )}
        </div>

        {/* Right: Evaluation form */}
        <div className="space-y-4">
          <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-semibold text-sm">Biểu mẫu đánh giá (ProgressEvaluation)</h3>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Ngày đánh giá" value={evalDate} onChange={setEvalDate} placeholder="dd/mm/yyyy" />
              <Textarea label="Nhận xét tổng quan (OverallComment)" value={comment} onChange={setComment} rows={2} />
              <Textarea label="Điểm mạnh (Strengths)" value={strengths} onChange={setStrengths} rows={2} />
              <Textarea label="Cần cải thiện (Improvements)" value={improvements} onChange={setImprovements} rows={2} />
              <Textarea label="Khuyến nghị (Recommendation)" value={recommendation} onChange={setRecommendation} rows={2} />

              <div>
                <label className="block text-xs font-semibold text-[#BDBDBD] mb-2 uppercase tracking-wide">Đánh giá (Rating)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${n <= rating ? "bg-[#FF3B3B]/15 border-[#FF3B3B]/30 text-[#FF3B3B]" : "bg-[#222] border-white/5 text-[#555] hover:text-white"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[#555] text-xs">Kém</span>
                  <span className="text-[#555] text-xs">Xuất sắc</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-3 bg-[#FF3B3B] hover:bg-[#cc2e2e] active:scale-95 text-white font-bold text-sm rounded-lg transition-all"
              >
                Lưu đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181818] border border-emerald-500/30 rounded-2xl p-8 text-center max-w-sm mx-4">
            <div className="size-14 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="size-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Đánh giá đã được lưu!</h3>
            <p className="text-[#BDBDBD] text-sm">Đánh giá tiến độ cho <strong>{m?.name}</strong> đã được tạo thành công.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 7: NOTIFICATIONS
// ─────────────────────────────────────────────
function NotificationsScreen() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const iconMap = {
    success: <CheckCircle className="size-4 text-emerald-400" />,
    warning: <AlertTriangle className="size-4 text-amber-400" />,
    error: <X className="size-4 text-red-400" />,
    info: <Info className="size-4 text-blue-400" />,
  };

  const bgMap = {
    success: "border-emerald-400/15",
    warning: "border-amber-400/15",
    error: "border-red-400/15",
    info: "border-blue-400/15",
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5 pb-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>NOTIFICATIONS</h1>
          <p className="text-[#555] text-xs mt-1">{unreadCount} thông báo chưa đọc</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[#FF3B3B] text-xs font-medium hover:underline">Đánh dấu tất cả đã đọc</button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`bg-[#181818] border rounded-xl p-4 flex items-start gap-4 transition-all ${bgMap[n.type]} ${!n.read ? "opacity-100" : "opacity-60"}`}
          >
            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${n.type === "success" ? "bg-emerald-400/10" : n.type === "warning" ? "bg-amber-400/10" : n.type === "error" ? "bg-red-400/10" : "bg-blue-400/10"}`}>
              {iconMap[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className={`text-sm font-semibold ${n.read ? "text-[#BDBDBD]" : "text-white"}`}>{n.title}</div>
                {!n.read && <div className="size-2 bg-[#FF3B3B] rounded-full shrink-0 mt-1" />}
              </div>
              <p className="text-[#555] text-xs mt-0.5">{n.message}</p>
              <span className="text-[#444] text-xs mt-1 block">{n.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 8: SETTINGS
// ─────────────────────────────────────────────
function SettingsScreen({ showToast }: { showToast: (msg: string) => void }) {
  const [name, setName] = useState(TRAINER.name);
  const [phone, setPhone] = useState(TRAINER.phone);
  const [email, setEmail] = useState(TRAINER.email);
  const [specialty, setSpecialty] = useState(TRAINER.specialty);
  const [experience, setExperience] = useState(TRAINER.experience);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const workHours = [
    { day: "Thứ 2", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 3", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 4", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 5", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 6", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 7", from: "08:00", to: "12:00", active: true },
    { day: "Chủ nhật", from: "", to: "", active: false },
  ];

  return (
    <div className="space-y-5 pb-6 max-w-3xl">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SETTINGS</h1>
        <p className="text-[#555] text-xs mt-1">Cài đặt tài khoản huấn luyện viên</p>
      </div>

      {/* Profile */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <User className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Thông tin cá nhân</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="size-20 bg-[#FF3B3B]/15 border border-[#FF3B3B]/25 rounded-2xl flex items-center justify-center text-[#FF3B3B] text-2xl font-bold">
                {TRAINER.avatar}
              </div>
              <button className="absolute -bottom-1 -right-1 size-7 bg-[#FF3B3B] rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-[#cc2e2e] transition-colors">
                <Camera className="size-3.5 text-white" />
              </button>
            </div>
            <div>
              <div className="text-white font-bold text-lg">{TRAINER.name}</div>
              <div className="text-[#555] text-sm">{TRAINER.specialty}</div>
              <div className="text-[#555] text-xs mt-1">{TRAINER.experience} kinh nghiệm</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Họ và tên" value={name} onChange={setName} />
            <Input label="Số điện thoại" value={phone} onChange={setPhone} type="tel" />
            <Input label="Email" value={email} onChange={setEmail} type="email" />
            <Input label="Chuyên môn" value={specialty} onChange={setSpecialty} />
            <Input label="Kinh nghiệm" value={experience} onChange={setExperience} />
          </div>
          <div className="mt-4">
            <PrimaryBtn label="Lưu thông tin" onClick={() => showToast("Đã cập nhật thông tin thành công!")} />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Lock className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Đổi mật khẩu</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Mật khẩu hiện tại" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
            <Input label="Mật khẩu mới" value={newPw} onChange={setNewPw} type="password" placeholder="••••••••" />
          </div>
          <div className="mt-4">
            <GhostBtn label="Cập nhật mật khẩu" onClick={() => showToast("Đã đổi mật khẩu thành công!")} />
          </div>
        </div>
      </div>

      {/* Working hours */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Clock className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Giờ làm việc</h3>
        </div>
        <div className="p-5 space-y-2">
          {workHours.map(({ day, from, to, active }) => (
            <div key={day} className="flex items-center gap-4">
              <div className={`w-24 text-xs font-medium ${active ? "text-white" : "text-[#444]"}`}>{day}</div>
              {active ? (
                <>
                  <input defaultValue={from} className="bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none w-20" />
                  <span className="text-[#555] text-xs">đến</span>
                  <input defaultValue={to} className="bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none w-20" />
                </>
              ) : (
                <span className="text-[#444] text-xs">Nghỉ</span>
              )}
            </div>
          ))}
          <div className="mt-4">
            <GhostBtn label="Lưu giờ làm việc" small onClick={() => showToast("Đã cập nhật giờ làm việc!")} />
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Award className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Chứng chỉ huấn luyện viên</h3>
        </div>
        <div className="p-5">
          <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-[#FF3B3B]/30 transition-colors cursor-pointer">
            <div className="size-12 bg-[#222] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="size-6 text-[#555]" />
            </div>
            <p className="text-[#555] text-sm">Kéo thả file hoặc nhấn để tải lên</p>
            <p className="text-[#444] text-xs mt-1">PDF, JPG, PNG — Tối đa 10MB</p>
          </div>
          <div className="mt-3 flex items-center gap-3 bg-[#222] rounded-lg p-3">
            <div className="size-8 bg-[#FF3B3B]/15 rounded-lg flex items-center justify-center">
              <Award className="size-4 text-[#FF3B3B]" />
            </div>
            <div className="flex-1">
              <div className="text-white text-xs font-semibold">ISSA Certified PT.pdf</div>
              <div className="text-[#555] text-xs">Tải lên: 01/01/2024 · 2.3 MB</div>
            </div>
            <button className="text-[#555] hover:text-red-400 transition-colors">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODALS
// ─────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onClose, onConfirm, danger }: {
  title: string; message: string; onClose: () => void; onConfirm: () => void; danger?: boolean;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <div className={`size-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-400/10" : "bg-amber-400/10"}`}>
          <AlertTriangle className={`size-6 ${danger ? "text-red-400" : "text-amber-400"}`} />
        </div>
        <h3 className="text-white font-bold text-base text-center mb-2">{title}</h3>
        <p className="text-[#BDBDBD] text-sm text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#222] border border-white/8 text-[#BDBDBD] hover:text-white text-sm font-semibold rounded-xl transition-colors">Hủy</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[#FF3B3B] hover:bg-[#cc2e2e]"}`}>Xác nhận</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddTraineeModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pkg, setPkg] = useState("Premium 3 tháng");

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-sm">Thêm học viên mới — TrainerAssignment</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#555]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm thành viên theo tên hoặc mã..."
              className="w-full bg-[#222] border border-white/8 text-white placeholder-[#555] text-sm pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/40 transition-colors"
            />
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {MEMBERS.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase())).map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${selectedId === m.id ? "bg-[#FF3B3B]/12 border border-[#FF3B3B]/25" : "bg-[#222] border border-transparent hover:border-white/10"}`}
              >
                <Avatar initials={m.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold">{m.name}</div>
                  <div className="text-[#555] text-xs">{m.id} · {m.phone}</div>
                </div>
                {selectedId === m.id && <CheckCircle className="size-4 text-[#FF3B3B] shrink-0" />}
              </button>
            ))}
          </div>
          <Select label="Gói tập" value={pkg} onChange={setPkg} options={["Standard 1 tháng", "Premium 3 tháng", "VIP 6 tháng"]} />
          <Input label="Ngày phân công (AssignmentDate)" value="06/05/2025" onChange={() => {}} />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Hủy" onClick={onClose} />
          <button onClick={onConfirm} disabled={!selectedId} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors">
            Xác nhận phân công
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function RemoveConfirmModal({ memberId, onClose, onConfirm }: { memberId: string; onClose: () => void; onConfirm: () => void }) {
  const m = getMember(memberId);
  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-red-400/20 rounded-2xl p-6 w-full max-w-sm">
        <div className="size-12 bg-red-400/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="size-6 text-red-400" />
        </div>
        <h3 className="text-white font-bold text-base text-center mb-2">Xóa phân công</h3>
        <p className="text-[#BDBDBD] text-sm text-center mb-2">
          Xóa học viên <strong className="text-white">{m?.name}</strong> khỏi danh sách phân công?
        </p>
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-lg p-3 mb-5">
          <p className="text-amber-400 text-xs">
            <strong>Lưu ý:</strong> Thao tác này chỉ cập nhật trạng thái TrainerAssignment, không xóa tài khoản thành viên.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#222] border border-white/8 text-[#BDBDBD] hover:text-white text-sm font-semibold rounded-xl transition-colors">Hủy</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">Xóa phân công</button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function AddScheduleModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [memberId, setMemberId] = useState("MEM001");
  const [date, setDate] = useState("07/05/2025");
  const [time, setTime] = useState("08:00");
  const [type, setType] = useState("Strength Training");
  const [duration, setDuration] = useState("60");

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-sm">Thêm lịch tập — TrainingSchedule</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Học viên (Member)</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ngày tập (TrainingDate)" value={date} onChange={setDate} />
            <Input label="Giờ tập (TrainingTime)" value={time} onChange={setTime} />
          </div>
          <Select label="Loại bài tập (ExerciseType)" value={type} onChange={setType} options={["Strength Training", "Cardio & HIIT", "Upper Body", "Lower Body", "Full Body", "Core Training", "Flexibility", "Yoga & Recovery"]} />
          <Input label="Thời lượng (phút)" value={duration} onChange={setDuration} type="number" />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Hủy" onClick={onClose} />
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] text-white font-semibold text-sm rounded-xl transition-colors">
            Tạo lịch tập
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function ProgressRecordModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const [memberId, setMemberId] = useState("MEM001");
  const [scheduleId, setScheduleId] = useState("SCH001");
  const [date, setDate] = useState("06/05/2025");
  const [level, setLevel] = useState(80);
  const [note, setNote] = useState("");

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold text-sm">Cập nhật tiến độ — ProgressRecord</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Học viên</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Buổi tập (TrainingSchedule)</label>
            <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {SCHEDULES.filter(s => s.memberId === memberId).map(s => (
                <option key={s.scheduleId} value={s.scheduleId}>{s.scheduleId} — {s.trainingDate} {s.trainingTime} · {s.exerciseType}</option>
              ))}
            </select>
          </div>
          <Input label="Ngày ghi nhận (RecordedDate)" value={date} onChange={setDate} />
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-2 uppercase tracking-wide">Mức hoàn thành (CompletionLevel) — {level}%</label>
            <input
              type="range" min={0} max={100} value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className="w-full accent-[#FF3B3B]"
            />
            <div className="flex justify-between text-xs text-[#444] mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <Textarea label="Ghi chú (Note)" value={note} onChange={setNote} rows={2} />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Hủy" onClick={onClose} />
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] text-white font-semibold text-sm rounded-xl transition-colors">
            Lưu tiến độ
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

function WorkoutResultModal({ exercises, goal, intensity, member, onClose }: {
  exercises: Exercise[]; goal: string; intensity: string; member?: Member; onClose: () => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#181818]">
          <h3 className="text-white font-bold text-sm">Workout Plan — {member?.name}</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-[#FF3B3B]/8 border border-[#FF3B3B]/20 rounded-xl p-4">
            <div className="text-[#FF3B3B] text-xs font-bold uppercase tracking-widest mb-1">Mục tiêu</div>
            <div className="text-white text-sm font-semibold">{goal}</div>
            <div className="text-[#BDBDBD] text-xs mt-1">Cường độ: <span className="text-[#FF3B3B] font-semibold">{intensity}</span></div>
          </div>
          <div className="space-y-2">
            {exercises.map((ex, idx) => (
              <div key={ex.exerciseId} className="bg-[#222] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-6 bg-[#FF3B3B]/15 border border-[#FF3B3B]/25 rounded-lg flex items-center justify-center text-[#FF3B3B] text-xs font-bold">{idx + 1}</div>
                  <div className="text-white font-semibold text-sm">{ex.exerciseName}</div>
                  <div className="ml-auto text-[#555] text-xs">{ex.muscleGroup}</div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Sets", value: ex.sets },
                    { label: "Reps", value: ex.reps },
                    { label: "Nghỉ", value: `${ex.restTime}s` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#1a1a1a] rounded-lg py-2">
                      <div className="text-white text-sm font-bold">{value}</div>
                      <div className="text-[#555] text-xs">{label}</div>
                    </div>
                  ))}
                </div>
                {ex.instruction && <p className="text-[#BDBDBD] text-xs mt-2 italic">{ex.instruction}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#181818] border border-emerald-500/30 text-white px-4 py-3 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-sm">
      <div className="size-6 bg-emerald-500/15 rounded-lg flex items-center justify-center">
        <CheckCircle className="size-3.5 text-emerald-400" />
      </div>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDone} className="text-[#555] hover:text-white ml-2 transition-colors">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = (s: Screen) => setScreen(s);

  const viewMember = (id: string) => {
    setSelectedMemberId(id);
    setScreen("member-detail");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: "#0D0D0D" }}>
      <Sidebar screen={screen} onNavigate={navigate} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNavbar onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {screen === "dashboard" && (
            <DashboardScreen onNavigate={navigate} onViewMember={viewMember} />
          )}
          {screen === "trainees" && (
            <ManageTraineesScreen
              onViewMember={viewMember}
              onAddTrainee={() => setShowAddTrainee(true)}
              onRemove={(id) => setShowRemoveConfirm(id)}
            />
          )}
          {screen === "member-detail" && selectedMemberId && (
            <MemberDetailScreen
              memberId={selectedMemberId}
              onBack={() => setScreen("trainees")}
              onNavigate={navigate}
              showToast={showToast}
            />
          )}
          {screen === "schedule" && (
            <ScheduleProgressScreen
              onAddSchedule={() => setShowAddSchedule(true)}
              onUpdateProgress={() => setShowProgressModal(true)}
            />
          )}
          {screen === "workout" && <WorkoutGuidanceScreen showToast={showToast} />}
          {screen === "evaluation" && <ProgressEvaluationScreen showToast={showToast} />}
          {screen === "notifications" && <NotificationsScreen />}
          {screen === "settings" && <SettingsScreen showToast={showToast} />}
        </main>
      </div>

      {showAddTrainee && (
        <AddTraineeModal
          onClose={() => setShowAddTrainee(false)}
          onConfirm={() => { setShowAddTrainee(false); showToast("Đã phân công học viên thành công!"); }}
        />
      )}
      {showRemoveConfirm && (
        <RemoveConfirmModal
          memberId={showRemoveConfirm}
          onClose={() => setShowRemoveConfirm(null)}
          onConfirm={() => { setShowRemoveConfirm(null); showToast("Đã xóa phân công thành công! Tài khoản thành viên vẫn được giữ nguyên."); }}
        />
      )}
      {showAddSchedule && (
        <AddScheduleModal
          onClose={() => setShowAddSchedule(false)}
          onConfirm={() => { setShowAddSchedule(false); showToast("Đã tạo lịch tập thành công!"); }}
        />
      )}
      {showProgressModal && (
        <ProgressRecordModal
          onClose={() => setShowProgressModal(false)}
          onConfirm={() => { setShowProgressModal(false); showToast("Đã cập nhật tiến độ thành công!"); }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
