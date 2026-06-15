import { test, expect } from "vitest";

import {
  findConflictingPtSession,
  parseDateTimeAsGmt7,
  isSessionBefore2Hours,
} from "./workoutSessionConflict.js";

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

  expect(conflict?.trainerId).toBe("trainer-1");
});

test("does not flag conflict for different trainers", () => {
  const conflict = findConflictingPtSession({
    sessionDate: "2026-06-04",
    startTime: "07:30",
    endTime: "08:30",
    trainerId: "trainer-2",
  }, [{
    sessionDate: "2026-06-04",
    startTime: "07:00",
    endTime: "08:00",
    trainerId: "trainer-1",
    status: "scheduled",
  }]);

  expect(conflict).toBe(null);
});

test("flags conflict for the same trainer", () => {
  const conflict = findConflictingPtSession({
    sessionDate: "2026-06-04",
    startTime: "07:30",
    endTime: "08:30",
    trainerId: "trainer-1",
  }, [{
    sessionDate: "2026-06-04",
    startTime: "07:00",
    endTime: "08:00",
    trainerId: "trainer-1",
    status: "scheduled",
  }]);

  expect(conflict?.trainerId).toBe("trainer-1");
});

test("parseDateTimeAsGmt7 parses GMT+7 date time accurately", () => {
  const parsed = parseDateTimeAsGmt7("2026-06-15", "08:00");
  expect(parsed instanceof Date).toBe(true);
  expect(parsed.toISOString()).toBe("2026-06-15T01:00:00.000Z");
});

test("isSessionBefore2Hours detects if session start time is >= 2 hours from now", () => {
  // Let's create a future session date 3 hours from now
  const now = new Date();
  const future = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  // Format as GMT+7 YYYY-MM-DD and HH:MM
  const gmt7Future = new Date(future.getTime() + 7 * 60 * 60 * 1000);
  const dateStr = gmt7Future.toISOString().slice(0, 10);
  const timeStr = gmt7Future.toISOString().slice(11, 16);
  
  expect(isSessionBefore2Hours(dateStr, timeStr)).toBe(true);
  
  // Past or very close session
  const past = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const gmt7Past = new Date(past.getTime() + 7 * 60 * 60 * 1000);
  const pastDateStr = gmt7Past.toISOString().slice(0, 10);
  const pastTimeStr = gmt7Past.toISOString().slice(11, 16);
  
  expect(isSessionBefore2Hours(pastDateStr, pastTimeStr)).toBe(false);
});

