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
    if (["cancelled", "incomplete"].includes(String(session.status || "").toLowerCase())) return false;

    const sessionStart = minutesFromTime(session.startTime);
    const sessionEnd = minutesFromTime(session.endTime);
    return sessionStart !== null && sessionEnd !== null && candidateStart < sessionEnd && candidateEnd > sessionStart;
  }) || null;
}
