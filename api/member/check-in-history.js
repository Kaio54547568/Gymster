import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { getMemberCheckInHistory } from "../../backend/services/checkInService.js";

export default async function handler(request, response) {
  if (request.method !== "GET") return response.status(405).json({ ok: false, message: "Method not allowed." });
  const auth = await authenticateRequest(request, ["member"]);
  if (!auth.ok) return response.status(auth.status).json(auth);
  try {
    const result = await getMemberCheckInHistory(auth.client, auth.user.user_id);
    return response.status(result.ok ? 200 : result.status || 400).json(result);
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message || "Check-in history could not be loaded." });
  }
}
