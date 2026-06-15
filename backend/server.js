import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { handleAiChat } from "./services/aiChatService.js";
import { createClaudeMessage, isMissingAnthropicApiKey } from "./services/claudeService.js";
import { handleStaffAiChat } from "./services/staffAiChatService.js";
import {
  loginWithPassword,
  requestRegistrationCode,
  verifyRegistrationCode,
  requestPasswordResetCode,
  verifyPasswordResetCode,
  resetPasswordWithCode,
} from "./services/authRegistrationService.js";
import {
  createTrainingRequestServer,
  updateTrainingRequestStatusServer,
} from "./services/trainingRequestService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number(process.env.PORT || 3001);
const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

async function handleClaudeMessage(request, response) {
  if (isMissingAnthropicApiKey()) {
    sendJson(response, 500, {
      error: "Missing ANTHROPIC_API_KEY in backend/.env.",
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const prompt = String(payload.prompt || "").trim();
  if (!prompt) {
    sendJson(response, 400, { error: "prompt is required." });
    return;
  }

  try {
    const data = await createClaudeMessage({
      prompt,
      system: payload.system,
      model: payload.model,
      maxTokens: payload.maxTokens,
    });

    sendJson(response, 200, data);
  } catch (error) {
    console.error("[Claude API] Failed to create message:", error);
    sendJson(response, 502, {
      error: "Claude API request failed.",
      message: error.message,
    });
  }
}

async function handleAiChatRequest(request, response) {
  if (isMissingAnthropicApiKey()) {
    sendJson(response, 500, {
      error: "Missing ANTHROPIC_API_KEY in backend/.env.",
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
    return;
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    sendJson(response, 400, { error: "message is required." });
    return;
  }

  try {
    const data = await handleAiChat({
      message,
      pendingAction: payload.pendingAction || null,
      user: payload.user || null,
    });
    sendJson(response, 200, data);
  } catch (error) {
    console.error("[AI Chat] Failed to handle request:", error);
    sendJson(response, 500, {
      type: "error",
      error: "AI chat request failed.",
      reply: error.message || "AI chat request failed.",
    });
  }
}

async function handleStaffAiChatRequest(request, response) {
  if (isMissingAnthropicApiKey()) {
    sendJson(response, 500, {
      error: "Missing ANTHROPIC_API_KEY in backend/.env.",
      reply: "Missing ANTHROPIC_API_KEY in backend/.env.",
      type: "error",
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, { error: error.message, type: "error", reply: error.message });
    return;
  }

  const message = String(payload.message || "").trim();
  if (!message) {
    sendJson(response, 400, { error: "message is required.", type: "error", reply: "message is required." });
    return;
  }

  try {
    const data = await handleStaffAiChat({
      message,
      pendingAction: payload.pendingAction || null,
      user: payload.user || null,
    });
    sendJson(response, 200, data);
  } catch (error) {
    console.error("[Staff AI Chat] Failed to handle request:", error);
    sendJson(response, 500, {
      type: "error",
      intent: "unknown",
      error: "Staff AI chat request failed.",
      reply: error.message || "Staff AI chat request failed.",
    });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/claude/messages") {
    await handleClaudeMessage(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ai/chat") {
    await handleAiChatRequest(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/staff/ai/chat") {
    await handleStaffAiChatRequest(request, response);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await loginWithPassword(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/register/request-code") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await requestRegistrationCode(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/register/verify-code") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await verifyRegistrationCode(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/password-reset/request-code") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await requestPasswordResetCode(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/password-reset/verify-code") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await verifyPasswordResetCode(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/password-reset/reset") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await resetPasswordWithCode(payload);
    sendJson(response, result.ok ? 200 : 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/training-requests") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await createTrainingRequestServer(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/training-requests/status") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await updateTrainingRequestStatusServer(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});
