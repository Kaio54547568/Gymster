import { describe, expect, it } from 'vitest';
import {
  buildPackageRevenue,
  buildPaymentMethodRevenue,
  buildRevenueGrowth,
  filterPaidPaymentsByRange,
  filterRowsByRange,
  getRevenueRange,
} from './revenueAnalytics';

describe('getRevenueRange', () => {
  it('returns the current calendar month boundaries', () => {
    const now = new Date('2026-06-19T12:00:00+07:00');
    const range = getRevenueRange('month', now);

    expect(range.start.getFullYear()).toBe(2026);
    expect(range.start.getMonth()).toBe(5);
    expect(range.start.getDate()).toBe(1);
    expect(range.end.getTime()).toBe(now.getTime());
  });
});

describe('buildRevenueGrowth', () => {
  it('keeps full VND amounts when grouping monthly revenue', () => {
    const payments = [
      { amount: 4_800_000, paymentDate: '2026-05-10T00:00:00Z' },
      { amount: 990_000, paymentDate: '2026-05-12T00:00:00Z' },
    ];

    expect(buildRevenueGrowth(payments, 'sixMonths', new Date('2026-06-19T00:00:00Z')))
      .toContainEqual(expect.objectContaining({ revenue: 5_790_000 }));
  });
});

describe('buildPackageRevenue', () => {
  it('keeps catalog packages and separates unknown from deleted package revenue', () => {
    const packages = [
      { id: 'pkg-active', name: 'Gym Access', status: 'active' },
      { id: 'pkg-zero', name: 'VIP PT', status: 'archived' },
    ];
    const payments = [
      { packageId: 'pkg-active', amount: 1_000_000 },
      { packageId: 'pkg-deleted', amount: 2_000_000 },
      { packageId: null, amount: 3_000_000 },
    ];

    expect(buildPackageRevenue(payments, packages)).toEqual([
      expect.objectContaining({ package: 'Gym Access', revenue: 1_000_000 }),
      expect.objectContaining({ package: 'VIP PT', revenue: 0 }),
      expect.objectContaining({ package: 'Deleted Package', revenue: 2_000_000 }),
      expect.objectContaining({ package: 'Unknown Package', revenue: 3_000_000 }),
    ]);
  });
});

describe('filterPaidPaymentsByRange', () => {
  it('keeps only paid payments inside the selected range', () => {
    const payments = [
      { paymentStatus: 'paid', amount: 1_000_000, paymentDate: '2026-06-10T00:00:00Z' },
      { paymentStatus: 'pending', amount: 2_000_000, paymentDate: '2026-06-11T00:00:00Z' },
      { paymentStatus: 'paid', amount: 3_000_000, paymentDate: '2026-05-10T00:00:00Z' },
    ];

    expect(filterPaidPaymentsByRange(payments, 'month', new Date('2026-06-19T12:00:00Z'))).toHaveLength(1);
  });
});

describe('buildPaymentMethodRevenue', () => {
  it('uses actual VND totals rather than percentage values', () => {
    expect(buildPaymentMethodRevenue([
      { paymentMethod: 'bank_transfer', amount: 4_800_000 },
      { paymentMethod: 'bank_transfer', amount: 990_000 },
    ])).toContainEqual(expect.objectContaining({
      name: 'Bank Transfer',
      value: 5_790_000,
      percent: 1,
    }));
  });
});

describe('filterRowsByRange', () => {
  it('filters invoice rows by their raw issue date', () => {
    const rows = [
      { invoiceId: 'June', rawDate: '2026-06-10T00:00:00Z' },
      { invoiceId: 'May', rawDate: '2026-05-10T00:00:00Z' },
    ];

    expect(filterRowsByRange(
      rows,
      'month',
      new Date('2026-06-19T12:00:00Z'),
      (row) => row.rawDate,
    )).toEqual([rows[0]]);
  });
});
