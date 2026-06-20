const { createClient } = require("@supabase/supabase-js");
const { listMemberReceipts } = require("../backend/services/memberReceiptService");
require("dotenv").config({ path: __dirname + "/../backend/.env" });

async function diagnoseSpecific() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase configuration.");
    process.exit(1);
  }

  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;

  const lookup = {
    memberId: "7aa8b4dc-a00f-4680-be71-001c565e1544",
    userId: "00000000-0000-4000-8000-000000000005",
    email: "member@gymster.local",
    username: "member00"
  };

  console.log(`Diagnosing listMemberReceipts for:`, lookup);

  try {
    const result = await listMemberReceipts(lookup);
    if (!result.ok) {
      console.error(`[-] FAILED:`, result);
    } else {
      console.log(`[+] SUCCESS:`, result.data);
    }
  } catch (err) {
    console.error(`[!] CRASHED:`, err);
  }

  process.exit(0);
}

diagnoseSpecific();
