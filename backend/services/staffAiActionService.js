import { createClient } from "@supabase/supabase-js";

let supabaseClient;
const localPackageHistory = [];

function isConfiguredSupabaseUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isConfiguredSupabaseKey(value) {
  const key = String(value || "").trim();
  return key.length > 0 && !key.startsWith("your_");
}

const localMembers = [
  {
    memberId: "local-member-001",
    memberCode: "HV001",
    aliases: ["HV001", "HV-001", "MB001", "MB-001"],
    fullName: "Nguyen Van A",
    email: "member@gymster.local",
    phone: "0981000000",
    package: {
      memberPackageId: "local-member-package-001",
      packageId: "local-pt-3m",
      packageName: "PT Progress 3 Months",
      startDate: "2026-06-01",
      endDate: "2026-09-01",
      status: "active",
      remainingSessions: 21,
      sessionsTotal: 24,
      usedSessions: 3,
    },
  },
  {
    memberId: "local-member-014",
    memberCode: "MB-014",
    aliases: ["HV014", "HV-014", "MB014", "MB-014"],
    fullName: "Kim Le",
    email: "member14@gymster.local",
    phone: "0981000014",
    package: {
      memberPackageId: "local-member-package-014",
      packageId: "local-gym-12m",
      packageName: "Annual Gym Access",
      startDate: "2025-05-01",
      endDate: "2026-05-01",
      status: "expired",
      remainingSessions: null,
      sessionsTotal: null,
      usedSessions: 0,
    },
  },
];

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!isConfiguredSupabaseUrl(supabaseUrl) || !isConfiguredSupabaseKey(supabaseKey)) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

function normalizeVietnamese(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9@.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonthsToDate(value, months) {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < day) date.setDate(0);
  return toDateValue(date);
}

function todayValue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toDateValue(today);
}

function daysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function packageStatus(endDate, status) {
  const remaining = daysRemaining(endDate);
  if (String(status || "").toLowerCase() === "expired" || (remaining !== null && remaining < 0)) return "đã hết hạn";
  if (remaining !== null && remaining <= 7) return "sắp hết hạn";
  return "còn hạn";
}

function memberCodeVariants(query) {
  const raw = String(query || "").trim();
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const variants = new Set([raw, raw.toUpperCase(), compact]);
  const match = compact.match(/^(?:HV|MB)?(\d{1,4})$/);
  if (match) {
    const number = match[1].padStart(3, "0");
    variants.add(`HV${number}`);
    variants.add(`HV-${number}`);
    variants.add(`MB${number}`);
    variants.add(`MB-${number}`);
  }
  return [...variants].filter(Boolean);
}

function mapMember(member, user = {}) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || member.full_name || member.member_code || "Member";
  return {
    memberId: member.member_id,
    userId: member.user_id,
    memberCode: member.member_code || member.member_id,
    fullName,
    email: user.email || "",
    phone: user.phone_number || member.phone_number || "",
  };
}

function mapPackage(row, packageRow = {}) {
  if (!row) return null;
  return {
    memberPackageId: row.member_package_id,
    memberId: row.member_id,
    packageId: row.package_id,
    packageName: packageRow.package_name || "Membership package",
    packagePrice: Number(packageRow.price || 0),
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    status: row.status || "active",
    statusLabel: packageStatus(row.end_date, row.status),
    daysRemaining: daysRemaining(row.end_date),
    remainingSessions: row.remaining_sessions ?? null,
    sessionsTotal: row.sessions_total ?? null,
    usedSessions: row.used_sessions ?? row.sessions_used ?? 0,
  };
}

function findLocalMember(query) {
  const normalized = normalizeVietnamese(query);
  if (!normalized) return null;

  return localMembers.find((member) => {
    const haystack = normalizeVietnamese([
      member.memberCode,
      member.fullName,
      member.email,
      member.phone,
      ...(member.aliases || []),
    ].join(" "));
    return haystack.includes(normalized) || memberCodeVariants(query).some((variant) => haystack.includes(normalizeVietnamese(variant)));
  }) || null;
}

async function findSupabaseUserByMember(client, member) {
  if (!member?.user_id) return {};
  const { data } = await client
    .from("users")
    .select("user_id,email,first_name,last_name,phone_number")
    .eq("user_id", member.user_id)
    .maybeSingle();
  return data || {};
}

