import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function resolvePlaintextPassword(passwordHash) {
  const value = String(passwordHash || "");
  if (!value) return null;
  if (value.startsWith("$2")) return null;
  if (value.startsWith("demo-only:")) return value.slice("demo-only:".length);
  return value;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const pageUsers = data?.users || [];
    users.push(...pageUsers);
    if (pageUsers.length < 200) break;
    page += 1;
  }

  return users;
}

async function main() {
  const authUsers = await listAllAuthUsers();
  const authByEmail = new Map(authUsers.map((user) => [normalizeEmail(user.email), user]));

  const { data: appUsers, error } = await supabase
    .from("users")
    .select("user_id,email,username,role,auth_user_id,password_hash")
    .order("created_at", { ascending: true });

  if (error) throw error;

  let linked = 0;
  let created = 0;
  let skipped = 0;
  let secured = 0;

  for (const user of appUsers || []) {
    const email = normalizeEmail(user.email);
    let authUser = authByEmail.get(email);
    const plainPassword = resolvePlaintextPassword(user.password_hash);

    if (authUser?.id) {
      if (plainPassword) {
        const { data, error: authUpdateError } = await supabase.auth.admin.updateUserById(authUser.id, {
          email,
          password: plainPassword,
          email_confirm: true,
          user_metadata: {
            app_user_id: user.user_id,
            username: user.username || "",
            role: user.role || "member",
          },
          app_metadata: { provider: "email" },
        });
        if (authUpdateError) throw authUpdateError;
        authUser = data?.user || authUser;
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ auth_user_id: authUser.id, auth_provider: "email" })
        .eq("user_id", user.user_id);
      if (updateError) throw updateError;
      if (user.auth_user_id === authUser.id) skipped += 1;
      else linked += 1;
    } else {
      if (!plainPassword) {
        skipped += 1;
        continue;
      }

      const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: plainPassword,
        email_confirm: true,
        user_metadata: {
          app_user_id: user.user_id,
          username: user.username || "",
          role: user.role || "member",
        },
        app_metadata: { provider: "email" },
      });
      if (createError) throw createError;

      const authUserId = createdAuth?.user?.id;
      if (!authUserId) throw new Error(`Auth user was not created for ${email}.`);

      const { error: updateError } = await supabase
        .from("users")
        .update({ auth_user_id: authUserId, auth_provider: "email" })
        .eq("user_id", user.user_id);
      if (updateError) throw updateError;
      authUser = createdAuth.user;
      authByEmail.set(email, authUser);
      created += 1;
    }

    if (plainPassword) {
      const passwordHash = await bcrypt.hash(plainPassword, 10);
      const { error: secureError } = await supabase
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("user_id", user.user_id);
      if (secureError) throw secureError;
      secured += 1;
    }
  }

  console.log(JSON.stringify({ ok: true, linked, created, skipped, secured }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, message: error.message || String(error) }, null, 2));
  process.exitCode = 1;
});
