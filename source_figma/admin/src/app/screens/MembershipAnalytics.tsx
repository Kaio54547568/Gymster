import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { Users, UserPlus, UserX, Crown, TrendingUp, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const membershipGrowth = [
  { month: 'T1', members: 520 },
  { month: 'T2', members: 580 },
  { month: 'T3', members: 610 },
  { month: 'T4', members: 640 },
  { month: 'T5', members: 650 },
  { month: 'T6', members: 680 }
];

const packageDistribution = [
  { name: 'Gói 3 tháng', value: 250, color: '#EF233C' },
  { name: 'Gói 6 tháng', value: 220, color: '#FF2D2D' },
  { name: 'Gói VIP 12 tháng', value: 150, color: '#990000' },
  { name: 'Gói PT Elite', value: 60, color: '#F97316' }
];

const ageDemo = [
  { age: '18-25', count: 180 },
  { age: '26-35', count: 280 },
  { age: '36-45', count: 150 },
  { age: '46+', count: 40 }
];

export default function MembershipAnalytics() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">MEMBERSHIP ANALYTICS</h1>
        <p className="text-[#A1A1AA]">Membership and package analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Tổng Hội Viên" value="680" change="+30 tháng này" changeType="positive" icon={Users} iconColor="#EF233C" />
        <KPICard title="Hội Viên Hoạt Động" value="650" change="+5%" changeType="positive" icon={UserPlus} iconColor="#22C55E" />
        <KPICard title="Hết Hạn" value="30" icon={UserX} iconColor="#F97316" />
        <KPICard title="VIP Members" value="60" icon={Crown} iconColor="#F97316" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tăng Trưởng Hội Viên" subtitle="6 tháng gần nhất">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={membershipGrowth} id="membership-growth-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="members" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Phân Bố Theo Gói" subtitle="Theo loại gói thành viên">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="membership-package-dist-chart">
              <Pie data={packageDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} dataKey="value">
                {packageDistribution.map((entry, index) => (
                  <Cell key={`membership-package-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Độ Tuổi Hội Viên" subtitle="Phân tích theo nhóm tuổi">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageDemo} id="membership-age-demo-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="age" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#EF233C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
