import { supabase } from "./supabaseClient";
import { resolveCurrentMemberId } from "./memberPackageApi";
import { getMonthlyLeaveLimit } from "./packageEntitlement";
import {
  generateSessionsForPackageRange,
  generateUpcomingSessions,
} from "./workoutScheduleGenerator";
import { formatSessionExerciseContent, getSessionStatusLabel, normalizeSessionStatus } from "./sessionModel";
import { findConflictingPtSession, isSessionBefore2Hours } from "./workoutSessionConflict";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_WORKOUT_SESSIONS_KEY = "gymster_local_workout_sessions";
const LOCAL_MAKEUP_SESSIONS_KEY = "gymster_local_makeup_sessions";
const LOCAL_DEMO_MEMBER_ID = "00000000-0000-4000-8000-000000000005";
const LOCAL_DEMO_TRAINER_ID = "local-trainer-khoa";
const FIXED_PT_DAYS = [1, 4];
const FIXED_PT_START_TIME = "08:00";
const FIXED_PT_END_TIME = "10:00";
const MAKEUP_RESET_BALANCE = getMonthlyLeaveLimit();

function mapWorkoutSessionRow(row) {
  if (!row) return null;
  const isPtSession = Boolean(row.trainer_id);
  const title = row.session_title || row.title;
  const exerciseType = !isPtSession && row.exercise_type === "Personal Training" ? "Manual Workout" : row.exercise_type;
  const roomName = !isPtSession && row.room_name === "PT Room" ? "Gym Floor" : row.room_name;

  return {
    sessionId: row.workout_session_id || row.session_id,
    memberId: row.member_id,
    trainerId: row.trainer_id,
    packageId: row.package_id,
    memberPackageId: row.member_package_id,
    sessionTitle: !isPtSession && title === "AI Booking" ? "Self Workout" : title,
    exerciseType,
    roomName,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    note: row.note || row.notes || "",
    workoutContent: Array.isArray(row.workout_content) ? row.workout_content : [],
    memberName: row.memberName || "Member",
    trainerName: row.trainerName || "Trainer",
    packageName: row.packageName || "",
    isPtSession,
    hasContent: Boolean(
      (row.session_title || row.title || "").trim()
      || (row.note || row.notes || "").trim()
      || (Array.isArray(row.workout_content) && row.workout_content.length),
    ),
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocalWorkoutSessions() {
  if (!canUseStorage()) return [];

  try {
    const storedRows = JSON.parse(window.localStorage.getItem(LOCAL_WORKOUT_SESSIONS_KEY) || "[]");
    return Array.isArray(storedRows) ? storedRows : [];
  } catch {
    window.localStorage.removeItem(LOCAL_WORKOUT_SESSIONS_KEY);
    return [];
  }
}

function writeLocalWorkoutSessions(rows) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(LOCAL_WORKOUT_SESSIONS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("gymster:schedule-updated"));
}

function isSelfWorkoutRow(row) {
  if (!row) return false;
  const hasTrainer = Boolean(row.trainer_id || row.trainerId);
  if (hasTrainer) return false;
  const title = String(row.session_title || row.title || row.sessionTitle || "").toLowerCase();
  const exerciseType = String(row.exercise_type || row.exerciseType || "").toLowerCase();
  const roomName = String(row.room_name || row.roomName || "").toLowerCase();
  return (
    title.includes("self workout")
    || title.includes("ai booking")
    || title.includes("personal workout")
    || exerciseType.includes("manual workout")
    || exerciseType.includes("personal workout")
    || roomName.includes("gym floor")
    || roomName.includes("personal workout")
  );
}

function removeLocalSelfWorkouts(rows) {
  const nextRows = rows.filter((row) => !isSelfWorkoutRow(row));
  if (nextRows.length !== rows.length) {
    writeLocalWorkoutSessions(nextRows);
  }
  return nextRows;
}

function currentMakeupPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function defaultMakeupState(memberId = LOCAL_DEMO_MEMBER_ID) {
  return {
    memberId,
    period: currentMakeupPeriod(),
    fixedScheduleCancelCount: 0,
    usedMakeupCount: 0,
    remainingMakeupCount: 0,
    credits: 0,
    grantedThisMonth: 0,
    monthlyLimit: MAKEUP_RESET_BALANCE,
    resetBalance: MAKEUP_RESET_BALANCE,
    history: [],
  };
}

export function normalizeMakeupState(rawState, memberId = LOCAL_DEMO_MEMBER_ID) {
  const state = {
    ...defaultMakeupState(memberId),
    ...(rawState && typeof rawState === "object" ? rawState : {}),
  };

  if (state.period !== currentMakeupPeriod()) {
    return {
      ...defaultMakeupState(memberId),
      period: currentMakeupPeriod(),
    };
  }

  const fixedScheduleCancelCount = Math.max(0, Number(state.fixedScheduleCancelCount ?? state.grantedThisMonth ?? 0));
  const usedMakeupCount = Math.max(0, Number(state.usedMakeupCount || 0));
  const maxMakeupAllowed = Math.min(fixedScheduleCancelCount, MAKEUP_RESET_BALANCE);
  const remainingMakeupCount = Math.max(0, maxMakeupAllowed - usedMakeupCount);

  return {
    ...state,
    memberId,
    fixedScheduleCancelCount,
    maxMakeupAllowed,
    usedMakeupCount,
    remainingMakeupCount,
    credits: remainingMakeupCount,
    grantedThisMonth: fixedScheduleCancelCount,
    monthlyLimit: MAKEUP_RESET_BALANCE,
    resetBalance: MAKEUP_RESET_BALANCE,
    history: Array.isArray(state.history) ? state.history : [],
  };
}

export function readMakeupState(memberId = LOCAL_DEMO_MEMBER_ID) {
  if (!canUseStorage()) return defaultMakeupState(memberId);

  try {
    return normalizeMakeupState(JSON.parse(window.localStorage.getItem(LOCAL_MAKEUP_SESSIONS_KEY) || "null"), memberId);
  } catch {
    window.localStorage.removeItem(LOCAL_MAKEUP_SESSIONS_KEY);
    return defaultMakeupState(memberId);
  }
}

export function writeMakeupState(state) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(LOCAL_MAKEUP_SESSIONS_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("gymster:makeup-updated"));
}

