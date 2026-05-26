import { supabase } from "./supabaseClient";

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const packageColors = ["#FF0000", "#FF3333", "#CC0000", "#EF233C", "#990000"];

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfWeek(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function isoDate(date) {
  return date.toISOString();
}

function formatVndShort(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `${(amount / 1000000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}M VND`;
  return `${amount.toLocaleString("vi-VN")} VND`;
}

async function exactCount(table, column = "*", applyFilters = null) {
  if (!supabase) return 0;
  let query = supabase.from(table).select(column, { count: "exact", head: true });
  if (applyFilters) query = applyFilters(query);
  const { count, error } = await query;
  if (error) {
    console.error(`[Gymster h\u1ec7 th\u1ed1ng] Failed to count ${table}:`, error);
    return 0;
  }
  return count || 0;
}

async function fetchRows(table, columns, applyFilters = null) {
  if (!supabase) return [];
  let query = supabase.from(table).select(columns);
  if (applyFilters) query = applyFilters(query);
  const { data, error } = await query;
  if (error) {
    console.error(`[Gymster h\u1ec7 th\u1ed1ng] Failed to load ${table}:`, error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

function groupByMonth(rows, dateField, valueField, monthsBack = 5) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, index) => {
    const date = addMonths(startOfMonth(now), index - monthsBack + 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: monthLabels[date.getMonth()],
      value: 0,
    };
  });

  rows.forEach((row) => {
    const rawDate = row[dateField];
    if (!rawDate) return;
    const date = new Date(rawDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = months.find((item) => item.key === key);
    if (!bucket) return;
    bucket.value += valueField ? Number(row[valueField] || 0) : 1;
  });

  return months;
}

function buildMembershipGrowth(memberRows) {
  return groupByMonth(memberRows, "created_at").map((item) => ({
    month: item.month,
    members: item.value,
  }));
}

function buildRenewalAnalytics(requestRows) {
  return groupByMonth(requestRows, "requested_at").map((item) => ({
    month: item.month,
    renewals: item.value,
  }));
}

function buildWeeklyRevenue(paymentRows) {
  const weekStart = startOfWeek();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      day: weekdayLabels[date.getDay()],
      revenue: 0,
    };
  });

  paymentRows.forEach((payment) => {
    const date = new Date(payment.paid_at || payment.created_at);
    if (Number.isNaN(date.getTime())) return;
    const dayIndex = Math.max(0, Math.min(6, Math.floor((date.getTime() - weekStart.getTime()) / 86400000)));
    days[dayIndex].revenue += Number(payment.amount || 0) / 1000000;
  });

  return days.map((item) => ({
    ...item,
    revenue: Number(item.revenue.toFixed(1)),
  }));
}

async function buildPackageDistribution(activeMemberPackages) {
  const packageIds = [...new Set(activeMemberPackages.map((item) => item.package_id).filter(Boolean))];
  if (!packageIds.length) return [];

  const packages = await fetchRows("packages", "package_id, package_name, package_type", (query) => query.in("package_id", packageIds));
  const packageById = Object.fromEntries(packages.map((pkg) => [pkg.package_id, pkg]));
  const counts = new Map();

  activeMemberPackages.forEach((memberPackage) => {
    const pkg = packageById[memberPackage.package_id];
    const label = pkg?.package_name || pkg?.package_type || "Package";
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  const total = activeMemberPackages.length || 1;
  return Array.from(counts.entries()).map(([name, count], index) => ({
    name,
    value: Math.round((count / total) * 100),
    count,
    color: packageColors[index % packageColors.length],
  }));
}

export async function fetchStaffDashboardData() {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const fiveMonthsStart = addMonths(startOfMonth(now), -4);
  const weekStart = startOfWeek(now);

  const [
    totalActiveMembers,
    newMembersThisMonth,
    renewalRowsThisMonth,
    feedbackPending,
    highPriorityMaintenance,
    brokenEquipment,
    paidPaymentsThisMonth,
    paidPaymentsThisWeek,
    memberRowsFiveMonths,
    renewalRowsFiveMonths,
    activeMemberPackages,
    packages,
  ] = await Promise.all([
    exactCount("members", "member_id", (query) => query.eq("status", "active")),
    exactCount("members", "member_id", (query) => query.gte("created_at", isoDate(thisMonthStart))),
    fetchRows("package_change_requests", "package_change_request_id, requested_at, request_type, status", (query) =>
      query.eq("request_type", "renew").gte("requested_at", isoDate(thisMonthStart))
    ),
    exactCount("service_feedback", "feedback_id", (query) => query.in("status", ["submitted", "in_review"])),
    exactCount("maintenance_reports", "maintenance_report_id", (query) =>
      query.in("priority", ["high", "urgent"]).in("status", ["submitted", "in_review", "in_progress"])
    ),
    exactCount("equipment", "equipment_id", (query) => query.in("status", ["broken", "under_maintenance"])),
    fetchRows("payments", "payment_id, amount, payment_status, paid_at, created_at", (query) =>
      query.eq("payment_status", "paid").gte("created_at", isoDate(thisMonthStart))
    ),
    fetchRows("payments", "payment_id, amount, payment_status, paid_at, created_at", (query) =>
      query.eq("payment_status", "paid").gte("created_at", isoDate(weekStart))
    ),
    fetchRows("members", "member_id, status, created_at", (query) => query.gte("created_at", isoDate(fiveMonthsStart))),
    fetchRows("package_change_requests", "package_change_request_id, requested_at, request_type", (query) =>
      query.eq("request_type", "renew").gte("requested_at", isoDate(fiveMonthsStart))
    ),
    fetchRows("member_packages", "member_package_id, package_id, status", (query) => query.eq("status", "active")),
    fetchRows("packages", "package_id, package_name, package_type, has_personal_trainer, is_popular, status"),
  ]);

  const activePackageIds = new Set(activeMemberPackages.map((item) => item.package_id).filter(Boolean));
  const packageById = Object.fromEntries(packages.map((pkg) => [pkg.package_id, pkg]));
  const premiumMembers = activeMemberPackages.filter((item) => {
    const pkg = packageById[item.package_id];
    return pkg?.package_type === "vip_pt" || pkg?.package_type === "pt" || pkg?.has_personal_trainer || pkg?.is_popular;
  }).length;
  const revenueThisMonth = paidPaymentsThisMonth.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const renewalCountThisMonth = renewalRowsThisMonth.length;
  const attentionRequired = highPriorityMaintenance + brokenEquipment;

  return {
    stats: {
      totalActiveMembers,
      newMembersThisMonth,
      renewalsThisMonth: renewalCountThisMonth,
      pendingFeedback: feedbackPending,
    },
    cards: {
      premiumMembers,
      attentionRequired,
      revenueThisMonth,
      revenueThisMonthText: formatVndShort(revenueThisMonth),
    },
    membershipGrowth: buildMembershipGrowth(memberRowsFiveMonths),
    renewalAnalytics: buildRenewalAnalytics(renewalRowsFiveMonths),
    revenueStatistics: buildWeeklyRevenue(paidPaymentsThisWeek),
    packageDistribution: await buildPackageDistribution(activeMemberPackages.filter((item) => activePackageIds.has(item.package_id))),
  };
}
