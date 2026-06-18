import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";

function fullName(row, fallback = "Member") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return row?.full_name || name || row?.username || fallback;
}

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

async function progressJson(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || data?.error || "Progress request failed.");
  }
  return data;
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

  const email = String(currentUser.email || "").toLowerCase();
  if (email) {
    const { data: user } = await supabase.from("users").select("user_id").eq("email", email).maybeSingle();
    if (user?.user_id) {
      const { data } = await supabase.from("trainers").select("*").eq("user_id", user.user_id).maybeSingle();
      if (data) return data;
    }
  }

  return null;
}

function mapMember(row) {
  return {
    id: row.id || row.memberId,
    memberId: row.memberId || row.id,
    memberCode: row.memberCode || row.member_id || "",
    name: row.name || fullName(row),
    email: row.email || "",
    phone: row.phone || "",
    avatarUrl: row.avatarUrl || "",
    avatar: row.avatar || "",
  };
}

function mapBodyMetrics(metrics) {
  if (!metrics) return null;
  return {
    ...metrics,
    latestUpdatedLabel: formatDisplayDate(metrics.latestUpdatedAt),
  };
}

function mapEvaluation(row) {
  return {
    ...row,
    evaluationDateLabel: formatDisplayDate(row.evaluationDate || row.createdAt),
  };
}

export async function getProgressManagedMembers() {
  const trainer = await resolveCurrentTrainer();
  if (!trainer?.trainer_id) {
    return { trainer: null, members: [] };
  }

  const data = await progressJson(`/api/progress/members?trainerId=${encodeURIComponent(trainer.trainer_id)}`);
  return {
    trainer,
    members: (data.members || []).map(mapMember),
  };
}

export async function getProgressForMember(memberId, trainerId) {
  if (!memberId || !trainerId) {
    return { member: null, bodyMetrics: null, history: [] };
  }

  const data = await progressJson(`/api/progress/member/${encodeURIComponent(memberId)}?trainerId=${encodeURIComponent(trainerId)}`);
  return {
    member: data.member ? mapMember(data.member) : null,
    bodyMetrics: mapBodyMetrics(data.bodyMetrics),
    bodyMetricsHistory: data.bodyMetricsHistory || [],
    history: (data.history || []).map(mapEvaluation),
  };
}

export async function saveProgressEvaluation(payload) {
  return progressJson("/api/progress", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProgressEvaluation(id, payload) {
  return progressJson(`/api/progress/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
