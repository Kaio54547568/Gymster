export function normalizeSessionStatus(status) {
  const normalized = String(status || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (["completed", "done"].includes(normalized)) return "completed";
  if (["incomplete", "missed", "no_show", "cancelled", "canceled"].includes(normalized)) return "incomplete";
  return "scheduled";
}

export function getSessionStatusLabel(status) {
  const normalized = normalizeSessionStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatSessionExerciseContent(exercises = []) {
  return exercises
    .filter((exercise) => String(exercise?.exerciseName || "").trim())
    .map((exercise, index) => {
      const details = [
        exercise.sets ? `${exercise.sets} sets` : "",
        exercise.reps ? `${exercise.reps} reps` : "",
        exercise.restTime ? `${exercise.restTime}s rest` : "",
        exercise.difficulty || "",
      ].filter(Boolean).join(" | ");
      const instruction = String(exercise.instruction || "").trim();
      return `${index + 1}. ${String(exercise.exerciseName).trim()}${details ? ` - ${details}` : ""}${instruction ? `\n   ${instruction}` : ""}`;
    })
    .join("\n");
}
