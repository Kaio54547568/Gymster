import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, FileText, Search, X } from 'lucide-react';
import {
  getStaffPaymentHistory,
  getStaffPaymentReceipt,
} from '../../../services/paymentRequestApi';

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatPaidAt(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export function PaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const requestInFlight = useRef(false);

  const loadPayments = useCallback(async (showLoading = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await getStaffPaymentHistory();
      if (error) {
        if (error.status === 401) setMessage('Your session has expired. Please sign in again.');
        else if (error.code === 'BACKEND_UNAVAILABLE') setMessage('Payment service is unavailable. Start the backend and retry.');
        else setMessage(error.message || 'Payment history could not be loaded.');
      } else {
        setPayments(data || []);
        setMessage('');
      }
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments(true);
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadPayments(false);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const intervalId = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [loadPayments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter((payment) => [
      payment.transactionCode,
      payment.memberName,
      payment.memberEmail,
      payment.packageName,
      payment.trainerName,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [payments, search]);

  const viewReceipt = async (payment: any) => {
    setReceiptPayment(payment);
    setReceipt(null);
    setReceiptLoading(true);
    const { data, error } = await getStaffPaymentReceipt(payment.paymentId);
    setReceiptLoading(false);
    if (error) {
      setMessage(error.message || 'Payment receipt could not be loaded.');
      return;
    }
    setReceipt(data);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-foreground">Payment History</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">Review completed member package payments and official receipts.</p>
      </div>

      {message && (
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm font-bold text-foreground">
          <p>{message}</p>
          <button
            type="button"
            onClick={() => void loadPayments(true)}
            className="mt-3 rounded-lg border border-primary/40 px-4 py-2 text-xs font-black uppercase tracking-wide hover:bg-primary/10"
          >
            Retry
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search payment history..."
          className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Transaction</th>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">PT / Schedule</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Paid At</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.paymentId} className="border-t border-border">
                  <td className="px-5 py-4 font-mono text-sm font-black text-primary">{payment.transactionCode}</td>
                  <td className="px-5 py-4">
                    <p className="font-black">{payment.memberName}</p>
                    <p className="text-xs text-muted-foreground">{payment.memberEmail || payment.memberCode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{payment.packageName}</p>
                    <p className="text-xs text-muted-foreground">{payment.paymentMethod || 'bank_transfer'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{payment.trainerName || 'Not required'}</p>
                    <p className="text-xs text-muted-foreground">{payment.selectedSchedule || '-'}</p>
                  </td>
                  <td className="px-5 py-4 font-black">{formatVnd(payment.amount)}</td>
                  <td className="px-5 py-4 text-sm font-bold">{formatPaidAt(payment.paymentDate)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => void viewReceipt(payment)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2 text-xs font-black transition hover:border-primary hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !filteredPayments.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">No completed payments found.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">Loading payment history...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {receiptPayment ? createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Payment receipt">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="text-2xl font-black">Official Payment Receipt</h2>
                <p className="mt-1 font-mono text-sm font-black text-primary">{receipt?.receiptCode || receiptPayment.transactionCode}</p>
              </div>
              <button type="button" onClick={() => setReceiptPayment(null)} className="rounded-xl border border-border p-2 hover:border-primary" aria-label="Close receipt">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {receiptLoading ? (
                <div className="py-16 text-center text-sm font-bold text-muted-foreground">Loading receipt...</div>
              ) : receipt ? (
                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4 rounded-2xl border border-border bg-background/30 p-5 text-sm">
                    <div><span className="text-muted-foreground">Member</span><p className="font-black">{receipt.member?.fullName}</p><p className="text-xs text-muted-foreground">{receipt.member?.email}</p></div>
                    <div><span className="text-muted-foreground">Package</span><p className="font-black">{receipt.package?.name}</p></div>
                    <div><span className="text-muted-foreground">PT</span><p className="font-black">{receipt.package?.trainerName || 'Not required'}</p></div>
                    <div><span className="text-muted-foreground">Package period</span><p className="font-black">{receipt.package?.startDateLabel || '-'} — {receipt.package?.endDateLabel || '-'}</p></div>
                  </div>
                  <div className="rounded-2xl border border-primary/25 bg-primary/10 p-6">
                    <FileText className="h-12 w-12 text-primary" />
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Transaction</p>
                    <p className="mt-1 break-all font-mono text-lg font-black">{receipt.payment?.transactionCode}</p>
                    <div className="mt-6 grid gap-4 text-sm">
                      <div><span className="text-muted-foreground">Paid at</span><p className="font-black">{receipt.payment?.paymentDateLabel}</p></div>
                      <div><span className="text-muted-foreground">Method</span><p className="font-black">{receipt.payment?.method}</p></div>
                      <div><span className="text-muted-foreground">Amount paid</span><p className="text-3xl font-black text-primary">{receipt.payment?.amountLabel}</p></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-sm font-bold text-muted-foreground">Receipt is unavailable.</div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
