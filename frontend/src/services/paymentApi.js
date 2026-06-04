import { supabase } from "./supabaseClient";
import { resolveCurrentMemberId } from "./memberPackageApi";
import { requestMedicalHistoryForMember } from "./medicalHistoryApi";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const paymentColumns = `
  payment_id,
  member_id,
  package_id,
  member_package_id,
  training_request_id,
  amount,
  payment_method,
  payment_status,
  paid_at,
  provider_reference,
  created_at
`;

function normalizePaymentMethod(method) {
  return String(method || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, "_");
}

function titleCaseStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!value) return "Pending";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function combineUserName(user, fallback = "Member") {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return name || fallback;
}

export function mapPaymentRow(row) {
  if (!row) return null;

  return {
    paymentId: row.payment_id,
    memberId: row.member_id,
    packageId: row.package_id,
    memberPackageId: row.member_package_id,
    trainingRequestId: row.training_request_id,
    amount: Number(row.amount || 0),
    packageName: row.packageName || row.packages?.package_name || "Membership package",
    memberName: row.memberName || row.members?.full_name || combineUserName(row.users, "Member"),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentStatusLabel: titleCaseStatus(row.payment_status),
    paymentDate: row.payment_date || row.paid_at || row.created_at,
    transactionCode: row.transaction_code || row.provider_reference || row.payment_id,
    source: "supabase",
  };
}

async function resolveMemberId(paymentData) {
  if (paymentData.memberId && uuidPattern.test(String(paymentData.memberId))) {
    return paymentData.memberId;
  }

  if (paymentData.memberEmail) {
    const { data: user } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", paymentData.memberEmail)
      .maybeSingle();

    if (user?.user_id) {
      const { data: member } = await supabase
        .from("members")
        .select("member_id")
        .eq("user_id", user.user_id)
        .maybeSingle();

      if (member?.member_id) {
        return member.member_id;
      }
    }
  }

  const { data } = await supabase
    .from("members")
    .select("member_id")
    .limit(1)
    .maybeSingle();

  return data?.member_id || paymentData.memberId;
}

async function getPackageNamesById(packageIds) {
  const ids = [...new Set((packageIds || []).filter(Boolean))];
  if (!ids.length) return {};

  const { data, error } = await supabase
    .from("packages")
    .select("package_id, package_name")
    .in("package_id", ids);

  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(data.map((pkg) => [pkg.package_id, pkg.package_name]));
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

async function enrichPaymentRows(rows) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const [packageNamesById, memberNamesById] = await Promise.all([
    getPackageNamesById(sourceRows.map((row) => row.package_id)),
    getMemberNamesById(sourceRows.map((row) => row.member_id)),
  ]);

  return sourceRows.map((row) =>
    mapPaymentRow({
      ...row,
      packageName: packageNamesById[row.package_id] || "Membership package",
      memberName: memberNamesById[row.member_id] || "Member",
    })
  );
}

async function insertCurrentSchemaPayment(payload) {
  return supabase
    .from("payments")
    .insert({
      member_id: payload.member_id,
      package_id: payload.package_id,
      member_package_id: payload.member_package_id,
      training_request_id: payload.training_request_id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      payment_status: payload.payment_status,
      paid_at: payload.payment_date,
      provider_reference: payload.transaction_code,
      transfer_content: payload.transfer_content,
    })
    .select(paymentColumns)
    .single();
}

async function insertLegacyPayment(payload) {
  return supabase
    .from("payments")
    .insert({
      member_id: payload.member_id,
      package_id: payload.package_id,
      member_package_id: payload.member_package_id,
      training_request_id: payload.training_request_id,
      amount: payload.amount,
      payment_method: payload.payment_method,
      payment_status: payload.payment_status,
      payment_date: payload.payment_date,
      transaction_code: payload.transaction_code,
    })
    .select("*")
    .single();
}

export async function createPayment(paymentData) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create payment:", error);
    return { data: null, error };
  }

  const memberId = await resolveMemberId(paymentData);
  const trainingRequestId = uuidPattern.test(String(paymentData.trainingRequestId || ""))
    ? paymentData.trainingRequestId
    : null;

  const payload = {
    member_id: memberId,
    package_id: paymentData.packageId || null,
    member_package_id: paymentData.memberPackageId || null,
    training_request_id: trainingRequestId,
    amount: Number(paymentData.amount || 0),
    payment_method: normalizePaymentMethod(paymentData.paymentMethod),
    payment_status: "paid",
    payment_date: paymentData.paymentDate || new Date().toISOString(),
    transaction_code: paymentData.transactionCode,
    transfer_content: paymentData.transferContent,
  };

  let { data, error } = await insertCurrentSchemaPayment(payload);

  if (error) {
    ({ data, error } = await insertLegacyPayment(payload));
  }

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create payment:", error);
    return { data: null, error };
  }

  const enriched = await enrichPaymentRows([data]);
  if (trainingRequestId && memberId) {
    await requestMedicalHistoryForMember(memberId);
  }
  return { data: enriched[0] || mapPaymentRow(data), error: null };
}

export async function getPaymentById(paymentId) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load payment:", error);
    return { data: null, error };
  }

  const { data, error } = await supabase
    .from("payments")
    .select(paymentColumns)
    .eq("payment_id", paymentId)
    .maybeSingle();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load payment:", error);
    return { data: null, error };
  }

  const enriched = await enrichPaymentRows(data ? [data] : []);
  return { data: enriched[0] || null, error: null };
}

export async function getPaymentsByMemberId(memberId) {
  if (!supabase) {
    return { data: [], error: null };
  }

  if (!memberId || !uuidPattern.test(String(memberId))) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("payments")
    .select(paymentColumns)
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load member payments:", error);
    return { data: [], error };
  }

  return { data: await enrichPaymentRows(data), error: null };
}

export async function getPaymentsForMember(memberLookup) {
  if (!supabase) {
    return { data: [], error: null };
  }

  const memberId = await resolveCurrentMemberId(memberLookup);
  return getPaymentsByMemberId(memberId);
}

export async function getAllPayments() {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load payments:", error);
    return { data: [], error };
  }

  const { data, error } = await supabase
    .from("payments")
    .select(paymentColumns)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load payments:", error);
    return { data: [], error };
  }

  return { data: await enrichPaymentRows(data), error: null };
}
