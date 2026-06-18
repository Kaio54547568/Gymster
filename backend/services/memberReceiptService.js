import { createClient } from "@supabase/supabase-js";

let supabaseClient;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredValue(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 && !normalized.startsWith("your_");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredValue(supabaseKey)) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseClient;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }
  return { ok: true, client };
}

function fullName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return user?.full_name || name || user?.username || fallback;
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

function formatMoney(value, currency = "VND") {
  return `${Number(value || 0).toLocaleString("vi-VN")} ${currency || "VND"}`;
}

function receiptCode(payment) {
  const source = String(payment?.transaction_code || payment?.provider_reference || payment?.payment_id || "");
  const compact = source.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `RC${compact.slice(-8).padStart(4, "0")}`;
}

async function resolveMemberId(client, lookup = {}) {
  const memberId = String(lookup.memberId || lookup.member_id || "").trim();
  if (memberId && uuidPattern.test(memberId)) {
    const { data: member } = await client.from("members").select("member_id").eq("member_id", memberId).maybeSingle();
    if (member?.member_id) return member.member_id;
  }

  const userId = String(lookup.userId || lookup.user_id || "").trim();
  if (userId && uuidPattern.test(userId)) {
    const { data: member } = await client.from("members").select("member_id").eq("user_id", userId).maybeSingle();
    if (member?.member_id) return member.member_id;
  }

  const email = String(lookup.email || "").trim().toLowerCase();
  if (email) {
    const { data: user } = await client.from("users").select("user_id").eq("email", email).maybeSingle();
    if (user?.user_id) {
      const { data: member } = await client.from("members").select("member_id").eq("user_id", user.user_id).maybeSingle();
      if (member?.member_id) return member.member_id;
    }
  }

  const username = String(lookup.username || "").trim();
  if (username) {
    const { data: user } = await client.from("users").select("user_id").eq("username", username).maybeSingle();
    if (user?.user_id) {
      const { data: member } = await client.from("members").select("member_id").eq("user_id", user.user_id).maybeSingle();
      if (member?.member_id) return member.member_id;
    }
  }

  return null;
}

async function fetchUsersByIds(client, userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await client
    .from("users")
    .select("user_id,first_name,last_name,full_name,username,email,phone_number")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.user_id, row]));
}

