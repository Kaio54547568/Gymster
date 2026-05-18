import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, CalendarDays, Dumbbell, BarChart2,
  Bell, Settings, LogOut, Search, Plus, Edit2, Trash2, Eye,
  X, ChevronRight, TrendingUp, Clock, Award,
  Activity, ArrowLeft, CheckCircle, AlertTriangle,
  User, Phone, Mail, Lock, Camera, Star,
  Info, Zap, Target, Globe
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import RoleShell, { type RoleShellItem } from "../shared/RoleShell";
import AccountSettings from "../shared/AccountSettings";
import { useLanguage, type AppLanguage } from "../shared/LanguageContext";
import { useSupabaseUserProfile } from "../shared/useSupabaseUserProfile";
import { getTrainingRequests, updateTrainingRequest } from "../../services/trainerService";
import { getCurrentUser } from "../../services/authService";
import {
  getTrainingRequestsForTrainer,
  updateTrainingRequestStatus,
} from "../../services/trainingRequestApi";
import {
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForTrainer,
  updateWorkoutSessionStatus,
} from "../../services/workoutSessionApi";
import { updateCurrentUserProfile } from "../../services/userProfileApi";

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
  | "meal-plan"
  | "settings"
  | "profile";

type AssignmentStatus = "Active" | "Paused" | "Completed";
type ScheduleStatus = "Scheduled" | "Done" | "Cancelled" | "No Show" | "Pending Reschedule";
type GoalStatus = "In Progress" | "Completed" | "Overdue";
type MealPlanStatus = "Draft" | "Assigned" | "Completed";

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
  memberName?: string; packageName?: string; roomName?: string; notes?: string; source?: string;
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
interface MedicalHistory {
  memberId: string; conditions: string; injuries: string; allergies: string;
  medicationNotes: string; trainingRestrictions: string; emergencyContact: string; lastUpdated: string;
}
interface BodyMetricDetail {
  memberId: string; height: string; weight: string; bmi: string; bodyFatPercentage: string;
  bloodPressure: string; restingHeartRate: string; fitnessGoal: string; latestMeasurementDate: string;
}
interface ProgressEvaluation {
  evaluationId: string; memberId: string; evaluationDate: string; overallComment: string;
  strengths: string; improvements: string; recommendation: string; rating: number;
}
interface MealPlan {
  id: string; name: string; goal: string; caloriesPerDay: number;
  breakfast: string; lunch: string; dinner: string; snacks: string; notes: string;
  assignedMemberId: string; startDate: string; endDate: string; status: MealPlanStatus;
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
const LOCAL_TRAINER_ID = "PT001";

const SPECIALTY_OPTIONS = [
  "PT Strength & Conditioning",
  "Weight Loss Coaching",
  "Bodybuilding",
  "Functional Training",
  "Yoga & Mobility",
  "Rehabilitation Fitness",
  "Cardio & HIIT",
];

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

const MEDICAL_HISTORIES: MedicalHistory[] = [
  { memberId: "MEM001", conditions: "Mild hypertension, monitored by physician", injuries: "Old right knee sprain, no acute pain", allergies: "No known food allergies", medicationNotes: "Takes blood pressure medication in the morning", trainingRestrictions: "Avoid maximal knee-loaded jumps and monitor blood pressure during HIIT", emergencyContact: "Nguyen Thi B - 0908 111 222", lastUpdated: "2026-05-10" },
  { memberId: "MEM002", conditions: "None reported", injuries: "Lower back tightness after long sitting", allergies: "Lactose intolerance", medicationNotes: "No regular medication", trainingRestrictions: "Warm up lower back and avoid heavy deadlift until form improves", emergencyContact: "Tran Van C - 0911 333 444", lastUpdated: "2026-05-08" },
];

const BODY_METRIC_DETAILS: BodyMetricDetail[] = [
  { memberId: "MEM001", height: "172 cm", weight: "72.4 kg", bmi: "24.5", bodyFatPercentage: "18.8%", bloodPressure: "128/82 mmHg", restingHeartRate: "64 bpm", fitnessGoal: "Build lean muscle and reduce body fat", latestMeasurementDate: "2026-05-01" },
  { memberId: "MEM002", height: "178 cm", weight: "84.0 kg", bmi: "26.5", bodyFatPercentage: "23.0%", bloodPressure: "122/78 mmHg", restingHeartRate: "70 bpm", fitnessGoal: "Weight loss and cardio endurance", latestMeasurementDate: "2026-05-03" },
];

const INITIAL_MEAL_PLANS: MealPlan[] = [
  { id: "MP001", name: "Lean Strength Plan", goal: "Muscle Gain", caloriesPerDay: 2600, breakfast: "Oats, eggs, banana, black coffee", lunch: "Chicken breast, brown rice, vegetables", dinner: "Salmon, sweet potato, mixed salad", snacks: "Greek yogurt, whey protein, almonds", notes: "Increase protein on heavy lifting days.", assignedMemberId: "MEM001", startDate: "2026-05-18", endDate: "2026-06-18", status: "Assigned" },
  { id: "MP002", name: "Recovery Balance Template", goal: "Recovery", caloriesPerDay: 2200, breakfast: "Smoothie bowl with berries and protein", lunch: "Lean beef, quinoa, steamed greens", dinner: "Turkey, rice noodles, vegetables", snacks: "Fruit, nuts, electrolyte drink", notes: "Use as a template for recovery-focused members.", assignedMemberId: "", startDate: "", endDate: "", status: "Draft" },
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
    Active: "Active", Paused: "Paused", Completed: "Completed",
    Scheduled: "Scheduled", Done: "Done", Cancelled: "Cancelled",
    "In Progress": "In Progress", Overdue: "Overdue",
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
  { id: "meal-plan", label: "Meal Plans", icon: Target },
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
          <span className="font-medium">Logout</span>
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
          placeholder="Search trainees, schedules..."
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
            <h3 className="text-white font-semibold text-sm">Weekly Sessions</h3>
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
              { icon: Plus, label: "Add Trainee", screen: "trainees" as Screen },
              { icon: Dumbbell, label: "Create Workout Plan", screen: "workout" as Screen },
              { icon: Activity, label: "Update Progress", screen: "schedule" as Screen },
              { icon: Award, label: "Evaluate Member", screen: "evaluation" as Screen },
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
          <h3 className="text-white font-semibold text-sm">Today&apos;s Schedule</h3>
          <button onClick={() => onNavigate("schedule")} className="text-[#FF3B3B] text-xs font-medium hover:underline">View All</button>
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

function TrainingRequestsPanel({ showToast }: { showToast: (msg: string) => void }) {
  const [requests, setRequests] = useState(getTrainingRequests());
  const [declineTarget, setDeclineTarget] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestLoadMessage, setRequestLoadMessage] = useState("");
  const ptRequests = requests.filter((request: any) => request.source === "supabase" || request.trainerName === TRAINER.name || request.trainerId === LOCAL_TRAINER_ID);

  const loadRequests = async () => {
    setIsLoadingRequests(true);
    const currentUser = getCurrentUser();
    const trainerLookup = currentUser?.trainerId || currentUser?.email || TRAINER.email;
    const { data, error } = await getTrainingRequestsForTrainer(trainerLookup);

    if (error || !data.length) {
      setRequests(getTrainingRequests());
      setRequestLoadMessage(error ? "Supabase requests could not be loaded. Showing demo requests." : "No Supabase training requests were returned. Showing demo requests.");
    } else {
      setRequests(data);
      setRequestLoadMessage("");
    }

    setIsLoadingRequests(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const refreshLocalRequests = () => setRequests(getTrainingRequests());

  const isPendingRequest = (request: any) => {
    return ["Pending PT Approval", "Pending", "Pending Approval", "pending_pt_approval"].includes(request.status) || request.rawStatus === "pending_pt_approval";
  };

  const getRequestStatus = (request: any) => request.statusLabel || request.status;

  const acceptRequest = async (request: any) => {
    if (request.source === "supabase") {
      const { error } = await updateTrainingRequestStatus(request.requestId || request.id, "accepted", "");
      if (error) {
        updateTrainingRequest(request.id, { status: "Accepted", declineReason: "" });
        refreshLocalRequests();
        showToast("Supabase update failed. Demo request was accepted locally.");
        return;
      }

      await loadRequests();
    } else {
      updateTrainingRequest(request.id, { status: "Accepted", declineReason: "" });
      refreshLocalRequests();
    }

    showToast(`${request.type === "reschedule" ? "Reschedule" : "Assignment"} request accepted.`);
  };

  const submitDecline = async () => {
    if (!declineTarget) return;
    const nextDeclineReason = declineReason.trim() || "PT declined this request.";

    if (declineTarget.source === "supabase") {
      const { error } = await updateTrainingRequestStatus(declineTarget.requestId || declineTarget.id, "declined", nextDeclineReason);
      if (error) {
        updateTrainingRequest(declineTarget.id, { status: "Declined", declineReason: nextDeclineReason });
        refreshLocalRequests();
        showToast("Supabase update failed. Demo request was declined locally.");
      } else {
        await loadRequests();
        showToast("Request declined and member notified.");
      }
    } else {
      updateTrainingRequest(declineTarget.id, { status: "Declined", declineReason: nextDeclineReason });
      refreshLocalRequests();
      showToast("Request declined and member notified.");
    }

    setDeclineTarget(null);
    setDeclineReason("");
  };

  return (
    <SectionCard title="PT Approval Requests">
      <div className="space-y-3">
        {isLoadingRequests && <p className="text-sm text-[#777]">Loading training requests...</p>}
        {requestLoadMessage && !isLoadingRequests && <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs font-bold text-amber-300">{requestLoadMessage}</p>}
        {ptRequests.map((request: any) => (
          <div key={request.id} className="rounded-xl border border-white/8 bg-[#111] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">{request.memberName}</div>
                <div className="mt-1 text-xs text-[#777]">{request.type === "reschedule" ? "Reschedule request" : "New member assignment"}</div>
                <div className="mt-2 text-xs text-[#BDBDBD]">Preferred: {request.preferredSchedule}</div>
                {request.currentSchedule && <div className="mt-1 text-xs text-[#777]">Current: {request.currentSchedule}</div>}
                {request.declineReason && <div className="mt-2 text-xs text-amber-300">Reason: {request.declineReason}</div>}
              </div>
              <Badge status={getRequestStatus(request)} />
            </div>
            {isPendingRequest(request) && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => acceptRequest(request)} className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25">Accept</button>
                <button onClick={() => setDeclineTarget(request)} className="rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25">Decline</button>
              </div>
            )}
          </div>
        ))}
        {ptRequests.length === 0 && <p className="text-sm text-[#777]">No pending trainer requests.</p>}
      </div>

      {declineTarget && (
        <ModalOverlay onClose={() => setDeclineTarget(null)}>
          <div className="bg-[#181818] border border-red-400/30 rounded-xl p-5 w-full max-w-lg">
            <h3 className="text-white font-bold text-lg mb-2">Decline Request</h3>
            <p className="text-[#888] text-sm mb-4">Add a reason so the member can choose another PT or another schedule.</p>
            <textarea value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} className="min-h-28 w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white outline-none focus:border-[#FF3B3B]" placeholder="Reason for declining..." />
            <div className="mt-4 flex gap-2">
              <button onClick={submitDecline} className="flex-1 rounded-lg bg-[#FF3B3B] px-4 py-2 text-sm font-bold text-white">Confirm Decline</button>
              <button onClick={() => setDeclineTarget(null)} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-white">Cancel</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </SectionCard>
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
        <PrimaryBtn icon={Plus} label="Add Trainee" onClick={onAddTrainee} />
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
              {s === "All" ? "All" : statusLabel(s)}
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
                        <button onClick={() => onViewMember(m.id)} className="size-7 flex items-center justify-center text-[#555] hover:text-[#FF3B3B] hover:bg-[#FF3B3B]/10 rounded-lg transition-all" title="View Details">
                          <Eye className="size-3" />
                        </button>
                        <button className="size-7 flex items-center justify-center text-[#555] hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all" title="Update">
                          <Edit2 className="size-3" />
                        </button>
                        <button onClick={() => onRemove(m.id)} className="size-7 flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Remove Assignment">
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
  const medicalHistory = MEDICAL_HISTORIES.find(item => item.memberId === memberId);
  const bodyMetricDetail = BODY_METRIC_DETAILS.find(item => item.memberId === memberId);
  const assignedMealPlan = INITIAL_MEAL_PLANS.find(plan => plan.assignedMemberId === memberId && plan.status === "Assigned");

  const tabs = [
    { id: "overview", label: "Tổng quan" },
    { id: "schedule", label: "Lịch tập" },
    { id: "progress", label: "Tiến độ" },
    { id: "evaluation", label: "Đánh giá" },
    { id: "medical", label: "Medical History" },
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
        <PrimaryBtn icon={Plus} label="Add Schedule" small onClick={() => { onNavigate("schedule"); }} />
        <PrimaryBtn icon={Dumbbell} label="Create Workout" small onClick={() => { onNavigate("workout"); }} />
        <GhostBtn icon={Activity} label="Update Progress" small onClick={() => { onNavigate("schedule"); }} />
        <GhostBtn icon={Award} label="Evaluate" small onClick={() => { onNavigate("evaluation"); }} />
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

      {tab === "medical" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Medical History">
            {medicalHistory ? (
              <div className="space-y-3">
                {[
                  ["Existing conditions", medicalHistory.conditions],
                  ["Injuries", medicalHistory.injuries],
                  ["Allergies", medicalHistory.allergies],
                  ["Medication notes", medicalHistory.medicationNotes],
                  ["Training restrictions", medicalHistory.trainingRestrictions],
                  ["Emergency contact", medicalHistory.emergencyContact],
                  ["Last updated", medicalHistory.lastUpdated],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#222] p-3">
                    <div className="text-[#777] text-xs uppercase tracking-widest">{label}</div>
                    <div className="text-white text-sm mt-1">{value}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[#555] text-xs">No medical history available for this member.</p>}
          </SectionCard>

          <SectionCard title="Body Metrics">
            {bodyMetricDetail ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Height", bodyMetricDetail.height],
                  ["Weight", bodyMetricDetail.weight],
                  ["BMI", bodyMetricDetail.bmi],
                  ["Body fat", bodyMetricDetail.bodyFatPercentage],
                  ["Blood pressure", bodyMetricDetail.bloodPressure],
                  ["Resting heart rate", bodyMetricDetail.restingHeartRate],
                  ["Fitness goal", bodyMetricDetail.fitnessGoal],
                  ["Latest measurement", bodyMetricDetail.latestMeasurementDate],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#222] p-3">
                    <div className="text-[#777] text-xs uppercase tracking-widest">{label}</div>
                    <div className="text-white text-sm font-semibold mt-1">{value}</div>
                  </div>
                ))}
              </div>
            ) : <p className="text-[#555] text-xs">No body metrics available for this member.</p>}
          </SectionCard>

          <SectionCard title="Assigned Meal Plan">
            {assignedMealPlan ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white text-sm font-semibold">{assignedMealPlan.name}</div>
                    <div className="text-[#777] text-xs mt-1">{assignedMealPlan.goal} - {assignedMealPlan.caloriesPerDay} kcal/day</div>
                  </div>
                  <Badge status={assignedMealPlan.status} />
                </div>
                <p className="text-[#BDBDBD] text-xs">{assignedMealPlan.notes}</p>
              </div>
            ) : <p className="text-[#555] text-xs">No meal plan assigned yet.</p>}
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SCREEN 4: SCHEDULE & PROGRESS
// ─────────────────────────────────────────────
function ScheduleProgressScreen({
  onAddSchedule, onUpdateProgress, onViewMember, showToast,
}: {
  onAddSchedule: () => void;
  onUpdateProgress: () => void;
  onViewMember: (id: string) => void;
  showToast: (msg: string) => void;
}) {
  type CalendarView = "Day" | "Week" | "Month" | "Agenda";
  const [view, setView] = useState<CalendarView>("Week");
  const [selectedSession, setSelectedSession] = useState<TrainingSchedule | null>(null);
  const [sessions, setSessions] = useState<TrainingSchedule[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadMessage, setSessionLoadMessage] = useState("");
  const days = [
    { key: "04/05", label: "Sun", date: "4" },
    { key: "05/05", label: "Mon", date: "5" },
    { key: "06/05", label: "Tue", date: "6" },
    { key: "07/05", label: "Wed", date: "7" },
    { key: "08/05", label: "Thu", date: "8" },
    { key: "09/05", label: "Fri", date: "9" },
    { key: "10/05", label: "Sat", date: "10" },
  ];
  const timeSlots = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  const weekLabel = "May 4 - 10, 2025";
  const sessionDay = (date: string) => date.slice(0, 5);
  const sessionHour = (time: string) => Number(time.split(":")[0]);
  const selectedMember = selectedSession
    ? getMember(selectedSession.memberId) || {
      id: selectedSession.memberId,
      name: selectedSession.memberName || "Member",
      phone: "",
      email: "",
      package: selectedSession.packageName || "Membership package",
      avatar: "MB",
      joinDate: "",
      age: 0,
      gender: "",
    }
    : null;
  const visibleDays = view === "Day" ? days.filter(day => day.key === "06/05") : days;
  const upcomingSessions = sessions.filter(item => item.status === "Scheduled" || item.status === "Pending Reschedule").slice(0, 5);

  const mapWorkoutSessionToTrainingSchedule = (session: any): TrainingSchedule => {
    const startTime = String(session.startTime || "").slice(0, 5);
    const endTime = String(session.endTime || "").slice(0, 5);
    const sessionDate = session.sessionDate || "";
    const parsedDate = sessionDate ? new Date(`${sessionDate}T00:00:00`) : null;

    return {
      scheduleId: session.sessionId,
      memberId: session.memberId,
      memberName: session.memberName || "Member",
      packageName: session.packageName || "Membership package",
      roomName: session.roomName || "PT Room",
      trainingDate: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        : sessionDate || "-",
      trainingTime: endTime ? `${startTime} - ${endTime}` : startTime,
      exerciseType: session.sessionTitle || session.exerciseType || "Workout Session",
      status: (getWorkoutSessionStatusLabel(session.status) === "Completed" ? "Done" : getWorkoutSessionStatusLabel(session.status)) as ScheduleStatus,
      duration: 60,
      notes: session.note || "",
      source: "supabase",
    };
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSessions(true);

    getWorkoutSessionsForTrainer(getCurrentUser())
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setSessions(SCHEDULES);
          setSessionLoadMessage("Some trainer workout sessions could not be loaded. Demo schedule is shown temporarily.");
        } else if (data.length) {
          setSessions(data.map(mapWorkoutSessionToTrainingSchedule));
          setSessionLoadMessage("");
        } else {
          setSessions([]);
          setSessionLoadMessage("");
        }

        setIsLoadingSessions(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSessions(SCHEDULES);
        setSessionLoadMessage("Some trainer workout sessions could not be loaded. Demo schedule is shown temporarily.");
        setIsLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSessionStatus = async (id: string, status: ScheduleStatus) => {
    const targetSession = sessions.find(item => item.scheduleId === id);

    if (targetSession?.source === "supabase") {
      const dbStatus = status === "Done" ? "completed" : status === "No Show" ? "no_show" : status === "Pending Reschedule" ? "pending_reschedule" : status.toLowerCase();
      const { data, error } = await updateWorkoutSessionStatus(id, dbStatus);

      if (error) {
        showToast("Could not update session status in Supabase.");
        return;
      }

      const mapped = mapWorkoutSessionToTrainingSchedule(data);
      setSessions(prev => prev.map(item => item.scheduleId === id ? mapped : item));
      setSelectedSession(prev => prev && prev.scheduleId === id ? mapped : prev);
      showToast(`Session marked as ${status}.`);
      return;
    }

    setSessions(prev => prev.map(item => item.scheduleId === id ? { ...item, status } : item));
    setSelectedSession(prev => prev && prev.scheduleId === id ? { ...prev, status } : prev);
    showToast(`Session marked as ${status}.`);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PT CALENDAR</h1>
          <p className="text-[#555] text-xs mt-1">Google Calendar-inspired schedule for member training sessions.</p>
        </div>
        <div className="flex gap-2">
          <GhostBtn icon={Activity} label="Update Progress" small onClick={onUpdateProgress} />
          <PrimaryBtn icon={Plus} label="Add Schedule" small onClick={onAddSchedule} />
        </div>
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => showToast("Calendar moved to today.")} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-[#FF3B3B]">Today</button>
            <button onClick={() => showToast("Previous week selected.")} className="size-9 rounded-full border border-white/10 text-[#999] hover:text-white">Prev</button>
            <button onClick={() => showToast("Next week selected.")} className="size-9 rounded-full border border-white/10 text-[#999] hover:text-white">Next</button>
            <div className="ml-2 text-white text-lg font-semibold">{weekLabel}</div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-[#111] p-1">
            {(["Day", "Week", "Month", "Agenda"] as CalendarView[]).map(item => (
              <button key={item} onClick={() => setView(item)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${view === item ? "bg-[#FF3B3B] text-white shadow-[0_0_18px_rgba(255,59,59,0.35)]" : "text-[#777] hover:text-white"}`}>{item}</button>
            ))}
          </div>
        </div>
      </div>

      {isLoadingSessions && (
        <div className="rounded-xl border border-white/5 bg-[#181818] p-4 text-sm font-semibold text-[#777]">
          Loading workout sessions from Supabase...
        </div>
      )}
      {sessionLoadMessage && !isLoadingSessions && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-semibold text-amber-300">
          {sessionLoadMessage}
        </div>
      )}
      {!isLoadingSessions && !sessionLoadMessage && sessions.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-[#181818] p-8 text-center text-sm font-semibold text-[#777]">
          No assigned workout sessions found.
        </div>
      )}

      {view === "Agenda" ? (
        <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
          {sessions.map(session => {
            const member = getMember(session.memberId);
            return (
              <button key={session.scheduleId} onClick={() => setSelectedSession(session)} className="w-full rounded-xl border border-white/5 bg-[#111] p-4 text-left hover:border-[#FF3B3B]/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white text-sm font-semibold">{session.exerciseType}</div>
                    <div className="text-[#777] text-xs mt-1">{member?.name || session.memberName || "Member"} - {session.trainingDate} - {session.trainingTime} - {session.roomName || "Room A2"}</div>
                  </div>
                  <Badge status={session.status} />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#181818]">
          <div className="min-w-[920px] grid" style={{ gridTemplateColumns: `72px repeat(${visibleDays.length}, minmax(120px, 1fr))` }}>
            <div className="border-b border-white/5 bg-[#111]" />
            {visibleDays.map(day => (
              <div key={day.key} className="border-b border-l border-white/5 bg-[#111] p-3 text-center">
                <div className="text-[#777] text-xs font-semibold uppercase tracking-widest">{day.label}</div>
                <div className={`mx-auto mt-1 flex size-9 items-center justify-center rounded-full text-lg font-semibold ${day.key === "06/05" ? "bg-[#FF3B3B] text-white" : "text-white"}`}>{day.date}</div>
              </div>
            ))}
            {timeSlots.map(slot => (
              <div key={slot} className="contents">
                <div className="border-b border-white/5 bg-[#111] px-3 py-4 text-right text-xs text-[#777]">{slot}</div>
                {visibleDays.map(day => {
                  const hour = Number(slot.split(":")[0]);
                  const events = sessions.filter(item => sessionDay(item.trainingDate) === day.key && sessionHour(item.trainingTime) === hour);
                  return (
                    <div key={`${day.key}-${slot}`} className="min-h-[76px] border-b border-l border-white/5 p-1.5">
                      {events.map(event => {
                        const member = getMember(event.memberId);
                        return (
                          <button key={event.scheduleId} onClick={() => setSelectedSession(event)} className="mb-1 w-full rounded-lg border border-[#FF3B3B]/30 bg-[#FF3B3B]/15 p-2 text-left shadow-[0_8px_22px_rgba(255,59,59,0.12)] hover:bg-[#FF3B3B]/25">
                            <div className="truncate text-xs font-bold text-white">{event.exerciseType}</div>
                            <div className="truncate text-[11px] text-[#F5B5B5]">{member?.name || event.memberName || "Member"}</div>
                            <div className="mt-1 truncate text-[10px] text-[#999]">{event.trainingTime} - {event.roomName || "Room A2"}</div>
                            <div className="mt-1 text-[10px] text-[#FF7B7B]">{event.status}</div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Upcoming Sessions">
          <div className="space-y-3">
            {upcomingSessions.length > 0 ? upcomingSessions.map(session => {
              const member = getMember(session.memberId);
              return (
                <button key={session.scheduleId} onClick={() => setSelectedSession(session)} className="w-full rounded-lg bg-[#222] p-3 text-left hover:bg-[#292929]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white text-sm font-semibold">{session.exerciseType}</div>
                      <div className="text-[#777] text-xs mt-1">{session.trainingDate} - {session.trainingTime} - {member?.name || session.memberName || "Member"}</div>
                      <div className="text-[#777] text-xs">{session.roomName || "Room A2"} - {member?.package || session.packageName || "Membership package"}</div>
                    </div>
                    <Badge status={session.status} />
                  </div>
                </button>
              );
            }) : (
              <div className="py-10 text-center">
                <CalendarDays className="size-10 mx-auto mb-3 text-[#333]" />
                <p className="text-[#555] text-sm">No upcoming sessions.</p>
              </div>
            )}
          </div>
        </SectionCard>
        <TrainingRequestsPanel showToast={showToast} />
      </div>

      {selectedSession && selectedMember && (
        <ModalOverlay onClose={() => setSelectedSession(null)}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#181818] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[#FF3B3B] text-xs font-bold uppercase tracking-widest">Session Detail</p>
                <h3 className="mt-1 text-2xl text-white tracking-[0.06em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{selectedSession.exerciseType}</h3>
                <p className="text-[#777] text-sm">{selectedMember.name} - {selectedSession.trainingDate} - {selectedSession.trainingTime}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-[#777] hover:text-white"><X className="size-5" /></button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between rounded-lg bg-[#222] p-3"><span className="text-[#777]">Room/location</span><span className="text-white">{selectedSession.roomName || "Room A2"}</span></div>
              <div className="flex justify-between rounded-lg bg-[#222] p-3"><span className="text-[#777]">Package</span><span className="text-white">{selectedMember.package || selectedSession.packageName || "Membership package"}</span></div>
              <div className="flex justify-between rounded-lg bg-[#222] p-3"><span className="text-[#777]">Status</span><Badge status={selectedSession.status} /></div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <PrimaryBtn label="View Member" icon={User} onClick={() => { setSelectedSession(null); onViewMember(selectedMember.id); }} />
              <GhostBtn label="Mark Completed" icon={CheckCircle} onClick={() => updateSessionStatus(selectedSession.scheduleId, "Done")} />
              <GhostBtn label="Mark No Show" icon={AlertTriangle} onClick={() => updateSessionStatus(selectedSession.scheduleId, "No Show")} />
              <GhostBtn label="Request Reschedule" icon={CalendarDays} onClick={() => updateSessionStatus(selectedSession.scheduleId, "Pending Reschedule")} />
              {selectedSession.status !== "Done" && <GhostBtn label="Cancel Session" icon={X} onClick={() => updateSessionStatus(selectedSession.scheduleId, "Cancelled")} />}
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
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
      instruction: "Pull the bar down toward your chest and keep your back straight.",
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
          <GhostBtn label="View Result" small onClick={() => setShowResult(true)} />
          <PrimaryBtn icon={Zap} label="Save & Assign" small onClick={() => { showToast("Workout guidance saved and assigned successfully!"); }} />
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
              <Textarea label="Goal" value={goal} onChange={setGoal} rows={2} />
              <Select
                label="Intensity"
                value={intensity}
                onChange={setIntensity}
                options={["Low", "Medium", "High", "Very High"]}
              />
              <Textarea label="Technique Note" value={techniqueNote} onChange={setTechniqueNote} rows={4} />
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
            <h3 className="text-white font-semibold text-sm">Exercise Builder</h3>
            <PrimaryBtn icon={Plus} label="Add Exercise" small onClick={addExercise} />
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
                  { label: "Rest (s)", field: "restTime" as keyof Exercise, value: ex.restTime },
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
                    {["Easy", "Medium", "Hard", "Very Hard"].map(d => <option key={d}>{d}</option>)}
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
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Select Trainee</label>
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
              <h3 className="text-white font-semibold text-sm">Evaluation Form</h3>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Evaluation Date" value={evalDate} onChange={setEvalDate} placeholder="dd/mm/yyyy" />
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
                  <span className="text-[#555] text-xs">Excellent</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full py-3 bg-[#FF3B3B] hover:bg-[#cc2e2e] active:scale-95 text-white font-bold text-sm rounded-lg transition-all"
              >
                Save Evaluation
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
          <button onClick={markAllRead} className="text-[#FF3B3B] text-xs font-medium hover:underline">Mark all as read</button>
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
function MealPlanScreen({ showToast }: { showToast: (msg: string) => void }) {
  const emptyForm: MealPlan = { id: "", name: "", goal: "Muscle Gain", caloriesPerDay: 2200, breakfast: "", lunch: "", dinner: "", snacks: "", notes: "", assignedMemberId: "", startDate: "", endDate: "", status: "Draft" };
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(INITIAL_MEAL_PLANS);
  const [form, setForm] = useState<MealPlan>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const updateForm = (field: keyof MealPlan, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const savePlan = () => {
    if (!form.name.trim()) {
      showToast("Meal plan name is required.");
      return;
    }
    if (editingId) {
      setMealPlans(prev => prev.map(plan => plan.id === editingId ? { ...form, id: editingId } : plan));
      showToast("Meal plan updated.");
    } else {
      setMealPlans(prev => [{ ...form, id: `MP${Date.now()}` }, ...prev]);
      showToast(form.status === "Assigned" ? "Meal plan assigned." : "Meal plan template created.");
    }
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MEAL PLANS</h1>
        <p className="text-[#555] text-xs mt-1">Create templates, assign meal plans, and review member nutrition support.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div>
          <SectionCard title={editingId ? "Edit Meal Plan" : "Create Meal Plan"}>
            <div className="space-y-3">
              <Input label="Meal plan name" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="Lean Strength Plan" />
              <label className="block"><span className="block text-[#666] text-xs mb-1.5 font-medium uppercase tracking-wider">Goal</span><select value={form.goal} onChange={(event) => updateForm("goal", event.target.value)} className="w-full bg-[#222] border border-white/5 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF3B3B]/50">{["Weight Loss", "Muscle Gain", "Maintenance", "Recovery"].map(goal => <option key={goal}>{goal}</option>)}</select></label>
              <Input label="Calories per day" type="number" value={String(form.caloriesPerDay)} onChange={(value) => updateForm("caloriesPerDay", Number(value))} />
              <Input label="Breakfast" value={form.breakfast} onChange={(value) => updateForm("breakfast", value)} />
              <Input label="Lunch" value={form.lunch} onChange={(value) => updateForm("lunch", value)} />
              <Input label="Dinner" value={form.dinner} onChange={(value) => updateForm("dinner", value)} />
              <Input label="Snacks" value={form.snacks} onChange={(value) => updateForm("snacks", value)} />
              <label className="block"><span className="block text-[#666] text-xs mb-1.5 font-medium uppercase tracking-wider">Notes</span><textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} rows={3} className="w-full bg-[#222] border border-white/5 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF3B3B]/50 resize-none" /></label>
              <label className="block"><span className="block text-[#666] text-xs mb-1.5 font-medium uppercase tracking-wider">Assigned member</span><select value={form.assignedMemberId} onChange={(event) => updateForm("assignedMemberId", event.target.value)} className="w-full bg-[#222] border border-white/5 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF3B3B]/50"><option value="">Template only</option>{MEMBERS.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3"><Input label="Start date" type="date" value={form.startDate} onChange={(value) => updateForm("startDate", value)} /><Input label="End date" type="date" value={form.endDate} onChange={(value) => updateForm("endDate", value)} /></div>
              <label className="block"><span className="block text-[#666] text-xs mb-1.5 font-medium uppercase tracking-wider">Status</span><select value={form.status} onChange={(event) => updateForm("status", event.target.value as MealPlanStatus)} className="w-full bg-[#222] border border-white/5 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF3B3B]/50">{["Draft", "Assigned", "Completed"].map(status => <option key={status}>{status}</option>)}</select></label>
              <PrimaryBtn label={editingId ? "Save Changes" : "Create Plan"} icon={CheckCircle} onClick={savePlan} />
              {editingId && <GhostBtn label="Cancel Edit" icon={X} onClick={() => { setEditingId(null); setForm(emptyForm); }} />}
            </div>
          </SectionCard>
        </div>
        <div className="xl:col-span-2">
          <SectionCard title="Meal Plan Templates and Assignments">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mealPlans.map(plan => {
                const member = getMember(plan.assignedMemberId);
                return (
                  <div key={plan.id} className="rounded-xl border border-white/5 bg-[#111] p-4">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-white text-sm font-semibold">{plan.name}</div><div className="text-[#777] text-xs mt-1">{plan.goal} - {plan.caloriesPerDay} kcal/day</div></div><Badge status={plan.status} /></div>
                    <div className="mt-3 space-y-1 text-xs text-[#BDBDBD]"><p><span className="text-[#777]">Assigned to:</span> {member?.name || "Template only"}</p><p><span className="text-[#777]">Duration:</span> {plan.startDate || "Not set"} - {plan.endDate || "Not set"}</p><p><span className="text-[#777]">Notes:</span> {plan.notes || "No notes"}</p></div>
                    <button onClick={() => { setForm(plan); setEditingId(plan.id); }} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#222] px-3 py-2 text-xs font-semibold text-[#BDBDBD] hover:text-white"><Edit2 className="size-3" /> Edit Plan</button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ showToast }: { showToast: (msg: string) => void }) {
  const { profile, isLoading, errorMessage } = useSupabaseUserProfile('trainer');
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [dob, setDob] = useState(profile.dob || "");
  const [headline, setHeadline] = useState(profile.headline);
  const [specialty, setSpecialty] = useState(profile.specialty || profile.roleLabel);
  const [experience, setExperience] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setDob(profile.dob || "");
    setHeadline(profile.headline);
    setSpecialty(profile.specialty || profile.roleLabel);
  }, [profile.firstName, profile.lastName, profile.dob, profile.headline, profile.specialty, profile.roleLabel]);
  const workHours = [
    { day: "Thứ 2", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 3", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 4", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 5", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 6", from: "07:00", to: "17:00", active: true },
    { day: "Thứ 7", from: "08:00", to: "12:00", active: true },
    { day: "Chủ nhật", from: "", to: "", active: false },
  ];

  const fieldClass = `w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg transition-colors ${
    editing ? "focus:outline-none focus:border-[#FF3B3B]/60" : "opacity-80 cursor-not-allowed"
  }`;

  const saveProfile = async () => {
    setStatusMessage("");
    const result = await updateCurrentUserProfile(getCurrentUser(), {
      firstName,
      lastName,
      dob,
      headline,
      specialty,
    });

    setStatusMessage(result.message);
    showToast(result.message);

    if (result.ok) {
      setEditing(false);
    }
  };

  return (
    <div className="space-y-5 pb-6 max-w-4xl">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PT PROFILE</h1>
        <p className="text-[#555] text-xs mt-1">Personal trainer account from Supabase</p>
      </div>

      {(isLoading || errorMessage) && (
        <div className="rounded-xl border border-white/10 bg-[#181818] p-4 text-sm font-bold text-[#BDBDBD]">
          {isLoading ? "Loading profile from Supabase..." : errorMessage}
        </div>
      )}

      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="size-4 text-[#FF3B3B]" />
            <h3 className="text-white font-semibold text-sm">Personal Information</h3>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <GhostBtn label="Cancel" small onClick={() => setEditing(false)} />
              <PrimaryBtn label="Save" small onClick={saveProfile} />
            </div>
          ) : (
            <GhostBtn label="Edit" icon={Edit2} small onClick={() => setEditing(true)} />
          )}
        </div>
        {statusMessage && <div className="px-5 pt-4 text-xs font-semibold text-[#BDBDBD]">{statusMessage}</div>}
        <div className="p-5">
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="size-20 bg-[#FF3B3B]/15 border border-[#FF3B3B]/25 rounded-2xl flex items-center justify-center text-[#FF3B3B] text-2xl font-bold">
                {profile.initials}
              </div>
              <button className="absolute -bottom-1 -right-1 size-7 bg-[#FF3B3B] rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-[#cc2e2e] transition-colors">
                <Camera className="size-3.5 text-white" />
              </button>
            </div>
            <div>
              <div className="text-white font-bold text-lg">{profile.fullName || `${firstName} ${lastName}`.trim()}</div>
              <div className="text-[#FF3B3B] text-sm font-semibold">{specialty}</div>
              <div className="text-[#555] text-xs mt-1">{headline}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">First name</label>
              <input className={fieldClass} value={firstName} disabled={!editing} onChange={(event) => setFirstName(event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Last name</label>
              <input className={fieldClass} value={lastName} disabled={!editing} onChange={(event) => setLastName(event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Role</label>
              <input className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg opacity-70 cursor-not-allowed" value={profile.roleLabel} disabled />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Dob</label>
              <input className={fieldClass} type="date" value={dob} disabled={!editing} onChange={(event) => setDob(event.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Specialty</label>
              <select className={fieldClass} value={specialty} disabled={!editing} onChange={(event) => setSpecialty(event.target.value)}>
                {SPECIALTY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Experience</label>
              <input className={fieldClass} value={experience} disabled={!editing} onChange={(event) => setExperience(event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Headlines</label>
              <textarea className={`${fieldClass} resize-none`} rows={3} value={headline} disabled={!editing} onChange={(event) => setHeadline(event.target.value)} />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/8 bg-[#222] p-4">
            <div className="text-white text-sm font-semibold mb-2">Contact info</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-[#BDBDBD]"><Mail className="size-4 text-[#FF3B3B]" />{profile.email}</div>
              <div className="flex items-center gap-2 text-[#BDBDBD]"><Phone className="size-4 text-[#FF3B3B]" />{profile.phone}</div>
            </div>
            <p className="text-[#555] text-xs mt-3">Email and phone number come from the Supabase users table.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Clock className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Working Hours</h3>
        </div>
        <div className="p-5 space-y-2">
          {workHours.map(({ day, from, to, active }) => (
            <div key={day} className="flex items-center gap-4">
              <div className={`w-24 text-xs font-medium ${active ? "text-white" : "text-[#444]"}`}>{day}</div>
              {active ? (
                <>
                  <input defaultValue={from} disabled={!editing} className={`bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none w-20 ${editing ? "focus:border-[#FF3B3B]/60" : "opacity-80 cursor-not-allowed"}`} />
                  <span className="text-[#555] text-xs">to</span>
                  <input defaultValue={to} disabled={!editing} className={`bg-[#222] border border-white/8 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none w-20 ${editing ? "focus:border-[#FF3B3B]/60" : "opacity-80 cursor-not-allowed"}`} />
                </>
              ) : (
                <span className="text-[#444] text-xs">Off</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Award className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Trainer Certificate</h3>
        </div>
        <div className="p-5">
          <div className={`border-2 border-dashed border-white/10 rounded-xl p-8 text-center transition-colors ${editing ? "hover:border-[#FF3B3B]/30 cursor-pointer" : "cursor-not-allowed opacity-80"}`}>
            <div className="size-12 bg-[#222] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Target className="size-6 text-[#555]" />
            </div>
            <p className="text-[#555] text-sm">Drag and drop a file or click to upload</p>
            <p className="text-[#444] text-xs mt-1">PDF, JPG, PNG — Max 10MB</p>
          </div>
          <div className="mt-3 flex items-center gap-3 bg-[#222] rounded-lg p-3">
            <div className="size-8 bg-[#FF3B3B]/15 rounded-lg flex items-center justify-center">
              <Award className="size-4 text-[#FF3B3B]" />
            </div>
            <div className="flex-1">
              <div className="text-white text-xs font-semibold">ISSA Certified PT.pdf</div>
              <div className="text-[#555] text-xs">Uploaded: 01/01/2024 · 2.3 MB</div>
            </div>
            {editing && (
              <button type="button" className="text-[#555] hover:text-red-400 transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ showToast, darkMode, setDarkMode }: { showToast: (msg: string) => void; darkMode: boolean; setDarkMode: (value: boolean) => void }) {
  const { profile } = useSupabaseUserProfile('trainer');

  return (
    <AccountSettings
      eyebrow="Trainer Account"
      title="Settings"
      description="Manage notification preferences, password, display mode, language, and contact information for the trainer account."
      accountName={profile.fullName || 'Trainer'}
      roleLabel={profile.specialty || profile.roleLabel || 'Personal Trainer'}
      primaryEmail={profile.email || ''}
      phoneNumber={profile.phone || ''}
    />
  );

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const { language, setLanguage } = useLanguage();
  const [primaryEmail, setPrimaryEmail] = useState(TRAINER.email);
  const [extraEmails, setExtraEmails] = useState(["coach.minh@gymster.vn"]);
  const [newEmail, setNewEmail] = useState("");
  const [phone, setPhone] = useState(TRAINER.phone);

  return (
    <div className="space-y-5 pb-6 max-w-4xl">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>SETTINGS</h1>
        <p className="text-[#555] text-xs mt-1">Cài đặt tài khoản huấn luyện viên</p>
      </div>

      {/* Notifications */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Bell className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Notification Preferences</h3>
        </div>
        <div className="p-5 space-y-3">
          {[
            ["memberExpiring", "Membership Expiring Alerts", "Alert when member packages are about to expire"],
            ["sessionReminder", "Session Reminders", "Notify before upcoming PT sessions"],
            ["progress", "Progress Updates", "Notify when progress records need review"],
          ].map(([key, label, desc], index) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-white/8 bg-[#222] p-4">
              <div>
                <div className="text-white text-sm font-semibold">{label}</div>
                <div className="text-[#555] text-xs mt-1">{desc}</div>
              </div>
              <button type="button" className={`relative h-7 w-14 shrink-0 rounded-full transition-all ${index !== 2 ? "bg-[#FF3B3B]" : "bg-white/10"}`}>
                <span className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${index !== 2 ? "translate-x-7" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Password */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Lock className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Change Password</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Current Password" value={currentPw} onChange={setCurrentPw} type="password" placeholder="••••••••" />
            <Input label="New Password" value={newPw} onChange={setNewPw} type="password" placeholder="••••••••" />
            <Input label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} type="password" placeholder="••••••••" />
          </div>
          <div className="mt-4">
            <GhostBtn label="Update Password" onClick={() => showToast("Password updated successfully!")} />
          </div>
        </div>
      </div>

      {/* Display */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Zap className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Display</h3>
        </div>
        <div className="p-5 flex items-center justify-between rounded-xl">
          <div>
            <div className="text-white text-sm font-semibold">Dark mode</div>
            <div className="text-[#555] text-xs mt-1">Off sẽ chuyển giao diện sang nền trắng, chủ đạo xanh dương.</div>
          </div>
          <button type="button" onClick={() => setDarkMode(!darkMode)} className={`relative h-8 w-16 shrink-0 rounded-full transition-all ${darkMode ? "bg-[#FF3B3B]" : "bg-[#2563EB]"}`}>
            <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${darkMode ? "translate-x-8" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Globe className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Language Preferences</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {[
            { code: "en", name: "English", helper: "Use English across the system" },
            { code: "vi", name: "Tiếng Việt", helper: "Sử dụng tiếng Việt cho toàn hệ thống" },
          ].map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code as AppLanguage)}
              className={`rounded-xl border p-4 text-left transition-all ${
                language === item.code
                  ? "border-[#FF3B3B] bg-[#FF3B3B]/10 text-[#FF3B3B]"
                  : "border-white/8 bg-[#222] text-white hover:border-[#FF3B3B]/40"
              }`}
            >
              <div className="text-sm font-bold">{item.name}</div>
              <div className="mt-1 text-xs text-[#777]">{item.helper}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="bg-[#181818] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Mail className="size-4 text-[#FF3B3B]" />
          <h3 className="text-white font-semibold text-sm">Contact info</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#222] p-4">
            <div className="text-white text-sm font-semibold mb-3">Email addresses</div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Primary email</label>
            <input value={primaryEmail} onChange={(event) => setPrimaryEmail(event.target.value)} className="w-full bg-[#181818] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60" />
            <div className="mt-3 space-y-2">
              {extraEmails.map((mail) => (
                <div key={mail} className="flex items-center justify-between rounded-lg bg-[#181818] px-3 py-2 text-sm text-white">
                  <span>{mail}</span>
                  <button className="text-[#FF3B3B] text-xs" onClick={() => setExtraEmails((current) => current.filter((item) => item !== mail))}>Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Add email address" className="flex-1 bg-[#181818] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60" />
              <button className="rounded-lg border border-[#FF3B3B]/50 px-4 py-2 text-sm font-semibold text-[#FF3B3B]" onClick={() => { if (newEmail.trim()) { setExtraEmails([...extraEmails, newEmail.trim()]); setNewEmail(""); } }}>Add</button>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#222] p-4">
            <div className="text-white text-sm font-semibold mb-3">Phone numbers</div>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full bg-[#181818] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60" />
          </div>

          <PrimaryBtn label="Save Contact Info" onClick={() => showToast("Contact info updated successfully!")} />
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
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#222] border border-white/8 text-[#BDBDBD] hover:text-white text-sm font-semibold rounded-xl transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[#FF3B3B] hover:bg-[#cc2e2e]"}`}>Confirm</button>
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
          <h3 className="text-white font-bold text-sm">Add New Trainee — TrainerAssignment</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#555]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members by name or ID..."
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
          <Select label="Package" value={pkg} onChange={setPkg} options={["Standard 1 month", "Premium 3 months", "VIP 6 months"]} />
          <Input label="Assignment Date (AssignmentDate)" value="06/05/2025" onChange={() => {}} />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Cancel" onClick={onClose} />
          <button onClick={onConfirm} disabled={!selectedId} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors">
            Confirm Assignment
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
        <h3 className="text-white font-bold text-base text-center mb-2">Remove Assignment</h3>
        <p className="text-[#BDBDBD] text-sm text-center mb-2">
          Remove trainee <strong className="text-white">{m?.name}</strong> from the assignment list?
        </p>
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-lg p-3 mb-5">
          <p className="text-amber-400 text-xs">
            <strong>Note:</strong> This only updates the TrainerAssignment status and does not delete the member account.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#222] border border-white/8 text-[#BDBDBD] hover:text-white text-sm font-semibold rounded-xl transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">Remove Assignment</button>
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
          <h3 className="text-white font-bold text-sm">Add Schedule — TrainingSchedule</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Trainee (Member)</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Training Date (TrainingDate)" value={date} onChange={setDate} />
            <Input label="Training Time (TrainingTime)" value={time} onChange={setTime} />
          </div>
          <Select label="Exercise Type (ExerciseType)" value={type} onChange={setType} options={["Strength Training", "Cardio & HIIT", "Upper Body", "Lower Body", "Full Body", "Core Training", "Flexibility", "Yoga & Recovery"]} />
          <Input label="Duration (minutes)" value={duration} onChange={setDuration} type="number" />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Cancel" onClick={onClose} />
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] text-white font-semibold text-sm rounded-xl transition-colors">
            Create Schedule
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
          <h3 className="text-white font-bold text-sm">Update Progress — ProgressRecord</h3>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Trainee</label>
            <select value={memberId} onChange={e => setMemberId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Training Session (TrainingSchedule)</label>
            <select value={scheduleId} onChange={e => setScheduleId(e.target.value)} className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors">
              {SCHEDULES.filter(s => s.memberId === memberId).map(s => (
                <option key={s.scheduleId} value={s.scheduleId}>{s.scheduleId} — {s.trainingDate} {s.trainingTime} · {s.exerciseType}</option>
              ))}
            </select>
          </div>
          <Input label="Recorded Date (RecordedDate)" value={date} onChange={setDate} />
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-2 uppercase tracking-wide">Completion Level (CompletionLevel) — {level}%</label>
            <input
              type="range" min={0} max={100} value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className="w-full accent-[#FF3B3B]"
            />
            <div className="flex justify-between text-xs text-[#444] mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <Textarea label="Note" value={note} onChange={setNote} rows={2} />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <GhostBtn label="Cancel" onClick={onClose} />
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-[#FF3B3B] hover:bg-[#cc2e2e] text-white font-semibold text-sm rounded-xl transition-colors">
            Save Progress
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
                    { label: "Rest", value: `${ex.restTime}s` },
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
  const [darkMode, setDarkMode] = useState(true);
  const { profile } = useSupabaseUserProfile('trainer');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = (s: Screen) => setScreen(s);

  const viewMember = (id: string) => {
    setSelectedMemberId(id);
    setScreen("member-detail");
  };

  const menuItems: RoleShellItem[] = NAV_ITEMS.map(({ id, label, icon }) => ({
    id,
    label,
    icon,
    active: screen === id || (id === "trainees" && screen === "member-detail"),
    onClick: () => navigate(id as Screen),
  }));

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="PT Portal"
      searchPlaceholder="Search trainees, schedules..."
      userName={profile.fullName || 'Trainer'}
      userRole={profile.specialty || profile.roleLabel}
      userInitials={profile.initials}
      onAvatarClick={() => navigate("profile")}
      darkMode={darkMode}
    >
        <div className="p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
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
              onViewMember={viewMember}
              showToast={showToast}
            />
          )}
          {screen === "workout" && <WorkoutGuidanceScreen showToast={showToast} />}
          {screen === "evaluation" && <ProgressEvaluationScreen showToast={showToast} />}
          {screen === "meal-plan" && <MealPlanScreen showToast={showToast} />}
          {screen === "profile" && <ProfileScreen showToast={showToast} />}
          {screen === "settings" && <SettingsScreen showToast={showToast} darkMode={darkMode} setDarkMode={setDarkMode} />}
        </div>

      {showAddTrainee && (
        <AddTraineeModal
          onClose={() => setShowAddTrainee(false)}
          onConfirm={() => { setShowAddTrainee(false); showToast("Trainee assigned successfully!"); }}
        />
      )}
      {showRemoveConfirm && (
        <RemoveConfirmModal
          memberId={showRemoveConfirm}
          onClose={() => setShowRemoveConfirm(null)}
          onConfirm={() => { setShowRemoveConfirm(null); showToast("Assignment removed successfully! The member account is still active."); }}
        />
      )}
      {showAddSchedule && (
        <AddScheduleModal
          onClose={() => setShowAddSchedule(false)}
          onConfirm={() => { setShowAddSchedule(false); showToast("Training schedule created successfully!"); }}
        />
      )}
      {showProgressModal && (
        <ProgressRecordModal
          onClose={() => setShowProgressModal(false)}
          onConfirm={() => { setShowProgressModal(false); showToast("Progress updated successfully!"); }}
        />
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </RoleShell>
  );
}


