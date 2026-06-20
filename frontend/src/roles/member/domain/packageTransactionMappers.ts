import { currentPackage } from './memberConstants';
import { addMonths, getPackageDurationMonths, toDateInputValue } from './packageHelpers';
import { getAllowedLeaveDaysForPackage } from '../../../services/packageEntitlement';

export type DisplayPackage = {
  id: string | number;
  title: string;
  name: string;
  duration: string;
  durationMonths?: number;
  price: string;
  priceValue: number;
  originalPrice: string;
  originalPriceValue: number;
  discountPercent: number;
  discountAmount: number;
  promotion?: any;
  description: string;
  sessionLimit: string;
  sessionLimitValue?: number | null;
  maxLeaveDays?: number;
  hasPersonalTrainer: boolean;
  isPopular?: boolean;
  sessionsPerWeek?: number;
  benefits: string[];
};

export type DisplayTransaction = {
  id: string;
  receiptCode?: string;
  packageName?: string;
  service: string;
  date: string;
  amount: string;
  status: string;
};

export type DisplayCurrentPackage = {
  hasPackage: boolean;
  title: string;
  status: string;
  registrationDate: string;
  expiryDate: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: string | number;
  daysRemaining: string | number;
  price: string;
  trainer: string;
  maxLeaveDays?: number;
};

export const emptyDisplayCurrentPackage: DisplayCurrentPackage = {
  hasPackage: false,
  title: 'No active package found.',
  status: 'None',
  registrationDate: '-',
  expiryDate: '-',
  totalSessions: 0,
  usedSessions: 0,
  remainingSessions: '-',
  daysRemaining: '-',
  price: '-',
  trainer: '',
};

export function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
}

function toValidDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveStartDate(item: any) {
  return item.startDate || item.activatedAt || item.createdAt || null;
}

function resolveEndDate(item: any, startDate?: string | null) {
  if (item.endDate) return item.endDate;
  const parsedStartDate = toValidDate(startDate);
  const durationMonths = getPackageDurationMonths(item);
  return parsedStartDate ? toDateInputValue(addMonths(parsedStartDate, durationMonths)) : null;
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return currentPackage.daysRemaining;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function resolveSessionStats(item: any) {
  const usedSessions = Number(item.usedSessions ?? 0);
  const packageSessionLimit = Number(item.packageSessionLimit);
  const sessionsTotal = Number(item.sessionsTotal);
  const storedRemaining = item.remainingSessions;
  const inferredTotal = Number.isFinite(sessionsTotal) && sessionsTotal > 0
    ? sessionsTotal
    : Number.isFinite(packageSessionLimit) && packageSessionLimit > 0
      ? packageSessionLimit
      : Number.isFinite(Number(storedRemaining)) && Number(storedRemaining) >= 0
        ? usedSessions + Number(storedRemaining)
        : 0;

  if (inferredTotal <= 0 && !item.hasPersonalTrainer) {
    return {
      totalSessions: 0,
      usedSessions,
      remainingSessions: 'Unlimited',
    };
  }

  return {
    totalSessions: inferredTotal,
    usedSessions,
    remainingSessions: Number.isFinite(Number(storedRemaining)) && Number(storedRemaining) >= 0
      ? Number(storedRemaining)
      : Math.max(0, inferredTotal - usedSessions),
  };
}

export function mapPackageToDisplayPackage(pkg: any): DisplayPackage {
  const originalPrice = Number(pkg.originalPrice ?? pkg.price ?? 0);
  const finalPrice = Number(pkg.discountedPrice ?? pkg.price ?? originalPrice);
  return {
    id: pkg.id,
    title: pkg.name,
    name: pkg.name,
    duration: pkg.durationText || pkg.duration,
    durationMonths: pkg.durationMonths,
    price: formatVnd(finalPrice),
    priceValue: finalPrice,
    originalPrice: formatVnd(originalPrice),
    originalPriceValue: originalPrice,
    discountPercent: Number(pkg.discountPercent || 0),
    discountAmount: Number(pkg.discountAmount || 0),
    promotion: pkg.promotion || null,
    description: pkg.description,
    sessionLimit: pkg.sessionLimit,
    sessionLimitValue: pkg.sessionLimitValue ?? null,
    maxLeaveDays: pkg.maxLeaveDays || getAllowedLeaveDaysForPackage(pkg),
    hasPersonalTrainer: pkg.hasPersonalTrainer,
    isPopular: pkg.isPopular,
    sessionsPerWeek: pkg.sessionsPerWeek ?? (pkg.packageType === "vip_pt" ? 2 : 1),
    benefits: [
      pkg.description || 'Package benefits configured',
      pkg.sessionLimit,
      `${pkg.maxLeaveDays || getAllowedLeaveDaysForPackage(pkg)} valid leave days`,
      pkg.hasPersonalTrainer ? 'Personal trainer included' : 'Self-service training',
    ],
  };
}

export function mapCurrentPackageToDisplay(item: any): DisplayCurrentPackage {
  const startDate = resolveStartDate(item);
  const endDate = resolveEndDate(item, startDate);
  const sessionStats = resolveSessionStats(item);
  const maxLeaveDays = item.maxLeaveDays || getAllowedLeaveDaysForPackage(item);

  return {
    hasPackage: true,
    title: item.packageName || currentPackage.title,
    status: item.status || currentPackage.status,
    registrationDate: formatDate(startDate),
    expiryDate: formatDate(endDate),
    totalSessions: sessionStats.totalSessions,
    usedSessions: sessionStats.usedSessions,
    remainingSessions: sessionStats.remainingSessions,
    daysRemaining: getDaysRemaining(endDate),
    price: item.packagePrice ? formatVnd(item.packagePrice) : currentPackage.price,
    trainer: item.trainerName || '',
    maxLeaveDays,
  };
}

export function mapInvoiceToDisplayTransaction(invoice: any): DisplayTransaction {
  return {
    id: invoice.invoiceNumber || invoice.invoiceId,
    service: invoice.packageName || 'Membership package',
    date: formatDate(invoice.issuedAt),
    amount: formatVnd(invoice.amount),
    status: invoice.statusLabel || 'Issued',
  };
}

export function mapPaymentToDisplayTransaction(payment: any): DisplayTransaction {
  return {
    id: payment.transactionCode || payment.paymentId,
    service: payment.packageName || 'Membership package',
    date: formatDate(payment.paymentDate),
    amount: formatVnd(payment.amount),
    status: payment.paymentStatusLabel || (payment.paymentStatus ? payment.paymentStatus[0].toUpperCase() + payment.paymentStatus.slice(1) : 'Paid'),
  };
}

export function mapReceiptToDisplayTransaction(receipt: any): DisplayTransaction {
  return {
    id: receipt.id || receipt.paymentId,
    receiptCode: receipt.receiptCode,
    packageName: receipt.package?.name || 'Membership package',
    service: receipt.package?.name || 'Membership package',
    date: receipt.payment?.paymentDateLabel || formatDate(receipt.payment?.paymentDate),
    amount: receipt.payment?.amountLabel || formatVnd(receipt.payment?.amount),
    status: receipt.payment?.status || 'Paid',
  };
}

export function getTransactionBadgeClass(status: string) {
  if (status === 'Paid' || status === 'paid') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
  if (status === 'Pending' || status === 'pending') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
  return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
}
