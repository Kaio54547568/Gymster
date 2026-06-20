import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { listPerformance } from "../../../backend/services/performanceService.js";

export async function GET(request) {
  const auth = await authenticateRequest(request, ["admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const url = new URL(request.url);
  try {
    const result = await listPerformance(auth.client, {
      periodStart: url.searchParams.get("periodStart") || "",
      periodEnd: url.searchParams.get("periodEnd") || "",
      role: url.searchParams.get("role") || "",
      search: url.searchParams.get("search") || "",
    });
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Performance data could not be loaded." }, { status: 500 });
  }
}
