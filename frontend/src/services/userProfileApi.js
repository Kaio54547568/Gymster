import { supabase } from "./supabaseClient";

const roleAliases = {
  admin: ["admin", "owner"],
  owner: ["owner", "admin"],
  staff: ["staff"],
  trainer: ["trainer"],
  pt: ["trainer"],
  member: ["member"],
};

const defaultProfiles = {
  admin: {
    fullName: "Gymster Admin",
    email: "admin@gymster.local",
    phone: "0900000001",
  },
  owner: {
    fullName: "Gymster Admin",
    email: "admin@gymster.local",
    phone: "0900000001",
  },
  staff: {
    fullName: "Gymster Staff",
    email: "staff@gymster.local",
    phone: "0900000002",
  },
  trainer: {
    fullName: "Alex Carter",
    email: "trainer@gymster.local",
    phone: "0900000003",
  },
  pt: {
    fullName: "Alex Carter",
    email: "trainer@gymster.local",
    phone: "0900000003",
  },
  member: {
    fullName: "Taylor Morgan",
    email: "member@gymster.local",
    phone: "0900000004",
  },
};

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function hasMojibake(value) {
  return /Ã|Ä|áº|â|Æ|�/.test(String(value || ""));
}

function getInitials(fullName) {
  const words = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "NA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function splitFullName(fullName) {
  const words = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return { firstName: "", lastName: "" };
  if (words.length === 1) return { firstName: words[0], lastName: "" };
  return {
    firstName: words[0],
    lastName: words.slice(1).join(" "),
  };
}

function combineName(row, fallback = "") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

function getCleanFullName(role, currentUser = null) {
  const normalized = normalizeRole(role);
  const defaultProfile = defaultProfiles[normalized] || defaultProfiles.member;
  const candidate = currentUser?.fullName || currentUser?.full_name || currentUser?.name || "";
  return candidate && !hasMojibake(candidate) ? candidate : defaultProfile.fullName;
}

function roleLabel(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin" || normalized === "owner") return "Gym Owner";
  if (normalized === "staff") return "Management Staff";
  if (normalized === "trainer") return "Personal Trainer";
  if (normalized === "member") return "Gym Member";
  return role || "User";
}

function mapUserProfile(userRow, extra = {}) {
  const fullName = combineName(userRow, extra.fullName || "");
  const nameParts = {
    firstName: userRow?.first_name || splitFullName(fullName).firstName,
    lastName: userRow?.last_name || splitFullName(fullName).lastName,
  };
  const role = normalizeRole(userRow?.role || extra.role);

  return {
    userId: userRow?.user_id || "",
    email: userRow?.email || extra.email || "",
    username: userRow?.username || "",
    fullName,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: userRow?.phone_number || extra.phone || "",
    dob: userRow?.date_of_birth || "",
    gender: userRow?.gender || "unspecified",
    role,
    roleLabel: roleLabel(role),
    accountStatus: userRow?.account_status || "",
    preferredLanguage: userRow?.preferred_language || "en",
    avatarUrl: userRow?.avatar_url || "",
    initials: getInitials(fullName),
    headline: userRow?.headline || extra.headline || getDefaultHeadline(role),
    specialty: extra.specialty || "",
    status: extra.status || userRow?.account_status || "",
    source: "supabase",
  };
}

function mapLocalProfile(role, currentUser = null) {
  const normalized = normalizeRole(role || currentUser?.role);
  const defaultProfile = defaultProfiles[normalized] || defaultProfiles.member;
  const fullName = getCleanFullName(normalized, currentUser);
  const nameParts = splitFullName(fullName);

  return {
    userId: currentUser?.userId || currentUser?.user_id || currentUser?.id || "",
    email: currentUser?.email && !hasMojibake(currentUser.email) ? currentUser.email : defaultProfile.email,
    username: currentUser?.username || "",
    fullName,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: currentUser?.phone || currentUser?.phone_number || defaultProfile.phone,
    dob: currentUser?.dob || currentUser?.date_of_birth || "",
    gender: currentUser?.gender || "unspecified",
    role: normalized,
    roleLabel: roleLabel(normalized),
    accountStatus: currentUser?.accountStatus || currentUser?.account_status || "",
    preferredLanguage: currentUser?.preferredLanguage || currentUser?.preferred_language || "en",
    avatarUrl: currentUser?.avatarUrl || currentUser?.avatar_url || "",
    initials: getInitials(fullName),
    headline: currentUser?.headline || getDefaultHeadline(normalized),
    specialty: "",
    status: currentUser?.status || "",
    source: "local",
  };
}

