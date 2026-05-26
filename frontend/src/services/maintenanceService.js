import { supabase } from "./supabaseClient";

const reportColumns = `
  maintenance_report_id,
  equipment_id,
  room_id,
  reported_by_user_id,
  issue_title,
  issue_description,
  priority,
  status,
  resolved_at,
  created_at,
  updated_at
`;

function toDisplayStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "in_review") return "In Review";
  if (normalized === "in_progress") return "In Repair";
  if (normalized === "resolved") return "Fixed";
  if (normalized === "rejected") return "Unusable";
  return "Reported";
}

function toDbStatus(status) {
  if (status === "In Review") return "in_review";
  if (status === "In Repair") return "in_progress";
  if (status === "Fixed") return "resolved";
  if (status === "Unusable") return "rejected";
  return "submitted";
}

function toDisplayPriority(priority) {
  const normalized = String(priority || "medium").toLowerCase();
  if (normalized === "high" || normalized === "urgent") return "High";
  if (normalized === "low") return "Low";
  return "Medium";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function combineUserName(user, fallback = "Unknown") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || user?.username || fallback;
}

async function getEquipmentById(equipmentIds) {
  const ids = [...new Set((equipmentIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("equipment")
    .select("equipment_id,equipment_code,equipment_name,room_id")
    .in("equipment_id", ids);

  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(data.map((item) => [item.equipment_id, item]));
}

async function getRoomsById(roomIds) {
  const ids = [...new Set((roomIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("rooms")
    .select("room_id,room_name")
    .in("room_id", ids);

  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(data.map((room) => [room.room_id, room.room_name]));
}

async function getUsersById(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("users")
    .select("user_id,username,first_name,last_name")
    .in("user_id", ids);

  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(data.map((user) => [user.user_id, user]));
}

async function getRecordsByReportId(reportIds) {
  const ids = [...new Set((reportIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("maintenance_records")
    .select("maintenance_report_id,description,completed_at,created_at,maintenance_type")
    .in("maintenance_report_id", ids)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) return {};

  return data.reduce((acc, record) => {
    if (!acc[record.maintenance_report_id]) acc[record.maintenance_report_id] = [];
    acc[record.maintenance_report_id].push(record);
    return acc;
  }, {});
}

function mapReport(row, context) {
  const equipment = context.equipmentById[row.equipment_id] || {};
  const roomName = context.roomsById[row.room_id] || context.roomsById[equipment.room_id] || "Unassigned";
  const user = context.usersById[row.reported_by_user_id] || {};
  const records = context.recordsByReportId[row.maintenance_report_id] || [];
  const latestRecord = records[records.length - 1];
  const createdDate = formatDate(row.created_at);

  return {
    id: row.maintenance_report_id,
    reportCode: `MR-${String(row.maintenance_report_id || "").slice(0, 6).toUpperCase()}`,
    equipmentName: equipment.equipment_name || row.issue_title || "Equipment",
    room: roomName,
    issueDescription: row.issue_description || row.issue_title || "",
    reportedDate: createdDate,
    reportedBy: combineUserName(user, "Staff"),
    severity: toDisplayPriority(row.priority),
    status: toDisplayStatus(row.status),
    maintenanceNote: latestRecord?.description || "",
    history: [
      { date: createdDate, action: "Reported by staff", note: row.issue_description || row.issue_title || "" },
      ...records.map((record) => ({
        date: formatDate(record.completed_at || record.created_at),
        action: record.maintenance_type ? `Maintenance ${record.maintenance_type}` : "Maintenance update",
        note: record.description || "",
      })),
    ],
  };
}

export async function getMaintenanceReports() {
  if (!supabase) {
    return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  }

  try {
    const { data: reports, error } = await supabase
      .from("maintenance_reports")
      .select(reportColumns)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const reportRows = reports || [];
    const equipmentById = await getEquipmentById(reportRows.map((report) => report.equipment_id));
    const roomIds = [
      ...reportRows.map((report) => report.room_id),
      ...Object.values(equipmentById).map((equipment) => equipment.room_id),
    ];
    const [roomsById, usersById, recordsByReportId] = await Promise.all([
      getRoomsById(roomIds),
      getUsersById(reportRows.map((report) => report.reported_by_user_id)),
      getRecordsByReportId(reportRows.map((report) => report.maintenance_report_id)),
    ]);

    return {
      data: reportRows.map((report) => mapReport(report, { equipmentById, roomsById, usersById, recordsByReportId })),
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load maintenance reports:", error);
    return { data: [], error };
  }
}

export async function updateMaintenanceReport(id, updates) {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  try {
    const payload = {};

    if (updates.status) {
      payload.status = toDbStatus(updates.status);
      payload.resolved_at = updates.status === "Fixed" ? new Date().toISOString() : null;
    }

    if (Object.keys(payload).length) {
      const { error } = await supabase
        .from("maintenance_reports")
        .update(payload)
        .eq("maintenance_report_id", id);

      if (error) throw error;
    }

    if (updates.maintenanceNote !== undefined) {
      const { data: report, error: reportError } = await supabase
        .from("maintenance_reports")
        .select("maintenance_report_id,equipment_id")
        .eq("maintenance_report_id", id)
        .maybeSingle();

      if (reportError) throw reportError;

      const note = String(updates.maintenanceNote || "").trim();
      if (note) {
        const { error: recordError } = await supabase
          .from("maintenance_records")
          .insert({
            maintenance_report_id: id,
            equipment_id: report?.equipment_id || null,
            maintenance_type: updates.status === "Fixed" ? "repair" : "inspection",
            description: note,
            completed_at: updates.status === "Fixed" ? new Date().toISOString() : null,
          });

        if (recordError) throw recordError;
      }
    }

    return { ok: true, message: "Maintenance report updated." };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update maintenance report:", error);
    return { ok: false, message: "Maintenance report could not be updated." };
  }
}
