import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Search, Star, X } from 'lucide-react';
import {
  createPerformanceReview,
  fetchPerformance,
  fetchPerformanceDetail,
  updatePerformanceReview,
} from '../../../services/performanceApi';

type PerformanceRow = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  role: 'staff' | 'trainer';
  activityCount: number;
  feedbackHandled: number;
  averageRating?: number;
  activityScore: number;
  adminScore: number;
  finalScore: number;
  rank: string;
  activityBreakdown: { components?: Array<Record<string, any>> };
  feedbackBreakdown?: Record<string, any> | null;
  review?: { id: string; comment: string } | null;
  history?: Array<Record<string, any>>;
};

function currentMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const format = (date: Date) => {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  };
  return { periodStart: format(start), periodEnd: format(end) };
}

const rankClass: Record<string, string> = {
  Excellent: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
  Good: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
  Average: 'border-[#F97316]/30 bg-[#F97316]/10 text-[#F97316]',
  Poor: 'border-[#EF233C]/30 bg-[#EF233C]/10 text-[#EF233C]',
};

export default function PerformanceTab() {
  const defaults = useMemo(currentMonth, []);
  const [filters, setFilters] = useState({ ...defaults, role: '', search: '' });
  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [detail, setDetail] = useState<PerformanceRow | null>(null);
  const [reviewTarget, setReviewTarget] = useState<PerformanceRow | null>(null);
  const [adminScore, setAdminScore] = useState('0');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const { data, error } = await fetchPerformance(filters);
    setRows((data || []) as PerformanceRow[]);
    setMessage(error?.message || '');
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const openDetail = async (row: PerformanceRow) => {
    const { data, error } = await fetchPerformanceDetail(row.employeeId, filters);
    setMessage(error?.message || '');
    if (data) setDetail(data as PerformanceRow);
  };

  const openReview = (row: PerformanceRow) => {
    setReviewTarget(row);
    setAdminScore(String(row.adminScore || 0));
    setComment(row.review?.comment || '');
    setMessage('');
  };

  const saveReview = async () => {
    if (!reviewTarget) return;
    const score = Number(adminScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setMessage('Admin score must be between 0 and 100.');
      return;
    }
    setSaving(true);
    const payload = {
      employeeId: reviewTarget.employeeId,
      periodStart: filters.periodStart,
      periodEnd: filters.periodEnd,
      adminScore: score,
      comment,
    };
    const result = reviewTarget.review
      ? await updatePerformanceReview(reviewTarget.review.id, { adminScore: score, comment })
      : await createPerformanceReview(payload);
    setSaving(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setReviewTarget(null);
    await loadRows();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search employee..."
            className="w-full rounded-xl border border-[#EF233C]/20 bg-[#0c1014] py-3 pl-12 pr-4 text-white outline-none focus:border-[#EF233C]"
          />
        </label>
        <select
          value={filters.role}
          onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
          className="rounded-xl border border-[#EF233C]/20 bg-[#0c1014] px-4 py-3 text-white outline-none"
        >
          <option value="">All roles</option>
          <option value="staff">Staff</option>
          <option value="trainer">Trainer</option>
        </select>
        <input
          type="date"
          value={filters.periodStart}
          onChange={(event) => setFilters((current) => ({ ...current, periodStart: event.target.value }))}
          className="rounded-xl border border-[#EF233C]/20 bg-[#0c1014] px-4 py-3 text-white outline-none"
        />
        <input
          type="date"
          value={filters.periodEnd}
          onChange={(event) => setFilters((current) => ({ ...current, periodEnd: event.target.value }))}
          className="rounded-xl border border-[#EF233C]/20 bg-[#0c1014] px-4 py-3 text-white outline-none"
        />
      </div>

      {message ? <div className="rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 p-4 text-sm text-white">{message}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-[#EF233C]/20 bg-[#0c1014]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[#EF233C]/20 bg-[#EF233C]/5 text-[#A1A1AA]">
              <tr>
                {['Employee', 'Role', 'Activities', 'Feedback/Reports', 'Avg rating', 'Objective', 'Admin', 'Final', 'Rank', 'Actions'].map((label) => (
                  <th key={label} className="px-4 py-4 font-bold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employeeId} className="border-b border-white/5 text-white last:border-0">
                  <td className="px-4 py-4"><strong>{row.employeeName}</strong><div className="text-xs text-[#A1A1AA]">{row.employeeCode}</div></td>
                  <td className="px-4 py-4 capitalize">{row.role}</td>
                  <td className="px-4 py-4">{row.activityCount}</td>
                  <td className="px-4 py-4">{row.feedbackHandled}</td>
                  <td className="px-4 py-4">{row.role === 'trainer' && row.feedbackBreakdown?.status !== 'no_feedback' ? `${row.averageRating?.toFixed(2)}/5` : 'N/A'}</td>
                  <td className="px-4 py-4">{row.activityScore.toFixed(2)}</td>
                  <td className="px-4 py-4">{row.review ? row.adminScore.toFixed(2) : '—'}</td>
                  <td className="px-4 py-4 font-black">{row.review ? row.finalScore.toFixed(2) : 'Preview'}</td>
                  <td className="px-4 py-4"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${rankClass[row.rank] || rankClass.Poor}`}>{row.rank}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => void openDetail(row)} className="rounded-lg border border-white/10 p-2 text-[#A1A1AA] hover:text-white" aria-label={`View ${row.employeeName}`}><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openReview(row)} className="rounded-lg bg-[#EF233C] px-3 py-2 text-xs font-bold text-white hover:bg-[#990000]">{row.review ? 'Edit Review' : 'Create Review'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && rows.length === 0 ? <div className="p-10 text-center text-[#A1A1AA]">No performance data found.</div> : null}
        {loading ? <div className="p-10 text-center text-[#A1A1AA]">Loading performance data...</div> : null}
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-7" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><h2 className="text-3xl font-bold text-white">{detail.employeeName}</h2><p className="capitalize text-[#EF233C]">{detail.role} performance breakdown</p></div>
              <button onClick={() => setDetail(null)} className="p-2 text-[#A1A1AA] hover:text-white"><X /></button>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(detail.activityBreakdown?.components || []).map((item: any) => (
                <div key={item.key} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="flex justify-between text-white"><strong>{item.label}</strong><span>{item.score.toFixed(2)}</span></div>
                  <p className="mt-2 text-sm text-[#A1A1AA]">Count {item.count} / target {item.target} · weight {Math.round(item.weight * 100)}%</p>
                </div>
              ))}
            </div>
            {detail.role === 'trainer' ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-[#A1A1AA]">
                Member feedback: {detail.feedbackBreakdown?.reviewCount || 0} reviews · {detail.averageRating || 0}/5
                {' · '}confidence {Math.round(Number(detail.feedbackBreakdown?.confidence || 0) * 100)}%
                {' · '}adjusted score {detail.feedbackBreakdown?.score || 0}
                <p className="mt-2 text-xs">Trainer objective = 70% training operations + 30% confidence-adjusted feedback. Full feedback weight requires 5 reviews.</p>
              </div>
            ) : null}
            <h3 className="mt-7 text-xl font-bold text-white">Review history</h3>
            <div className="mt-3 space-y-2">
              {(detail.history || []).map((review: any) => <div key={review.performance_review_id} className="rounded-xl border border-white/10 p-3 text-sm text-[#A1A1AA]">{review.period_start} – {review.period_end}: <strong className="text-white">{Number(review.final_score || 0).toFixed(2)}</strong> · {review.comment || 'No comment'}</div>)}
              {!detail.history?.length ? <p className="text-sm text-[#A1A1AA]">No saved reviews yet.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {reviewTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setReviewTarget(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-7" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between"><div><h2 className="text-2xl font-bold text-white">{reviewTarget.review ? 'Edit' : 'Create'} Performance Review</h2><p className="text-[#A1A1AA]">{reviewTarget.employeeName}</p></div><Star className="text-[#EF233C]" /></div>
            <label className="mt-6 block text-sm font-bold text-[#A1A1AA]">Admin score (0–100)<input type="number" min="0" max="100" value={adminScore} onChange={(event) => setAdminScore(event.target.value)} className="mt-2 w-full rounded-xl border border-[#EF233C]/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#EF233C]" /></label>
            <label className="mt-4 block text-sm font-bold text-[#A1A1AA]">Comment<textarea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-[#EF233C]/20 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#EF233C]" /></label>
            <div className="mt-6 flex justify-end gap-3"><button onClick={() => setReviewTarget(null)} className="rounded-xl border border-white/10 px-5 py-3 text-white">Cancel</button><button disabled={saving} onClick={() => void saveReview()} className="rounded-xl bg-[#EF233C] px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Review'}</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
