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
  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredValue(supabaseKey)) return null;
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  return { ok: true, client };
}

function normalizePaymentMethod(method) {
  const value = String(method || "bank_transfer").trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, "_");
  return ["cash", "bank_transfer", "credit_card", "e_wallet"].includes(value) ? value : "bank_transfer";
}

function fullName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return user?.full_name || name || user?.username || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

async function resolveMember(client, payload = {}) {
  const memberId = payload.memberId || payload.member_id || "";
  if (memberId) {
    const { data } = await client.from("members").select("member_id,user_id,member_code").eq("member_id", memberId).maybeSingle();
    if (data?.member_id) return data;
  }
  const userId = payload.userId || payload.user_id || "";
  if (userId) {
    const { data } = await client.from("members").select("member_id,user_id,member_code").eq("user_id", userId).maybeSingle();
    if (data?.member_id) return data;
  }
  const email = String(payload.memberEmail || payload.email || "").trim().toLowerCase();
  if (email) {
    const { data: user } = await client.from("users").select("user_id").eq("email", email).maybeSingle();
    if (user?.user_id) {
      const { data } = await client.from("members").select("member_id,user_id,member_code").eq("user_id", user.user_id).maybeSingle();
      if (data?.member_id) return data;
    }
  }
  return null;
}

async function notifyRole(client, role, title, message, actionType, actionPayload = {}) {
  const { data: users } = await client.from("users").select("user_id").eq("role", role).eq("account_status", "active");
  const rows = (users || []).map((user) => ({
    user_id: user.user_id,
    notification_type: "payment",
    title,
    message,
    action_type: actionType,
    action_payload: actionPayload,
  }));
  if (rows.length) await client.from("notifications").insert(rows);
}

async function notifyUser(client, userId, title, message, actionType, actionPayload = {}) {
  if (!userId) return;
  await client.from("notifications").insert({
    user_id: userId,
    notification_type: "payment",
    title,
    message,
    action_type: actionType,
    action_payload: actionPayload,
  });
}

async function fetchPackage(client, packageId) {
  const { data, error } = await client
    .from("packages")
    .select("package_id,package_name,package_type,duration_months,price,session_limit,has_personal_trainer")
    .eq("package_id", packageId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchUserMap(client, userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await client
    .from("users")
    .select("user_id,first_name,last_name,email,phone_number")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.user_id, row]));
}

