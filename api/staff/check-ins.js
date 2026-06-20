import { authenticateRequest } from "../../backend/services/requestAuthService.js";
import { checkInMember, listStaffCheckIns } from "../../backend/services/checkInService.js";

export default async function handler(request, response) {
  const auth = await authenticateRequest(request, ["staff", "admin", "owner"]);
  if (!auth.ok) return response.status(auth.status).json(auth);
  try {
    if (request.method === "GET") {
      const result = await listStaffCheckIns(auth.client, request.query?.date || "");
      return response.status(result.ok ? 200 : result.status || 400).json(result);
    }
    if (request.method === "POST") {
      const result = await checkInMember(auth.client, auth.employee, request.body?.memberId, request.body?.date);
      return response.status(result.ok ? 200 : result.status || 400).json(result);
    }
    return response.status(405).json({ ok: false, message: "Method not allowed." });
  } catch (error) {
    return response.status(500).json({ ok: false, message: error.message || "Check-in operation failed." });
  }
}
