import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";

async function resolveTrainerId(currentUser = getCurrentUser()) {
  const directId = currentUser?.trainerId || currentUser?.trainer_id;
  if (directId) return directId;
  const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
  if (!userId) return null;
  const { data } = await supabase.from("trainers").select("trainer_id").eq("user_id", userId).maybeSingle();
  return data?.trainer_id || null;
}

export async function updateMemberCurrentGoal(memberId, goalTitle, currentUser = getCurrentUser()) {
  if (!supabase || !memberId) return { data: null, error: new Error("Member is required.") };
  const trainerId = await resolveTrainerId(currentUser);
  if (!trainerId) return { data: null, error: new Error("Trainer account was not found.") };

  const { data: existing } = await supabase
    .from("training_goals")
    .select("training_goal_id")
    .eq("member_id", memberId)
    .eq("trainer_id", trainerId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.training_goal_id) {
    return supabase
      .from("training_goals")
      .update({ goal_title: goalTitle })
      .eq("training_goal_id", existing.training_goal_id)
      .select("*")
      .single();
  }

  return supabase
    .from("training_goals")
    .insert({ member_id: memberId, trainer_id: trainerId, goal_title: goalTitle, status: "active" })
    .select("*")
    .single();
}
