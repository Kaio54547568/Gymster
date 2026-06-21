const dayIndexes = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const vietnameseDayIndexes = {
  "chu nhat": 0,
  "cn": 0,
  "thu 2": 1,
  "thu hai": 1,
  "thu 3": 2,
  "thu ba": 2,
  "thu 4": 3,
  "thu tu": 3,
  "thu 5": 4,
  "thu nam": 4,
  "thu 6": 5,
  "thu sau": 5,
  "thu 7": 6,
  "thu bay": 6,
};

function normalizeDayText(day) {
  return String(day || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ");
}

function parseDayIndex(day) {
  const normalizedDay = normalizeDayText(day);
  return dayIndexes[normalizedDay] ?? vietnameseDayIndexes[normalizedDay];
}

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
    .map(parseDayIndex)
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
