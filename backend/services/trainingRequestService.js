import { createClient } from "@supabase/supabase-js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MONTHLY_MAKEUP_LIMIT = 2;

let supabaseClient;

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredValue(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 && !normalized.startsWith("your_");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredValue(supabaseKey)) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

function getRequestId(row) {
  return row?.request_id || row?.training_request_id;
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

function isMissingSchemaColumn(error) {
  return error?.code === "42703" || /column .* does not exist/i.test(String(error?.message || ""));
}

function combineUserName(user, fallback = "") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function mapTrainingRequestRow(row) {
  if (!row) return null;

  return {
    requestId: getRequestId(row),
    id: getRequestId(row),
    type: row.request_type || "assignment",
    memberId: row.member_id,
    memberName: row.memberName || row.member_name || "Member",
    trainerId: row.trainer_id,
    packageId: row.package_id,
    memberPackageId: row.member_package_id,
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
    rawStatus: row.status,
    declineReason: row.decline_reason || "",
    reason: getRequestReason(row),
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    source: "supabase",
  };
}

function ok(data, message = "") {
  return { ok: true, data, message };
}

function fail(message, status = 400) {
  return { ok: false, message, status };
}

async function resolveMemberId(client, request) {
  const memberIdVal = request.memberId || request.member_id || "";
  if (uuidPattern.test(String(memberIdVal))) {
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

    return memberIdVal;
  }

  const memberEmail = String(request.memberEmail || request.member_email || "").trim().toLowerCase();
  if (!memberEmail) return "";

  const { data: user, error: userError } = await client
    .from("users")
    .select("user_id")
    .eq("email", memberEmail)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.user_id) return "";

  const { data: member, error: memberError } = await client
    .from("members")
    .select("member_id")
    .eq("user_id", user.user_id)
    .maybeSingle();

  if (memberError) throw memberError;
  return member?.member_id || "";
}

async function insertTrainingRequest(client, payload) {
  const result = await client
    .from("training_requests")
    .insert(payload)
    .select("*")
    .single();

  if (!isMissingSchemaColumn(result.error)) return result;

  return {
    data: null,
    error: new Error("Database is missing training request columns. Run database/training_request_cancel_reschedule_upgrade.sql in Supabase."),
  };
}

async function updateTrainingRequestByColumn(client, idColumn, requestId, updates) {
  return client
    .from("training_requests")
    .update(updates)
    .eq(idColumn, requestId)
    .select("*")
    .single();
}

async function findTrainerUserId(client, trainerId) {
  if (!trainerId) return "";

  const { data: trainer, error: trainerError } = await client
    .from("trainers")
    .select("user_id,employee_id")
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (trainerError) throw trainerError;
  if (trainer?.user_id) return trainer.user_id;

  if (!trainer?.employee_id) return "";

  const { data: employee, error: employeeError } = await client
    .from("employees")
    .select("user_id")
    .eq("employee_id", trainer.employee_id)
    .maybeSingle();

  if (employeeError) throw employeeError;
  return employee?.user_id || "";
}

async function createTrainerRequestNotification(client, row) {
  const trainerUserId = await findTrainerUserId(client, row.trainer_id);
  if (!trainerUserId) return;

  const type = String(row.request_type || "").toLowerCase();
  const reasonText = getRequestReason(row) ? ` Reason: ${getRequestReason(row)}` : "";
  const title = type === "cancel_booking" || type === "cancel"
    ? "Member huy booking"
    : type === "reschedule"
      ? "Member yeu cau doi lich"
      : "Member gui yeu cau lich tap";
  const message = type === "cancel_booking" || type === "cancel"
    ? `Member da huy lich ${row.current_schedule || row.requested_schedule || ""}.${reasonText}`
    : type === "reschedule"
      ? `Member muon doi tu ${row.current_schedule || "lich hien tai"} sang ${row.requested_schedule}.${reasonText}`
      : `Member gui yeu cau ${row.requested_schedule}.${reasonText}`;

  await client.from("notifications").insert({
    user_id: trainerUserId,
    notification_type: "schedule",
    title,
    message,
    action_type: "review_training_request",
    action_payload: { requestId: getRequestId(row) },
    is_read: false,
  });
}