async function fetchTrainerNames(client, trainerIds) {
  const ids = [...new Set((trainerIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data: trainers, error } = await client
    .from("trainers")
    .select("trainer_id,user_id,trainer_code")
    .in("trainer_id", ids);
  if (error) throw error;
  const usersById = await fetchUserMap(client, (trainers || []).map((row) => row.user_id));
  return Object.fromEntries((trainers || []).map((trainer) => [trainer.trainer_id, fullName(usersById[trainer.user_id], trainer.trainer_code || "PT")]));
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + Number(months || 1));
  return next.toISOString().slice(0, 10);
}

function normalizeSchedule(payload) {
  const selectedSlots = Array.isArray(payload.selectedSlots) ? payload.selectedSlots : [];
  if (selectedSlots.length) return selectedSlots;
  if (payload.selectedSlot) return [payload.selectedSlot];
  if (payload.selectedSchedule) return [{ label: payload.selectedSchedule }];
  return [];
}

function mapRequest(payment, context = {}) {
  const member = context.membersById?.[payment.member_id] || {};
  const user = context.usersById?.[member.user_id] || {};
  const pkg = context.packagesById?.[payment.package_id] || {};
  const memberPackage = context.memberPackagesById?.[payment.member_package_id] || {};
  return {
    id: payment.payment_id,
    paymentId: payment.payment_id,
    transactionCode: payment.transaction_code || payment.provider_reference || payment.payment_id,
    memberId: payment.member_id,
    memberName: member.full_name || fullName(user),
    memberEmail: user.email || "",
    memberPhone: user.phone_number || "",
    memberCode: member.member_code || "",
    packageId: payment.package_id,
    packageName: pkg.package_name || "Membership package",
    packageType: pkg.package_type || "",
    memberPackageId: payment.member_package_id,
    trainerId: memberPackage.trainer_id || "",
    trainerName: context.trainerNamesById?.[memberPackage.trainer_id] || "",
    selectedSchedule: memberPackage.selected_schedule || "",
    selectedSlots: memberPackage.selected_slots || [],
    amount: Number(payment.amount || 0),
    paymentMethod: payment.payment_method,
    paymentStatus: payment.payment_status,
    status: payment.payment_status === "paid" ? "approved" : payment.payment_status === "failed" ? "rejected" : payment.payment_status,
    paymentDate: payment.payment_date || payment.created_at,
    createdAt: payment.created_at,
    createdLabel: formatDate(payment.created_at),
  };
}

async function enrichPayments(client, payments) {
  const rows = payments || [];
  const memberIds = [...new Set(rows.map((row) => row.member_id).filter(Boolean))];
  const memberPackageIds = [...new Set(rows.map((row) => row.member_package_id).filter(Boolean))];
  const packageIds = [...new Set(rows.map((row) => row.package_id).filter(Boolean))];
  const { data: members } = memberIds.length
    ? await client.from("members").select("member_id,user_id,member_code,full_name").in("member_id", memberIds)
    : { data: [] };
  const { data: memberPackages } = memberPackageIds.length
    ? await client.from("member_packages").select("member_package_id,trainer_id,selected_schedule,selected_slots").in("member_package_id", memberPackageIds)
    : { data: [] };
  const { data: packages } = packageIds.length
    ? await client.from("packages").select("package_id,package_name,package_type").in("package_id", packageIds)
    : { data: [] };
  const membersById = Object.fromEntries((members || []).map((row) => [row.member_id, row]));
  const memberPackagesById = Object.fromEntries((memberPackages || []).map((row) => [row.member_package_id, row]));
  const packagesById = Object.fromEntries((packages || []).map((row) => [row.package_id, row]));
  const usersById = await fetchUserMap(client, (members || []).map((row) => row.user_id));
  const trainerNamesById = await fetchTrainerNames(client, (memberPackages || []).map((row) => row.trainer_id));
  return rows.map((payment) => mapRequest(payment, { membersById, usersById, packagesById, memberPackagesById, trainerNamesById }));
}

export async function createPackagePaymentRequest(payload = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const member = await resolveMember(client, payload);
    if (!member?.member_id) return { ok: false, status: 400, message: "Member could not be resolved." };
    const pkg = await fetchPackage(client, payload.packageId || payload.package_id);
    if (!pkg?.package_id) return { ok: false, status: 400, message: "Package is required." };
    if (pkg.has_personal_trainer && !payload.trainerId && !payload.trainer_id) {
      return { ok: false, status: 400, message: "Trainer is required for this package." };
    }

    const sessionLimit = payload.remainingSessions ?? pkg.session_limit ?? null;
    const scheduleSlots = normalizeSchedule(payload);
    const memberPackageInsert = {
      member_id: member.member_id,
      package_id: pkg.package_id,
      trainer_id: payload.trainerId || payload.trainer_id || null,
      status: "pending_payment",
      sessions_total: sessionLimit,
      sessions_used: 0,
      selected_schedule: scheduleSlots.map((slot) => slot.label).filter(Boolean).join(" & ") || payload.selectedSchedule || null,
      selected_slots: scheduleSlots,
    };
    const { data: memberPackage, error: packageError } = await client.from("member_packages").insert(memberPackageInsert).select("*").single();
    if (packageError) throw packageError;

    const now = new Date().toISOString();
    const transactionCode = `PAYREQ-${Date.now()}`;
    const paymentInsert = {
      member_id: member.member_id,
      package_id: pkg.package_id,
      member_package_id: memberPackage.member_package_id,
      amount: Number(payload.amount ?? pkg.price ?? 0),
      currency: "VND",
      payment_method: normalizePaymentMethod(payload.paymentMethod || payload.payment_method),
      payment_status: "pending",
      payment_date: now,
      paid_at: null,
      provider_reference: transactionCode,
      transaction_code: transactionCode,
      transfer_content: `WAITING STAFF APPROVAL ${pkg.package_code || pkg.package_id}`,
    };
    const { data: payment, error: paymentError } = await client.from("payments").insert(paymentInsert).select("*").single();
    if (paymentError) throw paymentError;

    await notifyRole(client, "staff", "Yêu cầu thanh toán mới", `${member.member_code || "Member"} đã gửi yêu cầu xác nhận thanh toán gói ${pkg.package_name}.`, "review_payment_request", { paymentId: payment.payment_id });
    const [request] = await enrichPayments(client, [payment]);
    return { ok: true, data: request, message: "Payment request created." };
  } catch (error) {
    console.error("[Payment Request] Failed to create:", error);
    return { ok: false, status: 500, message: error.message || "Payment request could not be created." };
  }
}

export async function listStaffPaymentRequests() {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { data, error } = await ready.client
      .from("payments")
      .select("*")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: await enrichPayments(ready.client, data || []) };
  } catch (error) {
    console.error("[Payment Request] Failed to list:", error);
    return { ok: false, status: 500, message: error.message || "Payment requests could not be loaded." };
  }
}

