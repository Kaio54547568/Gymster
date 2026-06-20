function normalizeFeedbackStatus(status, kind) {
  if (status === "Resolved") return "resolved";
  if (status === "Rejected") return "rejected";
  if (status === "In Review") return "in_review";
  return kind === "Complaint" ? "open" : "submitted";
}

export async function updateFeedbackActivity(client, actor, kind, id, payload) {
  if (!actor.employee?.employee_id) return { ok: false, status: 403, message: "An employee profile is required." };
  const employeeId = actor.employee.employee_id;
  const now = new Date().toISOString();
  const status = normalizeFeedbackStatus(payload.status, kind);
  const isComplaint = kind === "complaint";
  const table = isComplaint ? "complaints" : "service_feedback";
  const idColumn = isComplaint ? "complaint_id" : "feedback_id";
  const values = isComplaint
    ? {
      status,
      assigned_employee_id: employeeId,
      resolution_note: String(payload.response || ""),
      resolved_at: status === "resolved" ? now : null,
      resolved_by_employee_id: status === "resolved" ? employeeId : null,
    }
    : {
      status,
      staff_response: String(payload.response || ""),
      responded_at: now,
      responded_by_employee_id: employeeId,
    };
  const { data, error } = await client.from(table).update(values).eq(idColumn, id).select("*").single();
  if (error) throw error;
  return { ok: true, data };
}

export async function createMaintenanceActivity(client, actor, payload) {
  if (!actor.user?.user_id) return { ok: false, status: 403, message: "A Gymster user profile is required." };
  const values = {
    equipment_id: payload.equipmentId || null,
    room_id: payload.roomId || null,
    reported_by_user_id: actor.user.user_id,
    issue_title: String(payload.issueTitle || "Equipment issue"),
    issue_description: String(payload.issueDescription || ""),
    priority: payload.priority || "medium",
    status: "submitted",
  };
  const { data, error } = await client.from("maintenance_reports").insert(values).select("*").single();
  if (error) throw error;
  if (values.equipment_id) {
    await client.from("equipment").update({ status: "broken" }).eq("equipment_id", values.equipment_id);
  }
  const { data: adminUsers } = await client.from("users").select("user_id").in("role", ["admin", "owner"]);
  if (adminUsers?.length) {
    await client.from("notifications").insert(adminUsers.map((admin) => ({
      user_id: admin.user_id,
      notification_type: "system",
      title: "New maintenance report",
      message: `${values.issue_title}: ${values.issue_description || "New issue reported by staff."}`,
      is_read: false,
    })));
  }
  return { ok: true, data };
}

export async function resolveMaintenanceActivity(client, actor, reportId, payload) {
  if (!actor.employee?.employee_id) return { ok: false, status: 403, message: "An employee profile is required." };
  const employeeId = actor.employee.employee_id;
  const completedAt = new Date().toISOString();
  const { data: report, error: readError } = await client
    .from("maintenance_reports")
    .select("maintenance_report_id,equipment_id")
    .eq("maintenance_report_id", reportId)
    .maybeSingle();
  if (readError) throw readError;
  if (!report) return { ok: false, status: 404, message: "Maintenance report was not found." };

  const { error: reportError } = await client.from("maintenance_reports").update({
    status: "resolved",
    resolved_at: completedAt,
    resolved_by_employee_id: employeeId,
  }).eq("maintenance_report_id", reportId);
  if (reportError) throw reportError;

  if (report.equipment_id) {
    const { error: equipmentError } = await client.from("equipment").update({
      status: "active",
      last_maintenance_date: completedAt.slice(0, 10),
    }).eq("equipment_id", report.equipment_id);
    if (equipmentError) throw equipmentError;
    const { error: recordError } = await client.from("maintenance_records").insert({
      maintenance_report_id: reportId,
      equipment_id: report.equipment_id,
      handled_by_employee_id: employeeId,
      maintenance_type: "repair",
      description: String(payload.description || "Staff marked maintenance as completed."),
      completed_at: completedAt,
    });
    if (recordError) throw recordError;
  }
  return { ok: true, data: { reportId, equipmentId: report.equipment_id, completedAt } };
}
