import test from "node:test";
import assert from "node:assert/strict";

import {
  applyLocalTrainingRequestStatus,
  getTrainingRequestStatusLabel,
  isLocalTrainingRequestId,
} from "./trainingRequestLocal.js";

test("updates a local reschedule request without needing Supabase", () => {
  const rows = [{
    id: "LOCAL-TR-1",
    requestId: "LOCAL-TR-1",
    type: "reschedule",
    status: "pending_pt_approval",
    rawStatus: "pending_pt_approval",
    statusLabel: "Pending Approval",
    source: "local",
  }];

  const result = applyLocalTrainingRequestStatus(rows, "LOCAL-TR-1", "accepted");

  assert.equal(result.error, null);
  assert.equal(result.target.status, "accepted");
  assert.equal(result.target.statusLabel, "Accepted");
  assert.equal(result.rows[0].rawStatus, "accepted");
});

test("maps rejected local request statuses as declined", () => {
  assert.equal(getTrainingRequestStatusLabel("rejected"), "Declined");
});

test("detects local training request ids", () => {
  assert.equal(isLocalTrainingRequestId("LOCAL-TR-1"), true);
  assert.equal(isLocalTrainingRequestId("75f8449e-55a2-4ccc-a692-350c49d7d3bd"), false);
});
