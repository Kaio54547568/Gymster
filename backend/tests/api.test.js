import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import server from "../server.js";

// Mock all services that access database or external API
import * as authService from "../services/authRegistrationService.js";
import * as trainingService from "../services/trainingRequestService.js";
import * as claudeService from "../services/claudeService.js";
import * as aiChatService from "../services/aiChatService.js";
import * as staffAiChatService from "../services/staffAiChatService.js";
import * as paymentService from "../services/paymentRequestService.js";
import * as requestAuthService from "../services/requestAuthService.js";
import * as packagePromotionService from "../services/packagePromotionService.js";
import * as trainerDirectoryService from "../services/trainerDirectoryService.js";

vi.mock("../services/authRegistrationService.js", () => ({
  loginWithPassword: vi.fn(),
  registerMemberAccount: vi.fn(),
  registerAccount: vi.fn(),
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

vi.mock("../services/paymentRequestService.js", () => ({
  completeDemoPayment: vi.fn(),
  getStaffPaymentReceipt: vi.fn(),
  listStaffPaymentHistory: vi.fn(),
}));

vi.mock("../services/requestAuthService.js", () => ({
  authenticateRequest: vi.fn(() => Promise.resolve({ ok: false, status: 401, message: "Authentication is required." })),
  getServiceClient: vi.fn(() => null),
}));

vi.mock("../services/packagePromotionService.js", () => ({
  listAvailablePackages: vi.fn(),
}));

vi.mock("../services/trainerDirectoryService.js", () => ({
  listActiveTrainers: vi.fn(),
}));

describe("GET /api/health", () => {
  it("should return ok: true", async () => {
    const res = await request(server).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe.each(["/api/packages", "/api/member/packages"])("GET %s", (path) => {
  it("returns role-aware packages for an authenticated staff user", async () => {
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: true,
      client: {},
      user: { user_id: "user-1", role: "staff" },
    });
    packagePromotionService.listAvailablePackages.mockResolvedValue({
      ok: true,
      data: [{ package_id: "package-1", package_name: "Gym Access" }],
    });

    const res = await request(server)
      .get(path)
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(packagePromotionService.listAvailablePackages).toHaveBeenCalledWith({}, "staff");
  });
});

describe("GET /api/trainers", () => {
  it("returns active trainers through the authenticated backend", async () => {
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: true,
      client: {},
      user: { user_id: "user-1", role: "staff" },
    });
    trainerDirectoryService.listActiveTrainers.mockResolvedValue({
      ok: true,
      data: [{ id: "trainer-1", name: "Trainer One" }],
    });

    const res = await request(server)
      .get("/api/trainers")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe("trainer-1");
  });
});

describe("GET /api/admin/performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: false,
      status: 401,
      message: "Authentication is required.",
    });
  });

  it("rejects requests without a bearer token", async () => {
    const res = await request(server)
      .get("/api/admin/performance")
      .query({ periodStart: "2026-06-01", periodEnd: "2026-06-30" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Authentication is required.");
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

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a member account without email verification", async () => {
    const mockPayload = {
      firstName: "Test",
      lastName: "Member",
      username: "testmember",
      email: "test@example.com",
      password: "Password123!",
      phone: "0912345678",
      dob: "2000-01-01",
      gender: "male",
    };
    const mockUser = { id: "user-123", email: "test@example.com", role: "member" };
    authService.registerAccount.mockResolvedValue({
      ok: true,
      user: mockUser,
      message: "Account created successfully.",
    });

    const res = await request(server)
      .post("/api/auth/register")
      .send(mockPayload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      user: mockUser,
      message: "Account created successfully.",
    });
    expect(authService.registerAccount).toHaveBeenCalledWith(mockPayload);
  });

  it("passes through conflict status and message from the register service", async () => {
    authService.registerAccount.mockResolvedValue({
      ok: false,
      status: 409,
      message: "Phone number already exists.",
    });

    const res = await request(server)
      .post("/api/auth/register")
      .send({
        firstName: "Test",
        lastName: "Member",
        username: "testmember",
        email: "test@example.com",
        password: "Password123!",
        phone: "0912345678",
        dob: "2000-01-01",
        gender: "male",
        occupation: "Student",
        address: "Hanoi",
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Phone number already exists.");
  });
});

describe("immediate demo payment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: false,
      status: 401,
      message: "Authentication is required.",
    });
  });

  it("rejects checkout without a bearer token", async () => {
    const res = await request(server)
      .post("/api/member/demo-payment-complete")
      .send({ packageId: "package-1", checkoutKey: "checkout-1" });

    expect(res.status).toBe(401);
    expect(paymentService.completeDemoPayment).not.toHaveBeenCalled();
  });

  it("completes member checkout through the atomic payment service", async () => {
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: true,
      user: { user_id: "user-1", role: "member" },
    });
    paymentService.completeDemoPayment.mockResolvedValue({
      ok: true,
      data: {
        user: { id: "user-1", account_status: "active" },
        payment: { payment_id: "payment-1", payment_status: "paid" },
      },
    });

    const res = await request(server)
      .post("/api/member/demo-payment-complete")
      .send({ packageId: "package-1", checkoutKey: "checkout-1" });

    expect(res.status).toBe(200);
    expect(res.body.data.payment.payment_status).toBe("paid");
    expect(paymentService.completeDemoPayment).toHaveBeenCalledWith(expect.objectContaining({
      packageId: "package-1",
      checkoutKey: "checkout-1",
      userId: "user-1",
    }));
  });

  it("lists paid transactions for staff payment history", async () => {
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: true,
      client: {},
      user: { user_id: "user-1", role: "staff" },
    });
    paymentService.listStaffPaymentHistory.mockResolvedValue({
      ok: true,
      data: [{ paymentId: "payment-1", paymentStatus: "paid" }],
    });

    const res = await request(server).get("/api/staff/payment-history");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(paymentService.listStaffPaymentHistory).toHaveBeenCalledWith({});
  });

  it("rejects payment history without an authenticated staff session", async () => {
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: false,
      status: 401,
      message: "Authentication is required.",
    });

    const res = await request(server).get("/api/staff/payment-history");

    expect(res.status).toBe(401);
    expect(paymentService.listStaffPaymentHistory).not.toHaveBeenCalled();
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
