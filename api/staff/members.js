import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { createMemberByStaff } from "../../backend/services/memberOperationsService.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ ok: false, message: "Method not allowed." });
    return;
  }
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) {
    response.status(auth.status).json(auth);
    return;
  }
  try {
    const result = await createMemberByStaff(request.body || {}, auth.client);
    response.status(result.ok ? 201 : result.status || 400).json(result);
  } catch (error) {
    response.status(500).json({ ok: false, message: error.message || "Failed to register member." });
  }
}
