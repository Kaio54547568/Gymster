import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import server from "../server.js";

// Mock all services that access database or external API
import * as authService from "../services/authRegistrationService.js";
import * as trainingService from "../services/trainingRequestService.js";
import * as claudeService from "../services/claudeService.js";
import * as aiChatService from "../services/aiChatService.js";
import * as staffAiChatService from "../services/staffAiChatService.js";

vi.mock("../services/authRegistrationService.js", () => ({
  loginWithPassword: vi.fn(),
  requestRegistrationCode: vi.fn(),
  verifyRegistrationCode: vi.fn(),
}));

vi.mock("../services/trainingRequestService.js", () => ({
  createTrainingRequestServer: vi.fn(),
  updateTrainingRequestStatusServer: vi.fn(),
}));

vi.mock("../services/claudeService.js", () => ({
  createClaudeMessage: vi.fn(),
  isMissingAnthropicApiKey: vi.fn(() => false),
}));

vi.mock("../services/aiChatService.js", () => ({
  handleAiChat: vi.fn(),
}));

vi.mock("../services/staffAiChatService.js", () => ({
  handleStaffAiChat: vi.fn(),
}));

describe("GET /api/health", () => {
  it("should return ok: true", async () => {
    const res = await request(server).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when identifier or password is empty", async () => {
    authService.loginWithPassword.mockResolvedValue({ ok: false, message: "Username, email, and password are required." });

    const res = await request(server)
      .post("/api/auth/login")
      .send({ identifier: "", password: "" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ ok: false, message: "Username, email, and password are required." });
  });

  it("should return 200 when login succeeds", async () => {
    const mockUser = { id: "user-123", email: "test@example.com", role: "member" };
    authService.loginWithPassword.mockResolvedValue({ ok: true, user: mockUser });

    const res = await request(server)
      .post("/api/auth/login")
      .send({ identifier: "test@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, user: mockUser });
    expect(authService.loginWithPassword).toHaveBeenCalledWith({
      identifier: "test@example.com",
      password: "Password123!"
    });
  });
});

describe("POST /api/auth/register/request-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with verification details on success", async () => {
    const mockPayload = { email: "test@example.com", username: "testuser" };
    authService.requestRegistrationCode.mockResolvedValue({
      ok: true,
      email: "test@example.com",
      message: "Verification code generated."
    });

    const res = await request(server)
      .post("/api/auth/register/request-code")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.message).toBe("Verification code generated.");
    expect(authService.requestRegistrationCode).toHaveBeenCalledWith(mockPayload);
  });
});

describe("POST /api/auth/register/verify-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 on successful verification", async () => {
    const mockPayload = { email: "test@example.com", code: "123456" };
    const mockUser = { id: "user-123", email: "test@example.com", role: "member" };
    authService.verifyRegistrationCode.mockResolvedValue({
      ok: true,
      user: mockUser,
      message: "Account verified and created successfully."
    });

    const res = await request(server)
      .post("/api/auth/register/verify-code")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user).toEqual(mockUser);
  });
});

describe("POST /api/training-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a training request", async () => {
    const mockPayload = { memberId: "m1", ptId: "pt1" };
    trainingService.createTrainingRequestServer.mockResolvedValue({
      ok: true,
      data: { id: "tr-1" }
    });

    const res = await request(server)
      .post("/api/training-requests")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(trainingService.createTrainingRequestServer).toHaveBeenCalledWith(mockPayload);
  });
});

describe("POST /api/training-requests/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update training request status", async () => {
    const mockPayload = { requestId: "tr-1", status: "accepted" };
    trainingService.updateTrainingRequestStatusServer.mockResolvedValue({
      ok: true,
      message: "Status updated"
    });

    const res = await request(server)
      .post("/api/training-requests/status")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(trainingService.updateTrainingRequestStatusServer).toHaveBeenCalledWith(mockPayload);
  });
});

describe("AI and Claude Chat routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call claudeService when posting to /api/claude/messages", async () => {
    claudeService.createClaudeMessage.mockResolvedValue({ response: "Hello" });
    const res = await request(server)
      .post("/api/claude/messages")
      .send({ prompt: "Hello Claude" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ response: "Hello" });
  });

  it("should call aiChatService when posting to /api/ai/chat", async () => {
    aiChatService.handleAiChat.mockResolvedValue({ reply: "Hi there" });
    const res = await request(server)
      .post("/api/ai/chat")
      .send({ message: "Hi" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: "Hi there" });
  });

  it("should return 500 when ANTHROPIC_API_KEY is missing", async () => {
    claudeService.isMissingAnthropicApiKey.mockReturnValueOnce(true);
    const res = await request(server)
      .post("/api/claude/messages")
      .send({ prompt: "Hello Claude" });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain("Missing ANTHROPIC_API_KEY");
  });
});

describe("404 Not Found", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(server).get("/api/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found." });
  });
});
