import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, RefreshCw } from 'lucide-react';
import { getMyCheckInHistory } from '../../../services/checkInApi';

function toMonthInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getCheckInMonth(row: any) {
  const dateValue = String(row?.date || row?.checkedInAt || '');
  return dateValue.slice(0, 7);
}

export default function CheckInHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => toMonthInputValue());

  const monthlyRows = useMemo(
    () => rows.filter((row) => getCheckInMonth(row) === selectedMonth),
    [rows, selectedMonth],
  );
  const selectedMonthLabel = useMemo(() => {
    const date = new Date(`${selectedMonth}-01T00:00:00`);
    if (Number.isNaN(date.getTime())) return selectedMonth;
    return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const result = await getMyCheckInHistory();
    if (result.error) setError(result.error.message || 'Check-in history could not be loaded.');
    else setRows(result.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Check-in History</h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">Your recorded gym attendance by day.</p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 font-bold">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : null}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Monthly check-ins</div>
            <div className="mt-2 text-3xl font-black text-white">{monthlyRows.length}</div>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Total check-ins in {selectedMonthLabel}</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-400">
            <CalendarCheck className="h-7 w-7" />
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="text-lg font-black">Attendance log</div>
          <label className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
            Month
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value || toMonthInputValue())}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold text-white outline-none transition focus:border-primary"
            />
          </label>
        </div>
        {loading ? (
          <div className="p-10 text-center font-bold text-muted-foreground">Loading check-in history...</div>
        ) : monthlyRows.length ? (
          <div className="divide-y divide-border">
            {monthlyRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400"><CalendarCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="font-black">{new Date(`${row.date}T00:00:00`).toLocaleDateString('vi-VN')}</p>
                    <p className="text-sm text-muted-foreground">{new Date(row.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">Checked-in</span>
              </div>
            ))}
          </div>
        ) : rows.length ? (
          <div className="p-10 text-center font-bold text-muted-foreground">No check-ins found for {selectedMonthLabel}.</div>
        ) : (
          <div className="p-10 text-center font-bold text-muted-foreground">No check-in history yet.</div>
        )}
      </div>
    </div>
  );
}
