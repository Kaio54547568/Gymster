import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const CODE_TTL_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

const USER_SELECT = `
  user_id,
  email,
  username,
  auth_user_id,
  password_hash,
  first_name,
  last_name,
  phone_number,
  date_of_birth,
  gender,
  headline,
  preferred_language,
  role,
  account_status,
  avatar_url
`;

let supabaseClient;
let mailTransporter;

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

function isMailConfigured() {
  return Boolean(
    isConfiguredValue(process.env.SMTP_HOST) &&
    isConfiguredValue(process.env.SMTP_USER) &&
    isConfiguredValue(process.env.SMTP_PASS),
  );
}

function getMailTransporter() {
  if (!isMailConfigured()) return null;

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return mailTransporter;
}

function getCodeSecret() {
  return (
    process.env.REGISTRATION_CODE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "gymster-dev-registration-code-secret"
  );
}

function hashCode(email, code) {
  return crypto
    .createHmac("sha256", getCodeSecret())
    .update(`${String(email || "").trim().toLowerCase()}:${String(code || "").trim()}`)
    .digest("hex");
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim();
}

export function getIdentifierLookupColumn(identifier) {
  return String(identifier || "").includes("@") ? "email" : "username";
}

function normalizeOptionalText(value) {
  const normalized = String(value || "").trim();
  return normalized || "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/.test(username);
}

function isStrongPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function isValidPhone(phone) {
  return /^\d{10,11}$/.test(String(phone || "").trim());
}

function isValidBirthDate(value) {
  if (!value) return false;

  const birthDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const minDate = new Date("1900-01-01T00:00:00");
  return !Number.isNaN(birthDate.getTime()) && birthDate >= minDate && birthDate < now;
}

function validateRegistrationPayload(payload) {
  const requiredFields = ["firstName", "lastName", "username", "email", "password", "phone", "dob", "gender", "occupation", "address"];
  const missingField = requiredFields.find((field) => !String(payload?.[field] || "").trim());

  if (missingField) {
    return "Please enter all required account information.";
  }

  if (!isValidEmail(normalizeEmail(payload.email))) {
    return "Please enter a valid email address.";
  }

  if (!isValidUsername(normalizeUsername(payload.username))) {
    return "Username must be 6-30 characters, use only A-Z, a-z, 0-9, _, ., -, and cannot start or end with _, ., or -.";
  }

  if (!isStrongPassword(String(payload.password || ""))) {
    return "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
  }

  if (!isValidPhone(payload.phone)) {
    return "Phone number must contain 10 to 11 digits.";
  }

  if (!isValidBirthDate(payload.dob)) {
    return "Date of birth is not valid.";
  }

  if (!["male", "female", "other", "unspecified"].includes(payload.gender)) {
    return "Please select a valid gender.";
  }

  return "";
}

export async function registerAccount(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: "Backend Supabase service role is not configured." };
  }

  const validationError = validateRegistrationPayload(payload);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const registrationData = sanitizeRegistrationPayload(payload);
  registrationData.passwordHash = await bcrypt.hash(payload.password, 10);

  const availability = await ensureAccountIdentifiersAvailable(client, registrationData.email, registrationData.username, {
    phone: registrationData.phone,
    citizenId: registrationData.citizenId,
    memberCode: registrationData.memberCode,
  });
  if (!availability.ok) return availability;

  try {
    const user = await createVerifiedMemberAccount(client, registrationData);
    return {
      ok: true,
      user,
      message: "Account created successfully.",
    };
  } catch (error) {
    console.error("[Gymster auth] Failed to register account:", error);
    return mapConstraintError(error, "Could not create account.");
  }
}

export const registerMemberAccount = registerAccount;

function validateStoredRegistrationPayload(payload) {
  const requiredFields = ["firstName", "lastName", "username", "email", "passwordHash", "phone", "dob", "gender", "occupation", "address"];
  const missingField = requiredFields.find((field) => !String(payload?.[field] || "").trim());

  if (missingField) {
    return "Saved registration data is incomplete.";
  }

  if (!isValidEmail(normalizeEmail(payload.email)) || !isValidUsername(normalizeUsername(payload.username))) {
    return "Saved registration data is invalid.";
  }

  if (!/^\$2[aby]\$/.test(String(payload.passwordHash || ""))) {
    return "Saved password data is invalid.";
  }

  if (!isValidPhone(payload.phone) || !isValidBirthDate(payload.dob)) {
    return "Saved registration data is invalid.";
  }

  if (!["male", "female", "other", "unspecified"].includes(payload.gender)) {
    return "Saved registration data is invalid.";
  }

  return "";
}

