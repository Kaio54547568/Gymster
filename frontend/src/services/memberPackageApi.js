import { supabase } from "./supabaseClient";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEMBER_RENEWAL_REQUESTS_KEY = "gymster_member_renewal_requests";

const packageColumns = `
  package_id,
  package_code,
  package_name,
  package_type,
  duration_months,
  price,
  description,
  session_limit,
  has_personal_trainer,
  is_popular,
  status
`;

function mapMemberPackageRow(row, packageRow = null, trainerName = "") {
  if (!row) return null;

  return {
    memberPackageId: row.member_package_id,
    memberId: row.member_id,
    packageId: row.package_id,
    trainerId: row.trainer_id,
    packageName: packageRow?.package_name || "",
    packageType: packageRow?.package_type || "",
    packagePrice: packageRow?.price ? Number(packageRow.price) : null,
    packageDurationMonths: packageRow?.duration_months ?? null,
    packageSessionLimit: packageRow?.session_limit ?? null,
    hasPersonalTrainer: Boolean(packageRow?.has_personal_trainer),
    trainerName,
    startDate: row.start_date,
    endDate: row.end_date,
    usedSessions: row.used_sessions ?? row.sessions_used ?? 0,
    remainingSessions: row.remaining_sessions ?? null,
    sessionsTotal: row.sessions_total ?? null,
    status: row.status,
    activatedAt: row.activated_at,
    source: "supabase",
  };
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function combineUserName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function readRenewalRequests() {
  if (!canUseStorage()) return [];
  const stored = window.localStorage.getItem(MEMBER_RENEWAL_REQUESTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function writeRenewalRequests(requests) {
  if (canUseStorage()) {
    window.localStorage.setItem(MEMBER_RENEWAL_REQUESTS_KEY, JSON.stringify(requests));
  }
}

async function resolveMemberId(data) {
  if (data.memberId && uuidPattern.test(String(data.memberId))) {
    return data.memberId;
  }

  if (data.memberEmail) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", data.memberEmail)
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

  const { data: member } = await supabase
    .from("members")
    .select("member_id")
    .limit(1)
    .maybeSingle();

  return member?.member_id || data.memberId;
}

async function memberExists(memberId) {
  if (!memberId || !uuidPattern.test(String(memberId))) return null;

  const { data } = await supabase
    .from("members")
    .select("member_id")
    .eq("member_id", memberId)
    .maybeSingle();

  return data?.member_id || null;
}

async function findMemberIdByUserId(userId) {
  if (!userId || !uuidPattern.test(String(userId))) return null;

  const { data } = await supabase
    .from("members")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.member_id || null;
}

async function findMemberIdByUserField(field, value) {
  if (!value) return null;

  const { data: user } = await supabase
    .from("users")
    .select("user_id")
    .eq(field, value)
    .maybeSingle();

  if (!user?.user_id) return null;
  return findMemberIdByUserId(user.user_id);
}

async function findDemoMemberId() {
  const { data: users } = await supabase
    .from("users")
    .select("user_id")
    .eq("role", "member")
    .eq("account_status", "active")
    .order("created_at", { ascending: true })
    .limit(20);

  const userIds = Array.isArray(users) ? users.map((user) => user.user_id).filter(Boolean) : [];
  if (!userIds.length) return null;

  const { data: member } = await supabase
    .from("members")
    .select("member_id")
    .in("user_id", userIds)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (member?.member_id) {
    console.warn("Using demo fallback member because current mock user could not be resolved in Supabase.");
  }

  return member?.member_id || null;
}

export async function resolveCurrentMemberId(currentUser) {
  if (!supabase) return null;

  const directMemberId = currentUser?.memberId || currentUser?.member_id;
  const verifiedDirectMemberId = await memberExists(directMemberId);
  if (verifiedDirectMemberId) return verifiedDirectMemberId;

  const userId = currentUser?.userId || currentUser?.user_id;
  const memberIdFromUserId = await findMemberIdByUserId(userId);
  if (memberIdFromUserId) return memberIdFromUserId;

  const email = currentUser?.email ? String(currentUser.email).trim().toLowerCase() : "";
  const memberIdFromEmail = await findMemberIdByUserField("email", email);
  if (memberIdFromEmail) return memberIdFromEmail;

  const username = currentUser?.username ? String(currentUser.username).trim() : "";
  const memberIdFromUsername = await findMemberIdByUserField("username", username);
  if (memberIdFromUsername) return memberIdFromUsername;

  return findDemoMemberId();
}

async function loadPackagesById(packageIds) {
  const ids = [...new Set(packageIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("packages")
    .select(packageColumns)
    .in("package_id", ids);

  if (error) throw error;

  return Object.fromEntries((data || []).map((pkg) => [pkg.package_id, pkg]));
}

async function getTrainerName(trainerId) {
  if (!trainerId) return "";

  const { data: trainer } = await supabase
    .from("trainers")
    .select("trainer_code, user_id, employee_id")
    .eq("trainer_id", trainerId)
    .maybeSingle();

  if (!trainer) return "";

  if (trainer.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("user_id", trainer.user_id)
      .maybeSingle();

    const userName = combineUserName(user, "");
    if (userName) return userName;
  }

  if (trainer.employee_id) {
    const { data: employee } = await supabase
      .from("employees")
      .select("full_name")
      .eq("employee_id", trainer.employee_id)
      .maybeSingle();

    if (employee?.full_name) return employee.full_name;
  }

  return trainer.trainer_code || "";
}

async function insertTargetMemberPackage(payload) {
  return supabase
    .from("member_packages")
    .insert({
      member_id: payload.member_id,
      package_id: payload.package_id,
      trainer_id: payload.trainer_id,
      status: payload.status,
      used_sessions: payload.used_sessions,
      remaining_sessions: payload.remaining_sessions,
    })
    .select("*")
    .single();
}

async function insertCurrentSchemaMemberPackage(payload) {
  return supabase
    .from("member_packages")
    .insert({
      member_id: payload.member_id,
      package_id: payload.package_id,
      trainer_id: payload.trainer_id,
      status: payload.status === "pending_pt_approval" ? "pending_payment" : payload.status,
      sessions_total: payload.remaining_sessions,
      sessions_used: payload.used_sessions,
    })
    .select("*")
    .single();
}

async function updateTargetMemberPackage(memberPackageId, updates) {
  return supabase
    .from("member_packages")
    .update(updates)
    .eq("member_package_id", memberPackageId)
    .select("*")
    .single();
}

function toCurrentSchemaUpdates(updates) {
  const currentUpdates = { ...updates };

  if (currentUpdates.status === "pending_pt_approval") {
    currentUpdates.status = "pending_payment";
  }

  if ("used_sessions" in currentUpdates) {
    currentUpdates.sessions_used = currentUpdates.used_sessions;
    delete currentUpdates.used_sessions;
  }

  if ("remaining_sessions" in currentUpdates) {
    currentUpdates.sessions_total = currentUpdates.remaining_sessions;
    delete currentUpdates.remaining_sessions;
  }

  return currentUpdates;
}

export async function createMemberPackage(data) {
  if (!supabase) {
    const error = new Error("Missing Supabase environment variables.");
    console.error("[Gymster Supabase] Failed to create member package:", error);
    return { data: null, error };
  }

  const memberId = await resolveMemberId(data);
  const payload = {
    member_id: memberId,
    package_id: data.packageId,
    trainer_id: data.trainerId || null,
    status: data.status,
    used_sessions: 0,
    remaining_sessions: data.remainingSessions ?? null,
  };

  let { data: row, error } = await insertTargetMemberPackage(payload);

  if (error) {
    ({ data: row, error } = await insertCurrentSchemaMemberPackage(payload));
  }

  if (error) {
    console.error("[Gymster Supabase] Failed to create member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function updateMemberPackageStatus(memberPackageId, status, extraUpdates = {}) {
  if (!supabase || !memberPackageId) {
    const error = new Error("Missing Supabase configuration or member package id.");
    console.error("[Gymster Supabase] Failed to update member package:", error);
    return { data: null, error };
  }

  const updates = {
    ...extraUpdates,
    status,
  };

  let { data: row, error } = await updateTargetMemberPackage(memberPackageId, updates);

  if (error) {
    ({ data: row, error } = await updateTargetMemberPackage(memberPackageId, toCurrentSchemaUpdates(updates)));
  }

  if (error) {
    console.error("[Gymster Supabase] Failed to update member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function updateMemberPackageTrainer(memberPackageId, trainerId) {
  if (!supabase || !memberPackageId) {
    const error = new Error("Missing Supabase configuration or member package id.");
    console.error("[Gymster Supabase] Failed to update member package trainer:", error);
    return { data: null, error };
  }

  const { data: row, error } = await updateTargetMemberPackage(memberPackageId, { trainer_id: trainerId });

  if (error) {
    console.error("[Gymster Supabase] Failed to update member package trainer:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function getCurrentMemberPackage(memberId) {
  if (!supabase || !memberId) {
    const error = new Error("Missing Supabase configuration or member id.");
    console.error("[Gymster Supabase] Failed to load current member package:", error);
    return { data: null, error };
  }

  const { data: row, error } = await supabase
    .from("member_packages")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Gymster Supabase] Failed to load current member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function getMemberPackagesForUser(user) {
  if (!supabase) {
    const error = new Error("Missing Supabase configuration.");
    console.error("[Gymster Supabase] Failed to load member packages:", error);
    return { data: [], memberId: null, error };
  }

  const memberId = await resolveCurrentMemberId(user);

  if (!memberId || !uuidPattern.test(String(memberId))) {
    return { data: [], memberId: null, error: null };
  }

  const { data: rows, error } = await supabase
    .from("member_packages")
    .select(`
      member_package_id,
      member_id,
      package_id,
      trainer_id,
      status,
      start_date,
      end_date,
      sessions_total,
      sessions_used,
      activated_at,
      created_at
    `)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[Gymster Supabase] Failed to load member packages:", error);
    return { data: [], memberId, error };
  }

  try {
    const packagesById = await loadPackagesById((rows || []).map((row) => row.package_id));
    const mappedRows = [];

    for (const row of rows || []) {
      mappedRows.push(mapMemberPackageRow(row, packagesById[row.package_id] || null, await getTrainerName(row.trainer_id)));
    }

    return { data: mappedRows, memberId, error: null };
  } catch (packageError) {
    console.error("[Gymster Supabase] Failed to load package details for member packages:", packageError);
    return { data: [], memberId, error: packageError };
  }
}

export async function getCurrentMemberPackageForUser(user) {
  const result = await getMemberPackagesForUser(user);
  if (result.error) {
    return { data: null, memberId: result.memberId, error: result.error };
  }

  const activePackage = result.data.find((item) => item.status === "active");
  const fallbackPackage = result.data[0] || null;

  return { data: activePackage || fallbackPackage, memberId: result.memberId, error: null };
}

export function createPendingRenewalRequest(request) {
  // Temporary MVP fallback until the database adds a dedicated renewal_requests table.
  const nextRequest = {
    requestId: `REN-${Date.now()}`,
    status: "pending_staff_approval",
    createdAt: new Date().toISOString(),
    ...request,
  };
  writeRenewalRequests([nextRequest, ...readRenewalRequests()]);
  return nextRequest;
}

function mapPackageChangeRequest(row, packageById = {}, memberById = {}) {
  if (!row) return null;
  const requestedPackage = packageById[row.requested_package_id] || {};
  const member = memberById[row.member_id] || {};

  return {
    requestId: row.package_change_request_id,
    memberId: row.member_id,
    memberName: member.fullName || member.memberCode || "Member",
    memberEmail: member.email || "",
    currentMemberPackageId: row.current_member_package_id,
    currentPackageName: member.currentPackageName || "Current package not linked",
    packageId: row.requested_package_id,
    packageName: requestedPackage.package_name || "Requested package",
    amount: Number(row.amount || requestedPackage.price || 0),
    paymentMethod: row.payment_method || "Not selected",
    requestType: row.request_type,
    status: row.status,
    createdAt: row.requested_at || row.created_at,
    reviewedAt: row.reviewed_at,
    denyReason: row.deny_reason,
    source: "supabase",
  };
}

async function loadPackageChangeLookups(rows) {
  const packageIds = [...new Set((rows || []).map((row) => row.requested_package_id).filter(Boolean))];
  const memberIds = [...new Set((rows || []).map((row) => row.member_id).filter(Boolean))];
  let packageById = {};
  let memberById = {};

  if (packageIds.length) {
    const { data } = await supabase
      .from("packages")
      .select("package_id, package_name, price")
      .in("package_id", packageIds);
    packageById = Object.fromEntries((data || []).map((pkg) => [pkg.package_id, pkg]));
  }

  if (memberIds.length) {
    const { data: members } = await supabase
      .from("members")
      .select("member_id, member_code, user_id")
      .in("member_id", memberIds);
    const userIds = [...new Set((members || []).map((member) => member.user_id).filter(Boolean))];
    let userById = {};

    if (userIds.length) {
      const { data: users } = await supabase
        .from("users")
        .select("user_id, first_name, last_name, email")
        .in("user_id", userIds);
      userById = Object.fromEntries((users || []).map((user) => [user.user_id, user]));
    }

    memberById = Object.fromEntries((members || []).map((member) => {
      const user = userById[member.user_id] || {};
      return [member.member_id, {
        memberCode: member.member_code,
        fullName: combineUserName(user, ""),
        email: user.email,
      }];
    }));
  }

  return { packageById, memberById };
}

export async function createPackageChangeRequest(request) {
  if (!supabase) {
    const error = new Error("Missing Supabase configuration.");
    console.error("[Gymster Supabase] Failed to create package change request:", error);
    return { data: null, error };
  }

  const memberId = await resolveCurrentMemberId({
    memberId: request.memberId,
    member_id: request.memberId,
    email: request.memberEmail,
  });

  if (!memberId) {
    const error = new Error("Unable to resolve member id.");
    console.error("[Gymster Supabase] Failed to create package change request:", error);
    return { data: null, error };
  }

  const payload = {
    member_id: memberId,
    current_member_package_id: uuidPattern.test(String(request.currentMemberPackageId || "")) ? request.currentMemberPackageId : null,
    requested_package_id: request.packageId,
    request_type: request.requestType === "renewal" ? "renew" : request.requestType,
    amount: Number(request.amount || 0),
    payment_method: request.paymentMethod || null,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("package_change_requests")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[Gymster Supabase] Failed to create package change request:", error);
    return { data: null, error };
  }

  const lookups = await loadPackageChangeLookups([data]);
  return { data: mapPackageChangeRequest(data, lookups.packageById, lookups.memberById), error: null };
}

export async function getPackageChangeRequests() {
  if (!supabase) {
    const error = new Error("Missing Supabase configuration.");
    console.error("[Gymster Supabase] Failed to load package change requests:", error);
    return { data: [], error };
  }

  const { data, error } = await supabase
    .from("package_change_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("[Gymster Supabase] Failed to load package change requests:", error);
    return { data: [], error };
  }

  const lookups = await loadPackageChangeLookups(data || []);
  return {
    data: (data || []).map((row) => mapPackageChangeRequest(row, lookups.packageById, lookups.memberById)),
    error: null,
  };
}

export async function updatePackageChangeRequestStatus(requestId, status, denyReason = "") {
  if (!supabase || !requestId) {
    const error = new Error("Missing Supabase configuration or request id.");
    console.error("[Gymster Supabase] Failed to update package change request:", error);
    return { data: null, error };
  }

  const payload = {
    status,
    deny_reason: denyReason || null,
    reviewed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("package_change_requests")
    .update(payload)
    .eq("package_change_request_id", requestId)
    .select("*")
    .single();

  if (error) {
    console.error("[Gymster Supabase] Failed to update package change request:", error);
    return { data: null, error };
  }

  const lookups = await loadPackageChangeLookups([data]);
  return { data: mapPackageChangeRequest(data, lookups.packageById, lookups.memberById), error: null };
}

export function getRenewalRequests() {
  return readRenewalRequests();
}

export function updateRenewalRequestStatus(requestId, status, denyReason = "") {
  const updatedRequests = readRenewalRequests().map((request) => {
    if (request.requestId !== requestId) return request;

    return {
      ...request,
      status,
      denyReason,
      reviewedAt: new Date().toISOString(),
    };
  });

  writeRenewalRequests(updatedRequests);
  return updatedRequests.find((request) => request.requestId === requestId) || null;
}

export function approveRenewalRequest(requestId) {
  // Temporary MVP fallback until the database adds a dedicated renewal_requests table.
  return updateRenewalRequestStatus(requestId, "approved");
}

export function denyRenewalRequest(requestId, denyReason = "Denied by staff.") {
  // Temporary MVP fallback until the database adds a dedicated renewal_requests table.
  return updateRenewalRequestStatus(requestId, "denied", denyReason);
}

export function createManualRenewalRequest(request) {
  // Temporary MVP fallback for staff-created renewal actions.
  const nextRequest = {
    requestId: `STAFF-REN-${Date.now()}`,
    status: "approved",
    source: "staff_manual",
    createdAt: new Date().toISOString(),
    ...request,
  };

  writeRenewalRequests([nextRequest, ...readRenewalRequests()]);
  return nextRequest;
}
