import { supabase } from "./supabaseClient";
import { getCurrentUser } from "./authService";

function missingSupabase(feature) {
  const error = new Error(`Missing h\u1ec7 th\u1ed1ng configuration for ${feature}.`);
  console.error("[Gymster h\u1ec7 th\u1ed1ng]", error);
  return error;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fullName(row, fallback = "Member") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return row?.full_name || name || row?.username || fallback;
}

async function resolveCurrentMember() {
  const currentUser = getCurrentUser();
  if (!supabase || !currentUser) return null;

  const explicitMemberId = currentUser.memberId || currentUser.member_id;
  if (explicitMemberId) {
    const { data } = await supabase
      .from("members")
      .select("member_id,user_id,member_code,full_name")
      .eq("member_id", explicitMemberId)
      .maybeSingle();
    if (data) return data;
  }

  const userId = currentUser.userId || currentUser.user_id || currentUser.id;
  if (userId) {
    const { data } = await supabase
      .from("members")
      .select("member_id,user_id,member_code,full_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return data;
  }

  const email = currentUser.email ? String(currentUser.email).toLowerCase() : "";
  if (email) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (user?.user_id) {
      const { data } = await supabase
        .from("members")
        .select("member_id,user_id,member_code,full_name")
        .eq("user_id", user.user_id)
        .maybeSingle();
      if (data) return data;
    }
  }

  return null;
}

async function fetchUsersByIds(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("users")
    .select("user_id,first_name,last_name,username,email")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((user) => [user.user_id, user]));
}

export async function getMemberFeedbackPortalData() {
  if (!supabase) return { data: null, error: missingSupabase("member feedback") };

  try {
    const member = await resolveCurrentMember();
    if (!member?.member_id) {
      return { data: { feedback: [], complaints: [], trainers: [], sessions: [], equipmentRooms: [] }, error: null };
    }

    const [
      feedbackResult,
      complaintResult,
      sessionResult,
      assignmentResult,
      roomResult,
    ] = await Promise.all([
      supabase.from("service_feedback").select("*").eq("member_id", member.member_id).order("created_at", { ascending: false }),
      supabase.from("complaints").select("*").eq("member_id", member.member_id).order("created_at", { ascending: false }),
      supabase.from("workout_sessions").select("*").eq("member_id", member.member_id).order("session_date", { ascending: false }),
      supabase.from("trainer_assignments").select("trainer_id,status").eq("member_id", member.member_id),
      supabase.from("rooms").select("room_id,room_name,room_type,status").eq("status", "active").order("room_name", { ascending: true }),
    ]);

    [feedbackResult, complaintResult, sessionResult, assignmentResult, roomResult].forEach((result) => {
      if (result.error) throw result.error;
    });

    const trainerIds = [...new Set((assignmentResult.data || []).map((row) => row.trainer_id).filter(Boolean))];
    let trainers = [];
    if (trainerIds.length) {
      const { data: trainerRows, error: trainerError } = await supabase
        .from("trainers")
        .select("trainer_id,user_id,full_name,specialty,trainer_code")
        .in("trainer_id", trainerIds);
      if (trainerError) throw trainerError;
      const usersById = await fetchUsersByIds((trainerRows || []).map((row) => row.user_id));
      trainers = (trainerRows || []).map((row) => fullName(usersById[row.user_id], row.full_name || row.trainer_code || "Trainer"));
    }

    return {
      data: {
        feedback: (feedbackResult.data || []).map((row) => ({
          target: row.target_type || "Service",
          date: formatDate(row.created_at),
          rating: Number(row.rating || 0),
          comment: row.comment || "",
          status: row.status === "in_review" ? "In Review" : row.status === "resolved" ? "Resolved" : row.status === "rejected" ? "Rejected" : "Submitted",
          response: row.staff_response || "",
        })),
        complaints: (complaintResult.data || []).map((row) => ({
          type: row.complaint_type || "service",
          target: row.title || row.complaint_type || "Complaint",
          date: formatDate(row.created_at),
          description: row.description || "",
          status: row.status === "resolved" || row.status === "closed" ? "Resolved" : row.status === "in_review" || row.status === "in_progress" ? "In Review" : row.status === "rejected" ? "Rejected" : "Submitted",
          response: row.resolution_note || "",
        })),
        trainers,
        sessions: (sessionResult.data || []).map((row) => `${row.session_title || row.title || row.exercise_type || "Workout Session"} - ${formatDate(row.session_date)}`),
        equipmentRooms: (roomResult.data || []).map((row) => row.room_name),
      },
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member feedback data:", error);
    return { data: null, error };
  }
}

export async function createMemberServiceFeedback(payload) {
  if (!supabase) return { data: null, error: missingSupabase("create feedback") };

  try {
    const member = await resolveCurrentMember();
    if (!member?.member_id) throw new Error("Current member could not be resolved.");
    const targetTypeMap = {
      "Overall Service": "service",
      Trainer: "trainer",
      "Workout Session": "class",
      Equipment: "equipment",
      Facilities: "facility",
      "Customer Support": "staff",
    };
    const { data, error } = await supabase
      .from("service_feedback")
      .insert({
        member_id: member.member_id,
        target_type: targetTypeMap[payload.serviceType] || "service",
        rating: Number(payload.rating || 1),
        comment: payload.comment || "",
        tags: payload.tags || [],
        status: "submitted",
      })
      .select("*")
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create member feedback:", error);
    return { data: null, error };
  }
}

export async function createMemberComplaint(payload) {
  if (!supabase) return { data: null, error: missingSupabase("create complaint") };

  try {
    const member = await resolveCurrentMember();
    if (!member?.member_id) throw new Error("Current member could not be resolved.");
    const complaintTypeMap = {
      Trainer: "trainer",
      "Workout Session": "service",
      Equipment: "equipment",
      Facilities: "facility",
      "Overall Service": "service",
      "Customer Support": "service",
    };
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        member_id: member.member_id,
        complaint_type: complaintTypeMap[payload.type] || "other",
        title: payload.target || payload.type || "Member complaint",
        description: payload.description || "",
        priority: payload.priority || "medium",
        status: "open",
      })
      .select("*")
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create member complaint:", error);
    return { data: null, error };
  }
}
