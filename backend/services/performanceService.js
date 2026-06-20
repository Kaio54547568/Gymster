export function calculateComponentScore({ count, baseTarget, periodDays }) {
  const target = Number(((Number(baseTarget) * Number(periodDays)) / 30).toFixed(2));
  const score = target > 0 ? Math.min((Number(count) / target) * 100, 100) : 0;
  return {
    target,
    score: Number(score.toFixed(2)),
  };
}

export function calculateFinalScore({ reviewType, feedbackScore = 0, activityScore, adminScore }) {
  void reviewType;
  void feedbackScore;
  const score = Number(activityScore) * 0.6 + Number(adminScore) * 0.4;
  return Number(score.toFixed(2));
}

export function calculateTrainerObjectiveScore({ operationalScore, averageRating, reviewCount }) {
  const confidence = Math.min(Math.max(Number(reviewCount) / 5, 0), 1);
  const feedbackScore = Number((Math.min(Math.max(Number(averageRating) * 20, 0), 100) * confidence).toFixed(2));
  const objectiveScore = Number((Number(operationalScore) * 0.7 + feedbackScore * 0.3).toFixed(2));
  return {
    feedbackScore,
    confidence: Number(confidence.toFixed(2)),
    objectiveScore,
  };
}

export function getPerformanceRank(score) {
  if (Number(score) >= 85) return "Excellent";
  if (Number(score) >= 70) return "Good";
  if (Number(score) >= 50) return "Average";
  return "Poor";
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function validateReviewInput(payload = {}) {
  const start = parseDate(payload.periodStart);
  const end = parseDate(payload.periodEnd);
  if (!start || !end) return { ok: false, status: 400, message: "A valid review period is required." };
  if (end < start) return { ok: false, status: 400, message: "periodEnd must be on or after periodStart." };
  const adminScore = Number(payload.adminScore);
  if (!Number.isFinite(adminScore) || adminScore < 0 || adminScore > 100) {
    return { ok: false, status: 400, message: "adminScore must be between 0 and 100." };
  }
  return { ok: true, start, end, adminScore };
}

export function validatePeriod(periodStart, periodEnd) {
  const start = parseDate(periodStart);
  const end = parseDate(periodEnd);
  if (!start || !end) return { ok: false, status: 400, message: "A valid review period is required." };
  if (end < start) return { ok: false, status: 400, message: "periodEnd must be on or after periodStart." };
  return { ok: true };
}

function periodWindow(periodStart, periodEnd) {
  const start = parseDate(periodStart);
  const endInclusive = parseDate(periodEnd);
  const endExclusive = new Date(endInclusive);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const periodDays = Math.round((endExclusive.getTime() - start.getTime()) / 86400000);
  return {
    startInclusive: start.toISOString(),
    endExclusive: endExclusive.toISOString(),
    startDate: periodStart,
    endExclusiveDate: endExclusive.toISOString().slice(0, 10),
    periodDays,
  };
}

function inPeriod(query, column, window) {
  return query.gte(column, window.startInclusive).lt(column, window.endExclusive);
}

function weightedActivity(components) {
  return Number(components.reduce((sum, item) => sum + item.score * item.weight, 0).toFixed(2));
}

function component(key, label, count, baseTarget, weight, periodDays, source) {
  const result = calculateComponentScore({ count, baseTarget, periodDays });
  return { key, label, count, baseTarget, target: result.target, weight, score: result.score, source };
}

async function getEmployeeContext(client, employeeId) {
  const { data: employee, error } = await client
    .from("employees")
    .select("employee_id,employee_code,user_id,full_name,email,role,status")
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error) throw error;
  if (!employee || !["staff", "trainer"].includes(employee.role)) return null;

  let trainer = null;
  if (employee.role === "trainer") {
    const result = await client
      .from("trainers")
      .select("trainer_id,employee_id,user_id,full_name,rating,status")
      .eq("employee_id", employee.employee_id)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    trainer = result.data;
  }
  return { employee, trainer, reviewType: employee.role === "trainer" ? "trainer" : "staff" };
}

