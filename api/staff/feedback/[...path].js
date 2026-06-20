import { authenticateRequest } from "../../../backend/services/requestAuthService.js";
import { updateFeedbackActivity } from "../../../backend/services/staffActivityService.js";

export async function PUT(request) {
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) return Response.json(auth, { status: auth.status });
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const kind = parts.at(-2);
  const id = decodeURIComponent(parts.at(-1));
  try {
    const result = await updateFeedbackActivity(auth.client, auth, kind, id, await request.json());
    return Response.json(result, { status: result.ok ? 200 : result.status || 400 });
  } catch (error) {
    return Response.json({ ok: false, message: error.message || "Feedback could not be updated." }, { status: 500 });
  }
}
