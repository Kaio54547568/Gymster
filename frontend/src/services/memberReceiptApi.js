import { getCurrentUser } from "./authService";

function currentMemberQuery() {
  const user = getCurrentUser() || {};
  const params = new URLSearchParams();
  const memberId = user.memberId || user.member_id;
  const userId = user.userId || user.user_id || user.id;
  if (memberId) params.set("memberId", memberId);
  if (userId) params.set("userId", userId);
  if (user.email) params.set("email", user.email);
  if (user.username) params.set("username", user.username);
  return params;
}

async function receiptJson(path) {
  const response = await fetch(path);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(data?.message || data?.error || "Receipt request failed.");
  }
  return data;
}

export async function getMemberReceipts() {
  const params = currentMemberQuery();
  const data = await receiptJson(`/api/member/receipts?${params.toString()}`);
  return data.data || [];
}

export async function getMemberReceiptDetail(id) {
  const params = currentMemberQuery();
  const data = await receiptJson(`/api/member/receipts/${encodeURIComponent(id)}?${params.toString()}`);
  return data.data || null;
}

export async function downloadMemberReceiptPdf(id, fallbackReceiptCode = "") {
  const params = currentMemberQuery();
  const response = await fetch(`/api/member/receipts/${encodeURIComponent(id)}/pdf?${params.toString()}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || "Receipt PDF could not be downloaded.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || `Receipt_${fallbackReceiptCode || id}.pdf`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
