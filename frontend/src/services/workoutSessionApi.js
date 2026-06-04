import { supabase } from "./supabaseClient";
import { resolveCurrentMemberId } from "./memberPackageApi";
import {
  generateSessionsForPackageRange,
  generateUpcomingSessions,
} from "./workoutScheduleGenerator";
import { formatSessionExerciseContent, getSessionStatusLabel, normalizeSessionStatus } from "./sessionModel";
import { findConflictingPtSession } from "./workoutSessionConflict";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapWorkoutSessionRow(row) {
  if (!row) return null;

  return {
    sessionId: row.workout_session_id || row.session_id,
    memberId: row.member_id,
    trainerId: row.trainer_id,
    packageId: row.package_id,
    memberPackageId: row.member_package_id,
    sessionTitle: row.session_title || row.title,
    exerciseType: row.exercise_type,
    roomName: row.room_name,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    note: row.note || row.notes || "",
    workoutContent: Array.isArray(row.workout_content) ? row.workout_content : [],
    memberName: row.memberName || "Member",
    trainerName: row.trainerName || "Trainer",
    packageName: row.packageName || "",
    isPtSession: Boolean(row.trainer_id),
    hasContent: Boolean(
      (row.session_title || row.title || "").trim()
      || (row.note || row.notes || "").trim()
      || (Array.isArray(row.workout_content) && row.workout_content.length),
    ),
  };
}

export function getWorkoutSessionStatusLabel(status) {
  return getSessionStatusLabel(status);
}

function formatTimeRange(startTime, endTime) {
  const start = String(startTime || "").slice(0, 5);
  const end = String(endTime || "").slice(0, 5);
  return end ? `${start} - ${end}` : start;
}

function combineUserName(user, fallback = "") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

