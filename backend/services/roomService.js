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

export async function listRooms() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: rooms, error: roomsError } = await ready.client
      .from("rooms")
      .select("*")
      .order("room_code", { ascending: true });

    if (roomsError) throw roomsError;

    // Get equipment counts per room
    const { data: equipment, error: eqError } = await ready.client
      .from("equipment")
      .select("room_id");
    
    if (eqError) throw eqError;

    const counts = {};
    (equipment || []).forEach((item) => {
      if (item.room_id) {
        counts[item.room_id] = (counts[item.room_id] || 0) + 1;
      }
    });

    const mapped = (rooms || []).map((room) => ({
      id: room.room_id,
      roomCode: room.room_code,
      roomName: room.room_name,
      roomType: room.room_type,
      capacity: room.capacity,
      status: room.status,
      equipmentCount: counts[room.room_id] || 0,
    }));

    return { ok: true, data: mapped };
  } catch (error) {
    console.error("[Room] Failed to list rooms:", error);
    return { ok: false, status: 500, message: error.message || "Could not load rooms." };
  }
}

export async function getRoomStats() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data, error } = await ready.client.from("rooms").select("status");
    if (error) throw error;
    const rows = data || [];
    return {
      ok: true,
      data: {
        total: rows.length,
        active: rows.filter((r) => r.status === "active").length,
        maintenance: rows.filter((r) => r.status === "maintenance").length,
        inactive: rows.filter((r) => r.status === "inactive").length,
      },
    };
  } catch (error) {
    console.error("[Room] Failed to load stats:", error);
    return { ok: false, status: 500, message: error.message || "Could not load room stats." };
  }
}

export async function createRoom(body = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const roomCode = String(body.roomCode || "").trim();
    const roomName = String(body.roomName || "").trim();
    const roomType = String(body.roomType || "").trim();
    const capacity = body.capacity !== undefined && body.capacity !== null ? Number(body.capacity) : null;
    const status = String(body.status || "active").trim().toLowerCase();

    if (!roomCode || !roomName || !roomType || capacity === null || !status) {
      return { ok: false, status: 400, message: "Missing required room fields." };
    }

    if (isNaN(capacity) || capacity < 0) {
      return { ok: false, status: 400, message: "Capacity must be a non-negative integer." };
    }

    if (!["active", "inactive", "maintenance"].includes(status)) {
      return { ok: false, status: 400, message: "Invalid room status." };
    }

    const { data, error } = await ready.client
      .from("rooms")
      .insert({
        room_code: roomCode,
        room_name: roomName,
        room_type: roomType,
        capacity,
        status,
      })
      .select("*")
      .single();

    if (error) {
      if (String(error.message || "").toLowerCase().includes("duplicate")) {
        return { ok: false, status: 409, message: "Room code already exists." };
      }
      throw error;
    }

    return {
      ok: true,
      success: true,
      data: {
        id: data.room_id,
        roomCode: data.room_code,
        roomName: data.room_name,
        roomType: data.room_type,
        capacity: data.capacity,
        status: data.status,
        equipmentCount: 0,
      },
    };
  } catch (error) {
    console.error("[Room] Failed to create room:", error);
    return { ok: false, status: 500, message: error.message || "Could not create room." };
  }
}

export async function updateRoom(id, body = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const roomName = String(body.roomName || "").trim();
    const roomType = String(body.roomType || "").trim();
    const capacity = body.capacity !== undefined && body.capacity !== null ? Number(body.capacity) : null;
    const status = String(body.status || "").trim().toLowerCase();

    if (!roomName || !roomType || capacity === null || !status) {
      return { ok: false, status: 400, message: "Missing required room fields." };
    }

    if (isNaN(capacity) || capacity < 0) {
      return { ok: false, status: 400, message: "Capacity must be a non-negative integer." };
    }

    if (!["active", "inactive", "maintenance"].includes(status)) {
      return { ok: false, status: 400, message: "Invalid room status." };
    }

    const { data, error } = await ready.client
      .from("rooms")
      .update({
        room_name: roomName,
        room_type: roomType,
        capacity,
        status,
      })
      .eq("room_id", id)
      .select("*")
      .single();

    if (error) throw error;

    const { count, error: countError } = await ready.client
      .from("equipment")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
    
    if (countError) throw countError;

    return {
      ok: true,
      success: true,
      data: {
        id: data.room_id,
        roomCode: data.room_code,
        roomName: data.room_name,
        roomType: data.room_type,
        capacity: data.capacity,
        status: data.status,
        equipmentCount: count || 0,
      },
    };
  } catch (error) {
    console.error("[Room] Failed to update room:", error);
    return { ok: false, status: 500, message: error.message || "Could not update room." };
  }
}

export async function deleteRoom(id) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    // 1. Check if referenced in equipment
    const { count: eqCount, error: eqError } = await ready.client
      .from("equipment")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
    if (eqError) throw eqError;

    if (eqCount > 0) {
      return { ok: false, status: 409, message: "Room is in use by gym equipment. Please change room status to Inactive instead." };
    }

    // 2. Check if referenced in maintenance_reports
    const { count: reportCount, error: reportError } = await ready.client
      .from("maintenance_reports")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
    if (reportError) throw reportError;

    if (reportCount > 0) {
      return { ok: false, status: 409, message: "Room has associated maintenance reports. Please change room status to Inactive instead." };
    }

    // 3. Check if referenced in maintenance_records
    const { count: recordCount, error: recordError } = await ready.client
      .from("maintenance_records")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
    if (recordError) throw recordError;

    if (recordCount > 0) {
      return { ok: false, status: 409, message: "Room has associated maintenance history. Please change room status to Inactive instead." };
    }

    // 4. Check if referenced in workout_sessions
    const { count: sessionCount, error: sessionError } = await ready.client
      .from("workout_sessions")
      .select("*", { count: "exact", head: true })
      .eq("room_id", id);
    if (sessionError) throw sessionError;

    if (sessionCount > 0) {
      return { ok: false, status: 409, message: "Room has scheduled workout sessions. Please change room status to Inactive instead." };
    }

    // Perform hard delete
    const { error: deleteError } = await ready.client
      .from("rooms")
      .delete()
      .eq("room_id", id);
    
    if (deleteError) throw deleteError;

    return { ok: true };
  } catch (error) {
    console.error("[Room] Failed to delete room:", error);
    return { ok: false, status: 500, message: error.message || "Could not delete room." };
  }
}
