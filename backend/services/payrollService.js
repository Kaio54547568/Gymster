import { createClient } from "@supabase/supabase-js";

let supabaseClient;

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
  if (!client) return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  return { ok: true, client };
}

function monthIndex(value) {
  const month = String(value || "").trim().toLowerCase();
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const index = months.indexOf(month);
  if (index >= 0) return index;
  const numeric = Number(month);
  return numeric >= 1 && numeric <= 12 ? numeric - 1 : -1;
}

function monthNameFromDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-US", { month: "long" });
}

function roleLabel(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "trainer") return "Trainer";
  if (normalized === "admin" || normalized === "owner" || normalized === "manager") return "Manager";
  return "Staff";
}

function statusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "paid") return "Paid";
  if (normalized === "cancelled") return "Failed";
  return "Pending";
}

function fullName(row, fallback = "Employee") {
  return row?.full_name || [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim() || row?.email || fallback;
}

function mapEmployee(row) {
  return {
    employeeId: row.employee_id,
    employeeCode: row.employee_code || row.employee_id,
    employeeName: fullName(row),
    role: roleLabel(row.role),
    baseSalary: Number(row.base_salary || 0),
  };
}

function mapPayslip(row, employeesById = {}) {
  const employee = employeesById[row.employee_id] || row.employees || {};
  const period = row.payroll_periods || {};
  const periodStart = period.period_start || row.created_at;
  const date = new Date(periodStart);
  const allowance = Number(row.allowance_amount || 0);

  return {
    payslipId: row.payslip_id,
    payrollPeriodId: row.payroll_period_id,
    employeeId: row.employee_id,
    employeeCode: employee.employee_code || row.employee_id,
    employeeName: fullName(employee),
    role: roleLabel(employee.role),
    baseSalary: Number(row.base_salary || 0),
    bonus: Number(row.bonus_amount || 0),
    deductions: Number(row.deduction_amount || 0),
    allowance,
    totalPayout: Number(row.net_amount || 0),
    status: statusLabel(row.status),
    rawStatus: row.status || "draft",
    month: monthNameFromDate(periodStart) || "Unknown",
    quarter: Number.isNaN(date.getTime()) ? "Q1" : `Q${Math.floor(date.getMonth() / 3) + 1}`,
    year: Number.isNaN(date.getTime()) ? "" : String(date.getFullYear()),
    periodName: period.period_name || "",
    periodStart: period.period_start || "",
    periodEnd: period.period_end || "",
    createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "",
    note: row.notes || "",
  };
}

async function fetchEmployeesByIds(client, ids) {
  const employeeIds = [...new Set((ids || []).filter(Boolean))];
  if (!employeeIds.length) return {};
  const { data, error } = await client
    .from("employees")
    .select("employee_id,employee_code,full_name,role,base_salary,email")
    .in("employee_id", employeeIds);
  if (error) throw error;
  return Object.fromEntries((data || []).map((employee) => [employee.employee_id, employee]));
}

async function listPayrollEmployees(client) {
  const { data, error } = await client
    .from("employees")
    .select("employee_id,employee_code,full_name,role,base_salary,email,status")
    .in("role", ["staff", "trainer"])
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data || []).filter((row) => String(row.status || "active").toLowerCase() !== "inactive").map(mapEmployee);
}

