export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPackageDurationMonths(pkg: any) {
  const directValue = Number(pkg?.durationMonths || pkg?.packageDurationMonths);
  if (Number.isFinite(directValue) && directValue > 0) return directValue;

  const match = String(pkg?.durationText || pkg?.duration || '').match(/\d+/);
  return Math.max(1, Number(match?.[0] || 1));
}

export function getMembershipState(item: any) {
  if (!item) {
    return { hasUsablePackage: false, daysRemaining: 0, isExpiringSoon: false, reason: 'missing' };
  }

  const normalizedStatus = String(item.status || '').toLowerCase();
  const endDate = item.endDate ? new Date(item.endDate) : null;
  const daysRemaining = endDate && !Number.isNaN(endDate.getTime())
    ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const hasUsablePackage = normalizedStatus === 'active' && (!endDate || daysRemaining >= 0);

  return {
    hasUsablePackage,
    daysRemaining: Math.max(0, daysRemaining),
    isExpiringSoon: hasUsablePackage && daysRemaining <= 7,
    reason: hasUsablePackage ? 'active' : normalizedStatus === 'active' ? 'expired' : normalizedStatus || 'missing',
  };
}