async function countRows(query) {
  const { count, error } = await query;
  if (error) throw error;
  return Number(count || 0);
}

async function aggregateStaff(client, context, window) {
  const employeeId = context.employee.employee_id;
  const userId = context.employee.user_id;
  const [
    feedbackCount,
    complaintCount,
    paymentHandledCount,
    paidConfirmedCount,
    invoiceCount,
    maintenanceCreatedCount,
    maintenanceHandledCount,
    maintenanceResolvedCount,
  ] = await Promise.all([
    countRows(inPeriod(client.from("service_feedback").select("feedback_id", { count: "exact", head: true }).eq("responded_by_employee_id", employeeId), "responded_at", window)),
    countRows(inPeriod(client.from("complaints").select("complaint_id", { count: "exact", head: true }).eq("resolved_by_employee_id", employeeId), "resolved_at", window)),
    countRows(inPeriod(client.from("payments").select("payment_id", { count: "exact", head: true }).eq("reviewed_by_employee_id", employeeId), "reviewed_at", window)),
    countRows(inPeriod(client.from("payments").select("payment_id", { count: "exact", head: true }).eq("reviewed_by_employee_id", employeeId).eq("payment_status", "paid"), "reviewed_at", window)),
    countRows(inPeriod(client.from("invoices").select("invoice_id", { count: "exact", head: true }).eq("employee_id", employeeId), "issued_at", window)),
    userId
      ? countRows(inPeriod(client.from("maintenance_reports").select("maintenance_report_id", { count: "exact", head: true }).eq("reported_by_user_id", userId), "created_at", window))
      : 0,
    countRows(inPeriod(client.from("maintenance_records").select("maintenance_record_id", { count: "exact", head: true }).eq("handled_by_employee_id", employeeId), "completed_at", window)),
    countRows(inPeriod(client.from("maintenance_reports").select("maintenance_report_id", { count: "exact", head: true }).eq("resolved_by_employee_id", employeeId), "resolved_at", window)),
  ]);

  const feedbackHandled = feedbackCount + complaintCount;
  const paymentConfirmed = paidConfirmedCount + invoiceCount;
  const maintenanceCount = maintenanceCreatedCount + maintenanceHandledCount + maintenanceResolvedCount;
  const components = [
    component("feedback_reports", "Feedback/report handled", feedbackHandled, 20, 0.3, window.periodDays, ["service_feedback", "complaints"]),
    component("payment_requests", "Payment requests handled", paymentHandledCount, 30, 0.3, window.periodDays, ["payments"]),
    component("payment_invoices", "Payments/invoices confirmed", paymentConfirmed, 30, 0.2, window.periodDays, ["payments", "invoices"]),
    component("maintenance", "Maintenance created/handled", maintenanceCount, 10, 0.2, window.periodDays, ["maintenance_reports", "maintenance_records"]),
  ];
  return {
    activityCount: feedbackHandled + paymentHandledCount + paymentConfirmed + maintenanceCount,
    feedbackHandled,
    activityScore: weightedActivity(components),
    activityBreakdown: { periodDays: window.periodDays, components },
    feedbackScore: 0,
    feedbackBreakdown: null,
  };
}

