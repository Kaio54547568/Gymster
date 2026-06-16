import { supabase } from "./supabaseClient";

const EMPTY_RESULT = { data: null, error: null };

function requireSupabase(feature) {
  if (!supabase) {
    const error = new Error(`Missing h\u1ec7 th\u1ed1ng configuration for ${feature}.`);
    console.error("[Gymster h\u1ec7 th\u1ed1ng]", error);
    return error;
  }
  return null;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-GB");
}

function formatDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
}

function fullName(row, fallback = "User") {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return row?.full_name || name || row?.username || row?.email || fallback;
}

function formatMethod(method) {
  return String(method || "payment")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function monthLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-US", { month: "short" });
}

function groupByMonth(rows, dateKey, valueKey) {
  const totals = {};
  (rows || []).forEach((row) => {
    const key = monthLabel(row[dateKey] || row.created_at);
    totals[key] = (totals[key] || 0) + Number(valueKey ? row[valueKey] || 0 : 1);
  });
  return Object.entries(totals).map(([month, value]) => ({ month, value }));
}

async function fetchUsersByIds(userIds) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("users")
    .select("user_id,email,username,first_name,last_name,phone_number,date_of_birth,gender,role,account_status,avatar_url")
    .in("user_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((user) => [user.user_id, user]));
}

