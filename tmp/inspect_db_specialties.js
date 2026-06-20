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
  console.log("--- EMPLOYEES ---");
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("employee_id, employee_code, full_name, role, department");
  
  if (empError) {
    console.error(empError);
  } else {
    employees.forEach(e => {
      console.log(`${e.employee_code} | ${e.full_name} | ${e.role} | ${e.department}`);
    });
  }

  console.log("\n--- TRAINERS ---");
  const { data: trainers, error: trError } = await supabase
    .from("trainers")
    .select("trainer_id, trainer_code, full_name, specialty");
  
  if (trError) {
    console.error(trError);
  } else {
    trainers.forEach(t => {
      console.log(`${t.trainer_code} | ${t.full_name} | ${t.specialty}`);
    });
  }

  console.log("\n--- PACKAGES ---");
  const { data: packages, error: pkgError } = await supabase
    .from("packages")
    .select("package_id, package_code, package_name, package_type, price, duration_months, session_limit, has_personal_trainer, sessions_per_week");
  
  if (pkgError) {
    console.error(pkgError);
  } else {
    packages.forEach(p => {
      console.log(`${p.package_code} | ${p.package_name} | ${p.package_type} | ${p.price} VND | ${p.duration_months} mos | limits: ${p.session_limit} | PT: ${p.has_personal_trainer} (${p.sessions_per_week}/wk)`);
    });
  }
}

main();
