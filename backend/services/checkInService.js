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
  const memberPackageIds = [...new Set(rows.map((row) => row.member_package_id).filter(Boolean))];
  const packageIds = [...new Set(rows.map((row) => row.package_id).filter(Boolean))];
  if (!memberIds.length) return { members: {}, users: {}, packages: {} };
  const [{ data: members, error: memberError }, { data: memberPackages, error: memberPackageError }] = await Promise.all([
    client.from("members").select("member_id,user_id,member_code,full_name,phone_number").in("member_id", memberIds),
    memberPackageIds.length
      ? client.from("member_packages").select("member_package_id,package_id,end_date").in("member_package_id", memberPackageIds)
      : { data: [], error: null },
  ]);
  if (memberError) throw memberError;
  if (memberPackageError) throw memberPackageError;
  const allPackageIds = [...new Set([
    ...packageIds,
    ...(memberPackages || []).map((row) => row.package_id).filter(Boolean),
  ])];
  const { data: packages, error: packageError } = allPackageIds.length
    ? await client.from("packages").select("package_id,package_name").in("package_id", allPackageIds)
    : { data: [], error: null };
  if (packageError) throw packageError;
  const userIds = (members || []).map((row) => row.user_id).filter(Boolean);
  const { data: users, error: userError } = userIds.length
    ? await client.from("users").select("user_id,first_name,last_name,phone_number").in("user_id", userIds)
    : { data: [], error: null };
  if (userError) throw userError;
  return {
    members: Object.fromEntries((members || []).map((row) => [row.member_id, row])),
    memberPackages: Object.fromEntries((memberPackages || []).map((row) => [row.member_package_id, row])),
    users: Object.fromEntries((users || []).map((row) => [row.user_id, row])),
    packages: Object.fromEntries((packages || []).map((row) => [row.package_id, row])),
  };
}

export function isCheckInEligibleWorkoutStatus(status) {
  return !["cancelled", "canceled"].includes(String(status || "").trim().toLowerCase());
}

export async function listStaffCheckIns(client, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) {
    return { ok: false, status: 400, message: "A valid date is required." };
  }
  const { data: sessionRows, error: sessionError } = await client
    .from("workout_sessions")
    .select("workout_session_id,member_id,trainer_id,member_package_id,package_id,session_date,start_time,end_time,status,title,session_title,exercise_type")
    .eq("session_date", date)
    .order("start_time", { ascending: true });
  if (sessionError) throw sessionError;

  const eligibleRows = (sessionRows || []).filter((row) => isCheckInEligibleWorkoutStatus(row.status));
  const { members, memberPackages, users, packages } = await mapsFor(client, eligibleRows);
  let checkInResult = await client
    .from("member_usage_history")
    .select("member_usage_history_id,member_id,member_package_id,workout_session_id,usage_date,check_in_date")
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
  const checkedBySession = Object.fromEntries((checkIns || []).filter((row) => row.workout_session_id).map((row) => [row.workout_session_id, row]));
  const checkedByMember = Object.fromEntries((checkIns || []).map((row) => [row.member_id, row]));

  return {
    ok: true,
    data: eligibleRows.map((row) => {
      const member = members[row.member_id] || {};
      const memberPackage = memberPackages[row.member_package_id] || {};
      const user = users[member.user_id] || {};
      const checked = checkedBySession[row.workout_session_id] || checkedByMember[row.member_id] || null;
      const packageId = row.package_id || memberPackage.package_id;
      const title = row.session_title || row.title || row.exercise_type || "Workout session";
      return {
        workoutSessionId: row.workout_session_id,
        memberUuid: row.member_id,
        memberId: member.member_code || row.member_id,
        fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || member.full_name || "Member",
        phoneNum: user.phone_number || member.phone_number || "",
        currentPackage: packages[packageId]?.package_name || "Package",
        expirationDate: memberPackage.end_date || "",
        memberPackageId: row.member_package_id,
        sessionTitle: title,
        sessionTime: [String(row.start_time || "").slice(0, 5), String(row.end_time || "").slice(0, 5)].filter(Boolean).join(" - "),
        checkedIn: Boolean(checked),
        checkedInAt: checked?.usage_date || null,
      };
    }),
  };
}

async function findEligibleWorkoutSession(client, memberId, date, workoutSessionId = "") {
  let query = client
    .from("workout_sessions")
    .select("workout_session_id,member_id,member_package_id,session_date,status")
    .eq("member_id", memberId)
    .eq("session_date", date);
  if (workoutSessionId) query = query.eq("workout_session_id", workoutSessionId);
  const { data, error } = await query.order("start_time", { ascending: true }).limit(1);
  if (error) throw error;
  return (data || []).find((row) => isCheckInEligibleWorkoutStatus(row.status)) || null;
}

export async function checkInMember(client, employee, memberId, date, now = new Date(), workoutSessionId = "") {
  if (!isTodayInGymTimezone(date, now)) {
    return { ok: false, status: 400, code: "CHECK_IN_TODAY_ONLY", message: "Check-in is only allowed for today." };
  }
  const workoutSession = await findEligibleWorkoutSession(client, memberId, date, workoutSessionId);
  if (!workoutSession) {
    return { ok: false, status: 409, code: "NO_BOOKED_SESSION", message: "Member does not have a booked workout session for this day." };
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
    member_package_id: workoutSession.member_package_id,
    workout_session_id: workoutSession.workout_session_id,
    usage_type: "check_in",
    usage_date: now.toISOString(),
    check_in_date: date,
    checked_in_by_employee_id: employee?.employee_id || null,
    description: "Staff check-in at the gym.",
  };
  let insertResult = await client.from("member_usage_history").insert(insertPayload).select("member_usage_history_id,usage_date,check_in_date,workout_session_id").single();
  if (missingCheckInColumns(insertResult.error)) {
    delete insertPayload.check_in_date;
    delete insertPayload.checked_in_by_employee_id;
    insertResult = await client.from("member_usage_history").insert(insertPayload).select("member_usage_history_id,usage_date,workout_session_id").single();
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
    .select("member_usage_history_id,member_package_id,workout_session_id,usage_date,check_in_date,description")
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
      workoutSessionId: row.workout_session_id || "",
      date: row.check_in_date || gymDate(new Date(row.usage_date)),
      checkedInAt: row.usage_date,
      description: row.description || "",
    })),
  };
}
