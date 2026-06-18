import { supabase } from "./supabaseClient";
import { getUsers } from "./authService";

const EMPTY_RESULT = { data: null, error: null };
const STAFF_MEMBER_LIMIT = 10;

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

function localUserName(user, fallback = "User") {
  return fullName({
    full_name: user?.fullName || user?.full_name,
    first_name: user?.firstName || user?.first_name,
    last_name: user?.lastName || user?.last_name,
    username: user?.username,
    email: user?.email,
  }, fallback);
}

function buildLocalAdminStaffData() {
  const users = getUsers();
  const staffUsers = users.filter((user) => {
    const role = String(user.role || user.sourceRole || "").toLowerCase();
    return role === "staff" || role === "trainer" || role === "pt";
  });

  const data = staffUsers.map((user, index) => {
    const role = String(user.role || "").toLowerCase();
    const sourceRole = String(user.sourceRole || "").toLowerCase();
    const normalizedRole = role === "pt" || role === "trainer" || sourceRole === "trainer" ? "trainer" : "staff";
    const employeeCode = user.employeeCode || user.employee_code || (normalizedRole === "trainer" ? `PT-DEMO-${index + 1}` : `ST-DEMO-${index + 1}`);

    return {
      maNV: employeeCode,
      id: user.id || user.userId || user.user_id || employeeCode,
      userId: user.userId || user.user_id || user.id || "",
      hoTen: localUserName(user, normalizedRole === "trainer" ? "Trainer" : "Staff"),
      email: user.email || "",
      role: normalizedRole,
      chucVu: normalizedRole === "trainer" ? "Trainer" : "Staff",
      luongCoBan: "0",
      sdt: user.phone || user.phone_number || "",
      chuyenMon: normalizedRole === "trainer" ? "Personal training" : "Staff",
      chungChi: user.accountStatus || user.account_status || "Active",
      currentActiveMembers: Number(user.currentActiveMembers || user.current_active_members || 0),
      maxActiveMembers: Number(user.maxActiveMembers || user.max_active_members || STAFF_MEMBER_LIMIT),
      performance: 0,
      avatar: user.avatar || user.avatar_url || "",
      rawUser: user,
    };
  });

  const trainers = data
    .filter((employee) => employee.role === "trainer")
    .map((employee) => ({
      id: employee.rawUser?.trainerId || employee.rawUser?.trainer_id || employee.id,
      name: employee.hoTen,
      specialty: employee.chuyenMon || "Personal training",
      email: employee.email,
      phone: employee.sdt,
      avatar: employee.avatar,
      currentActiveMembers: employee.currentActiveMembers,
      maxActiveMembers: employee.maxActiveMembers,
      status: employee.chungChi || "Active",
    }));

  return {
    data: data.map(({ rawUser, ...employee }) => employee),
    trainers,
    error: null,
  };
}

