import { supabase } from "./supabaseClient";
import { resolveCurrentMemberId } from "./memberPackageApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const invoiceColumns = `
  invoice_id,
  invoice_number,
  payment_id,
  member_id,
  employee_id,
  subtotal_amount,
  discount_amount,
  tax_amount,
  total_amount,
  invoice_status,
  issued_at,
  due_at,
  paid_at,
  created_at
`;

function titleCaseStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Issued";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function combineUserName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

export function mapInvoiceRow(row) {
  if (!row) return null;

  return {
    invoiceId: row.invoice_id,
    invoiceNumber: row.invoice_number,
    paymentId: row.payment_id,
    memberId: row.member_id,
    employeeId: row.employee_id,
    amount: Number(row.amount ?? row.total_amount ?? row.subtotal_amount ?? 0),
    subtotalAmount: Number(row.subtotal_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxAmount: Number(row.tax_amount || 0),
    status: row.status || row.invoice_status,
    statusLabel: titleCaseStatus(row.status || row.invoice_status),
    issuedAt: row.issued_at || row.created_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    memberName: row.memberName || "Member",
    packageName: row.packageName || "Membership package",
    paymentMethod: row.paymentMethod || "",
    transactionCode: row.transactionCode || row.payment_id || row.invoice_id,
    source: "supabase",
  };
}

async function getMemberNamesById(memberIds) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data: members, error } = await supabase
    .from("members")
    .select("member_id, user_id, member_code")
    .in("member_id", ids);

  if (error || !Array.isArray(members)) return {};

  const namesById = Object.fromEntries(
    members.map((member) => [member.member_id, member.member_code || "Member"])
  );
  const userIds = members.map((member) => member.user_id).filter(Boolean);

  if (!userIds.length) return namesById;

  const { data: users, error: userError } = await supabase
    .from("users")
    .select("user_id, first_name, last_name")
    .in("user_id", userIds);

  if (userError || !Array.isArray(users)) return namesById;

  const userNamesById = Object.fromEntries(users.map((user) => [user.user_id, combineUserName(user, "")]));
  members.forEach((member) => {
    if (userNamesById[member.user_id]) {
      namesById[member.member_id] = userNamesById[member.user_id];
    }
  });

  return namesById;
}

async function getPaymentDetailsById(paymentIds) {
  const ids = [...new Set((paymentIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data: payments, error } = await supabase
    .from("payments")
    .select("payment_id, package_id, payment_method, payment_status, amount, provider_reference, paid_at, created_at")
    .in("payment_id", ids);

  if (error || !Array.isArray(payments)) return {};

  const packageIds = payments.map((payment) => payment.package_id).filter(Boolean);
  let packageNamesById = {};

  if (packageIds.length) {
    const { data: packages, error: packageError } = await supabase
      .from("packages")
      .select("package_id, package_name")
      .in("package_id", packageIds);

    if (!packageError && Array.isArray(packages)) {
      packageNamesById = Object.fromEntries(packages.map((pkg) => [pkg.package_id, pkg.package_name]));
    }
  }

  return Object.fromEntries(
    payments.map((payment) => [
      payment.payment_id,
      {
        packageName: packageNamesById[payment.package_id] || "Membership package",
        paymentMethod: payment.payment_method || "",
        paymentStatus: payment.payment_status || "",
        transactionCode: payment.provider_reference || payment.payment_id,
        paidAt: payment.paid_at || payment.created_at,
      },
    ])
  );
}

async function enrichInvoiceRows(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const [memberNamesById, paymentDetailsById] = await Promise.all([
    getMemberNamesById(sourceRows.map((row) => row.member_id)),
    getPaymentDetailsById(sourceRows.map((row) => row.payment_id)),
  ]);

  return sourceRows.map((row) => {
    const paymentDetails = paymentDetailsById[row.payment_id] || {};
    return mapInvoiceRow({
      ...row,
      memberName: memberNamesById[row.member_id] || "Member",
      packageName: paymentDetails.packageName || "Membership package",
      paymentMethod: paymentDetails.paymentMethod || "",
      transactionCode: paymentDetails.transactionCode || row.payment_id || row.invoice_id,
      paid_at: row.paid_at || paymentDetails.paidAt,
    });
  });
}

export async function getInvoicesForMember(currentUser) {
  if (!supabase) {
    const error = new Error("Missing Supabase environment variables.");
    console.error("[Gymster Supabase] Failed to load member invoices:", error);
    return { data: [], error };
  }

  const memberId = await resolveCurrentMemberId(currentUser);

  if (!memberId || !uuidPattern.test(String(memberId))) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceColumns)
    .eq("member_id", memberId)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("[Gymster Supabase] Failed to load member invoices:", error);
    return { data: [], error };
  }

  return { data: await enrichInvoiceRows(data), error: null };
}

export async function getInvoiceById(invoiceId) {
  if (!supabase) {
    const error = new Error("Missing Supabase environment variables.");
    console.error("[Gymster Supabase] Failed to load invoice:", error);
    return { data: null, error };
  }

  let query = supabase.from("invoices").select(invoiceColumns);

  if (uuidPattern.test(String(invoiceId || ""))) {
    query = query.eq("invoice_id", invoiceId);
  } else {
    query = query.eq("invoice_number", invoiceId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[Gymster Supabase] Failed to load invoice:", error);
    return { data: null, error };
  }

  const enriched = await enrichInvoiceRows(data ? [data] : []);
  return { data: enriched[0] || null, error: null };
}

export async function getInvoicesForAdmin() {
  if (!supabase) {
    const error = new Error("Missing Supabase environment variables.");
    console.error("[Gymster Supabase] Failed to load invoices:", error);
    return { data: [], error };
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceColumns)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("[Gymster Supabase] Failed to load invoices:", error);
    return { data: [], error };
  }

  return { data: await enrichInvoiceRows(data), error: null };
}
