import { useEffect, useState } from 'react';
import { Download, BarChart3, DollarSign, Users, Dumbbell, MessageSquare, Eye } from 'lucide-react';
import { fetchReportCards } from '../../../services/adminDataApi';

const iconMap = {
  finance: DollarSign,
  members: Users,
  performance: BarChart3,
  equipment: Dumbbell,
  feedback: MessageSquare,
};

const colorMap = {
  finance: '#22C55E',
  members: '#EF233C',
  performance: '#F97316',
  equipment: '#990000',
  feedback: '#EF233C',
};

type ReportCard = {
  id: number;
  title: string;
  desc: string;
  key: keyof typeof iconMap;
};

export default function ReportsStatistics() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchReportCards().then(({ data, error }) => {
      if (!isMounted) return;
      setReports(data as ReportCard[]);
      setLoadMessage(error ? 'Report data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">REPORTS & STATISTICS</h1>
        <p className="text-[#A1A1AA]">Operational report groups</p>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading report data...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = iconMap[report.key] || BarChart3;
          const color = colorMap[report.key] || '#EF233C';
          return (
            <div key={report.id} className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 hover:border-[#EF233C]/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)`, border: `1px solid ${color}30` }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{report.title}</h3>
                  <p className="text-[#A1A1AA] text-sm">{report.desc}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button className="flex-1 px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button className="px-4 py-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && !reports.length && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">No report data found.</div>}
    </div>
  );
}
