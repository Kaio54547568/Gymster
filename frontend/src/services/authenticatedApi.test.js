import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticatedJson } from "./authenticatedApi";
import { supabase } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: "test-token" } },
        error: null,
      })),
    },
  },
}));

describe("authenticatedJson", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  it("returns a timeout error instead of waiting forever", async () => {
    global.fetch = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    }));

    const request = authenticatedJson("/api/staff/members", { timeoutMs: 10 });
    await vi.advanceTimersByTimeAsync(10);

    const result = await request;
    expect(result.error?.code).toBe("REQUEST_TIMEOUT");
  });

  it("also times out when Supabase session lookup never resolves", async () => {
    supabase.auth.getSession.mockImplementation(() => new Promise(() => {}));

    const request = authenticatedJson("/api/staff/members", { timeoutMs: 10 });
    await vi.advanceTimersByTimeAsync(10);
    const result = await Promise.race([
      request,
      Promise.resolve({ error: { code: "STILL_PENDING" } }),
    ]);

    expect(result.error?.code).toBe("REQUEST_TIMEOUT");
  });
});
