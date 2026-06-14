import { supabase } from "./supabaseClient";
import { getCurrentUser, isPasswordMatch } from "./authService";
import { createPayment } from "./paymentApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const usernamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/;

function combineName(row, fallback = "User") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return name || row?.full_name || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toDisplayStatus(status, endDate) {
  const normalized = String(status || "").toLowerCase();
  if (["inactive", "suspended", "cancelled", "disabled"].includes(normalized)) return "Disabled";
  if (endDate && new Date(endDate) < new Date()) return "Expired";
  if (normalized === "expired") return "Expired";
  return "Active";
}

function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function fetchUsersByIds(userIds) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("users")
    .select("user_id,email,username,password_hash,first_name,last_name,phone_number,date_of_birth,gender,account_status,role")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((user) => [user.user_id, user]));
}

async function fetchPackagesByIds(packageIds) {
  const ids = [...new Set(packageIds.filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("packages")
    .select("package_id,package_name,package_type,duration_months,price,session_limit,has_personal_trainer,sessions_per_week,status,is_active")
    .in("package_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((pkg) => [pkg.package_id, pkg]));
}

async function fetchLatestMemberPackages(memberIds) {
  const ids = [...new Set(memberIds.filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("member_packages")
    .select("member_package_id,member_id,package_id,status,start_date,end_date,sessions_used,sessions_total,used_sessions,remaining_sessions,created_at")
    .in("member_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const byMember = {};
  (data || []).forEach((row) => {
    if (!byMember[row.member_id]) byMember[row.member_id] = row;
    if (row.status === "active") byMember[row.member_id] = row;
  });
  return byMember;
}

async function resolveCurrentStaffUser() {
  const currentUser = getCurrentUser();
  const userId = currentUser?.userId || currentUser?.user_id;
  if (userId) {
    const { data } = await supabase.from("users").select("*").eq("user_id", userId).maybeSingle();
    if (data) return data;
  }
  const email = currentUser?.email ? String(currentUser.email).toLowerCase() : "";
  if (email) {
    const { data } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (data) return data;
  }
  const username = currentUser?.username ? String(currentUser.username) : "";
  if (username) {
    const { data } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function getStaffMembers() {
  if (!supabase) return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  try {
    const { data: members, error } = await supabase
      .from("members")
      .select("member_id,user_id,member_code,full_name,phone_number,date_of_birth,gender,status,join_date,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const usersById = await fetchUsersByIds((members || []).map((member) => member.user_id));
    const packagesByMember = await fetchLatestMemberPackages((members || []).map((member) => member.member_id));
    const packagesById = await fetchPackagesByIds(Object.values(packagesByMember).map((row) => row.package_id));

    const mapped = (members || []).map((member) => {
      const user = usersById[member.user_id] || {};
      const memberPackage = packagesByMember[member.member_id] || {};
      const pkg = packagesById[memberPackage.package_id] || {};
      const fullName = combineName(user, member.full_name || member.member_code || "Member");
      return {
        memberUuid: member.member_id,
        memberId: member.member_code || member.member_id,
        userId: member.user_id,
        fullName,
        firstName: user.first_name || splitName(fullName).firstName,
        lastName: user.last_name || splitName(fullName).lastName,
        email: user.email || "",
        phoneNum: user.phone_number || member.phone_number || "",
        citizenId: member.member_code || "-",
        status: toDisplayStatus(user.account_status || member.status, memberPackage.end_date),
        rawStatus: member.status || user.account_status || "",
        currentPackageId: memberPackage.package_id || "",
        currentPackage: pkg.package_name || "No package",
        expirationDate: memberPackage.end_date || "",
        dateOfBirth: user.date_of_birth || member.date_of_birth || "",
        gender: user.gender || member.gender || "unspecified",
      };
    });

    return { data: mapped, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load staff member list:", error);
    return { data: [], error };
  }
}

export async function updateStaffMember(memberId, updates) {
  if (!supabase) return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("member_id,user_id")
    .eq("member_id", memberId)
    .maybeSingle();
  if (memberError || !member?.user_id) return { ok: false, message: "Member could not be resolved." };

  const { error: userError } = await supabase
    .from("users")
    .update({
      first_name: String(updates.firstName || "").trim(),
      last_name: String(updates.lastName || "").trim(),
      phone_number: String(updates.phoneNum || "").trim(),
      date_of_birth: updates.dateOfBirth || null,
      gender: updates.gender || "unspecified",
    })
    .eq("user_id", member.user_id);
  if (userError) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update member user:", userError);
    return { ok: false, message: "Member could not be updated." };
  }

  await supabase
    .from("members")
    .update({
      full_name: [updates.firstName, updates.lastName].filter(Boolean).join(" ").trim(),
      phone_number: String(updates.phoneNum || "").trim(),
      date_of_birth: updates.dateOfBirth || null,
      gender: updates.gender || "unspecified",
    })
    .eq("member_id", member.member_id);

  return { ok: true, message: "Member updated." };
}

export async function disableStaffMember(memberId, staffPassword) {
  if (!supabase) return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  const staffUser = await resolveCurrentStaffUser();
  const storedPassword = staffUser?.password_hash || "";
  if (!isPasswordMatch(storedPassword, staffPassword)) {
    return { ok: false, message: "Staff password is incorrect." };
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("member_id,user_id")
    .eq("member_id", memberId)
    .maybeSingle();
  if (memberError || !member?.user_id) return { ok: false, message: "Member could not be resolved." };

  const { error: userError } = await supabase
    .from("users")
    .update({ account_status: "inactive" })
    .eq("user_id", member.user_id);
  const { error: memberUpdateError } = await supabase
    .from("members")
    .update({ status: "inactive" })
    .eq("member_id", member.member_id);

  if (userError || memberUpdateError) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to disable member:", userError || memberUpdateError);
    return { ok: false, message: "Member could not be disabled." };
  }
  return { ok: true, message: "Member disabled." };
}

function addMonthsToDate(dateValue, months) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  date.setMonth(date.getMonth() + Number(months || 0));
  if (date.getDate() !== day) date.setDate(0);
  return date.toISOString().slice(0, 10);
}

async function fetchPackageById(packageId) {
  if (!packageId || !uuidPattern.test(String(packageId))) return null;
  const { data, error } = await supabase
    .from("packages")
    .select("package_id,package_name,duration_months,price,session_limit,sessions_per_week,status,is_active")
    .eq("package_id", packageId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function renewStaffMemberPackage(form) {
  if (!supabase) return { ok: false, message: "Hệ thống chưa được cấu hình." };

  try {
    const memberId = form.memberId;
    const packageId = form.packageId;
    const durationMonths = Number(form.durationMonths || 0);
    const startDate = form.startDate;
    const endDate = form.endDate || addMonthsToDate(startDate, durationMonths);
    const amount = Number(form.amount || 0);
    const paymentMethod = form.paymentMethod || "cash";

    if (!memberId || !uuidPattern.test(String(memberId))) {
      return { ok: false, message: "Không xác định được hội viên." };
    }
    if (!packageId || !uuidPattern.test(String(packageId))) {
      return { ok: false, message: "Vui lòng chọn gói tập hợp lệ." };
    }
    if (!durationMonths || !startDate || !endDate || amount < 0 || !paymentMethod) {
      return { ok: false, message: "Vui lòng nhập đầy đủ thông tin gia hạn." };
    }

    const pkg = await fetchPackageById(packageId);
    const latestPackage = await fetchLatestActivePackage(memberId);
    const memberPackagePayload = {
      member_id: memberId,
      package_id: packageId,
      status: "active",
      start_date: startDate,
      end_date: endDate,
      sessions_total: pkg?.session_limit ?? latestPackage?.sessions_total ?? null,
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let memberPackageId = latestPackage?.member_package_id || "";
    let packageError = null;

    if (memberPackageId) {
      const { error } = await supabase
        .from("member_packages")
        .update(memberPackagePayload)
        .eq("member_package_id", memberPackageId);
      packageError = error;
    } else {
      const { data, error } = await supabase
        .from("member_packages")
        .insert(memberPackagePayload)
        .select("member_package_id")
        .single();
      packageError = error;
      memberPackageId = data?.member_package_id || "";
    }

    if (packageError) throw packageError;

    const paymentResult = await createPayment({
      memberId,
      packageId,
      memberPackageId,
      amount,
      paymentMethod,
      paymentDate: new Date().toISOString(),
      transactionCode: `RENEW-${Date.now()}`,
      transferContent: form.note || "Staff package renewal",
    });

    if (paymentResult.error) {
      console.warn("[Gymster hệ thống] Package renewed but payment history could not be created:", paymentResult.error);
    }

    await supabase
      .from("members")
      .update({ status: "active" })
      .eq("member_id", memberId);

    return {
      ok: true,
      message: "Gia hạn gói thành công.",
      data: {
        memberPackageId,
        packageId,
        packageName: pkg?.package_name || form.packageName || "Membership package",
        endDate,
        amount,
      },
    };
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to renew staff member package:", error);
    return { ok: false, message: "Không thể gia hạn gói tập. Vui lòng thử lại." };
  }
}

async function fetchLatestActivePackage(memberId) {
  const { data, error } = await supabase
    .from("member_packages")
    .select("member_package_id,member_id,package_id,status,end_date,sessions_total,sessions_used,used_sessions,remaining_sessions,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).find((item) => item.status === "active") || data?.[0] || null;
}

function getCheckInBounds(value = new Date()) {
  const base = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  const start = Number.isNaN(base.getTime()) ? new Date() : base;
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function getStaffCheckInsForDate(dateValue) {
  if (!supabase) return { data: [], error: new Error("Hệ thống chưa được cấu hình.") };

  try {
    const { start, end } = getCheckInBounds(dateValue);
    const { data, error } = await supabase
      .from("member_usage_history")
      .select("*")
      .eq("usage_type", "check_in")
      .gte("usage_date", start.toISOString())
      .lt("usage_date", end.toISOString())
      .order("usage_date", { ascending: false });

    if (error) throw error;

    return {
      data: (data || []).map((row) => ({
        id: row.usage_id || row.history_id || row.id,
        memberId: row.member_id,
        memberPackageId: row.member_package_id,
        usageType: row.usage_type,
        usageDate: row.usage_date,
        description: row.description || "",
        createdAt: row.created_at,
      })),
      error: null,
    };
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to load staff check-ins:", error);
    return { data: [], error };
  }
}

export async function checkInStaffMember(memberId, dateValue = new Date()) {
  if (!supabase) return { ok: false, code: "system_not_configured", message: "Hệ thống chưa được cấu hình." };

  try {
    const memberPackage = await fetchLatestActivePackage(memberId);
    const { start, end } = getCheckInBounds(dateValue);
    const checkInAt = new Date(start);
    checkInAt.setHours(12, 0, 0, 0);
    const today = new Date();
    const endDate = memberPackage?.end_date ? new Date(memberPackage.end_date) : null;

    if (!memberPackage || memberPackage.status !== "active" || (endDate && endDate < today)) {
      return { ok: false, code: "no_active_package", message: "Hội viên chưa có gói tập còn hiệu lực để check-in." };
    }

    const { data: existing, error: existingError } = await supabase
      .from("member_usage_history")
      .select("usage_id,history_id,id")
      .eq("member_id", memberId)
      .eq("usage_type", "check_in")
      .gte("usage_date", start.toISOString())
      .lt("usage_date", end.toISOString())
      .limit(1);
    if (existingError) throw existingError;

    if (existing?.length) {
      return { ok: true, alreadyChecked: true, code: "already_checked", message: "Hội viên đã được check-in trong ngày này." };
    }

    const { error: historyError } = await supabase.from("member_usage_history").insert({
      member_id: memberId,
      member_package_id: memberPackage.member_package_id,
      usage_type: "check_in",
      usage_date: checkInAt.toISOString(),
      description: "Staff check-in tại phòng tập.",
    });
    if (historyError) throw historyError;

    const currentUsed = Number(memberPackage.used_sessions ?? memberPackage.sessions_used ?? 0);
    const nextUsed = currentUsed + 1;
    const currentRemaining = memberPackage.remaining_sessions;
    const updatePayload = {
      used_sessions: nextUsed,
      sessions_used: nextUsed,
      remaining_sessions: Number.isFinite(Number(currentRemaining)) ? Math.max(0, Number(currentRemaining) - 1) : currentRemaining,
    };

    const { error: updateError } = await supabase
      .from("member_packages")
      .update(updatePayload)
      .eq("member_package_id", memberPackage.member_package_id);

    if (updateError) {
      const { error: fallbackError } = await supabase
        .from("member_packages")
        .update({ sessions_used: nextUsed })
        .eq("member_package_id", memberPackage.member_package_id);
      if (fallbackError) throw fallbackError;
    }

    return { ok: true, code: "check_in_success", message: "Check-in thành công. Lịch sử và số buổi tập đã được cập nhật." };
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to check in member:", error);
    return { ok: false, code: "check_in_failed", message: "Không thể check-in hội viên." };
  }
}

export async function createStaffMember(form) {
  if (!supabase) return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };

  try {
    const nameParts = splitName(form.fullName);
    const email = form.email || `${String(form.phoneNumber || Date.now()).replace(/\D/g, "")}@gymster.local`;
    const username = String(form.username || `member_${String(form.phoneNumber || Date.now()).replace(/\D/g, "")}`).trim();

    if (!usernamePattern.test(username)) {
      return {
        ok: false,
        message: "Username must be 6-30 characters, use only A-Z, a-z, 0-9, _, ., -, and cannot start or end with _, ., or -.",
      };
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        username,
        password_hash: form.password || "",
        first_name: nameParts.firstName || form.fullName,
        last_name: nameParts.lastName || "",
        phone_number: form.phoneNumber || "",
        date_of_birth: form.dateOfBirth || null,
        gender: form.gender || "unspecified",
        role: "member",
        account_status: "pending_payment",
        headline: form.note || "",
      })
      .select("user_id")
      .single();
    if (userError) throw userError;

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        user_id: user.user_id,
        member_code: form.idCard || `MB-${Date.now()}`,
        full_name: form.fullName,
        phone_number: form.phoneNumber || "",
        date_of_birth: form.dateOfBirth || null,
        gender: form.gender || "unspecified",
        health_notes: form.note || "",
        join_date: new Date().toISOString().slice(0, 10),
        status: "pending_payment",
      })
      .select("member_id")
      .single();
    if (memberError) throw memberError;

    if (form.trainerId && uuidPattern.test(String(form.trainerId))) {
      await supabase.from("trainer_assignments").insert({
        trainer_id: form.trainerId,
        member_id: member.member_id,
        status: "active",
        notes: "Assigned by staff during member creation.",
      });
    }

    return { ok: true, message: "Member created in h\u1ec7 th\u1ed1ng.", memberId: member.member_id };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create staff member:", error);
    return { ok: false, message: "Member could not be created in h\u1ec7 th\u1ed1ng." };
  }
}

export async function getStaffUsageHistory() {
  if (!supabase) return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  try {
    const { data: rows, error } = await supabase
      .from("member_usage_history")
      .select("member_usage_history_id,member_id,workout_session_id,usage_type,usage_date,description,created_at")
      .order("usage_date", { ascending: false })
      .limit(200);
    if (error) throw error;

    const memberIds = (rows || []).map((row) => row.member_id);
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("member_id,user_id,member_code,full_name,phone_number")
      .in("member_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
    if (membersError) throw membersError;

    const usersById = await fetchUsersByIds((members || []).map((member) => member.user_id));
    const membersById = Object.fromEntries((members || []).map((member) => [member.member_id, member]));
    const mapped = (rows || []).map((row) => {
      const member = membersById[row.member_id] || {};
      const user = usersById[member.user_id] || {};
      const usageDate = new Date(row.usage_date || row.created_at);
      return {
        historyId: row.member_usage_history_id,
        memberId: member.member_code || row.member_id,
        memberName: combineName(user, member.full_name || "Member"),
        phoneNum: user.phone_number || member.phone_number || "",
        usageDate: formatDate(row.usage_date || row.created_at),
        usageTime: Number.isNaN(usageDate.getTime()) ? "" : usageDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        serviceType: row.usage_type || "Gym Floor",
        trainerName: "Self-training",
        note: row.description || "",
      };
    });
    return { data: mapped, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load staff usage history:", error);
    return { data: [], error };
  }
}

function mapFeedbackStatus(status, kind) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "resolved" || normalized === "closed") return "Resolved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "in_review" || normalized === "in_progress") return "In Review";
  return kind === "Complaint" && normalized === "open" ? "Submitted" : "Submitted";
}

function toDbFeedbackStatus(status, kind) {
  if (status === "Resolved") return kind === "Complaint" ? "resolved" : "resolved";
  if (status === "Rejected") return "rejected";
  if (status === "In Review") return "in_review";
  return kind === "Complaint" ? "open" : "submitted";
}

export async function getStaffFeedbackItems() {
  if (!supabase) return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  try {
    const [{ data: feedbackRows, error: feedbackError }, { data: complaintRows, error: complaintError }] = await Promise.all([
      supabase.from("service_feedback").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (feedbackError) throw feedbackError;
    if (complaintError) throw complaintError;

    const memberIds = [...(feedbackRows || []).map((row) => row.member_id), ...(complaintRows || []).map((row) => row.member_id)].filter(Boolean);
    const { data: members } = await supabase
      .from("members")
      .select("member_id,user_id,member_code,full_name")
      .in("member_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);
    const usersById = await fetchUsersByIds((members || []).map((member) => member.user_id));
    const membersById = Object.fromEntries((members || []).map((member) => [member.member_id, member]));
    const memberName = (memberId) => {
      const member = membersById[memberId] || {};
      return {
        id: member.member_code || memberId || "-",
        name: combineName(usersById[member.user_id], member.full_name || "Member"),
      };
    };

    const feedbackItems = (feedbackRows || []).map((row) => {
      const member = memberName(row.member_id);
      return {
        feedbackId: row.feedback_id,
        sourceId: row.feedback_id,
        sourceTable: "service_feedback",
        kind: "Feedback",
        memberId: member.id,
        memberName: member.name,
        category: row.target_type || "service",
        target: row.target_type || "service",
        content: row.comment || "",
        date: formatDate(row.created_at),
        status: mapFeedbackStatus(row.status, "Feedback"),
        priority: row.rating <= 2 ? "High" : row.rating === 3 ? "Medium" : "Low",
        response: row.staff_response || "",
      };
    });

    const complaintItems = (complaintRows || []).map((row) => {
      const member = memberName(row.member_id);
      return {
        feedbackId: row.complaint_id,
        sourceId: row.complaint_id,
        sourceTable: "complaints",
        kind: "Complaint",
        memberId: member.id,
        memberName: member.name,
        category: row.complaint_type || "service",
        target: row.title || row.complaint_type || "Complaint",
        content: row.description || row.title || "",
        date: formatDate(row.created_at),
        status: mapFeedbackStatus(row.status, "Complaint"),
        priority: row.priority ? row.priority[0].toUpperCase() + row.priority.slice(1) : "Medium",
        response: row.resolution_note || "",
      };
    });

    return { data: [...feedbackItems, ...complaintItems], error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load staff feedback:", error);
    return { data: [], error };
  }
}

export async function updateStaffFeedbackItem(item) {
  if (!supabase) return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  const status = toDbFeedbackStatus(item.status, item.kind);
  const payload = item.sourceTable === "complaints"
    ? { status, resolution_note: item.response || "", resolved_at: item.status === "Resolved" ? new Date().toISOString() : null }
    : { status, staff_response: item.response || "", responded_at: new Date().toISOString() };
  const { error } = await supabase.from(item.sourceTable).update(payload).eq(item.sourceTable === "complaints" ? "complaint_id" : "feedback_id", item.sourceId);
  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update feedback:", error);
    return { ok: false, message: "Feedback could not be updated." };
  }
  return { ok: true, message: "Feedback updated." };
}

function mapEquipmentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "broken") return "Broken";
  if (normalized === "under_maintenance") return "Under Maintenance";
  if (normalized === "retired") return "Replaced";
  return "Active";
}

export async function getStaffEquipmentStatus() {
  if (!supabase) return { data: { equipment: [], reports: [] }, error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  try {
    const [{ data: equipmentRows, error: equipmentError }, { data: roomRows, error: roomError }, { data: reportRows, error: reportError }] = await Promise.all([
      supabase.from("equipment").select("*").order("equipment_code", { ascending: true }),
      supabase.from("rooms").select("room_id,room_name"),
      supabase.from("maintenance_reports").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (equipmentError) throw equipmentError;
    if (roomError) throw roomError;
    if (reportError) throw reportError;

    const roomsById = Object.fromEntries((roomRows || []).map((room) => [room.room_id, room.room_name]));
    const equipmentById = Object.fromEntries((equipmentRows || []).map((item) => [item.equipment_id, item]));
    const equipment = (equipmentRows || []).map((item) => ({
      equipmentUuid: item.equipment_id,
      equipmentId: item.equipment_code || item.equipment_id,
      equipmentName: item.equipment_name,
      room: roomsById[item.room_id] || "Unassigned",
      roomId: item.room_id || "",
      status: mapEquipmentStatus(item.status),
      lastMaintenance: item.last_maintenance_date || "",
    }));
    const reports = (reportRows || []).map((report) => {
      const item = equipmentById[report.equipment_id] || {};
      return {
        id: report.maintenance_report_id,
        equipmentUuid: report.equipment_id || "",
        equipmentName: item.equipment_name || report.issue_title || "Equipment",
        room: roomsById[report.room_id] || roomsById[item.room_id] || "Unassigned",
        issueDescription: report.issue_description || report.issue_title || "",
        priority: report.priority || "medium",
        status: report.status || "submitted",
        createdAt: report.created_at || "",
      };
    });
    return { data: { equipment, reports }, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load staff equipment status:", error);
    return { data: { equipment: [], reports: [] }, error };
  }
}

export async function createStaffMaintenanceReport(form) {
  if (!supabase) return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  const currentUser = await resolveCurrentStaffUser();
  const equipmentId = form.equipmentUuid || "";
  const payload = {
    equipment_id: equipmentId || null,
    room_id: form.roomId || null,
    reported_by_user_id: currentUser?.user_id || null,
    issue_title: form.equipmentName ? `${form.equipmentName} issue` : "Equipment issue",
    issue_description: form.issueDescription || "",
    priority: form.priority || "medium",
    status: "submitted",
  };
  const { data, error } = await supabase
    .from("maintenance_reports")
    .insert(payload)
    .select("maintenance_report_id,issue_title")
    .single();
  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create maintenance report:", error);
    return { ok: false, message: "Maintenance report could not be created." };
  }

  if (equipmentId && uuidPattern.test(String(equipmentId))) {
    await supabase
      .from("equipment")
      .update({ status: "broken" })
      .eq("equipment_id", equipmentId);
  }

  const { data: adminUsers } = await supabase
    .from("users")
    .select("user_id")
    .in("role", ["admin", "owner"]);

  if (Array.isArray(adminUsers) && adminUsers.length) {
    await supabase.from("notifications").insert(
      adminUsers.map((admin) => ({
        user_id: admin.user_id,
        notification_type: "system",
        title: "New maintenance report",
        message: `${form.equipmentName || data?.issue_title || "Equipment"}: ${form.issueDescription || "New issue reported by staff."}`,
        is_read: false,
      })),
    );
  }

  return { ok: true, message: "Maintenance report submitted." };
}

export async function markStaffEquipmentMaintained({ equipmentUuid, reportId }) {
  if (!supabase) return { ok: false, message: "Hệ thống chưa được cấu hình." };

  try {
    const completedAt = new Date().toISOString();
    let resolvedEquipmentId = equipmentUuid || "";

    if (!resolvedEquipmentId && reportId) {
      const { data: report } = await supabase
        .from("maintenance_reports")
        .select("equipment_id")
        .eq("maintenance_report_id", reportId)
        .maybeSingle();
      resolvedEquipmentId = report?.equipment_id || "";
    }

    if (reportId) {
      const { error: reportError } = await supabase
        .from("maintenance_reports")
        .update({ status: "resolved", resolved_at: completedAt })
        .eq("maintenance_report_id", reportId);
      if (reportError) throw reportError;
    }

    if (resolvedEquipmentId && uuidPattern.test(String(resolvedEquipmentId))) {
      const { error: equipmentError } = await supabase
        .from("equipment")
        .update({
          status: "active",
          last_maintenance_date: completedAt.slice(0, 10),
        })
        .eq("equipment_id", resolvedEquipmentId);
      if (equipmentError) throw equipmentError;

      await supabase.from("maintenance_records").insert({
        maintenance_report_id: reportId || null,
        equipment_id: resolvedEquipmentId,
        maintenance_type: "repair",
        description: "Staff marked maintenance as completed.",
        completed_at: completedAt,
      });
    }

    return { ok: true, message: "Thiết bị đã được cập nhật trạng thái hoạt động." };
  } catch (error) {
    console.error("[Gymster hệ thống] Failed to mark equipment maintained:", error);
    return { ok: false, message: "Không thể cập nhật trạng thái bảo trì." };
  }
}