function sanitizeRegistrationPayload(payload) {
  return {
    firstName: String(payload.firstName || "").trim(),
    lastName: String(payload.lastName || "").trim(),
    username: normalizeUsername(payload.username),
    email: normalizeEmail(payload.email),
    password: String(payload.password || ""),
    phone: String(payload.phone || "").trim(),
    dob: String(payload.dob || "").trim(),
    gender: String(payload.gender || "").trim(),
    occupation: normalizeOptionalText(payload.occupation),
    address: normalizeOptionalText(payload.address),
    citizenId: normalizeOptionalText(payload.citizenId),
    memberCode: normalizeOptionalText(payload.memberCode).toUpperCase(),
    healthNotes: normalizeOptionalText(payload.healthNotes),
  };
}

function splitFullName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

async function ensureMemberCodeAvailable(client, memberCode) {
  if (!memberCode) return { ok: true };

  const { data, error } = await client
    .from("members")
    .select("member_id")
    .ilike("member_code", memberCode)
    .limit(1);

  if (error) throw error;
  if (data?.length) {
    return { ok: false, status: 409, message: "Member code already exists." };
  }

  return { ok: true };
}

async function ensureAccountIdentifiersAvailable(client, email, username, options = {}) {
  const { data: emailRows, error: emailError } = await client
    .from("users")
    .select("user_id")
    .ilike("email", email)
    .limit(1);

  if (emailError) throw emailError;
  if (emailRows?.length) {
    return { ok: false, status: 409, message: "Email already exists." };
  }

  const { data: usernameRows, error: usernameError } = await client
    .from("users")
    .select("user_id")
    .ilike("username", username)
    .limit(1);

  if (usernameError) throw usernameError;
  if (usernameRows?.length) {
    return { ok: false, status: 409, message: "Username already exists." };
  }

  const phone = String(options.phone || "").trim();
  if (phone) {
    const { data: phoneRows, error: phoneError } = await client
      .from("users")
      .select("user_id")
      .eq("phone_number", phone)
      .limit(1);

    if (phoneError) throw phoneError;
    if (phoneRows?.length) {
      return { ok: false, status: 409, message: "Phone number already exists." };
    }
  }

  const citizenId = String(options.citizenId || "").trim();
  if (citizenId) {
    const { data: citizenRows, error: citizenError } = await client
      .from("members")
      .select("member_id")
      .eq("citizen_id", citizenId)
      .limit(1);

    if (citizenError) throw citizenError;
    if (citizenRows?.length) {
      return { ok: false, status: 409, message: "Citizen ID already exists." };
    }
  }

  return ensureMemberCodeAvailable(client, String(options.memberCode || "").trim());
}

