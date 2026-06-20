import { afterEach, describe, expect, it, vi } from "vitest";
import { registerMemberAccount } from "./userApi";

describe("registerMemberAccount", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts registration data to the direct registration endpoint", async () => {
    const payload = { email: "member@example.com", username: "member01" };
    const response = { ok: true, user: { email: payload.email } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(response),
    });

    await expect(registerMemberAccount(payload)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });
});
