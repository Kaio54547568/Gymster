import { createClient } from "@supabase/supabase-js";

let supabaseClient;

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredValue(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 && !normalized.startsWith("your_");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredValue(supabaseKey)) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }
  return { ok: true, client };
}

export async function listStaffSchedules() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: employees, error: empError } = await ready.client
      .from("employees")
      .select("employee_id, employee_code, full_name, email, phone_number, department, status")
      .eq("role", "staff")
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (empError) throw empError;

    const { data: schedules, error: schedError } = await ready.client
      .from("employee_schedules")
      .select("employee_schedule_id, employee_id, day_of_week, shift_code, start_time, end_time, status")
      .eq("status", "active");

    if (schedError) throw schedError;

    const mapped = (employees || []).map((emp) => {
      const empSchedules = (schedules || [])
        .filter((s) => s.employee_id === emp.employee_id)
        .map((s) => ({
          id: s.employee_schedule_id,
          dayOfWeek: s.day_of_week,
          shiftCode: s.shift_code,
          startTime: s.start_time,
          endTime: s.end_time,
          status: s.status,
        }));
      return {
        employeeId: emp.employee_id,
        employeeCode: emp.employee_code,
        fullName: emp.full_name,
        email: emp.email,
        phoneNumber: emp.phone_number,
        department: emp.department,
        status: emp.status,
        schedules: empSchedules,
      };
    });

    return { ok: true, data: mapped };
  } catch (error) {
    console.error("[StaffSchedule] Failed to list staff schedules:", error);
    return { ok: false, status: 500, message: error.message || "Could not load staff schedules." };
  }
}

export async function getStaffSchedule(employeeId) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: schedules, error } = await ready.client
      .from("employee_schedules")
      .select("employee_schedule_id, employee_id, day_of_week, shift_code, start_time, end_time, status")
      .eq("employee_id", employeeId)
      .eq("status", "active");

    if (error) throw error;

    const mapped = (schedules || []).map((s) => ({
      id: s.employee_schedule_id,
      dayOfWeek: s.day_of_week,
      shiftCode: s.shift_code,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
    }));

    return { ok: true, data: mapped };
  } catch (error) {
    console.error("[StaffSchedule] Failed to get staff schedule:", error);
    return { ok: false, status: 500, message: error.message || "Could not load staff schedule." };
  }
}

export async function replaceStaffSchedule(employeeId, selections) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data, error } = await ready.client.rpc("replace_staff_schedule", {
      p_employee_id: employeeId,
      p_selections: selections,
    });

    if (error) throw error;

    if (data && data.ok) {
      return { ok: true };
    } else {
      return { ok: false, status: 400, message: data?.message || "Failed to update staff schedule." };
    }
  } catch (error) {
    console.error("[StaffSchedule] Failed to replace staff schedule:", error);
    return { ok: false, status: 500, message: error.message || "Could not update staff schedule." };
  }
}

export async function listStaffSchedulesForSlot(dayOfWeek, shiftCode) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: schedules, error: schedError } = await ready.client
      .from("employee_schedules")
      .select("employee_id")
      .eq("day_of_week", dayOfWeek.toLowerCase())
      .eq("shift_code", shiftCode.toLowerCase())
      .eq("status", "active");

    if (schedError) throw schedError;

    const employeeIds = (schedules || []).map((s) => s.employee_id);
    if (employeeIds.length === 0) {
      return { ok: true, data: [] };
    }

    const { data: employees, error: empError } = await ready.client
      .from("employees")
      .select("employee_id, employee_code, full_name, email, phone_number, department, status")
      .in("employee_id", employeeIds)
      .eq("role", "staff")
      .eq("status", "active");

    if (empError) throw empError;

    const mapped = (employees || []).map((emp) => ({
      employeeId: emp.employee_id,
      employeeCode: emp.employee_code,
      fullName: emp.full_name,
      email: emp.email,
      phoneNumber: emp.phone_number,
      department: emp.department,
      status: emp.status,
    }));

    return { ok: true, data: mapped };
  } catch (error) {
    console.error("[StaffSchedule] Failed to list staff schedules for slot:", error);
    return { ok: false, status: 500, message: error.message || "Could not load staff schedules for slot." };
  }
}

export async function getStaffScheduleByUserId(userId, authenticatedClient = null) {
  const ready = authenticatedClient ? { ok: true, client: authenticatedClient } : requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: employee, error: empError } = await ready.client
      .from("employees")
      .select("employee_id, role, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (empError) throw empError;
    if (!employee) {
      return { ok: false, status: 404, code: "STAFF_PROFILE_NOT_FOUND", message: "Staff profile not found." };
    }
    if (employee.role !== "staff") {
      return { ok: false, status: 403, message: "Schedule only available for staff role." };
    }

    const { data: schedules, error: schedError } = await ready.client
      .from("employee_schedules")
      .select("employee_schedule_id, day_of_week, shift_code, start_time, end_time, status")
      .eq("employee_id", employee.employee_id)
      .eq("status", "active");

    if (schedError) throw schedError;

    const mapped = (schedules || []).map((s) => ({
      id: s.employee_schedule_id,
      dayOfWeek: s.day_of_week,
      shiftCode: s.shift_code,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
    }));

    return { ok: true, data: mapped };
  } catch (error) {
    console.error("[StaffSchedule] Failed to get staff schedule by user id:", error);
    return { ok: false, status: 500, message: error.message || "Could not load staff schedule." };
  }
}
