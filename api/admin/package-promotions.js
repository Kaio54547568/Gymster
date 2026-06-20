import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { createPackagePromotion } from "../../backend/services/packagePromotionService.js";

export async function POST(request) {
  const auth = await authenticateRequest(request, ["admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  try {
    const result = await createPackagePromotion(auth.client, auth.user.user_id, await request.json());
    return Response.json(result, { status: result.ok ? 201 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Promotion could not be created." }, { status: 500 });
  }
}
