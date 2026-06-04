import { supabase } from "./supabaseClient";
import testUsers from "../test_data/users.json";

const USERS_KEY = "gymster_test_data_users";
const CURRENT_USER_KEY = "gymster_current_user";
export const CURRENT_SESSION_KEY = "gymster_current_session";
const OAUTH_REMEMBER_KEY = "gymster_oauth_remember";
const LEGACY_PASSWORD_PREFIX = String.fromCharCode(100, 101, 109, 111, 45, 111, 110, 108, 121, 58);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * ONE_DAY_MS;

const SEEDED_DEMO_USERS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000001",
    username: "owner01",
    email: "owner@gymster.local",
    password: "Owner@123",
    fullName: "Minh Tran",
    firstName: "Minh",
    lastName: "Tran",
    phone: "0901000001",
    dob: "1984-04-12",
    gender: "male",
    role: "admin",
    sourceRole: "owner",
    accountStatus: "Active",
    account_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    userId: "00000000-0000-4000-8000-000000000002",
    username: "admin01",
    email: "admin@gymster.local",
    password: "Admin@123",
    fullName: "Linh Pham",
    firstName: "Linh",
    lastName: "Pham",
    phone: "0901000002",
    dob: "1988-08-09",
    gender: "female",
    role: "admin",
    accountStatus: "Active",
    account_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    userId: "00000000-0000-4000-8000-000000000003",
    username: "staff00",
    email: "staff@gymster.local",
    password: "Staff@123",
    fullName: "An Nguyen",
    firstName: "An",
    lastName: "Nguyen",
    phone: "0901000003",
    dob: "1994-02-20",
    gender: "female",
    role: "staff",
    accountStatus: "Active",
    account_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    userId: "00000000-0000-4000-8000-000000000004",
    username: "trainer00",
    email: "trainer@gymster.local",
    password: "Trainer@123",
    fullName: "Khoa Le",
    firstName: "Khoa",
    lastName: "Le",
    phone: "0901000004",
    dob: "1990-11-03",
    gender: "male",
    role: "pt",
    sourceRole: "trainer",
    accountStatus: "Active",
    account_status: "active",
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    userId: "00000000-0000-4000-8000-000000000005",
    username: "member00",
    email: "member@gymster.local",
    password: "Member@123",
    fullName: "Mai Do",
    firstName: "Mai",
    lastName: "Do",
    phone: "0901000005",
    dob: "1998-05-18",
    gender: "female",
    role: "member",
    accountStatus: "Active",
    account_status: "active",
  },
];

const SEEDED_MEMBER_DEMO_USERS = Array.from({ length: 24 }, (_, index) => {
  const memberNumber = String(index + 1).padStart(2, "0");
  return {
    id: `seed-member-${memberNumber}`,
    userId: `seed-member-${memberNumber}`,
    username: `member${memberNumber}`,
    email: `member${memberNumber}@gymster.local`,
    password: "Member@123",
    fullName: `Member ${memberNumber}`,
    firstName: "Member",
    lastName: memberNumber,
    phone: `09100000${memberNumber}`,
    dob: "1998-01-01",
    gender: "other",
    role: "member",
    accountStatus: index >= 10 && index <= 12 ? "PendingOnboarding" : "Active",
    account_status: index >= 10 && index <= 12 ? "pending_onboarding" : "active",
  };
});

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

function isValidUsername(username) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/.test(username);
}

function removeVietnameseMarks(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d");
}

