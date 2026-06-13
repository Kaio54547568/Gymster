import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_NOTIFICATIONS_KEY = "gymster_local_notifications";
const NOTIFICATION_CHANGE_EVENT = "gymster-role-notifications-change";

const notificationColumns = `
  notification_id,
  user_id,
  notification_type,
  title,
  message,
  action_type,
  action_payload,
  is_read,
  read_at,
  created_at
`;
const legacyNotificationColumns = `
  notification_id,
  user_id,
  notification_type,
  title,
  message,
  is_read,
  read_at,
  created_at
`;

function isMissingActionColumn(error) {
  return error?.code === "42703" && String(error?.message || "").includes("notifications.action_");
}

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

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readLocalNotifications() {
  if (!canUseStorage()) return [];
  try {
    const rows = JSON.parse(window.localStorage.getItem(LOCAL_NOTIFICATIONS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    window.localStorage.removeItem(LOCAL_NOTIFICATIONS_KEY);
    return [];
  }
}

function writeLocalNotifications(rows) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(NOTIFICATION_CHANGE_EVENT));
}

function mapLocalNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId || "",
    notificationType: row.notificationType || "system",
    type: row.type || mapNotificationType(row.notificationType, row.title, row.message),
    title: row.title,
    message: row.message,
    actionType: row.actionType || "",
    actionPayload: row.actionPayload || {},
    time: formatNotificationTime(row.createdAt),
    read: Boolean(row.read),
    readAt: row.readAt || null,
    createdAt: row.createdAt,
    detail: row.message,
    source: "local",
  };
}

function getCurrentLocalNotificationTargets() {
  const currentUser = getCurrentUser();
  return {
    userId: String(currentUser?.userId || currentUser?.user_id || currentUser?.id || ""),
    memberId: String(currentUser?.memberId || currentUser?.member_id || currentUser?.id || ""),
    trainerId: String(currentUser?.trainerId || currentUser?.trainer_id || currentUser?.id || ""),
    role: String(currentUser?.role || currentUser?.userRole || "").toLowerCase(),
  };
}

function getLocalNotificationsForCurrentUser() {
  const targets = getCurrentLocalNotificationTargets();
  return readLocalNotifications()
    .filter((row) => {
      if (row.userId && row.userId === targets.userId) return true;
      if (row.memberId && row.memberId === targets.memberId) return true;
      if (row.trainerId && row.trainerId === targets.trainerId) return true;
      if (row.role && String(row.role).toLowerCase() === targets.role) return true;
      return !row.userId && !row.memberId && !row.trainerId && !row.role;
    })
    .map(mapLocalNotification)
    .filter(Boolean);
}

export function createLocalNotification(notification) {
  const now = new Date().toISOString();
  const row = {
    id: notification.id || `LOCAL-NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: notification.userId || notification.user_id || "",
    memberId: notification.memberId || notification.member_id || "",
    trainerId: notification.trainerId || notification.trainer_id || "",
    role: notification.role || "",
    notificationType: notification.notificationType || notification.notification_type || "system",
    type: notification.type || "info",
    title: notification.title || "Notification",
    message: notification.message || "",
    actionType: notification.actionType || notification.action_type || "",
    actionPayload: notification.actionPayload || notification.action_payload || {},
    read: Boolean(notification.read || notification.is_read),
    readAt: notification.read || notification.is_read ? now : null,
    createdAt: notification.createdAt || notification.created_at || now,
  };
  writeLocalNotifications([row, ...readLocalNotifications()]);
  return mapLocalNotification(row);
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
    actionType: row.action_type || "",
    actionPayload: row.action_payload || {},
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
    return { data: getLocalNotificationsForCurrentUser(), error: null };
  }

  try {
    const user = await resolveCurrentNotificationUser();
    if (!user?.user_id) {
      return { data: getLocalNotificationsForCurrentUser(), error: null };
    }

    let { data, error } = await supabase
      .from("notifications")
      .select(notificationColumns)
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false });
    if (isMissingActionColumn(error)) {
      ({ data, error } = await supabase
        .from("notifications")
        .select(legacyNotificationColumns)
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false }));
    }

    if (error) throw error;

    return { data: (data || []).map(mapNotificationRow).filter(Boolean), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load notifications:", error);
    const localNotifications = getLocalNotificationsForCurrentUser();
    return localNotifications.length ? { data: localNotifications, error: null } : { data: [], error };
  }
}

export async function markNotificationReadInSupabase(notificationId) {
  if (!supabase || String(notificationId || "").startsWith("LOCAL-")) {
    const now = new Date().toISOString();
    const rows = readLocalNotifications();
    writeLocalNotifications(rows.map((row) => row.id === notificationId ? { ...row, read: true, readAt: now } : row));
    return { data: mapLocalNotification(readLocalNotifications().find((row) => row.id === notificationId)), error: null };
  }

  try {
    let { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("notification_id", notificationId)
      .select(notificationColumns)
      .single();
    if (isMissingActionColumn(error)) {
      ({ data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("notification_id", notificationId)
        .select(legacyNotificationColumns)
        .single());
    }

    if (error) throw error;

    return { data: mapNotificationRow(data), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to mark notification read:", error);
    return { data: null, error };
  }
}

export async function markAllNotificationsReadInSupabase() {
  if (!supabase) {
    const now = new Date().toISOString();
    writeLocalNotifications(readLocalNotifications().map((row) => ({ ...row, read: true, readAt: row.readAt || now })));
    return { data: getLocalNotificationsForCurrentUser(), error: null };
  }

  try {
    const user = await resolveCurrentNotificationUser();
    if (!user?.user_id) {
      const now = new Date().toISOString();
      writeLocalNotifications(readLocalNotifications().map((row) => ({ ...row, read: true, readAt: row.readAt || now })));
      return { data: getLocalNotificationsForCurrentUser(), error: null };
    }

    let { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", user.user_id)
      .eq("is_read", false)
      .select(notificationColumns);
    if (isMissingActionColumn(error)) {
      ({ data, error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user.user_id)
        .eq("is_read", false)
        .select(legacyNotificationColumns));
    }

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

    const payload = {
      user_id: userId,
      notification_type: notification.notificationType || notification.notification_type || "system",
      title: notification.title,
      message: notification.message,
      action_type: notification.actionType || notification.action_type || null,
      action_payload: notification.actionPayload || notification.action_payload || {},
      is_read: Boolean(notification.read || notification.is_read),
      read_at: notification.read || notification.is_read ? new Date().toISOString() : null,
    };
    let { data, error } = await supabase
      .from("notifications")
      .insert(payload)
      .select(notificationColumns)
      .single();
    if (isMissingActionColumn(error)) {
      const legacyPayload = {
        user_id: payload.user_id,
        notification_type: payload.notification_type,
        title: payload.title,
        message: payload.message,
        is_read: payload.is_read,
        read_at: payload.read_at,
      };
      ({ data, error } = await supabase
        .from("notifications")
        .insert(legacyPayload)
        .select(legacyNotificationColumns)
        .single());
    }

    if (error) throw error;

    return { data: mapNotificationRow(data), error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create notification:", error);
    return { data: null, error };
  }
}