async function createAssignmentAndSessions(client, payment, memberPackage) {
  if (!memberPackage?.trainer_id) return;
  await client.from("trainer_assignments").insert({
    trainer_id: memberPackage.trainer_id,
    member_id: memberPackage.member_id,
    member_package_id: memberPackage.member_package_id,
    status: "active",
    notes: "Assigned after staff payment approval.",
  });
  const slots = Array.isArray(memberPackage.selected_slots) ? memberPackage.selected_slots : [];
  const slot = slots[0] || {};
  if (slot.dayKey && slot.startTime && slot.endTime && memberPackage.start_date && memberPackage.end_date) {
    await client.from("workout_sessions").insert({
      member_id: memberPackage.member_id,
      trainer_id: memberPackage.trainer_id,
      package_id: memberPackage.package_id,
      member_package_id: memberPackage.member_package_id,
      title: "PT Session",
      exercise_type: "Personal Training",
      session_date: memberPackage.start_date,
      start_time: slot.startTime,
      end_time: slot.endTime,
      status: "scheduled",
      notes: `Initial session from selected weekly schedule: ${memberPackage.selected_schedule || ""}`,
    });
  }
}

export async function approvePaymentRequest(paymentId) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const { data: payment, error: paymentError } = await client.from("payments").select("*").eq("payment_id", paymentId).maybeSingle();
    if (paymentError || !payment) return { ok: false, status: 404, message: "Payment request not found." };
    const { data: memberPackage, error: memberPackageError } = await client.from("member_packages").select("*").eq("member_package_id", payment.member_package_id).maybeSingle();
    if (memberPackageError || !memberPackage) return { ok: false, status: 404, message: "Member package not found." };
    const pkg = await fetchPackage(client, payment.package_id);
    const now = new Date().toISOString();
    const startDate = now.slice(0, 10);
    const endDate = addMonths(new Date(now), pkg?.duration_months || 1);
    const { data: updatedPackage, error: updatePackageError } = await client.from("member_packages").update({
      status: "active",
      start_date: startDate,
      end_date: endDate,
      activated_at: now,
      updated_at: now,
    }).eq("member_package_id", memberPackage.member_package_id).select("*").single();
    if (updatePackageError) throw updatePackageError;
    const { data: updatedPayment, error: updatePaymentError } = await client.from("payments").update({
      payment_status: "paid",
      paid_at: now,
      payment_date: now,
      updated_at: now,
    }).eq("payment_id", payment.payment_id).select("*").single();
    if (updatePaymentError) throw updatePaymentError;
    await createAssignmentAndSessions(client, updatedPayment, updatedPackage);
    const { data: member } = await client.from("members").select("user_id,member_code,full_name").eq("member_id", payment.member_id).maybeSingle();
    await notifyUser(client, member?.user_id, "Thanh toán đã được xác nhận", `Gói ${pkg?.package_name || "tập"} của bạn đã được kích hoạt.`, "payment_approved", { paymentId });
    if (updatedPackage.trainer_id) {
      const { data: trainer } = await client.from("trainers").select("user_id").eq("trainer_id", updatedPackage.trainer_id).maybeSingle();
      await notifyUser(client, trainer?.user_id, "Bạn có hội viên mới đăng ký gói tập", `Bạn có hội viên mới đăng ký gói tập: ${member?.full_name || member?.member_code || "Member"}`, "new_pt_member", { memberId: payment.member_id, packageId: payment.package_id, trainerId: updatedPackage.trainer_id });
    }
    const [request] = await enrichPayments(client, [updatedPayment]);
    return { ok: true, data: request, message: "Payment request approved." };
  } catch (error) {
    console.error("[Payment Request] Failed to approve:", error);
    return { ok: false, status: 500, message: error.message || "Payment request could not be approved." };
  }
}

export async function rejectPaymentRequest(paymentId, reason = "") {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const { data: payment, error: paymentError } = await client.from("payments").select("*").eq("payment_id", paymentId).maybeSingle();
    if (paymentError || !payment) return { ok: false, status: 404, message: "Payment request not found." };
    const now = new Date().toISOString();
    await client.from("member_packages").update({ status: "cancelled", updated_at: now }).eq("member_package_id", payment.member_package_id);
    const { data: updatedPayment, error } = await client.from("payments").update({
      payment_status: "failed",
      updated_at: now,
      transfer_content: reason ? `Rejected by staff: ${reason}` : "Rejected by staff",
    }).eq("payment_id", payment.payment_id).select("*").single();
    if (error) throw error;
    const { data: member } = await client.from("members").select("user_id").eq("member_id", payment.member_id).maybeSingle();
    await notifyUser(client, member?.user_id, "Thanh toán bị từ chối", reason || "Yêu cầu thanh toán của bạn đã bị staff từ chối.", "payment_rejected", { paymentId });
    const [request] = await enrichPayments(client, [updatedPayment]);
    return { ok: true, data: request, message: "Payment request rejected." };
  } catch (error) {
    console.error("[Payment Request] Failed to reject:", error);
    return { ok: false, status: 500, message: error.message || "Payment request could not be rejected." };
  }
}
