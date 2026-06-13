import { supabase } from "./supabaseClient";
import {
  markMakeupSessionUsedForAcceptedRequest,
  saveAcceptedLocalPtSessionFromRequest,
  updateLocalWorkoutSessionSchedule,
} from "./workoutSessionApi";
import { getMonthlyLeaveLimit } from "./packageEntitlement";
import { createLocalNotification } from "./notificationApi";
import {
  applyLocalTrainingRequestStatus,
  getTrainingRequestStatusLabel,
  isLocalTrainingRequestId,
} from "./trainingRequestLocal.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_TRAINING_REQUESTS_KEY = "gymster_local_training_requests";

function getRequestId(row) {
  return row?.request_id || row?.training_request_id;
}

function combineUserName(user, fallback = "") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function getMemberName(row) {
  return combineUserName(row?.members?.users, row?.members?.member_code || row?.member_id || "Member");
}

function getTrainerName(row) {
  return combineUserName(row?.trainers?.users, row?.trainers?.employees?.full_name || row?.trainers?.trainer_code || row?.trainer_id || "Trainer");
}

function getRequestReason(row) {
  return row?.reason || row?.request_reason || row?.requestNote || row?.request_note || row?.notes || "";
}

function getDateFromScheduleText(value) {
  return String(value || "").match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function getFirstTimeFromScheduleText(value) {
  return String(value || "").match(/(\d{2}:\d{2})/)?.[1] || "";
}

function normalizeApiTrainingRequest(row) {
  if (!row) return row;
  const status = row.rawStatus || row.status || "pending_pt_approval";
  return {
    ...row,
    id: row.id || row.requestId || row.trainingRequestId,
    requestId: row.requestId || row.id || row.trainingRequestId,
    rawStatus: status,
    statusLabel: row.statusLabel || getTrainingRequestStatusLabel(status),
  };
}

async function postTrainingRequestApi(path, payload) {
  if (typeof fetch !== "function") return null;

  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let result = null;

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      return null;
    }

    if (response.status === 404 || !result) return null;
    if (!response.ok || result.ok === false) {
      return {
        handled: true,
        data: null,
        error: new Error(result.message || "Training request API failed."),
      };
    }

    return {
      handled: true,
      data: normalizeApiTrainingRequest(result.data),
      error: null,
    };
  } catch {
    return null;
  }
}

function isMissingSchemaColumn(error) {
  return error?.code === "42703" || /column .* does not exist/i.test(String(error?.message || ""));
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocalTrainingRequests() {
  if (!canUseStorage()) return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(LOCAL_TRAINING_REQUESTS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    window.localStorage.removeItem(LOCAL_TRAINING_REQUESTS_KEY);
    return [];
  }
}

function writeLocalTrainingRequests(rows) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_TRAINING_REQUESTS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("gymster:training-requests-updated"));
}

export function saveAiTrainingRequest(request) {
  if (!request?.requestId && !request?.trainingRequestId) return;
  const row = {
    ...request,
    id: request.requestId || request.trainingRequestId,
    requestId: request.requestId || request.trainingRequestId,
    trainingRequestId: request.trainingRequestId || request.requestId,
    type: request.type || "makeup_pt_session",
    status: request.status || "pending_pt_approval",
    rawStatus: request.status || "pending_pt_approval",
    statusLabel: getTrainingRequestStatusLabel(request.status || "pending_pt_approval"),
    preferredSchedule: request.requestedSchedule || `${request.date || ""} ${request.time || ""}`.trim(),
    requestedSchedule: request.requestedSchedule || `${request.date || ""} ${request.time || ""}`.trim(),
    currentSchedule: request.currentSchedule || "",
    sourceWorkoutSessionId: request.sourceWorkoutSessionId || request.sessionId || "",
    requestedDate: request.requestedDate || request.date || null,
    startTime: request.startTime || request.time || null,
    endTime: request.endTime || null,
    source: "local",
  };
  const rows = readLocalTrainingRequests();
  writeLocalTrainingRequests([row, ...rows.filter((item) => item.requestId !== row.requestId)]);
}

