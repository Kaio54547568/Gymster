import { useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { Users, UserPlus, UserX, Crown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchMembershipAnalyticsData } from '../../../services/adminDataApi';

export default function MembershipAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    vipMembers: 0,
    membershipGrowth: [] as Array<{ month: string; members: number }>,
    packageDistribution: [] as Array<{ name: string; value: number; color: string }>,
    ageGroups: [] as Array<{ age: string; count: number }>,
  });
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchMembershipAnalyticsData().then(({ data, error }) => {
      if (!isMounted) return;
      if (data) setAnalytics(data);
      setLoadMessage(error ? 'Membership analytics could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">MEMBERSHIP ANALYTICS</h1>
        <p className="text-[#A1A1AA]">Membership and package analytics</p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">
          Loading membership analytics...
        </div>
      )}
      {loadMessage && !loading && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">
          {loadMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Members" value={analytics.totalMembers} change="Updated" changeType="positive" icon={Users} iconColor="#EF233C" />
        <KPICard title="Active Members" value={analytics.activeMembers} change="Updated" changeType="positive" icon={UserPlus} iconColor="#22C55E" />
        <KPICard title="Expired Packages" value={analytics.expiredMembers} icon={UserX} iconColor="#F97316" />
        <KPICard title="VIP Members" value={analytics.vipMembers} icon={Crown} iconColor="#F97316" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Membership Growth" subtitle="Grouped by join date">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.membershipGrowth} id="membership-growth-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="members" stroke="#22C55E" strokeWidth={3} dot={{ fill: '#22C55E', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Package Distribution" subtitle="Current member packages">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="membership-package-dist-chart">
              <Pie data={analytics.packageDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} dataKey="value">
                {analytics.packageDistribution.map((entry, index) => (
                  <Cell key={`membership-package-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Member Age Groups" subtitle="Calculated from user birth dates">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.ageGroups} id="membership-age-chart">
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
