import { afterEach, describe, expect, it, vi } from "vitest";
import { completeDemoPayment } from "./paymentRequestApi";
import { authenticatedJson } from "./authenticatedApi";

vi.mock("./authenticatedApi", () => ({
  authenticatedJson: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("completeDemoPayment", () => {
  it("uses the immediate checkout endpoint and returns the active server user", async () => {
    const activeUser = { id: "user-1", accountStatus: "Active", account_status: "active" };
    authenticatedJson.mockResolvedValue({
      data: { user: activeUser, payment: { payment_id: "payment-1" } },
      error: null,
    });

    const result = await completeDemoPayment({ packageId: "package-1", checkoutKey: "checkout-1" });

    expect(authenticatedJson).toHaveBeenCalledWith("/api/member/demo-payment-complete", expect.objectContaining({
      method: "POST",
    }));
    expect(result.data.user).toEqual(activeUser);
    expect(result.error).toBeNull();
  });
});
