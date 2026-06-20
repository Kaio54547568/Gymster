import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { resolveMaintenanceActivity } from "../../../backend/services/staffActivityService.js";

export async function POST(request) {
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  if (parts.at(-1) !== "resolve") return Response.json({ ok: false, message: "Unknown maintenance action." }, { status: 404 });
  const id = decodeURIComponent(parts.at(-2));
  try {
    const result = await resolveMaintenanceActivity(auth.client, auth, id, await request.json());
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Maintenance report could not be resolved." }, { status: 500 });
  }
}
