import { requestRegistrationCode } from "../../../backend/services/authRegistrationService.js";

function json(payload, status = 200) {
  return Response.json(payload, { status });
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, message: "Request body must be valid JSON." }, 400);
  }

  const result = await requestRegistrationCode(payload);
  return json(result, result.ok ? 200 : 400);
}
