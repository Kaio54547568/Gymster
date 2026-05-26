import { useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { DollarSign, Users, UserPlus, AlertCircle, MessageSquare, BarChart3 } from 'lucide-react';
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
import { fetchExecutiveDashboardData } from '../../../services/adminDataApi';

function formatCompactVnd(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B VND`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M VND`;
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

export default function ExecutiveDashboard() {
  const [dashboard, setDashboard] = useState({
    totalRevenue: 0,
    totalMembers: 0,
    activeMembers: 0,
    openIssues: 0,
    feedbackCount: 0,
    revenueData: [] as Array<{ month: string; revenue: number }>,
    membershipData: [] as Array<{ month: string; members: number }>,
    packageDistribution: [] as Array<{ name: string; value: number; color: string }>,
    dailyRevenue: [] as Array<{ day: string; amount: number }>,
  });
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchExecutiveDashboardData().then(({ data, error }) => {
      if (!isMounted) return;
      if (data) setDashboard(data);
      setLoadMessage(error ? 'Dashboard data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-10 space-y-10">
      <div>
        <h1 className="bebas text-7xl text-white tracking-wider mb-3">EXECUTIVE DASHBOARD</h1>
        <p className="text-white/50 text-lg font-medium">Operational metrics</p>
      </div>

      {loading && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-white/50">Loading dashboard metrics...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <KPICard title="Total Revenue" value={formatCompactVnd(dashboard.totalRevenue)} icon={DollarSign} iconColor="#22C55E" />
        <KPICard title="Members" value={dashboard.totalMembers} icon={Users} iconColor="#EF233C" />
        <KPICard title="Active Members" value={dashboard.activeMembers} icon={UserPlus} iconColor="#22C55E" />
        <KPICard title="Open Issues" value={dashboard.openIssues} icon={AlertCircle} iconColor="#F97316" />
        <KPICard title="Feedback" value={dashboard.feedbackCount} icon={MessageSquare} iconColor="#EF233C" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Revenue" subtitle="Paid payments by month">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Membership Growth" subtitle="Members by join month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard.membershipData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Bar dataKey="members" fill="#EF233C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Package Distribution" subtitle="Member package rows">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={dashboard.packageDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {dashboard.packageDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily Revenue" subtitle="Paid payments by weekday">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboard.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="day" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Bar dataKey="amount" fill="#F97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {!loading && !dashboard.revenueData.length && !dashboard.membershipData.length && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">
          <BarChart3 className="mx-auto mb-3 h-8 w-8 text-[#EF233C]" />
          No dashboard data found.
        </div>
      )}
    </div>
  );
}
