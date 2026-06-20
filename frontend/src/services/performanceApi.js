import { authenticatedJson } from "./authenticatedApi";

function queryString(filters) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function fetchPerformance(filters) {
  return authenticatedJson(`/api/admin/performance?${queryString(filters)}`);
}

export function fetchPerformanceDetail(employeeId, filters) {
  return authenticatedJson(`/api/admin/performance/${encodeURIComponent(employeeId)}?${queryString(filters)}`);
}

export function createPerformanceReview(payload) {
  return authenticatedJson("/api/admin/performance-reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePerformanceReview(id, payload) {
  return authenticatedJson(`/api/admin/performance-reviews/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
