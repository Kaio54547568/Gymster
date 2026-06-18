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
import {
  checkEmployeeCodeUnique,
  createAdminStaff,
  getAdminStaffDetail,
} from "./services/adminStaffService.js";
import {
  createEquipment,
  deleteEquipment,
  getEquipmentStats,
  listEquipments,
  updateEquipment,
} from "./services/equipmentService.js";
import {
  getProgressForMember,
  listProgressMembers,
  saveProgressEvaluation,
  updateProgressEvaluation,
} from "./services/progressService.js";
import {
  getMemberReceipt,
  getMemberReceiptPdf,
  listMemberReceipts,
} from "./services/memberReceiptService.js";
import {
  approvePaymentRequest,
  createPackagePaymentRequest,
  listStaffPaymentRequests,
  rejectPaymentRequest,
} from "./services/paymentRequestService.js";

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

function sendPdf(response, filename, buffer) {
  response.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": buffer.length,
  });
  response.end(buffer);
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

  if (request.method === "GET" && url.pathname === "/api/admin/staff/employee-code") {
    const result = await checkEmployeeCodeUnique(url.searchParams.get("code") || "");
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && ["/api/equipments", "/equipments"].includes(url.pathname)) {
    const result = await listEquipments();
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && ["/api/equipments/stats", "/equipments/stats"].includes(url.pathname)) {
    const result = await getEquipmentStats();
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && ["/api/progress/members", "/progress/members"].includes(url.pathname)) {
    const result = await listProgressMembers(url.searchParams.get("trainerId") || url.searchParams.get("trainer_id") || "");
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && ["/api/member/receipts", "/member/receipts"].includes(url.pathname)) {
    const result = await listMemberReceipts(Object.fromEntries(url.searchParams.entries()));
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && ["/api/staff/payment-requests", "/staff/payment-requests"].includes(url.pathname)) {
    const result = await listStaffPaymentRequests();
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && (url.pathname.startsWith("/api/member/receipts/") || url.pathname.startsWith("/member/receipts/"))) {
    const prefix = url.pathname.startsWith("/api/member/receipts/") ? "/api/member/receipts/" : "/member/receipts/";
    const suffix = decodeURIComponent(url.pathname.replace(prefix, ""));
    const isPdf = suffix.endsWith("/pdf");
    const id = isPdf ? suffix.slice(0, -4) : suffix;
    if (isPdf) {
      const result = await getMemberReceiptPdf(id, Object.fromEntries(url.searchParams.entries()));
      if (!result.ok) {
        sendJson(response, result.status || 400, result);
        return;
      }
      sendPdf(response, result.filename, result.buffer);
      return;
    }

    const result = await getMemberReceipt(id, Object.fromEntries(url.searchParams.entries()));
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && (url.pathname.startsWith("/api/progress/member/") || url.pathname.startsWith("/progress/member/"))) {
    const prefix = url.pathname.startsWith("/api/progress/member/") ? "/api/progress/member/" : "/progress/member/";
    const memberId = decodeURIComponent(url.pathname.replace(prefix, ""));
    const result = await getProgressForMember(memberId, url.searchParams.get("trainerId") || url.searchParams.get("trainer_id") || "");
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && ["/api/equipments", "/equipments"].includes(url.pathname)) {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }
    const result = await createEquipment(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && ["/api/progress", "/progress"].includes(url.pathname)) {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await saveProgressEvaluation(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && ["/api/member/package-payment-request", "/member/package-payment-request"].includes(url.pathname)) {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }
    const result = await createPackagePaymentRequest(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && (url.pathname.startsWith("/api/staff/payment-requests/") || url.pathname.startsWith("/staff/payment-requests/"))) {
    const prefix = url.pathname.startsWith("/api/staff/payment-requests/") ? "/api/staff/payment-requests/" : "/staff/payment-requests/";
    const suffix = decodeURIComponent(url.pathname.replace(prefix, ""));
    const [id, action] = suffix.split("/");
    let payload = {};
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }
    const result = action === "approve"
      ? await approvePaymentRequest(id)
      : action === "reject"
        ? await rejectPaymentRequest(id, payload.reason || "")
        : { ok: false, status: 404, message: "Unknown payment request action." };
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "PUT" && (url.pathname.startsWith("/api/progress/") || url.pathname.startsWith("/progress/"))) {
    const prefix = url.pathname.startsWith("/api/progress/") ? "/api/progress/" : "/progress/";
    const id = decodeURIComponent(url.pathname.replace(prefix, ""));
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await updateProgressEvaluation(id, payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if ((request.method === "PUT" || request.method === "DELETE") && (url.pathname.startsWith("/api/equipments/") || url.pathname.startsWith("/equipments/"))) {
    const prefix = url.pathname.startsWith("/api/equipments/") ? "/api/equipments/" : "/equipments/";
    const id = decodeURIComponent(url.pathname.replace(prefix, ""));
    if (request.method === "DELETE") {
      const result = await deleteEquipment(id);
      sendJson(response, result.ok ? 200 : result.status || 400, result);
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }
    const result = await updateEquipment(id, payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/admin/staff/")) {
    const id = decodeURIComponent(url.pathname.replace("/api/admin/staff/", ""));
    const result = await getAdminStaffDetail(id, url.searchParams.get("role") || "");
    sendJson(response, result.ok ? 200 : result.status || 400, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/staff") {
    let payload;
    try {
      payload = await readJsonBody(request);
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error.message });
      return;
    }

    const result = await createAdminStaff(payload);
    sendJson(response, result.ok ? 200 : result.status || 400, result);
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

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Backend API listening on http://localhost:${PORT}`);
  });
}

export default server;
