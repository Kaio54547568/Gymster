import seedUsers from "../test_data/users.json";
import { supabase } from "./supabaseClient";

const USERS_KEY = "gymster_test_data_users";
const CURRENT_USER_KEY = "gymster_current_user";

const ROLE_HOME = {
  admin: "/admin",
  owner: "/admin",
  staff: "/staff",
  pt: "/pt",
  trainer: "/pt",
  member: "/member",
};

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function toFrontendRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "trainer") return "pt";
  return normalized;
}

function toFrontendAccountStatus(status) {
  const normalized = String(status || "active").toLowerCase();
  const statusMap = {
    pending_onboarding: "PendingOnboarding",
    pending_pt_approval: "PendingPTApproval",
    pending_payment: "PendingPayment",
    active: "Active",
    cancelled: "Cancelled",
    inactive: "Inactive",
    suspended: "Suspended",
  };

  return statusMap[normalized] || "Active";
}

function combineName(row, fallback = "") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getUsers() {
  if (!canUseStorage()) {
    return seedUsers;
  }

  const storedUsers = window.localStorage.getItem(USERS_KEY);
  if (storedUsers) {
    const parsedUsers = JSON.parse(storedUsers);
    const mergedUsers = [
      ...parsedUsers,
      ...seedUsers.filter((seedUser) => {
        return !parsedUsers.some((user) => user.username === seedUser.username || user.email === seedUser.email);
      }),
    ];

    if (mergedUsers.length !== parsedUsers.length) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(mergedUsers));
    }

    return mergedUsers;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  return seedUsers;
}

export function saveUsers(users) {
  if (canUseStorage()) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function loginLocalUser(identifier, password) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = getUsers().find((item) => {
    return (
      item.username.toLowerCase() === normalizedIdentifier ||
      item.email.toLowerCase() === normalizedIdentifier
    );
  });

  if (!user || user.password !== password) {
    return { ok: false, message: "Username, email, or password is incorrect." };
  }

  const { password: _password, ...safeUser } = user;
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  }

  return { ok: true, user: safeUser };
}

function isDemoPasswordMatch(user, password) {
  const storedPassword = user?.password_hash || user?.password || "";
  return storedPassword === password || storedPassword === `demo-only:${password}`;
}

async function findMemberIdByUserId(userId) {
  if (!supabase || !userId) return null;

  const { data } = await supabase
    .from("members")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.member_id || null;
}

async function findTrainerIdByUserId(userId) {
  if (!supabase || !userId) return null;

  const { data } = await supabase
    .from("trainers")
    .select("trainer_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.trainer_id || null;
}

async function mapSupabaseUser(user) {
  const frontendRole = toFrontendRole(user.role);
  const safeUser = {
    id: user.user_id,
    userId: user.user_id,
    user_id: user.user_id,
    username: user.username || "",
    email: user.email || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    fullName: combineName(user, user.username || ""),
    phone: user.phone_number || "",
    phone_number: user.phone_number || "",
    dob: user.date_of_birth || "",
    date_of_birth: user.date_of_birth || "",
    gender: user.gender || "unspecified",
    avatarUrl: user.avatar_url || "",
    avatar_url: user.avatar_url || "",
    headline: user.headline || "",
    preferredLanguage: user.preferred_language || "en",
    preferred_language: user.preferred_language || "en",
    role: frontendRole,
    sourceRole: user.role,
    accountStatus: toFrontendAccountStatus(user.account_status),
    account_status: user.account_status || "active",
  };

  if (frontendRole === "member") {
    const memberId = await findMemberIdByUserId(user.user_id);
    if (memberId) {
      safeUser.memberId = memberId;
      safeUser.member_id = memberId;
    }
  }

  if (frontendRole === "pt") {
    const trainerId = await findTrainerIdByUserId(user.user_id);
    if (trainerId) {
      safeUser.trainerId = trainerId;
      safeUser.trainer_id = trainerId;
    }
  }

  return safeUser;
}

async function loginSupabaseUser(identifier, password) {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const normalizedIdentifier = identifier.trim().toLowerCase();
  const { data, error } = await supabase
    .from("users")
    .select(`
      user_id,
      email,
      username,
      password_hash,
      first_name,
      last_name,
      phone_number,
      date_of_birth,
      gender,
      headline,
      preferred_language,
      role,
      account_status,
      avatar_url
    `)
    .or(`username.eq.${normalizedIdentifier},email.eq.${normalizedIdentifier}`)
    .maybeSingle();

  if (error) {
    console.error("[Gymster Supabase] Failed to login demo user:", error);
    return { ok: false, message: "Unable to verify Supabase account." };
  }

  if (!data || !isDemoPasswordMatch(data, password)) {
    return { ok: false, message: "Username, email, or password is incorrect." };
  }

  const safeUser = await mapSupabaseUser(data);
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
  }

  return { ok: true, user: safeUser };
}

export async function loginUser(identifier, password) {
  const supabaseResult = await loginSupabaseUser(identifier, password);
  if (supabaseResult.ok) return supabaseResult;

  return loginLocalUser(identifier, password);
}

export function setCurrentUser(user) {
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
}

export function getCurrentUser() {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(CURRENT_USER_KEY);
  return storedUser ? JSON.parse(storedUser) : null;
}

export function getRoleHome(role) {
  return ROLE_HOME[normalizeRole(role)] || "/";
}

export function getUserHome(user) {
  if (normalizeRole(user?.role) === "member" && user.accountStatus && user.accountStatus !== "Active") {
    return "/onboarding/status";
  }

  return getRoleHome(user?.role);
}

export function logoutUser() {
  if (canUseStorage()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function registerUser(payload) {
  const users = getUsers();
  const normalizedUsername = payload.username.trim().toLowerCase();
  const normalizedEmail = payload.email.trim().toLowerCase();

  const duplicated = users.find((user) => {
    return (
      user.username.toLowerCase() === normalizedUsername ||
      user.email.toLowerCase() === normalizedEmail
    );
  });

  if (duplicated) {
    return { ok: false, message: "Username or email already exists." };
  }

  const nextUser = {
    id: Date.now(),
    role: "Member",
    accountStatus: "PendingOnboarding",
    ...payload,
    username: payload.username.trim(),
    email: normalizedEmail,
  };

  saveUsers([...users, nextUser]);
  const { password: _password, ...safeUser } = nextUser;
  return { ok: true, user: safeUser };
}
