import { Link } from 'react-router';
import { Users, UserPlus, RefreshCw, MessageSquare, AlertTriangle, DollarSign, TrendingUp, Activity, Dumbbell, Crown, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const stats = [
    {
      title: 'Total Active Members',
      value: '487',
      change: '+12%',
      icon: Users,
      color: 'from-primary to-destructive'
    },
    {
      title: 'New Members Today',
      value: '23',
      change: '+8',
      icon: UserPlus,
      color: 'from-primary to-destructive'
    },
    {
      title: 'Renewals This Month',
      value: '156',
      change: '+18%',
      icon: RefreshCw,
      color: 'from-primary to-destructive'
    },
    {
      title: 'Pending Feedback',
      value: '7',
      change: '-3',
      icon: MessageSquare,
      color: 'from-primary to-destructive'
    },
    {
      title: 'Equipment Issues',
      value: '3',
      change: 'Critical',
      icon: AlertTriangle,
      color: 'from-destructive to-primary'
    },
    {
      title: 'Revenue Today',
      value: '45.2M VND',
      change: '+24%',
      icon: DollarSign,
      color: 'from-primary to-destructive'
    }
  ];

  const membershipData = [
    { month: 'Jan', members: 420 },
    { month: 'Feb', members: 435 },
    { month: 'Mar', members: 448 },
    { month: 'Apr', members: 462 },
    { month: 'May', members: 487 }
  ];

  const renewalData = [
    { month: 'Jan', renewals: 120 },
    { month: 'Feb', renewals: 135 },
    { month: 'Mar', renewals: 142 },
    { month: 'Apr', renewals: 148 },
    { month: 'May', renewals: 156 }
  ];

  const revenueData = [
    { day: 'Mon', revenue: 35.5 },
    { day: 'Tue', revenue: 42.3 },
    { day: 'Wed', revenue: 38.7 },
    { day: 'Thu', revenue: 45.2 },
    { day: 'Fri', revenue: 52.8 },
    { day: 'Sat', revenue: 68.4 },
    { day: 'Sun', revenue: 71.2 }
  ];

  const packageDistribution = [
    { name: 'Basic', value: 45, color: '#FF0000' },
    { name: 'Premium', value: 35, color: '#FF3333' },
    { name: 'VIP Elite', value: 20, color: '#CC0000' }
  ];

  const quickActions = [
    { label: 'Add Member', icon: UserPlus, path: '/add-member', color: 'bg-primary' },
    { label: 'Renew Package', icon: RefreshCw, path: '/renew-package', color: 'bg-primary' },
    { label: 'Search History', icon: Activity, path: '/history', color: 'bg-primary' },
    { label: 'Report Equipment', icon: AlertTriangle, path: '/equipment', color: 'bg-destructive' }
  ];

  return (
    <div className="relative">
      {/* Hero Banner with Cinematic Gym Image */}
      <div className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkdW1iYmVsbCUyMGRhcmt8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Luxury Gym"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/70"></div>
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
                <p className="text-xl text-white/80 font-medium">Welcome back, Nguyễn Staff • {new Date().toLocaleDateString('vi-VN')}</p>
              </div>
            </div>

            {/* Quick Stats in Hero */}
            <div className="grid grid-cols-4 gap-4 mt-8">
              {stats.slice(0, 4).map((stat, index) => {
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
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${stat.change.includes('+') ? 'bg-primary/30 text-primary' : 'bg-destructive/30 text-destructive'} backdrop-blur-sm`}>
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
          {/* Premium Feature Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* VIP Members Spotlight */}
            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkYXJrfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Athletic Training"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium Members</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">VIP Elite Club</h3>
                <p className="text-white/80 text-sm mb-4">156 active premium members</p>
                <Link
                  to="/staff/members"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm border border-primary/50 text-white rounded-lg hover:bg-primary hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all text-sm font-medium"
                >
                  View Members
                </Link>
              </div>
            </div>

            {/* Equipment Status */}
            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBkdW1iYmVsbCUyMGRhcmt8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Gym Equipment"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                  <span className="text-xs font-bold text-destructive uppercase tracking-wider">Attention Required</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Equipment Issues</h3>
                <p className="text-white/80 text-sm mb-4">3 critical issues pending</p>
                <Link
                  to="/staff/equipment"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 backdrop-blur-sm border border-destructive/50 text-white rounded-lg hover:bg-destructive hover:shadow-[0_0_30px_rgba(179,0,0,0.6)] transition-all text-sm font-medium"
                >
                  View Issues
                </Link>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="relative overflow-hidden rounded-2xl h-[280px] group">
              <img
                src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjbGFzcyUyMGdyb3VwfGVufDB8fHx8MTczODAwMDAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Boxing Training"
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
              <div className="relative h-full p-6 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Live Activity</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">45.2M VND</h3>
                <p className="text-white/80 text-sm mb-4">Revenue today • +24%</p>
                <Link
                  to="/staff/history"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm border border-primary/50 text-white rounded-lg hover:bg-primary hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] transition-all text-sm font-medium"
                >
                  View Activity
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Membership Growth */}
            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Membership Growth</h3>
                  <p className="text-sm text-muted-foreground">Last 5 months trend</p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={membershipData} id="membership-growth-chart">
                  <defs>
                    <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF0000" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Area type="monotone" dataKey="members" stroke="#FF0000" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Renewal Analytics */}
            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Renewal Analytics</h3>
                  <p className="text-sm text-muted-foreground">Monthly renewals</p>
                </div>
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={renewalData} id="renewal-analytics-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="renewals" fill="#FF0000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue & Package Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Revenue Statistics */}
            <div className="lg:col-span-2 backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Revenue Statistics</h3>
                  <p className="text-sm text-muted-foreground">This week performance</p>
                </div>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData} id="revenue-statistics-chart">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#BDBDBD" />
                  <YAxis stroke="#BDBDBD" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#FF0000" strokeWidth={3} dot={{ fill: '#FF3B3B', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Package Distribution */}
            <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Package Distribution</h3>
                <p className="text-sm text-muted-foreground">Current members</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart id="package-distribution-chart">
                  <Pie
                    data={packageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {packageDistribution.map((entry, index) => (
                      <Cell key={`package-cell-${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#181818', border: '1px solid #FF0000', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {packageDistribution.map((pkg, index) => (
                  <div key={`package-legend-${pkg.name}-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,0,0,0.6)]" style={{ backgroundColor: pkg.color }}></div>
                      <span className="text-sm font-medium">{pkg.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{pkg.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] mt-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={`quick-action-${action.path}-${index}`}
                    to={action.path}
                    className={`${action.color} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all duration-300 group relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform relative z-10" />
                    <span className="text-sm font-bold text-white text-center relative z-10">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
