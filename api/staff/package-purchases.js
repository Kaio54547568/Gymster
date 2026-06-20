import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { completeStaffPackagePurchase } from "../../backend/services/packagePromotionService.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) {
    response.status(auth.status).json(auth);
    return;
  }
  try {
    const result = await completeStaffPackagePurchase(auth.client, request.body || {});
    response.status(result.ok ? 201 : result.status || 400).json(result);
  } catch (error) {
    response.status(500).json({ ok: false, message: error.message || "Package purchase could not be completed." });
  }
}
