const GYM_TIMEZONE = "Asia/Ho_Chi_Minh";

export function gymDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isTodayInGymTimezone(value, now = new Date()) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && value === gymDate(now);
}

function dayBounds(date) {
  const start = new Date(`${date}T00:00:00+07:00`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function missingCheckInColumns(error) {
  return error?.code === "42703" || /check_in_date|checked_in_by_employee_id/i.test(String(error?.message || ""));
}

async function mapsFor(client, rows) {
  const memberIds = [...new Set(rows.map((row) => row.member_id))];
  const packageIds = [...new Set(rows.map((row) => row.package_id))];
  if (!memberIds.length) return { members: {}, users: {}, packages: {} };
  const [{ data: members, error: memberError }, { data: packages, error: packageError }] = await Promise.all([
    client.from("members").select("member_id,user_id,member_code,full_name,phone_number").in("member_id", memberIds),
    client.from("packages").select("package_id,package_name").in("package_id", packageIds),
  ]);
  if (memberError) throw memberError;
  if (packageError) throw packageError;
  const userIds = (members || []).map((row) => row.user_id).filter(Boolean);
  const { data: users, error: userError } = userIds.length
    ? await client.from("users").select("user_id,first_name,last_name,phone_number").in("user_id", userIds)
    : { data: [], error: null };
  if (userError) throw userError;
  return {
    members: Object.fromEntries((members || []).map((row) => [row.member_id, row])),
    users: Object.fromEntries((users || []).map((row) => [row.user_id, row])),
    packages: Object.fromEntries((packages || []).map((row) => [row.package_id, row])),
  };
}

export async function listStaffCheckIns(client, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return { ok: false, status: 400, message: "A valid date is required." };
  }
  const { data: packageRows, error: packageError } = await client
    .from("member_packages")
    .select("member_package_id,member_id,package_id,start_date,end_date,status")
    .eq("status", "active")
    .lte("start_date", date)
    .gte("end_date", date)
    .order("created_at", { ascending: false });
  if (packageError) throw packageError;

  const activeByMember = new Map();
  for (const row of packageRows || []) {
    if (!activeByMember.has(row.member_id)) activeByMember.set(row.member_id, row);
  }
  const activeRows = [...activeByMember.values()];
  const { members, users, packages } = await mapsFor(client, activeRows);
  let checkInResult = await client
    .from("member_usage_history")
    .select("member_usage_history_id,member_id,member_package_id,usage_date,check_in_date")
    .eq("usage_type", "check_in")
    .eq("check_in_date", date);
  if (missingCheckInColumns(checkInResult.error)) {
    const bounds = dayBounds(date);
    checkInResult = await client
      .from("member_usage_history")
      .select("member_usage_history_id,member_id,member_package_id,usage_date")
      .eq("usage_type", "check_in")
      .gte("usage_date", bounds.start)
      .lt("usage_date", bounds.end);
  }
  if (checkInResult.error) throw checkInResult.error;
  const checkIns = checkInResult.data;
  const checkedByMember = Object.fromEntries((checkIns || []).map((row) => [row.member_id, row]));

  return {
    ok: true,
    data: activeRows.map((row) => {
      const member = members[row.member_id] || {};
      const user = users[member.user_id] || {};
      const checked = checkedByMember[row.member_id] || null;
      return {
        memberUuid: row.member_id,
        memberId: member.member_code || row.member_id,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || member.full_name || "Member",
        phoneNum: user.phone_number || member.phone_number || "",
        currentPackage: packages[row.package_id]?.package_name || "Package",
        expirationDate: row.end_date,
        memberPackageId: row.member_package_id,
        checkedIn: Boolean(checked),
        checkedInAt: checked?.usage_date || null,
      };
    }),
  };
}

export async function checkInMember(client, employee, memberId, date, now = new Date()) {
  if (!isTodayInGymTimezone(date, now)) {
    return { ok: false, status: 400, code: "CHECK_IN_TODAY_ONLY", message: "Check-in is only allowed for today." };
  }
  const { data: memberPackage, error } = await client
    .from("member_packages")
    .select("member_package_id,member_id,package_id,status,start_date,end_date")
    .eq("member_id", memberId)
    .eq("status", "active")
    .lte("start_date", date)
    .gte("end_date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!memberPackage) {
    return { ok: false, status: 409, code: "NO_ACTIVE_PACKAGE", message: "Member does not have an active package." };
  }
  const bounds = dayBounds(date);
  const { data: existing, error: existingError } = await client
    .from("member_usage_history")
    .select("member_usage_history_id")
    .eq("member_id", memberId)
    .eq("usage_type", "check_in")
    .gte("usage_date", bounds.start)
    .lt("usage_date", bounds.end)
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.length) {
    return { ok: true, alreadyChecked: true, code: "ALREADY_CHECKED_IN", message: "Member is already checked in today." };
  }

  const insertPayload = {
    member_id: memberId,
    member_package_id: memberPackage.member_package_id,
    usage_type: "check_in",
    usage_date: now.toISOString(),
    check_in_date: date,
    checked_in_by_employee_id: employee?.employee_id || null,
    description: "Staff check-in at the gym.",
  };
  let insertResult = await client.from("member_usage_history").insert(insertPayload).select("member_usage_history_id,usage_date,check_in_date").single();
  if (missingCheckInColumns(insertResult.error)) {
    delete insertPayload.check_in_date;
    delete insertPayload.checked_in_by_employee_id;
    insertResult = await client.from("member_usage_history").insert(insertPayload).select("member_usage_history_id,usage_date").single();
  }
  const { data, error: insertError } = insertResult;
  if (insertError?.code === "23505") {
    return { ok: true, alreadyChecked: true, code: "ALREADY_CHECKED_IN", message: "Member is already checked in today." };
  }
  if (insertError) throw insertError;
  return { ok: true, data, code: "CHECK_IN_SUCCESS", message: "Check-in completed." };
}

export async function getMemberCheckInHistory(client, userId) {
  const { data: member, error: memberError } = await client
    .from("members")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member) return { ok: false, status: 404, message: "Member profile was not found." };
  let historyResult = await client
    .from("member_usage_history")
    .select("member_usage_history_id,member_package_id,usage_date,check_in_date,description")
    .eq("member_id", member.member_id)
    .eq("usage_type", "check_in")
    .order("usage_date", { ascending: false });
  if (missingCheckInColumns(historyResult.error)) {
    historyResult = await client
      .from("member_usage_history")
      .select("member_usage_history_id,member_package_id,usage_date,description")
      .eq("member_id", member.member_id)
      .eq("usage_type", "check_in")
      .order("usage_date", { ascending: false });
  }
  if (historyResult.error) throw historyResult.error;
  const data = historyResult.data;
  return {
    ok: true,
    data: (data || []).map((row) => ({
      id: row.member_usage_history_id,
      date: row.check_in_date || gymDate(new Date(row.usage_date)),
      checkedInAt: row.usage_date,
      description: row.description || "",
    })),
  };
}