async function createTrainerSelectionNotification(row) {
  if (!row?.member_id || !row?.trainer_id) return;

  try {
    const [{ data: member }, { data: trainer }] = await Promise.all([
      supabase
        .from("members")
        .select("user_id")
        .eq("member_id", row.member_id)
        .maybeSingle(),
      supabase
        .from("trainers")
        .select("trainer_code,full_name,specialty,rating,user_id,employee_id")
        .eq("trainer_id", row.trainer_id)
        .maybeSingle(),
    ]);

    if (!member?.user_id) return;

    let trainerName = trainer?.full_name || trainer?.trainer_code || "PT";
    let trainerEmail = "";

    if (trainer?.user_id) {
      const { data: trainerUser } = await supabase
        .from("users")
        .select("first_name,last_name,email")
        .eq("user_id", trainer.user_id)
        .maybeSingle();
      trainerName = combineUserName(trainerUser, trainerName);
      trainerEmail = trainerUser?.email || "";
    } else if (trainer?.employee_id) {
      const { data: employee } = await supabase
        .from("employees")
        .select("full_name,email")
        .eq("employee_id", trainer.employee_id)
        .maybeSingle();
      trainerName = employee?.full_name || trainerName;
      trainerEmail = employee?.email || "";
    }

    const parts = [
      `PT: ${trainerName}`,
      trainer?.specialty ? `Chuyên môn: ${trainer.specialty}` : "",
      trainer?.rating ? `Đánh giá: ${trainer.rating}/5` : "",
      row.requested_schedule ? `Lịch đăng ký: ${row.requested_schedule}` : "",
      trainerEmail ? `Liên hệ: ${trainerEmail}` : "",
    ].filter(Boolean);

    await supabase.from("notifications").insert({
      user_id: member.user_id,
      notification_type: "system",
      title: "Thông tin PT của bạn",
      message: parts.join(" | "),
      is_read: false,
    });
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to create trainer selection notification:", error);
  }
}

async function createTrainerRequestNotification(row) {
  if (!row?.trainer_id) return;
  try {
    const { data: trainer } = await supabase
      .from("trainers")
      .select("user_id,employee_id")
      .eq("trainer_id", row.trainer_id)
      .maybeSingle();

    let trainerUserId = trainer?.user_id || null;
    if (!trainerUserId && trainer?.employee_id) {
      const { data: employee } = await supabase
        .from("employees")
        .select("user_id")
        .eq("employee_id", trainer.employee_id)
        .maybeSingle();
      trainerUserId = employee?.user_id || null;
    }
    if (!trainerUserId) return;

    const type = String(row.request_type || "").toLowerCase();
    const title = type === "reschedule" ? "Member yêu cầu đổi lịch" : "Member gửi yêu cầu lịch tập";
    const message = type === "reschedule"
      ? `Member muốn đổi từ ${row.current_schedule || "lịch hiện tại"} sang ${row.requested_schedule}.`
      : `Member gửi yêu cầu ${row.requested_schedule}.`;

    const reasonText = getRequestReason(row) ? ` Ly do: ${getRequestReason(row)}` : "";
    const notificationTitle = type === "cancel_booking" || type === "cancel"
      ? "Member huy booking"
      : type === "reschedule"
        ? "Member yeu cau doi lich"
        : "Member gui yeu cau lich tap";
    const notificationMessage = type === "cancel_booking" || type === "cancel"
      ? `Member da huy lich ${row.current_schedule || row.requested_schedule || ""}.${reasonText}`
      : type === "reschedule"
        ? `Member muon doi tu ${row.current_schedule || "lich hien tai"} sang ${row.requested_schedule}.${reasonText}`
        : `Member gui yeu cau ${row.requested_schedule}.${reasonText}`;

    await supabase.from("notifications").insert({
      user_id: trainerUserId,
      notification_type: "schedule",
      title: notificationTitle,
      message: notificationMessage,
      action_type: "review_training_request",
      action_payload: { requestId: row.request_id || row.training_request_id },
      is_read: false,
    });
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to create trainer request notification:", error);
  }
}

