import { handleStaffAiChat } from "../../../backend/services/staffAiChatService.js";
import { isMissingAnthropicApiKey } from "../../../backend/services/claudeService.js";

function json(payload, status = 200) {
  return Response.json(payload, { status });
}

export async function POST(request) {
  if (isMissingAnthropicApiKey()) {
    return json({
      error: "Missing ANTHROPIC_API_KEY.",
      reply: "Missing ANTHROPIC_API_KEY.",
      type: "error",
    }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON.", type: "error", reply: "Request body must be valid JSON." }, 400);
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    return json({ error: "message is required.", type: "error", reply: "message is required." }, 400);
  }

  try {
    const data = await handleStaffAiChat({
      message,
      pendingAction: payload.pendingAction || null,
      user: payload.user || null,
    });
    return json(data);
  } catch (error) {
    console.error("[Staff AI Chat] Failed to handle request:", error);
    return json({
      type: "error",
      intent: "unknown",
      error: "Staff AI chat request failed.",
      reply: error.message || "Staff AI chat request failed.",
    }, 500);
  }
}
