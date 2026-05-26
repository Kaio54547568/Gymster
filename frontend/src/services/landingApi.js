import { supabase } from "./supabaseClient";

const trainerImageFallbacks = [
  "https://images.unsplash.com/photo-1750698545009-679820502908?w=500&h=620&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=500&h=620&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1652400744403-8f29705bd6a5?w=500&h=620&fit=crop&auto=format",
];

function formatVnd(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatCount(value) {
  if (typeof value !== "number") return "0";
  return value.toLocaleString("vi-VN");
}

function getPackageBadge(row) {
  if (row.is_popular) return "PHỔ BIẾN";
  if (row.package_type === "vip_pt") return "VIP PT";
  if (row.package_type === "pt") return "PT";
  return "";
}

function getPackageFeatures(row, featureMap) {
  const configuredFeatures = featureMap.get(row.package_id) || [];
  if (configuredFeatures.length) return configuredFeatures.slice(0, 5);

  const features = [];
  if (row.description) features.push(row.description);
  features.push(`${row.duration_months || 1} tháng sử dụng`);
  features.push(row.has_personal_trainer ? "Bao gồm huấn luyện viên cá nhân" : "Tự do sử dụng khu vực gym");
  if (row.session_limit) features.push(`${row.session_limit} buổi PT`);
  features.push("Theo dõi thông tin gói tập trên Gymster");
  return features.slice(0, 5);
}

function mapPackageRow(row, featureMap) {
  return {
    id: row.package_id,
    name: row.package_name || "Membership Package",
    price: formatVnd(row.price),
    unit: "VND",
    duration: `Gói ${row.duration_months || 1} tháng`,
    badge: getPackageBadge(row),
    featured: Boolean(row.is_popular),
    features: getPackageFeatures(row, featureMap),
  };
}

function mapTrainerRow(row, index) {
  const userName = [row.users?.first_name, row.users?.last_name].filter(Boolean).join(" ").trim();
  const memberCapacity = row.max_active_members
    ? `${Number(row.current_active_members || 0)}/${Number(row.max_active_members || 0)} hội viên`
    : "PT chuyên nghiệp";

  return [
    row.full_name || userName || row.employees?.full_name || row.trainer_code || "Gymster Trainer",
    row.specialty || "Personal Training",
    memberCapacity,
    Number(row.rating || 0).toFixed(1),
    row.avatar_url || row.users?.avatar_url || trainerImageFallbacks[index % trainerImageFallbacks.length],
  ];
}

async function fetchPackageRows() {
  const baseColumns = `
    package_id,
    package_name,
    package_type,
    duration_months,
    price,
    description,
    session_limit,
    has_personal_trainer,
    is_popular,
    status
  `;

  let response = await supabase
    .from("packages")
    .select(baseColumns)
    .eq("status", "active")
    .order("is_popular", { ascending: false })
    .order("price", { ascending: true });

  if (response.error) {
    response = await supabase
      .from("packages")
      .select(baseColumns)
      .order("price", { ascending: true });
  }

  return response;
}

async function fetchPackageFeatures(packageIds) {
  if (!packageIds.length) return new Map();

  const { data, error } = await supabase
    .from("package_features")
    .select("package_id, feature_name, display_order")
    .in("package_id", packageIds)
    .order("display_order", { ascending: true });

  if (error || !Array.isArray(data)) return new Map();

  return data.reduce((map, row) => {
    const current = map.get(row.package_id) || [];
    current.push(row.feature_name);
    map.set(row.package_id, current);
    return map;
  }, new Map());
}

async function fetchTrainerRows() {
  let response = await supabase
    .from("trainers")
    .select(`
      trainer_id,
      full_name,
      trainer_code,
      specialty,
      rating,
      current_active_members,
      max_active_members,
      status,
      avatar_url
    `)
    .in("status", ["active", "full"])
    .order("rating", { ascending: false })
    .limit(3);

  if (response.error) {
    response = await supabase
      .from("trainers")
      .select(`
        trainer_id,
        trainer_code,
        specialty,
        rating,
        current_active_members,
        max_active_members,
        status,
        users (
          first_name,
          last_name,
          avatar_url
        ),
        employees (
          full_name
        )
      `)
      .order("rating", { ascending: false })
      .limit(3);
  }

  return response;
}

async function getCount(table, column, filter) {
  let query = supabase.from(table).select(column, { count: "exact", head: true });
  if (filter) query = filter(query);

  const { count, error } = await query;
  if (error) return null;
  return count || 0;
}

export async function fetchLandingPageData() {
  if (!supabase) {
    const error = new Error("Missing h\u1ec7 th\u1ed1ng environment variables.");
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Failed to load landing data:", error);
    return { data: null, error };
  }

  const [packageResponse, trainerResponse, memberCount, trainerCount, packageCount, sessionCount] = await Promise.all([
    fetchPackageRows(),
    fetchTrainerRows(),
    getCount("members", "member_id", (query) => query.eq("status", "active")),
    getCount("trainers", "trainer_id", (query) => query.in("status", ["active", "full"])),
    getCount("packages", "package_id", (query) => query.eq("status", "active")),
    getCount("workout_sessions", "workout_session_id"),
  ]);

  const packageRows = Array.isArray(packageResponse.data) ? packageResponse.data : [];
  const trainerRows = Array.isArray(trainerResponse.data) ? trainerResponse.data : [];
  const featureMap = await fetchPackageFeatures(packageRows.map((row) => row.package_id));

  const errors = [packageResponse.error, trainerResponse.error].filter(Boolean);
  if (errors.length) {
    console.error("[Gymster h\u1ec7 th\u1ed1ng] Landing data loaded with warnings:", errors);
  }

  return {
    data: {
      packages: packageRows.map((row) => mapPackageRow(row, featureMap)),
      trainers: trainerRows.map(mapTrainerRow),
      stats: [
        [formatCount(memberCount), "Hội viên"],
        [formatCount(trainerCount), "Huấn luyện viên"],
        [formatCount(packageCount), "Gói tập"],
        [formatCount(sessionCount), "Buổi tập"],
      ],
    },
    error: errors[0] || null,
  };
}
