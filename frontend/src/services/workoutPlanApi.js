import { supabase } from "./supabaseClient";
import { normalizeWorkoutPlanDraft, validateWorkoutPlanDraft } from "./workoutPlanModel";

async function resolveTrainerId(currentUser) {
  const directId = currentUser?.trainerId || currentUser?.trainer_id;
  if (directId) return directId;

  const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
  if (!userId) return null;

  const { data } = await supabase
    .from("trainers")
    .select("trainer_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.trainer_id || null;
}

async function loadMemberNames(memberIds) {
  const ids = [...new Set(memberIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data: members } = await supabase
    .from("members")
    .select("member_id,user_id,member_code")
    .in("member_id", ids);
  const userIds = (members || []).map((member) => member.user_id).filter(Boolean);
  let usersById = {};

  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("user_id,first_name,last_name")
      .in("user_id", userIds);
    usersById = Object.fromEntries((users || []).map((user) => [
      user.user_id,
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
    ]));
  }

  return Object.fromEntries((members || []).map((member) => [
    member.member_id,
    usersById[member.user_id] || member.member_code || "Member",
  ]));
}

function mapExercise(row) {
  return {
    exerciseId: row.workout_plan_exercise_id,
    exerciseName: row.exercise_name || "",
    sets: Number(row.sets || 0),
    reps: row.reps || "",
    restTime: Number(row.rest_seconds || 60),
    difficulty: row.intensity || "Medium",
    muscleGroup: row.exercise_type || "",
    instruction: row.notes || "",
  };
}

async function selectPlanExercises(planIds) {
  if (!planIds.length) return { data: [], error: null };

  let result = await supabase
    .from("workout_plan_exercises")
    .select("*")
    .in("workout_plan_id", planIds)
    .order("display_order", { ascending: true });

  return result;
}

export async function getDetailedWorkoutPlansForTrainer(currentUser) {
  if (!supabase) return { data: [], error: new Error("Missing system configuration.") };
  const trainerId = await resolveTrainerId(currentUser);
  if (!trainerId) return { data: [], error: null };

  const { data: plans, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("updated_at", { ascending: false });
  if (error) return { data: [], error };

  const exerciseResult = await selectPlanExercises((plans || []).map((plan) => plan.workout_plan_id));
  if (exerciseResult.error) return { data: [], error: exerciseResult.error };
  const memberNames = await loadMemberNames((plans || []).map((plan) => plan.member_id));

  return {
    data: (plans || []).map((plan) => ({
      id: plan.workout_plan_id,
      memberId: plan.member_id,
      memberName: memberNames[plan.member_id] || "Member",
      name: plan.plan_name,
      goal: plan.plan_goal || "",
      startDate: plan.start_date || "",
      endDate: plan.end_date || "",
      status: plan.status || "draft",
      notes: plan.notes || "",
      exercises: (exerciseResult.data || [])
        .filter((exercise) => exercise.workout_plan_id === plan.workout_plan_id)
        .map(mapExercise),
    })),
    error: null,
  };
}

async function insertPlanExercises(planId, exercises) {
  if (!exercises.length) return { error: null };

  let result = await supabase.from("workout_plan_exercises").insert(
    exercises.map((exercise) => ({ ...exercise, workout_plan_id: planId })),
  );

  if (result.error && String(result.error.message || "").includes("rest_seconds")) {
    result = await supabase.from("workout_plan_exercises").insert(
      exercises.map(({ rest_seconds: _restSeconds, ...exercise }) => ({
        ...exercise,
        workout_plan_id: planId,
      })),
    );
  }

  return result;
}

export async function createWorkoutPlan(currentUser, draft) {
  if (!supabase) return { data: null, error: new Error("Missing system configuration.") };
  const validationMessage = validateWorkoutPlanDraft(draft);
  if (validationMessage) return { data: null, error: new Error(validationMessage) };

  const trainerId = await resolveTrainerId(currentUser);
  if (!trainerId) return { data: null, error: new Error("Trainer account was not found.") };
  const normalized = normalizeWorkoutPlanDraft(draft);
  const { data: plan, error } = await supabase
    .from("workout_plans")
    .insert({ ...normalized.plan, trainer_id: trainerId })
    .select("*")
    .single();
  if (error) return { data: null, error };

  const exerciseResult = await insertPlanExercises(plan.workout_plan_id, normalized.exercises);
  if (exerciseResult.error) {
    await supabase.from("workout_plans").delete().eq("workout_plan_id", plan.workout_plan_id);
    return { data: null, error: exerciseResult.error };
  }

  const refreshed = await getDetailedWorkoutPlansForTrainer(currentUser);
  return {
    data: refreshed.data.find((item) => item.id === plan.workout_plan_id) || null,
    error: refreshed.error,
  };
}

export async function updateWorkoutPlan(currentUser, planId, draft) {
  if (!supabase || !planId) return { data: null, error: new Error("Workout plan id is required.") };
  const validationMessage = validateWorkoutPlanDraft(draft);
  if (validationMessage) return { data: null, error: new Error(validationMessage) };

  const trainerId = await resolveTrainerId(currentUser);
  if (!trainerId) return { data: null, error: new Error("Trainer account was not found.") };
  const normalized = normalizeWorkoutPlanDraft(draft);
  const { data: updatedPlan, error } = await supabase
    .from("workout_plans")
    .update(normalized.plan)
    .eq("workout_plan_id", planId)
    .eq("trainer_id", trainerId)
    .select("workout_plan_id")
    .maybeSingle();
  if (error) return { data: null, error };
  if (!updatedPlan) return { data: null, error: new Error("Workout plan was not found.") };

  const deleteResult = await supabase
    .from("workout_plan_exercises")
    .delete()
    .eq("workout_plan_id", planId);
  if (deleteResult.error) return { data: null, error: deleteResult.error };

  const exerciseResult = await insertPlanExercises(planId, normalized.exercises);
  if (exerciseResult.error) return { data: null, error: exerciseResult.error };

  const refreshed = await getDetailedWorkoutPlansForTrainer(currentUser);
  return {
    data: refreshed.data.find((item) => item.id === planId) || null,
    error: refreshed.error,
  };
}

export async function deleteWorkoutPlan(currentUser, planId) {
  if (!supabase || !planId) return { error: new Error("Workout plan id is required.") };
  const trainerId = await resolveTrainerId(currentUser);
  if (!trainerId) return { error: new Error("Trainer account was not found.") };
  return supabase
    .from("workout_plans")
    .delete()
    .eq("workout_plan_id", planId)
    .eq("trainer_id", trainerId);
}