async function getLatestPendingRegistration(client, email) {
  const { data, error } = await client
    .from("registration_verifications")
    .select("*")
    .eq("email", email)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function sendRegistrationEmail(email, code) {
  const transporter = getMailTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Gymster auth] Verification code for ${email}: ${code}`);
      return { delivered: false, devCode: code };
    }

    throw new Error("Email delivery is not configured.");
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to: email,
    subject: "Your Gymster verification code",
    text: `Your Gymster verification code is ${code}. This code expires in ${CODE_TTL_MINUTES} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #171717;">
        <h2>Confirm your Gymster account</h2>
        <p>Enter this verification code to finish creating your member account:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
        <p>This code expires in ${CODE_TTL_MINUTES} minutes. If you did not request this email, you can ignore it.</p>
      </div>
    `,
  });

  return { delivered: true };
}

function getRegistrationRequestErrorMessage(error) {
  if (error?.code === "42P01") {
    return "Registration verification table is missing. Please run database/email_registration_verification.sql.";
  }

  if (error?.code === "EAUTH" || error?.responseCode === 535) {
    return "SMTP authentication failed. Please check SMTP_USER and SMTP_PASS.";
  }

  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET"].includes(error?.code)) {
    return "Could not connect to SMTP server. Please check SMTP_HOST, SMTP_PORT, and SMTP_SECURE.";
  }

  const detail = String(error?.response || error?.message || "").toLowerCase();
  if (detail.includes("domain") || detail.includes("sender") || detail.includes("from")) {
    return "SMTP sender is not accepted. Please verify MAIL_FROM domain/address in your email provider.";
  }

  return "Could not send registration verification code.";
}

function mapCreatedAccount(userRow, memberRow) {
  const fullName = splitFullName(userRow.first_name, userRow.last_name);

  return {
    id: userRow.user_id,
    userId: userRow.user_id,
    user_id: userRow.user_id,
    memberId: memberRow?.member_id || null,
    member_id: memberRow?.member_id || null,
    memberCode: memberRow?.member_code || null,
    member_code: memberRow?.member_code || null,
    username: userRow.username,
    email: userRow.email,
    firstName: userRow.first_name || "",
    lastName: userRow.last_name || "",
    fullName,
    phone: userRow.phone_number,
    phone_number: userRow.phone_number,
    dob: userRow.date_of_birth,
    date_of_birth: userRow.date_of_birth,
    gender: userRow.gender,
    occupation: memberRow?.occupation || "",
    address: memberRow?.address || "",
    role: "member",
    accountStatus: "PendingOnboarding",
    account_status: userRow.account_status || "pending_onboarding",
  };
}

async function generateMemberCode(client) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `MB-${crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")}`;
    const availability = await ensureMemberCodeAvailable(client, candidate);
    if (availability.ok) return candidate;
  }

  throw new Error("A unique member code could not be generated.");
}

function mapConstraintError(error, fallbackMessage = "Could not create account.") {
  const code = String(error?.code || "");
  const detail = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  const constraint = String(error?.constraint || "").toLowerCase();

  if (code !== "23505") {
    return { ok: false, status: 500, message: fallbackMessage };
  }

  if (constraint.includes("email") || detail.includes("idx_users_email_lower") || detail.includes("users_email_key")) {
    return { ok: false, status: 409, message: "Email already exists." };
  }

  if (constraint.includes("username") || detail.includes("idx_users_username_lower") || detail.includes("users_username_key")) {
    return { ok: false, status: 409, message: "Username already exists." };
  }

  if (constraint.includes("phone") || detail.includes("idx_users_phone_number_unique") || detail.includes("phone_number")) {
    return { ok: false, status: 409, message: "Phone number already exists." };
  }

  if (constraint.includes("citizen") || detail.includes("idx_members_citizen_id_unique") || detail.includes("citizen_id")) {
    return { ok: false, status: 409, message: "Citizen ID already exists." };
  }

  if (constraint.includes("member_code") || detail.includes("idx_members_member_code_lower") || detail.includes("member code")) {
    return { ok: false, status: 409, message: "Member code already exists." };
  }

  return { ok: false, status: 409, message: "A member account with the same unique information already exists." };
}

async function insertMemberProfile(client, userRow, registrationData, options = {}) {
  const fullName = splitFullName(registrationData.firstName, registrationData.lastName);
  const memberCode = registrationData.memberCode || (await generateMemberCode(client));
  const targetInsert = await client
    .from("members")
    .insert({
      user_id: userRow.user_id,
      member_code: memberCode,
      full_name: fullName,
      phone_number: registrationData.phone,
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      status: options.memberStatus || "pending",
      join_date: options.joinDate || null,
      occupation: registrationData.occupation || null,
      address: registrationData.address || null,
      citizen_id: registrationData.citizenId || null,
      health_notes: registrationData.healthNotes || null,
    })
    .select("*")
    .single();

  if (!targetInsert.error) return targetInsert;

  return client
    .from("members")
    .insert({
      user_id: userRow.user_id,
      member_code: memberCode,
      full_name: fullName,
      phone_number: registrationData.phone,
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      status: options.memberStatus || "pending_onboarding",
      join_date: options.joinDate || null,
      occupation: registrationData.occupation || null,
      address: registrationData.address || null,
      citizen_id: registrationData.citizenId || null,
      health_notes: registrationData.healthNotes || null,
    })
    .select("*")
    .single();
}

