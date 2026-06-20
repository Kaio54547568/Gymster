export const REVENUE_RANGE_OPTIONS = [
  { value: 'month', label: 'This Month' },
  { value: 'sixMonths', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
];

export function getRevenueRange(range, now = new Date()) {
  const end = new Date(now);
  let start;

  if (range === 'year') {
    start = new Date(end.getFullYear(), 0, 1);
  } else if (range === 'sixMonths') {
    start = new Date(end.getFullYear(), end.getMonth() - 5, 1);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }

  return { start, end };
}

export function getPaymentDate(payment) {
  return payment?.paymentDate || payment?.paidAt || payment?.createdAt || payment?.created_at || '';
}

export function filterRowsByRange(rows, range, now = new Date(), dateSelector = getPaymentDate) {
  const { start, end } = getRevenueRange(range, now);
  return (rows || []).filter((row) => {
    const date = new Date(dateSelector(row));
    return !Number.isNaN(date.getTime()) && date >= start && date <= end;
  });
}

export function filterPaidPaymentsByRange(payments, range, now = new Date()) {
  return filterRowsByRange(
    (payments || []).filter((payment) => String(payment.paymentStatus || payment.payment_status).toLowerCase() === 'paid'),
    range,
    now,
  );
}

export function getPackageBucket(payment, packagesById) {
  const packageId = payment?.packageId || payment?.package_id;
  if (!packageId) return 'Unknown Package';
  return packagesById.has(packageId) ? packagesById.get(packageId).name : 'Deleted Package';
}

export function buildPackageRevenue(payments, packages) {
  const packagesById = new Map((packages || []).map((pkg) => [pkg.id || pkg.packageId || pkg.package_id, pkg]));
  const totals = new Map((packages || []).map((pkg) => [pkg.name || pkg.packageName || pkg.package_name, 0]));

  (payments || []).forEach((payment) => {
    const bucket = getPackageBucket(payment, packagesById);
    totals.set(bucket, (totals.get(bucket) || 0) + Number(payment.amount || 0));
  });

  return Array.from(totals, ([packageName, revenue]) => ({ package: packageName, revenue }))
    .filter((row) => row.revenue > 0 || !['Unknown Package', 'Deleted Package'].includes(row.package));
}

function dateKey(date, range) {
  if (range === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateLabel(key, range) {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day || 1);
  return range === 'month'
    ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function buildRevenueGrowth(payments, range, now = new Date()) {
  const totals = new Map();
  (payments || []).forEach((payment) => {
    const date = new Date(getPaymentDate(payment));
    if (Number.isNaN(date.getTime())) return;
    const key = dateKey(date, range);
    totals.set(key, (totals.get(key) || 0) + Number(payment.amount || 0));
  });

  const { start, end } = getRevenueRange(range, now);
  const cursor = new Date(start);
  const rows = [];
  while (cursor <= end) {
    const key = dateKey(cursor, range);
    rows.push({ period: dateLabel(key, range), revenue: totals.get(key) || 0, rawKey: key });
    if (range === 'month') cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  return rows;
}

const METHOD_COLORS = ['#EF233C', '#F97316', '#22C55E', '#990000', '#8B5CF6'];

export function buildPaymentMethodRevenue(payments) {
  const totals = new Map();
  (payments || []).forEach((payment) => {
    const rawMethod = String(payment.paymentMethod || payment.payment_method || 'unknown').trim();
    const name = rawMethod
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    totals.set(name, (totals.get(name) || 0) + Number(payment.amount || 0));
  });
  const grandTotal = Array.from(totals.values()).reduce((sum, amount) => sum + amount, 0);
  return Array.from(totals, ([name, value], index) => ({
    name,
    value,
    percent: grandTotal ? value / grandTotal : 0,
    color: METHOD_COLORS[index % METHOD_COLORS.length],
  }));
}

export function resolvePackageLabel(packageId, packagesById) {
  if (!packageId) return 'Unknown Package';
  return packagesById.has(packageId) ? packagesById.get(packageId).name : 'Deleted Package';
}
