function minutesFromTime(value) {
  const [hours, minutes] = String(value || "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
}

export function findConflictingPtSession(candidate, sessions = []) {
  const candidateStart = minutesFromTime(candidate?.startTime);
  const candidateEnd = minutesFromTime(candidate?.endTime);
  if (candidateStart === null || candidateEnd === null || candidateStart >= candidateEnd) return null;

  return sessions.find((session) => {
    if (!session?.trainerId || session.sessionDate !== candidate.sessionDate) return false;
    if (candidate.trainerId && session.trainerId !== candidate.trainerId) return false;
    if (["cancelled", "incomplete"].includes(String(session.status || "").toLowerCase())) return false;

    const sessionStart = minutesFromTime(session.startTime);
    const sessionEnd = minutesFromTime(session.endTime);
    return sessionStart !== null && sessionEnd !== null && candidateStart < sessionEnd && candidateEnd > sessionStart;
  }) || null;
}

export function parseDateTimeAsGmt7(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.slice(0, 5).split(":").map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return null;

  const pad = (n) => String(n).padStart(2, "0");
  const isoStr = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+07:00`;
  const dateObj = new Date(isoStr);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj;
}

export function isSessionBefore2Hours(dateStr, timeStr) {
  const sessionTime = parseDateTimeAsGmt7(dateStr, timeStr);
  if (!sessionTime) return false;
  const now = new Date();
  const diffHours = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2.0;
}

export function isRequestBefore2Hours(request) {
  if (!request) return false;
  const currentSchedule = request.currentSchedule || request.current_schedule;
  if (!currentSchedule) return false;

  const parts = currentSchedule.trim().split(" ");
  if (parts.length < 2) return false;
  const dateStr = parts[0];
  const timeStr = parts[1];

  const sessionTime = parseDateTimeAsGmt7(dateStr, timeStr);
  if (!sessionTime) return false;

  const createdAtStr = request.createdAt || request.created_at || new Date().toISOString();
  const requestTime = new Date(createdAtStr);

  const diffHours = (sessionTime.getTime() - requestTime.getTime()) / (1000 * 60 * 60);
  return diffHours >= 2.0;
}

