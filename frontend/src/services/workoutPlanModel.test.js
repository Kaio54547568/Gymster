import { test, expect } from "vitest";

import { normalizeWorkoutPlanDraft } from "./workoutPlanModel.js";

test("normalizes a workout draft into database-ready plan and exercise values", () => {
  const result = normalizeWorkoutPlanDraft({
    memberId: "member-1",
    name: "Upper Body Strength",
    goal: "Build strength",
    status: "active",
    notes: "Keep good form",
    exercises: [{
      exerciseName: "Bench Press",
      sets: 4,
      reps: 8,
      restTime: 90,
      difficulty: "Hard",
      muscleGroup: "Chest",
      instruction: "Control the bar",
    }],
  });

  expect(result.plan).toEqual({
    member_id: "member-1",
    plan_name: "Upper Body Strength",
    plan_goal: "Build strength",
    start_date: null,
    end_date: null,
    status: "active",
    notes: "Keep good form",
  });
  expect(result.exercises[0]).toEqual({
    exercise_name: "Bench Press",
    exercise_type: "Chest",
    sets: 4,
    reps: "8",
    rest_seconds: 90,
    intensity: "Hard",
    notes: "Control the bar",
    display_order: 1,
  });
});

test("allows a reusable workout draft without assigning a member", () => {
  const result = normalizeWorkoutPlanDraft({
    name: "Mobility Basics",
    exercises: [{ exerciseName: "Hip Opener" }],
  });

  expect(result.plan.member_id).toBe(null);
});
