const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const state = {
  bookings: [
    {
      workout_session_id: "local-session-today",
      member_id: "00000000-0000-4000-8000-000000000005",
      trainer_id: "local-trainer-khoa",
      title: "PT Session",
      exercise_type: "Personal Training",
      room_name: "PT Room",
      session_date: new Date().toISOString().slice(0, 10),
      start_time: "08:00",
      end_time: "10:00",
      status: "completed",
      notes: "Local demo session.",
      created_at: new Date().toISOString(),
    },
  ],
  reviews: [],
  trainingRequests: [],
};

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDefaultMemberId(user) {
  return user?.memberId || user?.member_id || user?.id || "00000000-0000-4000-8000-000000000005";
}

export function listLocalBookings(memberId, { startDate, endDate } = {}) {
  return state.bookings
    .filter((item) => item.member_id === memberId)
    .filter((item) => !startDate || item.session_date >= startDate)
    .filter((item) => !endDate || item.session_date <= endDate)
    .sort((a, b) => `${a.session_date} ${a.start_time}`.localeCompare(`${b.session_date} ${b.start_time}`));
}

export function createLocalBooking(memberId, data) {
  const requestId = `local-request-${Date.now()}`;
  const row = {
    request_id: requestId,
    training_request_id: requestId,
    member_id: memberId,
    trainer_id: data.trainerId || "local-trainer-khoa",
    requested_date: data.date,
    start_time: data.time,
    end_time: data.endTime,
    requested_schedule: `${data.date} ${data.time} - ${data.endTime}`,
    request_type: "makeup_pt_session",
    status: "pending_pt_approval",
    memberName: data.memberName || "Member",
    trainerName: "Khoa Le",
    makeupBalance: data.makeupBalance || null,
    created_at: new Date().toISOString(),
  };
  state.trainingRequests.push(row);
  return row;
}

export function getLocalMakeupBalance(memberId) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
  const fixedScheduleCancelCount = state.bookings.filter((item) => (
    item.member_id === memberId
    && item.trainer_id
    && item.status === "cancelled"
    && item.session_date >= monthStart
    && item.session_date <= monthEnd
  )).length;
  const maxMakeupAllowed = Math.min(fixedScheduleCancelCount, 3);
  const usedMakeupCount = state.trainingRequests.filter((item) => (
    item.member_id === memberId
    && item.request_type === "makeup_pt_session"
    && ["accepted", "approved", "completed"].includes(String(item.status || "").toLowerCase())
    && String(item.requested_date || item.created_at || "").slice(0, 7) === monthStart.slice(0, 7)
  )).length;

  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    fixedScheduleCancelCount,
    maxMakeupAllowed,
    usedMakeupCount,
    remainingMakeupCount: Math.max(0, maxMakeupAllowed - usedMakeupCount),
  };
}

export function cancelLocalBooking(memberId, data) {
  const rows = listLocalBookings(memberId, { startDate: data.date, endDate: data.date })
    .filter((item) => ["scheduled", "rescheduled"].includes(item.status));
  const target = data.sessionId
    ? state.bookings.find((item) => item.workout_session_id === data.sessionId && item.member_id === memberId)
    : rows[0];

  if (!target) return null;
  if (false && (target.trainer_id || String(target.title || "").toLowerCase().includes("pt") || String(target.exercise_type || "").toLowerCase().includes("personal training"))) {
    throw new Error("Lịch tập với PT là lịch cố định nên không thể hủy hoặc thay đổi bằng AI chat.");
  }
  target.status = "cancelled";
  return target;
}

export function findNearestLocalSession(memberId, date) {
  const targetDate = date || toDateValue(new Date());
  return listLocalBookings(memberId)
    .filter((item) => item.session_date <= targetDate)
    .sort((a, b) => `${b.session_date} ${b.start_time}`.localeCompare(`${a.session_date} ${a.start_time}`))[0] || null;
}

export function createLocalReview(memberId, data) {
  const session = data.sessionId
    ? state.bookings.find((item) => item.workout_session_id === data.sessionId && item.member_id === memberId)
    : findNearestLocalSession(memberId, data.date);

  if (!session) return null;

  const row = {
    feedback_id: `local-feedback-${Date.now()}`,
    member_id: memberId,
    trainer_id: session.trainer_id,
    workout_session_id: session.workout_session_id,
    target_type: data.targetType || "trainer",
    rating: Number(data.rating),
    comment: data.comment || "",
    status: "submitted",
    created_at: new Date().toISOString(),
  };
  state.reviews.push(row);
  return row;
}

export function updateLocalReview(memberId, data) {
  const review = data.reviewId
    ? state.reviews.find((item) => item.feedback_id === data.reviewId && item.member_id === memberId)
    : [...state.reviews].reverse().find((item) => item.member_id === memberId);
  if (!review) return null;

  if (data.rating) review.rating = Number(data.rating);
  if (data.comment) review.comment = data.comment;
  return review;
}

export function getLocalMembership(memberId) {
  return {
    memberPackageId: "local-member-package-member00",
    memberId,
    packageName: "PT Progress 3 Months",
    status: "active",
    startDate: toDateValue(new Date()),
    endDate: toDateValue(new Date(Date.now() + 3 * ONE_DAY_MS)),
    usedSessions: 3,
    remainingSessions: 21,
    sessionsTotal: 24,
    trainerName: "Khoa Le",
  };
}
