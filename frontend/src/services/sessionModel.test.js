import { test, expect } from "vitest";

import { getSessionStatusLabel, normalizeSessionStatus } from "./sessionModel.js";

test("normalizes legacy workout session states into the three primary statuses", () => {
  expect(normalizeSessionStatus("Done")).toBe("completed");
  expect(normalizeSessionStatus("no_show")).toBe("incomplete");
  expect(normalizeSessionStatus("Pending Reschedule")).toBe("scheduled");
  expect(getSessionStatusLabel("missed")).toBe("Incomplete");
});
