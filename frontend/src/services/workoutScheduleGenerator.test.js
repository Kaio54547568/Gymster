import test from "node:test";
import assert from "node:assert/strict";

import { generateSessionsForPackageRange } from "./workoutScheduleGenerator.js";

test("generates every selected weekly slot inside the active package date range", () => {
  assert.deepEqual(
    generateSessionsForPackageRange({
      schedule: "Monday / Wednesday, 07:00 - 08:00",
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    }),
    [
      { sessionDate: "2026-06-01", startTime: "07:00", endTime: "08:00" },
      { sessionDate: "2026-06-03", startTime: "07:00", endTime: "08:00" },
    ],
  );
});

test("does not generate a session outside a package range with no matching weekday", () => {
  assert.deepEqual(
    generateSessionsForPackageRange({
      schedule: "Monday, 07:00 - 08:00",
      startDate: "2026-06-02",
      endDate: "2026-06-03",
    }),
    [],
  );
});

test("repeats the fixed schedule throughout a 30-day package", () => {
  const sessions = generateSessionsForPackageRange({
    schedule: "Monday / Wednesday, 07:00 - 08:00",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });

  assert.equal(sessions.length, 9);
  assert.equal(sessions[0].sessionDate, "2026-06-01");
  assert.equal(sessions.at(-1).sessionDate, "2026-06-29");
});

test("generates sessions for compound schedules with different times", () => {
  assert.deepEqual(
    generateSessionsForPackageRange({
      schedule: "Monday, 07:00 - 08:00 & Wednesday, 18:00 - 19:00",
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    }),
    [
      { sessionDate: "2026-06-01", startTime: "07:00", endTime: "08:00" },
      { sessionDate: "2026-06-03", startTime: "18:00", endTime: "19:00" },
    ],
  );
});
