import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const notificationColumns = `
  notification_id,
  user_id,
  notification_type,
  title,
  message,
  is_read,
  read_at,
  created_at
`;

function mapNotificationType(type, title = "", message = "") {
  const normalized = String(type || "").toLowerCase();
  const combined = `${title} ${message}`.toLowerCase();

  if (combined.includes("failed") || combined.includes("declined") || combined.includes("hỏng") || combined.includes("high priority")) {
    return "error";
  }

  if (normalized === "payment" && !combined.includes("pending")) {
    return "success";
  }

  if (normalized === "package" || combined.includes("pending") || combined.includes("expir")) {
    return "warning";
  }

  return "info";
}

function formatNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function mapNotificationRow(row) {
  if (!row) return null;

  return {
    id: row.notification_id,
    userId: row.user_id,
    notificationType: row.notification_type,
    type: mapNotificationType(row.notification_type, row.title, row.message),
    title: row.title,
    message: row.message,
    time: formatNotificationTime(row.created_at),
    read: Boolean(row.is_read),
    readAt: row.read_at,
    createdAt: row.created_at,
    detail: row.message,
    source: "supabase",
  };
}

async function resolveCurrentNotificationUser() {
  if (!supabase) return null;

  const currentUser = getCurrentUser();
  const directUserId = currentUser?.userId || currentUser?.user_id || currentUser?.id;

  if (directUserId && uuidPattern.test(String(directUserId))) {
    const { data } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", directUserId)
      .maybeSingle();

    if (data?.user_id) return data;
  }

  const email = currentUser?.email ? String(currentUser.email).toLowerCase() : "";
  if (email) {
    const { data } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (data?.user_id) return data;
  }

  const username = currentUser?.username ? String(currentUser.username) : "";
  if (username) {
    const { data } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (data?.user_id) return data;
  }

  return null;
}

export async function getNotificationsForCurrentUser() {
  if (!supabase) {
    return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  }

  try {
    const user = await resolveCurrentNotificationUser();
    if (!user?.user_id) {
      return { data: [], error: new Error("Unable to resolve current h\u1ec7 th\u1ed1ng user.") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(notificationColumns)
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: (data || []).map(mapNotificationRow).filter(Boolean), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load notifications:", error);
    return { data: [], error };
  }
}

export async function markNotificationReadInSupabase(notificationId) {
  if (!supabase) {
    return { data: null, error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  }

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("notification_id", notificationId)
      .select(notificationColumns)
      .single();

    if (error) throw error;

    return { data: mapNotificationRow(data), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to mark notification read:", error);
    return { data: null, error };
  }
}

export async function markAllNotificationsReadInSupabase() {
  if (!supabase) {
    return { data: [], error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  }

  try {
    const user = await resolveCurrentNotificationUser();
    if (!user?.user_id) {
      return { data: [], error: new Error("Unable to resolve current h\u1ec7 th\u1ed1ng user.") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.user_id)
      .eq("is_read", false)
      .select(notificationColumns);

    if (error) throw error;

    return { data: (data || []).map(mapNotificationRow).filter(Boolean), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to mark all notifications read:", error);
    return { data: [], error };
  }
}

export async function createNotification(notification) {
  if (!supabase) {
    return { data: null, error: new Error("Missing h\u1ec7 th\u1ed1ng environment variables.") };
  }

  try {
    const user = await resolveCurrentNotificationUser();
    const userId = notification.userId || notification.user_id || user?.user_id;

    if (!userId || !uuidPattern.test(String(userId))) {
      return { data: null, error: new Error("A valid h\u1ec7 th\u1ed1ng user_id is required to create a notification.") };
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        notification_type: notification.notificationType || notification.notification_type || "system",
        title: notification.title,
        message: notification.message,
        is_read: Boolean(notification.read || notification.is_read),
        read_at: notification.read || notification.is_read ? new Date().toISOString() : null,
      })
      .select(notificationColumns)
      .single();

    if (error) throw error;

    return { data: mapNotificationRow(data), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create notification:", error);
    return { data: null, error };
  }
}
