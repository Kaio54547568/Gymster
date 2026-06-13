import { supabase } from "./supabaseClient";

const LOCAL_TRAINERS = [
  {
    id: "local-trainer-khoa",
    name: "Khoa Le",
    specialty: "PT Strength & Conditioning",
    rating: 4.9,
    maxActiveMembers: 12,
    currentActiveMembers: 6,
    status: "active",
    avatarUrl: "",
    bio: "Strength coach focused on safe progression, compound lifts, and sustainable conditioning for busy members.",
    availableSlots: [
      { day: "Monday", startTime: "08:00", endTime: "10:00" },
      { day: "Thursday", startTime: "08:00", endTime: "10:00" },
    ],
  },
  {
    id: "local-trainer-lan",
    name: "Lan Anh",
    specialty: "Yoga & Mobility",
    rating: 4.8,
    maxActiveMembers: 10,
    currentActiveMembers: 4,
    status: "active",
    avatarUrl: "",
    bio: "Mobility-first trainer helping members improve flexibility, posture, and recovery habits.",
    availableSlots: [
      { day: "Tuesday", startTime: "17:00", endTime: "19:00" },
      { day: "Saturday", startTime: "09:00", endTime: "11:00" },
    ],
  },
  {
    id: "local-trainer-minh",
    name: "Minh Tuan",
    specialty: "Weight Loss Coaching",
    rating: 4.7,
    maxActiveMembers: 10,
    currentActiveMembers: 8,
    status: "active",
    avatarUrl: "",
    bio: "Weight loss specialist combining resistance training, cardio planning, and habit coaching.",
    availableSlots: [
      { day: "Wednesday", startTime: "18:00", endTime: "20:00" },
      { day: "Friday", startTime: "07:00", endTime: "09:00" },
    ],
  },
];

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
    bio: row.bio || row.description || row.profile_summary || `${row.specialty || "Personal Training"} coach at Gymster.`,
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
    return { data: LOCAL_TRAINERS, error: null };
  }

  let { data, error } = await fetchDirectTrainerRows();

  if (error) {
    ({ data, error } = await fetchRelatedTrainerRows());
  }

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load trainers:", error);
    return { data: [], error };
  }

  return {
    data: Array.isArray(data) ? data.map(mapTrainerRow) : [],
    error: null,
  };
}
