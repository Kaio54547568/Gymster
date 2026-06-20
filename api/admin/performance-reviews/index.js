import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { createPerformanceReview } from "../../../backend/services/performanceService.js";

export async function POST(request) {
  const auth = await authenticateRequest(request, ["admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  try {
    const payload = await request.json();
    const result = await createPerformanceReview(auth.client, auth.user.user_id, payload);
    return Response.json(result, { status: result.ok ? 201 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Performance review could not be created." }, { status: 500 });
  }
}