async function findTrainerIdByUserId(userId) {
  if (!userId || !uuidPattern.test(String(userId))) return null;

  const { data } = await supabase
    .from("trainers")
    .select("trainer_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.trainer_id || null;
}

async function findTrainerIdByUserField(field, value) {
  if (!value) return null;

  const { data: user } = await supabase
    .from("users")
    .select("user_id")
    .eq(field, value)
    .maybeSingle();

  if (!user?.user_id) return null;
  return findTrainerIdByUserId(user.user_id);
}

async function resolveCurrentTrainerId(currentUser) {
  if (!supabase) return null;

  const directTrainerId = currentUser?.trainerId || currentUser?.trainer_id;
  if (directTrainerId && uuidPattern.test(String(directTrainerId))) {
    const { data } = await supabase
      .from("trainers")
      .select("trainer_id")
      .eq("trainer_id", directTrainerId)
      .maybeSingle();

    if (data?.trainer_id) return data.trainer_id;
  }

  const trainerFromUserId = await findTrainerIdByUserId(currentUser?.userId || currentUser?.user_id);
  if (trainerFromUserId) return trainerFromUserId;

  const trainerFromEmail = await findTrainerIdByUserField("email", currentUser?.email);
  if (trainerFromEmail) return trainerFromEmail;

  const trainerFromUsername = await findTrainerIdByUserField("username", currentUser?.username);
  if (trainerFromUsername) return trainerFromUsername;

  return null;
}

async function loadMemberNames(memberIds) {
  const ids = [...new Set(memberIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data: members } = await supabase
    .from("members")
    .select("member_id, user_id, member_code")
    .in("member_id", ids);

  const userIds = [...new Set((members || []).map((member) => member.user_id).filter(Boolean))];
  let usersById = {};

  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    usersById = Object.fromEntries((users || []).map((user) => [user.user_id, combineUserName(user, "")]));
  }

  return Object.fromEntries((members || []).map((member) => [member.member_id, usersById[member.user_id] || member.member_code || "Member"]));
}

async function loadTrainerNames(trainerIds) {
  const ids = [...new Set(trainerIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data: trainers } = await supabase
    .from("trainers")
    .select("trainer_id, user_id, employee_id, trainer_code")
    .in("trainer_id", ids);

  const userIds = [...new Set((trainers || []).map((trainer) => trainer.user_id).filter(Boolean))];
  const employeeIds = [...new Set((trainers || []).map((trainer) => trainer.employee_id).filter(Boolean))];
  let usersById = {};
  let employeesById = {};

  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("user_id, first_name, last_name")
      .in("user_id", userIds);

    usersById = Object.fromEntries((users || []).map((user) => [user.user_id, combineUserName(user, "")]));
  }

  if (employeeIds.length) {
    const { data: employees } = await supabase
      .from("employees")
      .select("employee_id, full_name")
      .in("employee_id", employeeIds);

    employeesById = Object.fromEntries((employees || []).map((employee) => [employee.employee_id, employee.full_name]));
  }

  return Object.fromEntries((trainers || []).map((trainer) => [
    trainer.trainer_id,
    usersById[trainer.user_id] || employeesById[trainer.employee_id] || trainer.trainer_code || "Trainer",
  ]));
}

async function loadPackageNamesByMemberPackage(memberPackageIds) {
  const ids = [...new Set(memberPackageIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data: memberPackages } = await supabase
    .from("member_packages")
    .select("member_package_id, package_id")
    .in("member_package_id", ids);

  const packageIds = [...new Set((memberPackages || []).map((item) => item.package_id).filter(Boolean))];
  let packagesById = {};

  if (packageIds.length) {
    const { data: packages } = await supabase
      .from("packages")
      .select("package_id, package_name")
      .in("package_id", packageIds);

    packagesById = Object.fromEntries((packages || []).map((pkg) => [pkg.package_id, pkg.package_name]));
  }

  return Object.fromEntries((memberPackages || []).map((item) => [item.member_package_id, packagesById[item.package_id] || "Membership package"]));
}

async function selectWorkoutSessions(filterColumn, id) {
  if (!id) return { data: [], error: null };

  return supabase
    .from("workout_sessions")
    .select(`
      workout_session_id,
      member_id,
      trainer_id,
      member_package_id,
      session_title,
      title,
      exercise_type,
      room_name,
      session_date,
      start_time,
      end_time,
      status,
      note,
      notes,
      workout_content,
      created_at
    `)
    .eq(filterColumn, id)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });
}

async function enrichWorkoutSessions(rows) {
  const memberNames = await loadMemberNames((rows || []).map((row) => row.member_id));
  const trainerNames = await loadTrainerNames((rows || []).map((row) => row.trainer_id));
  const packageNames = await loadPackageNamesByMemberPackage((rows || []).map((row) => row.member_package_id));

  return (rows || []).map((row) => mapWorkoutSessionRow({
    ...row,
    memberName: memberNames[row.member_id] || "Member",
    trainerName: trainerNames[row.trainer_id] || "Trainer",
    packageName: packageNames[row.member_package_id] || "",
  }));
}

async function resolveMemberId(data) {
  if (data.memberId && uuidPattern.test(String(data.memberId))) {
    return data.memberId;
  }

  if (data.memberEmail) {
    const { data: member } = await supabase
      .from("members")
      .select(`
        member_id,
        users!inner (
          email
        )
      `)
      .eq("users.email", data.memberEmail)
      .maybeSingle();

    if (member?.member_id) {
      return member.member_id;
    }
  }

  const { data: member } = await supabase
    .from("members")
    .select("member_id")
    .limit(1)
    .maybeSingle();

  return member?.member_id || data.memberId;
}

async function insertTargetWorkoutSessions(rows) {
  return supabase
    .from("workout_sessions")
    .insert(rows.map((row) => ({
      member_id: row.member_id,
      trainer_id: row.trainer_id,
      package_id: row.package_id,
      room_id: row.room_id,
      session_title: row.session_title,
      start_time: `${row.session_date}T${row.start_time}:00`,
      end_time: `${row.session_date}T${row.end_time}:00`,
      status: row.status,
      note: row.note,
    })))
    .select("*");
}