function sanitizeUsername(value, fallback = "member") {
  const sanitized = removeVietnameseMarks(value)
    .replace(/[^A-Za-z0-9._-]+/g, ".")
    .replace(/[._-]{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");

  let username = sanitized || fallback;
  if (username.length < 6) {
    username = `${username}user`;
  }

  username = username.slice(0, 30).replace(/[._-]+$/g, "");
  if (username.length < 6) {
    username = `${username}${"0".repeat(6 - username.length)}`;
  }

  return username;
}

async function ensureUniqueUsername(baseUsername) {
  let username = sanitizeUsername(baseUsername);
  let attempt = 0;

  while (attempt < 20) {
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .ilike("username", username)
      .limit(1);

    if (error) throw error;
    if (!data?.length && isValidUsername(username)) return username;

    attempt += 1;
    const suffix = String(attempt).padStart(2, "0");
    username = `${sanitizeUsername(baseUsername).slice(0, 30 - suffix.length)}${suffix}`;
  }

  return `member${Date.now().toString(36).slice(-8)}`.slice(0, 30);
}

async function ensureUsernameIsAvailable(username) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .ilike("username", username)
    .limit(1);

  if (error) throw error;
  return !data?.length;
}

function isValidPhone(phone) {
  return /^\d{10,11}$/.test(String(phone || "").trim());
}

function isValidBirthDate(value) {
  if (!value) return false;

  const birthDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const minDate = new Date("1900-01-01T00:00:00");
  return !Number.isNaN(birthDate.getTime()) && birthDate >= minDate && birthDate < now;
}

function splitOAuthName(authUser) {
  const metadata = authUser?.user_metadata || {};
  const firstName = String(metadata.given_name || metadata.first_name || "").trim();
  const lastName = String(metadata.family_name || metadata.last_name || "").trim();

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  const fullName = String(metadata.full_name || metadata.name || "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (!parts.length) {
    const fallback = String(authUser?.email || "").split("@")[0] || "Member";
    return { firstName: fallback, lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function getOAuthProfileDraft(authUser) {
  const metadata = authUser?.user_metadata || {};
  const nameParts = splitOAuthName(authUser);
  const email = String(authUser?.email || "").trim().toLowerCase();
  const usernameSource = email.split("@")[0] || metadata.user_name || metadata.name || getOAuthProvider(authUser);

  return {
    email,
    firstName: nameParts.firstName || "",
    lastName: nameParts.lastName || "",
    username: sanitizeUsername(usernameSource),
    phone: "",
    dob: "",
    gender: "",
    avatarUrl: metadata.avatar_url || metadata.picture || "",
    provider: getOAuthProvider(authUser),
  };
}

function getOAuthProvider(authUser) {
  return authUser?.app_metadata?.provider || authUser?.identities?.[0]?.provider || "oauth";
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function notifyCurrentUserChanged(user) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("gymster:user-updated", { detail: user }));
  }
}

function getSessionDuration(rememberLogin) {
  return rememberLogin ? TWO_WEEKS_MS : ONE_DAY_MS;
}

function createSessionMeta(rememberLogin) {
  return {
    rememberLogin: Boolean(rememberLogin),
    expiresAt: Date.now() + getSessionDuration(rememberLogin),
  };
}

function getCurrentSessionMeta() {
  if (!canUseStorage()) return null;

  const storedSession = window.localStorage.getItem(CURRENT_SESSION_KEY);
  if (!storedSession) return null;

  try {
    return JSON.parse(storedSession);
  } catch (error) {
    window.localStorage.removeItem(CURRENT_SESSION_KEY);
    return null;
  }
}

function persistCurrentSessionMeta(meta) {
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(meta));
  }
}

function clearCurrentSession() {
  if (canUseStorage()) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    window.localStorage.removeItem(CURRENT_SESSION_KEY);
  }
  notifyCurrentUserChanged(null);
}

function persistCurrentUser(user, options = {}) {
  if (canUseStorage()) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    persistCurrentSessionMeta(createSessionMeta(options.rememberLogin));
    notifyCurrentUserChanged(user);
  }
}

function getDefaultDemoUsers() {
  return [...SEEDED_DEMO_USERS, ...SEEDED_MEMBER_DEMO_USERS, ...testUsers];
}

function mergeUsers(defaultUsers, storedUsers) {
  const usersByIdentifier = new Map();

  [...defaultUsers, ...storedUsers].forEach((user) => {
    const identifier = String(user.email || user.username || user.id || "").toLowerCase();
    if (identifier) {
      usersByIdentifier.set(identifier, user);
    }
  });

  return [...usersByIdentifier.values()];
}

export function getUsers() {
  const defaultUsers = getDefaultDemoUsers();
  if (!canUseStorage()) return defaultUsers;

  const storedUsers = window.localStorage.getItem(USERS_KEY);
  if (!storedUsers) return defaultUsers;

  try {
    const parsedUsers = JSON.parse(storedUsers);
    return Array.isArray(parsedUsers) ? mergeUsers(defaultUsers, parsedUsers) : defaultUsers;
  } catch (error) {
    window.localStorage.removeItem(USERS_KEY);
    return defaultUsers;
  }
}

export function saveUsers(users) {
  if (canUseStorage()) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  return users;
}

