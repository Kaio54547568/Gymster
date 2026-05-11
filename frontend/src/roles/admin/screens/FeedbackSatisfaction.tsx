import { MessageSquare, Smile, Meh, Frown, UserCheck } from 'lucide-react';
import KPICard from '../components/KPICard';

const feedbackData = [
  { id: 'FB-001', member: 'Nguyễn Văn A', feedback: 'Dịch vụ tuyệt vời, PT rất nhiệt tình', category: 'Dịch vụ', status: 'Resolved', staff: 'Nguyễn Minh PT', date: '08/05/2026', type: 'positive' },
  { id: 'FB-002', member: 'Trần Thị B', feedback: 'Điều hòa phòng gym quá lạnh', category: 'Cơ sở vật chất', status: 'Processing', staff: 'Hoàng Văn Nam', date: '07/05/2026', type: 'negative' },
  { id: 'FB-003', member: 'Lê Văn C', feedback: 'Giá cả hợp lý, thiết bị hiện đại', category: 'Giá cả', status: 'Resolved', staff: 'Trần Hoàng', date: '06/05/2026', type: 'positive' },
  { id: 'FB-004', member: 'Phạm Thị D', feedback: 'Cần thêm máy chạy bộ', category: 'Thiết bị', status: 'Pending', staff: '', date: '08/05/2026', type: 'neutral' },
  { id: 'FB-005', member: 'Hoàng Văn E', feedback: 'Lớp yoga rất chất lượng', category: 'Dịch vụ', status: 'Resolved', staff: 'Lê Thị Hằng', date: '05/05/2026', type: 'positive' }
];

export default function FeedbackSatisfaction() {
  const total = feedbackData.length;
  const positive = feedbackData.filter(f => f.type === 'positive').length;
  const negative = feedbackData.filter(f => f.type === 'negative').length;
  const neutral = feedbackData.filter(f => f.type === 'neutral').length;
  const satisfaction = ((positive / total) * 100).toFixed(1);

  const getStatusColor = (status: string) => {
    if (status === 'Resolved') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (status === 'Processing') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    return 'bg-[#EF233C]/10 border-[#EF233C]/30 text-[#EF233C]';
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">FEEDBACK & SATISFACTION</h1>
        <p className="text-[#A1A1AA]">Phản hồi và đánh giá khách hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Tổng Phản Hồi" value={total} icon={MessageSquare} iconColor="#EF233C" />
        <KPICard title="Tích Cực" value={positive} change={`${((positive/total)*100).toFixed(0)}%`} changeType="positive" icon={Smile} iconColor="#22C55E" />
        <KPICard title="Trung Lập" value={neutral} icon={Meh} iconColor="#F97316" />
        <KPICard title="Tiêu Cực" value={negative} icon={Frown} iconColor="#EF233C" />
        <KPICard title="Độ Hài Lòng" value={`${satisfaction}%`} change="+5.2%" changeType="positive" icon={Smile} iconColor="#22C55E" />
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Danh Sách Phản Hồi</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Mã</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Khách hàng</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Phản hồi</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Danh mục</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Trạng thái</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Nhân viên</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Ngày</th>
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
                    <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(fb.status)}`}>
                      {fb.status === 'Resolved' ? 'Đã xử lý' : fb.status === 'Processing' ? 'Đang xử lý' : 'Chờ xử lý'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{fb.staff || '--'}</td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{fb.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
