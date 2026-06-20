import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { createMaintenanceActivity } from "../../../backend/services/staffActivityService.js";

export async function POST(request) {
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  try {
    const result = await createMaintenanceActivity(auth.client, auth, await request.json());
    return Response.json(result, { status: result.ok ? 201 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Maintenance report could not be created." }, { status: 500 });
  }
}
