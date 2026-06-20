function money(value) {
  return Number(Number(value || 0).toFixed(2));
}

export function buildPriceSnapshot({
  packageId,
  packageName,
  originalPrice,
  unitPrice = null,
  purchasedSessions = null,
  promotion = null,
  appliedAt = new Date().toISOString(),
}) {
  const normalizedOriginalPrice = money(originalPrice);
  const discountPercent = promotion ? Number(promotion.discountPercent || 0) : 0;
  const discountAmount = money(normalizedOriginalPrice * discountPercent / 100);
  const finalAmount = money(normalizedOriginalPrice - discountAmount);
  return {
    packageId,
    packageNameSnapshot: packageName,
    promotionId: promotion?.id || null,
    promotionTitleSnapshot: promotion?.title || null,
    originalPrice: normalizedOriginalPrice,
    unitPrice: unitPrice !== null ? money(unitPrice) : null,
    purchasedSessions: purchasedSessions !== null ? Number(purchasedSessions) : null,
    discountPercent,
    discountAmount,
    finalAmount,
    amount: finalAmount,
    appliedAt,
  };
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export function validatePromotionInput(payload = {}) {
  const discountPercent = Number(payload.discountPercent);
  if (!String(payload.packageId || "").trim()) return { ok: false, status: 400, message: "packageId is required." };
  if (!String(payload.title || "").trim()) return { ok: false, status: 400, message: "Promotion title is required." };
  if (!(discountPercent > 0 && discountPercent <= 100)) {
    return { ok: false, status: 400, message: "discountPercent must be greater than 0 and at most 100." };
  }
  if (!validDate(payload.startDate) || !validDate(payload.endDate)) {
    return { ok: false, status: 400, message: "Valid startDate and endDate are required." };
  }
  if (payload.endDate < payload.startDate) {
    return { ok: false, status: 400, message: "endDate must be on or after startDate." };
  }
  return { ok: true, discountPercent };
}

function mapPromotion(row) {
  if (!row) return null;
  return {
    id: row.promotion_id,
    packageId: row.package_id,
    title: row.title,
    description: row.description || "",
    discountPercent: Number(row.discount_percent || 0),
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export async function getActivePromotion(client, packageId, appliedAt = new Date()) {
  const date = appliedAt.toISOString().slice(0, 10);
  const { data, error } = await client
    .from("package_promotions")
    .select("*")
    .eq("package_id", packageId)
    .eq("status", "active")
    .lte("start_date", date)
    .gte("end_date", date)
    .maybeSingle();
  if (error) throw error;
  return mapPromotion(data);
}

export async function getPackagePriceSnapshot(client, packageId, purchasedSessions = 1, appliedAt = new Date()) {
  const { data: pkg, error } = await client
    .from("packages")
    .select("package_id,package_name,package_type,price,status,is_active,min_purchase_sessions,max_purchase_sessions")
    .eq("package_id", packageId)
    .maybeSingle();
  if (error) throw error;
  if (!pkg || pkg.status === "inactive" || pkg.is_active === false) {
    return { ok: false, status: 404, message: "An available package is required." };
  }
  
  let sessions = null;
  let unitPrice = null;
  let basePrice = pkg.price;
  
  if (pkg.package_type === "session_based") {
    sessions = Math.floor(Number(purchasedSessions) || 1);
    if (sessions < 1) return { ok: false, status: 400, message: "purchasedSessions must be at least 1." };
    if (sessions > 30) return { ok: false, status: 400, message: "purchasedSessions cannot exceed 30." };
    if (pkg.min_purchase_sessions && sessions < pkg.min_purchase_sessions) {
      return { ok: false, status: 400, message: `Minimum purchase is ${pkg.min_purchase_sessions} sessions.` };
    }
    if (pkg.max_purchase_sessions && sessions > pkg.max_purchase_sessions) {
      return { ok: false, status: 400, message: `Maximum purchase is ${pkg.max_purchase_sessions} sessions.` };
    }
    unitPrice = pkg.price;
    basePrice = money(pkg.price * sessions);
  } else if (purchasedSessions !== undefined && purchasedSessions !== null && purchasedSessions !== 1) {
    return { ok: false, status: 400, message: "Quantity is only applicable for session-based packages." };
  }

  const promotion = await getActivePromotion(client, packageId, appliedAt);
  return {
    ok: true,
    package: pkg,
    promotion,
    snapshot: buildPriceSnapshot({
      packageId: pkg.package_id,
      packageName: pkg.package_name,
      originalPrice: basePrice,
      unitPrice,
      purchasedSessions: sessions,
      promotion,
      appliedAt: appliedAt.toISOString(),
    }),
  };
}

export async function getPackageQuote(client, user, payload = {}) {
  const pricing = await getPackagePriceSnapshot(client, payload.packageId, payload.purchasedSessions);
  if (!pricing.ok) return pricing;
  
  return {
    ok: true,
    data: {
      packageId: pricing.snapshot.packageId,
      purchasedSessions: pricing.snapshot.purchasedSessions,
      unitPrice: pricing.snapshot.unitPrice,
      originalPrice: pricing.snapshot.originalPrice,
      discountPercent: pricing.snapshot.discountPercent,
      discountAmount: pricing.snapshot.discountAmount,
      finalAmount: pricing.snapshot.finalAmount,
      promotionId: pricing.snapshot.promotionId,
      status: "quote",
    }
  };
}

export async function createPackagePromotion(client, creatorUserId, payload) {
  const validation = validatePromotionInput(payload);
  if (!validation.ok) return validation;
  const { data: pkg, error: packageError } = await client
    .from("packages")
    .select("package_id,package_name")
    .eq("package_id", payload.packageId)
    .maybeSingle();
  if (packageError) throw packageError;
  if (!pkg) return { ok: false, status: 404, message: "Package was not found." };

  const { data, error } = await client.from("package_promotions").insert({
    package_id: pkg.package_id,
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    discount_percent: validation.discountPercent,
    start_date: payload.startDate,
    end_date: payload.endDate,
    status: payload.status === "inactive" ? "inactive" : "active",
    created_by: creatorUserId,
  }).select("*").single();
  if (error?.code === "23P01") {
    return { ok: false, status: 409, message: "An active promotion overlaps this package and period." };
  }
  if (error) throw error;
  
  if (data.status === "active") {
    const today = new Date().toISOString().slice(0, 10);
    const isUpcoming = payload.startDate > today;
    const title = isUpcoming ? "Upcoming promotion!" : "New promotion available!";
    const message = `Get ${validation.discountPercent}% off on ${pkg.package_name}. Valid from ${payload.startDate} to ${payload.endDate}.`;
    
    // Background notification insert
    client.from("members").select("user_id").eq("status", "active").then(({ data: members }) => {
      if (members && members.length > 0) {
        const notifications = members.map(m => ({
          user_id: m.user_id,
          notification_type: "package",
          title,
          message,
          action_type: "link",
          action_payload: { url: "/member/my-package" },
          promotion_id: data.promotion_id
        }));
        client.from("notifications").insert(notifications).then(() => {}).catch(e => console.error("Notification insert error", e));
      }
    }).catch(e => console.error("Members fetch error", e));
  }

  return { ok: true, data: { ...mapPromotion(data), packageName: pkg.package_name } };
}

export async function listAvailablePackages(client, role = "member") {
  const today = new Date().toISOString().slice(0, 10);
  const isOwnerAdmin = role === "owner" || role === "admin";
  
  let pkgQuery = client.from("packages").select("*").order("price");
  if (!isOwnerAdmin) {
    pkgQuery = pkgQuery.eq("status", "active").eq("is_active", true);
  }
  
  let promoQuery = client.from("package_promotions").select("*");
  if (!isOwnerAdmin) {
    // Members only see promotions that have not expired yet
    promoQuery = promoQuery.eq("status", "active").gte("end_date", today);
  }

  const [{ data: packages, error: packageError }, { data: promotions, error: promotionError }] = await Promise.all([
    pkgQuery,
    promoQuery,
  ]);
  
  if (packageError) throw packageError;
  if (promotionError) throw promotionError;
  
  const promotionsByPackage = {};
  (promotions || []).forEach(row => {
    // For owner/admin, keep whatever. For members, prefer effective over upcoming.
    const isEffective = row.start_date <= today && row.end_date >= today;
    const isUpcoming = row.start_date > today;
    
    if (!promotionsByPackage[row.package_id]) {
      promotionsByPackage[row.package_id] = { promo: mapPromotion(row), isEffective, isUpcoming };
    } else {
      if (isEffective && !promotionsByPackage[row.package_id].isEffective) {
         promotionsByPackage[row.package_id] = { promo: mapPromotion(row), isEffective, isUpcoming };
      }
    }
  });

  return {
    ok: true,
    data: (packages || []).map((pkg) => {
      const pEntry = promotionsByPackage[pkg.package_id];
      const promotion = pEntry ? pEntry.promo : null;
      let effectivePromo = null;
      
      let promoState = "none";
      if (pEntry) {
        if (pEntry.isEffective) {
          promoState = "effective";
          effectivePromo = promotion;
        } else if (pEntry.isUpcoming) {
          promoState = "upcoming";
        } else {
          promoState = "expired";
        }
      }
      
      const snapshot = buildPriceSnapshot({
        packageId: pkg.package_id,
        packageName: pkg.package_name,
        originalPrice: pkg.price,
        promotion: effectivePromo, // Apply discount only if effective
      });
      return {
        ...pkg,
        promotion,
        promotionState: promoState, // 'none', 'effective', 'upcoming', 'expired'
        originalPrice: snapshot.originalPrice, // Base unit/total price
        discountPercent: snapshot.discountPercent,
        discountAmount: snapshot.discountAmount,
        discountedPrice: snapshot.finalAmount,
      };
    }),
  };
}

export async function createPackageChangeRequest(client, auth, payload = {}) {
  const role = String(auth.user?.role || "").toLowerCase();
  let memberId = String(payload.memberId || "").trim();
  if (role === "member") {
    const { data: member, error } = await client
      .from("members")
      .select("member_id")
      .eq("user_id", auth.user.user_id)
      .maybeSingle();
    if (error) throw error;
    memberId = member?.member_id || "";
  }
  if (!memberId) return { ok: false, status: 400, message: "Member could not be resolved." };

  await client.rpc("gymster_sync_member_package_lifecycle", { target_member_id: memberId });
  const [{ data: pendingRequest, error: requestError }, { data: pendingPackage, error: packageError }] = await Promise.all([
    client.from("package_change_requests").select("package_change_request_id").eq("member_id", memberId).eq("status", "pending").limit(1).maybeSingle(),
    client.from("member_packages").select("member_package_id").eq("member_id", memberId).in("status", ["pending_payment", "pending_activation"]).limit(1).maybeSingle(),
  ]);
  if (requestError) throw requestError;
  if (packageError) throw packageError;
  if (pendingRequest) return { ok: false, status: 409, code: "PENDING_REQUEST_EXISTS", message: "A package request is already pending." };
  if (pendingPackage) {
    return {
      ok: false,
      status: 409,
      code: "PENDING_ACTIVATION_EXISTS",
      message: "You already have a package waiting for payment or activation. You cannot buy another package yet.",
    };
  }

  const pricing = await getPackagePriceSnapshot(client, payload.packageId, payload.quantity || payload.purchasedSessions);
  if (!pricing.ok) return pricing;
  const requestType = ["buy", "renew", "upgrade"].includes(payload.requestType)
    ? payload.requestType
    : payload.requestType === "renewal" ? "renew" : "buy";
  const { data, error } = await client.from("package_change_requests").insert({
    member_id: memberId,
    current_member_package_id: payload.currentMemberPackageId || null,
    requested_package_id: pricing.package.package_id,
    request_type: requestType,
    payment_method: payload.paymentMethod || null,
    status: "pending",
    amount: pricing.snapshot.finalAmount,
    package_name_snapshot: pricing.snapshot.packageNameSnapshot,
    promotion_id: pricing.snapshot.promotionId,
    promotion_title_snapshot: pricing.snapshot.promotionTitleSnapshot,
    purchased_sessions: pricing.snapshot.purchasedSessions,
    unit_price: pricing.snapshot.unitPrice,
    original_price: pricing.snapshot.originalPrice,
    discount_percent: pricing.snapshot.discountPercent,
    discount_amount: pricing.snapshot.discountAmount,
    final_amount: pricing.snapshot.finalAmount,
    applied_at: pricing.snapshot.appliedAt,
  }).select("*").single();
  if (error?.code === "23505") return { ok: false, status: 409, message: "A package request is already pending." };
  if (error) throw error;
  return {
    ok: true,
    data: {
      requestId: data.package_change_request_id,
      memberId: data.member_id,
      packageId: data.requested_package_id,
      packageName: data.package_name_snapshot,
      amount: Number(data.final_amount ?? data.amount),
      purchasedSessions: data.purchased_sessions,
      unitPrice: Number(data.unit_price),
      originalPrice: Number(data.original_price),
      discountPercent: Number(data.discount_percent),
      discountAmount: Number(data.discount_amount),
      promotionId: data.promotion_id,
      promotionTitle: data.promotion_title_snapshot,
      appliedAt: data.applied_at,
      status: data.status,
    },
  };
}

export async function completeStaffPackagePurchase(client, payload = {}) {
  if (!payload.memberId || !payload.packageId) {
    return { ok: false, status: 400, message: "memberId and packageId are required." };
  }
  const { data: pkg, error: packageError } = await client
    .from("packages")
    .select("package_id,has_personal_trainer")
    .eq("package_id", payload.packageId)
    .maybeSingle();
  if (packageError) throw packageError;
  if (!pkg) return { ok: false, status: 404, message: "Package was not found." };
  if (pkg.has_personal_trainer && !payload.trainerId) {
    return { ok: false, status: 400, message: "PT packages require a trainer and weekly slots." };
  }
  const { data, error } = await client.rpc("gymster_complete_package_purchase", {
    target_member_id: payload.memberId,
    target_package_id: payload.packageId,
    target_trainer_id: payload.trainerId || null,
    target_selected_schedule: payload.selectedSchedule || null,
    target_selected_slots: payload.selectedSlots || [],
    target_checkout_key: payload.checkoutKey || `staff-${crypto.randomUUID()}`,
    target_payment_method: payload.paymentMethod || "cash",
  });
  if (error) {
    if (/PENDING_ACTIVATION_EXISTS/i.test(String(error.message || ""))) {
      return { ok: false, status: 409, code: "PENDING_ACTIVATION_EXISTS", message: "This member already has a package waiting for activation." };
    }
    throw error;
  }
  return { ok: true, data };
}
