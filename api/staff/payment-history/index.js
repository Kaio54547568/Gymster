import { listStaffPaymentHistory } from "../../../backend/services/paymentRequestService.js";
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
  const result = await listStaffPaymentHistory(auth.client);
  response.status(result.ok ? 200 : result.status || 400).json(result);
}
