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
      end_time: "09:00",
      status: "completed",
      notes: "Local demo session.",
      created_at: new Date().toISOString(),
    },
  ],
  reviews: [],
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
  const row = {
    workout_session_id: `local-session-${Date.now()}`,
    member_id: memberId,
    trainer_id: data.trainerId || "local-trainer-khoa",
    title: "AI Booking",
    exercise_type: "Personal Training",
    room_name: "PT Room",
    session_date: data.date,
    start_time: data.time,
    end_time: data.endTime,
    status: "scheduled",
    notes: data.note || "Created by Gymster AI Assistant.",
    created_at: new Date().toISOString(),
  };
  state.bookings.push(row);
  return row;
}

export function cancelLocalBooking(memberId, data) {
  const rows = listLocalBookings(memberId, { startDate: data.date, endDate: data.date })
    .filter((item) => ["scheduled", "rescheduled"].includes(item.status));
  const target = data.sessionId
    ? state.bookings.find((item) => item.workout_session_id === data.sessionId && item.member_id === memberId)
    : rows[0];

  if (!target) return null;
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
    endDate: toDateValue(new Date(Date.now() + 90 * ONE_DAY_MS)),
    usedSessions: 3,
    remainingSessions: 21,
    sessionsTotal: 24,
    trainerName: "Khoa Le",
  };
}
