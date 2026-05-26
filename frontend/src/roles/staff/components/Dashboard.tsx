import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Users, UserPlus, RefreshCw, MessageSquare, AlertTriangle, DollarSign, TrendingUp, Dumbbell, Crown, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchStaffDashboardData } from '../../../services/staffDashboardApi';

const emptyDashboardData = {
  stats: {
    totalActiveMembers: 0,
    newMembersThisMonth: 0,
    renewalsThisMonth: 0,
    pendingFeedback: 0,
  },
  cards: {
    premiumMembers: 0,
    attentionRequired: 0,
    revenueThisMonth: 0,
    revenueThisMonthText: '0 VND',
  },
  membershipGrowth: [],
  renewalAnalytics: [],
  revenueStatistics: [],
  packageDistribution: [],
};

export function Dashboard() {
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setIsLoading(true);
      const data = await fetchStaffDashboardData();
      if (!isMounted) return;
      setDashboardData(data);
      setIsLoading(false);
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      title: 'Total Active Members',
      value: String(dashboardData.stats.totalActiveMembers),
      change: 'DB',
      icon: Users,
      color: 'from-primary to-destructive',
    },
    {
      title: 'New Members This Month',
      value: String(dashboardData.stats.newMembersThisMonth),
      change: 'Month',
      icon: UserPlus,
      color: 'from-primary to-destructive',
    },
    {
      title: 'Renewals This Month',
      value: String(dashboardData.stats.renewalsThisMonth),
      change: 'Month',
      icon: RefreshCw,
      color: 'from-primary to-destructive',
    },
    {
      title: 'Pending Feedback',
      value: String(dashboardData.stats.pendingFeedback),
      change: 'Open',
      icon: MessageSquare,
      color: 'from-primary to-destructive',
    },
  ];

  return (
    <div className="relative">
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkdW1iYmVsbCUyMGRhcmt8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury Gym"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/70" />
        </div>

        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-destructive rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.6)] animate-pulse">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                  MANAGEMENT DASHBOARD
                </h1>
                <p className="text-xl text-white/80 font-medium">Welcome back, Staff • {new Date().toLocaleDateString('vi-VN')}</p>
                {isLoading && <p className="mt-2 text-sm font-semibold text-white/50">Loading dashboard metrics...</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={`hero-stat-${stat.title}-${index}`}
                    className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(255,0,0,0.4)] transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-bold bg-primary/30 text-primary backdrop-blur-sm">
                        {stat.change}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black mb-1 text-white">{stat.value}</h3>
                    <p className="text-sm text-white/70 font-medium">{stat.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkYXJrfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Athletic Training"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium Members</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{dashboardData.cards.premiumMembers}</h3>
                <p className="text-white/80 text-sm mb-4">Active premium members</p>
                <Link to="/staff/members" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm border border-primary/50 text-white rounded-lg hover:bg-primary hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all text-sm font-medium">
                  View Members
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkdW1iYmVsbCUyMGRhcmt8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Gym Equipment"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                  <span className="text-xs font-bold text-destructive uppercase tracking-wider">Attention Required</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Equipment Issues</h3>
                <p className="text-white/80 text-sm mb-4">{dashboardData.cards.attentionRequired} items need attention</p>
                <Link to="/staff/equipment" className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 backdrop-blur-sm border border-destructive/50 text-white rounded-lg hover:bg-destructive hover:shadow-[0_0_30px_rgba(179,0,0,0.6)] transition-all text-sm font-medium">
                  View Issues
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjbGFzcyUyMGdyb3VwfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Boxing Training"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Activity</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{dashboardData.cards.revenueThisMonthText}</h3>
                <p className="text-white/80 text-sm mb-4">Paid revenue this month</p>
                <Link to="/staff/history" className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm border border-primary/50 text-white rounded-lg hover:bg-primary hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all text-sm font-medium">
                  View Activity
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Membership Growth</h3>
                  <p className="text-sm text-muted-foreground">Last 5 months trend</p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={dashboardData.membershipGrowth} id="membership-growth-chart">
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF0000" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF0000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }} labelStyle={{ color: '#FFFFFF' }} />
                  <Area type="monotone" dataKey="members" stroke="#FF0000" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Renewal Analytics</h3>
                  <p className="text-sm text-muted-foreground">Monthly renewals</p>
                </div>
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData.renewalAnalytics} id="renewal-analytics-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }} labelStyle={{ color: '#FFFFFF' }} />
                  <Bar dataKey="renewals" fill="#FF0000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Revenue Statistics</h3>
                  <p className="text-sm text-muted-foreground">This week performance</p>
                </div>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboardData.revenueStatistics} id="revenue-statistics-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }} labelStyle={{ color: '#FFFFFF' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#FF0000" strokeWidth={3} dot={{ fill: '#FF3B3B', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Package Distribution</h3>
                <p className="text-sm text-muted-foreground">Current active packages</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart id="package-distribution-chart">
                  <Pie data={dashboardData.packageDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                    {dashboardData.packageDistribution.map((entry, index) => (
                      <Cell key={`package-cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {dashboardData.packageDistribution.length ? dashboardData.packageDistribution.map((pkg, index) => (
                  <div key={`package-legend-${pkg.name}-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,0,0,0.6)]" style={{ backgroundColor: pkg.color }} />
                      <span className="text-sm font-medium">{pkg.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{pkg.value}%</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No active package data yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
