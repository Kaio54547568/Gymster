import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Smile, Meh, Frown } from 'lucide-react';
import KPICard from '../components/KPICard';
import { fetchFeedbackSatisfactionData } from '../../../services/adminDataApi';

type FeedbackRow = {
  id: string;
  member: string;
  feedback: string;
  category: string;
  status: string;
  staff: string;
  date: string;
  type: string;
};

export default function FeedbackSatisfaction() {
  const [feedbackData, setFeedbackData] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchFeedbackSatisfactionData().then(({ data, error }) => {
      if (!isMounted) return;
      setFeedbackData(data);
      setLoadMessage(error ? 'Feedback data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const total = feedbackData.length;
    const positive = feedbackData.filter(f => f.type === 'positive').length;
    const negative = feedbackData.filter(f => f.type === 'negative').length;
    const neutral = feedbackData.filter(f => f.type === 'neutral').length;
    const satisfaction = total ? ((positive / total) * 100).toFixed(1) : '0.0';
    return { total, positive, negative, neutral, satisfaction };
  }, [feedbackData]);

  const getStatusColor = (status: string) => {
    if (status === 'Resolved') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (status === 'Processing') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    return 'bg-[#EF233C]/10 border-[#EF233C]/30 text-[#EF233C]';
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">FEEDBACK & SATISFACTION</h1>
        <p className="text-[#A1A1AA]">Phản hồi và khiếu nại của hội viên</p>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading feedback...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Total Feedback" value={summary.total} icon={MessageSquare} iconColor="#EF233C" />
        <KPICard title="Positive" value={summary.positive} change={`${summary.total ? ((summary.positive/summary.total)*100).toFixed(0) : 0}%`} changeType="positive" icon={Smile} iconColor="#22C55E" />
        <KPICard title="Neutral" value={summary.neutral} icon={Meh} iconColor="#F97316" />
        <KPICard title="Negative" value={summary.negative} icon={Frown} iconColor="#EF233C" />
        <KPICard title="Satisfaction" value={`${summary.satisfaction}%`} change="Cập nhật" changeType="positive" icon={Smile} iconColor="#22C55E" />
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Feedback List</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">ID</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Member</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Feedback</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Category</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Status</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData.map((fb) => (
                <tr key={fb.id} className="border-b border-[#EF233C]/10 hover:bg-[#EF233C]/5 transition-colors">
                  <td className="py-4 px-4 text-white font-semibold">{fb.id}</td>
                  <td className="py-4 px-4 text-white">{fb.member}</td>
                  <td className="py-4 px-4 text-[#A1A1AA] max-w-xs">{fb.feedback}</td>
                  <td className="py-4 px-4 text-white">{fb.category}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(fb.status)}`}>{fb.status}</span>
                  </td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{fb.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !feedbackData.length && <div className="p-8 text-center text-[#A1A1AA]">No feedback or complaints yet.</div>}
      </div>
    </div>
  );
}