async function createTrainerSelectionNotification(client, row) {
  if (!row?.member_id || !row?.trainer_id) return;

  const [{ data: member }, { data: trainer }] = await Promise.all([
    client
      .from("members")
      .select("user_id")
      .eq("member_id", row.member_id)
      .maybeSingle(),
    client
      .from("trainers")
      .select("trainer_code,full_name,specialty,rating,user_id,employee_id")
      .eq("trainer_id", row.trainer_id)
      .maybeSingle(),
  ]);

  if (!member?.user_id) return;

  let trainerName = trainer?.full_name || trainer?.trainer_code || "PT";
  let trainerEmail = "";

  if (trainer?.user_id) {
    const { data: trainerUser } = await client
      .from("users")
      .select("first_name,last_name,email")
      .eq("user_id", trainer.user_id)
      .maybeSingle();
    trainerName = combineUserName(trainerUser, trainerName);
    trainerEmail = trainerUser?.email || "";
  } else if (trainer?.employee_id) {
    const { data: employee } = await client
      .from("employees")
      .select("full_name,email")
      .eq("employee_id", trainer.employee_id)
      .maybeSingle();
    trainerName = employee?.full_name || trainerName;
    trainerEmail = employee?.email || "";
  }

  const parts = [
    `PT: ${trainerName}`,
    trainer?.specialty ? `Specialty: ${trainer.specialty}` : "",
    trainer?.rating ? `Rating: ${trainer.rating}/5` : "",
    row.requested_schedule ? `Schedule: ${row.requested_schedule}` : "",
    trainerEmail ? `Contact: ${trainerEmail}` : "",
  ].filter(Boolean);

  await client.from("notifications").insert({
    user_id: member.user_id,
    notification_type: "system",
    title: "Thong tin PT cua ban",
    message: parts.join(" | "),
    is_read: false,
  });
}

async function notifyMemberAboutRequest(client, row, outcome) {
  if (!row?.member_id) return;

  const { data: member, error } = await client
    .from("members")
    .select("user_id")
    .eq("member_id", row.member_id)
    .maybeSingle();

  if (error) throw error;
  if (!member?.user_id) return;

  const type = String(row.request_type || "").toLowerCase();
  const accepted = outcome === "accepted";
  const isReschedule = type === "reschedule";
  const title = accepted
    ? isReschedule ? "PT da dong y doi lich" : "PT da dong y yeu cau"
    : isReschedule ? "Yeu cau doi lich chua thanh cong" : "PT da tu choi yeu cau";
  const message = accepted
    ? isReschedule
      ? `PT da dong y doi lich sang ${row.requested_schedule}.`
      : `PT da dong y yeu cau ${row.requested_schedule}.`
    : isReschedule
      ? `PT chua dong y doi lich sang ${row.requested_schedule}.${row.decline_reason ? ` Ly do: ${row.decline_reason}` : ""}`
      : `PT da tu choi yeu cau ${row.requested_schedule}.${row.decline_reason ? ` Ly do: ${row.decline_reason}` : ""}`;

  await client.from("notifications").insert({
    user_id: member.user_id,
    notification_type: "schedule",
    title,
    message,
    action_type: "view_schedule",
    action_payload: { requestId: getRequestId(row) },
    is_read: false,
  });
}

async function notifyMemberAboutMakeupRequest(client, row, outcome) {
  if (!row?.member_id) return;

  const { data: member, error } = await client
    .from("members")
    .select("user_id")
    .eq("member_id", row.member_id)
    .maybeSingle();

  if (error) throw error;
  if (!member?.user_id) return;

  const date = row.requested_date || String(row.requested_schedule || "").split(" ")[0] || "";
  const time = String(row.start_time || "").slice(0, 5);
  const accepted = outcome === "accepted";

  await client.from("notifications").insert({
    user_id: member.user_id,
    notification_type: "schedule",
    title: accepted ? "PT da dong y lich tap" : "PT da tu choi lich tap",
    message: accepted
      ? `PT da dong y buoi tap cua ban vao ${date} luc ${time}.`
      : `PT da tu choi buoi tap vao ${date} luc ${time}. Vui long chon thoi gian khac.`,
    action_type: accepted ? "view_schedule" : "book_makeup_session_again",
    action_payload: { requestId: getRequestId(row) },
    is_read: false,
  });
}

async function applyAcceptedReschedule(client, row) {
  const sourceSessionId = await resolveSourceWorkoutSessionId(client, row);
  const requestedDate = row.requested_date;
  const startTime = String(row.start_time || "").slice(0, 5);
  const endTime = String(row.end_time || "").slice(0, 5);

  if (!sourceSessionId || !requestedDate || !startTime || !endTime) {
    throw new Error("Reschedule request is missing session/date/time metadata.");
  }

  const { data, error } = await client
    .from("workout_sessions")
    .update({
      session_date: requestedDate,
      start_time: startTime,
      end_time: endTime,
      status: "scheduled",
      notes: `Rescheduled by member request ${getRequestId(row)}.`,
    })
    .eq("workout_session_id", sourceSessionId)
    .select("workout_session_id")
    .single();

  if (error) throw error;
  return data;
}