export async function createVerifiedMemberAccount(client, registrationData, options = {}) {
  const passwordHash = registrationData.passwordHash || (await bcrypt.hash(registrationData.password, BCRYPT_ROUNDS));

  const { data: userRow, error: userError } = await client
    .from("users")
    .insert({
      username: registrationData.username,
      email: registrationData.email,
      password_hash: passwordHash,
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      phone_number: registrationData.phone,
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      role: "member",
      account_status: options.accountStatus || "pending_onboarding",
    })
    .select("*")
    .single();

  if (userError) throw userError;

  const { data: memberRow, error: memberError } = await insertMemberProfile(client, userRow, registrationData, options);

  if (memberError) {
    await client.from("users").delete().eq("user_id", userRow.user_id);
    throw memberError;
  }

  await ensureSupabaseAuthIdentity(client, userRow, registrationData.password);

  return mapCreatedAccount(userRow, memberRow);
}

async function findAuthUserByEmail(client, email) {
  let page = 1;
  const target = normalizeEmail(email);

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const found = (data?.users || []).find((user) => normalizeEmail(user.email) === target);
    if (found) return found;

    if (!data?.users?.length || data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function ensureSupabaseAuthIdentity(client, user, password) {
  if (!user?.user_id || !user?.email || !password) {
    return { ok: false, message: "User, email, and password are required to provision auth identity." };
  }

  const targetEmail = normalizeEmail(user.email);
  const metadata = {
    app_user_id: user.user_id,
    username: user.username || "",
    role: user.role || "member",
  };

  let authUser = null;
  if (user.auth_user_id) {
    const { data, error } = await client.auth.admin.updateUserById(user.auth_user_id, {
      email: targetEmail,
      password,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: { provider: "email" },
    });
    if (error) throw error;
    authUser = data.user || null;
  } else {
    authUser = await findAuthUserByEmail(client, targetEmail);
    if (authUser?.id) {
      const { data, error } = await client.auth.admin.updateUserById(authUser.id, {
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: metadata,
        app_metadata: { provider: "email" },
      });
      if (error) throw error;
      authUser = data.user || authUser;
    } else {
      const { data, error } = await client.auth.admin.createUser({
        email: targetEmail,
        password,
        email_confirm: true,
        user_metadata: metadata,
        app_metadata: { provider: "email" },
      });
      if (error) throw error;
      authUser = data.user || null;
    }
  }

  if (!authUser?.id) {
    throw new Error("Supabase auth user could not be provisioned.");
  }

  const { error: updateError } = await client
    .from("users")
    .update({
      auth_user_id: authUser.id,
      auth_provider: "email",
    })
    .eq("user_id", user.user_id);
  if (updateError) throw updateError;

  return { ok: true, authUserId: authUser.id };
}

export async function requestRegistrationCode(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const registrationData = sanitizeRegistrationPayload(payload);
  const validationError = validateRegistrationPayload(registrationData);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const availability = await ensureAccountIdentifiersAvailable(client, registrationData.email, registrationData.username, {
      phone: registrationData.phone,
      citizenId: registrationData.citizenId,
      memberCode: registrationData.memberCode,
    });
    if (!availability.ok) return availability;

    const latestPending = await getLatestPendingRegistration(client, registrationData.email);
    if (latestPending?.created_at) {
      const createdAt = new Date(latestPending.created_at).getTime();
      const secondsSinceLastSend = Math.floor((Date.now() - createdAt) / 1000);
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        return {
          ok: false,
          message: `Please wait ${RESEND_COOLDOWN_SECONDS - secondsSinceLastSend} seconds before requesting a new code.`,
        };
      }
    }

    const code = createVerificationCode();
    const passwordHash = await bcrypt.hash(registrationData.password, BCRYPT_ROUNDS);
    const pendingPayload = {
      ...registrationData,
      passwordHash,
    };
    delete pendingPayload.password;

    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
    const delivery = await sendRegistrationEmail(registrationData.email, code);

    await client
      .from("registration_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("email", registrationData.email)
      .is("verified_at", null);

    const { error: insertError } = await client.from("registration_verifications").insert({
      email: registrationData.email,
      username: registrationData.username,
      payload: pendingPayload,
      code_hash: hashCode(registrationData.email, code),
      expires_at: expiresAt,
      resend_count: latestPending ? Number(latestPending.resend_count || 0) + 1 : 0,
    });

    if (insertError) throw insertError;

    return {
      ok: true,
      email: registrationData.email,
      expiresAt,
      mailDelivered: delivery.delivered,
      devCode: delivery.devCode,
      message: delivery.delivered
        ? "Verification code sent. Please check your email."
        : "Verification code generated. Configure SMTP to send it by email.",
    };
  } catch (error) {
    console.error("[Gymster auth] Failed to request registration code:", error);
    return {
      ok: false,
      message: getRegistrationRequestErrorMessage(error),
    };
  }
}

export async function verifyRegistrationCode(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const email = normalizeEmail(payload?.email);
  const code = String(payload?.code || "").trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return { ok: false, message: "Please enter the 6-digit verification code." };
  }

  try {
    const pending = await getLatestPendingRegistration(client, email);
    if (!pending) {
      return { ok: false, message: "Verification code was not found. Please request a new code." };
    }

    if (new Date(pending.expires_at).getTime() < Date.now()) {
      return { ok: false, message: "Verification code has expired. Please request a new code." };
    }

    if (Number(pending.attempt_count || 0) >= MAX_VERIFY_ATTEMPTS) {
      return { ok: false, message: "Too many incorrect attempts. Please request a new code." };
    }

    if (pending.code_hash !== hashCode(email, code)) {
      await client
        .from("registration_verifications")
        .update({ attempt_count: Number(pending.attempt_count || 0) + 1 })
        .eq("registration_verification_id", pending.registration_verification_id);

      return { ok: false, message: "Verification code is incorrect." };
    }

    const registrationData = sanitizeRegistrationPayload(pending.payload || {});
    registrationData.passwordHash = String(pending.payload?.passwordHash || "");
    delete registrationData.password;

    const validationError = validateStoredRegistrationPayload(registrationData);
    if (validationError) {
      return { ok: false, message: "Saved registration data is no longer valid. Please register again." };
    }

    const availability = await ensureAccountIdentifiersAvailable(client, registrationData.email, registrationData.username);
    if (!availability.ok) return availability;

    const user = await createVerifiedMemberAccount(client, registrationData);

    await client
      .from("registration_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("registration_verification_id", pending.registration_verification_id);

    return {
      ok: true,
      user,
      message: "Account verified and created successfully.",
    };
  } catch (error) {
    console.error("[Gymster auth] Failed to verify registration code:", error);
    return mapConstraintError(error, "Could not verify registration code.");
  }
}

function toFrontendRole(role) {
  const normalized = String(role || "").toLowerCase();
  return normalized === "trainer" ? "pt" : normalized;
}

function toFrontendAccountStatus(status) {
  const normalized = String(status || "active").toLowerCase();
  const statusMap = {
    pending_onboarding: "PendingOnboarding",
    pending_pt_approval: "PendingPTApproval",
    pending_payment: "PendingPayment",
    active: "Active",
    cancelled: "Cancelled",
    inactive: "Inactive",
    suspended: "Suspended",
  };

  return statusMap[normalized] || "Active";
}

function isLegacyPasswordMatch(storedPassword, password) {
  if (!storedPassword) return false;
  if (storedPassword === password) return true;
  if (storedPassword.startsWith("demo-only:")) {
    return storedPassword.slice("demo-only:".length) === password;
  }
  return false;
}

async function isPasswordMatch(storedPassword, password) {
  if (!storedPassword) return false;
  if (/^\$2[aby]\$/.test(storedPassword)) {
    return bcrypt.compare(password, storedPassword);
  }
  return isLegacyPasswordMatch(storedPassword, password);
}

async function findUserByIdentifier(client, identifier) {
  const rawIdentifier = String(identifier || "").trim();
  const column = getIdentifierLookupColumn(rawIdentifier);
  const lookupValue = column === "email" ? rawIdentifier.toLowerCase() : rawIdentifier;
  const { data: rows, error } = await client
    .from("users")
    .select(USER_SELECT)
    .ilike(column, lookupValue)
    .limit(1);

  if (error) throw error;
  return rows?.[0] || null;
}

async function findMemberIdByUserId(client, userId) {
  if (!userId) return null;

  const { data } = await client
    .from("members")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.member_id || null;
}

async function findTrainerIdByUserId(client, userId) {
  if (!userId) return null;

  const { data } = await client
    .from("trainers")
    .select("trainer_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data?.trainer_id || null;
}

async function mapUserForSession(client, user) {
  const frontendRole = toFrontendRole(user.role);
  const safeUser = {
    id: user.user_id,
    userId: user.user_id,
    user_id: user.user_id,
    username: user.username || "",
    email: user.email || "",
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "",
    phone: user.phone_number || "",
    phone_number: user.phone_number || "",
    dob: user.date_of_birth || "",
    date_of_birth: user.date_of_birth || "",
    gender: user.gender || "unspecified",
    avatarUrl: user.avatar_url || "",
    avatar_url: user.avatar_url || "",
    headline: user.headline || "",
    preferredLanguage: user.preferred_language || "en",
    preferred_language: user.preferred_language || "en",
    role: frontendRole,
    sourceRole: user.role,
    accountStatus: toFrontendAccountStatus(user.account_status),
    account_status: user.account_status || "active",
  };

  if (frontendRole === "member") {
    const memberId = await findMemberIdByUserId(client, user.user_id);
    if (memberId) {
      safeUser.memberId = memberId;
      safeUser.member_id = memberId;
    }
  }

  if (frontendRole === "pt") {
    const trainerId = await findTrainerIdByUserId(client, user.user_id);
    if (trainerId) {
      safeUser.trainerId = trainerId;
      safeUser.trainer_id = trainerId;
    }
  }

  return safeUser;
}

export async function loginWithPassword(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const identifier = String(payload?.identifier || "").trim();
  const password = String(payload?.password || "");

  if (!identifier || !password) {
    return { ok: false, message: "Username, email, and password are required." };
  }

  try {
    const user = await findUserByIdentifier(client, identifier);
    if (!user || !(await isPasswordMatch(user.password_hash, password))) {
      return { ok: false, message: "Username, email, or password is incorrect." };
    }

    await ensureSupabaseAuthIdentity(client, user, password);

    const safeUser = await mapUserForSession(client, user);
    return { ok: true, user: safeUser };
  } catch (error) {
    console.error("[Gymster auth] Failed to login user:", error);
    return { ok: false, message: "Unable to verify account credentials." };
  }
}

async function getLatestPendingPasswordReset(client, email) {
  const { data, error } = await client
    .from("password_reset_verifications")
    .select("*")
    .eq("email", email)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function sendPasswordResetEmail(email, code) {
  const transporter = getMailTransporter();
  if (!transporter) {
    console.info(`[Gymster auth] Password reset verification code for ${email}: ${code}`);
    return { delivered: false, devCode: code };
  }

  try {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: "Gymster Password Reset Verification Code",
      text: `Your Gymster password reset verification code is ${code}. This code expires in ${CODE_TTL_MINUTES} minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee;">
          <h2 style="color: #EF233C;">Gymster Password Reset</h2>
          <p>We received a request to reset your password. Use the following code to proceed:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #EF233C; margin: 20px 0;">${code}</p>
          <p>This code expires in ${CODE_TTL_MINUTES} minutes. If you did not make this request, you can ignore this email.</p>
        </div>
      `,
    });
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Gymster auth] SMTP send failed:", error);
    return { delivered: false, error: error.message };
  }
}

