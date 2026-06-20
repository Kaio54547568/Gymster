import { getStaffPaymentReceipt } from "../../../backend/services/paymentRequestService.js";
import { authenticateRequest } from "../../../backend/services/requestAuthService.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) {
    response.status(auth.status).json(auth);
    return;
  }
  const pathValue = Array.isArray(request.query?.path) ? request.query.path : [request.query?.path].filter(Boolean);
  const [paymentId, action] = pathValue;
  if (!paymentId || action !== "receipt") {
    response.status(404).json({ ok: false, message: "Payment receipt route not found." });
    return;
  }
  const result = await getStaffPaymentReceipt(paymentId, auth.client);
  response.status(result.ok ? 200 : result.status || 400).json(result);
}
