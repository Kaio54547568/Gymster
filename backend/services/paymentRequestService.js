import { createClient } from "@supabase/supabase-js";
import { getPackagePriceSnapshot } from "./packagePromotionService.js";

let supabaseClient;
const PAYMENT_PROOF_BUCKET = "payment-proofs";
const PAYMENT_PROOF_MAX_BYTES = 3 * 1024 * 1024;
const PAYMENT_PROOF_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);

export function validatePaymentProofMetadata({ fileName = "", mimeType = "", fileSize = 0 } = {}) {
  if (!PAYMENT_PROOF_MIME_TYPES.has(String(mimeType).toLowerCase())) {
    return { ok: false, message: "Payment proof must be a JPG, PNG, or PDF file." };
  }
  if (!Number.isFinite(Number(fileSize)) || Number(fileSize) <= 0 || Number(fileSize) > PAYMENT_PROOF_MAX_BYTES) {
    return { ok: false, message: "Payment proof must be 3 MB or smaller." };
  }
  if (!String(fileName).trim()) {
    return { ok: false, message: "Payment proof file name is required." };
  }
  return { ok: true };
}

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

function normalizeProofType(value) {
  return String(value || "demo").toLowerCase() === "upload" ? "upload" : "demo";
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
    .select("package_id,package_code,package_name,package_type,duration_months,price,session_limit,has_personal_trainer,sessions_per_week,status")
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

function normalizeSchedule(payload) {
  const selectedSlots = Array.isArray(payload.selectedSlots) ? payload.selectedSlots : [];
  if (selectedSlots.length) return selectedSlots;
  if (payload.selectedSlot) return [payload.selectedSlot];
  if (payload.selectedSchedule) return [{ label: payload.selectedSchedule }];
  return [];
}

export function validateDemoCheckoutSelection({
  hasPersonalTrainer = false,
  trainerId = "",
  selectedSlots = [],
  sessionsPerWeek = 1,
} = {}) {
  if (!hasPersonalTrainer) return { ok: true };
  if (!String(trainerId || "").trim()) {
    return { ok: false, message: "Trainer is required for this package." };
  }
  const slots = Array.isArray(selectedSlots) ? selectedSlots : [];
  const requiredSlots = Number(sessionsPerWeek) === 2 ? 2 : 1;
  if (slots.length !== requiredSlots) {
    return { ok: false, message: `Please choose ${requiredSlots} valid weekly training slot${requiredSlots > 1 ? "s" : ""}.` };
  }
  const valid = slots.every((slot) => slot?.dayKey && slot?.startTime && slot?.endTime);
  return valid
    ? { ok: true }
    : { ok: false, message: "The selected PT schedule is invalid." };
}

function mapActiveSessionUser(user, member) {
  const fullNameValue = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim()
    || user?.full_name
    || user?.username
    || "Member";
  return {
    id: user.user_id,
    userId: user.user_id,
    user_id: user.user_id,
    memberId: member.member_id,
    member_id: member.member_id,
    username: user.username || "",
    email: user.email || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    fullName: fullNameValue,
    phone: user.phone_number || "",
    phone_number: user.phone_number || "",
    role: "member",
    sourceRole: user.role || "member",
    accountStatus: "Active",
    account_status: "active",
  };
}

export function isDemoCheckoutMigrationError(error) {
  return ["42703", "42883", "PGRST202"].includes(String(error?.code || ""))
    || /selected_schedule|selected_slots|gymster_complete_package_purchase/i.test(String(error?.message || ""));
}

export async function completeDemoPayment(payload = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { client } = ready;
    const member = await resolveMember(client, payload);
    if (!member?.member_id) return { ok: false, status: 400, message: "Member could not be resolved." };

    const pkg = await fetchPackage(client, payload.packageId || payload.package_id);
    if (!pkg?.package_id || pkg.status === "inactive" || pkg.status === "archived") {
      return { ok: false, status: 400, message: "An active package is required." };
    }

    const trainerId = payload.trainerId || payload.trainer_id || null;
    const selectedSlots = normalizeSchedule(payload);
    const selection = validateDemoCheckoutSelection({
      hasPersonalTrainer: pkg.has_personal_trainer,
      trainerId,
      selectedSlots,
      sessionsPerWeek: pkg.sessions_per_week,
    });
    if (!selection.ok) return { ...selection, status: 400 };

    if (trainerId) {
      const { data: trainer, error: trainerError } = await client
        .from("trainers")
        .select("trainer_id,status,current_active_members,max_active_members")
        .eq("trainer_id", trainerId)
        .maybeSingle();
      if (trainerError) throw trainerError;
      if (!trainer || !["active", "full"].includes(trainer.status)) {
        return { ok: false, status: 400, message: "The selected trainer is unavailable." };
      }
    }

    const checkoutKey = String(payload.checkoutKey || payload.checkout_key || crypto.randomUUID()).trim();
    const selectedSchedule = selectedSlots.map((slot) => slot.label).filter(Boolean).join(" & ")
      || payload.selectedSchedule
      || "";
    const { data: rpcResult, error: rpcError } = await client.rpc("gymster_complete_package_purchase", {
      target_member_id: member.member_id,
      target_package_id: pkg.package_id,
      target_trainer_id: trainerId,
      target_selected_schedule: selectedSchedule || null,
      target_selected_slots: selectedSlots,
      target_checkout_key: checkoutKey,
      target_payment_method: normalizePaymentMethod(payload.paymentMethod || payload.payment_method),
    });
    if (rpcError) throw rpcError;

    const paymentId = rpcResult?.payment_id;
    const memberPackageId = rpcResult?.member_package_id;

    if (payload.purchasedSessions && pkg.package_type === 'session_based') {
      await client.from("member_packages").update({
        sessions_total: payload.purchasedSessions
      }).eq("member_package_id", memberPackageId);

      await client.from("payments").update({
        purchased_sessions: payload.purchasedSessions,
        unit_price: 50000 // Fixed for now based on the prompt
      }).eq("payment_id", paymentId);
    }

    const [{ data: payment, error: paymentError }, { data: memberPackage, error: packageError }, { data: user, error: userError }, { data: activeMember, error: memberError }] = await Promise.all([
      client.from("payments").select("*").eq("payment_id", paymentId).single(),
      client.from("member_packages").select("*").eq("member_package_id", memberPackageId).single(),
      client.from("users").select("*").eq("user_id", member.user_id).single(),
      client.from("members").select("*").eq("member_id", member.member_id).single(),
    ]);
    if (paymentError || packageError || userError || memberError) {
      throw paymentError || packageError || userError || memberError;
    }

    const { data: workoutSessions, error: sessionsError } = await client
      .from("workout_sessions")
      .select("*")
      .eq("member_package_id", memberPackageId)
      .order("session_date", { ascending: true });
    if (sessionsError) throw sessionsError;

    await notifyUser(
      client,
      member.user_id,
      "Payment completed",
      rpcResult?.package_status === "pending_activation"
        ? `Your ${pkg.package_name} package is paid and will start on ${rpcResult.start_date}.`
        : `Your ${pkg.package_name} package is now active.`,
      "payment_approved",
      { paymentId, memberPackageId },
    );
    if (trainerId && rpcResult?.package_status === "active") {
      const { data: trainer } = await client.from("trainers").select("user_id").eq("trainer_id", trainerId).maybeSingle();
      await notifyUser(
        client,
        trainer?.user_id,
        "New member assigned",
        `${activeMember.full_name || activeMember.member_code || "A member"} has activated a PT package.`,
        "new_pt_member",
        { memberId: member.member_id, packageId: pkg.package_id, trainerId },
      );
    }

    return {
      ok: true,
      data: {
        user: mapActiveSessionUser(user, activeMember),
        payment,
        memberPackage,
        workoutSessions: workoutSessions || [],
      },
      message: rpcResult?.reused
        ? "Payment was already completed."
        : rpcResult?.package_status === "pending_activation"
          ? "Payment completed. Package is pending activation."
          : "Demo payment completed.",
    };
  } catch (error) {
    console.error("[Demo Payment] Failed to complete checkout:", error);
    if (/PENDING_ACTIVATION_EXISTS/i.test(String(error?.message || ""))) {
      return {
        ok: false,
        status: 409,
        code: "PENDING_ACTIVATION_EXISTS",
        message: "You already have a package waiting for activation. You cannot buy another package yet.",
      };
    }
    if (isDemoCheckoutMigrationError(error)) {
      return {
        ok: false,
        status: 503,
        message: "Demo payment database upgrade is required. Run database/demo_payment_checkout_upgrade.sql.",
      };
    }
    return { ok: false, status: 500, message: error.message || "Demo payment could not be completed." };
  }
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
    packageStartDate: memberPackage.start_date || "",
    packageEndDate: memberPackage.end_date || "",
    amount: Number(payment.amount || 0),
    originalPrice: Number(payment.original_price ?? payment.amount ?? 0),
    discountPercent: Number(payment.discount_percent || 0),
    discountAmount: Number(payment.discount_amount || 0),
    finalAmount: Number(payment.final_amount ?? payment.amount ?? 0),
    packageNameSnapshot: payment.package_name_snapshot || pkg.package_name || "Membership package",
    promotionId: payment.promotion_id || null,
    promotionTitleSnapshot: payment.promotion_title_snapshot || "",
    appliedAt: payment.applied_at || payment.payment_date || payment.created_at,
    paymentMethod: payment.payment_method,
    paymentStatus: payment.payment_status,
    status: payment.payment_status === "paid" ? "approved" : payment.payment_status === "failed" ? "rejected" : payment.payment_status,
    paymentDate: payment.payment_date || payment.created_at,
    createdAt: payment.created_at,
    createdLabel: formatDate(payment.created_at),
    proofType: payment.proof_type || "demo",
    proofStoragePath: payment.proof_storage_path || "",
    proofFileName: payment.proof_file_name || "",
    proofMimeType: payment.proof_mime_type || "",
    proofSubmittedAt: payment.proof_submitted_at || payment.created_at,
    rejectionReason: payment.rejection_reason || "",
    reviewedAt: payment.reviewed_at || "",
  };
}

