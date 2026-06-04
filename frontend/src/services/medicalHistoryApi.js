import { getCurrentUser } from "./authService";
import { resolveCurrentMemberId } from "./memberPackageApi";
import { supabase } from "./supabaseClient";

async function resolveTrainer(currentUser = getCurrentUser()) {
  const trainerId = currentUser?.trainerId || currentUser?.trainer_id;
  if (trainerId) {
    const { data } = await supabase.from("trainers").select("trainer_id,user_id").eq("trainer_id", trainerId).maybeSingle();
    if (data) return data;
  }

  const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
  if (!userId) return null;
  const { data } = await supabase.from("trainers").select("trainer_id,user_id").eq("user_id", userId).maybeSingle();
  return data || null;
}

async function getMember(memberId) {
  if (!memberId) return null;
  const { data } = await supabase
    .from("members")
    .select("member_id,user_id,full_name,member_code")
    .eq("member_id", memberId)
    .maybeSingle();
  return data || null;
}

async function insertMedicalRequestNotification(member, requestId) {
  return supabase.from("notifications").insert({
    user_id: member.user_id,
    notification_type: "medical_request",
    action_type: "complete_medical_history",
    action_payload: { requestId, memberId: member.member_id },
    title: "Medical history required",
    message: "Your trainer requested your medical history. Complete the form so your training plan can be prepared safely.",
    is_read: false,
  });
}

export async function requestMedicalHistoryForMember(memberId, currentUser = getCurrentUser()) {
  if (!supabase) return { data: null, error: new Error("Missing system configuration.") };

  const [member, currentTrainer] = await Promise.all([getMember(memberId), resolveTrainer(currentUser)]);
  if (!member?.user_id) return { data: null, error: new Error("Member account was not found.") };
  let trainer = currentTrainer;
  if (!trainer) {
    const { data: assignment } = await supabase
      .from("trainer_assignments")
      .select("trainer_id")
      .eq("member_id", member.member_id)
      .eq("status", "active")
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    trainer = assignment?.trainer_id ? { trainer_id: assignment.trainer_id } : null;
  }

  const { data: existing } = trainer?.trainer_id
    ? await supabase
      .from("medical_history_requests")
      .select("*")
      .eq("member_id", member.member_id)
      .eq("trainer_id", trainer.trainer_id)
      .eq("status", "pending")
      .maybeSingle()
    : { data: null };

  let request = existing;
  if (!request) {
    const result = await supabase
      .from("medical_history_requests")
      .insert({
        member_id: member.member_id,
        trainer_id: trainer?.trainer_id || null,
        status: "pending",
      })
      .select("*")
      .single();
    if (result.error) return { data: null, error: result.error };
    request = result.data;
  }

  const notificationResult = await insertMedicalRequestNotification(member, request.medical_history_request_id);
  return { data: request, error: notificationResult.error || null };
}

export async function getCurrentMemberMedicalHistory(currentUser = getCurrentUser()) {
  if (!supabase) return { data: null, error: new Error("Missing system configuration.") };
  const memberId = await resolveCurrentMemberId(currentUser);
  if (!memberId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("medical_records")
    .select("*")
    .eq("member_id", memberId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function submitCurrentMemberMedicalHistory(payload, currentUser = getCurrentUser()) {
  if (!supabase) return { data: null, error: new Error("Missing system configuration.") };
  const memberId = await resolveCurrentMemberId(currentUser);
  if (!memberId) return { data: null, error: new Error("Member account was not found.") };

  const record = {
    member_id: memberId,
    condition_name: payload.conditions?.trim() || null,
    injury_notes: payload.injuries?.trim() || null,
    allergies: payload.allergies?.trim() || null,
    medications: payload.medications?.trim() || null,
    emergency_notes: payload.emergencyNotes?.trim() || null,
    clearance_status: payload.clearanceStatus || "unspecified",
  };
  const { data: existing } = await supabase
    .from("medical_records")
    .select("medical_record_id")
    .eq("member_id", memberId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const result = existing?.medical_record_id
    ? await supabase.from("medical_records").update(record).eq("medical_record_id", existing.medical_record_id).select("*").single()
    : await supabase.from("medical_records").insert(record).select("*").single();
  if (result.error) return { data: null, error: result.error };

  await supabase
    .from("medical_history_requests")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("member_id", memberId)
    .eq("status", "pending");
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", currentUser?.userId || currentUser?.user_id || currentUser?.id)
    .eq("action_type", "complete_medical_history");

  const { data: assignments } = await supabase
    .from("trainer_assignments")
    .select("trainers(user_id)")
    .eq("member_id", memberId)
    .eq("status", "active");
  const trainerUserIds = [...new Set((assignments || []).map((item) => item.trainers?.user_id).filter(Boolean))];
  if (trainerUserIds.length) {
    await supabase.from("notifications").insert(trainerUserIds.map((userId) => ({
      user_id: userId,
      notification_type: "medical_request",
      title: "Medical history submitted",
      message: "A member has submitted updated medical history. Open the member profile to review it.",
      is_read: false,
    })));
  }

  return { data: result.data, error: null };
}

export function openMedicalHistoryForm() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gymster-open-medical-history"));
  }
}