function mapTrainingRequestRow(row) {
  if (!row) return null;

  return {
    requestId: getRequestId(row),
    id: getRequestId(row),
    type: row.request_type || "assignment",
    memberId: row.member_id,
    memberName: getMemberName(row),
    trainerId: row.trainer_id,
    trainerName: getTrainerName(row),
    packageId: row.package_id,
    packageName: row.packages?.package_name || "",
    requestedSchedule: row.requested_schedule,
    preferredSchedule: row.requested_schedule,
    currentSchedule: row.current_schedule || "",
    sourceWorkoutSessionId: row.source_workout_session_id || "",
    requestedDate: row.requested_date,
    date: row.requested_date,
    startTime: String(row.start_time || "").slice(0, 5),
    time: String(row.start_time || "").slice(0, 5),
    endTime: String(row.end_time || "").slice(0, 5),
    status: row.status,
    statusLabel: getTrainingRequestStatusLabel(row.status),
    rawStatus: row.status,
    declineReason: row.decline_reason || "",
    reason: getRequestReason(row),
    createdAt: row.created_at,
    createdDate: row.created_at ? String(row.created_at).slice(0, 10) : "",
    expiresAt: row.expires_at,
    source: "supabase",
  };
}

async function resolveMemberId(request) {
  if (request.memberId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(request.memberId))) {
    return request.memberId;
  }

  if (request.memberEmail) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", request.memberEmail)
      .maybeSingle();

    if (user?.user_id) {
      const { data: member } = await supabase
        .from("members")
        .select("member_id")
        .eq("user_id", user.user_id)
        .maybeSingle();

      if (member?.member_id) {
        return member.member_id;
      }
    }
  }

  const { data } = await supabase
    .from("members")
    .select("member_id")
    .limit(1)
    .maybeSingle();

  return data?.member_id || request.memberId;
}

async function insertTrainingRequest(payload) {
  const result = await supabase
    .from("training_requests")
    .insert(payload)
    .select("*")
    .single();
  if (!isMissingSchemaColumn(result.error)) return result;

  if (String(payload.request_type || "").toLowerCase() !== "assignment") {
    return {
      data: null,
      error: new Error("Database chưa hỗ trợ request đổi lịch/hủy lịch. Vui lòng chạy database/training_request_cancel_reschedule_upgrade.sql trên Supabase."),
    };
  }

  const legacyPayload = {
    member_id: payload.member_id,
    trainer_id: payload.trainer_id,
    package_id: payload.package_id,
    member_package_id: payload.member_package_id,
    requested_schedule: payload.requested_schedule,
    status: payload.status,
    decline_reason: payload.decline_reason,
  };
  return supabase
    .from("training_requests")
    .insert(legacyPayload)
    .select("*")
    .single();
}

async function selectTrainingRequestByColumn(idColumn, requestId) {
  return supabase
    .from("training_requests")
    .select("*")
    .eq(idColumn, requestId)
    .maybeSingle();
}

async function updateTrainingRequestByColumn(idColumn, requestId, updates) {
  return supabase
    .from("training_requests")
    .update(updates)
    .eq(idColumn, requestId)
    .select("*")
    .single();
}

function baseTrainingRequestSelect() {
  return `
    training_request_id,
    request_id,
    request_type,
    request_reason,
    member_id,
    trainer_id,
    package_id,
    member_package_id,
    requested_schedule,
    current_schedule,
    source_workout_session_id,
    requested_date,
    start_time,
    end_time,
    status,
    decline_reason,
    created_at,
    expires_at,
    members (
      member_id,
      member_code,
      users (
        first_name,
        last_name,
        email
      )
    ),
    trainers (
      trainer_id,
      trainer_code,
      users (
        first_name,
        last_name,
        email
      ),
      employees (
        full_name,
        email
      )
    ),
    packages (
      package_name
    )
  `;
}

function legacyTrainingRequestSelect() {
  return `
    training_request_id,
    member_id,
    trainer_id,
    package_id,
    member_package_id,
    requested_schedule,
    status,
    decline_reason,
    created_at,
    members (
      member_id,
      member_code,
      users (
        first_name,
        last_name,
        email
      )
    ),
    trainers (
      trainer_id,
      trainer_code,
      users (
        first_name,
        last_name,
        email
      ),
      employees (
        full_name,
        email
      )
    ),
    packages (
      package_name
    )
  `;
}

