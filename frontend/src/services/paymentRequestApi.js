import { setCurrentUser } from "./authService";
import { authenticatedJson } from "./authenticatedApi";

export async function completeDemoPayment(payload) {
  const result = await authenticatedJson("/api/member/demo-payment-complete", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
    }),
  });
  if (!result.error && result.data?.user) {
    setCurrentUser(result.data.user);
  }
  return result;
}

export function getStaffPaymentHistory() {
  return authenticatedJson("/api/staff/payment-history");
}

export function getStaffPaymentReceipt(paymentId) {
  return authenticatedJson(`/api/staff/payment-history/${encodeURIComponent(paymentId)}/receipt`);
}