async function insertCurrentSchemaWorkoutSessions(rows) {
  return supabase
    .from("workout_sessions")
    .insert(rows.map((row) => ({
      member_id: row.member_id,
      trainer_id: row.trainer_id,
      member_package_id: row.member_package_id,
      title: row.session_title,
      exercise_type: "",
      room_name: "PT Room",
      session_date: row.session_date,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      notes: row.note,
    })))
    .select("*");
}

async function resolvePackageDateRange(memberPackageId, startDate, endDate) {
  if (startDate && endDate) {
    return { startDate, endDate };
  }

  if (!memberPackageId) {
    return { startDate: null, endDate: null };
  }

  const { data } = await supabase
    .from("member_packages")
    .select("start_date, end_date")
    .eq("member_package_id", memberPackageId)
    .maybeSingle();

  return {
    startDate: startDate || data?.start_date || null,
    endDate: endDate || data?.end_date || null,
  };
}

export async function createWorkoutSessionsForSchedule(data) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create workout sessions:", error);
    return { data: [], error };
  }

  const memberId = await resolveMemberId(data);
  const range = await resolvePackageDateRange(data.memberPackageId, data.startDate, data.endDate);
  const rangedSessions = generateSessionsForPackageRange({
    schedule: data.selectedSchedule,
    startDate: range.startDate,
    endDate: range.endDate,
  });
  const hasPackageDateRange = Boolean(range.startDate && range.endDate);
  const generatedSessions = hasPackageDateRange
    ? rangedSessions
    : generateUpcomingSessions(data.selectedSchedule, data.sessionCount || 4);
  const rows = generatedSessions.map((session) => ({
    member_id: memberId,
    trainer_id: data.trainerId,
    package_id: data.packageId,
    member_package_id: data.memberPackageId || null,
    room_id: data.roomId || null,
    session_title: "",
    session_date: session.sessionDate,
    start_time: session.startTime,
    end_time: session.endTime,
    status: "scheduled",
    note: "",
  }));

  let { data: insertedRows, error } = await insertTargetWorkoutSessions(rows);

  if (error) {
    ({ data: insertedRows, error } = await insertCurrentSchemaWorkoutSessions(rows));
  }

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create workout sessions:", error);
    return { data: rows.map(mapWorkoutSessionRow), error };
  }

  return {
    data: Array.isArray(insertedRows) ? insertedRows.map(mapWorkoutSessionRow) : [],
    error: null,
  };
}

export async function getWorkoutSessionsForMember(currentUser) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member workout sessions:", error);
    return { data: [], error };
  }

  const memberId = await resolveCurrentMemberId(currentUser);
  if (!memberId) {
    return { data: [], error: null };
  }

  const { data, error } = await selectWorkoutSessions("member_id", memberId);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member workout sessions:", error);
    return { data: [], error };
  }

  return {
    data: await enrichWorkoutSessions(data || []),
    error: null,
  };
}

