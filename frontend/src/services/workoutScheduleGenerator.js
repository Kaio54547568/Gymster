const dayIndexes = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function toLocalDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSingleSchedulePart(schedule) {
  const [daysText = "", timeText = ""] = String(schedule || "").split(",");
  const [startTime = "07:00", endTime = "08:00"] = timeText.split("-").map((value) => value.trim());
  const days = daysText
    .split("/")
    .map((day) => day.trim().toLowerCase())
    .map((day) => dayIndexes[day])
    .filter((day) => day !== undefined);

  return { days, startTime, endTime };
}

export function parseFixedSchedule(schedule) {
  const parts = String(schedule || "").split("&");
  if (parts.length > 1) {
    const days = [];
    const timeSlots = [];
    parts.forEach((part) => {
      const parsedPart = parseSingleSchedulePart(part.trim());
      parsedPart.days.forEach((d) => {
        days.push(d);
        timeSlots.push({ day: d, startTime: parsedPart.startTime, endTime: parsedPart.endTime });
      });
    });
    return { days, isCompound: true, timeSlots };
  }
  return parseSingleSchedulePart(schedule);
}

export function generateSessionsForPackageRange({ schedule, startDate, endDate }) {
  const parsed = parseFixedSchedule(schedule);
  const rangeStart = toLocalDate(startDate);
  const rangeEnd = toLocalDate(endDate);

  if (!rangeStart || !rangeEnd || rangeStart > rangeEnd || !parsed.days.length) {
    return [];
  }

  const sessions = [];
  const cursor = new Date(rangeStart);

  while (cursor <= rangeEnd) {
    const currentDay = cursor.getDay();
    if (parsed.isCompound) {
      const slots = parsed.timeSlots.filter((s) => s.day === currentDay);
      slots.forEach((slot) => {
        sessions.push({
          sessionDate: toDateValue(cursor),
          startTime: slot.startTime,
          endTime: slot.endTime,
        });
      });
    } else {
      if (parsed.days.includes(currentDay)) {
        sessions.push({
          sessionDate: toDateValue(cursor),
          startTime: parsed.startTime,
          endTime: parsed.endTime,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}

export function generateUpcomingSessions(schedule, count = 4, fromDate = new Date()) {
  const parsed = parseFixedSchedule(schedule);
  const days = parsed.days.length ? parsed.days : [fromDate.getDay()];
  const sessions = [];
  const cursor = toLocalDate(fromDate) || new Date();
  cursor.setDate(cursor.getDate() + 1);

  while (sessions.length < count) {
    const currentDay = cursor.getDay();
    if (parsed.isCompound) {
      const slots = parsed.timeSlots.filter((s) => s.day === currentDay);
      slots.forEach((slot) => {
        if (sessions.length < count) {
          sessions.push({
            sessionDate: toDateValue(cursor),
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      });
    } else {
      if (days.includes(currentDay)) {
        sessions.push({
          sessionDate: toDateValue(cursor),
          startTime: parsed.startTime,
          endTime: parsed.endTime,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}