async function resolveMemberIdFromLookup(memberLookup) {
  if (uuidPattern.test(String(memberLookup || ""))) {
    return memberLookup;
  }

  if (String(memberLookup || "").includes("@")) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", memberLookup)
      .maybeSingle();

    if (!user?.user_id) return null;

    const { data: member } = await supabase
      .from("members")
      .select("member_id")
      .eq("user_id", user.user_id)
      .maybeSingle();

    return member?.member_id || null;
  }

  return null;
}

async function resolveTrainerIdFromLookup(trainerLookup) {
  if (uuidPattern.test(String(trainerLookup || ""))) {
    return trainerLookup;
  }

  if (String(trainerLookup || "").includes("@")) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", trainerLookup)
      .maybeSingle();

    if (user?.user_id) {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("trainer_id")
        .eq("user_id", user.user_id)
        .maybeSingle();

      if (trainer?.trainer_id) {
        return trainer.trainer_id;
      }
    }

    const { data: employee } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("email", trainerLookup)
      .maybeSingle();

    if (employee?.employee_id) {
      const { data: trainer } = await supabase
        .from("trainers")
        .select("trainer_id")
        .eq("employee_id", employee.employee_id)
        .maybeSingle();

      return trainer?.trainer_id || null;
    }
  }

  return null;
}

async function selectTrainingRequests(filters = {}) {
  let query = supabase
    .from("training_requests")
    .select(baseTrainingRequestSelect())
    .order("created_at", { ascending: false });

  if (filters.trainerId) {
    query = query.eq("trainer_id", filters.trainerId);
  }

  if (filters.memberId) {
    query = query.eq("member_id", filters.memberId);
  }

  const result = await query;
  if (!isMissingSchemaColumn(result.error)) return result;

  let fallbackQuery = supabase
    .from("training_requests")
    .select(legacyTrainingRequestSelect())
    .order("created_at", { ascending: false });

  if (filters.trainerId) {
    fallbackQuery = fallbackQuery.eq("trainer_id", filters.trainerId);
  }

  if (filters.memberId) {
    fallbackQuery = fallbackQuery.eq("member_id", filters.memberId);
  }

  return fallbackQuery;
}

async function notifyMemberAboutMakeupRequest(row, outcome) {
  if (!row?.member_id) return;
  try {
    const { data: member } = await supabase
      .from("members")
      .select("user_id")
      .eq("member_id", row.member_id)
      .maybeSingle();
    if (!member?.user_id) return;

    const date = row.requested_date || String(row.requested_schedule || "").split(" ")[0] || "";
    const time = String(row.start_time || "").slice(0, 5);
    const accepted = outcome === "accepted";
    await supabase.from("notifications").insert({
      user_id: member.user_id,
      notification_type: "schedule",
      title: accepted ? "PT đã đồng ý lịch tập" : "PT đã từ chối lịch tập",
      message: accepted
        ? `PT đã đồng ý buổi tập của bạn vào ${date} lúc ${time}.`
        : `PT đã từ chối buổi tập vào ${date} lúc ${time}. Vui lòng chọn thời gian khác.`,
      action_type: accepted ? "view_schedule" : "book_makeup_session_again",
      action_payload: { requestId: row.request_id || row.training_request_id },
      is_read: false,
    });
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to notify member about makeup request:", error);
  }
}

async function createAcceptedMakeupPtSession(row) {
  const date = row.requested_date || null;
  const startTime = String(row.start_time || "").slice(0, 5);
  const endTime = String(row.end_time || "").slice(0, 5);
  if (!date || !startTime || !endTime) return null;

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("workout_session_id")
    .eq("member_id", row.member_id)
    .eq("trainer_id", row.trainer_id)
    .eq("session_date", date)
    .eq("start_time", startTime)
    .maybeSingle();
  if (existing?.workout_session_id) return existing;

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      member_id: row.member_id,
      trainer_id: row.trainer_id,
      package_id: row.package_id || null,
      member_package_id: row.member_package_id || null,
      title: "PT Session",
      session_title: "PT Session",
      exercise_type: "Personal Training",
      room_name: "PT Room",
      session_date: date,
      start_time: startTime,
      end_time: endTime,
      status: "scheduled",
      notes: "Makeup PT session accepted by PT.",
    })
    .select("workout_session_id")
    .single();
  if (error) throw error;
  return data;
}

