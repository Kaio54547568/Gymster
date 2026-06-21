import { authenticatedJson } from "./authenticatedApi";

export function getStaffCheckInList(date) {
  return authenticatedJson(`/api/staff/check-ins?date=${encodeURIComponent(date)}`);
}

export function recordStaffCheckIn(memberId, date, workoutSessionId = "") {
  return authenticatedJson("/api/staff/check-ins", {
    method: "POST",
    body: JSON.stringify({ memberId, date, workoutSessionId }),
  });
}

export function getMyCheckInHistory() {
  return authenticatedJson("/api/member/check-in-history");
}
