import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, RefreshCw } from 'lucide-react';
import { getMyCheckInHistory } from '../../../services/checkInApi';

export default function CheckInHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4 text-lg font-black">Attendance log</div>
        {loading ? (
          <div className="p-10 text-center font-bold text-muted-foreground">Loading check-in history...</div>
        ) : rows.length ? (
          <div className="divide-y divide-border">
            {rows.map((row) => (
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
        ) : (
          <div className="p-10 text-center font-bold text-muted-foreground">No check-in history yet.</div>
        )}
      </div>
    </div>
  );
}