function getLocalAdminStaffDetail(id, role) {
  const localData = buildLocalAdminStaffData();
  const normalizedRole = String(role || "").toLowerCase();
  const rows = normalizedRole === "trainer" ? localData.trainers : localData.data;
  const row = rows.find((item) => {
    const values = [item.id, item.maNV, item.email].filter(Boolean).map((value) => String(value).toLowerCase());
    return values.includes(String(id || "").toLowerCase());
  });

  if (!row) return null;

  return {
    id: row.id || row.maNV,
    employee_code: row.maNV || row.id,
    full_name: row.hoTen || row.name,
    role: normalizedRole === "trainer" || row.specialty ? "trainer" : "staff",
    email: row.email || "",
    phone: row.sdt || row.phone || "",
    gender: "",
    date_of_birth: "",
    department: row.chuyenMon || row.specialty || "",
    base_salary: 0,
    status: row.chungChi || row.status || "Active",
    active_members: Number(row.currentActiveMembers || 0),
    max_members: Number(row.maxActiveMembers || STAFF_MEMBER_LIMIT),
  };
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

async function fetchTrainersByIds(trainerIds) {
  const ids = [...new Set((trainerIds || []).filter(Boolean))];
  if (!ids.length) return {};
  const { data, error } = await supabase
    .from("trainers")
    .select("trainer_id,user_id,employee_id,trainer_code,full_name,specialty")
    .in("trainer_id", ids);
  if (error) throw error;
  return Object.fromEntries((data || []).map((trainer) => [trainer.trainer_id, trainer]));
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
  if (configError) return buildLocalAdminStaffData();

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
    const trainerEmployeeIds = new Set((trainers || []).map((trainer) => trainer.employee_id).filter(Boolean));
    const trainerRows = (trainers || []).map((trainer) => {
      const user = usersById[trainer.user_id] || {};
      const employee = employeesById[trainer.employee_id] || {};
      return {
        id: trainer.trainer_id,
        name: trainer.full_name || fullName(user, employee.full_name || trainer.trainer_code || "Trainer"),
        specialty: trainer.specialty || employee.department || "Personal training",
        email: employee.email || user.email || "",
        phone: employee.phone_number || user.phone_number || "",
        avatar: trainer.avatar_url || user.avatar_url || "",
        currentActiveMembers: Number(trainer.current_active_members || 0),
        maxActiveMembers: Number(trainer.max_active_members || 0),
        status: trainer.status || "active",
      };
    });
    const trainerFallbackRows = (employees || [])
      .filter((employee) => employee.role === "trainer" && !trainerEmployeeIds.has(employee.employee_id))
      .map((employee) => {
        const user = usersById[employee.user_id] || {};
        return {
          id: employee.employee_id,
          name: fullName(employee, fullName(user, employee.employee_code || "Trainer")),
          specialty: employee.department || "Personal training",
          email: employee.email || user.email || "",
          phone: employee.phone_number || user.phone_number || "",
          avatar: user.avatar_url || "",
          currentActiveMembers: 0,
          maxActiveMembers: Number(employee.member_limit || STAFF_MEMBER_LIMIT),
          status: employee.status || "active",
        };
      });

    return {
      data: (employees || []).map((employee) => {
        const user = usersById[employee.user_id] || {};
        return {
          maNV: employee.employee_code || employee.employee_id,
          hoTen: fullName(employee, fullName(user, "Employee")),
          email: employee.email || user.email || "",
          role: String(employee.role || user.role || "staff").toLowerCase(),
          chucVu: employee.role === "trainer" ? "Trainer" : employee.role === "staff" ? "Staff" : employee.role || "Staff",
          luongCoBan: Number(employee.base_salary || 0).toLocaleString("vi-VN"),
          sdt: employee.phone_number || user.phone_number || "",
          chuyenMon: employee.department || employee.role || "",
          chungChi: employee.status || "",
          currentActiveMembers: Number(employee.current_active_members || 0),
          maxActiveMembers: employee.role === "staff" ? STAFF_MEMBER_LIMIT : Number(employee.member_limit || STAFF_MEMBER_LIMIT),
          performance: 0,
          avatar: user.avatar_url || "",
        };
      }),
      trainers: [...trainerRows, ...trainerFallbackRows],
      error: null,
    };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load admin staff data:", error);
    return buildLocalAdminStaffData();
  }
}