async function aggregateTrainer(client, context, window) {
  const trainerId = context.trainer.trainer_id;
  const [activeStudents, completedSessions, handledRequests, feedbackResult] = await Promise.all([
    countRows(client.from("trainer_assignments").select("trainer_assignment_id", { count: "exact", head: true }).eq("trainer_id", trainerId).eq("status", "active")),
    countRows(client.from("workout_sessions").select("workout_session_id", { count: "exact", head: true }).eq("trainer_id", trainerId).eq("status", "completed").gte("session_date", window.startDate).lt("session_date", window.endExclusiveDate)),
    countRows(inPeriod(client.from("training_requests").select("training_request_id", { count: "exact", head: true }).eq("trainer_id", trainerId).in("status", ["approved", "declined", "completed"]), "updated_at", window)),
    inPeriod(client.from("service_feedback").select("rating").eq("trainer_id", trainerId).eq("target_type", "trainer"), "created_at", window),
  ]);
  if (feedbackResult.error) throw feedbackResult.error;
  const ratings = (feedbackResult.data || []).map((row) => Number(row.rating)).filter(Number.isFinite);
  const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  const components = [
    component("active_students", "Active students", activeStudents, 10, 0.3, window.periodDays, ["trainer_assignments"]),
    component("completed_sessions", "Completed sessions", completedSessions, 40, 0.5, window.periodDays, ["workout_sessions"]),
    component("training_requests", "Training requests handled", handledRequests, 10, 0.2, window.periodDays, ["training_requests"]),
  ];
  const operationalScore = weightedActivity(components);
  const normalized = calculateTrainerObjectiveScore({
    operationalScore,
    averageRating,
    reviewCount: ratings.length,
  });
  return {
    activityCount: activeStudents + completedSessions + handledRequests,
    feedbackHandled: ratings.length,
    averageRating: Number(averageRating.toFixed(2)),
    activityScore: normalized.objectiveScore,
    activityBreakdown: {
      formulaVersion: "normalized-v2",
      periodDays: window.periodDays,
      operationalScore,
      operationalWeight: 0.7,
      feedbackWeight: 0.3,
      components,
    },
    feedbackScore: normalized.feedbackScore,
    feedbackBreakdown: {
      status: ratings.length ? "available" : "no_feedback",
      reviewCount: ratings.length,
      averageRating: Number(averageRating.toFixed(2)),
      rawRatingScore: Number((averageRating * 20).toFixed(2)),
      confidence: normalized.confidence,
      minimumReviewsForFullWeight: 5,
      score: normalized.feedbackScore,
      source: "service_feedback",
    },
  };
}

