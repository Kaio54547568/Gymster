import { supabase } from "./supabaseClient";

function getRelatedName(row) {
  const userName = [row.users?.first_name, row.users?.last_name].filter(Boolean).join(" ").trim();
  return row.full_name || userName || row.employees?.full_name || row.trainer_code || "Trainer";
}

function mapTrainerRow(row) {
  const slots = row.available_slots || row.available_schedule_slots;
  const availableSlots = Array.isArray(slots)
    ? slots
    : [];

  return {
    id: row.trainer_id,
    name: getRelatedName(row),
    specialty: row.specialty || "Personal Training",
    rating: Number(row.rating || 0),
    maxActiveMembers: Number(row.max_active_members || 0),
    currentActiveMembers: Number(row.current_active_members || 0),
    status: row.status || "active",
    avatarUrl: row.avatar_url || row.users?.avatar_url || "",
    availableSlots,
  };
}

async function fetchDirectTrainerRows() {
  return supabase
    .from("trainers")
    .select(`
      trainer_id,
      full_name,
      specialty,
      rating,
      current_active_members,
      max_active_members,
      status,
      avatar_url,
      available_slots
    `);
}

async function fetchRelatedTrainerRows() {
  return supabase
    .from("trainers")
    .select(`
      trainer_id,
      trainer_code,
      specialty,
      rating,
      current_active_members,
      max_active_members,
      status,
      available_schedule_slots,
      users (
        first_name,
        last_name,
        avatar_url
      ),
      employees (
        full_name
      )
    `);
}

export async function fetchTrainersFromSupabase() {
  if (!supabase) {
    const error = new Error("Missing Supabase environment variables.");
    console.error("[Gymster Supabase] Failed to load trainers:", error);
    return { data: [], error };
  }

  let { data, error } = await fetchDirectTrainerRows();

  if (error) {
    ({ data, error } = await fetchRelatedTrainerRows());
  }

  if (error) {
    console.error("[Gymster Supabase] Failed to load trainers:", error);
    return { data: [], error };
  }

  return {
    data: Array.isArray(data) ? data.map(mapTrainerRow) : [],
    error: null,
  };
}
