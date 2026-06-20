import { createClient } from "@supabase/supabase-js";

let serviceClient;

function configured(value) {
  const normalized = String(value || "").trim();
  return normalized && !normalized.startsWith("your_");
}

export function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!configured(url) || !configured(key)) return null;
  if (!serviceClient) {
    serviceClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

function bearerToken(request) {
  const value = String(
    typeof request.headers?.get === "function"
      ? request.headers.get("authorization") || ""
      : request.headers?.authorization || "",
  );
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function authenticateRequest(request, allowedRoles = []) {
  const client = getServiceClient();
  if (!client) return { ok: false, status: 503, message: "Supabase backend is not configured." };
  const token = bearerToken(request);
  if (!token) return { ok: false, status: 401, message: "Authentication is required." };

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData?.user?.id) {
    return { ok: false, status: 401, message: "Authentication token is invalid or expired." };
  }

  const { data: user, error: userError } = await client
    .from("users")
    .select("user_id,auth_user_id,role,account_status")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();
  if (userError || !user) return { ok: false, status: 403, message: "Gymster user profile was not found." };
  if (allowedRoles.length && !allowedRoles.includes(String(user.role || "").toLowerCase())) {
    return { ok: false, status: 403, message: "You do not have permission to perform this action." };
  }

  const { data: employee } = await client
    .from("employees")
    .select("employee_id,role,status")
    .eq("user_id", user.user_id)
    .maybeSingle();

  return { ok: true, client, user, employee: employee || null };
}
