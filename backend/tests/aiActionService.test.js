import { afterEach, describe, expect, it } from "vitest";
import { createBooking } from "../services/aiActionService.js";

const envSnapshot = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

function futureDate(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("AI member booking", () => {
  afterEach(() => {
    for (const [key, value] of Object.entries(envSnapshot)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("creates a scheduled workout session when Supabase is not configured", async () => {
    process.env.SUPABASE_URL = "";
    process.env.VITE_SUPABASE_URL = "";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "";
    process.env.SUPABASE_ANON_KEY = "";
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "";

    const result = await createBooking(
      { id: "00000000-0000-4000-8000-000000000005", role: "member" },
      { date: futureDate(), time: "10:00", note: "AI test booking" },
    );

    expect(result).toMatchObject({
      title: "Personal workout",
      time: "10:00",
      endTime: "12:00",
      status: "scheduled",
      room: "Personal workout",
    });
    expect(result.sessionId).toMatch(/^local-session-/);
    expect(result.requestId).toBeUndefined();
  });
});
