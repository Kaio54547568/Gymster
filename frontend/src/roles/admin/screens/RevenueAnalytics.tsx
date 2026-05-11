import { useState } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import {
  DollarSign,
  TrendingUp,
  Download,
  FileDown,
  Printer,
  Calendar,
  CreditCard,
  Wallet
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const monthlyRevenue = [
  { month: 'T1', revenue: 450 },
  { month: 'T2', revenue: 520 },
  { month: 'T3', revenue: 680 },
  { month: 'T4', revenue: 750 },
  { month: 'T5', revenue: 820 },
  { month: 'T6', revenue: 950 }
];

const revenueByPaymentMethod = [
  { name: 'Tiền mặt', value: 35, color: '#22C55E' },
  { name: 'Chuyển khoản', value: 45, color: '#EF233C' },
  { name: 'Thẻ tín dụng', value: 15, color: '#F97316' },
  { name: 'Ví điện tử', value: 5, color: '#990000' }
];

const revenueByPackage = [
  { package: 'Gói 3 tháng', revenue: 280 },
  { package: 'Gói 6 tháng', revenue: 320 },
  { package: 'Gói VIP 12 tháng', revenue: 220 },
  { package: 'Gói PT Elite', revenue: 130 }
];

const invoiceData = [
  { invoiceId: 'INV-2024-001', amount: '2,500,000', date: '08/05/2026', packageType: 'Gói 3 tháng', employee: 'Nguyễn Minh PT', method: 'Chuyển khoản', status: 'Đã thanh toán' },
  { invoiceId: 'INV-2024-002', amount: '4,500,000', date: '08/05/2026', packageType: 'Gói 6 tháng', employee: 'Trần Hoàng', method: 'Tiền mặt', status: 'Đã thanh toán' },
  { invoiceId: 'INV-2024-003', amount: '8,000,000', date: '07/05/2026', packageType: 'Gói VIP 12 tháng', employee: 'Lê Thị Hằng', method: 'Thẻ tín dụng', status: 'Đã thanh toán' },
  { invoiceId: 'INV-2024-004', amount: '12,000,000', date: '07/05/2026', packageType: 'Gói PT Elite', employee: 'Phạm Văn Dũng', method: 'Chuyển khoản', status: 'Đã thanh toán' },
  { invoiceId: 'INV-2024-005', amount: '2,500,000', date: '06/05/2026', packageType: 'Gói 3 tháng', employee: 'Nguyễn Minh PT', method: 'Ví điện tử', status: 'Chờ xử lý' }
];

const employeeRevenue = [
  { name: 'Nguyễn Minh PT', revenue: '85,500,000', contracts: 34, ranking: 1, contribution: '28%' },
  { name: 'Trần Hoàng', revenue: '72,300,000', contracts: 29, ranking: 2, contribution: '24%' },
  { name: 'Lê Thị Hằng', revenue: '68,900,000', contracts: 27, ranking: 3, contribution: '23%' },
  { name: 'Phạm Văn Dũng', revenue: '56,200,000', contracts: 22, ranking: 4, contribution: '19%' },
  { name: 'Hoàng Văn Nam', revenue: '45,100,000', contracts: 18, ranking: 5, contribution: '15%' }
];

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div className="p-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-7xl text-white tracking-wider mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text">
            REVENUE ANALYTICS
          </h1>
          <p className="text-white/50 text-lg font-medium">Phân tích chi tiết doanh thu và tài chính</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex items-center gap-4 glass border border-white/10 rounded-2xl px-6 py-4">
          <Calendar className="w-6 h-6 text-[#EF233C]" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer text-base font-semibold"
          >
            <option value="today" className="bg-[#0c1014]">Hôm nay</option>
            <option value="week" className="bg-[#0c1014]">Tuần này</option>
            <option value="month" className="bg-[#0c1014]">Tháng này</option>
            <option value="quarter" className="bg-[#0c1014]">Quý này</option>
            <option value="year" className="bg-[#0c1014]">Năm này</option>
            <option value="custom" className="bg-[#0c1014]">Tùy chỉnh</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tổng Doanh Thu"
          value="950 tr VNĐ"
          change="+15.3%"
          changeType="positive"
          icon={DollarSign}
          iconColor="#22C55E"
        />
        <KPICard
          title="Doanh Thu Hôm Nay"
          value="45 tr VNĐ"
          change="+8.2%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="#EF233C"
        />
        <KPICard
          title="Doanh Thu Tháng"
          value="950 tr VNĐ"
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          iconColor="#F97316"
        />
        <KPICard
          title="Doanh Thu Năm"
          value="5.2 tỷ VNĐ"
          change="+18.7%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="#22C55E"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Growth */}
        <ChartCard
          title="Tăng Trưởng Doanh Thu Tháng"
          subtitle="6 tháng gần nhất"
          action={
            <button className="px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue} id="revenue-monthly-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#EF233C"
                strokeWidth={3}
                dot={{ fill: '#EF233C', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by Payment Method */}
        <ChartCard title="Doanh Thu Theo Phương Thức Thanh Toán">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="revenue-payment-method-chart">
              <Pie
                data={revenueByPaymentMethod}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {revenueByPaymentMethod.map((entry, index) => (
                  <Cell key={`revenue-payment-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by Package Type */}
        <ChartCard title="Doanh Thu Theo Loại Gói" subtitle="Phân tích theo gói tập">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPackage} id="revenue-package-type-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="package" stroke="#A1A1AA" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Bar dataKey="revenue" fill="#EF233C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Invoice / Payment Table */}
      <div className="glass border border-white/10 rounded-[2rem] p-8 shadow-float">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-white tracking-tight">Danh Sách Hóa Đơn</h3>
          <div className="flex gap-3">
            <button className="px-6 py-3 glass border border-white/10 text-white rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 text-sm font-semibold flex items-center gap-2 group">
              <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Download PDF
            </button>
            <button className="px-6 py-3 glass border border-white/10 text-white rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 text-sm font-semibold flex items-center gap-2 group">
              <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Print Report
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-4 px-6 py-4">
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Mã HĐ</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Số tiền</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Ngày</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Loại gói</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Nhân viên</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Phương thức</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Trạng thái</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Thao tác</div>
          </div>

          {/* Data Rows */}
          {invoiceData.map((invoice) => (
            <div
              key={invoice.invoiceId}
              className="grid grid-cols-8 gap-4 px-6 py-5 glass border border-white/5 rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 group cursor-pointer"
            >
              <div className="flex items-center text-white font-bold">{invoice.invoiceId}</div>
              <div className="flex items-center text-[#22C55E] font-bold text-lg">{invoice.amount} VNĐ</div>
              <div className="flex items-center text-white/70">{invoice.date}</div>
              <div className="flex items-center text-white font-medium">{invoice.packageType}</div>
              <div className="flex items-center text-white/70">{invoice.employee}</div>
              <div className="flex items-center">
                <span className="px-4 py-2 glass border border-[#EF233C]/30 rounded-xl text-[#EF233C] text-xs font-bold shadow-lg shadow-[#EF233C]/20">
                  {invoice.method}
                </span>
              </div>
              <div className="flex items-center">
                <span
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${
                    invoice.status === 'Đã thanh toán'
                      ? 'glass border border-[#22C55E]/30 text-[#22C55E] shadow-[#22C55E]/20'
                      : 'glass border border-[#F97316]/30 text-[#F97316] shadow-[#F97316]/20'
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <div className="flex items-center">
                <button className="text-[#EF233C] hover:text-white font-bold text-sm group-hover:scale-110 transition-transform">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Revenue Performance */}
      <div className="glass border border-white/10 rounded-[2rem] p-8 shadow-float">
        <h3 className="text-3xl font-bold text-white mb-8 tracking-tight">Doanh Thu Theo Nhân Viên</h3>
        <div className="space-y-5">
          {employeeRevenue.map((employee) => (
            <div
              key={employee.name}
              className="flex items-center gap-8 p-6 glass border border-white/10 rounded-3xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden"
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#EF233C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Ranking Badge */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red relative z-10 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-black text-2xl">#{employee.ranking}</span>
              </div>

              {/* Employee Info */}
              <div className="flex-1 relative z-10">
                <h4 className="text-white font-bold text-xl mb-2">{employee.name}</h4>
                <p className="text-white/50 text-sm font-medium">{employee.contracts} hợp đồng</p>
              </div>

              {/* Revenue Info */}
              <div className="text-right relative z-10">
                <p className="text-[#22C55E] font-black text-2xl mb-1">{employee.revenue} VNĐ</p>
                <p className="text-white/50 text-sm font-medium">Đóng góp: <span className="text-[#EF233C] font-bold">{employee.contribution}</span></p>
              </div>

              {/* Action Button */}
              <button className="px-6 py-3 bg-gradient-to-r from-[#EF233C] to-[#990000] text-white rounded-2xl hover:scale-105 transition-all duration-300 text-sm font-bold shadow-glow-red relative z-10">
                Chi tiết
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
