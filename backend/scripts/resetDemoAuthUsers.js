import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const CONFIRMATION = "RESET_GYMSTER_DEMO";
const GYMSTER_BUCKETS = ["payment-proofs", "pics"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env"), quiet: true });

export function validateResetConfirmation(args = process.argv.slice(2)) {
  const index = args.indexOf("--confirm");
  return index >= 0 && args[index + 1] === CONFIRMATION;
}

function configured(value) {
  const normalized = String(value || "").trim();
  return normalized && !normalized.startsWith("your_");
}

function createAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!configured(url) || !configured(key)) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function listAllAuthUsers(client) {
  const users = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return users;
}

async function emptyGymsterBuckets(client) {
  const results = [];
  for (const bucket of GYMSTER_BUCKETS) {
    const { error } = await client.storage.emptyBucket(bucket);
    if (error && !/not found|does not exist/i.test(String(error.message || ""))) {
      throw new Error(`Could not empty storage bucket "${bucket}": ${error.message}`);
    }
    results.push({ bucket, emptied: !error });
  }
  return results;
}

export async function resetDemoAuthUsers(args = process.argv.slice(2)) {
  if (!validateResetConfirmation(args)) {
    throw new Error(`Destructive reset blocked. Re-run with --confirm ${CONFIRMATION}`);
  }

  const client = createAdminClient();
  const authUsers = await listAllAuthUsers(client);
  const storage = await emptyGymsterBuckets(client);

  let deletedAuthUsers = 0;
  for (const user of authUsers) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`Could not delete Auth user ${user.email || user.id}: ${error.message}`);
    deletedAuthUsers += 1;
  }

  return {
    ok: true,
    deletedAuthUsers,
    storage,
    message: "Supabase Auth users and Gymster storage objects were reset.",
  };
}

async function main() {
  const result = await resetDemoAuthUsers();
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, message: error.message || String(error) }, null, 2));
    process.exitCode = 1;
  });
}
