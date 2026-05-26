import { supabase } from "./supabaseClient";
import { getCurrentUser } from "./authService";

function fullName(row, fallback = "Member") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return row?.full_name || name || row?.username || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

async function resolveCurrentTrainer() {
  const currentUser = getCurrentUser();
  if (!supabase || !currentUser) return null;
  const explicitTrainerId = currentUser.trainerId || currentUser.trainer_id;
  if (explicitTrainerId) {
    const { data } = await supabase.from("trainers").select("*").eq("trainer_id", explicitTrainerId).maybeSingle();
    if (data) return data;
  }
  const userId = currentUser.userId || currentUser.user_id || currentUser.id;
  if (userId) {
    const { data } = await supabase.from("trainers").select("*").eq("user_id", userId).maybeSingle();
    if (data) return data;
  }
  const email = currentUser.email ? String(currentUser.email).toLowerCase() : "";
  if (email) {
    const { data: user } = await supabase.from("users").select("user_id").eq("email", email).maybeSingle();
    if (user?.user_id) {
      const { data } = await supabase.from("trainers").select("*").eq("user_id", user.user_id).maybeSingle();
      if (data) return data;
    }
  }
  return null;
}

async function fetchUsersByIds(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("users")
    .select("user_id,first_name,last_name,email,phone_number,date_of_birth,gender,avatar_url")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((user) => [user.user_id, user]));
}

async function fetchMembersByIds(memberIds) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("members")
    .select("member_id,user_id,member_code,full_name,join_date,status")
    .in("member_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((member) => [member.member_id, member]));
}

