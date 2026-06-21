import { describe, expect, it } from "vitest";
import {
  buildWeeklyWorkoutSessionRows,
  isDemoCheckoutMigrationError,
  validateDemoCheckoutSelection,
  validatePaymentProofMetadata,
} from "../services/paymentRequestService.js";

describe("isDemoCheckoutMigrationError", () => {
  it("recognizes a missing checkout column as an incomplete migration", () => {
    expect(isDemoCheckoutMigrationError({
      code: "42703",
      message: 'column "selected_schedule" does not exist',
    })).toBe(true);
  });
});

describe("validateDemoCheckoutSelection", () => {
  it("requires a trainer and weekly slots for PT packages", () => {
    expect(validateDemoCheckoutSelection({
      hasPersonalTrainer: true,
      trainerId: "",
      selectedSlots: [],
    })).toEqual({
      ok: false,
      message: "Trainer is required for this package.",
    });
  });

  it("accepts a regular package without a trainer or schedule", () => {
    expect(validateDemoCheckoutSelection({
      hasPersonalTrainer: false,
      trainerId: "",
      selectedSlots: [],
    })).toEqual({ ok: true });
  });
});

describe("validatePaymentProofMetadata", () => {
  it("rejects unsupported payment proof file types", () => {
    expect(validatePaymentProofMetadata({
      fileName: "receipt.exe",
      mimeType: "application/octet-stream",
      fileSize: 512,
    })).toEqual({
      ok: false,
      message: "Payment proof must be a JPG, PNG, or PDF file.",
    });
  });

  it("rejects payment proof files larger than 3 MB", () => {
    expect(validatePaymentProofMetadata({
      fileName: "receipt.pdf",
      mimeType: "application/pdf",
      fileSize: 3 * 1024 * 1024 + 1,
    })).toEqual({
      ok: false,
      message: "Payment proof must be 3 MB or smaller.",
    });
  });
});

describe("buildWeeklyWorkoutSessionRows", () => {
  it("builds Friday PT sessions inside an active member package range", () => {
    expect(buildWeeklyWorkoutSessionRows({
      member_id: "member-1",
      trainer_id: "trainer-1",
      member_package_id: "package-1",
      selected_schedule: "Friday, 08:00 - 10:00",
      selected_slots: [{
        dayKey: "friday",
        startTime: "08:00",
        endTime: "10:00",
      }],
      start_date: "2026-06-21",
      end_date: "2026-06-30",
    })).toEqual([
      expect.objectContaining({
        member_id: "member-1",
        trainer_id: "trainer-1",
        member_package_id: "package-1",
        session_date: "2026-06-26",
        start_time: "08:00",
        end_time: "10:00",
        status: "scheduled",
      }),
    ]);
  });
});
