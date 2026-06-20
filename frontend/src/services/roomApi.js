async function roomJson(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      const errorMsg = data.message || data.error || "Room API request failed.";
      const error = new Error(errorMsg);
      error.status = response.status;
      return { data: null, error };
    }
    return { data: data.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function fetchRooms() {
  return roomJson("/api/rooms");
}

export async function fetchRoomStats() {
  return roomJson("/api/rooms/stats");
}

export async function createRoomRecord(form) {
  return roomJson("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}

export async function updateRoomRecord(id, form) {
  return roomJson(`/api/rooms/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}

export async function deleteRoomRecord(id) {
  return roomJson(`/api/rooms/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
