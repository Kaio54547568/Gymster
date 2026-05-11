import { FileText, Download, BarChart3, DollarSign, Users, Dumbbell, MessageSquare, Eye } from 'lucide-react';

const reports = [
  { id: 1, title: 'Báo Cáo Tài Chính', desc: 'Doanh thu, chi phí, lợi nhuận', icon: DollarSign, color: '#22C55E' },
  { id: 2, title: 'Báo Cáo Hội Viên', desc: 'Tăng trưởng, gói tập, demographics', icon: Users, color: '#EF233C' },
  { id: 3, title: 'Báo Cáo Hiệu Suất Nhân Viên', desc: 'Đánh giá, KPI, performance', icon: BarChart3, color: '#F97316' },
  { id: 4, title: 'Báo Cáo Thiết Bị', desc: 'Tình trạng, bảo trì, chi phí', icon: Dumbbell, color: '#990000' },
  { id: 5, title: 'Báo Cáo Phản Hồi', desc: 'Đánh giá khách hàng, satisfaction', icon: MessageSquare, color: '#EF233C' }
];

export default function ReportsStatistics() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">REPORTS & STATISTICS</h1>
        <p className="text-[#A1A1AA]">Báo cáo và thống kê tổng hợp</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 hover:border-[#EF233C]/50 transition-all hover:scale-105 cursor-pointer">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${report.color}20, ${report.color}10)`, border: `1px solid ${report.color}30` }}>
                  <Icon className="w-7 h-7" style={{ color: report.color }} />
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
    </div>
  );
}
