import { useEffect, useMemo, useState } from 'react';
import { FileWarning, ListFilter, MessageSquare, Star } from 'lucide-react';
import KPICard from '../components/KPICard';
import { fetchFeedbackReportData } from '../../../services/adminDataApi';

type FeedbackReportRow = {
  id: string;
  memberName: string;
  relatedPerson: string;
  contentType: 'Feedback' | 'Report';
  content: string;
  rating: number | null;
  status: string;
  createdDate: string;
};

type TypeFilter = 'All' | 'Feedback' | 'Report';

export default function FeedbackSatisfaction() {
  const [feedbackData, setFeedbackData] = useState<FeedbackReportRow[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchFeedbackReportData().then(({ data, error }) => {
      if (!isMounted) return;
      setFeedbackData(data);
      setLoadMessage(error ? 'Feedback and report data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = feedbackData.length;
    const feedback = feedbackData.filter((item) => item.contentType === 'Feedback').length;
    const report = feedbackData.filter((item) => item.contentType === 'Report').length;
    const rated = feedbackData.filter((item) => typeof item.rating === 'number');
    const averageRating = rated.length
      ? (rated.reduce((sum, item) => sum + Number(item.rating || 0), 0) / rated.length).toFixed(1)
      : '0.0';
    return { total, feedback, report, averageRating };
  }, [feedbackData]);

  const filteredRows = useMemo(() => (
    typeFilter === 'All' ? feedbackData : feedbackData.filter((item) => item.contentType === typeFilter)
  ), [feedbackData, typeFilter]);

  const getStatusColor = (status: string) => {
    if (status === 'Resolved') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (status === 'Processing') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    if (status === 'Rejected') return 'bg-white/10 border-white/20 text-white/60';
    return 'bg-[#EF233C]/10 border-[#EF233C]/30 text-[#EF233C]';
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">FEEDBACK & REPORT</h1>
        <p className="text-[#A1A1AA]">Member feedback, workout ratings, and member reports.</p>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading feedback and reports...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Items" value={summary.total} icon={MessageSquare} iconColor="#EF233C" />
        <KPICard title="Feedback" value={summary.feedback} icon={MessageSquare} iconColor="#22C55E" />
        <KPICard title="Reports" value={summary.report} icon={FileWarning} iconColor="#F97316" />
        <KPICard title="Avg Rating" value={summary.averageRating} icon={Star} iconColor="#FACC15" />
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-2xl font-bold text-white">Feedback & Report List</h3>
          <div className="flex items-center gap-3">
            <ListFilter className="h-5 w-5 text-[#EF233C]" />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-2 text-sm font-bold text-white outline-none focus:border-[#EF233C]"
            >
              <option value="All">All</option>
              <option value="Feedback">Feedback</option>
              <option value="Report">Report</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Member name</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Trainer/Staff</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Type</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Content</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Rating</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Status</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item.id} className="border-b border-[#EF233C]/10 hover:bg-[#EF233C]/5 transition-colors">
                  <td className="py-4 px-4 text-white">{item.memberName}</td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{item.relatedPerson}</td>
                  <td className="py-4 px-4">
                    <span className={`rounded-lg border px-3 py-1 text-xs font-bold ${item.contentType === 'Feedback' ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]' : 'border-[#F97316]/30 bg-[#F97316]/10 text-[#F97316]'}`}>
                      {item.contentType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#A1A1AA] max-w-md">{item.content}</td>
                  <td className="py-4 px-4 text-white">{item.rating ?? 'N/A'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{item.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !filteredRows.length && <div className="p-8 text-center text-[#A1A1AA]">No feedback or reports yet.</div>}
      </div>
    </div>
  );
}
