function relatedName(row) {
  const userName = [row.users?.first_name, row.users?.last_name].filter(Boolean).join(" ").trim();
  return row.full_name || userName || row.employees?.full_name || row.trainer_code || "Trainer";
}

function mapTrainer(row) {
  const slots = row.available_slots || row.available_schedule_slots;
  return {
    id: row.trainer_id,
    userId: row.user_id || row.employees?.user_id || null,
    employeeId: row.employee_id || row.employees?.employee_id || null,
    name: relatedName(row),
    specialty: row.specialty || "Personal Training",
    rating: Number(row.rating || 0),
    maxActiveMembers: Number(row.max_active_members || 0),
    currentActiveMembers: Number(row.current_active_members || 0),
    status: row.status || "active",
    avatarUrl: row.avatar_url || row.users?.avatar_url || "",
    bio: row.bio || row.description || row.profile_summary || "",
    availableSlots: Array.isArray(slots) ? slots : [],
  };
}

export function applyActiveMemberCounts(trainers = [], activeCountsByTrainerId = {}) {
  return trainers.map((trainer) => ({
    ...trainer,
    currentActiveMembers: Number(activeCountsByTrainerId[trainer.id] ?? trainer.currentActiveMembers ?? 0),
  }));
}

async function loadActiveMemberCounts(client, trainerIds = []) {
  const ids = [...new Set(trainerIds.filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await client
    .from("trainer_assignments")
    .select("trainer_id")
    .in("trainer_id", ids)
    .eq("status", "active");
  if (error) throw error;

  return (data || []).reduce((counts, row) => {
    counts[row.trainer_id] = Number(counts[row.trainer_id] || 0) + 1;
    return counts;
  }, {});
}

export async function listActiveTrainers(client) {
  let result = await client
    .from("trainers")
    .select("trainer_id,user_id,employee_id,full_name,specialty,rating,current_active_members,max_active_members,status,avatar_url,available_slots")
    .eq("status", "active")
    .order("full_name");

  if (result.error) {
    result = await client
      .from("trainers")
      .select("trainer_id,employee_id,trainer_code,specialty,rating,current_active_members,max_active_members,status,available_schedule_slots,employees(employee_id,user_id,full_name)")
      .eq("status", "active")
      .order("trainer_code");
  }

  if (result.error) throw result.error;
  const trainers = (result.data || []).map(mapTrainer);
  const activeCounts = await loadActiveMemberCounts(client, trainers.map((trainer) => trainer.id));
  return { ok: true, data: applyActiveMemberCounts(trainers, activeCounts) };
}
