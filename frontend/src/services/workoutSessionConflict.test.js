import test from "node:test";
import assert from "node:assert/strict";

import { findConflictingPtSession } from "./workoutSessionConflict.js";

test("rejects a manual workout that overlaps a PT session", () => {
  const conflict = findConflictingPtSession({
    sessionDate: "2026-06-04",
    startTime: "07:30",
    endTime: "08:30",
  }, [{
    sessionDate: "2026-06-04",
    startTime: "07:00",
    endTime: "08:00",
    trainerId: "trainer-1",
    status: "scheduled",
  }]);

  assert.equal(conflict?.trainerId, "trainer-1");
});