async function adminStaffJson(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return { data: null, error: new Error(data.message || data.error || "Backend API request failed.") };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function checkEmployeeCodeUnique(employeeCode) {
  const code = String(employeeCode || "").trim();
  if (!code) return { unique: true, error: null };

  const { data, error } = await adminStaffJson(`/api/admin/staff/employee-code?code=${encodeURIComponent(code)}`);
  return { unique: Boolean(data?.unique), employeeCode: data?.employeeCode || code, error };
}

export async function createAdminStaffRecord(form) {
  const payload = {
    employeeCode: form.maNV,
    fullName: form.hoTen,
    email: form.email,
    phone: form.sdt,
    gender: form.gioiTinh,
    dateOfBirth: form.ngaySinh,
    role: form.chucVu,
    password: form.matKhau,
  };

  return adminStaffJson("/api/admin/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminStaffDetail(id, role) {
  const path = `/api/admin/staff/${encodeURIComponent(id)}?role=${encodeURIComponent(role || "")}`;
  const { data, error } = await adminStaffJson(path);
  if (!error && data?.data) return { data: data.data, error: null };

  const localDetail = getLocalAdminStaffDetail(id, role);
  if (localDetail) return { data: localDetail, error: null };

  return { data: null, error };
}


export async function fetchPayrollData() {
  const { data, error } = await payrollJson("/api/payroll");
  return { data: data?.data || [], employees: data?.employees || [], error };
}

async function payrollJson(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return { data: null, error: new Error(data.message || data.error || "Payroll API request failed.") };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createPayrollRecord(form) {
  return payrollJson("/api/payroll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}

export async function fetchPayrollRecordDetail(payslipId) {
  const { data, error } = await payrollJson(`/api/payroll/${encodeURIComponent(payslipId)}`);
  return { data: data?.data || null, error };
}


export async function fetchEquipmentManagementData() {
  const { data, error } = await equipmentJson("/api/equipments");
  return { data: data?.data || [], error };
}

async function equipmentJson(path, options = {}) {
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      return { data: null, error: new Error(data.message || data.error || "Equipment API request failed.") };
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function fetchEquipmentStats() {
  const { data, error } = await equipmentJson("/api/equipments/stats");
  return { data: data?.data || { total: 0, active: 0, inUse: 0, maintenance: 0 }, error };
}

export async function createEquipmentRecord(form) {
  return equipmentJson("/api/equipments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}

export async function updateEquipmentRecord(id, form) {
  return equipmentJson(`/api/equipments/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
}

export async function deleteEquipmentRecord(id) {
  return equipmentJson(`/api/equipments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

function mapFeedbackReportStatus(status) {
  if (["resolved", "closed"].includes(status)) return "Resolved";
  if (["in_review", "in_progress"].includes(status)) return "Processing";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function relatedTrainerName(trainer, usersById, employeesById) {
  if (!trainer) return "";
  const user = usersById[trainer.user_id] || {};
  const employee = employeesById[trainer.employee_id] || {};
  return trainer.full_name || employee.full_name || fullName(user, trainer.trainer_code || "Trainer");
}

function relatedEmployeeName(employee, usersById) {
  if (!employee) return "";
  const user = usersById[employee.user_id] || {};
  return employee.full_name || fullName(user, employee.employee_code || "Staff");
}

export async function fetchFeedbackReportData() {
  const configError = requireSupabase("feedback report");
  if (configError) return { data: [], error: configError };

  try {
    const [{ data: feedbackRows, error: feedbackError }, { data: complaintRows, error: complaintError }] = await Promise.all([
      supabase.from("service_feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("complaints").select("*").order("created_at", { ascending: false }),
    ]);
    if (feedbackError) throw feedbackError;
    if (complaintError) throw complaintError;

    const trainerIds = (feedbackRows || []).map((row) => row.trainer_id);
    const employeeIds = [
      ...(feedbackRows || []).map((row) => row.responded_by_employee_id),
      ...(complaintRows || []).map((row) => row.assigned_employee_id),
    ];

    const membersById = await fetchMembersByIds([
      ...(feedbackRows || []).map((row) => row.member_id),
      ...(complaintRows || []).map((row) => row.member_id),
    ]);
    const trainersById = await fetchTrainersByIds(trainerIds);
    const employeesById = await fetchEmployeesByIds([
      ...employeeIds,
      ...Object.values(trainersById).map((trainer) => trainer.employee_id),
    ]);
    const usersById = await fetchUsersByIds([
      ...Object.values(membersById).map((member) => member.user_id),
      ...Object.values(trainersById).map((trainer) => trainer.user_id),
      ...Object.values(employeesById).map((employee) => employee.user_id),
    ]);
    const memberName = (memberId) => {
      const member = membersById[memberId] || {};
      return fullName(usersById[member.user_id], member.full_name || member.member_code || "Member");
    };

    const rows = [
      ...(feedbackRows || []).map((row) => ({
        id: row.feedback_id,
        memberName: memberName(row.member_id),
        relatedPerson: relatedTrainerName(trainersById[row.trainer_id], usersById, employeesById)
          || relatedEmployeeName(employeesById[row.responded_by_employee_id], usersById)
          || "Unassigned",
        contentType: "Feedback",
        content: row.comment || "",
        rating: row.rating ?? null,
        status: mapFeedbackReportStatus(row.status),
        createdDate: formatDate(row.created_at),
        rawCreatedAt: row.created_at,
      })),
      ...(complaintRows || []).map((row) => ({
        id: row.complaint_id,
        memberName: memberName(row.member_id),
        relatedPerson: relatedEmployeeName(employeesById[row.assigned_employee_id], usersById) || "Unassigned",
        contentType: "Report",
        content: [row.title, row.description].filter(Boolean).join(" - "),
        rating: null,
        status: mapFeedbackReportStatus(row.status),
        createdDate: formatDate(row.created_at),
        rawCreatedAt: row.created_at,
      })),
    ].sort((a, b) => new Date(b.rawCreatedAt || 0).getTime() - new Date(a.rawCreatedAt || 0).getTime());
    return { data: rows, error: null };
  } catch (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load feedback report:", error);
    return { data: [], error };
  }
}

export const fetchFeedbackSatisfactionData = fetchFeedbackReportData;


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
