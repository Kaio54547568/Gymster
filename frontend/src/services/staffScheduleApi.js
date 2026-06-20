import { authenticatedJson } from "./authenticatedApi";

const scheduleJson = authenticatedJson;

export async function fetchStaffSchedules() {
  return scheduleJson("/api/admin/staff-schedules");
}

export async function fetchStaffSchedulesForSlot(day, shift) {
  const query = new URLSearchParams({ day, shift }).toString();
  return scheduleJson(`/api/admin/staff-schedules/slot?${query}`);
}

export async function fetchStaffSchedule(employeeId) {
  return scheduleJson(`/api/admin/staff/${encodeURIComponent(employeeId)}/schedule`);
}

export async function updateStaffSchedule(employeeId, selections) {
  return scheduleJson(`/api/admin/staff/${encodeURIComponent(employeeId)}/schedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selections }),
  });
}

export async function fetchMyWorkSchedule() {
  return scheduleJson("/api/staff/my-work-schedule");
}
