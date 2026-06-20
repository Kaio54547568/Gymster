import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching trainers...");
  const { data: trainers, error: fetchError } = await supabase
    .from("trainers")
    .select("employee_id, specialty, full_name");
  
  if (fetchError) {
    console.error("Failed to fetch trainers:", fetchError);
    process.exit(1);
  }

  console.log(`Found ${trainers.length} trainers. Aligning departments...`);

  for (const trainer of trainers) {
    if (!trainer.employee_id) {
      console.warn(`Trainer ${trainer.full_name} has no employee_id. Skipping.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("employees")
      .update({ department: trainer.specialty })
      .eq("employee_id", trainer.employee_id);

    if (updateError) {
      console.error(`Failed to update employee department for ${trainer.full_name}:`, updateError);
    } else {
      console.log(`Successfully aligned department for ${trainer.full_name} -> "${trainer.specialty}"`);
    }
  }

  console.log("Migration completed!");
}

main();
