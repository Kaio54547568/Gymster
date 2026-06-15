import { test, expect } from "vitest";

import { generateSessionsForPackageRange } from "./workoutScheduleGenerator.js";

test("generates every selected weekly slot inside the active package date range", () => {
  expect(
    generateSessionsForPackageRange({
      schedule: "Monday / Wednesday, 07:00 - 08:00",
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    })
  ).toEqual([
    { sessionDate: "2026-06-01", startTime: "07:00", endTime: "08:00" },
    { sessionDate: "2026-06-03", startTime: "07:00", endTime: "08:00" },
  ]);
});

test("does not generate a session outside a package range with no matching weekday", () => {
  expect(
    generateSessionsForPackageRange({
      schedule: "Monday, 07:00 - 08:00",
      startDate: "2026-06-02",
      endDate: "2026-06-03",
    })
  ).toEqual([]);
});

test("repeats the fixed schedule throughout a 30-day package", () => {
  const sessions = generateSessionsForPackageRange({
    schedule: "Monday / Wednesday, 07:00 - 08:00",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });

  expect(sessions.length).toBe(9);
  expect(sessions[0].sessionDate).toBe("2026-06-01");
  expect(sessions.at(-1).sessionDate).toBe("2026-06-29");
});

test("generates sessions for compound schedules with different times", () => {
  expect(
    generateSessionsForPackageRange({
      schedule: "Monday, 07:00 - 08:00 & Wednesday, 18:00 - 19:00",
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    })
  ).toEqual([
    { sessionDate: "2026-06-01", startTime: "07:00", endTime: "08:00" },
    { sessionDate: "2026-06-03", startTime: "18:00", endTime: "19:00" },
  ]);
});
