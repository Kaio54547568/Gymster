import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { getEmployeePerformance } from "../../../backend/services/performanceService.js";

export async function GET(request) {
  const auth = await authenticateRequest(request, ["admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const url = new URL(request.url);
  const employeeId = decodeURIComponent(url.pathname.split("/").filter(Boolean).at(-1));
  try {
    const result = await getEmployeePerformance(auth.client, employeeId, {
      periodStart: url.searchParams.get("periodStart") || "",
      periodEnd: url.searchParams.get("periodEnd") || "",
    });
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Performance detail could not be loaded." }, { status: 500 });
  }
}
