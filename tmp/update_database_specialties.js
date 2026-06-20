import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const updates = [
  { old: "Strength Training", new: "PT Strength & Conditioning" },
  { old: "Hypertrophy", new: "Bodybuilding" },
  { old: "Weight Loss and HIIT", new: "Weight Loss Coaching" },
  { old: "Mobility and Recovery", new: "Yoga & Mobility" },
  { old: "Pilates and Core", new: "Yoga & Mobility" },
  { old: "Athletic Conditioning", new: "PT Strength & Conditioning" },
  { old: "VIP Transformation", new: "Bodybuilding" }
];

async function run() {
  console.log("Starting database specialty standardization...");

  for (const update of updates) {
    // 1. Update trainers table
    const { data: trainersData, error: trainersError } = await client
      .from("trainers")
      .update({ specialty: update.new })
      .eq("specialty", update.old);
    
    if (trainersError) {
      console.error(`Error updating trainers from "${update.old}" to "${update.new}":`, trainersError);
    } else {
      console.log(`Updated trainers from "${update.old}" to "${update.new}" successfully.`);
    }

    // 2. Update employees table
    const { data: employeesData, error: employeesError } = await client
      .from("employees")
      .update({ department: update.new })
      .eq("department", update.old)
      .eq("role", "trainer");
    
    if (employeesError) {
      console.error(`Error updating employees from "${update.old}" to "${update.new}":`, employeesError);
    } else {
      console.log(`Updated employees from "${update.old}" to "${update.new}" successfully.`);
    }
  }

  console.log("Database specialty standardization finished.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
