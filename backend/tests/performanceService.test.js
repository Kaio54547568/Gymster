import { describe, expect, it } from "vitest";
import {
  calculateComponentScore,
  calculateFinalScore,
  calculateTrainerObjectiveScore,
  getPerformanceRank,
  validateReviewInput,
} from "../services/performanceService.js";

describe("calculateComponentScore", () => {
  it("prorates a 30-day target and caps the component score at 100", () => {
    expect(calculateComponentScore({ count: 12, baseTarget: 10, periodDays: 15 })).toEqual({
      target: 5,
      score: 100,
    });
  });
});

describe("validateReviewInput", () => {
  it("rejects a review whose end date is before its start date", () => {
    expect(validateReviewInput({
      periodStart: "2026-06-20",
      periodEnd: "2026-06-19",
      adminScore: 80,
    })).toMatchObject({ ok: false, status: 400 });
  });
});

describe("getPerformanceRank", () => {
  it("uses the 85/70/50 rank thresholds", () => {
    expect([85, 70, 50, 49.99].map(getPerformanceRank)).toEqual([
      "Excellent",
      "Good",
      "Average",
      "Poor",
    ]);
  });
});

describe("calculateFinalScore", () => {
  it("uses the same activity and admin weights for trainers and staff", () => {
    expect(calculateFinalScore({
      reviewType: "trainer",
      feedbackScore: 80,
      activityScore: 70,
      adminScore: 90,
    })).toBe(78);
  });

  it("uses the staff activity and admin weights", () => {
    expect(calculateFinalScore({
      reviewType: "staff",
      activityScore: 80,
      adminScore: 90,
    })).toBe(84);
  });
});

describe("calculateTrainerObjectiveScore", () => {
  it("limits rating advantage when the trainer has fewer than five reviews", () => {
    expect(calculateTrainerObjectiveScore({
      operationalScore: 80,
      averageRating: 5,
      reviewCount: 1,
    })).toEqual({
      feedbackScore: 20,
      confidence: 0.2,
      objectiveScore: 62,
    });
  });

  it("caps a fully supported feedback contribution at 30 percent of objective score", () => {
    expect(calculateTrainerObjectiveScore({
      operationalScore: 80,
      averageRating: 5,
      reviewCount: 5,
    })).toEqual({
      feedbackScore: 100,
      confidence: 1,
      objectiveScore: 86,
    });
  });
});