export function getMakeupSessionSummary(currentUser = null) {
  return readMakeupState(resolveLocalMemberId(currentUser));
}

export function recordMakeupForCancelledSession(session, currentUser = null) {
  const isFixedPtSession = Boolean(session?.trainerId || session?.trainer_id)
    || String(session?.title || session?.sessionTitle || "").toLowerCase().includes("pt")
    || String(session?.exerciseType || session?.exercise_type || "").toLowerCase().includes("personal training");
  if (!isFixedPtSession) {
    const memberId = session?.memberId || resolveLocalMemberId(currentUser);
    return { ...readMakeupState(memberId), granted: false, reason: "not_fixed_pt_session" };
  }

  const memberId = session?.memberId || resolveLocalMemberId(currentUser);
  const state = readMakeupState(memberId);
  const sessionId = session?.sessionId || session?.id || "";

  if (sessionId && state.history.some((item) => item.sessionId === sessionId)) {
    return { ...state, granted: false, reason: "already_recorded" };
  }

  const sessionDate = session?.sessionDate || session?.date || session?.dateIso || "";
  const startTime = session?.startTime || session?.time || "";
  const actualStartTime = startTime.includes(" - ") ? startTime.split(" - ")[0] : startTime;

  const isBefore2Hours = isSessionBefore2Hours(sessionDate, actualStartTime);

  const historyItem = {
    sessionId,
    date: sessionDate,
    time: startTime,
    recordedAt: new Date().toISOString(),
  };

  let nextState;
  if (isBefore2Hours) {
    nextState = {
      ...state,
      fixedScheduleCancelCount: Number(state.fixedScheduleCancelCount || 0) + 1,
      history: [{ ...historyItem, granted: true, type: "fixed_session_cancelled" }, ...state.history],
    };
  } else {
    nextState = {
      ...state,
      history: [{ ...historyItem, granted: false, type: "fixed_session_cancelled_late" }, ...state.history],
    };
  }

  const normalized = normalizeMakeupState(nextState, memberId);
  writeMakeupState(normalized);
  return { ...normalized, granted: isBefore2Hours };
}

