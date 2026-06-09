export const VALID_LEAVE_DAYS_PER_MONTH = 2;

export function getAllowedLeaveDaysForPackage(pkg = {}) {
  const directMonths = Number(pkg.packageDurationMonths ?? pkg.durationMonths);
  const monthsFromText = Number(String(pkg.durationText || pkg.duration || "").match(/\d+/)?.[0] || 0);
  const durationMonths = Number.isFinite(directMonths) && directMonths > 0
    ? directMonths
    : Number.isFinite(monthsFromText) && monthsFromText > 0
      ? monthsFromText
      : 1;

  return durationMonths * VALID_LEAVE_DAYS_PER_MONTH;
}

export function getMonthlyLeaveLimit() {
  return VALID_LEAVE_DAYS_PER_MONTH;
}
