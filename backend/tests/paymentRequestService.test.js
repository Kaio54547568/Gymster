import { describe, expect, it } from "vitest";
import {
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
