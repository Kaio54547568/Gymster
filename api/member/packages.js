import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { listAvailablePackages } from "../../backend/services/packagePromotionService.js";

export async function GET(request) {
  const auth = await authenticateRequest(request, ["member", "admin", "owner", "staff"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  try {
    return Response.json(await listAvailablePackages(auth.client, String(auth.user.role || "").toLowerCase()));
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Packages could not be loaded." }, { status: 500 });
  }
}
