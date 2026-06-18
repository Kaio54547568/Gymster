import { createClient } from "@supabase/supabase-js";

let supabaseClient;

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredValue(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 && !normalized.startsWith("your_");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredValue(supabaseKey)) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }
  return { ok: true, client };
}

function normalizeStatus(value) {
  const status = String(value || "").toLowerCase().replace(/\s+/g, "_");
  if (["active", "in_use", "under_maintenance", "broken", "retired"].includes(status)) return status;
  if (status === "available") return "active";
  if (status === "under_maintenance" || status === "maintenance") return "under_maintenance";
  return "active";
}

function displayStatus(status) {
  switch (status) {
    case "active": return "Available";
    case "in_use": return "In Use";
    case "under_maintenance": return "Maintenance";
    case "broken": return "Broken";
    case "retired": return "Retired";
    default: return "Available";
  }
}

function mapEquipment(row, roomsById = {}) {
  const room = roomsById[row.room_id] || {};
  return {
    id: row.equipment_id,
    equipmentId: row.equipment_id,
    equipmentCode: row.equipment_code || row.equipment_id,
    equipmentName: row.equipment_name,
    category: row.category || "",
    description: row.description || "",
    status: displayStatus(row.status),
    rawStatus: row.status,
    purchaseDate: row.purchase_date || "",
    location: room.room_name || room.room_code || "",
    roomId: row.room_id || "",
    notes: row.notes || "",
    brand: row.brand || "",
    manufacturer: row.brand || "",
    model: row.model || "",
    serialNumber: row.serial_number || "",
    serial_number: row.serial_number || "",
    lastMaintenanceDate: row.last_maintenance_date || "",
    nextMaintenanceDate: row.next_maintenance_date || "",
  };
}

async function fetchRoomsByIds(client, roomIds) {
  const ids = [...new Set((roomIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await client
    .from("rooms")
    .select("room_id,room_code,room_name,room_type,status")
    .in("room_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((room) => [room.room_id, room]));
}

async function resolveRoomId(client, location) {
  const name = String(location || "").trim();
  if (!name) return null;

  const { data: existing, error: existingError } = await client
    .from("rooms")
    .select("room_id")
    .or(`room_name.eq.${name},room_code.eq.${name}`)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.room_id) return existing.room_id;

  const roomCode = `ROOM-${name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || Date.now()}`;
  const { data: created, error: createError } = await client
    .from("rooms")
    .insert({
      room_code: roomCode,
      room_name: name,
      room_type: "Equipment",
      status: "active",
    })
    .select("room_id")
    .single();
  if (createError) throw createError;
  return created.room_id;
}

function payloadFromForm(body, roomId) {
  return {
    equipment_code: String(body.equipment_code || body.equipmentCode || body.maThietBi || "").trim(),
    equipment_name: String(body.name || body.equipment_name || body.equipmentName || body.tenThietBi || "").trim(),
    category: String(body.category || body.type || body.loaiThietBi || "").trim(),
    room_id: roomId,
    status: normalizeStatus(body.status || body.trangThai),
    purchase_date: body.purchase_date || body.purchaseDate || body.ngayNhap || null,
    description: String(body.description || body.moTa || "").trim(),
    brand: String(body.manufacturer || body.brand || "").trim(),
    model: String(body.model || "").trim(),
    serial_number: String(body.serial_number || body.serialNumber || "").trim(),
    last_maintenance_date: body.last_maintenance_date || body.lastMaintenanceDate || null,
    notes: String(body.notes || body.ghiChu || "").trim(),
  };
}

export async function listEquipments() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data, error } = await ready.client
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const roomsById = await fetchRoomsByIds(ready.client, (data || []).map((row) => row.room_id));
    return { ok: true, data: (data || []).map((row) => mapEquipment(row, roomsById)) };
  } catch (error) {
    console.error("[Equipment] Failed to list equipment:", error);
    return { ok: false, status: 500, message: error.message || "Could not load equipment." };
  }
}

export async function getEquipmentStats() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data, error } = await ready.client.from("equipment").select("status");
    if (error) throw error;
    const rows = data || [];
    return {
      ok: true,
      data: {
        total: rows.length,
        active: rows.filter((row) => row.status === "active").length,
        inUse: rows.filter((row) => row.status === "in_use").length,
        maintenance: rows.filter((row) => row.status === "under_maintenance").length,
      },
    };
  } catch (error) {
    console.error("[Equipment] Failed to load stats:", error);
    return { ok: false, status: 500, message: error.message || "Could not load equipment stats." };
  }
}

export async function createEquipment(body = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const roomId = await resolveRoomId(ready.client, body.location || body.tenPhong);
    const payload = payloadFromForm(body, roomId);
    if (!payload.equipment_code || !payload.equipment_name || !payload.category || !payload.purchase_date) {
      return { ok: false, status: 400, message: "Missing required equipment fields." };
    }

    const { data, error } = await ready.client
      .from("equipment")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    const roomsById = await fetchRoomsByIds(ready.client, [data.room_id]);
    return { ok: true, success: true, data: mapEquipment(data, roomsById) };
  } catch (error) {
    console.error("[Equipment] Failed to create equipment:", error);
    const message = String(error.message || "");
    if (message.toLowerCase().includes("duplicate")) {
      return { ok: false, status: 409, message: "Equipment code already exists." };
    }
    return { ok: false, status: 500, message: message || "Could not create equipment." };
  }
}

export async function updateEquipment(id, body = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const roomId = await resolveRoomId(ready.client, body.location || body.tenPhong);
    const payload = payloadFromForm(body, roomId);
    delete payload.equipment_code;
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") payload[key] = null;
    });

    const { data, error } = await ready.client
      .from("equipment")
      .update(payload)
      .eq("equipment_id", id)
      .select("*")
      .single();
    if (error) throw error;
    const roomsById = await fetchRoomsByIds(ready.client, [data.room_id]);
    return { ok: true, success: true, data: mapEquipment(data, roomsById) };
  } catch (error) {
    console.error("[Equipment] Failed to update equipment:", error);
    return { ok: false, status: 500, message: error.message || "Could not update equipment." };
  }
}

export async function deleteEquipment(id) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { error } = await ready.client.from("equipment").delete().eq("equipment_id", id);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error("[Equipment] Failed to delete equipment:", error);
    return { ok: false, status: 500, message: error.message || "Could not delete equipment." };
  }
}