async function resolveReviewerEmployeeId(client, reviewer = {}) {
  if (reviewer.employeeId || reviewer.employee_id) return reviewer.employeeId || reviewer.employee_id;
  const userId = reviewer.userId || reviewer.user_id;
  if (!userId) return null;
  const { data } = await client.from("employees").select("employee_id").eq("user_id", userId).maybeSingle();
  return data?.employee_id || null;
}

export async function createPaymentProofUpload(payload = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  const validation = validatePaymentProofMetadata(payload);
  if (!validation.ok) return { ...validation, status: 400 };

  try {
    const member = await resolveMember(ready.client, payload);
    if (!member?.member_id) return { ok: false, status: 400, message: "Member could not be resolved." };
    const extension = payload.mimeType === "application/pdf"
      ? "pdf"
      : payload.mimeType === "image/png"
        ? "png"
        : "jpg";
    const path = `members/${member.member_id}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await ready.client.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUploadUrl(path, { upsert: false });
    if (error) throw error;
    return {
      ok: true,
      data: {
        bucket: PAYMENT_PROOF_BUCKET,
        path,
        token: data.token,
        signedUrl: data.signedUrl,
      },
    };
  } catch (error) {
    console.error("[Payment Request] Failed to create proof upload:", error);
    return { ok: false, status: 500, message: error.message || "Payment proof upload could not be prepared." };
  }
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
    ? await client.from("member_packages").select("member_package_id,trainer_id,selected_schedule,selected_slots,start_date,end_date").in("member_package_id", memberPackageIds)
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
    await client.rpc("gymster_sync_member_package_lifecycle", { target_member_id: member.member_id });
    const { data: queuedPackage, error: queuedError } = await client
      .from("member_packages")
      .select("member_package_id")
      .eq("member_id", member.member_id)
      .in("status", ["pending_payment", "pending_activation"])
      .limit(1)
      .maybeSingle();
    if (queuedError) throw queuedError;
    if (queuedPackage) {
      return {
        ok: false,
        status: 409,
        code: "PENDING_ACTIVATION_EXISTS",
        message: "You already have a package waiting for payment or activation. You cannot buy another package yet.",
      };
    }
    const pkg = await fetchPackage(client, payload.packageId || payload.package_id);
    if (!pkg?.package_id) return { ok: false, status: 400, message: "Package is required." };
    if (pkg.has_personal_trainer && !payload.trainerId && !payload.trainer_id) {
      return { ok: false, status: 400, message: "Trainer is required for this package." };
    }
    const pricing = await getPackagePriceSnapshot(client, pkg.package_id);
    if (!pricing.ok) return pricing;
    const proofType = normalizeProofType(payload.proofType);
    if (proofType === "upload") {
      const proofValidation = validatePaymentProofMetadata({
        fileName: payload.proofFileName,
        mimeType: payload.proofMimeType,
        fileSize: payload.proofFileSize,
      });
      if (!proofValidation.ok) return { ...proofValidation, status: 400 };
      if (!String(payload.proofStoragePath || "").startsWith(`members/${member.member_id}/`)) {
        return { ok: false, status: 400, message: "Payment proof upload path is invalid." };
      }
    }

    const sessionLimit = payload.remainingSessions ?? pkg.session_limit ?? null;
    const scheduleSlots = normalizeSchedule(payload);
    const selection = validateDemoCheckoutSelection({
      hasPersonalTrainer: pkg.has_personal_trainer,
      trainerId: payload.trainerId || payload.trainer_id || null,
      selectedSlots: scheduleSlots,
      sessionsPerWeek: pkg.sessions_per_week,
    });
    if (!selection.ok) return { ...selection, status: 400 };
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
      amount: pricing.snapshot.finalAmount,
      currency: "VND",
      payment_method: normalizePaymentMethod(payload.paymentMethod || payload.payment_method),
      payment_status: "pending",
      payment_date: now,
      paid_at: null,
      provider_reference: transactionCode,
      transaction_code: transactionCode,
      transfer_content: `WAITING STAFF APPROVAL ${pkg.package_code || pkg.package_id}`,
      proof_type: proofType,
      proof_storage_path: proofType === "upload" ? payload.proofStoragePath : null,
      proof_file_name: proofType === "upload" ? payload.proofFileName : null,
      proof_mime_type: proofType === "upload" ? payload.proofMimeType : null,
      proof_submitted_at: now,
      package_name_snapshot: pricing.snapshot.packageNameSnapshot,
      promotion_id: pricing.snapshot.promotionId,
      promotion_title_snapshot: pricing.snapshot.promotionTitleSnapshot,
      original_price: pricing.snapshot.originalPrice,
      discount_percent: pricing.snapshot.discountPercent,
      discount_amount: pricing.snapshot.discountAmount,
      final_amount: pricing.snapshot.finalAmount,
      applied_at: pricing.snapshot.appliedAt,
    };
    const { data: payment, error: paymentError } = await client.from("payments").insert(paymentInsert).select("*").single();
    if (paymentError) throw paymentError;

    await Promise.all([
      client.from("users").update({ account_status: "pending_verification", updated_at: now }).eq("user_id", member.user_id),
      client.from("members").update({ status: "pending_verification", updated_at: now }).eq("member_id", member.member_id),
    ]);

    await notifyRole(client, "staff", "Yêu cầu thanh toán mới", `${member.member_code || "Member"} đã gửi yêu cầu xác nhận thanh toán gói ${pkg.package_name}.`, "review_payment_request", { paymentId: payment.payment_id });
    const [request] = await enrichPayments(client, [payment]);
    return { ok: true, data: request, message: "Payment request created." };
  } catch (error) {
    console.error("[Payment Request] Failed to create:", error);
    if (error?.code === "42703" || error?.code === "23514") {
      return {
        ok: false,
        status: 503,
        message: "Payment verification database upgrade is required. Run database/member_payment_verification_upgrade.sql.",
      };
    }
    return { ok: false, status: 500, message: error.message || "Payment request could not be created." };
  }
}

export async function getMemberPaymentRequest(lookup = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const member = await resolveMember(ready.client, lookup);
    if (!member?.member_id) return { ok: false, status: 404, message: "Member could not be resolved." };
    const { data, error } = await ready.client
      .from("payments")
      .select("*")
      .eq("member_id", member.member_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: true, data: null };
    const [request] = await enrichPayments(ready.client, [data]);
    return { ok: true, data: request };
  } catch (error) {
    console.error("[Payment Request] Failed to load member request:", error);
    return { ok: false, status: 500, message: error.message || "Payment request could not be loaded." };
  }
}

export async function getPaymentProof(paymentId) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { data: payment, error } = await ready.client
      .from("payments")
      .select("payment_id,proof_type,proof_storage_path,proof_file_name,proof_mime_type,proof_submitted_at")
      .eq("payment_id", paymentId)
      .maybeSingle();
    if (error) throw error;
    if (!payment) return { ok: false, status: 404, message: "Payment request not found." };
    if (payment.proof_type !== "upload" || !payment.proof_storage_path) {
      return { ok: true, data: { proofType: "demo", url: "", fileName: "", mimeType: "" } };
    }
    const { data: signed, error: signedError } = await ready.client.storage
      .from(PAYMENT_PROOF_BUCKET)
      .createSignedUrl(payment.proof_storage_path, 300);
    if (signedError) throw signedError;
    return {
      ok: true,
      data: {
        proofType: "upload",
        url: signed.signedUrl,
        fileName: payment.proof_file_name,
        mimeType: payment.proof_mime_type,
        submittedAt: payment.proof_submitted_at,
      },
    };
  } catch (error) {
    console.error("[Payment Request] Failed to load payment proof:", error);
    if (error?.code === "42703") {
      return { ok: true, data: { proofType: "demo", url: "", fileName: "", mimeType: "" } };
    }
    return { ok: false, status: 500, message: error.message || "Payment proof could not be loaded." };
  }
}

export async function resubmitPaymentRequest(paymentId, payload = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const { data: payment, error } = await client.from("payments").select("*").eq("payment_id", paymentId).maybeSingle();
    if (error) throw error;
    if (!payment) return { ok: false, status: 404, message: "Payment request not found." };
    if (!["failed", "cancelled"].includes(payment.payment_status)) {
      return { ok: false, status: 409, message: "Only rejected or cancelled requests can be submitted again." };
    }
    const proofType = normalizeProofType(payload.proofType);
    if (proofType === "upload") {
      const validation = validatePaymentProofMetadata({
        fileName: payload.proofFileName,
        mimeType: payload.proofMimeType,
        fileSize: payload.proofFileSize,
      });
      if (!validation.ok) return { ...validation, status: 400 };
      if (!String(payload.proofStoragePath || "").startsWith(`members/${payment.member_id}/`)) {
        return { ok: false, status: 400, message: "Payment proof upload path is invalid." };
      }
    }
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await client.from("payments").update({
      payment_status: "pending",
      proof_type: proofType,
      proof_storage_path: proofType === "upload" ? payload.proofStoragePath : null,
      proof_file_name: proofType === "upload" ? payload.proofFileName : null,
      proof_mime_type: proofType === "upload" ? payload.proofMimeType : null,
      proof_submitted_at: now,
      rejection_reason: null,
      reviewed_at: null,
      reviewed_by_employee_id: null,
      updated_at: now,
    }).eq("payment_id", paymentId).select("*").single();
    if (updateError) throw updateError;
    const { data: member } = await client.from("members").select("user_id").eq("member_id", payment.member_id).maybeSingle();
    await Promise.all([
      client.from("users").update({ account_status: "pending_verification", updated_at: now }).eq("user_id", member?.user_id),
      client.from("members").update({ status: "pending_verification", updated_at: now }).eq("member_id", payment.member_id),
    ]);
    await notifyRole(client, "staff", "Yêu cầu thanh toán được gửi lại", "Member đã gửi lại chứng từ thanh toán.", "review_payment_request", { paymentId });
    const [request] = await enrichPayments(client, [updated]);
    return { ok: true, data: request, message: "Payment request submitted again." };
  } catch (error) {
    console.error("[Payment Request] Failed to resubmit:", error);
    return { ok: false, status: 500, message: error.message || "Payment request could not be submitted again." };
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

async function createAssignmentAndSessions(client, memberPackage) {
  if (!memberPackage?.trainer_id) return;
  await client.from("trainer_assignments").upsert({
    trainer_id: memberPackage.trainer_id,
    member_id: memberPackage.member_id,
    member_package_id: memberPackage.member_package_id,
    status: "active",
    notes: "Assigned after staff payment approval.",
  }, { onConflict: "member_package_id,trainer_id", ignoreDuplicates: true });
  const slots = Array.isArray(memberPackage.selected_slots) ? memberPackage.selected_slots : [];
  if (!slots.length || !memberPackage.start_date || !memberPackage.end_date) return;
  const dayIndexes = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const start = new Date(`${memberPackage.start_date}T00:00:00Z`);
  const end = new Date(`${memberPackage.end_date}T00:00:00Z`);
  const rows = [];
  for (const slot of slots) {
    const targetDay = dayIndexes[String(slot.dayKey || "").toLowerCase()];
    if (targetDay === undefined || !slot.startTime || !slot.endTime) continue;
    const cursor = new Date(start);
    cursor.setUTCDate(cursor.getUTCDate() + ((targetDay - cursor.getUTCDay() + 7) % 7));
    while (cursor <= end) {
      rows.push({
        member_id: memberPackage.member_id,
        trainer_id: memberPackage.trainer_id,
        member_package_id: memberPackage.member_package_id,
        title: "PT Session",
        exercise_type: "Personal Training",
        room_name: "PT Room",
        session_date: cursor.toISOString().slice(0, 10),
        start_time: slot.startTime,
        end_time: slot.endTime,
        status: "scheduled",
        notes: `Created from selected weekly schedule: ${memberPackage.selected_schedule || ""}`,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
  }
  if (rows.length) {
    await client.from("workout_sessions").upsert(rows, {
      onConflict: "member_package_id,trainer_id,session_date,start_time,end_time",
      ignoreDuplicates: true,
    });
  }
}

export async function listStaffPaymentHistory(authenticatedClient = null) {
  const ready = authenticatedClient ? { ok: true, client: authenticatedClient } : requireClient();
  if (!ready.ok) return ready;
  try {
    const { data, error } = await ready.client
      .from("payments")
      .select("*")
      .eq("payment_status", "paid")
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { ok: true, data: await enrichPayments(ready.client, data || []) };
  } catch (error) {
    console.error("[Payment History] Failed to list:", error);
    return { ok: false, status: 500, message: error.message || "Payment history could not be loaded." };
  }
}

export async function getStaffPaymentReceipt(paymentId, authenticatedClient = null) {
  const ready = authenticatedClient ? { ok: true, client: authenticatedClient } : requireClient();
  if (!ready.ok) return ready;
  try {
    const { data: payment, error } = await ready.client
      .from("payments")
      .select("*")
      .eq("payment_id", paymentId)
      .eq("payment_status", "paid")
      .maybeSingle();
    if (error) throw error;
    if (!payment) return { ok: false, status: 404, message: "Receipt not found." };
    const [row] = await enrichPayments(ready.client, [payment]);
    return {
      ok: true,
      data: {
        receiptCode: `RC${String(row.transactionCode || paymentId).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-8)}`,
        member: {
          fullName: row.memberName,
          memberId: row.memberCode || row.memberId,
          email: row.memberEmail,
          phone: row.memberPhone,
        },
        package: {
          name: row.packageName,
          type: row.packageType,
          trainerName: row.trainerName,
          schedule: row.selectedSchedule,
          startDate: row.packageStartDate,
          startDateLabel: formatDate(row.packageStartDate),
          endDate: row.packageEndDate,
          endDateLabel: formatDate(row.packageEndDate),
        },
        payment: {
          transactionCode: row.transactionCode,
          paymentDate: row.paymentDate,
          paymentDateLabel: formatDate(row.paymentDate),
          amount: row.amount,
          amountLabel: `${Number(row.amount || 0).toLocaleString("vi-VN")} VND`,
          method: String(row.paymentMethod || "").replace(/_/g, " "),
          status: "Paid",
        },
      },
    };
  } catch (error) {
    console.error("[Payment History] Failed to load receipt:", error);
    return { ok: false, status: 500, message: error.message || "Payment receipt could not be loaded." };
  }
}

export async function approvePaymentRequest(paymentId, reviewer = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const { data: payment, error: paymentError } = await client.from("payments").select("*").eq("payment_id", paymentId).maybeSingle();
    if (paymentError || !payment) return { ok: false, status: 404, message: "Payment request not found." };
    if (payment.payment_status === "paid") {
      const [request] = await enrichPayments(client, [payment]);
      return { ok: true, data: request, message: "Payment request was already approved." };
    }
    const { data: memberPackage, error: memberPackageError } = await client.from("member_packages").select("*").eq("member_package_id", payment.member_package_id).maybeSingle();
    if (memberPackageError || !memberPackage) return { ok: false, status: 404, message: "Member package not found." };
    const pkg = await fetchPackage(client, payment.package_id);
    const { error: rpcError } = await client.rpc("gymster_approve_payment_request", { target_payment_id: paymentId });
    if (rpcError) throw rpcError;
    const { data: updatedPackage, error: updatePackageError } = await client.from("member_packages").select("*").eq("member_package_id", memberPackage.member_package_id).single();
    if (updatePackageError) throw updatePackageError;
    const { data: updatedPayment, error: updatePaymentError } = await client.from("payments").select("*").eq("payment_id", payment.payment_id).single();
    if (updatePaymentError) throw updatePaymentError;
    const reviewerEmployeeId = await resolveReviewerEmployeeId(client, reviewer);
    if (reviewerEmployeeId) {
      updatedPayment.reviewed_by_employee_id = reviewerEmployeeId;
      await client.from("payments").update({ reviewed_by_employee_id: reviewerEmployeeId }).eq("payment_id", payment.payment_id);
    }
    await createAssignmentAndSessions(client, updatedPackage);
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
    if (error?.code === "PGRST202" || error?.code === "42883") {
      return {
        ok: false,
        status: 503,
        message: "Payment verification database upgrade is required. Run database/member_payment_verification_upgrade.sql.",
      };
    }
    return { ok: false, status: 500, message: error.message || "Payment request could not be approved." };
  }
}

export async function rejectPaymentRequest(paymentId, reason = "", reviewer = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;
  try {
    const { client } = ready;
    const { data: payment, error: paymentError } = await client.from("payments").select("*").eq("payment_id", paymentId).maybeSingle();
    if (paymentError || !payment) return { ok: false, status: 404, message: "Payment request not found." };
    const now = new Date().toISOString();
    const reviewerEmployeeId = await resolveReviewerEmployeeId(client, reviewer);
    const { data: updatedPayment, error } = await client.from("payments").update({
      payment_status: "failed",
      updated_at: now,
      rejection_reason: reason || "Payment not confirmed.",
      reviewed_at: now,
      reviewed_by_employee_id: reviewerEmployeeId,
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