async function fetchPackagesByIds(packageIds) {
  const ids = [...new Set((packageIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("packages")
    .select("package_id,package_name,duration_months,session_limit")
    .in("package_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((pkg) => [pkg.package_id, pkg]));
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "PT";
}

function mapSessionStatus(status) {
  if (status === "completed") return "Done";
  if (status === "cancelled") return "Cancelled";
  if (status === "missed" || status === "no_show") return "No Show";
  if (status === "pending_reschedule" || status === "rescheduled") return "Pending Reschedule";
  return "Scheduled";
}

export async function fetchPtPortalData() {
  if (!supabase) return { data: null, error: new Error("Missing h\u1ec7 th\u1ed1ng configuration.") };

  try {
    const trainer = await resolveCurrentTrainer();
    if (!trainer?.trainer_id) {
      return {
        data: {
          trainer: null,
          members: [],
          assignments: [],
          schedules: [],
          progressRecords: [],
          trainingGoals: [],
          bodyMetrics: [],
          medicalHistories: [],
          bodyMetricDetails: [],
          mealPlans: [],
          evaluations: [],
          notifications: [],
          exercises: [],
          weeklySessions: [],
          progressChart: [],
          attendanceData: [],
        },
        error: null,
      };
    }

    const [
      assignmentResult,
      sessionResult,
      goalResult,
      progressResult,
      bodyMetricResult,
      medicalResult,
      mealPlanResult,
      mealAssignmentResult,
      reviewResult,
      notificationResult,
      workoutPlanResult,
    ] = await Promise.all([
      supabase.from("trainer_assignments").select("*").eq("trainer_id", trainer.trainer_id).order("assigned_at", { ascending: false }),
      supabase.from("workout_sessions").select("*").eq("trainer_id", trainer.trainer_id).order("session_date", { ascending: true }),
      supabase.from("training_goals").select("*").eq("trainer_id", trainer.trainer_id).order("created_at", { ascending: false }),
      supabase.from("progress_records").select("*").eq("trainer_id", trainer.trainer_id).order("record_date", { ascending: false }),
      supabase.from("body_metrics").select("*").eq("recorded_by_trainer_id", trainer.trainer_id).order("recorded_at", { ascending: false }),
      supabase.from("medical_records").select("*").order("created_at", { ascending: false }),
      supabase.from("meal_plans").select("*").eq("trainer_id", trainer.trainer_id).order("created_at", { ascending: false }),
      supabase.from("meal_plan_assignments").select("*").eq("trainer_id", trainer.trainer_id).order("assigned_at", { ascending: false }),
      supabase.from("performance_reviews").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("notifications").select("*").eq("user_id", trainer.user_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("workout_plan_exercises").select("*").order("display_order", { ascending: true }).limit(100),
    ]);

    [
      assignmentResult,
      sessionResult,
      goalResult,
      progressResult,
      bodyMetricResult,
      medicalResult,
      mealPlanResult,
      mealAssignmentResult,
      reviewResult,
      notificationResult,
      workoutPlanResult,
    ].forEach((result) => {
      if (result.error) throw result.error;
    });

    const memberIds = [
      ...(assignmentResult.data || []).map((row) => row.member_id),
      ...(sessionResult.data || []).map((row) => row.member_id),
      ...(goalResult.data || []).map((row) => row.member_id),
      ...(progressResult.data || []).map((row) => row.member_id),
      ...(bodyMetricResult.data || []).map((row) => row.member_id),
      ...(medicalResult.data || []).map((row) => row.member_id),
      ...(mealAssignmentResult.data || []).map((row) => row.member_id),
    ];
    const membersById = await fetchMembersByIds(memberIds);
    const usersById = await fetchUsersByIds(Object.values(membersById).map((member) => member.user_id));
    const packagesById = await fetchPackagesByIds((sessionResult.data || []).map((row) => row.package_id));
    const mealPlansById = Object.fromEntries((mealPlanResult.data || []).map((plan) => [plan.meal_plan_id, plan]));

    const memberRows = Object.values(membersById).map((member) => {
      const user = usersById[member.user_id] || {};
      const name = fullName(user, member.full_name || member.member_code || "Member");
      const dob = new Date(user.date_of_birth);
      const age = Number.isNaN(dob.getTime()) ? 0 : new Date().getFullYear() - dob.getFullYear();
      return {
        id: member.member_id,
        name,
        phone: user.phone_number || "",
        email: user.email || "",
        package: "Membership",
        avatar: initials(name),
        joinDate: formatDisplayDate(member.join_date || member.created_at),
        age,
        gender: user.gender || "unspecified",
      };
    });

    const assignments = (assignmentResult.data || []).map((row) => ({
      assignmentId: row.trainer_assignment_id,
      memberId: row.member_id,
      assignmentDate: formatDisplayDate(row.assigned_at),
      status: row.status === "paused" ? "Paused" : row.status === "completed" ? "Completed" : "Active",
      sessionsRemaining: 0,
      progress: 0,
      totalSessions: 0,
    }));

    const schedules = (sessionResult.data || []).map((row) => {
      const member = membersById[row.member_id] || {};
      const user = usersById[member.user_id] || {};
      const pkg = packagesById[row.package_id] || {};
      return {
        scheduleId: row.workout_session_id || row.session_id,
        memberId: row.member_id,
        trainingDate: formatDisplayDate(row.session_date),
        trainingDateIso: formatDate(row.session_date),
        trainingTime: String(row.start_time || "").slice(0, 5),
        exerciseType: row.exercise_type || row.session_title || row.title || "Workout",
        status: mapSessionStatus(row.status),
        duration: 60,
        memberName: fullName(user, member.full_name || "Member"),
        packageName: pkg.package_name || "",
        roomName: row.room_name || "",
        notes: row.note || row.notes || "",
        source: "supabase",
      };
    });

    const progressRecords = (progressResult.data || []).map((row) => ({
      progressId: row.progress_record_id,
      memberId: row.member_id,
      scheduleId: row.workout_session_id || "",
      recordedDate: formatDisplayDate(row.record_date),
      completionLevel: Number(row.performance_score || 0),
      note: row.notes || "",
    }));

    const goals = (goalResult.data || []).map((row) => ({
      goalId: row.training_goal_id,
      memberId: row.member_id,
      goalName: row.goal_title,
      targetValue: [row.target_value, row.unit].filter(Boolean).join(" "),
      deadline: formatDisplayDate(row.target_date),
      status: row.status === "completed" ? "Completed" : row.status === "active" ? "In Progress" : "Overdue",
      progress: row.target_value ? Math.min(100, Math.round((Number(row.current_value || 0) / Number(row.target_value || 1)) * 100)) : 0,
    }));

    const bodyMetrics = (bodyMetricResult.data || []).map((row) => ({
      metricId: row.body_metric_id,
      memberId: row.member_id,
      weight: Number(row.weight_kg || 0),
      bodyFatRate: Number(row.body_fat_percent || 0),
      measuredDate: formatDisplayDate(row.recorded_at),
    }));

    const medicalHistories = (medicalResult.data || [])
      .filter((row) => membersById[row.member_id])
      .map((row) => ({
        memberId: row.member_id,
        conditions: row.condition_name || "",
        injuries: row.injury_notes || "",
        allergies: row.allergies || "",
        medicationNotes: row.medications || "",
        trainingRestrictions: row.clearance_status || "",
        emergencyContact: row.emergency_notes || "",
        lastUpdated: formatDate(row.updated_at || row.created_at),
      }));

    const latestMetricByMember = {};
    bodyMetricResult.data?.forEach((row) => {
      if (!latestMetricByMember[row.member_id]) latestMetricByMember[row.member_id] = row;
    });
    const bodyMetricDetails = Object.entries(latestMetricByMember).map(([memberId, row]) => ({
      memberId,
      height: row.height_cm ? `${row.height_cm} cm` : "",
      weight: row.weight_kg ? `${row.weight_kg} kg` : "",
      bmi: row.height_cm && row.weight_kg ? (Number(row.weight_kg) / Math.pow(Number(row.height_cm) / 100, 2)).toFixed(1) : "",
      bodyFatPercentage: row.body_fat_percent ? `${row.body_fat_percent}%` : "",
      bloodPressure: "",
      restingHeartRate: "",
      fitnessGoal: "",
      latestMeasurementDate: formatDate(row.recorded_at),
    }));

    const mealPlans = (mealPlanResult.data || []).map((row) => {
      const assignment = (mealAssignmentResult.data || []).find((item) => item.meal_plan_id === row.meal_plan_id);
      const meals = Array.isArray(row.meals) ? row.meals : [];
      return {
        id: row.meal_plan_id,
        name: row.plan_name,
        goal: row.goal || "",
        caloriesPerDay: Number(row.calories_per_day || 0),
        breakfast: meals.find((meal) => meal.name === "breakfast")?.items || "",
        lunch: meals.find((meal) => meal.name === "lunch")?.items || "",
        dinner: meals.find((meal) => meal.name === "dinner")?.items || "",
        snacks: meals.find((meal) => meal.name === "snacks")?.items || "",
        notes: row.notes || "",
        assignedMemberId: assignment?.member_id || "",
        startDate: formatDate(assignment?.assigned_at),
        endDate: "",
        status: row.status === "draft" ? "Draft" : assignment ? "Assigned" : "Completed",
      };
    });

    const evaluations = (reviewResult.data || []).map((row) => ({
      evaluationId: row.performance_review_id,
      memberId: row.employee_id,
      evaluationDate: formatDisplayDate(row.reviewed_at || row.created_at),
      overallComment: row.goals || "",
      strengths: row.strengths || "",
      improvements: row.improvement_areas || "",
      recommendation: row.goals || "",
      rating: Number(row.rating || 0),
    }));

    const notifications = (notificationResult.data || []).map((row) => ({
      id: row.notification_id,
      type: row.notification_type === "system" ? "info" : "success",
      title: row.title,
      message: row.message,
      time: formatDisplayDate(row.created_at),
      read: Boolean(row.is_read),
    }));

    const exercises = (workoutPlanResult.data || []).map((row) => ({
      exerciseId: row.workout_plan_exercise_id,
      exerciseName: row.exercise_name,
      sets: Number(row.sets || 0),
      reps: row.reps || "",
      restTime: 60,
      difficulty: row.intensity || "",
      muscleGroup: row.exercise_type || "",
      instruction: row.notes || "",
    }));

    const weeklyMap = {};
    schedules.forEach((row) => {
      const date = new Date(row.trainingDateIso);
      const day = Number.isNaN(date.getTime()) ? row.trainingDate : date.toLocaleDateString("vi-VN", { weekday: "short" });
      weeklyMap[day] = (weeklyMap[day] || 0) + 1;
    });

    const attendanceCounts = {
      Completed: schedules.filter((row) => row.status === "Done").length,
      Missed: schedules.filter((row) => row.status === "No Show").length,
      Cancelled: schedules.filter((row) => row.status === "Cancelled").length,
    };
    const attendanceTotal = Math.max(1, Object.values(attendanceCounts).reduce((sum, value) => sum + value, 0));

    return {
      data: {
        trainer: {
          name: trainer.full_name || trainer.trainer_code || "Trainer",
          specialty: trainer.specialty || "Personal Training",
          phone: "",
          email: "",
          avatar: initials(trainer.full_name || trainer.trainer_code),
        },
        members: memberRows,
        assignments,
        schedules,
        progressRecords,
        trainingGoals: goals,
        bodyMetrics,
        medicalHistories,
        bodyMetricDetails,
        mealPlans,
        evaluations,
        notifications,
        exercises,
        weeklySessions: Object.entries(weeklyMap).map(([day, sessions]) => ({ day, sessions, target: sessions })),
        progressChart: goals.map((goal) => ({
          name: membersById[goal.memberId]?.full_name || goal.goalName,
          progress: goal.progress,
        })),
        attendanceData: [
          { name: "Completed", value: Math.round((attendanceCounts.Completed / attendanceTotal) * 100), color: "#FF3B3B" },
          { name: "Missed", value: Math.round((attendanceCounts.Missed / attendanceTotal) * 100), color: "#3a3a3a" },
          { name: "Cancelled", value: Math.round((attendanceCounts.Cancelled / attendanceTotal) * 100), color: "#555555" },
        ],
      },
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load PT portal data:", error);
    return { data: null, error };
  }
}
