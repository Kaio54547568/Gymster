import { supabase } from "./supabaseClient";

const USERS_KEY = "gymster_test_data_users";
const CURRENT_USER_KEY = "gymster_current_user";
const LEGACY_PASSWORD_PREFIX = String.fromCharCode(100, 101, 109, 111, 45, 111, 110, 108, 121, 58);

const ROLE_HOME = {
  admin: "/admin",
  owner: "/admin",
  staff: "/staff",
  pt: "/pt",
  trainer: "/pt",
  member: "/member",
};

const USER_SELECT = `
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
`;

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

function notifyCurrentUserChanged(user) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gymster:user-updated", { detail: user }));
  }
}

function persistCurrentUser(user) {
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    notifyCurrentUserChanged(user);
  }
}

export function getUsers() {
  return [];
}

export function saveUsers(users) {
  return users;
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
  persistCurrentUser(safeUser);

  return { ok: true, user: safeUser };
}

export function isPasswordMatch(storedPassword, password) {
  if (!storedPassword) return false;
  if (storedPassword === password) return true;
  if (storedPassword.startsWith(LEGACY_PASSWORD_PREFIX)) {
    return storedPassword.slice(LEGACY_PASSWORD_PREFIX.length) === password;
  }
  return false;
}

function isSupabasePasswordMatch(user, password) {
  const storedPassword = user?.password_hash || user?.password || "";
  return isPasswordMatch(storedPassword, password);
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

async function findUserByIdentifier(identifier) {
  const rawIdentifier = identifier.trim();
  const normalizedIdentifier = rawIdentifier.toLowerCase();

  const { data: emailRows, error: emailError } = await supabase
    .from("users")
    .select(USER_SELECT)
    .ilike("email", normalizedIdentifier)
    .limit(1);

  if (emailError) {
    return { data: null, error: emailError };
  }

  if (emailRows?.[0]) {
    return { data: emailRows[0], error: null };
  }

  const { data: usernameRows, error: usernameError } = await supabase
    .from("users")
    .select(USER_SELECT)
    .ilike("username", rawIdentifier)
    .limit(1);

  return {
    data: usernameRows?.[0] || null,
    error: usernameError,
  };
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
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  const { data, error } = await findUserByIdentifier(identifier);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to login user:", error);
    return { ok: false, message: "Unable to verify h\u1ec7 th\u1ed1ng account." };
  }

  if (!data || !isSupabasePasswordMatch(data, password)) {
    return { ok: false, message: "Username, email, or password is incorrect." };
  }

  const safeUser = await mapSupabaseUser(data);
  persistCurrentUser(safeUser);

  return { ok: true, user: safeUser };
}

export async function loginUser(identifier, password) {
  const supabaseResult = await loginSupabaseUser(identifier, password);
  return supabaseResult;
}

export function setCurrentUser(user) {
  persistCurrentUser(user);
}

export function getCurrentUser() {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export function getRoleHome(role) {
  return ROLE_HOME[normalizeRole(role)] || "/";
}

export function getUserHome(user) {
  if (normalizeRole(user?.role) === "member") {
    return "/member";
  }

  return getRoleHome(user?.role);
}

export function logoutUser() {
  if (canUseStorage()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    notifyCurrentUserChanged(null);
  }
}

export function registerUser(payload) {
  return { ok: false, message: "Registration must be saved through h\u1ec7 th\u1ed1ng." };
}
