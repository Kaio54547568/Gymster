import { supabase } from "./supabaseClient";
import { getAllowedLeaveDaysForPackage } from "./packageEntitlement";
import { getCurrentUser } from "./authService";
import { notifyPtPortalDataChanged } from "./notificationApi";
import { authenticatedJson } from "./authenticatedApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_PACKAGE_CHANGE_REQUESTS_KEY = "gymster_local_package_change_requests";
const LOCAL_PAYMENT_REQUESTS_KEY = "gymster_local_payment_requests";

const fallbackActivePackage = {
  memberPackageId: "local-member-package-member00",
  memberId: "00000000-0000-4000-8000-000000000005",
  packageId: "local-pt-3m",
  trainerId: "local-trainer-khoa",
  packageName: "PT Progress 3 Months",
  packageType: "pt",
  packagePrice: 4800000,
  packageDurationMonths: 3,
  packageSessionLimit: 24,
  maxLeaveDays: 6,
  hasPersonalTrainer: true,
  trainerName: "Khoa Le",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  usedSessions: 3,
  remainingSessions: 21,
  sessionsTotal: 24,
  status: "active",
  activatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  source: "local",
};

function isNoPackageDemoMember(user) {
  const email = String(user?.email || "").trim().toLowerCase();
  const username = String(user?.username || "").trim().toLowerCase();
  return [
    "newmember@gymster.local",
    "freshmember@gymster.local",
    "trialmember@gymster.local",
  ].includes(email) || ["newmember", "freshmember", "trialmember"].includes(username);
}

function readLocalPaymentRequests() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(LOCAL_PAYMENT_REQUESTS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function getApprovedLocalPaymentRequestForUser(user) {
  const userIds = [
    user?.id,
    user?.userId,
    user?.user_id,
    user?.memberId,
    user?.member_id,
  ].filter(Boolean).map((value) => String(value).toLowerCase());
  const email = String(user?.email || "").trim().toLowerCase();

  return readLocalPaymentRequests()
    .filter((request) => {
      const status = String(request.status || "").toLowerCase();
      const paymentStatus = String(request.paymentStatus || "").toLowerCase();
      const requestMemberId = String(request.memberId || "").toLowerCase();
      const requestEmail = String(request.memberEmail || "").trim().toLowerCase();
      const isApproved = status === "approved" || paymentStatus === "paid" || paymentStatus === "approved";
      const isSameUser = (email && requestEmail === email) || (requestMemberId && userIds.includes(requestMemberId));
      return isApproved && isSameUser;
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0] || null;
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + Number(months || 1));
  return nextDate;
}

function mapApprovedLocalPaymentToPackage(request, user) {
  if (!request) return null;

  const startDate = new Date(request.approvedAt || request.updatedAt || Date.now());
  const durationMonths = Number(request.packageDurationMonths || request.durationMonths || 1);
  const sessionTotal = request.remainingSessions ?? request.sessionLimit ?? request.sessionsTotal ?? null;

  return {
    memberPackageId: request.memberPackageId,
    memberId: request.memberId || user?.memberId || user?.member_id || user?.id,
    packageId: request.packageId,
    trainerId: request.trainerId || null,
    packageName: request.packageName || "Selected package",
    packageType: request.packageType || (request.trainerId ? "pt" : "standard"),
    packagePrice: Number(request.amount || 0),
    packageDurationMonths: durationMonths,
    durationMonths,
    packageSessionLimit: sessionTotal,
    maxLeaveDays: getAllowedLeaveDaysForPackage({ packageDurationMonths: durationMonths, durationMonths }),
    hasPersonalTrainer: Boolean(request.trainerId),
    trainerName: request.trainerName || "",
    startDate: startDate.toISOString().slice(0, 10),
    endDate: addMonths(startDate, durationMonths).toISOString().slice(0, 10),
    usedSessions: 0,
    remainingSessions: sessionTotal,
    sessionsTotal: sessionTotal,
    status: "active",
    activatedAt: request.approvedAt || request.updatedAt || new Date().toISOString(),
    createdAt: request.createdAt || new Date().toISOString(),
    source: "local",
  };
}

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
  sessions_per_week,
  status
`;

function mapMemberPackageRow(row, packageRow = null, trainerName = "") {
  if (!row) return null;
  const packageDurationMonths = packageRow?.duration_months ?? null;
  const packageInfo = {
    packageDurationMonths,
    durationMonths: packageDurationMonths,
  };

  return {
    memberPackageId: row.member_package_id,
    memberId: row.member_id,
    packageId: row.package_id,
    trainerId: row.trainer_id,
    packageName: packageRow?.package_name || "",
    packageType: packageRow?.package_type || "",
    packagePrice: packageRow?.price ? Number(packageRow.price) : null,
    packageDurationMonths,
    packageSessionLimit: packageRow?.session_limit ?? null,
    maxLeaveDays: getAllowedLeaveDaysForPackage(packageInfo),
    hasPersonalTrainer: Boolean(packageRow?.has_personal_trainer),
    trainerName,
    startDate: row.start_date,
    endDate: row.end_date,
    usedSessions: row.used_sessions ?? row.sessions_used ?? 0,
    remainingSessions: row.remaining_sessions ?? null,
    sessionsTotal: row.sessions_total ?? null,
    status: row.status,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    source: "supabase",
  };
}

function combineUserName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
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

  return null;
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
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create member package:", error);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function updateMemberPackageStatus(memberPackageId, status, extraUpdates = {}) {
  if (!supabase || !memberPackageId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or member package id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update member package:", error);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function updateMemberPackageTrainer(memberPackageId, trainerId) {
  if (!supabase || !memberPackageId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or member package id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update member package trainer:", error);
    return { data: null, error };
  }

  const { data: row, error } = await updateTargetMemberPackage(memberPackageId, { trainer_id: trainerId });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update member package trainer:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function getCurrentMemberPackage(memberId) {
  if (!supabase || !memberId) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or member id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load current member package:", error);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load current member package:", error);
    return { data: null, error };
  }

  return { data: mapMemberPackageRow(row), error: null };
}

export async function getMemberPackagesForUser(user) {
  if (!supabase) {
    const approvedPackage = mapApprovedLocalPaymentToPackage(getApprovedLocalPaymentRequestForUser(user), user);
    if (approvedPackage) {
      return {
        data: [approvedPackage],
        memberId: approvedPackage.memberId,
        error: null,
      };
    }

    if (isNoPackageDemoMember(user)) {
      return {
        data: [],
        memberId: user?.memberId || user?.member_id || user?.id || "00000000-0000-4000-8000-000000000099",
        error: null,
      };
    }

    return {
      data: [fallbackActivePackage],
      memberId: user?.memberId || user?.member_id || user?.id || fallbackActivePackage.memberId,
      error: null,
    };
  }

  const memberId = await resolveCurrentMemberId(user);

  if (!memberId || !uuidPattern.test(String(memberId))) {
    return { data: [], memberId: null, error: null };
  }

  await supabase.rpc("gymster_sync_member_package_lifecycle", { target_member_id: memberId });

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
      used_sessions,
      remaining_sessions,
      activated_at,
      created_at
    `)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member packages:", error);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load package details for member packages:", packageError);
    return { data: [], memberId, error: packageError };
  }
}

