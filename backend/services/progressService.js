import { createClient } from "@supabase/supabase-js";

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
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }
  return { ok: true, client };
}

function normalizeText(value) {
  return String(value || "").trim();
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number(number.toFixed(digits));
}

function fullName(user, member) {
  const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return member?.full_name || user?.full_name || userName || user?.username || member?.member_code || "Member";
}

function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MB";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchUsersByIds(client, userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await client
    .from("users")
    .select("user_id,first_name,last_name,full_name,username,email,phone_number,avatar_url")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.user_id, row]));
}

async function fetchMembersByIds(client, memberIds) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await client
    .from("members")
    .select("member_id,user_id,member_code,full_name,status,join_date")
    .in("member_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.member_id, row]));
}

async function fetchTrainerUserMap(client, trainerIds) {
  const ids = [...new Set((trainerIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data: trainers, error: trainerError } = await client
    .from("trainers")
    .select("trainer_id,user_id")
    .in("trainer_id", ids);
  if (trainerError) throw trainerError;

  const usersById = await fetchUsersByIds(client, (trainers || []).map((row) => row.user_id));
  return Object.fromEntries((trainers || []).map((trainer) => {
    const user = usersById[trainer.user_id] || {};
    return [trainer.trainer_id, fullName(user, null)];
  }));
}

async function assertManagedMember(client, trainerId, memberId) {
  const { data, error } = await client
    .from("trainer_assignments")
    .select("trainer_assignment_id")
    .eq("trainer_id", trainerId)
    .eq("member_id", memberId)
    .in("status", ["active", "paused"])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.trainer_assignment_id);
}

function mapMember(member, user) {
  const name = fullName(user, member);
  return {
    id: member.member_id,
    memberId: member.member_id,
    memberCode: member.member_code || member.member_id,
    name,
    email: user?.email || "",
    phone: user?.phone_number || "",
    avatarUrl: user?.avatar_url || "",
    avatar: initials(name),
  };
}

function mapBodyMetrics(row) {
  if (!row) return null;
  const heightCm = formatNumber(row.height_cm, 1);
  const weightKg = formatNumber(row.weight_kg, 1);
  const bmi = heightCm && weightKg ? formatNumber(weightKg / ((heightCm / 100) ** 2), 1) : null;
  const waistCm = formatNumber(row.waist_cm, 1);
  const hipCm = formatNumber(row.hip_cm, 1);
  const hipToWaist = waistCm && hipCm ? formatNumber(hipCm / waistCm, 2) : null;

  return {
    id: row.body_metric_id,
    heightCm,
    weightKg,
    bmi,
    bodyFatPercent: formatNumber(row.body_fat_percent, 1),
    bloodPressure: row.blood_pressure || "",
    hipToWaist,
    waistCm,
    hipCm,
    latestUpdatedAt: row.recorded_at || row.updated_at || row.created_at || "",
  };
}

function mapProgressRecord(row, trainerNames = {}) {
  return {
    id: row.progress_record_id,
    memberId: row.member_id,
    trainerId: row.trainer_id,
    trainerName: trainerNames[row.trainer_id] || "PT",
    evaluationDate: row.record_date || row.created_at || "",
    progressText: row.progress_text || row.notes || "",
    comment: row.comment || "",
    nextGoal: row.next_goal || "",
    notes: row.notes || "",
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

export async function listProgressMembers(trainerId) {
  const required = requireClient();
  if (!required.ok) return required;

  const normalizedTrainerId = normalizeText(trainerId);
  if (!normalizedTrainerId) {
    return { ok: false, status: 400, message: "trainerId is required." };
  }

  try {
    const { client } = required;
    const { data: assignments, error } = await client
      .from("trainer_assignments")
      .select("member_id,assigned_at,status")
      .eq("trainer_id", normalizedTrainerId)
      .in("status", ["active", "paused"])
      .order("assigned_at", { ascending: false });
    if (error) throw error;

    const memberIds = [...new Set((assignments || []).map((row) => row.member_id).filter(Boolean))];
    const membersById = await fetchMembersByIds(client, memberIds);
    const usersById = await fetchUsersByIds(client, Object.values(membersById).map((member) => member.user_id));

    return {
      ok: true,
      members: Object.values(membersById).map((member) => mapMember(member, usersById[member.user_id] || {})),
    };
  } catch (error) {
    console.error("[Progress] Failed to list members:", error);
    return { ok: false, status: 500, message: error.message || "Failed to list progress members." };
  }
}

export async function getProgressForMember(memberId, trainerId) {
  const required = requireClient();
  if (!required.ok) return required;

  const normalizedMemberId = normalizeText(memberId);
  const normalizedTrainerId = normalizeText(trainerId);
  if (!normalizedMemberId || !normalizedTrainerId) {
    return { ok: false, status: 400, message: "memberId and trainerId are required." };
  }

  try {
    const { client } = required;
    const isManaged = await assertManagedMember(client, normalizedTrainerId, normalizedMemberId);
    if (!isManaged) {
      return { ok: false, status: 403, message: "This member is not assigned to the current PT." };
    }

    const [memberResult, metricResult, historyResult] = await Promise.all([
      client.from("members").select("member_id,user_id,member_code,full_name,status,join_date").eq("member_id", normalizedMemberId).maybeSingle(),
      client.from("body_metrics").select("*").eq("member_id", normalizedMemberId).order("recorded_at", { ascending: false }).limit(1).maybeSingle(),
      client.from("progress_records").select("*").eq("member_id", normalizedMemberId).order("record_date", { ascending: false }).order("created_at", { ascending: false }),
    ]);

    if (memberResult.error) throw memberResult.error;
    if (metricResult.error) throw metricResult.error;
    if (historyResult.error) throw historyResult.error;

    const usersById = await fetchUsersByIds(client, [memberResult.data?.user_id].filter(Boolean));
    const trainerNames = await fetchTrainerUserMap(client, (historyResult.data || []).map((row) => row.trainer_id));

    return {
      ok: true,
      member: memberResult.data ? mapMember(memberResult.data, usersById[memberResult.data.user_id] || {}) : null,
      bodyMetrics: mapBodyMetrics(metricResult.data),
      history: (historyResult.data || []).map((row) => mapProgressRecord(row, trainerNames)),
    };
  } catch (error) {
    console.error("[Progress] Failed to get member progress:", error);
    return { ok: false, status: 500, message: error.message || "Failed to get member progress." };
  }
}

export async function saveProgressEvaluation(payload) {
  const required = requireClient();
  if (!required.ok) return required;

  const memberId = normalizeText(payload?.memberId || payload?.member_id);
  const trainerId = normalizeText(payload?.trainerId || payload?.trainer_id);
  const progressText = normalizeText(payload?.progressText || payload?.progress_text);
  const comment = normalizeText(payload?.comment);
  const nextGoal = normalizeText(payload?.nextGoal || payload?.next_goal);
  const notes = normalizeText(payload?.notes);
  const recordDate = normalizeText(payload?.recordDate || payload?.record_date) || todayDate();

  if (!memberId || !trainerId || !progressText) {
    return { ok: false, status: 400, message: "memberId, trainerId and progressText are required." };
  }

  try {
    const { client } = required;
    const isManaged = await assertManagedMember(client, trainerId, memberId);
    if (!isManaged) {
      return { ok: false, status: 403, message: "This member is not assigned to the current PT." };
    }

    const values = {
      member_id: memberId,
      trainer_id: trainerId,
      record_date: recordDate,
      progress_text: progressText,
      comment,
      next_goal: nextGoal,
      notes,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await client
      .from("progress_records")
      .select("progress_record_id")
      .eq("member_id", memberId)
      .eq("trainer_id", trainerId)
      .eq("record_date", recordDate)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    const query = existing?.progress_record_id
      ? client.from("progress_records").update(values).eq("progress_record_id", existing.progress_record_id)
      : client.from("progress_records").insert(values);

    const { data, error } = await query.select("*").single();
    if (error) throw error;

    const trainerNames = await fetchTrainerUserMap(client, [trainerId]);
    return { ok: true, evaluation: mapProgressRecord(data, trainerNames), action: existing?.progress_record_id ? "updated" : "created" };
  } catch (error) {
    console.error("[Progress] Failed to save evaluation:", error);
    return { ok: false, status: 500, message: error.message || "Failed to save progress evaluation." };
  }
}

export async function updateProgressEvaluation(id, payload) {
  const required = requireClient();
  if (!required.ok) return required;

  const progressId = normalizeText(id);
  const trainerId = normalizeText(payload?.trainerId || payload?.trainer_id);
  if (!progressId || !trainerId) {
    return { ok: false, status: 400, message: "progress id and trainerId are required." };
  }

  try {
    const { client } = required;
    const values = {
      progress_text: normalizeText(payload?.progressText || payload?.progress_text),
      comment: normalizeText(payload?.comment),
      next_goal: normalizeText(payload?.nextGoal || payload?.next_goal),
      notes: normalizeText(payload?.notes),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("progress_records")
      .update(values)
      .eq("progress_record_id", progressId)
      .eq("trainer_id", trainerId)
      .select("*")
      .single();
    if (error) throw error;

    const trainerNames = await fetchTrainerUserMap(client, [trainerId]);
    return { ok: true, evaluation: mapProgressRecord(data, trainerNames) };
  } catch (error) {
    console.error("[Progress] Failed to update evaluation:", error);
    return { ok: false, status: 500, message: error.message || "Failed to update progress evaluation." };
  }
}
