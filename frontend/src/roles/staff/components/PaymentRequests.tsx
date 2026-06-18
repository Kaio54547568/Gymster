import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Search, XCircle } from 'lucide-react';
import {
  approveStaffPaymentRequest,
  getStaffPaymentRequests,
  rejectStaffPaymentRequest,
} from '../../../services/paymentRequestApi';

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

export function PaymentRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await getStaffPaymentRequests();
    setRequests(error ? [] : data || []);
    setMessage(error ? error.message || 'Payment requests could not be loaded.' : '');
    setLoading(false);
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((request) => [
      request.transactionCode,
      request.memberName,
      request.memberEmail,
      request.packageName,
      request.trainerName,
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [requests, search]);

  const approve = async (request: any) => {
    setSavingId(request.paymentId);
    const { error } = await approveStaffPaymentRequest(request.paymentId);
    setSavingId('');
    if (error) {
      setMessage(error.message || 'Payment request could not be approved.');
      return;
    }
    setMessage('Payment request approved.');
    await loadRequests();
  };

  const reject = async (request: any) => {
    const reason = window.prompt('Reason for rejecting this payment request?', 'Payment not confirmed.') || 'Payment not confirmed.';
    setSavingId(request.paymentId);
    const { error } = await rejectStaffPaymentRequest(request.paymentId, reason);
    setSavingId('');
    if (error) {
      setMessage(error.message || 'Payment request could not be rejected.');
      return;
    }
    setMessage('Payment request rejected.');
    await loadRequests();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-foreground">Payment Requests</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">Approve or reject member package payment confirmations.</p>
      </div>

      {message && (
        <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4 text-sm font-bold text-foreground">
          {message}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search payment requests..."
          className="w-full rounded-2xl border border-border bg-card py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Request</th>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">PT / Schedule</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.paymentId} className="border-t border-border">
                  <td className="px-5 py-4 font-mono text-sm font-black text-primary">{request.transactionCode}</td>
                  <td className="px-5 py-4">
                    <p className="font-black">{request.memberName}</p>
                    <p className="text-xs text-muted-foreground">{request.memberEmail || request.memberCode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{request.packageName}</p>
                    <p className="text-xs text-muted-foreground">{request.paymentMethod || 'bank_transfer'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{request.trainerName || 'Not required'}</p>
                    <p className="text-xs text-muted-foreground">{request.selectedSchedule || '-'}</p>
                  </td>
                  <td className="px-5 py-4 font-black">{formatVnd(request.amount)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Pending
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => void approve(request)}
                        disabled={savingId === request.paymentId}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => void reject(request)}
                        disabled={savingId === request.paymentId}
                        className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-black text-destructive transition hover:bg-destructive hover:text-white disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !filteredRequests.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">No pending payment requests.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">Loading payment requests...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