async function fetchPackagesByIds(client, packageIds) {
  const ids = [...new Set((packageIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await client
    .from("packages")
    .select("package_id,package_name,package_type,duration_months,price,session_limit,has_personal_trainer")
    .in("package_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.package_id, row]));
}

async function fetchMemberPackagesByIds(client, memberPackageIds) {
  const ids = [...new Set((memberPackageIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await client
    .from("member_packages")
    .select("member_package_id,member_id,package_id,trainer_id,status,start_date,end_date,activated_at,created_at")
    .in("member_package_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((row) => [row.member_package_id, row]));
}

async function fetchTrainerNamesByIds(client, trainerIds) {
  const ids = [...new Set((trainerIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data: trainers, error } = await client
    .from("trainers")
    .select("trainer_id,user_id,employee_id,trainer_code")
    .in("trainer_id", ids);
  if (error) throw error;

  const usersById = await fetchUsersByIds(client, (trainers || []).map((row) => row.user_id));
  const employeeIds = [...new Set((trainers || []).map((row) => row.employee_id).filter(Boolean))];
  let employeesById = {};
  if (employeeIds.length) {
    const { data: employees, error: employeeError } = await client
      .from("employees")
      .select("employee_id,full_name")
      .in("employee_id", employeeIds);
    if (employeeError) throw employeeError;
    employeesById = Object.fromEntries((employees || []).map((row) => [row.employee_id, row]));
  }

  return Object.fromEntries((trainers || []).map((trainer) => {
    const userName = trainer.user_id ? fullName(usersById[trainer.user_id], "") : "";
    return [trainer.trainer_id, userName || employeesById[trainer.employee_id]?.full_name || trainer.trainer_code || ""];
  }));
}

async function buildReceipts(client, payments) {
  const rows = payments || [];
  const memberIds = [...new Set(rows.map((row) => row.member_id).filter(Boolean))];
  const { data: members, error: memberError } = memberIds.length
    ? await client.from("members").select("member_id,user_id,member_code,full_name").in("member_id", memberIds)
    : { data: [], error: null };
  if (memberError) throw memberError;

  const membersById = Object.fromEntries((members || []).map((row) => [row.member_id, row]));
  const usersById = await fetchUsersByIds(client, (members || []).map((row) => row.user_id));
  const packagesById = await fetchPackagesByIds(client, rows.map((row) => row.package_id));
  const memberPackagesById = await fetchMemberPackagesByIds(client, rows.map((row) => row.member_package_id));
  const trainerNamesById = await fetchTrainerNamesByIds(client, Object.values(memberPackagesById).map((row) => row.trainer_id));

  return rows.map((payment) => {
    const member = membersById[payment.member_id] || {};
    const user = usersById[member.user_id] || {};
    const memberPackage = memberPackagesById[payment.member_package_id] || {};
    const pkg = packagesById[payment.package_id || memberPackage.package_id] || {};
    const code = receiptCode(payment);
    const paymentDate = payment.payment_date || payment.paid_at || payment.created_at;

    return {
      id: payment.payment_id,
      paymentId: payment.payment_id,
      receiptCode: code,
      receiptCreatedAt: payment.created_at,
      receiptCreatedLabel: formatDate(payment.created_at),
      member: {
        fullName: member.full_name || fullName(user),
        memberId: member.member_code || member.member_id || payment.member_id,
        email: user.email || "",
        phone: user.phone_number || "",
      },
      package: {
        name: pkg.package_name || "Membership package",
        type: titleCase(pkg.package_type || ""),
        duration: pkg.duration_months ? `${pkg.duration_months} month(s)` : "",
        startDate: memberPackage.start_date || memberPackage.activated_at || memberPackage.created_at || "",
        startDateLabel: formatDate(memberPackage.start_date || memberPackage.activated_at || memberPackage.created_at),
        endDate: memberPackage.end_date || "",
        endDateLabel: formatDate(memberPackage.end_date),
        trainerName: trainerNamesById[memberPackage.trainer_id] || "",
      },
      payment: {
        transactionCode: payment.transaction_code || payment.provider_reference || payment.payment_id,
        paymentDate,
        paymentDateLabel: formatDate(paymentDate),
        amount: Number(payment.amount || 0),
        amountLabel: formatMoney(payment.amount, payment.currency),
        currency: payment.currency || "VND",
        method: titleCase(payment.payment_method || ""),
        status: titleCase(payment.payment_status || "pending"),
      },
    };
  });
}

export async function listMemberReceipts(lookup = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const memberId = await resolveMemberId(ready.client, lookup);
    if (!memberId) return { ok: true, data: [] };

    const { data, error } = await ready.client
      .from("payments")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { ok: true, data: await buildReceipts(ready.client, data || []) };
  } catch (error) {
    console.error("[Member Receipts] Failed to list receipts:", error);
    return { ok: false, status: 500, message: error.message || "Could not load receipts." };
  }
}

export async function getMemberReceipt(id, lookup = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const memberId = await resolveMemberId(ready.client, lookup);
    let query = ready.client.from("payments").select("*");
    if (uuidPattern.test(String(id || ""))) {
      query = query.eq("payment_id", id);
    } else {
      query = query.or(`transaction_code.eq.${id},provider_reference.eq.${id}`);
    }
    if (memberId) query = query.eq("member_id", memberId);

    const { data, error } = await query.order("created_at", { ascending: false }).limit(1);
    if (error) throw error;

    let receipts = await buildReceipts(ready.client, data || []);
    if (!receipts.length && !uuidPattern.test(String(id || ""))) {
      const listed = await listMemberReceipts(lookup);
      if (!listed.ok) return listed;
      receipts = (listed.data || []).filter((receipt) => receipt.receiptCode === id);
    }

    if (!receipts.length) return { ok: false, status: 404, message: "Receipt not found." };
    return { ok: true, data: receipts[0] };
  } catch (error) {
    console.error("[Member Receipts] Failed to get receipt:", error);
    return { ok: false, status: 500, message: error.message || "Could not load receipt." };
  }
}

function pdfEscape(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createSimplePdf(lines) {
  const content = [
    "BT",
    "/F1 18 Tf",
    "50 790 Td",
    `(Receipt / Bien lai) Tj`,
    "/F1 10 Tf",
    "0 -28 Td",
    ...lines.flatMap((line) => [`(${pdfEscape(line)}) Tj`, "0 -18 Td"]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

export async function getMemberReceiptPdf(id, lookup = {}) {
  const result = await getMemberReceipt(id, lookup);
  if (!result.ok) return result;
  const receipt = result.data;
  const lines = [
    `Receipt Code: ${receipt.receiptCode}`,
    `Receipt Created: ${receipt.receiptCreatedLabel}`,
    "",
    "Member Information",
    `Full Name: ${receipt.member.fullName}`,
    `Member ID: ${receipt.member.memberId}`,
    `Email: ${receipt.member.email}`,
    `Phone: ${receipt.member.phone}`,
    "",
    "Package Information",
    `Package Name: ${receipt.package.name}`,
    `Package Type: ${receipt.package.type}`,
    `Duration: ${receipt.package.duration}`,
    `Start Date: ${receipt.package.startDateLabel}`,
    `End Date: ${receipt.package.endDateLabel}`,
    `PT: ${receipt.package.trainerName || "N/A"}`,
    "",
    "Payment Information",
    `Transaction Code: ${receipt.payment.transactionCode}`,
    `Payment Date: ${receipt.payment.paymentDateLabel}`,
    `Amount: ${receipt.payment.amountLabel}`,
    `Method: ${receipt.payment.method}`,
    `Status: ${receipt.payment.status}`,
  ];
  return {
    ok: true,
    receiptCode: receipt.receiptCode,
    filename: `Receipt_${receipt.receiptCode}.pdf`,
    buffer: createSimplePdf(lines),
  };
}
