import { createClaudeMessage, isMissingAnthropicApiKey } from "../../backend/services/claudeService.js";

function json(payload, status = 200) {
  return Response.json(payload, { status });
}

export async function POST(request) {
  if (isMissingAnthropicApiKey()) {
    return json({ error: "Missing ANTHROPIC_API_KEY." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    return json({ error: "prompt is required." }, 400);
  }

  try {
    const data = await createClaudeMessage({
      prompt,
      system: payload.system,
      model: payload.model,
      maxTokens: payload.maxTokens,
    });
    return json(data);
  } catch (error) {
    console.error("[Claude API] Failed to create message:", error);
    return json({
      error: "Claude API request failed.",
      message: error.message,
    }, 502);
  }
}