export async function findMember(query) {
  const client = getSupabaseClient();
  if (!client) {
    const local = findLocalMember(query);
    return local ? {
      memberId: local.memberId,
      memberCode: local.memberCode,
      fullName: local.fullName,
      email: local.email,
      phone: local.phone,
    } : null;
  }

  const variants = memberCodeVariants(query);
  const normalizedQuery = normalizeVietnamese(query);

  const { data: codeRows, error: codeError } = await client
    .from("members")
    .select("member_id,user_id,member_code,full_name,phone_number")
    .in("member_code", variants)
    .limit(5);
  if (codeError) throw codeError;
  if (codeRows?.[0]) return mapMember(codeRows[0], await findSupabaseUserByMember(client, codeRows[0]));

  const { data: memberRows, error: memberError } = await client
    .from("members")
    .select("member_id,user_id,member_code,full_name,phone_number")
    .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
    .limit(10);
  if (memberError) throw memberError;

  if (memberRows?.[0]) {
    const exact = memberRows.find((row) => normalizeVietnamese(row.full_name).includes(normalizedQuery) || String(row.phone_number || "").includes(String(query)));
    const target = exact || memberRows[0];
    return mapMember(target, await findSupabaseUserByMember(client, target));
  }

  const { data: userRows, error: userError } = await client
    .from("users")
    .select("user_id,email,first_name,last_name,phone_number")
    .or(`email.ilike.%${query}%,phone_number.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);
  if (userError) throw userError;
  if (!userRows?.length) return null;

  const user = userRows[0];
  const { data: member } = await client
    .from("members")
    .select("member_id,user_id,member_code,full_name,phone_number")
    .eq("user_id", user.user_id)
    .maybeSingle();
  return member ? mapMember(member, user) : null;
}

export async function getMemberPackage(memberId) {
  const client = getSupabaseClient();
  if (!client) {
    const local = localMembers.find((member) => member.memberId === memberId);
    return local ? mapPackage({
      member_package_id: local.package.memberPackageId,
      member_id: local.memberId,
      package_id: local.package.packageId,
      start_date: local.package.startDate,
      end_date: local.package.endDate,
      status: local.package.status,
      remaining_sessions: local.package.remainingSessions,
      sessions_total: local.package.sessionsTotal,
      used_sessions: local.package.usedSessions,
    }, { package_name: local.package.packageName }) : null;
  }

  const { data: rows, error } = await client
    .from("member_packages")
    .select("member_package_id,member_id,package_id,status,start_date,end_date,sessions_total,sessions_used,used_sessions,remaining_sessions,created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  const row = (rows || []).find((item) => item.status === "active") || rows?.[0] || null;
  if (!row) return null;

  const { data: packageRow } = await client
    .from("packages")
    .select("package_id,package_name,price")
    .eq("package_id", row.package_id)
    .maybeSingle();
  return mapPackage(row, packageRow || {});
}

export async function getPackageExtensionHistory(memberId) {
  const client = getSupabaseClient();
  if (!client) {
    return localPackageHistory.filter((item) => item.memberId === memberId);
  }

  const { data, error } = await client
    .from("package_change_requests")
    .select("package_change_request_id,request_type,status,requested_at,reviewed_at,amount")
    .eq("member_id", memberId)
    .eq("request_type", "renew")
    .order("requested_at", { ascending: false })
    .limit(10);
  if (error) return [];

  return (data || []).map((row) => ({
    historyId: row.package_change_request_id,
    type: row.request_type,
    status: row.status,
    createdAt: row.reviewed_at || row.requested_at,
    amount: row.amount,
  }));
}

export async function createPackageExtensionHistory(memberId, oldExpiredAt, newExpiredAt, months, staffId, memberPackage) {
  const client = getSupabaseClient();
  if (!client) {
    const item = {
      historyId: `LOCAL-HISTORY-${Date.now()}`,
      memberId,
      oldExpiredAt,
      newExpiredAt,
      months,
      staffId,
      createdAt: new Date().toISOString(),
      status: "approved",
    };
    localPackageHistory.unshift(item);
    return item;
  }

  let employeeId = null;
  if (staffId) {
    const { data: employee } = await client
      .from("employees")
      .select("employee_id")
      .eq("user_id", staffId)
      .maybeSingle();
    employeeId = employee?.employee_id || null;
  }

  const { data: requestRow } = await client
    .from("package_change_requests")
    .insert({
      member_id: memberId,
      current_member_package_id: memberPackage?.memberPackageId || null,
      requested_package_id: memberPackage?.packageId,
      request_type: "renew",
      amount: memberPackage?.packagePrice || null,
      payment_method: "cash",
      status: "approved",
      reviewed_by_employee_id: employeeId,
      reviewed_at: new Date().toISOString(),
    })
    .select("package_change_request_id,requested_at,reviewed_at,status")
    .single();

  await client.from("member_usage_history").insert({
    member_id: memberId,
    member_package_id: memberPackage?.memberPackageId || null,
    usage_type: "manual_adjustment",
    usage_date: new Date().toISOString(),
    description: `Staff AI extended package by ${months} month(s): ${oldExpiredAt || "-"} -> ${newExpiredAt}.`,
  });

  return requestRow || null;
}

export async function extendMemberPackage(memberId, months, staffId) {
  const parsedMonths = Number(months);
  if (!Number.isInteger(parsedMonths) || parsedMonths <= 0) {
    throw new Error("Số tháng gia hạn phải là số nguyên dương.");
  }
  if (parsedMonths > 24) {
    throw new Error("Không thể gia hạn quá 24 tháng trong một lần.");
  }

  const memberPackage = await getMemberPackage(memberId);
  if (!memberPackage?.memberPackageId) {
    throw new Error("Hội viên chưa có gói tập để gia hạn.");
  }

  const oldExpiredAt = memberPackage.endDate;
  const remaining = daysRemaining(oldExpiredAt);
  const baseDate = oldExpiredAt && remaining !== null && remaining >= 0 ? oldExpiredAt : todayValue();
  const newExpiredAt = addMonthsToDate(baseDate, parsedMonths);
  const client = getSupabaseClient();

  if (!client) {
    const local = localMembers.find((member) => member.memberId === memberId);
    if (local) {
      local.package.endDate = newExpiredAt;
      local.package.status = "active";
    }
    await createPackageExtensionHistory(memberId, oldExpiredAt, newExpiredAt, parsedMonths, staffId, memberPackage);
    return { oldExpiredAt, newExpiredAt, months: parsedMonths, memberPackage: await getMemberPackage(memberId) };
  }

  const { error } = await client
    .from("member_packages")
    .update({
      end_date: newExpiredAt,
      status: "active",
      start_date: memberPackage.startDate || todayValue(),
      activated_at: new Date().toISOString(),
    })
    .eq("member_package_id", memberPackage.memberPackageId);
  if (error) throw error;

  await createPackageExtensionHistory(memberId, oldExpiredAt, newExpiredAt, parsedMonths, staffId, memberPackage);
  return { oldExpiredAt, newExpiredAt, months: parsedMonths, memberPackage: await getMemberPackage(memberId) };
}
