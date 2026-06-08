import { createClient } from "@supabase/supabase-js";
import {
  cancelLocalBooking,
  createLocalBooking,
  createLocalReview,
  getDefaultMemberId,
  getLocalMembership,
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
  if (context.memberId) return context.memberId;
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

  const endTime = data.endTime || addHours(data.time, 1);
  assertWithinGymHours(data.time, endTime);

  if (!client) {
    return mapSession(createLocalBooking(memberId, { ...data, endTime }));
  }

  const { data: row, error } = await client
    .from("workout_sessions")
    .insert({
      member_id: memberId,
      trainer_id: null,
      member_package_id: null,
      title: "Self Workout",
      exercise_type: "Manual Workout",
      room_name: "Gym Floor",
      session_date: data.date,
      start_time: data.time,
      end_time: endTime,
      status: "scheduled",
      notes: data.note || "Self-added by Gymster AI Assistant.",
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapSession(row);
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
  if (isPtSession(target)) {
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
