import { describe, expect, it } from "vitest";
import { isCheckInEligibleWorkoutStatus, isTodayInGymTimezone } from "../services/checkInService.js";

describe("isTodayInGymTimezone", () => {
  it("only allows check-in for the current gym date", () => {
    const now = new Date("2026-06-20T06:30:00.000Z");
    expect(isTodayInGymTimezone("2026-06-20", now)).toBe(true);
    expect(isTodayInGymTimezone("2026-06-19", now)).toBe(false);
    expect(isTodayInGymTimezone("2026-06-21", now)).toBe(false);
  });
});

describe("isCheckInEligibleWorkoutStatus", () => {
  it("allows booked/fixed sessions but rejects cancelled sessions", () => {
    expect(isCheckInEligibleWorkoutStatus("scheduled")).toBe(true);
    expect(isCheckInEligibleWorkoutStatus("completed")).toBe(true);
    expect(isCheckInEligibleWorkoutStatus("cancelled")).toBe(false);
    expect(isCheckInEligibleWorkoutStatus("canceled")).toBe(false);
  });
});
