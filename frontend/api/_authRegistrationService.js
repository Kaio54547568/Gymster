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
  const requiredFields = ["firstName", "lastName", "username", "email", "password", "phone", "dob", "gender"];
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

function validateStoredRegistrationPayload(payload) {
  const requiredFields = ["firstName", "lastName", "username", "email", "passwordHash", "phone", "dob", "gender"];
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
  };
}

async function ensureAccountIdentifiersAvailable(client, email, username) {
  const { data: emailRows, error: emailError } = await client
    .from("users")
    .select("user_id")
    .ilike("email", email)
    .limit(1);

  if (emailError) throw emailError;
  if (emailRows?.length) {
    return { ok: false, message: "Email already exists." };
  }

  const { data: usernameRows, error: usernameError } = await client
    .from("users")
    .select("user_id")
    .ilike("username", username)
    .limit(1);

  if (usernameError) throw usernameError;
  if (usernameRows?.length) {
    return { ok: false, message: "Username already exists." };
  }

  return { ok: true };
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
  const fullName = [userRow.first_name, userRow.last_name].filter(Boolean).join(" ").trim();

  return {
    id: userRow.user_id,
    userId: userRow.user_id,
    user_id: userRow.user_id,
    memberId: memberRow?.member_id || null,
    member_id: memberRow?.member_id || null,
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
    role: "member",
    accountStatus: "PendingOnboarding",
    account_status: userRow.account_status || "pending_onboarding",
  };
}

async function insertMemberProfile(client, userRow, registrationData) {
  const fullName = [registrationData.firstName, registrationData.lastName].filter(Boolean).join(" ").trim();
  const targetInsert = await client
    .from("members")
    .insert({
      user_id: userRow.user_id,
      full_name: fullName,
      phone_number: registrationData.phone,
      date_of_birth: registrationData.dob,
      gender: registrationData.gender,
      status: "pending",
    })
    .select("*")
    .single();

  if (!targetInsert.error) return targetInsert;

  return client
    .from("members")
    .insert({
      user_id: userRow.user_id,
      status: "pending_onboarding",
    })
    .select("*")
    .single();
}

async function createVerifiedMemberAccount(client, registrationData) {
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
      account_status: "pending_onboarding",
    })
    .select("*")
    .single();

  if (userError) throw userError;

  const { data: memberRow, error: memberError } = await insertMemberProfile(client, userRow, registrationData);

  if (memberError) {
    await client.from("users").delete().eq("user_id", userRow.user_id);
    throw memberError;
  }

  return mapCreatedAccount(userRow, memberRow);
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
    const availability = await ensureAccountIdentifiersAvailable(client, registrationData.email, registrationData.username);
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
    return {
      ok: false,
      message: error.code === "23505" ? "Username or email already exists." : "Could not verify registration code.",
    };
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
  const normalizedIdentifier = rawIdentifier.toLowerCase();

  const { data: emailRows, error: emailError } = await client
    .from("users")
    .select(USER_SELECT)
    .ilike("email", normalizedIdentifier)
    .limit(1);

  if (emailError) throw emailError;
  if (emailRows?.[0]) return emailRows[0];

  const { data: usernameRows, error: usernameError } = await client
    .from("users")
    .select(USER_SELECT)
    .ilike("username", rawIdentifier)
    .limit(1);

  if (usernameError) throw usernameError;
  return usernameRows?.[0] || null;
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

    const safeUser = await mapUserForSession(client, user);
    return { ok: true, user: safeUser };
  } catch (error) {
    console.error("[Gymster auth] Failed to login user:", error);
    return { ok: false, message: "Unable to verify account credentials." };
  }
}
