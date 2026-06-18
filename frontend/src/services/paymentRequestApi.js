import { getCurrentUser } from "./authService";
import { createLocalNotification, notifyPtPortalDataChanged } from "./notificationApi";

const LOCAL_PAYMENT_REQUESTS_KEY = "gymster_local_payment_requests";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocalRequests() {
  if (!canUseStorage()) return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(LOCAL_PAYMENT_REQUESTS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    window.localStorage.removeItem(LOCAL_PAYMENT_REQUESTS_KEY);
    return [];
  }
}

function writeLocalRequests(rows) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_PAYMENT_REQUESTS_KEY, JSON.stringify(rows));
}

function isMissingBackendConfig(error) {
  return String(error?.message || "").toLowerCase().includes("missing supabase service configuration");
}

function createLocalPaymentRequest(payload) {
  const currentUser = getCurrentUser() || {};
  const now = new Date().toISOString();
  const paymentId = `local-payment-request-${Date.now()}`;
  const request = {
    id: paymentId,
    paymentId,
    transactionCode: `LOCAL-PAYREQ-${Date.now()}`,
    memberId: currentUser.memberId || currentUser.member_id || currentUser.id || "",
    memberName: currentUser.fullName || currentUser.full_name || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.username || "Member",
    memberEmail: currentUser.email || "",
    memberPhone: currentUser.phone || currentUser.phone_number || "",
    packageId: payload.packageId,
    packageName: payload.packageName || payload.selectedPackageName || "Selected package",
    memberPackageId: `local-member-package-${Date.now()}`,
    trainerId: payload.trainerId || "",
    trainerName: payload.trainerName || "",
    selectedSchedule: payload.selectedSchedule || payload.selectedSlot?.label || "",
    selectedSlots: payload.selectedSlots || [],
    amount: Number(payload.amount || 0),
    paymentMethod: payload.paymentMethod || "Bank Transfer",
    paymentStatus: "pending",
    status: "pending",
    createdAt: now,
    createdLabel: new Date(now).toLocaleDateString("en-GB"),
    source: "local",
  };
  writeLocalRequests([request, ...readLocalRequests()]);
  return request;
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    return { data: null, error: new Error(data.message || data.error || "Payment request failed.") };
  }
  return { data: data.data ?? data, error: null };
}

export async function createPackagePaymentRequest(payload) {
  const currentUser = getCurrentUser() || {};
  const result = await requestJson("/api/member/package-payment-request", {
    method: "POST",
    body: JSON.stringify({
      userId: currentUser.userId || currentUser.user_id || currentUser.id,
      memberId: currentUser.memberId || currentUser.member_id,
      memberEmail: currentUser.email,
      ...payload,
    }),
  });
  if (result.error && isMissingBackendConfig(result.error)) {
    return { data: createLocalPaymentRequest(payload), error: null };
  }
  return result;
}

export async function getStaffPaymentRequests() {
  const result = await requestJson("/api/staff/payment-requests");
  if (result.error && isMissingBackendConfig(result.error)) {
    return { data: readLocalRequests().filter((request) => request.paymentStatus === "pending"), error: null };
  }
  return result;
}

export async function approveStaffPaymentRequest(paymentId) {
  const result = await requestJson(`/api/staff/payment-requests/${encodeURIComponent(paymentId)}/approve`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (result.error && isMissingBackendConfig(result.error)) {
    const now = new Date().toISOString();
    const rows = readLocalRequests().map((request) => request.paymentId === paymentId ? {
      ...request,
      paymentStatus: "paid",
      status: "approved",
      approvedAt: now,
      updatedAt: now,
    } : request);
    writeLocalRequests(rows);
    const approvedRequest = rows.find((request) => request.paymentId === paymentId) || null;
    if (approvedRequest?.trainerId) {
      createLocalNotification({
        trainerId: approvedRequest.trainerId,
        notificationType: "payment",
        type: "success",
        title: "Bạn có hội viên mới đăng ký gói tập",
        message: `Bạn có hội viên mới đăng ký gói tập: ${approvedRequest.memberName || "Member"}`,
        actionType: "new_pt_member",
        actionPayload: {
          paymentId: approvedRequest.paymentId,
          memberId: approvedRequest.memberId,
          packageId: approvedRequest.packageId,
          trainerId: approvedRequest.trainerId,
        },
      });
      notifyPtPortalDataChanged({ reason: "payment-request-approved", request: approvedRequest });
    }
    return { data: approvedRequest, error: null };
  }
  return result;
}

export async function rejectStaffPaymentRequest(paymentId, reason = "") {
  const result = await requestJson(`/api/staff/payment-requests/${encodeURIComponent(paymentId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  if (result.error && isMissingBackendConfig(result.error)) {
    const rows = readLocalRequests().map((request) => request.paymentId === paymentId ? { ...request, paymentStatus: "failed", status: "rejected", rejectReason: reason } : request);
    writeLocalRequests(rows);
    return { data: rows.find((request) => request.paymentId === paymentId) || null, error: null };
  }
  return result;
}
