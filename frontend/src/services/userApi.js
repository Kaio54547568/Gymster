import { supabase } from "./supabaseClient";

function mapCreatedAccount(userRow, memberRow) {
  const fullName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ").trim();

  return {
    id: userRow.user_id,
    userId: userRow.user_id,
    user_id: userRow.user_id,
    memberId: memberRow.member_id,
    member_id: memberRow.member_id,
    username: userRow.username,
    email: userRow.email,
    firstName: userRow.first_name || "",
    lastName: userRow.last_name || "",
    fullName,
    phone: userRow.phone_number,
    dob: userRow.date_of_birth,
    gender: userRow.gender,
    role: "member",
    accountStatus: "PendingOnboarding",
    account_status: userRow.account_status || "pending_onboarding",
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
    .ilike("email", email)
    .limit(1);

  if (error) {
    return { ok: false, message: "Could not validate email availability." };
  }

  if (data?.length) {
    return { ok: false, message: "Email already exists." };
  }

  return { ok: true };
}

async function ensureUsernameIsAvailable(username) {
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .ilike("username", username)
    .limit(1);

  if (error) {
    return { ok: false, message: "Could not validate username availability." };
  }

  if (data?.length) {
    return { ok: false, message: "Username already exists." };
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
      message: "h\u1ec7 th\u1ed1ng is not configured. Please check the frontend environment variables.",
    };
  }

  const email = registrationData.email.trim().toLowerCase();
  const username = registrationData.username.trim().toLowerCase();
  const nameParts = splitFullName(registrationData.fullName);
  const emailCheck = await ensureEmailIsAvailable(email);

  if (!emailCheck.ok) {
    return emailCheck;
  }

  const usernameCheck = await ensureUsernameIsAvailable(username);

  if (!usernameCheck.ok) {
    return usernameCheck;
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .insert({
      username,
      email,
      password_hash: registrationData.password,
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create pending user:", userError);
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
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create pending member:", memberError);
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

async function resolveMemberIdForActivation(currentUser) {
  const directMemberId = currentUser?.memberId || currentUser?.member_id;
  if (directMemberId) return directMemberId;

  const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("members")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to resolve member profile:", error);
    return null;
  }

  return data?.member_id || null;
}

async function activateMemberAccountWithRpc(userId, memberId) {
  if (!userId && !memberId) {
    return { error: new Error("Missing user id and member id.") };
  }

  const { data, error } = await supabase.rpc("gymster_activate_member_account", {
    target_user_id: userId || null,
    target_member_id: memberId || null,
  });

  return { data, error };
}

export async function activateMemberAccount(currentUser) {
  if (!supabase) {
    return { ok: false, message: "h\u1ec7 th\u1ed1ng is not configured." };
  }

  const userId = currentUser?.userId || currentUser?.user_id || currentUser?.id;
  const memberId = await resolveMemberIdForActivation(currentUser);
  const updates = [];

  if (userId) {
    updates.push(
      supabase
        .from("users")
        .update({ account_status: "active" })
        .eq("user_id", userId),
    );
  }

  if (memberId) {
    updates.push(
      supabase
        .from("members")
        .update({ status: "active", join_date: new Date().toISOString().slice(0, 10) })
        .eq("member_id", memberId),
    );
  }

  let results = [];
  let error = null;

  if (updates.length) {
    results = await Promise.all(updates);
    error = results.find((result) => result.error)?.error || null;
  } else {
    error = new Error("Missing member activation target.");
  }

  if (error) {
    const rpcResult = await activateMemberAccountWithRpc(userId, memberId);
    if (rpcResult.error) {
      console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to activate member account:", rpcResult.error);
      return { ok: false, message: "Could not activate member account." };
    }
  }

  return {
    ok: true,
    user: {
      ...currentUser,
      memberId: memberId || currentUser?.memberId,
      member_id: memberId || currentUser?.member_id,
      accountStatus: "Active",
      account_status: "active",
    },
  };
}
