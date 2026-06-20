import { describe, expect, it } from "vitest";
import { buildPriceSnapshot, validatePromotionInput } from "../services/packagePromotionService.js";

describe("buildPriceSnapshot", () => {
  it("calculates an auditable promotion snapshot and keeps amount equal to finalAmount", () => {
    expect(buildPriceSnapshot({
      packageId: "package-1",
      packageName: "Gym Access",
      originalPrice: 1_000_000,
      promotion: {
        id: "promotion-1",
        title: "Summer Sale",
        discountPercent: 15,
      },
      appliedAt: "2026-06-19T00:00:00.000Z",
    })).toEqual({
      packageId: "package-1",
      packageNameSnapshot: "Gym Access",
      promotionId: "promotion-1",
      promotionTitleSnapshot: "Summer Sale",
      originalPrice: 1_000_000,
      discountPercent: 15,
      discountAmount: 150_000,
      finalAmount: 850_000,
      amount: 850_000,
      appliedAt: "2026-06-19T00:00:00.000Z",
    });
  });

  it("keeps the original package price when no promotion is active", () => {
    expect(buildPriceSnapshot({
      packageId: "package-2",
      packageName: "PT Package",
      originalPrice: 999_999.99,
      appliedAt: "2026-06-19T00:00:00.000Z",
    })).toMatchObject({
      promotionId: null,
      discountPercent: 0,
      discountAmount: 0,
      finalAmount: 999_999.99,
      amount: 999_999.99,
    });
  });
});

describe("validatePromotionInput", () => {
  it("rejects missing dates and invalid discount percentages", () => {
    expect(validatePromotionInput({
      packageId: "package-1",
      title: "Sale",
      discountPercent: 0,
      startDate: "",
      endDate: "",
    })).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a promotion whose inclusive end date precedes its start date", () => {
    expect(validatePromotionInput({
      packageId: "package-1",
      title: "Sale",
      discountPercent: 10,
      startDate: "2026-06-20",
      endDate: "2026-06-19",
    })).toMatchObject({ ok: false, status: 400 });
  });
});