function loginLocalUser(identifier, password, options = {}) {
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
  persistCurrentUser(safeUser, options);

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

async function findUserByOAuthUser(authUser) {
  if (!authUser?.id && !authUser?.email) {
    return { data: null, error: null };
  }

  if (authUser.id) {
    const { data: authRows, error: authError } = await supabase
      .from("users")
      .select(USER_SELECT)
      .eq("auth_user_id", authUser.id)
      .limit(1);

    if (authError) {
      return { data: null, error: authError };
    }

    if (authRows?.[0]) {
      return { data: authRows[0], error: null };
    }
  }

  if (!authUser.email) {
    return { data: null, error: null };
  }

  const { data: emailRows, error: emailError } = await supabase
    .from("users")
    .select(USER_SELECT)
    .ilike("email", authUser.email.trim().toLowerCase())
    .limit(1);

  return { data: emailRows?.[0] || null, error: emailError };
}

async function linkOAuthUser(userId, authUser) {
  if (!userId || !authUser?.id) return;

  const { error } = await supabase
    .from("users")
    .update({
      auth_user_id: authUser.id,
      auth_provider: getOAuthProvider(authUser),
      last_login_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.warn("[Gymster h\u1ec7 th\u1ed1ng] Failed to link OAuth user:", error);
  }
}

async function createMemberForOAuthUser(userRow) {
  const { data: existingMember } = await supabase
    .from("members")
    .select("member_id")
    .eq("user_id", userRow.user_id)
    .maybeSingle();

  if (existingMember?.member_id) return existingMember;

  const { data, error } = await supabase
    .from("members")
    .insert({
      user_id: userRow.user_id,
      full_name: combineName(userRow, userRow.email),
      phone_number: userRow.phone_number || "",
      date_of_birth: userRow.date_of_birth,
      gender: userRow.gender || "unspecified",
      status: "pending_onboarding",
    })
    .select("member_id")
    .single();

  if (error) throw error;
  return data;
}

function validateOAuthProfile(profile) {
  const requiredFields = ["firstName", "lastName", "username", "phone", "dob", "gender"];
  const missingField = requiredFields.find((field) => !String(profile?.[field] || "").trim());

  if (missingField) {
    return "Please enter all required account information.";
  }

  if (!isValidUsername(profile.username.trim())) {
    return "Username must be 6-30 characters, use only A-Z, a-z, 0-9, _, ., -, and cannot start or end with _, ., or -.";
  }

  if (!isValidPhone(profile.phone)) {
    return "Phone number must contain 10 to 11 digits.";
  }

  if (!isValidBirthDate(profile.dob)) {
    return "Date of birth is not valid.";
  }

  if (!["male", "female", "other", "unspecified"].includes(profile.gender)) {
    return "Please select a valid gender.";
  }

  return "";
}

async function createUserFromOAuth(authUser, profile = null) {
  const email = String(authUser?.email || "").trim().toLowerCase();
  if (!email) {
    throw new Error("OAuth account did not return an email address.");
  }

  const provider = getOAuthProvider(authUser);
  const metadata = authUser.user_metadata || {};
  const nameParts = profile
    ? {
        firstName: String(profile.firstName || "").trim(),
        lastName: String(profile.lastName || "").trim(),
      }
    : splitOAuthName(authUser);
  const usernameSource = email.split("@")[0] || metadata.user_name || metadata.name || provider;
  const username = profile?.username
    ? String(profile.username).trim()
    : await ensureUniqueUsername(usernameSource);
  const phone = String(profile?.phone || "").trim();
  const dob = profile?.dob || "1995-01-01";
  const gender = profile?.gender || "unspecified";

  const { data: userRow, error } = await supabase
    .from("users")
    .insert({
      auth_user_id: authUser.id,
      auth_provider: provider,
      username,
      email,
      password_hash: null,
      first_name: nameParts.firstName || username,
      last_name: nameParts.lastName || "",
      phone_number: phone,
      date_of_birth: dob,
      gender,
      role: "member",
      account_status: "pending_onboarding",
      headline: "Created through social login.",
      avatar_url: metadata.avatar_url || metadata.picture || "",
      last_login_at: new Date().toISOString(),
    })
    .select(USER_SELECT)
    .single();

  if (error) throw error;

  await createMemberForOAuthUser(userRow);
  return userRow;
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

async function loginSupabaseUser(identifier, password, options = {}) {
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
  persistCurrentUser(safeUser, options);

  return { ok: true, user: safeUser };
}

export async function loginUser(identifier, password, options = {}) {
  if (!supabase) {
    return loginLocalUser(identifier, password, options);
  }

  const supabaseResult = await loginSupabaseUser(identifier, password, options);
  return supabaseResult;
}

export async function signInWithOAuthProvider(provider, options = {}) {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  if (!["google", "facebook"].includes(provider)) {
    return { ok: false, message: "OAuth provider is not supported." };
  }

  if (canUseStorage()) {
    window.localStorage.setItem(OAUTH_REMEMBER_KEY, options.rememberLogin ? "1" : "0");
  }

  const redirectTo = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) {
    return { ok: false, message: error.message || "Could not start social login." };
  }

  return { ok: true, data };
}

export async function completeOAuthLogin() {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, message: error.message || "Could not verify social login." };
  }

  const authUser = data?.session?.user;
  if (!authUser) {
    return { ok: false, message: "Social login session was not found." };
  }

  try {
    const userResult = await findUserByOAuthUser(authUser);
    if (userResult.error) throw userResult.error;

    const userRow = userResult.data;
    if (!userRow) {
      return {
        ok: true,
        needsProfileCompletion: true,
        profile: getOAuthProfileDraft(authUser),
      };
    }

    await linkOAuthUser(userRow.user_id, authUser);

    const safeUser = await mapSupabaseUser(userRow);
    const rememberLogin = canUseStorage() && window.localStorage.getItem(OAUTH_REMEMBER_KEY) === "1";
    if (canUseStorage()) {
      window.localStorage.removeItem(OAUTH_REMEMBER_KEY);
    }

    persistCurrentUser(safeUser, { rememberLogin });
    return { ok: true, user: safeUser };
  } catch (oauthError) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to complete OAuth login:", oauthError);
    return { ok: false, message: "Could not complete social login." };
  }
}