async function fetchEmployeesByIds(employeeIds) {
  const ids = [...new Set((employeeIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("employees")
    .select("employee_id,user_id,employee_code,full_name,email,phone_number,role,department,base_salary,status")
    .in("employee_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((employee) => [employee.employee_id, employee]));
}

async function fetchMembersByIds(memberIds) {
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("members")
    .select("member_id,user_id,member_code,full_name,phone_number,date_of_birth,gender,status,join_date")
    .in("member_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((member) => [member.member_id, member]));
}

async function fetchPackagesByIds(packageIds) {
  const ids = [...new Set((packageIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("packages")
    .select("package_id,package_name,package_type,price,duration_months,status,sessions_per_week")
    .in("package_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((pkg) => [pkg.package_id, pkg]));
}

async function fetchRoomsByIds(roomIds) {
  const ids = [...new Set((roomIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("rooms")
    .select("room_id,room_code,room_name,room_type,capacity,status")
    .in("room_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((room) => [room.room_id, room]));
}

export async function fetchExecutiveDashboardData() {
  const configError = requireSupabase("executive dashboard");
  if (configError) return { data: EMPTY_RESULT.data, error: configError };

  try {
    const [paymentsResult, membersResult, packagesResult, feedbackResult, complaintsResult] = await Promise.all([
      supabase.from("payments").select("amount,payment_status,payment_method,payment_date,created_at"),
      supabase.from("members").select("member_id,status,join_date,created_at"),
      supabase.from("member_packages").select("package_id,status,created_at"),
      supabase.from("service_feedback").select("feedback_id,status,rating,created_at"),
      supabase.from("complaints").select("complaint_id,status,priority,created_at"),
    ]);

    [paymentsResult, membersResult, packagesResult, feedbackResult, complaintsResult].forEach((result) => {
      if (result.error) throw result.error;
    });

    const payments = paymentsResult.data || [];
    const members = membersResult.data || [];
    const packageRows = packagesResult.data || [];
    const paidPayments = payments.filter((payment) => payment.payment_status === "paid");
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const revenueData = groupByMonth(paidPayments, "payment_date", "amount").map((row) => ({
      month: row.month,
      revenue: Math.round(row.value / 1_000_000),
    }));
    const membershipData = groupByMonth(members, "join_date").map((row) => ({
      month: row.month,
      members: row.value,
    }));

    const packagesById = await fetchPackagesByIds(packageRows.map((row) => row.package_id));
    const packageTotals = {};
    packageRows.forEach((row) => {
      const pkg = packagesById[row.package_id];
      const name = pkg?.package_name || "Package";
      packageTotals[name] = (packageTotals[name] || 0) + 1;
    });
    const colors = ["#EF233C", "#FF2D2D", "#990000", "#F97316", "#22C55E"];
    const packageDistribution = Object.entries(packageTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));

    const dailyTotals = {};
    paidPayments.forEach((payment) => {
      const date = new Date(payment.payment_date || payment.created_at);
      const day = Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString("en-US", { weekday: "short" });
      dailyTotals[day] = (dailyTotals[day] || 0) + Number(payment.amount || 0);
    });

    return {
      data: {
        totalRevenue,
        totalMembers: members.length,
        activeMembers: members.filter((member) => member.status === "active").length,
        openIssues: (complaintsResult.data || []).filter((item) => !["resolved", "closed", "rejected"].includes(item.status)).length,
        feedbackCount: (feedbackResult.data || []).length,
        revenueData,
        membershipData,
        packageDistribution,
        dailyRevenue: Object.entries(dailyTotals).map(([day, amount]) => ({ day, amount: Math.round(amount / 1_000_000) })),
      },
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load executive dashboard:", error);
    return { data: null, error };
  }
}

export async function fetchMembershipAnalyticsData() {
  const configError = requireSupabase("membership analytics");
  if (configError) return { data: null, error: configError };

  try {
    const [{ data: members, error: membersError }, { data: memberPackages, error: packageError }] = await Promise.all([
      supabase.from("members").select("member_id,user_id,status,join_date,created_at"),
      supabase.from("member_packages").select("member_id,package_id,status,created_at"),
    ]);
    if (membersError) throw membersError;
    if (packageError) throw packageError;

    const usersById = await fetchUsersByIds((members || []).map((member) => member.user_id));
    const packagesById = await fetchPackagesByIds((memberPackages || []).map((row) => row.package_id));
    const membershipGrowth = groupByMonth(members || [], "join_date").map((row) => ({ month: row.month, members: row.value }));

    const packageTotals = {};
    (memberPackages || []).forEach((row) => {
      const name = packagesById[row.package_id]?.package_name || "No package";
      packageTotals[name] = (packageTotals[name] || 0) + 1;
    });
    const colors = ["#EF233C", "#FF2D2D", "#990000", "#F97316", "#22C55E"];
    const packageDistribution = Object.entries(packageTotals).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));

    const ageGroups = { "18-25": 0, "26-35": 0, "36-45": 0, "46+": 0 };
    (members || []).forEach((member) => {
      const user = usersById[member.user_id];
      const dob = new Date(user?.date_of_birth);
      if (Number.isNaN(dob.getTime())) return;
      const age = new Date().getFullYear() - dob.getFullYear();
      if (age <= 25) ageGroups["18-25"] += 1;
      else if (age <= 35) ageGroups["26-35"] += 1;
      else if (age <= 45) ageGroups["36-45"] += 1;
      else ageGroups["46+"] += 1;
    });

    const activeMembers = (members || []).filter((member) => member.status === "active").length;
    const expiredMembers = (memberPackages || []).filter((item) => item.status === "expired").length;
    const vipMembers = (memberPackages || []).filter((item) => packagesById[item.package_id]?.package_type === "vip_pt").length;

    return {
      data: {
        totalMembers: (members || []).length,
        activeMembers,
        expiredMembers,
        vipMembers,
        membershipGrowth,
        packageDistribution,
        ageGroups: Object.entries(ageGroups).map(([age, count]) => ({ age, count })),
      },
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load membership analytics:", error);
    return { data: null, error };
  }
}

export async function fetchAdminStaffData() {
  const configError = requireSupabase("staff management");
  if (configError) return { data: [], trainers: [], error: configError };

  try {
    const [{ data: employees, error: employeeError }, { data: trainers, error: trainerError }] = await Promise.all([
      supabase.from("employees").select("*").order("created_at", { ascending: false }),
      supabase.from("trainers").select("*").order("created_at", { ascending: false }),
    ]);
    if (employeeError) throw employeeError;
    if (trainerError) throw trainerError;

    const usersById = await fetchUsersByIds([
      ...(employees || []).map((employee) => employee.user_id),
      ...(trainers || []).map((trainer) => trainer.user_id),
    ]);
    const employeesById = Object.fromEntries((employees || []).map((employee) => [employee.employee_id, employee]));

    return {
      data: (employees || []).map((employee) => {
        const user = usersById[employee.user_id] || {};
        return {
          maNV: employee.employee_code || employee.employee_id,
          hoTen: fullName(employee, fullName(user, "Employee")),
          chucVu: employee.role || "staff",
          luongCoBan: Number(employee.base_salary || 0).toLocaleString("vi-VN"),
          sdt: employee.phone_number || user.phone_number || "",
          chuyenMon: employee.department || employee.role || "",
          chungChi: employee.status || "",
          performance: 0,
          avatar: user.avatar_url || "",
        };
      }),
      trainers: (trainers || []).map((trainer) => {
        const user = usersById[trainer.user_id] || {};
        const employee = employeesById[trainer.employee_id] || {};
        return {
          id: trainer.trainer_id,
          name: trainer.full_name || fullName(user, employee.full_name || trainer.trainer_code || "Trainer"),
          specialty: trainer.specialty || "Personal training",
          currentActiveMembers: Number(trainer.current_active_members || 0),
          maxActiveMembers: Number(trainer.max_active_members || 0),
          status: trainer.status || "active",
        };
      }),
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load admin staff data:", error);
    return { data: [], trainers: [], error };
  }
}


export async function fetchPayrollData() {
  const configError = requireSupabase("payroll");
  if (configError) return { data: [], error: configError };

  try {
    const { data: rows, error } = await supabase
      .from("payslips")
      .select("*, payroll_periods(period_name,period_start,period_end,status)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const employeesById = await fetchEmployeesByIds((rows || []).map((row) => row.employee_id));
    return {
      data: (rows || []).map((row) => {
        const employee = employeesById[row.employee_id] || {};
        const periodStart = new Date(row.payroll_periods?.period_start || row.created_at);
        return {
          employeeCode: employee.employee_code || row.employee_id,
          employeeName: employee.full_name || "Employee",
          role: employee.role === "trainer" ? "Trainer" : employee.role === "admin" || employee.role === "owner" ? "Manager" : "Staff",
          baseSalary: Number(row.base_salary || 0),
          bonus: Number(row.bonus_amount || 0),
          deductions: Number(row.deduction_amount || 0),
          status: row.status === "paid" ? "Paid" : row.status === "cancelled" ? "Failed" : "Pending",
          month: Number.isNaN(periodStart.getTime()) ? "Unknown" : periodStart.toLocaleString("en-US", { month: "long" }),
          quarter: Number.isNaN(periodStart.getTime()) ? "Q1" : `Q${Math.floor(periodStart.getMonth() / 3) + 1}`,
          year: Number.isNaN(periodStart.getTime()) ? "" : String(periodStart.getFullYear()),
        };
      }),
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load payroll:", error);
    return { data: [], error };
  }
}


export async function fetchEquipmentManagementData() {
  const configError = requireSupabase("equipment management");
  if (configError) return { data: [], error: configError };

  try {
    const { data: rows, error } = await supabase.from("equipment").select("*").order("equipment_code", { ascending: true });
    if (error) throw error;
    const roomsById = await fetchRoomsByIds((rows || []).map((row) => row.room_id));
    return {
      data: (rows || []).map((item) => ({
        maThietBi: item.equipment_code || item.equipment_id,
        tenThietBi: item.equipment_name,
        soLuong: 1,
        ngayNhap: formatDate(item.purchase_date),
        baoHanh: item.next_maintenance_date ? `Next: ${formatDate(item.next_maintenance_date)}` : "",
        xuatXu: item.brand || item.model || "",
        trangThai: item.status === "broken" ? "Broken" : item.status === "under_maintenance" ? "Under Maintenance" : "Active",
        maPhong: roomsById[item.room_id]?.room_code || "",
        tenPhong: roomsById[item.room_id]?.room_name || "Unassigned",
        image: "",
      })),
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load equipment management data:", error);
    return { data: [], error };
  }
}

export async function fetchFeedbackSatisfactionData() {
  const configError = requireSupabase("feedback satisfaction");
  if (configError) return { data: [], error: configError };

  try {
    const [{ data: feedbackRows, error: feedbackError }, { data: complaintRows, error: complaintError }] = await Promise.all([
      supabase.from("service_feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("complaints").select("*").order("created_at", { ascending: false }),
    ]);
    if (feedbackError) throw feedbackError;
    if (complaintError) throw complaintError;

    const membersById = await fetchMembersByIds([
      ...(feedbackRows || []).map((row) => row.member_id),
      ...(complaintRows || []).map((row) => row.member_id),
    ]);
    const usersById = await fetchUsersByIds(Object.values(membersById).map((member) => member.user_id));
    const memberName = (memberId) => {
      const member = membersById[memberId] || {};
      return fullName(usersById[member.user_id], member.full_name || member.member_code || "Member");
    };

    const feedbackData = [
      ...(feedbackRows || []).map((row) => ({
        id: row.feedback_id,
        member: memberName(row.member_id),
        feedback: row.comment || "",
        category: row.target_type || "service",
        status: row.status === "resolved" ? "Resolved" : row.status === "in_review" ? "Processing" : "Pending",
        staff: "",
        date: formatDate(row.created_at),
        type: Number(row.rating || 0) >= 4 ? "positive" : Number(row.rating || 0) <= 2 ? "negative" : "neutral",
      })),
      ...(complaintRows || []).map((row) => ({
        id: row.complaint_id,
        member: memberName(row.member_id),
        feedback: row.description || row.title || "",
        category: row.complaint_type || "complaint",
        status: row.status === "resolved" || row.status === "closed" ? "Resolved" : row.status === "in_progress" || row.status === "in_review" ? "Processing" : "Pending",
        staff: "",
        date: formatDate(row.created_at),
        type: "negative",
      })),
    ];
    return { data: feedbackData, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load feedback satisfaction:", error);
    return { data: [], error };
  }
}


export async function fetchRevenueBreakdowns() {
  const configError = requireSupabase("revenue breakdowns");
  if (configError) return { data: null, error: configError };

  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount,payment_method,payment_status,payment_date,package_id,created_at");
    if (error) throw error;
    const paid = (payments || []).filter((payment) => payment.payment_status === "paid");
    const packagesById = await fetchPackagesByIds(paid.map((payment) => payment.package_id));

    const monthlyRevenue = groupByMonth(paid, "payment_date", "amount").map((row) => ({
      month: row.month,
      revenue: Math.round(row.value / 1_000_000),
    }));
    const packageTotals = {};
    paid.forEach((payment) => {
      const name = packagesById[payment.package_id]?.package_name || "Membership package";
      packageTotals[name] = (packageTotals[name] || 0) + Number(payment.amount || 0);
    });
    const revenueByPackage = Object.entries(packageTotals).map(([name, total]) => ({
      package: name,
      revenue: Math.round(total / 1_000_000),
    }));
    const methodTotals = {};
    const paidTotal = paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    paid.forEach((payment) => {
      const method = formatMethod(payment.payment_method);
      methodTotals[method] = (methodTotals[method] || 0) + Number(payment.amount || 0);
    });
    const colors = ["#22C55E", "#EF233C", "#F97316", "#990000"];
    const revenueByPaymentMethod = Object.entries(methodTotals).map(([name, total], index) => ({
      name,
      value: paidTotal ? Math.round((total / paidTotal) * 100) : 0,
      color: colors[index % colors.length],
    }));
    return { data: { monthlyRevenue, revenueByPackage, revenueByPaymentMethod }, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load revenue breakdowns:", error);
    return { data: null, error };
  }
}
