import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { approvePaymentRequest, rejectPaymentRequest } from "../../../backend/services/paymentRequestService.js";

export async function POST(request) {
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const action = parts.at(-1);
  const id = decodeURIComponent(parts.at(-2));
  const payload = await request.json().catch(() => ({}));
  const reviewer = { employeeId: auth.employee?.employee_id, userId: auth.user.user_id };
  const result = action === "approve"
    ? await approvePaymentRequest(id, reviewer)
    : action === "reject"
      ? await rejectPaymentRequest(id, payload.reason || "", reviewer)
      : { ok: false, status: 404, message: "Unknown payment request action." };
  return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
}