export async function requestPasswordResetCode(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const email = normalizeEmail(payload?.email);
  if (!isValidEmail(email)) {
    return { ok: false, message: "Vui lòng nhập địa chỉ email hợp lệ." };
  }

  try {
    // Check if user exists
    const { data: user, error: userError } = await client
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (userError) throw userError;
    if (!user) {
      return { ok: false, message: "Email không tồn tại trong hệ thống." };
    }

    const latestPending = await getLatestPendingPasswordReset(client, email);
    if (latestPending?.created_at) {
      const createdAt = new Date(latestPending.created_at).getTime();
      const secondsSinceLastSend = Math.floor((Date.now() - createdAt) / 1000);
      if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
        return {
          ok: false,
          message: `Vui lòng đợi ${RESEND_COOLDOWN_SECONDS - secondsSinceLastSend} giây trước khi yêu cầu mã mới.`,
        };
      }
    }

    const code = createVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();
    const delivery = await sendPasswordResetEmail(email, code);

    // Cancel any previous pending resets
    await client
      .from("password_reset_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("email", email)
      .is("verified_at", null);

    const { error: insertError } = await client.from("password_reset_verifications").insert({
      email,
      code_hash: hashCode(email, code),
      expires_at: expiresAt,
      resend_count: latestPending ? Number(latestPending.resend_count || 0) + 1 : 0,
    });

    if (insertError) throw insertError;

    return {
      ok: true,
      email,
      expiresAt,
      mailDelivered: delivery.delivered,
      devCode: delivery.devCode,
      message: delivery.delivered
        ? "Mã xác thực đã được gửi tới email của bạn."
        : "Đã tạo mã xác thực thành công (Hãy kiểm tra console log của server).",
    };
  } catch (error) {
    console.error("[Gymster auth] Failed to request password reset code:", error);
    return {
      ok: false,
      message: "Không thể yêu cầu mã xác thực. Vui lòng thử lại sau.",
    };
  }
}

