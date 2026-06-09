import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, Users, CalendarDays, Dumbbell, BarChart2,
  Bell, Settings, LogOut, Search, Plus, Edit2, Trash2, Eye,
  X, ChevronRight, TrendingUp, Clock, Award,
  Activity, ArrowLeft, CheckCircle, AlertTriangle,
  User, Phone, Mail, Lock, Camera, Star,
  Info, Zap, Target, Globe, Wrench
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import RoleShell, { type RoleShellItem } from "../shared/RoleShell";
import AccountSettings from "../shared/AccountSettings";
import { useAppearance } from "../shared/AppearanceContext";
import { useLanguage, type AppLanguage } from "../shared/LanguageContext";
import { useSupabaseUserProfile } from "../shared/useSupabaseUserProfile";
import { getCurrentUser, setCurrentUser } from "../../services/authService";
import {
  getTrainingRequestsForTrainer,
  updateTrainingRequestStatus,
} from "../../services/trainingRequestApi";
import {
  getWorkoutPlansForTrainer,
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForTrainer,
  updateWorkoutSessionContent,
  updateWorkoutSessionStatus,
} from "../../services/workoutSessionApi";
import { updateCurrentUserProfile, uploadCurrentUserAvatar } from "../../services/userProfileApi";
import { fetchPtPortalData } from "../../services/ptDataApi";
import { createStaffMaintenanceReport, getStaffEquipmentStatus } from "../../services/staffOperationsApi";
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  getDetailedWorkoutPlansForTrainer,
  updateWorkoutPlan,
} from "../../services/workoutPlanApi";
import { requestMedicalHistoryForMember } from "../../services/medicalHistoryApi";
import { updateMemberCurrentGoal } from "../../services/memberCareApi";
import MuscleGroupSelector from "./components/workout-guidance/MuscleGroupSelector";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Screen =
  | "dashboard"
  | "trainees"
  | "member-detail"
  | "schedule"
  | "workout"
  | "equipment-report"
  | "evaluation"
  | "meal-plan"
  | "notifications"
  | "settings"
  | "profile";

