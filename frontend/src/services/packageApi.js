import { supabase } from "./supabaseClient";

const packageTypeLabels = {
  gym: "Gym",
  pt: "Personal Training",
  vip_pt: "VIP Personal Training",
};

const adminPackageTypeLabels = {
  gym: "Basic",
  pt: "PT",
  vip_pt: "VIP",
};

function formatPrice(price) {
  return Number(price || 0).toLocaleString("vi-VN");
}

function getAdminPackageType(packageType, hasPersonalTrainer) {
  return adminPackageTypeLabels[packageType] || (hasPersonalTrainer ? "PT" : "Basic");
}

function normalizePackageType(type, hasPersonalTrainer) {
  const value = String(type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (value === "vip" || value === "vip_pt") return "vip_pt";
  if (value === "pt" || value === "personal_training" || hasPersonalTrainer) return "pt";
  return "gym";
}

function parseDurationMonths(value) {
  const match = String(value || "").match(/\d+/);
  return Math.max(1, Number(match?.[0] || value || 1));
}

function parsePrice(value) {
  return Number(String(value || "").replace(/[^\d.]/g, "")) || 0;
}

function parseSessionLimit(value, hasPersonalTrainer) {
  const match = String(value || "").match(/\d+/);
  if (match) return Number(match[0]);
  return hasPersonalTrainer ? null : null;
}

function mapPackageRow(row) {
  const packageType = row.package_type || "";
  const derivedHasPersonalTrainer = packageType.toLowerCase().includes("pt");
  const hasPersonalTrainer = typeof row.has_personal_trainer === "boolean" ? row.has_personal_trainer : derivedHasPersonalTrainer;
  const durationMonths = Number(row.duration_months || 0);
  const statusValue = String(row.status || "").toLowerCase();
  const isActive = typeof row.is_active === "boolean" ? row.is_active : statusValue ? statusValue === "active" : true;
  const sessionLimit = hasPersonalTrainer && row.session_limit ? `${row.session_limit} PT sessions` : hasPersonalTrainer ? "PT sessions included" : "Unlimited gym access";
  const packageTypeLabel = packageTypeLabels[packageType] || packageType || "Package";

  return {
    id: row.package_id,
    code: row.package_code,
    name: row.package_name,
    type: packageTypeLabel,
    adminType: getAdminPackageType(packageType, hasPersonalTrainer),
    packageType: packageType,
    packageTypeLabel,
    durationMonths,
    durationText: `${durationMonths} months`,
    duration: `${durationMonths} months`,
    price: Number(row.price || 0),
    priceText: formatPrice(row.price),
    description: row.description || "",
    sessionLimitValue: row.session_limit ?? null,
    sessionLimit,
    hasPersonalTrainer,
    isPopular: Boolean(row.is_popular),
    popular: Boolean(row.is_popular),
    isActive,
    status: row.status || (isActive ? "active" : "inactive"),
    statusLabel: isActive ? "Active" : "Inactive",
    features: [
      row.description || "Package benefits configured",
      sessionLimit,
      hasPersonalTrainer ? "Personal trainer included" : "Self-service training",
    ],
  };
}

async function queryPackages() {
  const columns = `
      package_id,
      package_code,
      package_name,
      package_type,
      duration_months,
      price,
      description,
      session_limit,
      has_personal_trainer,
      is_popular,
      is_active,
      status
    `;

  return supabase.from("packages").select(columns);
}

export async function fetchPackagesFromSupabase() {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load packages:", error);
    return { data: [], error };
  }

  const { data, error } = await queryPackages();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load packages:", error);
    return { data: [], error };
  }

  return {
    data: Array.isArray(data) ? data.map(mapPackageRow) : [],
    error: null,
  };
}

export async function createPackageInSupabase(packageData) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create package:", error);
    return { data: null, error };
  }

  const hasPersonalTrainer = Boolean(packageData.hasPersonalTrainer);
  const packageType = normalizePackageType(packageData.type || packageData.packageType, hasPersonalTrainer);
  const status = String(packageData.status || "Active").toLowerCase() === "inactive" ? "inactive" : "active";
  const durationMonths = parseDurationMonths(packageData.duration || packageData.durationMonths);
  const price = parsePrice(packageData.price);

  const payload = {
    package_code: packageData.code || `PKG-${Date.now()}`,
    package_name: String(packageData.name || "").trim(),
    package_type: packageType,
    duration_months: durationMonths,
    price,
    description: packageData.description || "",
    session_limit: parseSessionLimit(packageData.sessionLimit, hasPersonalTrainer),
    has_personal_trainer: hasPersonalTrainer || packageType.includes("pt"),
    is_popular: Boolean(packageData.isPopular || packageData.popular),
    is_active: status === "active",
    status,
  };

  const { data, error } = await supabase
    .from("packages")
    .insert(payload)
    .select(`
      package_id,
      package_code,
      package_name,
      package_type,
      duration_months,
      price,
      description,
      session_limit,
      has_personal_trainer,
      is_popular,
      is_active,
      status
    `)
    .single();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to create package:", error);
    return { data: null, error };
  }

  return { data: mapPackageRow(data), error: null };
}

export async function updatePackageInSupabase(packageId, packageData) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update package:", error);
    return { data: null, error };
  }

  const hasPersonalTrainer = Boolean(packageData.hasPersonalTrainer);
  const packageType = normalizePackageType(packageData.type || packageData.packageType, hasPersonalTrainer);
  const status = String(packageData.status || "Active").toLowerCase() === "inactive" ? "inactive" : "active";
  const durationMonths = parseDurationMonths(packageData.duration || packageData.durationMonths);
  const price = parsePrice(packageData.price);

  const payload = {
    package_name: String(packageData.name || "").trim(),
    package_type: packageType,
    duration_months: durationMonths,
    price,
    description: packageData.description || "",
    session_limit: parseSessionLimit(packageData.sessionLimit, hasPersonalTrainer),
    has_personal_trainer: hasPersonalTrainer || packageType.includes("pt"),
    is_popular: Boolean(packageData.isPopular || packageData.popular),
    is_active: status === "active",
    status,
  };

  const { data, error } = await supabase
    .from("packages")
    .update(payload)
    .eq("package_id", packageId)
    .select(`
      package_id,
      package_code,
      package_name,
      package_type,
      duration_months,
      price,
      description,
      session_limit,
      has_personal_trainer,
      is_popular,
      is_active,
      status
    `)
    .single();

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to update package:", error);
    return { data: null, error };
  }

  return { data: mapPackageRow(data), error: null };
}

export async function deletePackageInSupabase(packageId) {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to delete package:", error);
    return { error };
  }

  const { error } = await supabase
    .from("packages")
    .delete()
    .eq("package_id", packageId);

  if (error) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to delete package:", error);
    return { error };
  }

  return { error: null };
}
