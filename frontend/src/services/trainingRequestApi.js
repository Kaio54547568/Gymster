import { supabase } from "./supabaseClient";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function getTrainingRequestStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    pending_pt_approval: "Pending Approval",
    accepted: "Accepted",
    approved: "Accepted",
    declined: "Declined",
    expired: "Expired",
    cancelled: "Cancelled",
    completed: "Completed",
  };

  return labels[normalized] || status || "Pending Approval";
}

function mapTrainingRequestRow(row) {
  if (!row) return null;

  return {
    requestId: getRequestId(row),
    id: getRequestId(row),
    type: "assignment",
    memberId: row.member_id,
    memberName: getMemberName(row),
    trainerId: row.trainer_id,
    trainerName: getTrainerName(row),
    packageId: row.package_id,
    packageName: row.packages?.package_name || "",
    requestedSchedule: row.requested_schedule,
    preferredSchedule: row.requested_schedule,
    status: row.status,
    statusLabel: getTrainingRequestStatusLabel(row.status),
    rawStatus: row.status,
    declineReason: row.decline_reason || "",
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
  return supabase
    .from("training_requests")
    .insert(payload)
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

  return query;
}

export async function createTrainingRequest(request) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create training request:", error);
    return { data: null, error };
  }

  const memberId = await resolveMemberId(request);
  const payload = {
    member_id: memberId,
    trainer_id: request.trainerId,
    package_id: request.packageId,
    member_package_id: request.memberPackageId || null,
    requested_schedule: request.requestedSchedule,
    status: "pending_pt_approval",
    decline_reason: "",
  };

  const { data, error } = await insertTrainingRequest(payload);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create training request:", error);
    return { data: null, error };
  }

  await createTrainerSelectionNotification(data);

  return { data: mapTrainingRequestRow(data), error: null };
}

export async function getTrainingRequestsForTrainer(trainerLookup) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainer training requests:", error);
    return { data: [], error };
  }

  const trainerId = await resolveTrainerIdFromLookup(trainerLookup);
  const { data, error } = await selectTrainingRequests({ trainerId });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainer training requests:", error);
    return { data: [], error };
  }

  return {
    data: Array.isArray(data) ? data.map(mapTrainingRequestRow) : [],
    error: null,
  };
}

export async function getTrainingRequestsForMember(memberLookup) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member training requests:", error);
    return { data: [], error };
  }

  const memberId = await resolveMemberIdFromLookup(memberLookup);
  if (!memberId) {
    return { data: [], error: null };
  }

  const { data, error } = await selectTrainingRequests({ memberId });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member training requests:", error);
    return { data: [], error };
  }

  return {
    data: Array.isArray(data) ? data.map(mapTrainingRequestRow) : [],
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
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update training request:", error);
    return { data: null, error };
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

  if (["accepted", "approved"].includes(String(status || "").toLowerCase())) {
    await createTrainerSelectionNotification(data);
  }

  return { data: mapTrainingRequestRow(data), error: null };
}