async function resolveSourceWorkoutSessionId(client, row) {
  if (row.source_workout_session_id) return row.source_workout_session_id;

  const currentDate = getDateFromScheduleText(row.current_schedule);
  const currentStartTime = getFirstTimeFromScheduleText(row.current_schedule);
  if (!row.member_id || !row.trainer_id || !currentDate) return "";

  let query = client
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

async function createAcceptedMakeupPtSession(client, row) {
  const date = row.requested_date || null;
  const startTime = String(row.start_time || "").slice(0, 5);
  const endTime = String(row.end_time || "").slice(0, 5);
  if (!date || !startTime || !endTime) return null;

  const { data: existing, error: existingError } = await client
    .from("workout_sessions")
    .select("workout_session_id")
    .eq("member_id", row.member_id)
    .eq("trainer_id", row.trainer_id)
    .eq("session_date", date)
    .eq("start_time", startTime)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.workout_session_id) return existing;

  const { data, error } = await client
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

async function recordMakeupUsage(client, row) {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthText = String(month).padStart(2, "0");

    const { count } = await client
      .from("workout_sessions")
      .select("workout_session_id", { count: "exact", head: true })
      .eq("member_id", row.member_id)
      .not("trainer_id", "is", null)
      .eq("status", "cancelled")
      .gte("session_date", `${year}-${monthText}-01`)
      .lte("session_date", `${year}-${monthText}-31`);

    const { data: reschedules } = await client
      .from("training_requests")
      .select("created_at,current_schedule")
      .eq("member_id", row.member_id)
      .eq("request_type", "reschedule")
      .in("status", ["accepted", "approved", "completed"])
      .gte("created_at", `${year}-${monthText}-01T00:00:00`)
      .lte("created_at", `${year}-${monthText}-31T23:59:59`);

    let validRescheduleCount = 0;
    if (reschedules) {
      for (const req of reschedules) {
        if (isRequestBefore2Hours(req)) {
          validRescheduleCount++;
        }
      }
    }

    const fixedScheduleCancelCount = Number(count || 0) + validRescheduleCount;
    const maxMakeupAllowed = Math.min(fixedScheduleCancelCount, MONTHLY_MAKEUP_LIMIT);
    const { count: usedCount } = await client
      .from("training_requests")
      .select("training_request_id", { count: "exact", head: true })
      .eq("member_id", row.member_id)
      .in("request_type", ["makeup_pt_session", "reschedule"])
      .in("status", ["accepted", "approved", "completed"])
      .gte("created_at", `${year}-${monthText}-01T00:00:00`)
      .lte("created_at", `${year}-${monthText}-31T23:59:59`);

    await client.from("makeup_sessions").upsert({
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
    console.warn("[Gymster] Makeup summary table could not be updated:", error);
  }
}

export async function createTrainingRequestServer(request) {
  const client = getSupabaseClient();
  if (!client) {
    return fail("Backend Supabase service role is not configured.", 500);
  }

  try {
    const requestType = String(request?.requestType || request?.type || "assignment").toLowerCase();
    const memberId = await resolveMemberId(client, request || {});
    const trainerId = request?.trainerId || request?.trainer_id || "";

    if (!uuidPattern.test(String(memberId))) {
      return fail("A valid member id is required.");
    }

    if (!uuidPattern.test(String(trainerId))) {
      return fail("A valid trainer id is required.");
    }

    if (!String(request?.requestedSchedule || "").trim()) {
      return fail("Requested schedule is required.");
    }

    const sourceWorkoutSessionId = request?.sourceWorkoutSessionId || request?.sessionId || "";

    if (requestType === "makeup_pt_session") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const { data: makeupSession } = await client
        .from("makeup_sessions")
        .select("remaining_makeup_count")
        .eq("customer_id", memberId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      const remaining = makeupSession ? Number(makeupSession.remaining_makeup_count || 0) : 0;
      if (remaining <= 0) {
        return fail("Bạn đã hết buổi tập bù khả dụng trong tháng này.", 400);
      }
    }

    const payload = {
      member_id: memberId,
      trainer_id: trainerId,
      package_id: request?.packageId || null,
      member_package_id: request?.memberPackageId || null,
      requested_schedule: request.requestedSchedule,
      current_schedule: request.currentSchedule || null,
      source_workout_session_id: uuidPattern.test(String(sourceWorkoutSessionId)) ? sourceWorkoutSessionId : null,
      request_type: requestType,
      request_reason: request.reason || request.requestReason || "",
      requested_date: request.requestedDate || request.date || null,
      start_time: request.startTime || request.time || null,
      end_time: request.endTime || null,
      status: request.status || "pending_pt_approval",
      decline_reason: "",
    };

    const { data, error } = await insertTrainingRequest(client, payload);
    if (error) throw error;

    const row = { ...payload, ...data };
    if (requestType === "assignment") {
      await createTrainerSelectionNotification(client, row);
    } else {
      await createTrainerRequestNotification(client, row);
    }

    return ok(mapTrainingRequestRow(row), "Training request created.");
  } catch (error) {
    console.error("[Gymster] Failed to create training request:", error);
    return fail(error.message || "Training request could not be created.", 500);
  }
}

export async function updateTrainingRequestStatusServer({ requestId, status, declineReason = "" }) {
  const client = getSupabaseClient();
  if (!client) {
    return fail("Backend Supabase service role is not configured.", 500);
  }

  const normalizedStatus = status === "approved" ? "accepted" : String(status || "").toLowerCase();
  if (!requestId || !["accepted", "approved", "declined", "rejected", "cancelled", "completed"].includes(normalizedStatus)) {
    return fail("A valid request id and status are required.");
  }

  try {
    const { data: requestRow, error: fetchError } = await client
      .from("training_requests")
      .select("request_type, member_id")
      .or(`training_request_id.eq.${requestId},request_id.eq.${requestId}`)
      .maybeSingle();

    if (fetchError || !requestRow) {
      return fail("Training request not found.", 404);
    }

    const requestType = String(requestRow.request_type || "").toLowerCase();
    if (requestType === "makeup_pt_session" && ["accepted", "approved"].includes(normalizedStatus)) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const { data: makeupSession } = await client
        .from("makeup_sessions")
        .select("remaining_makeup_count")
        .eq("customer_id", requestRow.member_id)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      const remaining = makeupSession ? Number(makeupSession.remaining_makeup_count || 0) : 0;
      if (remaining <= 0) {
        return fail("Hội viên đã hết buổi tập bù khả dụng trong tháng này.", 400);
      }
    }

    const updates = {
      status: normalizedStatus,
      decline_reason: declineReason,
    };

    let { data, error } = await updateTrainingRequestByColumn(client, "training_request_id", requestId, updates);
    if (error) {
      ({ data, error } = await updateTrainingRequestByColumn(client, "request_id", requestId, updates));
    }

    if (error && normalizedStatus === "accepted") {
      const fallbackUpdates = { ...updates, status: "approved" };
      ({ data, error } = await updateTrainingRequestByColumn(client, "training_request_id", requestId, fallbackUpdates));
      if (error) {
        ({ data, error } = await updateTrainingRequestByColumn(client, "request_id", requestId, fallbackUpdates));
      }
    }

    if (error) throw error;

    const requestTypeReal = String(data?.request_type || "").toLowerCase();
    if (requestTypeReal === "reschedule" && ["accepted", "approved"].includes(normalizedStatus)) {
      await applyAcceptedReschedule(client, data);
      await recordMakeupUsage(client, data);
      await notifyMemberAboutRequest(client, data, "accepted");
    } else if (requestTypeReal === "reschedule" && ["declined", "rejected"].includes(normalizedStatus)) {
      await notifyMemberAboutRequest(client, data, "declined");
    } else if (requestTypeReal === "makeup_pt_session" && ["accepted", "approved"].includes(normalizedStatus)) {
      await createAcceptedMakeupPtSession(client, data);
      await recordMakeupUsage(client, data);
      await notifyMemberAboutMakeupRequest(client, data, "accepted");
    } else if (requestTypeReal === "makeup_pt_session" && ["declined", "rejected"].includes(normalizedStatus)) {
      await notifyMemberAboutMakeupRequest(client, data, "declined");
    } else if (["accepted", "approved"].includes(normalizedStatus)) {
      await createTrainerSelectionNotification(client, data);
    }

    return ok(mapTrainingRequestRow(data), "Training request updated.");
  } catch (error) {
    console.error("[Gymster] Failed to update training request:", error);
    return fail(error.message || "Training request could not be updated.", 500);
  }
}

function parseDateTimeAsGmt7(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.slice(0, 5).split(":").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return null;

  const pad = (n) => String(n).padStart(2, "0");
  const isoStr = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+07:00`;
  const dateObj = new Date(isoStr);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj;
}

function isSessionBefore2Hours(dateStr, timeStr) {
  const sessionTime = parseDateTimeAsGmt7(dateStr, timeStr);
  if (!sessionTime) return false;
  const now = new Date();
  const diffHours = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2.0;
}

function isRequestBefore2Hours(request) {
  if (!request) return false;
  const currentSchedule = request.currentSchedule || request.current_schedule;
  if (!currentSchedule) return false;

  const parts = currentSchedule.trim().split(" ");
  if (parts.length < 2) return false;
  const dateStr = parts[0];
  const timeStr = parts[1];

  const sessionTime = parseDateTimeAsGmt7(dateStr, timeStr);
  if (!sessionTime) return false;

  const createdAtStr = request.createdAt || request.created_at || new Date().toISOString();
  const requestTime = new Date(createdAtStr);

  const diffHours = (sessionTime.getTime() - requestTime.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2.0;
}