function getDefaultHeadline(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin" || normalized === "owner") {
    return "Managing gym operations, staff performance, memberships, and business growth.";
  }
  if (normalized === "staff") {
    return "Supporting daily gym operations, member services, payments, and equipment workflows.";
  }
  if (normalized === "trainer") {
    return "Helping members build strength, confidence, and sustainable training habits.";
  }
  if (normalized === "member") {
    return "Committed to building strength, healthy routines, and consistent training habits.";
  }
  return "Gymster account profile.";
}

async function findUserByCurrentUser(currentUser) {
  if (!currentUser || !supabase) return null;

  const userId = currentUser.userId || currentUser.user_id;
  if (userId) {
    const { data } = await supabase.from("users").select("*").eq("user_id", userId).maybeSingle();
    if (data) return data;
  }

  const email = currentUser.email ? String(currentUser.email).trim().toLowerCase() : "";
  if (email) {
    const { data } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    if (data) return data;
  }

  const username = currentUser.username ? String(currentUser.username).trim() : "";
  if (username) {
    const { data } = await supabase.from("users").select("*").eq("username", username).maybeSingle();
    if (data) return data;
  }

  return null;
}

async function findUserByRole(role) {
  const aliases = roleAliases[normalizeRole(role)] || [normalizeRole(role)];

  const { data } = await supabase
    .from("users")
    .select("*")
    .in("role", aliases)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function getTrainerExtra(userId) {
  if (!userId) return {};

  const { data } = await supabase
    .from("trainers")
    .select("specialty, bio, status")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    specialty: data?.specialty || "",
    headline: data?.bio || "",
    status: data?.status || "",
  };
}

async function getEmployeeExtra(userId) {
  if (!userId) return {};

  const { data } = await supabase
    .from("employees")
    .select("full_name, email, phone_number, department, role, status")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    fullName: data?.full_name || "",
    email: data?.email || "",
    phone: data?.phone_number || "",
    headline: data?.department ? `${data.department} team member.` : "",
    status: data?.status || "",
  };
}

async function getMemberExtra(userId) {
  if (!userId) return {};

  const { data } = await supabase
    .from("members")
    .select("member_code, status, health_notes")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    headline: data?.health_notes || "",
    status: data?.status || "",
  };
}

async function getRoleExtra(userRow) {
  const role = normalizeRole(userRow?.role);
  if (role === "trainer") return getTrainerExtra(userRow.user_id);
  if (role === "staff" || role === "admin" || role === "owner") return getEmployeeExtra(userRow.user_id);
  if (role === "member") return getMemberExtra(userRow.user_id);
  return {};
}

export async function getSupabaseUserProfile(role, currentUser = null) {
  if (!supabase) {
    return { data: null, error: new Error("Missing Supabase environment variables.") };
  }

  try {
    const currentUserRow = await findUserByCurrentUser(currentUser);
    const expectedRoles = roleAliases[normalizeRole(role)] || [normalizeRole(role)];
    const userRow =
      currentUserRow && expectedRoles.includes(normalizeRole(currentUserRow.role))
        ? currentUserRow
        : await findUserByRole(role);

    if (!userRow) {
      console.warn("[Gymster Supabase] No profile row was found. Using current local mock user profile.");
      return { data: mapLocalProfile(role, currentUser), error: null };
    }

    const extra = await getRoleExtra(userRow);
    return { data: mapUserProfile(userRow, extra), error: null };
  } catch (error) {
    console.error("[Gymster Supabase] Failed to load user profile:", error);
    return { data: mapLocalProfile(role, currentUser), error: null };
  }
}

