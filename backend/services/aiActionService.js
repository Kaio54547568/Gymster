import { createClient } from "@supabase/supabase-js";
import {
  cancelLocalBooking,
  createLocalBooking,
  createLocalReview,
  getDefaultMemberId,
  getLocalMembership,
  getLocalMakeupBalance,
  listLocalBookings,
  updateLocalReview,
} from "./localGymsterStore.js";

let supabaseClient;
const GYM_OPEN_TIME = "08:00";
const GYM_CLOSE_TIME = "20:00";

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredSupabaseKey(value) {
  const key = String(value || "").trim();
  return key.length > 0 && !key.startsWith("your_");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredSupabaseKey(supabaseKey)) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

function addHours(time, hours) {
  const [hour, minute] = String(time || GYM_OPEN_TIME).split(":").map(Number);
  const endHour = Math.min(23, (hour || 8) + hours);
  return `${String(endHour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
}

function minutesFromTime(time) {
  const [hour, minute] = String(time || "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function assertWithinGymHours(startTime, endTime) {
  const start = minutesFromTime(startTime);
  const end = minutesFromTime(endTime);
  const open = minutesFromTime(GYM_OPEN_TIME);
  const close = minutesFromTime(GYM_CLOSE_TIME);

  if (start === null || end === null || start < open || end > close || start >= end) {
    throw new Error("Phòng gym chỉ mở từ 08:00 đến 20:00. Vui lòng chọn thời gian trong khung giờ này.");
  }
}

function isPtSession(session) {
  const title = String(session.title || "").toLowerCase();
  const exerciseType = String(session.exercise_type || session.exerciseType || "").toLowerCase();
  return Boolean(session.trainerId || session.trainer_id) || title.includes("pt") || exerciseType.includes("personal training");
}

function mapSession(row) {
  return {
    sessionId: row.session_id || row.workout_session_id,
    memberId: row.member_id,
    trainerId: row.trainer_id,
    title: row.session_title || row.title || row.exercise_type || "Workout Session",
    date: row.session_date,
    time: String(row.start_time || "").slice(0, 5),
    endTime: String(row.end_time || "").slice(0, 5),
    status: row.status,
    room: row.room_name || "Training Room",
    note: row.note || row.notes || "",
  };
}

function mapBookingRequest(row, balance = null) {
  return {
    requestId: row.request_id || row.training_request_id,
    trainingRequestId: row.training_request_id,
    memberId: row.member_id,
    trainerId: row.trainer_id,
    memberName: row.memberName || row.member_name || "Member",
    trainerName: row.trainerName || row.trainer_name || "PT",
    date: row.requested_date || row.session_date,
    time: String(row.start_time || "").slice(0, 5),
    endTime: String(row.end_time || "").slice(0, 5),
    requestedSchedule: row.requested_schedule,
    type: row.request_type || "makeup_pt_session",
    status: row.status,
    makeupBalance: balance || row.makeupBalance || null,
  };
}

function mapWorkoutSessionRow(row) {
  return mapSession(row);
}

export function resolveUserContext(user) {
  return {
    userId: user?.userId || user?.user_id || user?.id || null,
    memberId: getDefaultMemberId(user),
    role: user?.role || "member",
    email: user?.email || "",
  };
}

async function resolveMemberId(client, context) {
  if (!client) return context.memberId;
  const memberIdVal = context.memberId;
  if (memberIdVal) {
    if (typeof memberIdVal === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(memberIdVal)) {
      const { data: memberById } = await client
        .from("members")
        .select("member_id")
        .eq("member_id", memberIdVal)
        .maybeSingle();
      if (memberById?.member_id) return memberById.member_id;

      const { data: memberByUserId } = await client
        .from("members")
        .select("member_id")
        .eq("user_id", memberIdVal)
        .maybeSingle();
      if (memberByUserId?.member_id) return memberByUserId.member_id;
    }
    return memberIdVal;
  }
  if (!context.userId && !context.email) return null;

  let userId = context.userId;
  if (!userId && context.email) {
    const { data } = await client.from("users").select("user_id").eq("email", context.email).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return null;

  const { data } = await client.from("members").select("member_id").eq("user_id", userId).maybeSingle();
  return data?.member_id || null;
}

async function getActiveMemberPackage(client, memberId) {
  const { data } = await client
    .from("member_packages")
    .select("member_package_id,package_id,trainer_id,status,start_date,end_date,sessions_total,sessions_used,used_sessions,remaining_sessions,packages(package_name,session_limit)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function assertBookableDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    throw new Error("Vui lòng chọn ngày đặt lịch hợp lệ.");
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < toDateValue(today)) {
    throw new Error("Không thể đặt lịch cho ngày trong quá khứ.");
  }
}

function timeRangesOverlap(left, right) {
  const leftStart = minutesFromTime(left.startTime);
  const leftEnd = minutesFromTime(left.endTime);
  const rightStart = minutesFromTime(right.startTime);
  const rightEnd = minutesFromTime(right.endTime);
  if ([leftStart, leftEnd, rightStart, rightEnd].some((value) => value === null)) return false;
  return leftStart < rightEnd && rightStart < leftEnd;
}

async function assertNoFixedPtConflict(client, memberId, candidate) {
  const { data, error } = await client
    .from("workout_sessions")
    .select("workout_session_id,trainer_id,session_date,start_time,end_time,status")
    .eq("member_id", memberId)
    .eq("session_date", candidate.date)
    .not("trainer_id", "is", null);
  if (error) throw error;

  const conflict = (data || [])
    .filter((row) => !["cancelled", "canceled"].includes(String(row.status || "").trim().toLowerCase()))
    .find((row) => timeRangesOverlap(candidate, {
      startTime: String(row.start_time || "").slice(0, 5),
      endTime: String(row.end_time || "").slice(0, 5),
    }));

  if (conflict) {
    throw new Error("This time overlaps your fixed PT schedule. Choose another time.");
  }
}

async function resolveMemberProfile(client, memberId) {
  if (!client) return { memberName: "Member", memberUserId: null };
  const { data: member } = await client
    .from("members")
    .select("member_id,user_id,member_code,full_name")
    .eq("member_id", memberId)
    .maybeSingle();
  if (!member) return { memberName: "Member", memberUserId: null };

  let memberName = member.full_name || member.member_code || "Member";
  if (member.user_id) {
    const { data: user } = await client
      .from("users")
      .select("first_name,last_name,email")
      .eq("user_id", member.user_id)
      .maybeSingle();
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    memberName = name || memberName;
  }

  return { memberName, memberUserId: member.user_id || null };
}

async function resolveTrainerForMember(client, memberId, memberPackage) {
  if (!client) return { trainerId: "local-trainer-khoa", trainerUserId: "00000000-0000-4000-8000-000000000004", trainerName: "Khoa Le" };

  let trainerId = memberPackage?.trainer_id || null;
  if (!trainerId) {
    const { data: assignment } = await client
      .from("trainer_assignments")
      .select("trainer_id")
      .eq("member_id", memberId)
      .eq("status", "active")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    trainerId = assignment?.trainer_id || null;
  }
  if (!trainerId) {
    const { data: trainer } = await client
      .from("trainers")
      .select("trainer_id")
      .neq("status", "inactive")
      .limit(1)
      .maybeSingle();
    trainerId = trainer?.trainer_id || null;
  }
  if (!trainerId) throw new Error("Không tìm thấy PT phù hợp để gửi yêu cầu đặt lịch.");

  const { data: trainer } = await client
    .from("trainers")
    .select("trainer_id,user_id,employee_id,trainer_code,full_name")
    .eq("trainer_id", trainerId)
    .maybeSingle();
  let trainerName = trainer?.full_name || trainer?.trainer_code || "PT";
  let trainerUserId = trainer?.user_id || null;
  if (trainer?.user_id) {
    const { data: user } = await client
      .from("users")
      .select("first_name,last_name")
      .eq("user_id", trainer.user_id)
      .maybeSingle();
    trainerName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || trainerName;
  } else if (trainer?.employee_id) {
    const { data: employee } = await client
      .from("employees")
      .select("user_id,full_name")
      .eq("employee_id", trainer.employee_id)
      .maybeSingle();
    trainerUserId = employee?.user_id || null;
    trainerName = employee?.full_name || trainerName;
  }

  return { trainerId, trainerUserId, trainerName };
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    startDate: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
  };
}

export async function getMakeupBalance(user) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) return getLocalMakeupBalance(memberId);

  const range = monthRange();
  const { count: fixedScheduleCancelCount, error: cancelError } = await client
    .from("workout_sessions")
    .select("workout_session_id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .not("trainer_id", "is", null)
    .eq("status", "cancelled")
    .gte("session_date", range.startDate)
    .lte("session_date", range.endDate);
  if (cancelError) throw cancelError;

  const { count: usedMakeupCount, error: usedError } = await client
    .from("training_requests")
    .select("training_request_id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("request_type", "makeup_pt_session")
    .in("status", ["accepted", "approved", "completed"])
    .gte("created_at", `${range.startDate}T00:00:00`)
    .lte("created_at", `${range.endDate}T23:59:59`);
  if (usedError) throw usedError;

  const maxMakeupAllowed = Math.min(Number(fixedScheduleCancelCount || 0), 3);
  return {
    month: range.month,
    year: range.year,
    fixedScheduleCancelCount: Number(fixedScheduleCancelCount || 0),
    maxMakeupAllowed,
    usedMakeupCount: Number(usedMakeupCount || 0),
    remainingMakeupCount: Math.max(0, maxMakeupAllowed - Number(usedMakeupCount || 0)),
  };
}

export async function getUserSchedule(user, data = {}) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) {
    return listLocalBookings(memberId, data).map(mapSession);
  }

  let query = client
    .from("workout_sessions")
    .select("workout_session_id,session_id,member_id,trainer_id,title,session_title,exercise_type,room_name,session_date,start_time,end_time,status,notes,note")
    .eq("member_id", memberId)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (data.startDate) query = query.gte("session_date", data.startDate);
  if (data.endDate) query = query.lte("session_date", data.endDate);

  const { data: rows, error } = await query;
  if (error) throw error;
  return (rows || []).map(mapSession);
}

export async function createBooking(user, data) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  const endTime = data.endTime || addHours(data.time, 2);
  assertBookableDate(data.date);
  assertWithinGymHours(data.time, endTime);
  const balance = { remainingMakeupCount: 1 };
  if (balance.remainingMakeupCount <= 0) {
    throw new Error("Bạn đã sử dụng hết số buổi bù trong tháng này. Mỗi tháng chỉ được bù tối đa 3 buổi.");
  }

  if (!client) {
    return mapWorkoutSessionRow(createLocalBooking(memberId, { ...data, endTime }));
  }

  await assertNoFixedPtConflict(client, memberId, { date: data.date, startTime: data.time, endTime });
  const title = String(data.title || "").trim() || "Personal workout";
  const notes = String(data.note || data.notes || "").trim() || "Created by Gymster AI Assistant.";
  const { data: workoutRow, error: workoutError } = await client
    .from("workout_sessions")
    .insert({
      member_id: memberId,
      trainer_id: null,
      member_package_id: null,
      title,
      session_title: title,
      exercise_type: "Personal workout",
      room_name: "Personal workout",
      session_date: data.date,
      start_time: data.time,
      end_time: endTime,
      status: "scheduled",
      notes,
      note: notes,
    })
    .select("*")
    .single();
  if (workoutError) {
    const message = String(workoutError.message || "").includes("overlaps your fixed PT schedule")
      ? "This time overlaps your fixed PT schedule. Choose another time."
      : workoutError.message;
    throw new Error(message || "Không thể đặt lịch tập.");
  }
  return mapWorkoutSessionRow(workoutRow);

  const memberPackage = await getActiveMemberPackage(client, memberId);
  if (!memberPackage?.package_id) {
    throw new Error("Bạn cần có gói tập đang hoạt động trước khi gửi yêu cầu đặt lịch bù với PT.");
  }
  const member = await resolveMemberProfile(client, memberId);
  const trainer = await resolveTrainerForMember(client, memberId, memberPackage);
  const requestedSchedule = `${data.date} ${data.time} - ${endTime}`;

  const { data: row, error } = await client
    .from("training_requests")
    .insert({
      member_id: memberId,
      trainer_id: trainer.trainerId,
      package_id: memberPackage.package_id,
      member_package_id: memberPackage.member_package_id || null,
      requested_schedule: requestedSchedule,
      requested_date: data.date,
      start_time: data.time,
      end_time: endTime,
      request_type: "makeup_pt_session",
      status: "pending_pt_approval",
      decline_reason: "",
    })
    .select("*")
    .single();
  if (error) throw error;

  if (trainer.trainerUserId) {
    await client.from("notifications").insert({
      user_id: trainer.trainerUserId,
      notification_type: "training_request",
      title: "Yêu cầu đặt lịch bù với PT",
      message: `Khách hàng ${member.memberName} yêu cầu tập với PT vào ${data.date} lúc ${data.time}. Bạn có đồng ý nhận ca không?`,
      action_type: "review_makeup_pt_request",
      action_payload: { requestId: row.request_id || row.training_request_id },
      is_read: false,
    });
  }

  return mapBookingRequest({ ...row, memberName: member.memberName, trainerName: trainer.trainerName }, balance);
}

export async function cancelBooking(user, data) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) {
    const row = cancelLocalBooking(memberId, data);
    if (!row) throw new Error("No scheduled workout session was found to cancel.");
    return mapSession(row);
  }

  const sessions = await getUserSchedule(user, { startDate: data.date, endDate: data.date });
  const target = data.sessionId ? sessions.find((item) => item.sessionId === data.sessionId) : sessions.find((item) => item.status === "scheduled");
  if (!target) throw new Error("No scheduled workout session was found to cancel.");
  if (false && isPtSession(target)) {
    throw new Error("Lịch tập với PT là lịch cố định nên không thể hủy hoặc thay đổi bằng AI chat.");
  }

  const { data: row, error } = await client
    .from("workout_sessions")
    .update({ status: "cancelled" })
    .eq("workout_session_id", target.sessionId)
    .select("*")
    .single();
  if (error) throw error;
  return mapSession(row);
}

export async function getMembership(user) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) return getLocalMembership(memberId);

  const row = await getActiveMemberPackage(client, memberId);
  if (!row) return null;

  return {
    memberPackageId: row.member_package_id,
    memberId,
    packageName: row.packages?.package_name || "Membership package",
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    usedSessions: row.used_sessions ?? row.sessions_used ?? 0,
    remainingSessions: row.remaining_sessions ?? null,
    sessionsTotal: row.sessions_total ?? row.packages?.session_limit ?? null,
  };
}

export async function createReview(user, data) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) {
    const row = createLocalReview(memberId, data);
    if (!row) throw new Error("No workout session was found for this review.");
    return row;
  }

  const sessions = await getUserSchedule(user, { startDate: data.date, endDate: data.date });
  const target = data.sessionId ? sessions.find((item) => item.sessionId === data.sessionId) : sessions[sessions.length - 1];
  if (!target) throw new Error("No workout session was found for this review.");

  const { data: row, error } = await client
    .from("service_feedback")
    .insert({
      member_id: memberId,
      trainer_id: target.trainerId || null,
      workout_session_id: target.sessionId,
      target_type: data.targetType || "trainer",
      rating: Number(data.rating),
      comment: data.comment || "",
      tags: [],
      status: "submitted",
    })
    .select("*")
    .single();
  if (error) throw error;
  return row;
}

export async function updateReview(user, data) {
  const context = resolveUserContext(user);
  const client = getSupabaseClient();
  const memberId = await resolveMemberId(client, context);
  if (!memberId) throw new Error("Current member could not be resolved.");

  if (!client) {
    const row = updateLocalReview(memberId, data);
    if (!row) throw new Error("No review was found to update.");
    return row;
  }

  let query = client.from("service_feedback").update({
    ...(data.rating ? { rating: Number(data.rating) } : {}),
    ...(data.comment ? { comment: data.comment } : {}),
  });
  query = data.reviewId ? query.eq("feedback_id", data.reviewId) : query.eq("member_id", memberId).order("created_at", { ascending: false }).limit(1);
  const { data: rows, error } = await query.select("*");
  if (error) throw error;
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) throw new Error("No review was found to update.");
  return row;
}