async function recordMakeupUsage(row) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { count } = await supabase
      .from("workout_sessions")
      .select("workout_session_id", { count: "exact", head: true })
      .eq("member_id", row.member_id)
      .not("trainer_id", "is", null)
      .eq("status", "cancelled")
      .gte("session_date", `${year}-${String(month).padStart(2, "0")}-01`)
      .lte("session_date", `${year}-${String(month).padStart(2, "0")}-31`);
    const fixedScheduleCancelCount = Number(count || 0);
    const maxMakeupAllowed = Math.min(fixedScheduleCancelCount, getMonthlyLeaveLimit());
    const { count: usedCount } = await supabase
      .from("training_requests")
      .select("training_request_id", { count: "exact", head: true })
      .eq("member_id", row.member_id)
      .eq("request_type", "makeup_pt_session")
      .in("status", ["accepted", "approved", "completed"])
      .gte("created_at", `${year}-${String(month).padStart(2, "0")}-01T00:00:00`)
      .lte("created_at", `${year}-${String(month).padStart(2, "0")}-31T23:59:59`);

    await supabase.from("makeup_sessions").upsert({
      customer_id: row.member_id,
      month,
      year,
      fixed_schedule_cancel_count: fixedScheduleCancelCount,
      max_makeup_allowed: maxMakeupAllowed,
      used_makeup_count: Number(usedCount || 0),
      remaining_makeup_count: Math.max(0, maxMakeupAllowed - Number(usedCount || 0)),
      updated_at: new Date().toISOString(),
    }, { onConflict: "customer_id,month,year" });
  } catch (error) {
    console.warn("[Gymster h\u1ec7 th\u1ed1ng] Makeup summary table could not be updated:", error);
  }
}

async function notifyMemberAboutRequest(row, outcome) {
  if (!row?.member_id) return;
  try {
    const { data: member } = await supabase
      .from("members")
      .select("user_id")
      .eq("member_id", row.member_id)
      .maybeSingle();
    if (!member?.user_id) return;

    const type = String(row.request_type || "").toLowerCase();
    const accepted = outcome === "accepted";
    const isReschedule = type === "reschedule";
    const title = accepted
      ? isReschedule ? "PT đã đồng ý đổi lịch" : "PT đã đồng ý yêu cầu"
      : isReschedule ? "Yêu cầu đổi lịch chưa thành công" : "PT đã từ chối yêu cầu";
    const message = accepted
      ? isReschedule
        ? `PT đã đồng ý đổi lịch sang ${row.requested_schedule}.`
        : `PT đã đồng ý yêu cầu ${row.requested_schedule}.`
      : isReschedule
        ? `PT chưa đồng ý đổi lịch sang ${row.requested_schedule}.${row.decline_reason ? ` Lý do: ${row.decline_reason}` : ""}`
        : `PT đã từ chối yêu cầu ${row.requested_schedule}.${row.decline_reason ? ` Lý do: ${row.decline_reason}` : ""}`;

    await supabase.from("notifications").insert({
      user_id: member.user_id,
      notification_type: "schedule",
      title,
      message,
      action_type: "view_schedule",
      action_payload: { requestId: row.request_id || row.training_request_id },
      is_read: false,
    });
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to notify member about training request:", error);
  }
}

function notifyLocalTrainerAboutRequest(row) {
  const type = String(row.type || row.requestType || row.request_type || "").toLowerCase();
  const isReschedule = type === "reschedule";
  const isCancel = type === "cancel_booking" || type === "cancel";
  const title = isCancel ? "Member hủy booking" : isReschedule ? "Member yêu cầu đổi lịch" : "Member gửi yêu cầu lịch tập";
  const message = isCancel
    ? `Member đã hủy lịch ${row.currentSchedule || row.requestedSchedule || ""}.${row.reason ? ` Lý do: ${row.reason}` : ""}`
    : isReschedule
      ? `Member muốn đổi từ ${row.currentSchedule || "lịch hiện tại"} sang ${row.requestedSchedule || "lịch mới"}.${row.reason ? ` Lý do: ${row.reason}` : ""}`
      : `Member gửi yêu cầu ${row.requestedSchedule || ""}.`;

  createLocalNotification({
    trainerId: row.trainerId || row.trainer_id,
    role: "pt",
    notificationType: "schedule",
    type: isCancel ? "error" : "warning",
    title,
    message,
    actionType: "review_training_request",
    actionPayload: { requestId: row.requestId || row.id || row.trainingRequestId },
  });
}

