import { test, expect } from "vitest";

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

  expect(result.error).toBe(null);
  expect(result.target.status).toBe("accepted");
  expect(result.target.statusLabel).toBe("Accepted");
  expect(result.rows[0].rawStatus).toBe("accepted");
});

test("maps rejected local request statuses as declined", () => {
  expect(getTrainingRequestStatusLabel("rejected")).toBe("Declined");
});

test("detects local training request ids", () => {
  expect(isLocalTrainingRequestId("LOCAL-TR-1")).toBe(true);
  expect(isLocalTrainingRequestId("75f8449e-55a2-4ccc-a692-350c49d7d3bd")).toBe(false);
});
