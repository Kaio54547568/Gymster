import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import {
  DollarSign,
  Users,
  UserPlus,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Star,
  RefreshCw,
  Plus,
  FileText,
  CreditCard,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const revenueData = [
  { month: 'T1', revenue: 450 },
  { month: 'T2', revenue: 520 },
  { month: 'T3', revenue: 680 },
  { month: 'T4', revenue: 750 },
  { month: 'T5', revenue: 820 },
  { month: 'T6', revenue: 950 }
];

const membershipData = [
  { month: 'T1', members: 320 },
  { month: 'T2', members: 380 },
  { month: 'T3', members: 450 },
  { month: 'T4', members: 520 },
  { month: 'T5', members: 580 },
  { month: 'T6', members: 650 }
];

const packageDistribution = [
  { name: 'Gói 3 tháng', value: 35, color: '#EF233C' },
  { name: 'Gói 6 tháng', value: 30, color: '#FF2D2D' },
  { name: 'Gói VIP 12 tháng', value: 20, color: '#990000' },
  { name: 'Gói PT Elite', value: 15, color: '#F97316' }
];

const dailyRevenue = [
  { day: 'T2', amount: 35 },
  { day: 'T3', amount: 42 },
  { day: 'T4', amount: 38 },
  { day: 'T5', amount: 51 },
  { day: 'T6', amount: 49 },
  { day: 'T7', amount: 62 },
  { day: 'CN', amount: 55 }
];

export default function ExecutiveDashboard() {
  return (
    <div className="p-10 space-y-10">
      {/* Hero Banner */}
      <div className="relative h-96 rounded-[2rem] overflow-hidden shadow-float group">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=600&fit=crop"
            alt="Gym Background"
            className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-1000"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#EF233C]/30 via-[#990000]/20 to-transparent" />

        {/* Glow Effects */}
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EF233C]/20 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#990000]/15 blur-[120px] rounded-full" />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-center px-16">
          <h1 className="bebas text-8xl text-white tracking-wider mb-6 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text animate-in fade-in slide-in-from-left-8 duration-700">
            EXECUTIVE DASHBOARD
          </h1>
          <p className="text-2xl text-white/80 max-w-3xl font-medium leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
            Real-time overview of your gym business performance
          </p>
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
          title="Hội Viên Hoạt Động"
          value="650"
          change="+12.1%"
          changeType="positive"
          icon={Users}
          iconColor="#EF233C"
        />
        <KPICard
          title="Thành Viên Mới Hôm Nay"
          value="12"
          change="+8 hôm qua"
          changeType="positive"
          icon={UserPlus}
          iconColor="#FF2D2D"
        />
        <KPICard
          title="Lợi Nhuận Tháng"
          value="320 tr VNĐ"
          change="+18.5%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="#22C55E"
        />
        <KPICard
          title="Phản Hồi Chờ Xử Lý"
          value="8"
          change="-3 vs hôm qua"
          changeType="negative"
          icon={MessageSquare}
          iconColor="#F97316"
        />
        <KPICard
          title="Sự Cố Thiết Bị"
          value="3"
          change="Cần xử lý ngay"
          changeType="negative"
          icon={AlertCircle}
          iconColor="#EF233C"
        />
        <KPICard
          title="Hiệu Suất Nhân Viên"
          value="94.5%"
          change="+2.3%"
          changeType="positive"
          icon={Star}
          iconColor="#F97316"
        />
        <KPICard
          title="Tỷ Lệ Gia Hạn"
          value="87.2%"
          change="+5.1%"
          changeType="positive"
          icon={RefreshCw}
          iconColor="#22C55E"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth */}
        <ChartCard title="Tăng Trưởng Doanh Thu" subtitle="6 tháng gần nhất">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData} id="exec-revenue-chart">
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF233C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF233C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#EF233C"
                fillOpacity={1}
                fill="url(#revenueGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Membership Growth */}
        <ChartCard title="Tăng Trưởng Hội Viên" subtitle="6 tháng gần nhất">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={membershipData} id="exec-membership-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="members"
                stroke="#22C55E"
                strokeWidth={3}
                dot={{ fill: '#22C55E', r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Package Distribution */}
        <ChartCard title="Phân Bố Gói Tập" subtitle="Theo loại gói thành viên">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="exec-package-chart">
              <Pie
                data={packageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {packageDistribution.map((entry, index) => (
                  <Cell key={`exec-package-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Revenue */}
        <ChartCard title="Doanh Thu Hàng Ngày" subtitle="Tuần này">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue} id="exec-daily-revenue-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Bar dataKey="amount" fill="#EF233C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Actions */}
      <div className="glass border border-white/10 rounded-[2rem] p-10 shadow-float">
        <h3 className="text-3xl font-bold text-white mb-8 tracking-tight">Thao Tác Nhanh</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <button className="flex flex-col items-center gap-4 p-8 glass border border-white/10 rounded-3xl hover:scale-105 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EF233C]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#EF233C] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red relative z-10 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-sm text-center relative z-10">Thêm Hội Viên</span>
          </button>
          <button className="flex flex-col items-center gap-4 p-8 glass border border-white/10 rounded-3xl hover:scale-105 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#22C55E]/30 relative z-10 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-sm text-center relative z-10">Đăng Ký Gói</span>
          </button>
          <button className="flex flex-col items-center gap-4 p-8 glass border border-white/10 rounded-3xl hover:scale-105 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#F97316] to-[#ea580c] rounded-2xl flex items-center justify-center shadow-lg shadow-[#F97316]/30 relative z-10 group-hover:scale-110 transition-transform duration-300">
              <RefreshCw className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-sm text-center relative z-10">Gia Hạn Gói</span>
          </button>
          <button className="flex flex-col items-center gap-4 p-8 glass border border-white/10 rounded-3xl hover:scale-105 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#990000] to-[#7f0000] rounded-2xl flex items-center justify-center shadow-lg shadow-[#990000]/30 relative z-10 group-hover:scale-110 transition-transform duration-300">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-sm text-center relative z-10">Tạo Hóa Đơn</span>
          </button>
          <button className="flex flex-col items-center gap-4 p-8 glass border border-white/10 rounded-3xl hover:scale-105 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="w-16 h-16 bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#22C55E]/30 relative z-10 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <span className="text-white font-bold text-sm text-center relative z-10">Xem Báo Cáo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
