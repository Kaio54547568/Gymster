import { useEffect, useMemo, useState } from 'react';
import { Star, Award, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPerformanceData } from '../../../services/adminDataApi';

type PerformanceRow = {
  maNV: string;
  hoTen: string;
  reviewId: string;
  diemSo: number;
  nhanXet: string;
  date: string;
  grade: string;
  avatar: string;
};

export default function PerformanceEvaluation() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<PerformanceRow | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceRow[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<Array<{ month: string; score: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchPerformanceData().then(({ data, error }) => {
      if (!isMounted) return;
      setPerformanceData(data?.performanceData || []);
      setPerformanceTrend(data?.performanceTrend || []);
      setLoadMessage(error ? 'Performance reviews could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const getGradeColor = (grade: string) => {
    if (grade === 'Excellent') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (grade === 'Good') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    return 'bg-[#A1A1AA]/10 border-[#A1A1AA]/30 text-[#A1A1AA]';
  };

  const avgScore = useMemo(() => {
    if (!performanceData.length) return 0;
    return performanceData.reduce((sum, p) => sum + p.diemSo, 0) / performanceData.length;
  }, [performanceData]);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">PERFORMANCE EVALUATION</h1>
          <p className="text-[#A1A1AA]">Đánh giá hiệu suất nhân viên</p>
        </div>
        <button onClick={() => setShowReviewModal(true)} className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Star className="w-5 h-5" />
          Add Evaluation
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading performance reviews...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 rounded-xl flex items-center justify-center border border-[#22C55E]/30">
              <Award className="w-7 h-7 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-[#A1A1AA] text-sm">Average Score</p>
              <h3 className="bebas text-3xl text-white tracking-wider">{avgScore.toFixed(1)}</h3>
            </div>
          </div>
          <p className="text-[#22C55E] text-sm font-semibold">Đánh giá</p>
        </div>
        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <p className="text-[#A1A1AA] text-sm">Reviews</p>
          <h3 className="bebas text-4xl text-white tracking-wider mt-2">{performanceData.length}</h3>
        </div>
        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <p className="text-[#A1A1AA] text-sm">Top Score</p>
          <h3 className="bebas text-4xl text-white tracking-wider mt-2">{Math.max(0, ...performanceData.map((item) => item.diemSo))}</h3>
        </div>
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={performanceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#A1A1AA" />
            <YAxis stroke="#A1A1AA" />
            <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="score" stroke="#EF233C" strokeWidth={3} dot={{ fill: '#EF233C', r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performanceData.map((employee) => (
          <div key={employee.reviewId} className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{employee.hoTen}</h3>
                <p className="text-[#A1A1AA]">{employee.maNV}</p>
              </div>
              <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getGradeColor(employee.grade)}`}>{employee.grade}</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-[#EF233C]/10 border border-[#EF233C]/30 flex items-center justify-center">
                <Target className="w-8 h-8 text-[#EF233C]" />
              </div>
              <div>
                <p className="bebas text-4xl text-white tracking-wider">{employee.diemSo}</p>
                <p className="text-[#A1A1AA] text-sm">{employee.date}</p>
              </div>
            </div>
            <p className="text-[#A1A1AA]">{employee.nhanXet || 'No review notes.'}</p>
            <button onClick={() => setSelectedEmployee(employee)} className="mt-5 w-full rounded-xl border border-[#EF233C]/30 px-4 py-3 font-semibold text-[#EF233C] transition hover:bg-[#EF233C] hover:text-white">
              View Review
            </button>
          </div>
        ))}
      </div>

      {!loading && !performanceData.length && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">No performance reviews found.</div>}

      {(showReviewModal || selectedEmployee) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { setShowReviewModal(false); setSelectedEmployee(null); }}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-8 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-3">{selectedEmployee ? selectedEmployee.hoTen : 'Performance Reviews'}</h2>
            <p className="text-[#A1A1AA]">{selectedEmployee?.nhanXet || 'Tạo và chỉnh sửa đánh giá hiệu suất cho nhân viên.'}</p>
            <button onClick={() => { setShowReviewModal(false); setSelectedEmployee(null); }} className="mt-6 w-full rounded-xl bg-[#EF233C] py-3 font-semibold text-white">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