export function createEmptyUserProfile(role) {
  const normalized = normalizeRole(role);
  return {
    userId: "",
    email: "",
    username: "",
    fullName: "",
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "unspecified",
    role: normalized,
    roleLabel: roleLabel(normalized),
    accountStatus: "",
    preferredLanguage: "en",
    avatarUrl: "",
    initials: "NA",
    headline: getDefaultHeadline(normalized),
    specialty: "",
    status: "",
    source: "empty",
  };
}

export async function updateCurrentUserPassword(currentUser, currentPassword, newPassword) {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const userRow = await findUserByCurrentUser(currentUser);
  if (!userRow?.user_id) {
    return { ok: false, message: "Current user could not be resolved." };
  }

  const storedPassword = userRow.password_hash || "";
  if (storedPassword && storedPassword !== currentPassword && storedPassword !== `demo-only:${currentPassword}`) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      // Demo only. Production password changes should use Supabase Auth or a backend-owned hash.
      password_hash: `demo-only:${newPassword}`,
    })
    .eq("user_id", userRow.user_id);

  if (error) {
    console.error("[Gymster Supabase] Failed to update password:", error);
    return { ok: false, message: "Password could not be updated." };
  }

  return { ok: true, message: "Password updated successfully." };
}

export async function updateCurrentUserContactInfo(currentUser, contactInfo) {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const userRow = await findUserByCurrentUser(currentUser);
  if (!userRow?.user_id) {
    return { ok: false, message: "Current user could not be resolved." };
  }

  const { error } = await supabase
    .from("users")
    .update({
      email: String(contactInfo.email || "").trim().toLowerCase(),
      phone_number: String(contactInfo.phone || "").trim(),
    })
    .eq("user_id", userRow.user_id);

  if (error) {
    console.error("[Gymster Supabase] Failed to update contact info:", error);
    return { ok: false, message: error.code === "23505" ? "Email already exists." : "Contact info could not be updated." };
  }

  return { ok: true, message: "Contact info updated successfully." };
}

export async function updateCurrentUserProfile(currentUser, profileData) {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const userRow = await findUserByCurrentUser(currentUser);
  if (!userRow?.user_id) {
    return { ok: false, message: "Current user could not be resolved." };
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      first_name: String(profileData.firstName || "").trim(),
      last_name: String(profileData.lastName || "").trim(),
      date_of_birth: profileData.dob || null,
      headline: profileData.headline || "",
    })
    .eq("user_id", userRow.user_id);

  if (userError) {
    console.error("[Gymster Supabase] Failed to update profile:", userError);
    return { ok: false, message: "Profile could not be updated." };
  }

  const role = normalizeRole(userRow.role);
  if (role === "trainer") {
    const { error: trainerError } = await supabase
      .from("trainers")
      .update({
        specialty: profileData.specialty || undefined,
        bio: profileData.headline || "",
      })
      .eq("user_id", userRow.user_id);

    if (trainerError) {
      console.error("[Gymster Supabase] Failed to update trainer profile:", trainerError);
      return { ok: false, message: "Trainer profile could not be updated." };
    }
  }

  if (role === "member") {
    await supabase
      .from("members")
      .update({
        health_notes: profileData.headline || "",
        date_of_birth: profileData.dob || null,
      })
      .eq("user_id", userRow.user_id);
  }

  return { ok: true, message: "Profile updated successfully." };
}

export async function updateCurrentUserLanguagePreference(currentUser, language) {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const userRow = await findUserByCurrentUser(currentUser);
  if (!userRow?.user_id) {
    return { ok: false, message: "Current user could not be resolved." };
  }

  const nextLanguage = language === "vi" ? "vi" : "en";
  const { error } = await supabase
    .from("users")
    .update({ preferred_language: nextLanguage })
    .eq("user_id", userRow.user_id);

  if (error) {
    console.error("[Gymster Supabase] Failed to update language preference:", error);
    return { ok: false, message: "Language preference could not be updated." };
  }

  return { ok: true, message: "Language preference updated." };
}
