import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { updatePerformanceReview } from "../../../backend/services/performanceService.js";

export async function PUT(request) {
  const auth = await authenticateRequest(request, ["admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const id = decodeURIComponent(new URL(request.url).pathname.split("/").filter(Boolean).at(-1));
  try {
    const payload = await request.json();
    const result = await updatePerformanceReview(auth.client, id, payload);
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Performance review could not be updated." }, { status: 500 });
  }
}