export function markMakeupSessionUsedForAcceptedRequest(request, currentUser = null) {
  const memberId = request?.memberId || request?.member_id || resolveLocalMemberId(currentUser);
  const state = readMakeupState(memberId);
  const requestId = request?.requestId || request?.id || request?.trainingRequestId || "";

  if (requestId && state.history.some((item) => item.requestId === requestId && item.type === "makeup_used")) {
    return { ...state, used: false, reason: "already_used" };
  }

  if (state.remainingMakeupCount <= 0) {
    return { ...state, used: false, reason: "no_remaining_makeup" };
  }

  const nextState = normalizeMakeupState({
    ...state,
    usedMakeupCount: Number(state.usedMakeupCount || 0) + 1,
    history: [{
      requestId,
      date: request?.date || request?.requestedDate || "",
      time: request?.time || request?.startTime || "",
      recordedAt: new Date().toISOString(),
      type: "makeup_used",
    }, ...state.history],
  }, memberId);
  writeMakeupState(nextState);
  return { ...nextState, used: true };
}

function isCancelledWorkoutStatus(status) {
  return ["cancelled", "canceled"].includes(String(status || "").trim().toLowerCase());
}

function normalizeStoredWorkoutStatus(status) {
  return isCancelledWorkoutStatus(status) ? "cancelled" : normalizeSessionStatus(status);
}

function mapAiSessionToWorkoutRow(session) {
  const isPtSession = Boolean(session.trainerId);

  return {
    workout_session_id: session.sessionId,
    session_id: session.sessionId,
    member_id: session.memberId,
    trainer_id: session.trainerId,
    title: session.title || (isPtSession ? "PT Session" : "Self Workout"),
    exercise_type: session.exerciseType || (isPtSession ? "Personal Training" : "Manual Workout"),
    room_name: session.room || (isPtSession ? "PT Room" : "Gym Floor"),
    session_date: session.date,
    start_time: session.time,
    end_time: session.endTime,
    status: normalizeStoredWorkoutStatus(session.status || "scheduled"),
    notes: session.note || (isPtSession ? "Fixed PT session." : "Self-added by Gymster AI Assistant."),
    memberName: "Member",
    trainerName: isPtSession ? "Trainer" : "",
    packageName: "",
  };
}

export function saveAiWorkoutSession(session) {
  if (!session?.sessionId) return;

  const rows = readLocalWorkoutSessions();
  const row = mapAiSessionToWorkoutRow(session);
  const nextRows = [row, ...rows.filter((item) => (
    (item.session_id || item.workout_session_id) !== session.sessionId
  ))];
  writeLocalWorkoutSessions(nextRows);
}

export function updateLocalWorkoutSessionStatus(sessionId, status) {
  if (!sessionId) return;

  const rows = readLocalWorkoutSessions();
  const nextRows = rows.map((row) => (
    (row.session_id || row.workout_session_id) === sessionId
      ? { ...row, status: normalizeStoredWorkoutStatus(status) }
      : row
  ));
  writeLocalWorkoutSessions(nextRows);
}

export function updateLocalWorkoutSessionSchedule(sessionId, nextSchedule = {}) {
  if (!sessionId) return null;

  const rows = readLocalWorkoutSessions();
  let updatedRow = null;
  const nextRows = rows.map((row) => {
    if ((row.session_id || row.workout_session_id) !== sessionId) return row;
    updatedRow = {
      ...row,
      session_date: nextSchedule.date || nextSchedule.requestedDate || row.session_date,
      start_time: nextSchedule.startTime || nextSchedule.time || row.start_time,
      end_time: nextSchedule.endTime || row.end_time,
      status: "scheduled",
      notes: "Reschedule request accepted by PT.",
    };
    return updatedRow;
  });

  writeLocalWorkoutSessions(nextRows);
  return updatedRow ? mapWorkoutSessionRow(updatedRow) : null;
}

