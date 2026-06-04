import { supabase } from "./supabaseClient";
import { resolveCurrentMemberId } from "./memberPackageApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_WORKOUT_SESSIONS_KEY = "gymster_local_workout_sessions";
const dayIndexes = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function toDateValue(date) {
  return date.toISOString().slice(0, 10);
}

function parseFixedSchedule(schedule) {
  const [daysText = "", timeText = ""] = String(schedule || "").split(",");
  const [startTime = "07:00", endTime = "08:00"] = timeText.split("-").map((value) => value.trim());
  const days = daysText
    .split("/")
    .map((day) => day.trim().toLowerCase())
    .map((day) => dayIndexes[day])
    .filter((day) => day !== undefined);

  return {
    days: days.length ? days : [new Date().getDay()],
    startTime,
    endTime,
  };
}

function generateUpcomingSessions(schedule, count = 4) {
  const parsed = parseFixedSchedule(schedule);
  const sessions = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (sessions.length < count) {
    if (parsed.days.includes(cursor.getDay())) {
      sessions.push({
        sessionDate: toDateValue(cursor),
        startTime: parsed.startTime,
        endTime: parsed.endTime,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}

function mapWorkoutSessionRow(row) {
  if (!row) return null;

  return {
    sessionId: row.session_id || row.workout_session_id,
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
    memberName: row.memberName || "Member",
    trainerName: row.trainerName || "Trainer",
    packageName: row.packageName || "",
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
  } catch (error) {
    window.localStorage.removeItem(LOCAL_WORKOUT_SESSIONS_KEY);
    return [];
  }
}

function writeLocalWorkoutSessions(rows) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_WORKOUT_SESSIONS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("gymster:schedule-updated"));
}

function mapAiSessionToWorkoutRow(session) {
  return {
    workout_session_id: session.sessionId,
    session_id: session.sessionId,
    member_id: session.memberId,
    trainer_id: session.trainerId,
    title: session.title || "AI Booking",
    exercise_type: "Personal Training",
    room_name: session.room || "PT Room",
    session_date: session.date,
    start_time: session.time,
    end_time: session.endTime,
    status: session.status || "scheduled",
    notes: session.note || "Created by Gymster AI Assistant.",
    memberName: "Member",
    trainerName: "Khoa Le",
    packageName: "PT Progress 3 Months",
  };
}

export function saveAiWorkoutSession(session) {
  if (!session?.sessionId) return;

  const rows = readLocalWorkoutSessions();
  const row = mapAiSessionToWorkoutRow(session);
  const nextRows = [row, ...rows.filter((item) => (item.session_id || item.workout_session_id) !== session.sessionId)];
  writeLocalWorkoutSessions(nextRows);
}

export function updateLocalWorkoutSessionStatus(sessionId, status) {
  if (!sessionId) return;

  const rows = readLocalWorkoutSessions();
  const nextRows = rows.map((row) => (
    (row.session_id || row.workout_session_id) === sessionId
      ? { ...row, status: normalizeDbStatus(status) }
      : row
  ));
  writeLocalWorkoutSessions(nextRows);
}

function normalizeDbStatus(status) {
  const normalized = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  const map = {
    scheduled: "scheduled",
    completed: "completed",
    done: "completed",
    cancelled: "cancelled",
    canceled: "cancelled",
    no_show: "missed",
    missed: "missed",
    pending_reschedule: "rescheduled",
    rescheduled: "rescheduled",
  };

  return map[normalized] || normalized || "scheduled";
}

export function getWorkoutSessionStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  const labels = {
    scheduled: "Scheduled",
    completed: "Completed",
    done: "Completed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    no_show: "No Show",
    missed: "No Show",
    pending_reschedule: "Pending Reschedule",
    rescheduled: "Pending Reschedule",
  };

  return labels[normalized] || "Scheduled";
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
      exercise_type: "Personal Training",
      room_name: "PT Room",
      session_date: row.session_date,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      notes: row.note,
    })))
    .select("*");
}

export async function createWorkoutSessionsForSchedule(data) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create workout sessions:", error);
    return { data: [], error };
  }

  const memberId = await resolveMemberId(data);
  const rows = generateUpcomingSessions(data.selectedSchedule, data.sessionCount || 4).map((session, index) => ({
    member_id: memberId,
    trainer_id: data.trainerId,
    package_id: data.packageId,
    member_package_id: data.memberPackageId || null,
    room_id: data.roomId || null,
    session_title: `PT Session ${index + 1}`,
    session_date: session.sessionDate,
    start_time: session.startTime,
    end_time: session.endTime,
    status: "scheduled",
    note: `Generated from onboarding schedule: ${data.selectedSchedule}`,
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
    return {
      data: readLocalWorkoutSessions()
        .map(mapWorkoutSessionRow)
        .filter(Boolean)
        .sort((a, b) => `${a.sessionDate} ${a.startTime}`.localeCompare(`${b.sessionDate} ${b.startTime}`)),
      error: null,
    };
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
    if (!supabase && sessionId) {
      updateLocalWorkoutSessionStatus(sessionId, status);
      const row = readLocalWorkoutSessions().find((item) => (item.session_id || item.workout_session_id) === sessionId);
      return { data: mapWorkoutSessionRow(row), error: null };
    }

    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or workout session id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({ status: normalizeDbStatus(status) })
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update workout session:", error);
    return { data: null, error };
  }

  const [mapped] = await enrichWorkoutSessions([data]);
  return { data: mapped, error: null };
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
