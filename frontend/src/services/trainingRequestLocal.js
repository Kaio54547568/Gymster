export function getTrainingRequestStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    pending_pt_approval: "Pending Approval",
    accepted: "Accepted",
    approved: "Accepted",
    declined: "Declined",
    rejected: "Declined",
    expired: "Expired",
    cancelled: "Cancelled",
    completed: "Completed",
  };

  return labels[normalized] || status || "Pending Approval";
}

export function isLocalTrainingRequestId(requestId) {
  return String(requestId || "").startsWith("LOCAL-");
}

function getLocalRequestId(request) {
  return request?.requestId || request?.id || request?.trainingRequestId;
}

export function applyLocalTrainingRequestStatus(rows, requestId, status, declineReason = "") {
  const normalizedStatus = status === "approved" ? "accepted" : String(status || "").toLowerCase();
  const target = rows.find((item) => getLocalRequestId(item) === requestId);

  if (!target) {
    return {
      rows,
      target: null,
      error: new Error("Training request was not found."),
    };
  }

  const nextTarget = {
    ...target,
    status: normalizedStatus,
    rawStatus: normalizedStatus,
    statusLabel: getTrainingRequestStatusLabel(normalizedStatus),
    declineReason,
    decline_reason: declineReason,
  };

  return {
    rows: rows.map((item) => (getLocalRequestId(item) === getLocalRequestId(target) ? nextTarget : item)),
    target: nextTarget,
    error: null,
  };
}