export function saveAcceptedLocalPtSessionFromRequest(request) {
  const requestId = request?.requestId || request?.id || request?.trainingRequestId || Date.now();
  const sessionId = `local-makeup-pt-${requestId}`;
  const row = {
    workout_session_id: sessionId,
    session_id: sessionId,
    member_id: request?.memberId || request?.member_id || LOCAL_DEMO_MEMBER_ID,
    trainer_id: request?.trainerId || request?.trainer_id || LOCAL_DEMO_TRAINER_ID,
    title: "PT Session",
    exercise_type: "Personal Training",
    room_name: "PT Room",
    session_date: request?.date || request?.requestedDate || request?.requested_date,
    start_time: request?.time || request?.startTime || request?.start_time,
    end_time: request?.endTime || request?.end_time,
    status: "scheduled",
    notes: "Makeup PT session accepted by PT.",
    memberName: request?.memberName || "Member",
    trainerName: request?.trainerName || "Khoa Le",
    packageName: request?.packageName || "PT Progress 3 Months",
  };

  const rows = readLocalWorkoutSessions();
  writeLocalWorkoutSessions([row, ...rows.filter((item) => (
    (item.session_id || item.workout_session_id) !== sessionId
  ))]);
  return mapWorkoutSessionRow(row);
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolveLocalMemberId(currentUser) {
  return currentUser?.memberId || currentUser?.member_id || currentUser?.id || LOCAL_DEMO_MEMBER_ID;
}

function generateLocalFixedPtSessions(memberId = LOCAL_DEMO_MEMBER_ID) {
  const targetMemberId = memberId || LOCAL_DEMO_MEMBER_ID;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1) - 28);

  const end = new Date(start);
  end.setDate(start.getDate() + 140);

  const rows = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (FIXED_PT_DAYS.includes(cursor.getDay())) {
      const sessionDate = toDateValue(cursor);
      rows.push({
        workout_session_id: `local-fixed-pt-${targetMemberId}-${sessionDate}`,
        session_id: `local-fixed-pt-${targetMemberId}-${sessionDate}`,
        member_id: targetMemberId,
        trainer_id: LOCAL_DEMO_TRAINER_ID,
        title: "PT Session",
        exercise_type: "Personal Training",
        room_name: "PT Room",
        session_date: sessionDate,
        start_time: FIXED_PT_START_TIME,
        end_time: FIXED_PT_END_TIME,
        status: "scheduled",
        notes: "Fixed PT schedule: Monday and Thursday, 08:00 - 10:00.",
        memberName: "Member",
        trainerName: "Khoa Le",
        packageName: "PT Progress 3 Months",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

function mergeLocalWorkoutRows(storedRows, fixedRows) {
  const seen = new Set();
  return [...storedRows, ...fixedRows].filter((row) => {
    const id = row.session_id || row.workout_session_id;
    const key = id || [
      row.member_id,
      row.trainer_id || "manual",
      row.session_date,
      row.start_time,
      row.end_time,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapAndSortLocalWorkoutSessions(memberId = null) {
  return mergeLocalWorkoutRows(removeLocalSelfWorkouts(readLocalWorkoutSessions()), generateLocalFixedPtSessions(memberId))
    .filter((row) => !isCancelledWorkoutStatus(row.status))
    .filter((row) => !isSelfWorkoutRow(row))
    .map(mapWorkoutSessionRow)
    .filter(Boolean)
    .filter((row) => !memberId || !row.memberId || row.memberId === memberId)
    .sort((left, right) => (
      `${left.sessionDate || ""}T${left.startTime || ""}`
        .localeCompare(`${right.sessionDate || ""}T${right.startTime || ""}`)
    ));
}

function mergeWorkoutSessionRows(localRows, databaseRows) {
  const databaseIds = new Set(databaseRows.map((row) => row.sessionId).filter(Boolean));
  return [
    ...databaseRows,
    ...localRows.filter((row) => !databaseIds.has(row.sessionId)),
  ].sort((left, right) => (
    `${left.sessionDate || ""}T${left.startTime || ""}`
      .localeCompare(`${right.sessionDate || ""}T${right.startTime || ""}`)
  ));
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
  const memberIdVal = data.memberId;
  if (memberIdVal && uuidPattern.test(String(memberIdVal))) {
    const { data: memberById } = await supabase
      .from("members")
      .select("member_id")
      .eq("member_id", memberIdVal)
      .maybeSingle();
    if (memberById?.member_id) return memberById.member_id;

    const { data: memberByUserId } = await supabase
      .from("members")
      .select("member_id")
      .eq("user_id", memberIdVal)
      .maybeSingle();
    if (memberByUserId?.member_id) return memberByUserId.member_id;

    return memberIdVal;
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
    return { data: mapAndSortLocalWorkoutSessions(resolveLocalMemberId(currentUser)), error: null };
  }

  const memberId = await resolveCurrentMemberId(currentUser);
  if (!memberId) {
    return { data: [], error: null };
  }

  const { data, error } = await selectWorkoutSessions("member_id", memberId);

  if (error) {
    console.error("[Gymster hệ thống] Failed to load member workout sessions:", error);
    return { data: [], error };
  }

  const databaseRows = await enrichWorkoutSessions(data || []);
  return {
    data: databaseRows.filter((row) => !isCancelledWorkoutStatus(row.status) && row.isPtSession),
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
    const trainerId = currentUser?.trainerId || currentUser?.trainer_id || LOCAL_DEMO_TRAINER_ID;
    const rows = mapAndSortLocalWorkoutSessions()
      .filter((session) => session.trainerId === trainerId || (!currentUser?.trainerId && session.trainerId === LOCAL_DEMO_TRAINER_ID));
    return { data: rows, error: null };
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
  if (!sessionId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or workout session id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  if (!supabase) {
    updateLocalWorkoutSessionStatus(sessionId, status);
    const row = mapAndSortLocalWorkoutSessions().find((item) => item.sessionId === sessionId) || null;
    return { data: row, error: row ? null : new Error("Workout session was not found.") };
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
    const localRow = mapAndSortLocalWorkoutSessions().find((item) => item.sessionId === sessionId);
    if (localRow) {
      updateLocalWorkoutSessionStatus(sessionId, status);
      return {
        data: { ...localRow, status: normalizeSessionStatus(status) },
        error: null,
      };
    }

    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null };
}

export async function cancelWorkoutSessionForMember(session, currentUser = null) {
  const sessionId = session?.sessionId || session?.id;
  if (!sessionId) {
    return { data: null, error: new Error("Workout session was not found.") };
  }

  const makeupSummary = recordMakeupForCancelledSession(session, currentUser);

  if (!supabase || !uuidPattern.test(String(sessionId))) {
    updateLocalWorkoutSessionStatus(sessionId, "cancelled");
    return { data: { ...session, status: "cancelled" }, error: null, makeupSummary };
  }

  const memberId = await resolveCurrentMemberId(currentUser);
  let query = supabase
    .from("workout_sessions")
    .update({ status: "cancelled", notes: "Cancelled by member. Makeup credit granted." })
    .eq("workout_session_id", sessionId);
  if (memberId) query = query.eq("member_id", memberId);

  const { data, error } = await query.select("*").single();
  if (error) {
    console.error("[Gymster hệ thống] Failed to cancel workout session:", error);
    return { data: null, error, makeupSummary };
  }

  try {
    const now = new Date();
    await supabase.from("makeup_sessions").upsert({
      customer_id: data.member_id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      fixed_schedule_cancel_count: makeupSummary.fixedScheduleCancelCount,
      max_makeup_allowed: makeupSummary.maxMakeupAllowed,
      used_makeup_count: makeupSummary.usedMakeupCount,
      remaining_makeup_count: makeupSummary.remainingMakeupCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: "customer_id,month,year" });
  } catch (summaryError) {
    console.warn("[Gymster hệ thống] Makeup summary table could not be updated:", summaryError);
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null, makeupSummary };
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
