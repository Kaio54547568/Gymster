import { supabase } from "./supabaseClient";

export const weeklyTrainingSlots = [
  { startTime: "08:00", endTime: "10:00", label: "08:00 - 10:00" },
  { startTime: "14:00", endTime: "16:00", label: "14:00 - 16:00" },
  { startTime: "16:00", endTime: "18:00", label: "16:00 - 18:00" },
  { startTime: "18:00", endTime: "20:00", label: "18:00 - 20:00" },
];

export const weeklyTrainingDays = [
  { key: "monday", label: "Monday", shortLabel: "Mon" },
  { key: "tuesday", label: "Tuesday", shortLabel: "Tue" },
  { key: "wednesday", label: "Wednesday", shortLabel: "Wed" },
  { key: "thursday", label: "Thursday", shortLabel: "Thu" },
  { key: "friday", label: "Friday", shortLabel: "Fri" },
  { key: "saturday", label: "Saturday", shortLabel: "Sat" },
  { key: "sunday", label: "Sunday", shortLabel: "Sun" },
];

const dayIndexes = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function normalizeTime(value) {
  return String(value || "").slice(0, 5);
}

function defaultAvailabilityRows(trainerId) {
  return weeklyTrainingDays.flatMap((day) =>
    weeklyTrainingSlots.map((slot) => ({
      trainer_id: trainerId,
      day_of_week: day.key,
      start_time: slot.startTime,
      end_time: slot.endTime,
      is_available: true,
    })),
  );
}

function buildWeeklyAvailabilityData(availabilityRows, bookedRows = []) {
  const bookedKeys = buildBookedKeys(bookedRows);

  return weeklyTrainingDays.map((day) => {
    const slots = weeklyTrainingSlots.map((slot) => {
      const configured = availabilityRows.find((row) =>
        row.day_of_week === day.key &&
        normalizeTime(row.start_time) === slot.startTime &&
        normalizeTime(row.end_time) === slot.endTime
      );
      const isConfiguredAvailable = configured ? configured.is_available !== false : true;
      const isBooked = bookedKeys.has(`${day.key}|${slot.startTime}|${slot.endTime}`);

      return {
        ...slot,
        dayKey: day.key,
        available: isConfiguredAvailable && !isBooked,
        booked: isBooked,
      };
    });

    return { ...day, slots };
  });
}

async function fetchAvailabilityRows(trainerId) {
  const { data, error } = await supabase
    .from("trainer_weekly_availability")
    .select("trainer_id, day_of_week, start_time, end_time, is_available")
    .eq("trainer_id", trainerId);

  if (error || !data?.length) {
    return defaultAvailabilityRows(trainerId);
  }

  return data;
}

async function fetchBookedRows(trainerId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("session_date, start_time, end_time, status")
    .eq("trainer_id", trainerId)
    .gte("session_date", today)
    .in("status", ["scheduled", "rescheduled", "pending_reschedule"]);

  if (error) {
    return [];
  }

  return data || [];
}

function buildBookedKeys(bookedRows) {
  return new Set((bookedRows || []).map((row) => {
    const date = new Date(`${row.session_date}T00:00:00`);
    const day = weeklyTrainingDays.find((item) => dayIndexes[item.key] === date.getDay())?.key;
    return `${day}|${normalizeTime(row.start_time)}|${normalizeTime(row.end_time)}`;
  }));
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateBookedKeys(bookedRows, excludeSessionId = "") {
  return new Set((bookedRows || [])
    .filter((row) => (row.workout_session_id || row.session_id) !== excludeSessionId)
    .map((row) => `${row.session_date}|${normalizeTime(row.start_time)}|${normalizeTime(row.end_time)}`));
}

export async function getTrainerWeeklyAvailability(trainerId) {
  if (!supabase || !trainerId) {
    return { data: buildWeeklyAvailabilityData(defaultAvailabilityRows(trainerId || "local-trainer")), error: null };
  }

  if (String(trainerId).startsWith("local-")) {
    return { data: buildWeeklyAvailabilityData(defaultAvailabilityRows(trainerId)), error: null };
  }

  const [availabilityRows, bookedRows] = await Promise.all([
    fetchAvailabilityRows(trainerId),
    fetchBookedRows(trainerId),
  ]);

  return { data: buildWeeklyAvailabilityData(availabilityRows, bookedRows), error: null };
}

export async function getTrainerOpenScheduleSlots(trainerId, options = {}) {
  const daysAhead = Number(options.daysAhead || 14);
  const excludeSessionId = options.excludeSessionId || "";

  if (!supabase || !trainerId || String(trainerId).startsWith("local-")) {
    const start = new Date();
    return {
      data: Array.from({ length: daysAhead }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index + 1);
        const day = weeklyTrainingDays.find((item) => dayIndexes[item.key] === date.getDay());
        return {
          date: toDateValue(date),
          label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          dayKey: day?.key || "monday",
          slots: weeklyTrainingSlots.map((slot) => ({ ...slot, available: true, booked: false })),
        };
      }),
      error: null,
    };
  }

  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + daysAhead + 1);

  const [availabilityRows, bookedResult] = await Promise.all([
    fetchAvailabilityRows(trainerId),
    supabase
      .from("workout_sessions")
      .select("workout_session_id,session_id,session_date,start_time,end_time,status")
      .eq("trainer_id", trainerId)
      .gte("session_date", toDateValue(start))
      .lte("session_date", toDateValue(end))
      .in("status", ["scheduled", "rescheduled", "pending_reschedule"]),
  ]);
  const bookedRows = bookedResult.error ? [] : bookedResult.data || [];
  const bookedKeys = buildDateBookedKeys(bookedRows, excludeSessionId);

  const data = Array.from({ length: daysAhead }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index + 1);
    const day = weeklyTrainingDays.find((item) => dayIndexes[item.key] === date.getDay()) || weeklyTrainingDays[0];
    const dateValue = toDateValue(date);
    const slots = weeklyTrainingSlots.map((slot) => {
      const configured = availabilityRows.find((row) =>
        row.day_of_week === day.key &&
        normalizeTime(row.start_time) === slot.startTime &&
        normalizeTime(row.end_time) === slot.endTime
      );
      const isConfiguredAvailable = configured ? configured.is_available !== false : true;
      const isBooked = bookedKeys.has(`${dateValue}|${slot.startTime}|${slot.endTime}`);
      return { ...slot, available: isConfiguredAvailable && !isBooked, booked: isBooked };
    });

    return {
      date: dateValue,
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      dayKey: day.key,
      slots,
    };
  });

  return { data, error: bookedResult.error || null };
}