export async function createManualWorkoutSessionForMember(payload, currentUser) {
  if (!supabase) {
    return { data: null, error: new Error("Missing system configuration.") };
  }

  const memberId = await resolveCurrentMemberId(currentUser);
  if (!memberId) {
    return { data: null, error: new Error("Member account was not found.") };
  }

  const candidate = {
    sessionDate: String(payload?.sessionDate || ""),
    startTime: String(payload?.startTime || "").slice(0, 5),
    endTime: String(payload?.endTime || "").slice(0, 5),
  };
  if (!candidate.sessionDate || !candidate.startTime || !candidate.endTime) {
    return { data: null, error: new Error("Enter the workout date, start time, and end time.") };
  }

  const { data: ptRows, error: conflictLoadError } = await supabase
    .from("workout_sessions")
    .select("workout_session_id,trainer_id,session_date,start_time,end_time,status")
    .eq("member_id", memberId)
    .eq("session_date", candidate.sessionDate)
    .not("trainer_id", "is", null);
  if (conflictLoadError) return { data: null, error: conflictLoadError };

  const conflictingPtSession = findConflictingPtSession(candidate, (ptRows || []).map((row) => ({
    sessionId: row.workout_session_id,
    trainerId: row.trainer_id,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
  })));
  if (conflictingPtSession) {
    return { data: null, error: new Error("This time overlaps your fixed PT schedule. Choose another time.") };
  }

  const title = String(payload?.title || "").trim() || "Personal workout";
  const notes = String(payload?.notes || "").trim();
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      member_id: memberId,
      trainer_id: null,
      member_package_id: null,
      title,
      exercise_type: "Personal workout",
      room_name: "Personal workout",
      session_date: candidate.sessionDate,
      start_time: candidate.startTime,
      end_time: candidate.endTime,
      status: "scheduled",
      notes,
    })
    .select("*")
    .single();

  if (error) {
    const message = String(error.message || "").includes("overlaps your fixed PT schedule")
      ? "This time overlaps your fixed PT schedule. Choose another time."
      : error.message;
    return { data: null, error: new Error(message) };
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null };
}

export async function getWorkoutSessionsForTrainer(currentUser) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainer workout sessions:", error);
    return { data: [], error };
  }

  const trainerId = await resolveCurrentTrainerId(currentUser);
  if (!trainerId) {
    return { data: [], error: null };
  }

  const { data, error } = await selectWorkoutSessions("trainer_id", trainerId);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainer workout sessions:", error);
    return { data: [], error };
  }

  return {
    data: await enrichWorkoutSessions(data || []),
    error: null,
  };
}

export async function updateWorkoutSessionStatus(sessionId, status) {
  if (!supabase || !sessionId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or workout session id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ status: normalizeSessionStatus(status) })
    .eq("workout_session_id", sessionId)
    .select(`
      workout_session_id,
      member_id,
      trainer_id,
      member_package_id,
      session_title,
      title,
      exercise_type,
      room_name,
      session_date,
      start_time,
      end_time,
      status,
      note,
      notes,
      workout_content,
      created_at
    `)
    .single();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null };
}

function formatPlanContent(plan, exercises) {
  const lines = [];
  if (plan.plan_goal) lines.push(`Goal: ${plan.plan_goal}`);

  exercises.forEach((exercise, index) => {
    const details = [
      exercise.sets ? `${exercise.sets} sets` : "",
      exercise.reps ? `${exercise.reps} reps` : "",
      exercise.duration_minutes ? `${exercise.duration_minutes} minutes` : "",
      exercise.rest_seconds ? `${exercise.rest_seconds}s rest` : "",
      exercise.intensity || "",
    ].filter(Boolean).join(" | ");
    lines.push(`${index + 1}. ${exercise.exercise_name}${details ? ` - ${details}` : ""}${exercise.notes ? `\n   ${exercise.notes}` : ""}`);
  });

  if (plan.notes) lines.push(`Notes: ${plan.notes}`);
  return lines.join("\n");
}