export async function verifyPasswordResetCode(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const email = normalizeEmail(payload?.email);
  const code = String(payload?.code || "").trim();

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return { ok: false, message: "Vui lòng nhập mã xác thực gồm 6 chữ số." };
  }

  try {
    const pending = await getLatestPendingPasswordReset(client, email);
    if (!pending) {
      return { ok: false, message: "Mã xác thực không tìm thấy. Vui lòng yêu cầu mã mới." };
    }

    if (new Date(pending.expires_at).getTime() < Date.now()) {
      return { ok: false, message: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới." };
    }

    if (Number(pending.attempt_count || 0) >= MAX_VERIFY_ATTEMPTS) {
      return { ok: false, message: "Nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới." };
    }

    if (pending.code_hash !== hashCode(email, code)) {
      await client
        .from("password_reset_verifications")
        .update({ attempt_count: Number(pending.attempt_count || 0) + 1 })
        .eq("password_reset_verification_id", pending.password_reset_verification_id);

      return { ok: false, message: "Mã xác thực không chính xác." };
    }

    // Mark as verified
    const { error: updateError } = await client
      .from("password_reset_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("password_reset_verification_id", pending.password_reset_verification_id);

    if (updateError) throw updateError;

    return { ok: true, message: "Mã xác thực chính xác." };
  } catch (error) {
    console.error("[Gymster auth] Failed to verify password reset code:", error);
    return { ok: false, message: "Không thể xác thực mã code lúc này." };
  }
}

export async function resetPasswordWithCode(payload) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: "Backend Supabase service role is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.",
    };
  }

  const email = normalizeEmail(payload?.email);
  const code = String(payload?.code || "").trim();
  const newPassword = String(payload?.newPassword || "");

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return { ok: false, message: "Yêu cầu mã xác thực hợp lệ." };
  }

  if (newPassword.length < 6) {
    return { ok: false, message: "Mật khẩu mới phải từ 6 ký tự trở lên." };
  }

  try {
    // Find verified reset verification row within last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: verifiedReset, error: findError } = await client
      .from("password_reset_verifications")
      .select("*")
      .eq("email", email)
      .eq("code_hash", hashCode(email, code))
      .not("verified_at", "is", null)
      .gte("verified_at", fifteenMinutesAgo)
      .maybeSingle();

    if (findError) throw findError;
    if (!verifiedReset) {
      return { ok: false, message: "Yêu cầu đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại từ đầu." };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update user's password
    const { error: userUpdateError } = await client
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email);

    if (userUpdateError) throw userUpdateError;

    // Delete verification record so it cannot be reused
    await client
      .from("password_reset_verifications")
      .delete()
      .eq("password_reset_verification_id", verifiedReset.password_reset_verification_id);

    return { ok: true, message: "Cập nhật mật khẩu thành công. Vui lòng đăng nhập lại." };
  } catch (error) {
    console.error("[Gymster auth] Failed to reset password:", error);
    return { ok: false, message: "Không thể cập nhật mật khẩu mới lúc này." };
  }
}