async function findOrCreatePayrollPeriod(client, month, year) {
  const index = monthIndex(month);
  const numericYear = Number(year);
  if (index < 0 || !Number.isInteger(numericYear) || numericYear < 2000) {
    throw new Error("Payroll period is invalid.");
  }

  const start = new Date(Date.UTC(numericYear, index, 1));
  const end = new Date(Date.UTC(numericYear, index + 1, 0));
  const periodStart = start.toISOString().slice(0, 10);
  const periodEnd = end.toISOString().slice(0, 10);
  const periodName = `${numericYear}-${String(index + 1).padStart(2, "0")} Payroll`;

  const { data: existing, error: existingError } = await client
    .from("payroll_periods")
    .select("*")
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.payroll_period_id) return existing;

  const { data, error } = await client
    .from("payroll_periods")
    .insert({
      period_name: periodName,
      period_start: periodStart,
      period_end: periodEnd,
      status: "processing",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listPayroll() {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data: rows, error } = await ready.client
      .from("payslips")
      .select("*, payroll_periods(period_name,period_start,period_end,status)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const employeesById = await fetchEmployeesByIds(ready.client, (rows || []).map((row) => row.employee_id));
    const employees = await listPayrollEmployees(ready.client);

    return {
      ok: true,
      data: (rows || []).map((row) => mapPayslip(row, employeesById)),
      employees,
    };
  } catch (error) {
    console.error("[Payroll] Failed to list payroll:", error);
    return { ok: false, status: 500, message: error.message || "Could not load payroll." };
  }
}

export async function getPayslip(id) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  try {
    const { data, error } = await ready.client
      .from("payslips")
      .select("*, payroll_periods(period_name,period_start,period_end,status)")
      .eq("payslip_id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { ok: false, status: 404, message: "Payslip not found." };

    const employeesById = await fetchEmployeesByIds(ready.client, [data.employee_id]);
    return { ok: true, data: mapPayslip(data, employeesById) };
  } catch (error) {
    console.error("[Payroll] Failed to load payslip:", error);
    return { ok: false, status: 500, message: error.message || "Could not load payslip." };
  }
}

export async function createPayslip(body = {}) {
  const ready = requireClient();
  if (!ready.ok) return ready;

  const employeeId = String(body.employeeId || body.employee_id || "").trim();
  const baseSalary = Number(body.baseSalary ?? body.base_salary ?? 0);
  const bonus = Number(body.bonus ?? body.bonus_amount ?? 0);
  const allowance = Number(body.allowance ?? body.allowance_amount ?? 0);
  const deductions = Number(body.deductions ?? body.deduction_amount ?? 0);
  const status = String(body.status || "draft").toLowerCase();
  const normalizedStatus = ["draft", "approved", "paid", "cancelled"].includes(status) ? status : "draft";

  if (!employeeId || !body.month || !body.year) {
    return { ok: false, status: 400, message: "Employee and payroll period are required." };
  }

  if (baseSalary <= 0 || bonus < 0 || allowance < 0 || deductions < 0) {
    return { ok: false, status: 400, message: "Salary values must be valid and non-negative." };
  }

  try {
    const { data: employee, error: employeeError } = await ready.client
      .from("employees")
      .select("employee_id,employee_code,full_name,role,base_salary,email")
      .eq("employee_id", employeeId)
      .maybeSingle();
    if (employeeError) throw employeeError;
    if (!employee) return { ok: false, status: 404, message: "Employee not found." };

    const period = await findOrCreatePayrollPeriod(ready.client, body.month, body.year);
    const netAmount = baseSalary + bonus + allowance - deductions;

    const payload = {
      payroll_period_id: period.payroll_period_id,
      employee_id: employeeId,
      base_salary: baseSalary,
      bonus_amount: bonus,
      allowance_amount: allowance,
      deduction_amount: deductions,
      net_amount: netAmount,
      status: normalizedStatus,
      notes: String(body.note || body.notes || "").trim(),
      paid_at: normalizedStatus === "paid" ? new Date().toISOString() : null,
    };

    const { data, error } = await ready.client
      .from("payslips")
      .insert(payload)
      .select("*, payroll_periods(period_name,period_start,period_end,status)")
      .single();
    if (error) throw error;

    return { ok: true, data: mapPayslip(data, { [employee.employee_id]: employee }) };
  } catch (error) {
    console.error("[Payroll] Failed to create payslip:", error);
    const message = String(error.message || "");
    if (message.toLowerCase().includes("duplicate")) {
      return { ok: false, status: 409, message: "A payslip already exists for this employee and period." };
    }
    if (message.includes("allowance_amount")) {
      return { ok: false, status: 500, message: "Database is missing payslips.allowance_amount. Run the latest schema migration." };
    }
    return { ok: false, status: 500, message: message || "Could not create payslip." };
  }
}
