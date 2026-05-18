import { supabase } from "./supabaseClient";

function mapCreatedAccount(userRow, memberRow) {
  const fullName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ").trim();

  return {
    userId: userRow.user_id,
    memberId: memberRow.member_id,
    username: userRow.username,
    email: userRow.email,
    firstName: userRow.first_name || "",
    lastName: userRow.last_name || "",
    fullName,
    phone: userRow.phone_number,
    dob: userRow.date_of_birth,
    gender: userRow.gender,
    role: "Member",
    accountStatus: "PendingOnboarding",
  };
}

function splitFullName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function ensureEmailIsAvailable(email) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Could not validate email availability." };
  }

  if (data) {
    return { ok: false, message: "Email already exists." };
  }

  return { ok: true };
}

async function insertTargetMember(userRow, registrationData) {
  return supabase
    .from("members")
    .insert({
      user_id: userRow.user_id,
      full_name: registrationData.fullName,
      phone_number: registrationData.phone,
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      status: "pending",
    })
    .select("*")
    .single();
}

async function insertCurrentSchemaMember(userRow) {
  return supabase
    .from("members")
    .insert({
      user_id: userRow.user_id,
      status: "pending_onboarding",
    })
    .select("*")
    .single();
}

export async function createPendingMemberAccount(registrationData) {
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured. Please check the frontend environment variables.",
    };
  }

  const email = registrationData.email.trim().toLowerCase();
  const username = registrationData.username.trim();
  const nameParts = splitFullName(registrationData.fullName);
  const emailCheck = await ensureEmailIsAvailable(email);

  if (!emailCheck.ok) {
    return emailCheck;
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .insert({
      username,
      email,
      // Demo only. Production auth should use Supabase Auth or a backend-owned password hash.
      password_hash: `demo-only:${registrationData.password}`,
      first_name: nameParts.firstName,
      last_name: nameParts.lastName,
      phone_number: registrationData.phone.trim(),
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      role: "member",
      account_status: "pending_onboarding",
    })
    .select("*")
    .single();

  if (userError) {
    console.error("[Gymster Supabase] Failed to create pending user:", userError);
    return {
      ok: false,
      message: userError.code === "23505" ? "Username or email already exists." : "Could not create member account.",
    };
  }

  let { data: memberRow, error: memberError } = await insertTargetMember(userRow, registrationData);

  if (memberError) {
    ({ data: memberRow, error: memberError } = await insertCurrentSchemaMember(userRow));
  }

  if (memberError) {
    console.error("[Gymster Supabase] Failed to create pending member:", memberError);
    return {
      ok: false,
      message: "User was created, but the member profile could not be created.",
    };
  }

  return {
    ok: true,
    user: mapCreatedAccount(userRow, memberRow),
  };
}