export async function getPendingOAuthProfile() {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, message: error.message || "Could not verify social login." };
  }

  const authUser = data?.session?.user;
  if (!authUser) {
    return { ok: false, message: "Social login session was not found." };
  }

  const userResult = await findUserByOAuthUser(authUser);
  if (userResult.error) {
    return { ok: false, message: "Could not verify social login account." };
  }

  if (userResult.data) {
    const safeUser = await mapSupabaseUser(userResult.data);
    return { ok: true, user: safeUser, profile: null };
  }

  return { ok: true, profile: getOAuthProfileDraft(authUser) };
}

export async function completeOAuthProfile(profile) {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  const validationError = validateOAuthProfile(profile);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { ok: false, message: error.message || "Could not verify social login." };
  }

  const authUser = data?.session?.user;
  if (!authUser) {
    return { ok: false, message: "Social login session was not found." };
  }

  try {
    const userResult = await findUserByOAuthUser(authUser);
    if (userResult.error) throw userResult.error;

    if (userResult.data) {
      const safeUser = await mapSupabaseUser(userResult.data);
      persistCurrentUser(safeUser, {
        rememberLogin: canUseStorage() && window.localStorage.getItem(OAUTH_REMEMBER_KEY) === "1",
      });
      return { ok: true, user: safeUser };
    }

    const username = profile.username.trim();
    const isAvailable = await ensureUsernameIsAvailable(username);
    if (!isAvailable) {
      return { ok: false, message: "Username already exists." };
    }

    const userRow = await createUserFromOAuth(authUser, {
      ...profile,
      username,
    });
    const safeUser = await mapSupabaseUser(userRow);
    const rememberLogin = canUseStorage() && window.localStorage.getItem(OAUTH_REMEMBER_KEY) === "1";
    if (canUseStorage()) {
      window.localStorage.removeItem(OAUTH_REMEMBER_KEY);
    }

    persistCurrentUser(safeUser, { rememberLogin });
    return { ok: true, user: safeUser };
  } catch (oauthError) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to complete OAuth profile:", oauthError);
    return { ok: false, message: "Could not complete social registration." };
  }
}

export function setCurrentUser(user) {
  if (!canUseStorage()) return;

  const currentMeta = getCurrentSessionMeta();
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  persistCurrentSessionMeta(currentMeta || createSessionMeta(false));
  notifyCurrentUserChanged(user);
}

export function getCurrentUser() {
  if (!canUseStorage()) {
    return null;
  }

  const storedUser = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!storedUser) return null;

  const sessionMeta = getCurrentSessionMeta();
  if (sessionMeta?.expiresAt && Date.now() > Number(sessionMeta.expiresAt)) {
    clearCurrentSession();
    return null;
  }

  if (!sessionMeta) {
    persistCurrentSessionMeta(createSessionMeta(false));
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    clearCurrentSession();
    return null;
  }
}

export function refreshCurrentSession() {
  const user = getCurrentUser();
  if (!user || !canUseStorage()) return null;

  const sessionMeta = getCurrentSessionMeta() || createSessionMeta(false);
  persistCurrentSessionMeta(createSessionMeta(sessionMeta.rememberLogin));

  return user;
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
  if (supabase) {
    supabase.auth.signOut().catch((error) => {
      console.warn("[Gymster h\u1ec7 th\u1ed1ng] Failed to sign out OAuth session:", error);
    });
  }
  clearCurrentSession();
}

export function registerUser(payload) {
  return { ok: false, message: "Registration must be saved through h\u1ec7 th\u1ed1ng." };
}