type AssignmentStatus = "Active" | "Paused" | "Completed";
type ScheduleStatus = "Scheduled" | "Completed" | "Incomplete";
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
  trainingDateIso?: string; hasContent?: boolean; workoutContent?: Exercise[];
}
interface WorkoutPlanTemplate {
  id: string; name: string; goal: string; status: string; content: string; exercises: Exercise[];
}
interface ProgressRecord {
  progressId: string; memberId: string; scheduleId: string;
  recordedDate: string; completionLevel: number; note: string;
}
interface Exercise {
  exerciseId: string; exerciseName: string; sets: number; reps: string | number;
  restTime: number; difficulty: string; muscleGroup: string; instruction: string;
}
interface DetailedWorkoutPlan {
  id: string; memberId: string | null; memberName: string; name: string; goal: string;
  startDate: string; endDate: string; status: string; notes: string; exercises: Exercise[];
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DATA
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let TRAINER = {
  name: "Trainer",
  specialty: "Personal Training",
  phone: "",
  email: "",
  experience: "",
  avatar: "PT",
};
const LOCAL_TRAINER_ID = "";

const SPECIALTY_OPTIONS = [
  "PT Strength & Conditioning",
  "Weight Loss Coaching",
  "Bodybuilding",
  "Functional Training",
  "Yoga & Mobility",
  "Rehabilitation Fitness",
  "Cardio & HIIT",
];

let MEMBERS: Member[] = [];
let ASSIGNMENTS: TrainerAssignment[] = [];
let SCHEDULES: TrainingSchedule[] = [];
let PROGRESS_RECORDS: ProgressRecord[] = [];
let TRAINING_GOALS: TrainingGoal[] = [];
let BODY_METRICS: BodyMetric[] = [];
let MEDICAL_HISTORIES: MedicalHistory[] = [];
let BODY_METRIC_DETAILS: BodyMetricDetail[] = [];
let INITIAL_MEAL_PLANS: MealPlan[] = [];
let EVALUATIONS: ProgressEvaluation[] = [];
let NOTIFICATIONS: AppNotification[] = [];
let INITIAL_EXERCISES: Exercise[] = [];
let WEEKLY_SESSIONS: Array<{ day: string; sessions: number; target: number }> = [];
let PROGRESS_CHART: Array<{ name: string; progress: number }> = [];
let ATTENDANCE_DATA: Array<{ name: string; value: number; color: string }> = [];

function applyPtPortalData(data: any) {
  if (!data) return;
  TRAINER = data.trainer || TRAINER;
  MEMBERS = data.members || [];
  ASSIGNMENTS = data.assignments || [];
  SCHEDULES = data.schedules || [];
  PROGRESS_RECORDS = data.progressRecords || [];
  TRAINING_GOALS = data.trainingGoals || [];
  BODY_METRICS = data.bodyMetrics || [];
  MEDICAL_HISTORIES = data.medicalHistories || [];
  BODY_METRIC_DETAILS = data.bodyMetricDetails || [];
  INITIAL_MEAL_PLANS = data.mealPlans || [];
  EVALUATIONS = data.evaluations || [];
  NOTIFICATIONS = data.notifications || [];
  INITIAL_EXERCISES = data.exercises || [];
  WEEKLY_SESSIONS = data.weeklySessions || [];
  PROGRESS_CHART = data.progressChart || [];
  ATTENDANCE_DATA = data.attendanceData || [];
}
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UTILITIES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getMember(id: string): Member | undefined {
  return MEMBERS.find(m => m.id === id);
}

function getAssignment(memberId: string): TrainerAssignment | undefined {
  return ASSIGNMENTS.find(a => a.memberId === memberId);
}

function createEmptyExercise(): Exercise {
  return {
    exerciseId: `EX${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseName: "",
    sets: 3,
    reps: 10,
    restTime: 60,
    difficulty: "Medium",
    muscleGroup: "",
    instruction: "",
  };
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfCalendarWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  return start;
}

function getCalendarWeek(anchorDate: Date) {
  const start = startOfCalendarWeek(anchorDate);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toIsoDate(date),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: String(date.getDate()),
    };
  });
}

function statusColor(status: string): string {
  if (["Active", "Completed"].includes(status)) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (["Paused", "Scheduled", "In Progress"].includes(status)) return "text-amber-400 bg-amber-400/10 border-amber-400/30";
  if (["Incomplete", "Overdue"].includes(status)) return "text-red-400 bg-red-400/10 border-red-400/30";
  return "text-gray-400 bg-gray-400/10 border-gray-400/30";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Active: "Active", Paused: "Paused", Completed: "Completed",
    Scheduled: "Scheduled", Incomplete: "Incomplete",
    "In Progress": "In Progress", Overdue: "Overdue",
  };
  return map[status] || status;
}

const tooltipStyle = { backgroundColor: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" };

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BASE COMPONENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function ExerciseEditor({
  exercises,
  onAdd,
  onUpdate,
  onRemove,
}: {
  exercises: Exercise[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Exercise, value: string | number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PrimaryBtn icon={Plus} label="Add exercise" small onClick={onAdd} />
      </div>
      {exercises.map((exercise, index) => (
        <div key={exercise.exerciseId} className="rounded-xl border border-white/5 bg-[#181818] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-[#FF3B3B]/25 bg-[#FF3B3B]/15 text-xs font-bold text-[#FF3B3B]">{index + 1}</div>
              <input
                value={exercise.exerciseName}
                onChange={(event) => onUpdate(exercise.exerciseId, "exerciseName", event.target.value)}
                placeholder="Exercise name"
                className="min-w-0 flex-1 border-b border-transparent bg-transparent pb-0.5 text-sm font-semibold text-white outline-none transition-colors focus:border-[#FF3B3B]/40"
              />
            </div>
            <button type="button" onClick={() => onRemove(exercise.exerciseId)} className="flex size-7 items-center justify-center rounded-lg text-[#555] transition hover:bg-red-400/10 hover:text-red-400" aria-label="Remove exercise">
              <X className="size-3" />
            </button>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-3">
            {[
              { label: "Sets", field: "sets" as keyof Exercise, value: exercise.sets },
              { label: "Reps", field: "reps" as keyof Exercise, value: exercise.reps },
              { label: "Rest (s)", field: "restTime" as keyof Exercise, value: exercise.restTime },
            ].map(({ label, field, value }) => (
              <label key={label} className="block">
                <span className="mb-1 block text-xs text-[#555]">{label}</span>
                <input type="number" value={value as number} onChange={(event) => onUpdate(exercise.exerciseId, field, Number(event.target.value))} className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-sm text-white outline-none transition-colors focus:border-[#FF3B3B]/40" />
              </label>
            ))}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs text-[#555]">Muscle group</span>
              <input value={exercise.muscleGroup} onChange={(event) => onUpdate(exercise.exerciseId, "muscleGroup", event.target.value)} className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-[#FF3B3B]/40" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[#555]">Difficulty</span>
              <select value={exercise.difficulty} onChange={(event) => onUpdate(exercise.exerciseId, "difficulty", event.target.value)} className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-[#FF3B3B]/40">
                {["Easy", "Medium", "Hard", "Very Hard"].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs text-[#555]">Technique instruction</span>
            <input value={exercise.instruction} onChange={(event) => onUpdate(exercise.exerciseId, "instruction", event.target.value)} className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-[#FF3B3B]/40" />
          </label>
        </div>
      ))}
      {!exercises.length && (
        <button type="button" onClick={onAdd} className="w-full rounded-xl border border-dashed border-white/10 bg-[#181818] p-8 text-sm font-semibold text-[#777] transition hover:border-[#FF3B3B]/40 hover:text-white">
          Add the first exercise
        </button>
      )}
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SIDEBAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trainees", label: "Manage Trainees", icon: Users },
  { id: "schedule", label: "Schedule & Progress", icon: CalendarDays },
  { id: "workout", label: "Workout Guidance", icon: Dumbbell },
  { id: "equipment-report", label: "Equipment Reports", icon: Wrench },
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TOP NAVBAR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 1: DASHBOARD
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DashboardScreen({ onNavigate, onViewMember }: { onNavigate: (s: Screen) => void; onViewMember: (id: string) => void }) {
  const todayLabel = new Date().toLocaleDateString("en-GB");
  const todaySch = SCHEDULES.filter(s => s.trainingDate === todayLabel);
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

      {/* Progress */}
      <div className="bg-[#181818] border border-white/5 rounded-xl p-5">
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
  const [requests, setRequests] = useState<any[]>([]);
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
      setRequests([]);
      setRequestLoadMessage(error ? "Requests could not be loaded." : "No training requests yet.");
    } else {
      setRequests(data);
      setRequestLoadMessage("");
    }

    setIsLoadingRequests(false);
  };

  useEffect(() => {
    loadRequests();
    window.addEventListener("gymster:training-requests-updated", loadRequests);
    return () => window.removeEventListener("gymster:training-requests-updated", loadRequests);
  }, []);

  const refreshRequests = () => {
    void loadRequests();
  };

  const isPendingRequest = (request: any) => {
    return ["Pending PT Approval", "Pending", "Pending Approval", "pending_pt_approval"].includes(request.status) || request.rawStatus === "pending_pt_approval";
  };

  const getRequestStatus = (request: any) => request.statusLabel || request.status;

  const acceptRequest = async (request: any) => {
    const { error } = await updateTrainingRequestStatus(request.requestId || request.id, "accepted", "");
    if (error) {
      showToast("Cập nhật thất bại. Yêu cầu chưa được thay đổi.");
      return;
    }

    await loadRequests();
    showToast(`${request.type === "makeup_pt_session" ? "Makeup PT session" : request.type === "reschedule" ? "Reschedule" : "Assignment"} request accepted.`);
  };

  const submitDecline = async () => {
    if (!declineTarget) return;
    const nextDeclineReason = declineReason.trim() || "PT declined this request.";

    const { error } = await updateTrainingRequestStatus(declineTarget.requestId || declineTarget.id, "declined", nextDeclineReason);
    if (error) {
      showToast("Cập nhật thất bại. Yêu cầu chưa được thay đổi.");
    } else {
      await loadRequests();
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
                <div className="mt-1 text-xs text-[#777]">{request.type === "makeup_pt_session" ? "Makeup PT session request" : request.type === "reschedule" ? "Reschedule request" : "New member assignment"}</div>
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 2: MANAGE TRAINEES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ManageTraineesScreen({ onViewMember }: { onViewMember: (id: string) => void }) {
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
      <div>
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MANAGE TRAINEES</h1>
          <p className="text-[#555] text-xs mt-1">Select a trainee to open their member profile.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total assignments", value: ASSIGNMENTS.length, color: "text-white" },
          { label: "Active trainees", value: countBy("Active"), color: "text-emerald-400" },
          { label: "Paused trainees", value: countBy("Paused"), color: "text-amber-400" },
          { label: "Completed trainees", value: countBy("Completed"), color: "text-[#666]" },
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
            placeholder="Search by name, phone number, or member ID..."
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
                {["Trainee", "Member ID", "Package", "Assignment Date", "Status", "Remaining Sessions", "Progress"].map(h => (
                  <th key={h} className="text-left text-[#444] text-[10px] font-bold uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const m = getMember(a.memberId);
                if (!m) return null;
                return (
                  <tr
                    key={a.assignmentId}
                    role="button"
                    tabIndex={0}
                    onClick={() => onViewMember(m.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onViewMember(m.id);
                    }}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                  >
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="size-10 mx-auto mb-3 text-[#333]" />
            <p className="text-[#555] text-sm">No trainees found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 3: MEMBER DETAIL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MemberDetailScreen({
  memberId, onBack, onNavigate, showToast,
}: {
  memberId: string;
  onBack: () => void;
  onNavigate: (s: Screen) => void;
  showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [currentGoal, setCurrentGoal] = useState(() => TRAINING_GOALS.find(goal => goal.memberId === memberId)?.goalName || "Weight Loss");
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isRequestingMedical, setIsRequestingMedical] = useState(false);
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
  const completedSessions = memberSchedules.filter(session => session.status === "Completed").length;
  const incompleteSessions = memberSchedules.filter(session => session.status === "Incomplete").length;
  const totalSessions = a?.totalSessions || memberSchedules.length;
  const attendanceRate = completedSessions + incompleteSessions > 0
    ? Math.round((completedSessions / (completedSessions + incompleteSessions)) * 100)
    : 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "schedule", label: "Workout Calendar" },
    { id: "progress", label: "Progress" },
    { id: "evaluation", label: "Evaluation" },
    { id: "medical", label: "Medical History" },
    { id: "meal-plan", label: "Current Meal Plans" },
  ];

  const saveCurrentGoal = async (nextGoal: string) => {
    setCurrentGoal(nextGoal);
    setIsSavingGoal(true);
    const { error } = await updateMemberCurrentGoal(memberId, nextGoal, getCurrentUser());
    setIsSavingGoal(false);
    showToast(error ? "Current goal could not be updated." : "Current goal updated.");
  };

  const requestMedicalHistory = async () => {
    setIsRequestingMedical(true);
    const { error } = await requestMedicalHistoryForMember(memberId, getCurrentUser());
    setIsRequestingMedical(false);
    showToast(error ? "Medical history request could not be sent." : "Medical history request sent to member.");
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="size-8 flex items-center justify-center bg-[#181818] border border-white/8 rounded-lg text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>MEMBER DETAIL</h1>
          <p className="text-[#555] text-xs">Member profile - TrainerAssignment #{a?.assignmentId}</p>
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
                { icon: User, label: "Age", value: `${m.age}` },
                { icon: Phone, label: "Phone", value: m.phone },
                { icon: Mail, label: "Email", value: m.email },
                { icon: CalendarDays, label: "Join date", value: m.joinDate },
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
                  <div className="text-[#555] text-xs mb-1">Overall progress</div>
                  <div className="flex items-center gap-3">
                    <div className="w-40"><Bar2 value={a.progress} /></div>
                    <span className="text-white text-sm font-bold">{a.progress}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#555] text-xs">Remaining Sessions</div>
                  <div className="text-white text-sm font-bold mt-1">{a.sessionsRemaining}/{a.totalSessions}</div>
                </div>
                <div>
                  <div className="text-[#555] text-xs">Assignment Date</div>
                  <div className="text-white text-sm font-bold mt-1">{a.assignmentDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          <SectionCard title="Training goals">
            <div className="space-y-3">
              {memberGoals.length > 0 ? memberGoals.map(g => (
                <div key={g.goalId} className="bg-[#222] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-white text-xs font-semibold">{g.goalName}</div>
                    <Badge status={g.status} />
                  </div>
                  <div className="text-[#555] text-xs mb-2">{g.targetValue} - Due: {g.deadline}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><Bar2 value={g.progress} /></div>
                    <span className="text-white text-xs font-bold">{g.progress}%</span>
                  </div>
                </div>
              )) : <p className="text-[#555] text-xs">No goals yet</p>}
            </div>
          </SectionCard>
          <SectionCard title="Body metrics">
            {memberMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={memberMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                  <XAxis dataKey="measuredDate" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="weight" stroke="#FF3B3B" strokeWidth={2} dot={{ fill: "#FF3B3B", r: 3 }} name="Weight (kg)" />
                  <Line type="monotone" dataKey="bodyFatRate" stroke="#FF7B7B" strokeWidth={1.5} dot={{ fill: "#FF7B7B", r: 2 }} name="Body fat (%)" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-[#555] text-xs">No data yet</p>}
          </SectionCard>
        </div>
      )}

      {tab === "schedule" && (
        <SectionCard title="Workout Calendar">
          <div className="space-y-2">
            {memberSchedules.map(s => (
              <div key={s.scheduleId} className="flex items-start gap-4 bg-[#222] rounded-lg p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FF3B3B]/10 text-[#FF3B3B]"><CalendarDays className="size-4" /></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{s.trainingDate}</div>
                  <div className={`mt-1 text-xs ${s.hasContent ? "text-[#BDBDBD]" : "text-[#666]"}`}>
                    {s.hasContent ? (s.notes || s.exerciseType) : "No workout session"}
                  </div>
                </div>
                <Badge status={s.status} />
              </div>
            ))}
            {!memberSchedules.length && <p className="py-8 text-center text-xs text-[#555]">No workout sessions found.</p>}
          </div>
        </SectionCard>
      )}

      {tab === "progress" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-[#181818] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-[#666]">Completed sessions</div>
            <div className="mt-3 text-3xl font-black text-white">{completedSessions}<span className="text-lg text-[#666]"> / {totalSessions}</span></div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#181818] p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-[#666]">Attendance rate</div>
            <div className="mt-3 flex items-center gap-4"><div className="flex-1"><Bar2 value={attendanceRate} /></div><div className="text-3xl font-black text-white">{attendanceRate}%</div></div>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#181818] p-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#666]" htmlFor="member-current-goal">Current goal</label>
            <select id="member-current-goal" disabled={isSavingGoal} value={currentGoal} onChange={(event) => saveCurrentGoal(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#FF3B3B]/60 disabled:opacity-60">
              {["Weight Loss", "Chest", "Back", "Shoulders", "Arms", "Core", "Legs", "Mobility", "Endurance"].map(goal => <option key={goal}>{goal}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === "evaluation" && (
        <SectionCard title="Evaluation history">
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
                  <div><span className="text-emerald-400 font-semibold">Strengths:</span><span className="text-[#BDBDBD] ml-1">{e.strengths}</span></div>
                  <div><span className="text-amber-400 font-semibold">Improvements:</span><span className="text-[#BDBDBD] ml-1">{e.improvements}</span></div>
                </div>
                <div className="mt-2 text-xs"><span className="text-[#FF3B3B] font-semibold">Recommendation:</span><span className="text-[#BDBDBD] ml-1">{e.recommendation}</span></div>
              </div>
            ))}
            {memberEvals.length === 0 && <p className="text-[#555] text-xs">No evaluations yet</p>}
          </div>
        </SectionCard>
      )}

      {tab === "medical" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard
            title="Medical History"
            action={<PrimaryBtn label={isRequestingMedical ? "Sending..." : "Request Medical History"} icon={Bell} small onClick={requestMedicalHistory} />}
          >
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

        </div>
      )}

      {tab === "meal-plan" && (
        <SectionCard title="Current Meal Plans">
          {assignedMealPlan ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-[#222] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-bold text-white">{assignedMealPlan.name}</div>
                    <div className="mt-1 text-xs text-[#777]">{assignedMealPlan.goal} - {assignedMealPlan.caloriesPerDay} kcal/day</div>
                  </div>
                  <Badge status={assignedMealPlan.status} />
                </div>
                <p className="mt-4 text-sm text-[#BDBDBD]">{assignedMealPlan.notes || "No notes"}</p>
                <p className="mt-3 text-xs text-[#666]">{assignedMealPlan.startDate || "Not set"} - {assignedMealPlan.endDate || "Not set"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Breakfast", assignedMealPlan.breakfast],
                  ["Lunch", assignedMealPlan.lunch],
                  ["Dinner", assignedMealPlan.dinner],
                  ["Snacks", assignedMealPlan.snacks],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#222] p-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#777]">{label}</div>
                    <div className="mt-2 text-sm text-white">{value || "Not set"}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="py-8 text-center text-xs text-[#555]">No current meal plan assigned.</p>}
        </SectionCard>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 4: SCHEDULE & PROGRESS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScheduleProgressScreen({
  onViewMember, showToast, onNavigate,
}: {
  onViewMember: (id: string) => void;
  showToast: (msg: string) => void;
  onNavigate: (screen: Screen) => void;
}) {
  type CalendarView = "Day" | "Week" | "Month" | "Agenda";
  const [view, setView] = useState<CalendarView>("Week");
  const [selectedSession, setSelectedSession] = useState<TrainingSchedule | null>(null);
  const [sessions, setSessions] = useState<TrainingSchedule[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadMessage, setSessionLoadMessage] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("all");
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanTemplate[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionContent, setSessionContent] = useState("");
  const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);
  const [showMarkOptions, setShowMarkOptions] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [scheduleRequests, setScheduleRequests] = useState<any[]>([]);
  const days = getCalendarWeek(calendarAnchor);
  const timeSlots = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  const weekStart = new Date(`${days[0].key}T00:00:00`);
  const weekEnd = new Date(`${days[6].key}T00:00:00`);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const sessionHour = (time: string) => Number(time.split(":")[0]);
  const assignedMemberIds = new Set(
    ASSIGNMENTS.filter(assignment => assignment.status !== "Completed").map(assignment => assignment.memberId),
  );
  const currentAssignedMembers = MEMBERS.filter(member => assignedMemberIds.has(member.id));
  const assignedMembers = currentAssignedMembers.length
    ? currentAssignedMembers
    : Array.from(new Map(sessions.map(session => [session.memberId, {
      id: session.memberId,
      name: session.memberName || "Member",
      phone: "",
      email: "",
      package: session.packageName || "Membership package",
      avatar: "MB",
      joinDate: "",
      age: 0,
      gender: "",
    }])).values());
  const assignedSessions = currentAssignedMembers.length
    ? sessions.filter(session => assignedMemberIds.has(session.memberId))
    : sessions;
  const filteredSessions = selectedMemberId === "all"
    ? assignedSessions
    : assignedSessions.filter(session => session.memberId === selectedMemberId);
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
  const visibleDays = view === "Day" ? [days.find(day => day.key === toIsoDate(calendarAnchor)) || days[0]] : days;
  const upcomingSessions = filteredSessions.filter(item => item.status === "Scheduled").slice(0, 5);
  const pendingRescheduleRequests = scheduleRequests.filter(request =>
    request.type === "reschedule" &&
    (request.rawStatus === "pending_pt_approval" || request.status === "pending_pt_approval" || request.statusLabel === "Pending Approval")
  );
  const selectedSessionRequest = selectedSession
    ? pendingRescheduleRequests.find(request => request.sourceWorkoutSessionId === selectedSession.scheduleId)
    : null;

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
      trainingDateIso: sessionDate,
      trainingDate: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
        : sessionDate || "-",
      trainingTime: endTime ? `${startTime} - ${endTime}` : startTime,
      exerciseType: session.sessionTitle || session.exerciseType || "No workout session",
      status: getWorkoutSessionStatusLabel(session.status) as ScheduleStatus,
      duration: 60,
      notes: session.note || "",
      hasContent: Boolean(session.hasContent),
      workoutContent: session.workoutContent || [],
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
          setSessionLoadMessage("Some workout sessions could not be loaded. Please try again.");
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
        setSessionLoadMessage("Some workout sessions could not be loaded. Please try again.");
        setIsLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadScheduleRequests = async () => {
      const currentUser = getCurrentUser();
      const trainerLookup = currentUser?.trainerId || currentUser?.email || TRAINER.email;
      const { data } = await getTrainingRequestsForTrainer(trainerLookup);
      if (isMounted) setScheduleRequests(data || []);
    };

    void loadScheduleRequests();
    window.addEventListener("gymster:training-requests-updated", loadScheduleRequests);
    return () => {
      isMounted = false;
      window.removeEventListener("gymster:training-requests-updated", loadScheduleRequests);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    getWorkoutPlansForTrainer(getCurrentUser()).then(({ data }) => {
      if (isMounted) setWorkoutPlans(data || []);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedPlanId("");
    setSessionTitle(selectedSession?.hasContent ? selectedSession.exerciseType : "");
    setSessionContent(selectedSession?.notes || "");
    setSessionExercises(selectedSession?.workoutContent || []);
    setShowMarkOptions(false);
  }, [selectedSession]);

  const moveCalendar = (daysToMove: number) => {
    setCalendarAnchor(current => {
      const next = new Date(current);
      next.setDate(next.getDate() + daysToMove);
      return next;
    });
  };

  const openDay = (dayKey: string) => {
    setCalendarAnchor(new Date(`${dayKey}T00:00:00`));
    setView("Day");
  };

  const applyWorkoutPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = workoutPlans.find(item => item.id === planId);
    if (!plan) return;
    setSessionTitle(plan.name);
    setSessionContent(plan.content);
    setSessionExercises(plan.exercises || []);
  };

  const updateSessionExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setSessionExercises(current => current.map(exercise => exercise.exerciseId === id ? { ...exercise, [field]: value } : exercise));
  };

  const saveSessionContent = async () => {
    if (!selectedSession) return;
    if (!sessionTitle.trim() && !sessionContent.trim() && !sessionExercises.some(exercise => exercise.exerciseName.trim())) {
      showToast("Enter content or choose a workout.");
      return;
    }

    setIsSavingContent(true);
    const { data, error, notificationError } = await updateWorkoutSessionContent(selectedSession.scheduleId, {
      title: sessionTitle,
      content: sessionContent,
      exercises: sessionExercises,
    });
    setIsSavingContent(false);

    if (error || !data) {
      showToast("Workout session content could not be updated.");
      return;
    }

    const mapped = mapWorkoutSessionToTrainingSchedule(data);
    SCHEDULES = SCHEDULES.map(item => item.scheduleId === mapped.scheduleId ? mapped : item);
    setSessions(current => current.map(item => item.scheduleId === mapped.scheduleId ? mapped : item));
    setSelectedSession(mapped);
    showToast(notificationError
      ? "Content updated, but the member notification could not be sent."
      : "Content updated and member notified.");
  };

  const updateSessionStatus = async (id: string, status: ScheduleStatus) => {
    const targetSession = sessions.find(item => item.scheduleId === id);

    if (targetSession?.source === "supabase") {
      const dbStatus = status.toLowerCase();
      const { data, error } = await updateWorkoutSessionStatus(id, dbStatus);

      if (error) {
        showToast("Session status could not be updated.");
        return;
      }

      const mapped = mapWorkoutSessionToTrainingSchedule(data);
      SCHEDULES = SCHEDULES.map(item => item.scheduleId === id ? mapped : item);
      setSessions(prev => prev.map(item => item.scheduleId === id ? mapped : item));
      setSelectedSession(prev => prev && prev.scheduleId === id ? mapped : prev);
      showToast(`Session marked as ${status}.`);
      return;
    }

    SCHEDULES = SCHEDULES.map(item => item.scheduleId === id ? { ...item, status } : item);
    setSessions(prev => prev.map(item => item.scheduleId === id ? { ...item, status } : item));
    setSelectedSession(prev => prev && prev.scheduleId === id ? { ...prev, status } : prev);
    showToast(`Session marked as ${status}.`);
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>PT CALENDAR</h1>
          <p className="text-[#555] text-xs mt-1">Track member schedules and update content for each workout session.</p>
        </div>
        {pendingRescheduleRequests.length > 0 && (
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FF3B3B]/35 bg-[#FF3B3B]/15 px-4 py-2 text-xs font-bold text-[#FFB3B3] hover:bg-[#FF3B3B]/25"
          >
            <Bell className="size-4" />
            {pendingRescheduleRequests.length} reschedule request{pendingRescheduleRequests.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setCalendarAnchor(new Date())} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-[#FF3B3B]">Today</button>
            <button onClick={() => moveCalendar(-7)} className="size-9 rounded-full border border-white/10 text-[#999] hover:text-white">Prev</button>
            <button onClick={() => moveCalendar(7)} className="size-9 rounded-full border border-white/10 text-[#999] hover:text-white">Next</button>
            <div className="ml-2 text-white text-lg font-semibold">{weekLabel}</div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-[#111] p-1">
            {(["Day", "Week", "Month", "Agenda"] as CalendarView[]).map(item => (
              <button key={item} onClick={() => setView(item)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${view === item ? "bg-[#FF3B3B] text-white shadow-[0_0_18px_rgba(255,59,59,0.35)]" : "text-[#777] hover:text-white"}`}>{item}</button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
          <label className="text-xs font-bold uppercase tracking-widest text-[#777]" htmlFor="schedule-member-filter">Assigned members</label>
          <select
            id="schedule-member-filter"
            value={selectedMemberId}
            onChange={event => setSelectedMemberId(event.target.value)}
            className="min-w-64 rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm font-semibold text-white focus:border-[#FF3B3B]/60 focus:outline-none"
          >
            <option value="all">All members ({assignedMembers.length})</option>
            {assignedMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <span className="text-xs text-[#555]">{filteredSessions.length} sessions displayed</span>
        </div>
      </div>

      {isLoadingSessions && (
        <div className="rounded-xl border border-white/5 bg-[#181818] p-4 text-sm font-semibold text-[#777]">
          Loading workout schedule...
        </div>
      )}
      {sessionLoadMessage && !isLoadingSessions && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm font-semibold text-amber-300">
          {sessionLoadMessage}
        </div>
      )}
      {!isLoadingSessions && !sessionLoadMessage && filteredSessions.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-[#181818] p-8 text-center text-sm font-semibold text-[#777]">
          No workout sessions for the current filter.
        </div>
      )}

      {view === "Agenda" ? (
        <div className="bg-[#181818] border border-white/5 rounded-xl p-4 space-y-3">
          {filteredSessions.map(session => {
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
              <button
                key={day.key}
                type="button"
                onClick={() => openDay(day.key)}
                className="border-b border-l border-white/5 bg-[#111] p-3 text-center transition hover:bg-[#1d1d1d] focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#FF3B3B]/50"
                title={`Open calendar day ${day.key}`}
              >
                <div className="text-[#777] text-xs font-semibold uppercase tracking-widest">{day.label}</div>
                <div className={`mx-auto mt-1 flex size-9 items-center justify-center rounded-full text-lg font-semibold ${day.key === toIsoDate(new Date()) ? "bg-[#FF3B3B] text-white" : "text-white"}`}>{day.date}</div>
              </button>
            ))}
            {timeSlots.map(slot => (
              <div key={slot} className="contents">
                <div className="border-b border-white/5 bg-[#111] px-3 py-4 text-right text-xs text-[#777]">{slot}</div>
                {visibleDays.map(day => {
                  const hour = Number(slot.split(":")[0]);
                  const events = filteredSessions.filter(item => item.trainingDateIso === day.key && sessionHour(item.trainingTime) === hour);
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] p-5 shadow-2xl">
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
              {selectedSessionRequest && (
                <button
                  type="button"
                  onClick={() => onNavigate("notifications")}
                  className="flex w-full justify-between rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-left"
                >
                  <span className="text-amber-200">Member yêu cầu đổi lịch</span>
                  <span className="text-xs font-bold text-amber-300">Open notification</span>
                </button>
              )}
            </div>
            <div className="mt-5 space-y-4 rounded-xl border border-white/8 bg-[#111] p-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[#777]">Choose a prepared workout</label>
                <select
                  value={selectedPlanId}
                  onChange={event => applyWorkoutPlan(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#222] px-3 py-2.5 text-sm text-white focus:border-[#FF3B3B]/60 focus:outline-none"
                >
                  <option value="">Enter content manually</option>
                  {workoutPlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </div>
              <Input label="Workout name" value={sessionTitle} onChange={setSessionTitle} placeholder="Example: Upper Body Strength" />
              <Textarea label="General notes" value={sessionContent} onChange={setSessionContent} rows={3} />
              <ExerciseEditor
                exercises={sessionExercises}
                onAdd={() => setSessionExercises(current => [...current, createEmptyExercise()])}
                onUpdate={updateSessionExercise}
                onRemove={(id) => setSessionExercises(current => current.filter(exercise => exercise.exerciseId !== id))}
              />
              {!sessionTitle.trim() && !sessionContent.trim() && !sessionExercises.length && (
                <p className="text-xs font-semibold text-amber-300">This workout session is empty. Enter content or choose a workout.</p>
              )}
              <button
                type="button"
                disabled={isSavingContent}
                onClick={saveSessionContent}
                className="w-full rounded-xl bg-[#FF3B3B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#cc2e2e] disabled:cursor-wait disabled:opacity-60"
              >
                {isSavingContent ? "Updating..." : "Update content & notify member"}
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2">
              <PrimaryBtn label="View Member" icon={User} onClick={() => { setSelectedSession(null); onViewMember(selectedMember.id); }} />
              <GhostBtn label="Mark" icon={CheckCircle} onClick={() => setShowMarkOptions(current => !current)} />
              <div className={`grid overflow-hidden transition-all duration-200 ${showMarkOptions ? "max-h-24 grid-cols-2 gap-2 opacity-100" : "max-h-0 grid-cols-2 gap-2 opacity-0"}`}>
                <button type="button" onClick={() => updateSessionStatus(selectedSession.scheduleId, "Completed")} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20">Mark Completed</button>
                <button type="button" onClick={() => updateSessionStatus(selectedSession.scheduleId, "Incomplete")} className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs font-bold text-red-300 hover:bg-red-400/20">Mark Incomplete</button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
// SCREEN 5: WORKOUT GUIDANCE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WorkoutGuidanceScreen({ showToast }: { showToast: (msg: string) => void }) {
  const newExercise = (): Exercise => ({
    exerciseId: `EX${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseName: "",
    sets: 3,
    reps: 10,
    restTime: 60,
    difficulty: "Medium",
    muscleGroup: "",
    instruction: "",
  });
  const [workoutName, setWorkoutName] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([newExercise()]);
  const [workoutPlans, setWorkoutPlans] = useState<DetailedWorkoutPlan[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<DetailedWorkoutPlan | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showWorkoutList, setShowWorkoutList] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadWorkoutPlans = async () => {
    setIsLoadingPlans(true);
    const { data, error } = await getDetailedWorkoutPlansForTrainer(getCurrentUser());
    setWorkoutPlans(data || []);
    setIsLoadingPlans(false);
    if (error) showToast("Workout list could not be loaded.");
  };

  useEffect(() => {
    void loadWorkoutPlans();
  }, []);

  const addExercise = () => {
    setExercises(prev => [...prev, newExercise()]);
  };

  const removeExercise = (id: string) => setExercises(prev => prev.filter(e => e.exerciseId !== id));

  const updateEx = (id: string, field: keyof Exercise, value: string | number) =>
    setExercises(prev => prev.map(e => e.exerciseId === id ? { ...e, [field]: value } : e));

  const resetForm = () => {
    setEditingPlanId(null);
    setWorkoutName("");
    setGoal("");
    setStatus("draft");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setExercises([newExercise()]);
  };

  const editWorkout = (plan: DetailedWorkoutPlan) => {
    setEditingPlanId(plan.id);
    setWorkoutName(plan.name);
    setGoal(plan.goal);
    setStatus(plan.status);
    setStartDate(plan.startDate);
    setEndDate(plan.endDate);
    setNotes(plan.notes);
    setExercises(plan.exercises.length ? plan.exercises : [newExercise()]);
    setSelectedPlanDetail(null);
    setShowWorkoutList(false);
  };

  const saveWorkout = async () => {
    const draft = {
      name: workoutName,
      goal,
      status,
      startDate,
      endDate,
      notes,
      exercises,
    };

    setIsSaving(true);
    const result = editingPlanId
      ? await updateWorkoutPlan(getCurrentUser(), editingPlanId, draft)
      : await createWorkoutPlan(getCurrentUser(), draft);
    setIsSaving(false);

    if (result.error) {
      showToast(result.error.message || "Workout could not be saved.");
      return;
    }

    showToast(editingPlanId ? "Workout updated." : "New workout created.");
    resetForm();
    await loadWorkoutPlans();
  };

  const removeWorkout = async (planId: string) => {
    const { error } = await deleteWorkoutPlan(getCurrentUser(), planId);
    if (error) {
      showToast("Workout could not be deleted.");
      return;
    }
    setPendingDeleteId(null);
    setSelectedPlanDetail(current => current?.id === planId ? null : current);
    setWorkoutPlans(current => current.filter(plan => plan.id !== planId));
    showToast("Workout deleted.");
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>CREATE NEW WORKOUT</h1>
          <p className="text-[#555] text-xs mt-1">Create reusable workouts for quickly updating workout sessions.</p>
        </div>
        <GhostBtn icon={Eye} label={`Workout list (${workoutPlans.length})`} small onClick={() => setShowWorkoutList(true)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title={editingPlanId ? "Edit workout" : "Create new workout"}>
            <div className="space-y-4">
              <Input label="Workout name" value={workoutName} onChange={setWorkoutName} placeholder="Example: Upper Body Strength" />
              <Textarea label="Workout goal" value={goal} onChange={setGoal} rows={2} />
              <Textarea label="General notes" value={notes} onChange={setNotes} rows={4} />
              <div className="grid grid-cols-2 gap-2">
                {editingPlanId && <GhostBtn label="Cancel edit" onClick={resetForm} />}
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={saveWorkout}
                  className={`${editingPlanId ? "" : "col-span-2"} rounded-xl bg-[#FF3B3B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#cc2e2e] disabled:cursor-wait disabled:opacity-60`}
                >
                  {isSaving ? "Saving..." : editingPlanId ? "Save changes" : "Save workout"}
                </button>
              </div>
            </div>
          </SectionCard>

          <div className="bg-[#181818] border border-white/5 rounded-xl p-4">
            <div className="text-xs text-[#555] space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Total exercises</span>
                <span className="text-white font-semibold">{exercises.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total sets</span>
                <span className="text-white font-semibold">{exercises.reduce((s, e) => s + e.sets, 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average rest time</span>
                <span className="text-white font-semibold">{exercises.length ? Math.round(exercises.reduce((s, e) => s + e.restTime, 0) / exercises.length) : 0}s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-end">
            <PrimaryBtn icon={Plus} label="Add exercise" small onClick={addExercise} />
          </div>
          {exercises.map((ex, idx) => (
            <div key={ex.exerciseId} className="rounded-xl border border-white/5 bg-[#181818] p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#FF3B3B]/25 bg-[#FF3B3B]/15 text-xs font-bold text-[#FF3B3B]">{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#BDBDBD]">Exercise name</div>
                  <input
                    value={ex.exerciseName}
                    onChange={e => updateEx(ex.exerciseId, "exerciseName", e.target.value)}
                    placeholder="Example: Barbell bench press"
                    className="w-full rounded-lg border border-white/10 bg-[#222] px-3 py-3 text-base font-semibold text-white outline-none transition-colors placeholder:text-[#555] focus:border-[#FF3B3B]/60"
                  />
                </div>
                <button onClick={() => removeExercise(ex.exerciseId)} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#555] transition-all hover:bg-red-400/10 hover:text-red-400" aria-label="Remove exercise">
                  <X className="size-3" />
                </button>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-3">
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
              <div className="mb-3 grid grid-cols-1 gap-3 xl:grid-cols-[1fr_0.7fr]">
                <div>
                  <div className="mb-1 text-xs text-[#555]">Muscle group</div>
                  <div className="flex min-h-[42px] items-center rounded-lg border border-white/8 bg-[#222] px-3 py-2 text-xs text-white">
                    {ex.muscleGroup || "Chọn một hoặc nhiều nhóm cơ"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs text-[#555]">Difficulty</div>
                  <select
                    value={ex.difficulty}
                    onChange={e => updateEx(ex.exerciseId, "difficulty", e.target.value)}
                    className="min-h-[42px] w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-[#FF3B3B]/40"
                  >
                    {["Easy", "Medium", "Hard", "Very Hard"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <MuscleGroupSelector
                  value={ex.muscleGroup}
                  onChange={(value) => updateEx(ex.exerciseId, "muscleGroup", value)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs text-[#555]">Technique instruction</div>
                <input
                  value={ex.instruction}
                  onChange={e => updateEx(ex.exerciseId, "instruction", e.target.value)}
                  className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-[#FF3B3B]/40"
                />
              </div>
            </div>
          ))}
          {!exercises.length && (
            <button type="button" onClick={addExercise} className="w-full rounded-xl border border-dashed border-white/10 bg-[#181818] p-10 text-sm font-semibold text-[#777] hover:border-[#FF3B3B]/40 hover:text-white">
              Add the first exercise
            </button>
          )}
        </div>
      </div>

      {showWorkoutList && (
        <ModalOverlay onClose={() => { setShowWorkoutList(false); setSelectedPlanDetail(null); setPendingDeleteId(null); }}>
          <div className="max-h-[88vh] w-[min(920px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#181818] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-white">Created workouts</h3>
                <p className="mt-1 text-xs text-[#666]">View details, edit, or delete reusable workouts.</p>
              </div>
              <button type="button" onClick={() => setShowWorkoutList(false)} className="rounded-lg p-2 text-[#777] hover:bg-white/5 hover:text-white"><X className="size-4" /></button>
            </div>
            <div className="p-5">
              {isLoadingPlans ? (
                <div className="py-12 text-center text-sm text-[#777]">Loading workouts...</div>
              ) : workoutPlans.length ? (
                <div className="grid gap-3">
                  {workoutPlans.map(plan => (
                    <div key={plan.id} className="rounded-xl border border-white/5 bg-[#111] p-4">
                      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-white">{plan.name}</h4>
                            <Badge status={plan.status} />
                          </div>
                          <p className="mt-1 text-xs text-[#777]">{plan.exercises.length} exercises - Reusable workout</p>
                          <p className="mt-2 line-clamp-2 text-sm text-[#BDBDBD]">{plan.goal || "No goal yet."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <GhostBtn icon={Eye} label="Details" small onClick={() => setSelectedPlanDetail(plan)} />
                          <GhostBtn icon={Edit2} label="Edit" small onClick={() => editWorkout(plan)} />
                          {pendingDeleteId === plan.id ? (
                            <>
                              <button type="button" onClick={() => removeWorkout(plan.id)} className="rounded-lg bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600">Confirm delete</button>
                              <GhostBtn label="Cancel" small onClick={() => setPendingDeleteId(null)} />
                            </>
                          ) : (
                            <button type="button" onClick={() => setPendingDeleteId(plan.id)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-400/10"><Trash2 className="mr-1 inline size-3" />Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-sm text-[#777]">No workouts created yet.</div>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {selectedPlanDetail && (
        <ModalOverlay onClose={() => setSelectedPlanDetail(null)}>
          <div className="max-h-[85vh] w-[min(680px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPlanDetail.name}</h3>
                <p className="mt-1 text-xs text-[#777]">Reusable workout - {selectedPlanDetail.status}</p>
              </div>
              <button type="button" onClick={() => setSelectedPlanDetail(null)} className="rounded-lg p-2 text-[#777] hover:bg-white/5 hover:text-white"><X className="size-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-[#111] p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-[#FF3B3B]">Workout goal</div>
                <p className="mt-2 text-sm text-[#D5D5D5]">{selectedPlanDetail.goal || "No goal yet."}</p>
                {selectedPlanDetail.notes && <p className="mt-2 text-xs text-[#777]">{selectedPlanDetail.notes}</p>}
              </div>
              {selectedPlanDetail.exercises.map((exercise, index) => (
                <div key={exercise.exerciseId} className="rounded-xl border border-white/5 bg-[#111] p-4">
                  <div className="font-bold text-white">{index + 1}. {exercise.exerciseName}</div>
                  <div className="mt-2 text-xs text-[#777]">{exercise.sets} sets - {exercise.reps} reps - rest {exercise.restTime}s - {exercise.difficulty}</div>
                  {exercise.instruction && <p className="mt-2 text-sm text-[#BDBDBD]">{exercise.instruction}</p>}
                </div>
              ))}
              <GhostBtn icon={Edit2} label="Edit this workout" onClick={() => editWorkout(selectedPlanDetail)} />
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 6: PROGRESS EVALUATION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 7: NOTIFICATIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCREEN 8: SETTINGS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-2">
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
        <div className="xl:col-span-3 xl:pl-4">
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [dob, setDob] = useState(profile.dob || "");
  const [headline, setHeadline] = useState(profile.headline);
  const [specialty, setSpecialty] = useState(profile.specialty || profile.roleLabel);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [experience, setExperience] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setDob(profile.dob || "");
    setHeadline(profile.headline);
    setSpecialty(profile.specialty || profile.roleLabel);
    setAvatarUrl(profile.avatarUrl || "");
  }, [profile.firstName, profile.lastName, profile.dob, profile.headline, profile.specialty, profile.roleLabel, profile.avatarUrl]);
  const displayName = profile.fullName || [firstName, lastName].filter(Boolean).join(" ").trim() || "PT Profile";
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

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setIsUploadingAvatar(true);
    setStatusMessage("");
    const result = await uploadCurrentUserAvatar(getCurrentUser(), file);
    setIsUploadingAvatar(false);
    setStatusMessage(result.message);
    showToast(result.message);

    if (result.ok && result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      const currentUser = getCurrentUser();
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          avatarUrl: result.avatarUrl,
          avatar_url: result.avatarUrl,
        });
      }
    }
  };

  return (
    <div className="space-y-5 pb-6 max-w-4xl">
      <div>
        <h1 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{displayName}</h1>
        <p className="text-[#555] text-xs mt-1">Tài khoản huấn luyện viên cá nhân</p>
      </div>

      {(isLoading || errorMessage) && (
        <div className="rounded-xl border border-white/10 bg-[#181818] p-4 text-sm font-bold text-[#BDBDBD]">
          {isLoading ? "Loading profile..." : errorMessage}
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
                {avatarUrl ? (
                  <img src={avatarUrl} alt={`${displayName} avatar`} className="size-full rounded-2xl object-cover" />
                ) : (
                  profile.initials
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => uploadAvatar(event.target.files?.[0])}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 size-7 bg-[#FF3B3B] rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-[#cc2e2e] transition-colors disabled:cursor-not-allowed disabled:bg-white/20"
              >
                {isUploadingAvatar ? <span className="text-[10px] font-black text-white">...</span> : <Camera className="size-3.5 text-white" />}
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
            <p className="text-[#555] text-xs mt-3">Email và số điện thoại được lấy từ hồ sơ tài khoản.</p>
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MODALS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TOAST
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

function EquipmentReportScreen({ showToast }: { showToast: (msg: string) => void }) {
  const [equipment, setEquipment] = useState<Array<{ equipmentUuid?: string; equipmentName: string; room: string }>>([]);
  const [form, setForm] = useState({
    equipmentName: "",
    equipmentUuid: "",
    room: "",
    roomId: "",
    issueDescription: "",
    severity: "Medium",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    getStaffEquipmentStatus().then(({ data, error }) => {
      if (!isMounted) return;
      setEquipment(error ? [] : data.equipment);
      setMessage(error ? "Equipment data could not be loaded." : "");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectEquipment = (equipmentName: string) => {
    const item = equipment.find((entry) => entry.equipmentName === equipmentName);
    setForm((current) => ({
      ...current,
      equipmentName,
      equipmentUuid: item?.equipmentUuid || "",
      room: item?.room || current.room,
    }));
  };

  const submitReport = async () => {
    if (!form.equipmentName || !form.room || !form.issueDescription.trim()) return;

    const result = await createStaffMaintenanceReport({
      ...form,
      priority: form.severity.toLowerCase(),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setForm({
      equipmentName: "",
      equipmentUuid: "",
      room: "",
      roomId: "",
      issueDescription: "",
      severity: "Medium",
    });
    setMessage("");
    showToast("Equipment report submitted.");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Equipment Reports</h1>
          <p className="text-[#777] text-sm mt-1">Report broken or unsafe equipment directly from the PT portal.</p>
        </div>
        <div className="rounded-xl border border-[#FF3B3B]/20 bg-[#FF3B3B]/10 px-4 py-3 text-xs font-semibold text-[#FF6B6B]">
          Reports are sent to staff and admin maintenance queues.
        </div>
      </div>

      {message && <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm font-bold text-amber-300">{message}</div>}

      <SectionCard title="New Equipment Report">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#BDBDBD] mb-1.5 uppercase tracking-wide">Equipment</label>
            <select
              value={form.equipmentName}
              onChange={(event) => selectEquipment(event.target.value)}
              className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#FF3B3B]/60 transition-colors"
            >
              <option value="">Select equipment...</option>
              {equipment.map((item) => (
                <option key={`${item.equipmentUuid}-${item.equipmentName}`} value={item.equipmentName}>
                  {item.equipmentName}
                </option>
              ))}
            </select>
          </div>
          <Input label="Room / location" value={form.room} onChange={(room) => setForm((current) => ({ ...current, room }))} />
          <Select label="Severity" value={form.severity} onChange={(severity) => setForm((current) => ({ ...current, severity }))} options={["Low", "Medium", "High", "Urgent"]} />
          <div className="md:col-span-2">
            <Textarea label="Issue description" value={form.issueDescription} onChange={(issueDescription) => setForm((current) => ({ ...current, issueDescription }))} rows={5} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <PrimaryBtn label="Submit Report" icon={AlertTriangle} onClick={submitReport} />
        </div>
      </SectionCard>

      <SectionCard title="Equipment Directory">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {equipment.slice(0, 9).map((item) => (
            <button
              key={`${item.equipmentUuid}-${item.equipmentName}-card`}
              type="button"
              onClick={() => selectEquipment(item.equipmentName)}
              className="rounded-xl border border-white/8 bg-[#222] p-4 text-left transition hover:border-[#FF3B3B]/40"
            >
              <div className="text-sm font-bold text-white">{item.equipmentName}</div>
              <div className="mt-1 text-xs text-[#777]">{item.room}</div>
            </button>
          ))}
          {!equipment.length && <p className="text-sm text-[#777]">No equipment records available.</p>}
        </div>
      </SectionCard>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// APP ROOT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const { darkMode, setDarkMode } = useAppearance();
  const [, setPtDataVersion] = useState(0);
  const [ptDataMessage, setPtDataMessage] = useState("");
  const { profile } = useSupabaseUserProfile('trainer');

  useEffect(() => {
    let isMounted = true;

    fetchPtPortalData().then(({ data, error }) => {
      if (!isMounted) return;

      if (data) {
        applyPtPortalData(data);
        setPtDataVersion((version) => version + 1);
      }

      setPtDataMessage(error ? "PT data could not be loaded." : "");
    });

    return () => {
      isMounted = false;
    };
  }, []);

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
      userAvatarUrl={profile.avatarUrl}
      onAvatarClick={() => navigate("profile")}
      darkMode={darkMode}
    >
        <div className="p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {ptDataMessage && (
            <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm font-bold text-amber-300">
              {ptDataMessage}
            </div>
          )}
          {screen === "dashboard" && (
            <DashboardScreen onNavigate={navigate} onViewMember={viewMember} />
          )}
          {screen === "trainees" && (
            <ManageTraineesScreen onViewMember={viewMember} />
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
              onViewMember={viewMember}
              showToast={showToast}
              onNavigate={navigate}
            />
          )}
          {screen === "workout" && <WorkoutGuidanceScreen showToast={showToast} />}
          {screen === "equipment-report" && <EquipmentReportScreen showToast={showToast} />}
          {screen === "evaluation" && <ProgressEvaluationScreen showToast={showToast} />}
          {screen === "meal-plan" && <MealPlanScreen showToast={showToast} />}
          {screen === "notifications" && <NotificationsScreen />}
          {screen === "profile" && <ProfileScreen showToast={showToast} />}
          {screen === "settings" && <SettingsScreen showToast={showToast} darkMode={darkMode} setDarkMode={setDarkMode} />}
        </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </RoleShell>
  );
}