export async function getCurrentMemberPackageForUser(user) {
  const result = await getMemberPackagesForUser(user);
  if (result.error) {
    return { data: null, memberId: result.memberId, error: result.error };
  }

  const activePackage = result.data.find((item) => item.status === "active");
  const pendingPackage = result.data.find((item) => item.status === "pending_activation");

  return {
    data: activePackage || null,
    pendingPackage: pendingPackage || null,
    memberId: result.memberId,
    error: null,
  };
}

export function createPendingRenewalRequest(request) {
  console.error("[Gymster h\u1ec7 th\u1ed1ng] Renewal requests must be created with createPackageChangeRequest.", request);
  return null;
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
  const currentUser = getCurrentUser();
  const isMember = currentUser && String(currentUser.role || "").toLowerCase() === "member";

  if (!supabase) {
    if (isMember) {
      // 1. Check pending request in localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        const storedRows = JSON.parse(window.localStorage.getItem(LOCAL_PACKAGE_CHANGE_REQUESTS_KEY) || "[]");
        const hasPending = storedRows.some(row => row.memberId === request.memberId && row.status === "pending");
        if (hasPending) {
          return { data: null, error: new Error("Bạn đã có một yêu cầu đổi/gia hạn gói đang chờ xử lý.") };
        }
      }

    }

    const row = {
      requestId: `LOCAL-${Date.now()}`,
      memberId: request.memberId || request.memberEmail || "local-member",
      memberName: request.memberName || "Member",
      memberEmail: request.memberEmail || "",
      currentPackageName: request.currentPackageName || "No active package",
      packageId: request.packageId,
      packageName: request.packageName,
      amount: Number(request.amount || 0),
      paymentMethod: request.paymentMethod || "Not selected",
      requestType: request.requestType === "renewal" ? "renew" : request.requestType,
      status: "pending",
      createdAt: new Date().toISOString(),
      source: "local",
    };

    if (typeof window !== "undefined" && window.localStorage) {
      const storedRows = JSON.parse(window.localStorage.getItem(LOCAL_PACKAGE_CHANGE_REQUESTS_KEY) || "[]");
      window.localStorage.setItem(LOCAL_PACKAGE_CHANGE_REQUESTS_KEY, JSON.stringify([row, ...storedRows]));
    }

    return { data: row, error: null };
  }

  return authenticatedJson("/api/member/package-change-requests", {
    method: "POST",
    body: JSON.stringify({
      memberId: request.memberId,
      currentMemberPackageId: request.currentMemberPackageId || null,
      packageId: request.packageId,
      paymentMethod: request.paymentMethod || null,
      requestType: request.requestType,
    }),
  });

  const memberId = await resolveCurrentMemberId({
    memberId: request.memberId,
    member_id: request.memberId,
    email: request.memberEmail,
  });

  if (!memberId) {
    const error = new Error("Unable to resolve member id.");
    console.error("[Gymster hệ thống] Failed to create package change request:", error);
    return { data: null, error };
  }

  // Pre-emptive check on Supabase database to return nice error messages
  if (isMember) {
    // Check pending request
    const { data: pendingRequests, error: pendingError } = await supabase
      .from("package_change_requests")
      .select("package_change_request_id")
      .eq("member_id", memberId)
      .eq("status", "pending")
      .limit(1);

    if (!pendingError && pendingRequests && pendingRequests.length > 0) {
      return { data: null, error: new Error("Bạn đã có một yêu cầu đổi/gia hạn gói đang chờ xử lý.") };
    }

    // Check queued future packages
    const { data: queuedPackages, error: queuedError } = await supabase
      .from("member_packages")
      .select("member_package_id, status, start_date")
      .eq("member_id", memberId)
      .in("status", ["pending_payment", "pending_activation"]);

    if (!queuedError && queuedPackages) {
      const hasQueued = queuedPackages.length > 0;
      if (hasQueued) {
        return { data: null, error: new Error("You already have a package waiting for payment or activation. You cannot buy another package yet.") };
      }
    }

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
    console.error("[Gymster hệ thống] Failed to create package change request:", error);
    return { data: null, error };
  }

  const lookups = await loadPackageChangeLookups([data]);
  return { data: mapPackageChangeRequest(data, lookups.packageById, lookups.memberById), error: null };
}

