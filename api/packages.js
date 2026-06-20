import { authenticateRequest } from "../backend/services/requestAuthService.js";
import { listAvailablePackages } from "../backend/services/packagePromotionService.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  const auth = await authenticateRequest(request, ["member", "staff", "admin", "owner"]);
  if (!auth.ok) {
    response.status(auth.status).json(auth);
    return;
  }
  try {
    const result = await listAvailablePackages(auth.client, String(auth.user.role || "").toLowerCase());
    response.status(result.ok ? 200 : result.status || 400).json(result);
  } catch (error) {
    response.status(500).json({ ok: false, message: error.message || "Packages could not be loaded." });
  }
}