function notifyLocalMemberAboutRequest(row, outcome) {
  const type = String(row.type || row.requestType || row.request_type || "").toLowerCase();
  const accepted = outcome === "accepted";
  const isReschedule = type === "reschedule";
  const title = accepted
    ? isReschedule ? "PT đã đồng ý đổi lịch" : "PT đã đồng ý yêu cầu"
    : isReschedule ? "Yêu cầu đổi lịch chưa thành công" : "PT đã từ chối yêu cầu";
  const message = accepted
    ? isReschedule
      ? `PT đã đồng ý đổi lịch sang ${row.requestedSchedule || row.requested_schedule || ""}.`
      : `PT đã đồng ý yêu cầu ${row.requestedSchedule || row.requested_schedule || ""}.`
    : isReschedule
      ? `Request lịch không thành công. Vui lòng chọn lịch khác.${row.declineReason ? ` Lý do: ${row.declineReason}` : ""}`
      : `PT đã từ chối yêu cầu ${row.requestedSchedule || row.requested_schedule || ""}.${row.declineReason ? ` Lý do: ${row.declineReason}` : ""}`;

  createLocalNotification({
    memberId: row.memberId || row.member_id,
    role: "member",
    notificationType: "schedule",
    type: accepted ? "success" : "error",
    title,
    message,
    actionType: "view_schedule",
    actionPayload: { requestId: row.requestId || row.id || row.trainingRequestId },
  });
}

async function applyAcceptedReschedule(row) {
  const sourceSessionId = await resolveSourceWorkoutSessionId(row);
  const requestedDate = row.requested_date;
  const startTime = String(row.start_time || "").slice(0, 5);
  const endTime = String(row.end_time || "").slice(0, 5);
  if (!sourceSessionId || !requestedDate || !startTime || !endTime) return null;

  const { data, error } = await supabase
    .from("workout_sessions")
    .update({
      session_date: requestedDate,
      start_time: startTime,
      end_time: endTime,
      status: "scheduled",
      notes: `Rescheduled by member request ${row.request_id || row.training_request_id}.`,
    })
    .eq("workout_session_id", sourceSessionId)
    .select("workout_session_id")
    .single();
  if (error) throw error;
  return data;
}