async function latestReview(client, employeeId, periodStart, periodEnd) {
  const { data, error } = await client
    .from("performance_reviews")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

function presentPerformance(context, metrics, review) {
  const savedComponents = review?.activity_breakdown?.components || [];
  const savedActivityCount = savedComponents.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const savedFeedbackHandled = context.reviewType === "trainer"
    ? Number(review?.feedback_breakdown?.reviewCount || 0)
    : Number(savedComponents.find((item) => item.key === "feedback_reports")?.count || 0);
  const effectiveMetrics = review ? {
    ...metrics,
    activityCount: savedActivityCount,
    feedbackHandled: savedFeedbackHandled,
    averageRating: Number(review.feedback_breakdown?.averageRating || 0),
    activityScore: Number(review.activity_score || 0),
    activityBreakdown: review.activity_breakdown || {},
    feedbackScore: Number(review.feedback_score || 0),
    feedbackBreakdown: review.feedback_breakdown || null,
  } : metrics;
  const adminScore = Number(review?.admin_score || 0);
  const finalScore = review
    ? Number(review.final_score || 0)
    : calculateFinalScore({
      reviewType: context.reviewType,
      feedbackScore: effectiveMetrics.feedbackScore,
      activityScore: effectiveMetrics.activityScore,
      adminScore,
    });
  return {
    employeeId: context.employee.employee_id,
    employeeCode: context.employee.employee_code,
    employeeName: context.employee.full_name,
    role: context.reviewType,
    ...effectiveMetrics,
    adminScore,
    finalScore,
    rank: getPerformanceRank(finalScore),
    review: review ? {
      id: review.performance_review_id,
      comment: review.comment || "",
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    } : null,
  };
}

export async function getEmployeePerformance(client, employeeId, filters) {
  const periodValidation = validatePeriod(filters.periodStart, filters.periodEnd);
  if (!periodValidation.ok) return periodValidation;
  const context = await getEmployeeContext(client, employeeId);
  if (!context) return { ok: false, status: 404, message: "Staff or trainer was not found." };
  const window = periodWindow(filters.periodStart, filters.periodEnd);
  const review = await latestReview(client, employeeId, filters.periodStart, filters.periodEnd);
  const metrics = review
    ? {
      activityCount: 0,
      feedbackHandled: 0,
      averageRating: 0,
      activityScore: Number(review.activity_score || 0),
      activityBreakdown: review.activity_breakdown || {},
      feedbackScore: Number(review.feedback_score || 0),
      feedbackBreakdown: review.feedback_breakdown || null,
    }
    : context.reviewType === "trainer"
      ? await aggregateTrainer(client, context, window)
      : await aggregateStaff(client, context, window);
  const { data: history, error } = await client
    .from("performance_reviews")
    .select("*")
    .eq("employee_id", employeeId)
    .order("period_end", { ascending: false })
    .limit(20);
  if (error) throw error;
  return { ok: true, data: { ...presentPerformance(context, metrics, review), history: history || [] } };
}

export async function listPerformance(client, filters) {
  const periodValidation = validatePeriod(filters.periodStart, filters.periodEnd);
  if (!periodValidation.ok) return periodValidation;
  let query = client
    .from("employees")
    .select("employee_id")
    .in("role", filters.role === "staff" ? ["staff"] : filters.role === "trainer" ? ["trainer"] : ["staff", "trainer"])
    .order("full_name", { ascending: true });
  if (filters.search) query = query.ilike("full_name", `%${filters.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  const rows = await Promise.all((data || []).map(async ({ employee_id: employeeId }) => {
    const result = await getEmployeePerformance(client, employeeId, filters);
    return result.ok ? result.data : null;
  }));
  return { ok: true, data: rows.filter(Boolean) };
}

export async function createPerformanceReview(client, creatorUserId, payload) {
  const validation = validateReviewInput(payload);
  if (!validation.ok) return validation;
  const result = await getEmployeePerformance(client, payload.employeeId, payload);
  if (!result.ok) return result;
  if (result.data.review) return { ok: false, status: 409, message: "A review already exists for this employee and period." };

  const reviewType = result.data.role;
  const finalScore = calculateFinalScore({
    reviewType,
    feedbackScore: result.data.feedbackScore,
    activityScore: result.data.activityScore,
    adminScore: validation.adminScore,
  });
  const values = {
    employee_id: payload.employeeId,
    review_type: reviewType,
    period_start: payload.periodStart,
    period_end: payload.periodEnd,
    review_period: `${payload.periodStart} - ${payload.periodEnd}`,
    feedback_score: result.data.feedbackScore,
    activity_score: result.data.activityScore,
    admin_score: validation.adminScore,
    final_score: finalScore,
    score: finalScore,
    activity_breakdown: result.data.activityBreakdown,
    feedback_breakdown: result.data.feedbackBreakdown,
    comment: String(payload.comment || "").trim(),
    created_by: creatorUserId,
    reviewer_user_id: creatorUserId,
    status: "submitted",
    reviewed_at: new Date().toISOString(),
  };
  const { data, error } = await client.from("performance_reviews").insert(values).select("*").single();
  if (error?.code === "23505") return { ok: false, status: 409, message: "A review already exists for this employee and period." };
  if (error) throw error;
  return { ok: true, data: { ...data, rank: getPerformanceRank(finalScore) } };
}

export async function updatePerformanceReview(client, id, payload) {
  const adminScore = Number(payload.adminScore);
  if (!Number.isFinite(adminScore) || adminScore < 0 || adminScore > 100) {
    return { ok: false, status: 400, message: "adminScore must be between 0 and 100." };
  }
  const { data: existing, error: readError } = await client
    .from("performance_reviews")
    .select("*")
    .eq("performance_review_id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) return { ok: false, status: 404, message: "Performance review was not found." };
  const finalScore = calculateFinalScore({
    reviewType: existing.review_type,
    feedbackScore: existing.feedback_score,
    activityScore: existing.activity_score,
    adminScore,
  });
  const { data, error } = await client
    .from("performance_reviews")
    .update({
      admin_score: adminScore,
      final_score: finalScore,
      score: finalScore,
      comment: String(payload.comment ?? existing.comment ?? "").trim(),
    })
    .eq("performance_review_id", id)
    .select("*")
    .single();
  if (error) throw error;
  return { ok: true, data: { ...data, rank: getPerformanceRank(finalScore) } };
}
