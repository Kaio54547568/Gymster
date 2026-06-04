function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function normalizeWorkoutPlanDraft(draft) {
  const exercises = Array.isArray(draft?.exercises) ? draft.exercises : [];

  return {
    plan: {
      member_id: cleanText(draft?.memberId) || null,
      plan_name: cleanText(draft?.name),
      plan_goal: cleanText(draft?.goal),
      start_date: cleanText(draft?.startDate) || null,
      end_date: cleanText(draft?.endDate) || null,
      status: cleanText(draft?.status) || "draft",
      notes: cleanText(draft?.notes),
    },
    exercises: exercises.map((exercise, index) => ({
      exercise_name: cleanText(exercise.exerciseName),
      exercise_type: cleanText(exercise.muscleGroup),
      sets: cleanNumber(exercise.sets),
      reps: cleanText(exercise.reps),
      rest_seconds: cleanNumber(exercise.restTime, 60),
      intensity: cleanText(exercise.difficulty),
      notes: cleanText(exercise.instruction),
      display_order: index + 1,
    })),
  };
}

export function validateWorkoutPlanDraft(draft) {
  const normalized = normalizeWorkoutPlanDraft(draft);
  if (!normalized.plan.plan_name) return "Enter a workout name.";
  if (!normalized.exercises.length) return "Add at least one exercise.";
  if (normalized.exercises.some((exercise) => !exercise.exercise_name)) {
    return "Enter a name for every exercise.";
  }
  return "";
}