async function resolveSourceWorkoutSessionId(row) {
  if (row.source_workout_session_id) return row.source_workout_session_id;

  const currentDate = getDateFromScheduleText(row.current_schedule);
  const currentStartTime = getFirstTimeFromScheduleText(row.current_schedule);
  if (!row.member_id || !row.trainer_id || !currentDate) return "";

  let query = supabase
    .from("workout_sessions")
    .select("workout_session_id")
    .eq("member_id", row.member_id)
    .eq("trainer_id", row.trainer_id)
    .eq("session_date", currentDate);

  if (currentStartTime) {
    query = query.eq("start_time", currentStartTime);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data?.workout_session_id || "";
}

export async function createTrainingRequest(request) {
  const requestType = request.requestType || request.type || "assignment";
  const hasLocalIdentifiers = [
    request.trainerId,
    request.packageId,
    request.memberPackageId,
    request.sourceWorkoutSessionId || request.sessionId,
  ].some((value) => value && !uuidPattern.test(String(value)));

  if (!supabase || (String(requestType).toLowerCase() !== "assignment" && hasLocalIdentifiers)) {
    const now = new Date().toISOString();
    const localRequestId = `LOCAL-TR-${Date.now()}`;
    const row = {
      id: localRequestId,
      requestId: localRequestId,
      trainingRequestId: localRequestId,
      type: requestType,
      requestType,
      memberId: request.memberId || request.member_id || "",
      trainerId: request.trainerId || "",
      packageId: request.packageId || "",
      memberPackageId: request.memberPackageId || "",
      preferredSchedule: request.requestedSchedule || `${request.requestedDate || request.date || ""} ${request.startTime || request.time || ""}`.trim(),
      requestedSchedule: request.requestedSchedule || "",
      currentSchedule: request.currentSchedule || "",
      sourceWorkoutSessionId: request.sourceWorkoutSessionId || request.sessionId || "",
      requestedDate: request.requestedDate || request.date || null,
      startTime: request.startTime || request.time || null,
      endTime: request.endTime || null,
      reason: request.reason || request.requestReason || "",
      memberName: request.memberName || "",
      status: request.status || "pending_pt_approval",
      rawStatus: request.status || "pending_pt_approval",
      statusLabel: getTrainingRequestStatusLabel(request.status || "pending_pt_approval"),
      createdAt: now,
      updatedAt: now,
      source: "local",
    };
    writeLocalTrainingRequests([row, ...readLocalTrainingRequests()]);
    notifyLocalTrainerAboutRequest(row);
    return { data: row, error: null };
  }

  const apiResult = await postTrainingRequestApi("/api/training-requests", request);
  if (apiResult?.handled) {
    if (!apiResult.error && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gymster:training-requests-updated"));
      window.dispatchEvent(new CustomEvent("gymster-role-notifications-change"));
    }
    return { data: apiResult.data, error: apiResult.error };
  }

  const memberId = await resolveMemberId(request);
  const payload = {
    member_id: memberId,
    trainer_id: request.trainerId,
    package_id: request.packageId,
    member_package_id: request.memberPackageId || null,
    requested_schedule: request.requestedSchedule,
    current_schedule: request.currentSchedule || null,
    source_workout_session_id: uuidPattern.test(String(request.sourceWorkoutSessionId || request.sessionId || "")) ? (request.sourceWorkoutSessionId || request.sessionId) : null,
    request_type: requestType,
    request_reason: request.reason || request.requestReason || "",
    requested_date: request.requestedDate || request.date || null,
    start_time: request.startTime || request.time || null,
    end_time: request.endTime || null,
    status: request.status || "pending_pt_approval",
    decline_reason: "",
  };

  const { data, error } = await insertTrainingRequest(payload);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create training request:", error);
    return { data: null, error };
  }

  const normalizedRequestType = String(data?.request_type || payload.request_type || "").toLowerCase();
  if (normalizedRequestType === "assignment") {
    await createTrainerSelectionNotification(data);
  } else {
    await createTrainerRequestNotification({ ...data, ...payload });
  }

  return { data: mapTrainingRequestRow({ ...payload, ...data }), error: null };
}

export async function getTrainingRequestsForTrainer(trainerLookup) {
  const localRows = readLocalTrainingRequests()
    .filter((request) => !trainerLookup || !request.trainerId || request.trainerId === trainerLookup || request.source === "local");
  if (!supabase) {
    return { data: localRows, error: null };
  }

  const trainerId = await resolveTrainerIdFromLookup(trainerLookup);
  const { data, error } = await selectTrainingRequests({ trainerId });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainer training requests:", error);
    return { data: readLocalTrainingRequests(), error: null };
  }

  return {
    data: [...localRows, ...(Array.isArray(data) ? data.map(mapTrainingRequestRow) : [])],
    error: null,
  };
}

export async function getTrainingRequestsForMember(memberLookup) {
  if (!supabase) {
    const memberId = String(memberLookup?.memberId || memberLookup?.member_id || memberLookup?.id || memberLookup || "");
    const rows = readLocalTrainingRequests()
      .filter((request) => !memberId || !request.memberId || request.memberId === memberId);
    return { data: rows, error: null };
  }

  const memberId = await resolveMemberIdFromLookup(memberLookup);
  if (!memberId) {
    return { data: [], error: null };
  }

  const { data, error } = await selectTrainingRequests({ memberId });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member training requests:", error);
    return { data: readLocalTrainingRequests(), error: null };
  }

  return {
    data: [...readLocalTrainingRequests()
      .filter((request) => !memberId || !request.memberId || request.memberId === memberId), ...(Array.isArray(data) ? data.map(mapTrainingRequestRow) : [])],
    error: null,
  };
}

export async function getTrainingRequestById(requestId) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load training request:", error);
    return { data: null, error };
  }

  let { data, error } = await selectTrainingRequestByColumn("training_request_id", requestId);

  if (error) {
    ({ data, error } = await selectTrainingRequestByColumn("request_id", requestId));
  }

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load training request:", error);
    return { data: null, error };
  }

  return { data: mapTrainingRequestRow(data), error: null };
}

