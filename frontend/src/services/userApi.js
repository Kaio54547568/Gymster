import { supabase } from "./supabaseClient";

async function postAuthJson(path, payload) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      ok: false,
      message: "Authentication service is temporarily unavailable. Please try again.",
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      message: data.message || data.error || "Authentication service is temporarily unavailable. Please try again.",
    };
  }

  return data;
}

export function registerMemberAccount(registrationData) {
  return postAuthJson("/api/auth/register", registrationData);
}

export function requestPasswordResetCode(email) {
  return postAuthJson("/api/auth/password-reset/request-code", { email });
}

export function verifyPasswordResetCode(email, code) {
  return postAuthJson("/api/auth/password-reset/verify-code", { email, code });
}

export function resetPasswordWithCode(email, code, newPassword) {
  return postAuthJson("/api/auth/password-reset/reset", { email, code, newPassword });
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