export async function getPackageChangeRequests() {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load package change requests:", error);
    return { data: [], error };
  }

  const { data, error } = await supabase
    .from("package_change_requests")
    .select("*")
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load package change requests:", error);
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
    const error = new Error("Missing h\u1ec7 th\u1ed1ng configuration or request id.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update package change request:", error);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update package change request:", error);
    return { data: null, error };
  }

  const lookups = await loadPackageChangeLookups([data]);
  return { data: mapPackageChangeRequest(data, lookups.packageById, lookups.memberById), error: null };
}

export function getRenewalRequests() {
  return [];
}

export function updateRenewalRequestStatus(requestId, status, denyReason = "") {
  console.error("[Gymster h\u1ec7 th\u1ed1ng] Renewal request updates must use updatePackageChangeRequestStatus.", {
    requestId,
    status,
    denyReason,
  });
  return null;
}

export function approveRenewalRequest(requestId) {
  return updateRenewalRequestStatus(requestId, "approved");
}

export function denyRenewalRequest(requestId, denyReason = "Denied by staff.") {
  return updateRenewalRequestStatus(requestId, "denied", denyReason);
}

export function createManualRenewalRequest(request) {
  console.error("[Gymster hệ thống] Staff-created package requests must use createPackageChangeRequest.", request);
  return null;
}

export async function assignTrainerToMember(memberId, trainerId, notes = "Assigned during package selection") {
  if (!supabase || !memberId || !trainerId) {
    return { data: null, error: new Error("Missing database connection or parameters.") };
  }

  const { data, error } = await supabase
    .from("trainer_assignments")
    .insert({
      trainer_id: trainerId,
      member_id: memberId,
      status: "active",
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error("[Gymster hệ thống] Failed to create trainer assignment:", error);
    return { data: null, error };
  }

  notifyPtPortalDataChanged({
    reason: "trainer-assignment-created",
    trainerId,
    memberId,
    assignmentId: data?.trainer_assignment_id,
  });

  return { data, error: null };
}
