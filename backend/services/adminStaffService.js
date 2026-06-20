import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { replaceStaffSchedule } from "./staffScheduleService.js";

const BCRYPT_ROUNDS = 10;
const DEFAULT_WORKER_PASSWORD = "Worker@123";
const STAFF_MEMBER_LIMIT = 10;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
}

function splitFullName(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "Worker", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function makeUsername(email, employeeCode) {
  return String(email || "").split("@")[0] || String(employeeCode || "worker").toLowerCase();
}

function normalizeRole(value) {
  return String(value || "").toLowerCase() === "trainer" ? "trainer" : "staff";
}

function normalizeGender(value) {
  const gender = String(value || "").toLowerCase();
  return ["male", "female", "other", "unspecified"].includes(gender) ? gender : "unspecified";
}

function isStrongPassword(password) {
  return (
    typeof password === "string"
    && password.length >= 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );
}

function normalizeEmployeeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeDetailRole(value) {
  const role = String(value || "").toLowerCase();
  return role === "trainer" || role === "staff" ? role : "";
}

function formatEmployeeCode(number) {
  return `NV${String(number).padStart(4, "0")}`;
}

async function employeeCodeExists(client, employeeCode) {
  const code = normalizeEmployeeCode(employeeCode);
  if (!code) return false;

  const { data, error } = await client
    .from("employees")
    .select("employee_id")
    .eq("employee_code", code)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.employee_id);
}

