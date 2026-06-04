import test from "node:test";
import assert from "node:assert/strict";

import { getSessionStatusLabel, normalizeSessionStatus } from "./sessionModel.js";

test("normalizes legacy workout session states into the three primary statuses", () => {
  assert.equal(normalizeSessionStatus("Done"), "completed");
  assert.equal(normalizeSessionStatus("no_show"), "incomplete");
  assert.equal(normalizeSessionStatus("Pending Reschedule"), "scheduled");
  assert.equal(getSessionStatusLabel("missed"), "Incomplete");
});