export async function updateTrainingRequestStatus(requestId, status, declineReason = "") {
  const localRows = readLocalTrainingRequests();
  const localUpdate = applyLocalTrainingRequestStatus(localRows, requestId, status, declineReason);
  const shouldHandleLocally = !localUpdate.error && (!supabase || localUpdate.target?.source === "local" || isLocalTrainingRequestId(requestId));

  if (shouldHandleLocally) {
    const nextTarget = localUpdate.target;
    const normalizedStatus = String(nextTarget.status || "").toLowerCase();
    if (normalizedStatus === "accepted") {
      if (nextTarget.type === "reschedule") {
        updateLocalWorkoutSessionSchedule(nextTarget.sourceWorkoutSessionId, nextTarget);
      } else {
        saveAcceptedLocalPtSessionFromRequest(nextTarget);
        markMakeupSessionUsedForAcceptedRequest(nextTarget);
      }
    }
    writeLocalTrainingRequests(localUpdate.rows);
    if (nextTarget.type === "reschedule" && ["accepted", "declined", "rejected"].includes(String(normalizedStatus).toLowerCase())) {
      notifyLocalMemberAboutRequest(nextTarget, normalizedStatus === "accepted" ? "accepted" : "declined");
    }
    return { data: nextTarget, error: null };
  }

  if (!supabase || isLocalTrainingRequestId(requestId)) {
    return { data: null, error: localUpdate.error || new Error("Training request was not found.") };
  }

  const apiResult = await postTrainingRequestApi("/api/training-requests/status", {
    requestId,
    status,
    declineReason,
  });
  if (apiResult?.handled) {
    if (!apiResult.error && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gymster:training-requests-updated"));
      window.dispatchEvent(new CustomEvent("gymster:schedule-updated"));
      window.dispatchEvent(new CustomEvent("gymster-role-notifications-change"));
    }
    return { data: apiResult.data, error: apiResult.error };
  }

  const updates = {
    status,
    decline_reason: declineReason,
  };

  let { data, error } = await updateTrainingRequestByColumn("training_request_id", requestId, updates);

  if (error) {
    ({ data, error } = await updateTrainingRequestByColumn("request_id", requestId, updates));
  }

  if (error && status === "accepted") {
    const fallbackUpdates = {
      ...updates,
      status: "approved",
    };

    ({ data, error } = await updateTrainingRequestByColumn("training_request_id", requestId, fallbackUpdates));

    if (error) {
      ({ data, error } = await updateTrainingRequestByColumn("request_id", requestId, fallbackUpdates));
    }
  }

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update training request:", error);
    return { data: null, error };
  }

  const normalizedStatus = String(status || "").toLowerCase();
  const requestType = String(data?.request_type || "").toLowerCase();
  if (requestType === "reschedule" && ["accepted", "approved"].includes(normalizedStatus)) {
    try {
      await applyAcceptedReschedule(data);
      await notifyMemberAboutRequest(data, "accepted");
    } catch (actionError) {
      console.error("[Gymster hệ thống] Failed to finalize reschedule request:", actionError);
      return { data: null, error: actionError };
    }
  } else if (requestType === "reschedule" && ["declined", "rejected"].includes(normalizedStatus)) {
    await notifyMemberAboutRequest(data, "declined");
  } else if (requestType === "makeup_pt_session" && ["accepted", "approved"].includes(normalizedStatus)) {
    try {
      await createAcceptedMakeupPtSession(data);
      await recordMakeupUsage(data);
      await notifyMemberAboutMakeupRequest(data, "accepted");
    } catch (actionError) {
      console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to finalize makeup PT request:", actionError);
      return { data: null, error: actionError };
    }
  } else if (requestType === "makeup_pt_session" && ["declined", "rejected"].includes(normalizedStatus)) {
    await notifyMemberAboutMakeupRequest(data, "declined");
  } else if (["accepted", "approved"].includes(normalizedStatus)) {
    await createTrainerSelectionNotification(data);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gymster:training-requests-updated"));
    window.dispatchEvent(new CustomEvent("gymster:schedule-updated"));
  }

  return { data: mapTrainingRequestRow(data), error: null };
}
