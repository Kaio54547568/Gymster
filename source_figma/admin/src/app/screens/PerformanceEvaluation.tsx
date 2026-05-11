import { useState } from 'react';
import { Star, TrendingUp, Award, Target } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  {
    maNV: 'NV001',
    hoTen: 'Nguyễn Minh PT',
    reviewId: 'REV-001',
    diemSo: 95,
    nhanXet: 'Xuất sắc trong huấn luyện khách hàng, thái độ nhiệt tình',
    date: '01/05/2026',
    grade: 'Xuất sắc',
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  {
    maNV: 'NV002',
    hoTen: 'Trần Hoàng',
    reviewId: 'REV-002',
    diemSo: 92,
    nhanXet: 'Kỹ năng bán hàng tốt, đạt doanh số cao',
    date: '01/05/2026',
    grade: 'Xuất sắc',
    avatar: 'https://i.pravatar.cc/150?img=33'
  },
  {
    maNV: 'NV003',
    hoTen: 'Lê Thị Hằng',
    reviewId: 'REV-003',
    diemSo: 89,
    nhanXet: 'Chuyên môn yoga tốt, cần cải thiện quản lý thời gian',
    date: '01/05/2026',
    grade: 'Giỏi',
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    maNV: 'NV004',
    hoTen: 'Phạm Văn Dũng',
    reviewId: 'REV-004',
    diemSo: 94,
    nhanXet: 'Hiệu quả cao trong các lớp HIIT, rất được khách yêu thích',
    date: '01/05/2026',
    grade: 'Xuất sắc',
    avatar: 'https://i.pravatar.cc/150?img=51'
  },
  {
    maNV: 'NV005',
    hoTen: 'Hoàng Văn Nam',
    reviewId: 'REV-005',
    diemSo: 87,
    nhanXet: 'Dịch vụ khách hàng tốt, cần nâng cao kỹ năng xử lý tình huống',
    date: '01/05/2026',
    grade: 'Giỏi',
    avatar: 'https://i.pravatar.cc/150?img=15'
  }
];

const performanceTrend = [
  { month: 'T1', score: 85 },
  { month: 'T2', score: 88 },
  { month: 'T3', score: 90 },
  { month: 'T4', score: 92 },
  { month: 'T5', score: 91 }
];

export default function PerformanceEvaluation() {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const getGradeColor = (grade: string) => {
    if (grade === 'Xuất sắc') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (grade === 'Giỏi') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    return 'bg-[#A1A1AA]/10 border-[#A1A1AA]/30 text-[#A1A1AA]';
  };

  const avgScore = performanceData.reduce((sum, p) => sum + p.diemSo, 0) / performanceData.length;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">PERFORMANCE EVALUATION</h1>
          <p className="text-[#A1A1AA]">Đánh giá hiệu suất nhân viên</p>
        </div>
        <button
          onClick={() => setShowReviewModal(true)}
          className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2"
        >
          <Star className="w-5 h-5" />
          Thêm Đánh Giá
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/10 rounded-xl flex items-center justify-center border border-[#22C55E]/30">
              <Award className="w-7 h-7 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-[#A1A1AA] text-sm">Điểm TB Toàn Bộ</p>
              <h3 className="bebas text-3xl text-white tracking-wider">{avgScore.toFixed(1)}</h3>
            </div>
          </div>
          <p className="text-[#22C55E] text-sm font-semibold">+3.2% vs tháng trước</p>
        </div>

        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#EF233C]/20 to-[#EF233C]/10 rounded-xl flex items-center justify-center border border-[#EF233C]/30">
              <Star className="w-7 h-7 text-[#EF233C]" />
            </div>
            <div>
              <p className="text-[#A1A1AA] text-sm">Nhân Viên Xuất Sắc</p>
              <h3 className="bebas text-3xl text-white tracking-wider">
                {performanceData.filter(p => p.grade === 'Xuất sắc').length}
              </h3>
            </div>
          </div>
          <p className="text-[#22C55E] text-sm font-semibold">60% tổng số</p>
        </div>

        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#F97316]/20 to-[#F97316]/10 rounded-xl flex items-center justify-center border border-[#F97316]/30">
              <Target className="w-7 h-7 text-[#F97316]" />
            </div>
            <div>
              <p className="text-[#A1A1AA] text-sm">Cần Cải Thiện</p>
              <h3 className="bebas text-3xl text-white tracking-wider">
                {performanceData.filter(p => p.diemSo < 90).length}
              </h3>
            </div>
          </div>
          <p className="text-[#F97316] text-sm font-semibold">Đào tạo thêm</p>
        </div>
      </div>

      {/* Performance Trend */}
      <ChartCard title="Xu Hướng Hiệu Suất" subtitle="5 tháng gần nhất">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceTrend} id="performance-trend-chart">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="month" stroke="#A1A1AA" />
            <YAxis stroke="#A1A1AA" domain={[80, 100]} />
            <Tooltip
              contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#22C55E"
              strokeWidth={3}
              dot={{ fill: '#22C55E', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Performance Reviews */}
      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Đánh Giá Hiệu Suất</h3>
        <div className="space-y-4">
          {performanceData.map((review) => (
            <div
              key={review.reviewId}
              className="bg-[#050607] border border-[#EF233C]/10 rounded-xl p-6 hover:border-[#EF233C]/30 transition-colors"
            >
              <div className="flex items-start gap-6">
                <img
                  src={review.avatar}
                  alt={review.hoTen}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[#EF233C]"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{review.hoTen}</h4>
                      <p className="text-[#A1A1AA] text-sm">Mã NV: {review.maNV} • {review.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={`${review.reviewId}-star-${i}`}
                            className={`w-5 h-5 ${
                              i < Math.floor(review.diemSo / 20)
                                ? 'fill-[#F97316] text-[#F97316]'
                                : 'text-[#333]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="bebas text-3xl text-white">{review.diemSo}/100</span>
                    </div>
                  </div>

                  <p className="text-white mb-3">{review.nhanXet}</p>

                  <div className="flex items-center justify-between">
                    <span className={`px-4 py-2 border rounded-lg text-sm font-semibold ${getGradeColor(review.grade)}`}>
                      {review.grade}
                    </span>
                    <button className="px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Review Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-[#0c1014] border border-[#EF233C]/30 rounded-3xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bebas text-4xl text-white tracking-wider mb-6">THÊM ĐÁNH GIÁ</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[#A1A1AA] mb-2">Chọn nhân viên</label>
                <select className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]">
                  {performanceData.map((emp) => (
                    <option key={emp.maNV} value={emp.maNV}>{emp.hoTen}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-2">Điểm số (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="85"
                  className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]"
                />
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-2">Nhận xét</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nhận xét đánh giá..."
                  className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
                Lưu đánh giá
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-6 py-3 bg-[#050607] text-white rounded-xl hover:bg-[#0c1014] transition-colors font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