export async function getWorkoutPlansForTrainer(currentUser) {
  if (!supabase) {
    return { data: [], error: new Error("Missing hệ thống environment variables.") };
  }

  const trainerId = await resolveCurrentTrainerId(currentUser);
  if (!trainerId) return { data: [], error: null };

  const { data: plans, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error };

  const planIds = (plans || []).map((plan) => plan.workout_plan_id);
  let exercises = [];
  if (planIds.length) {
    const exerciseResult = await supabase
      .from("workout_plan_exercises")
      .select("*")
      .in("workout_plan_id", planIds)
      .order("display_order", { ascending: true });
    if (exerciseResult.error) return { data: [], error: exerciseResult.error };
    exercises = exerciseResult.data || [];
  }

  return {
    data: (plans || []).map((plan) => {
      const planExercises = exercises.filter((exercise) => exercise.workout_plan_id === plan.workout_plan_id);
      return {
        id: plan.workout_plan_id,
        name: plan.plan_name,
        goal: plan.plan_goal || "",
        status: plan.status,
        content: formatPlanContent(plan, planExercises),
        exercises: planExercises.map((exercise) => ({
          exerciseId: exercise.workout_plan_exercise_id,
          exerciseName: exercise.exercise_name || "",
          sets: Number(exercise.sets || 0),
          reps: exercise.reps || "",
          restTime: Number(exercise.rest_seconds || 60),
          difficulty: exercise.intensity || "Medium",
          muscleGroup: exercise.exercise_type || "",
          instruction: exercise.notes || "",
        })),
      };
    }),
    error: null,
  };
}

async function notifyMemberAboutSessionUpdate(row) {
  if (!row?.member_id) return null;

  const { data: member } = await supabase
    .from("members")
    .select("user_id")
    .eq("member_id", row.member_id)
    .maybeSingle();

  if (!member?.user_id) return null;

  const sessionDate = row.session_date
    ? new Date(`${row.session_date}T00:00:00`).toLocaleDateString("en-GB")
    : "upcoming";
  const sessionTitle = row.session_title || row.title || "Workout session";
  const { error } = await supabase.from("notifications").insert({
    user_id: member.user_id,
    notification_type: "schedule",
    title: "Workout session content updated",
    message: `${sessionTitle} on ${sessionDate} now has workout content from your trainer. Open your schedule to view the details.`,
    is_read: false,
  });

  return error || null;
}

export async function updateWorkoutSessionContent(sessionId, { title = "", content = "", exercises = [] }) {
  if (!supabase || !sessionId) {
    return { data: null, error: new Error("Missing hệ thống configuration or workout session id.") };
  }

  const normalizedExercises = Array.isArray(exercises) ? exercises : [];
  const formattedContent = content.trim() || formatSessionExerciseContent(normalizedExercises);
  let result = await supabase
    .from("workout_sessions")
    .update({
      session_title: title.trim(),
      title: title.trim(),
      note: formattedContent,
      notes: formattedContent,
      workout_content: normalizedExercises,
    })
    .eq("workout_session_id", sessionId)
    .select("*")
    .single();

  if (result.error) {
    result = await supabase
      .from("workout_sessions")
      .update({ title: title.trim(), notes: formattedContent })
      .eq("workout_session_id", sessionId)
      .select("*")
      .single();
  }

  if (result.error) {
    result = await supabase
      .from("workout_sessions")
      .update({ session_title: title.trim(), note: formattedContent })
      .eq("workout_session_id", sessionId)
      .select("*")
      .single();
  }

  if (result.error) {
    console.error("[Gymster hệ thống] Failed to update workout session content:", result.error);
    return { data: null, error: result.error };
  }

  const notificationError = await notifyMemberAboutSessionUpdate(result.data);
  const [mapped] = await enrichWorkoutSessions([result.data]);
  return { data: mapped, error: null, notificationError };
}

export async function requestSessionReschedule(sessionId, requestedStartTime, requestedEndTime, reason = "") {
  if (!supabase || !sessionId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or workout session id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to request workout session reschedule:", error);
    return { data: null, error };
  }

  const note = `Reschedule requested: ${requestedStartTime || ""} - ${requestedEndTime || ""}. ${reason}`.trim();
  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ status: "rescheduled", notes: note })
    .eq("workout_session_id", sessionId)
    .select(`
      workout_session_id,
      member_id,
      trainer_id,
      member_package_id,
      title,
      exercise_type,
      room_name,
      session_date,
      start_time,
      end_time,
      status,
      notes,
      created_at
    `)
    .single();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to request workout session reschedule:", error);
    return { data: null, error };
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null };
}