async function fetchUser(client, userId) {
  if (!userId) return {};
  const { data, error } = await client
    .from("users")
    .select("user_id,email,username,first_name,last_name,phone_number,gender,date_of_birth,role,account_status,avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

async function fetchEmployeeByIdentifier(client, identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;

  let query = client.from("employees").select("*").limit(1);
  query = uuidPattern.test(value)
    ? query.eq("employee_id", value)
    : query.eq("employee_code", normalizeEmployeeCode(value));

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

async function fetchTrainerByIdentifier(client, identifier) {
  const value = String(identifier || "").trim();
  if (!value) return null;

  let query = client.from("trainers").select("*").limit(1);
  query = uuidPattern.test(value)
    ? query.eq("trainer_id", value)
    : query.eq("trainer_code", normalizeEmployeeCode(value));

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

async function fetchTrainerForEmployee(client, employee) {
  if (!employee) return null;
  let query = client.from("trainers").select("*").limit(1);
  query = employee.employee_id
    ? query.eq("employee_id", employee.employee_id)
    : query.eq("user_id", employee.user_id);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

async function countActiveTrainerMembers(client, trainerId) {
  if (!trainerId) return null;
  const { count, error } = await client
    .from("trainer_assignments")
    .select("member_id", { count: "exact", head: true })
    .eq("trainer_id", trainerId)
    .eq("status", "active");
  if (error) throw error;
  return typeof count === "number" ? count : null;
}

function combineUserName(user) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
}

function toDetailPayload({ employee, trainer, user, activeMembers }) {
  const role = trainer ? "trainer" : normalizeRole(employee?.role || user?.role);
  const maxMembers = role === "staff"
    ? STAFF_MEMBER_LIMIT
    : Number(trainer?.max_active_members ?? employee?.member_limit ?? 0);

  return {
    id: employee?.employee_id || trainer?.trainer_id || user?.user_id || "",
    employee_code: employee?.employee_code || trainer?.trainer_code || "",
    full_name: employee?.full_name || trainer?.full_name || combineUserName(user),
    role,
    email: employee?.email || user?.email || "",
    phone: employee?.phone_number || user?.phone_number || "",
    gender: employee?.gender || user?.gender || "",
    date_of_birth: employee?.date_of_birth || user?.date_of_birth || "",
    department: employee?.department || trainer?.specialty || "",
    base_salary: employee?.base_salary ?? null,
    status: employee?.status || trainer?.status || user?.account_status || "",
    active_members: Number(activeMembers || 0),
    max_members: maxMembers,
    username: user?.username || "",
  };
}

async function generateEmployeeCode(client) {
  const { data, error } = await client
    .from("employees")
    .select("employee_code")
    .like("employee_code", "NV%")
    .order("employee_code", { ascending: false })
    .limit(100);

  if (error) throw error;

  const maxNumber = (data || []).reduce((max, row) => {
    const match = String(row.employee_code || "").match(/^NV(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  for (let next = maxNumber + 1; next < maxNumber + 10000; next += 1) {
    const candidate = formatEmployeeCode(next);
    if (!(await employeeCodeExists(client, candidate))) return candidate;
  }

  throw new Error("Could not generate a unique employee code.");
}

export async function checkEmployeeCodeUnique(employeeCode) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }

  const code = normalizeEmployeeCode(employeeCode);
  if (!code) return { ok: true, unique: true };

  try {
    const exists = await employeeCodeExists(client, code);
    return { ok: true, unique: !exists, employeeCode: code };
  } catch (error) {
    console.error("[Admin Staff] Failed to check employee code:", error);
    return { ok: false, status: 500, message: error.message || "Could not check employee code." };
  }
}

export async function getAdminStaffDetail(identifier, roleHint = "") {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }

  try {
    const normalizedRole = normalizeDetailRole(roleHint);
    let employee = null;
    let trainer = null;

    if (normalizedRole === "trainer") {
      trainer = await fetchTrainerByIdentifier(client, identifier);
      if (trainer?.employee_id) {
        employee = await fetchEmployeeByIdentifier(client, trainer.employee_id);
      }
    }

    if (!employee) {
      employee = await fetchEmployeeByIdentifier(client, identifier);
    }

    if (!trainer && (normalizedRole === "trainer" || employee?.role === "trainer")) {
      trainer = await fetchTrainerForEmployee(client, employee);
    }

    if (!employee && trainer?.employee_id) {
      employee = await fetchEmployeeByIdentifier(client, trainer.employee_id);
    }

    if (!employee && !trainer) {
      return { ok: false, status: 404, message: "Staff or trainer not found." };
    }

    const user = await fetchUser(client, employee?.user_id || trainer?.user_id);
    const activeTrainerMembers = trainer
      ? await countActiveTrainerMembers(client, trainer.trainer_id)
      : null;
    const activeMembers = trainer
      ? activeTrainerMembers ?? trainer.current_active_members
      : employee?.current_active_members;

    return {
      ok: true,
      data: toDetailPayload({ employee, trainer, user, activeMembers }),
    };
  } catch (error) {
    console.error("[Admin Staff] Failed to load staff detail:", error);
    return { ok: false, status: 500, message: error.message || "Could not load staff detail." };
  }
}

export async function createAdminStaff(payload = {}) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }

  const fullName = String(payload.fullName || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = String(payload.phone || "").trim();
  const role = normalizeRole(payload.role);
  const gender = normalizeGender(payload.gender);
  const dateOfBirth = payload.dateOfBirth || null;
  const password = String(payload.password || DEFAULT_WORKER_PASSWORD);
  const specialty = payload.specialty !== undefined ? String(payload.specialty || "").trim() : "";
  let employeeCode = normalizeEmployeeCode(payload.employeeCode);

  if (!fullName || !email || !phone || !role) {
    return { ok: false, status: 400, message: "Please complete all required fields." };
  }

  if (role === "staff") {
    if (!payload.workingSchedule || !Array.isArray(payload.workingSchedule) || payload.workingSchedule.length === 0) {
      return { ok: false, status: 400, message: "Staff must have at least one active shift." };
    }
  }

  if (payload.password && !isStrongPassword(password)) {
    return { ok: false, status: 400, message: "Password does not meet the required rules." };
  }


  try {
    const { data: existingUser, error: existingUserError } = await client
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (existingUserError) throw existingUserError;
    if (existingUser?.user_id) {
      return { ok: false, status: 409, code: "EMAIL_EXISTS", message: "Email already exists. Please enter another email." };
    }

    let username = String(payload.username || "").trim();
    if (username) {
      const usernameRegex = /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/;
      if (!usernameRegex.test(username)) {
        return { ok: false, status: 400, message: "Username must be 6-30 characters long, start and end with a letter or number, and only contain alphanumeric characters, dots, underscores, or hyphens." };
      }

      const { data: existingUserByUsername, error: existingUsernameError } = await client
        .from("users")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (existingUsernameError) throw existingUsernameError;
      if (existingUserByUsername?.user_id) {
        return { ok: false, status: 409, code: "USERNAME_EXISTS", message: "Username already exists. Please enter another username." };
      }
    } else {
      const baseUsername = makeUsername(email, employeeCode);
      username = baseUsername;
      let counter = 0;
      while (true) {
        const checkUsername = counter === 0 ? username : `${username}${counter}`;
        const usernameRegex = /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/;
        if (!usernameRegex.test(checkUsername)) {
          username = "user_" + checkUsername;
          continue;
        }

        const { data: existingUserByUsername, error: existingUsernameError } = await client
          .from("users")
          .select("user_id")
          .eq("username", checkUsername)
          .maybeSingle();
        if (existingUsernameError) throw existingUsernameError;
        if (!existingUserByUsername?.user_id) {
          username = checkUsername;
          break;
        }
        counter++;
      }
    }

    if (employeeCode) {
      if (await employeeCodeExists(client, employeeCode)) {
        return { ok: false, status: 409, code: "EMPLOYEE_CODE_EXISTS", message: "Employee code already exists. Please enter another code." };
      }
    } else {
      employeeCode = await generateEmployeeCode(client);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { firstName, lastName } = splitFullName(fullName);

    const { data: user, error: userError } = await client
      .from("users")
      .insert({
        email,
        username,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        date_of_birth: dateOfBirth,
        gender,
        role,
        account_status: "active",
        preferred_language: "vi",
      })
      .select("user_id,email,username,first_name,last_name,phone_number,date_of_birth,gender,role,account_status")
      .single();

    if (userError) throw userError;

    const { data: employee, error: employeeError } = await client
      .from("employees")
      .insert({
        user_id: user.user_id,
        employee_code: employeeCode,
        full_name: fullName,
        email,
        phone_number: phone,
        gender,
        date_of_birth: dateOfBirth,
        role,
        department: specialty || "",
        base_salary: 0,
        status: "active",
        member_limit: STAFF_MEMBER_LIMIT,
        current_active_members: 0,
      })
      .select("employee_id,employee_code,full_name,email,phone_number,gender,date_of_birth,role,department,status,member_limit")
      .single();

    if (employeeError) throw employeeError;

    let trainer = null;
    if (role === "trainer") {
      const { data: trainerRow, error: trainerError } = await client
        .from("trainers")
        .insert({
          user_id: user.user_id,
          employee_id: employee.employee_id,
          trainer_code: employeeCode,
          full_name: fullName,
          specialty: specialty || "",
          bio: "",
          rating: 0,
          current_active_members: 0,
          max_active_members: STAFF_MEMBER_LIMIT,
          status: "active",
        })
        .select("trainer_id,trainer_code")
        .single();

      if (trainerError) throw trainerError;
      trainer = trainerRow;
    }

    if (role === "staff") {
      const schedRes = await replaceStaffSchedule(employee.employee_id, payload.workingSchedule);
      if (!schedRes.ok) {
        await client.from("employees").delete().eq("employee_id", employee.employee_id);
        await client.from("users").delete().eq("user_id", user.user_id);
        return { ok: false, status: schedRes.status || 400, message: schedRes.message || "Failed to save staff schedule." };
      }
    }

    return { ok: true, data: { user, employee, trainer } };
  } catch (error) {
    console.error("[Admin Staff] Failed to create staff:", error);

    const message = String(error.message || "");
    if (message.toLowerCase().includes("duplicate") && message.includes("employees_employee_code")) {
      return { ok: false, status: 409, code: "EMPLOYEE_CODE_EXISTS", message: "Employee code already exists. Please enter another code." };
    }
    if (message.toLowerCase().includes("duplicate") && message.includes("users_email")) {
      return { ok: false, status: 409, code: "EMAIL_EXISTS", message: "Email already exists. Please enter another email." };
    }

    return { ok: false, status: 500, message: message || "Could not create staff record." };
  }
}

export async function updateAdminStaff(id, payload = {}) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, status: 500, message: "Missing Supabase service configuration." };
  }

  try {
    let employee = await fetchEmployeeByIdentifier(client, id);
    let trainer = null;
    if (!employee) {
      trainer = await fetchTrainerByIdentifier(client, id);
      if (trainer?.employee_id) {
        employee = await fetchEmployeeByIdentifier(client, trainer.employee_id);
      }
    } else {
      trainer = await fetchTrainerForEmployee(client, employee);
    }

    if (!employee) {
      return { ok: false, status: 404, message: "Staff or trainer not found." };
    }

    const currentRole = employee.role;
    const newRole = normalizeRole(payload.role);

    if (currentRole !== newRole) {
      return { ok: false, status: 400, message: "Role changes between Staff and Trainer are not allowed." };
    }

    const fullName = String(payload.fullName || "").trim();
    const phone = String(payload.phone || "").trim();
    const gender = normalizeGender(payload.gender);
    const dateOfBirth = payload.dateOfBirth || null;
    const specialty = payload.specialty !== undefined ? String(payload.specialty || "").trim() : "";
    const status = payload.status || "active";

    if (!fullName || !phone) {
      return { ok: false, status: 400, message: "Please complete all required fields." };
    }

    if (newRole === "staff") {
      if (!payload.workingSchedule || !Array.isArray(payload.workingSchedule) || payload.workingSchedule.length === 0) {
        return { ok: false, status: 400, message: "Staff must have at least one active shift." };
      }
    }

    const { firstName, lastName } = splitFullName(fullName);

    const { error: userError } = await client
      .from("users")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        date_of_birth: dateOfBirth,
        gender,
        account_status: status === "active" ? "active" : "inactive",
      })
      .eq("user_id", employee.user_id);

    if (userError) throw userError;

    const { error: employeeError } = await client
      .from("employees")
      .update({
        full_name: fullName,
        phone_number: phone,
        gender,
        date_of_birth: dateOfBirth,
        department: specialty || "",
        status,
      })
      .eq("employee_id", employee.employee_id);

    if (employeeError) throw employeeError;

    if (newRole === "trainer" && trainer) {
      const { error: trainerError } = await client
        .from("trainers")
        .update({
          full_name: fullName,
          specialty: specialty || "",
          status,
        })
        .eq("trainer_id", trainer.trainer_id);

      if (trainerError) throw trainerError;
    }

    if (newRole === "staff") {
      const schedRes = await replaceStaffSchedule(employee.employee_id, payload.workingSchedule);
      if (!schedRes.ok) {
        return { ok: false, status: schedRes.status || 400, message: schedRes.message || "Failed to update staff schedule." };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("[Admin Staff] Failed to update staff:", error);
    return { ok: false, status: 500, message: error.message || "Could not update staff record." };
  }
}

