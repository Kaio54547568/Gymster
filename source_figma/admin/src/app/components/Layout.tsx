import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  UserCheck,
  Calendar,
  Star,
  Wallet,
  Dumbbell,
  Wrench,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  Clock,
  CalendarDays,
  User
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Executive Dashboard' },
  { path: '/revenue', icon: DollarSign, label: 'Revenue Analytics' },
  { path: '/membership', icon: Users, label: 'Membership Analytics' },
  { path: '/staff', icon: UserCheck, label: 'Staff & Trainer Management' },
  { path: '/scheduling', icon: Calendar, label: 'Employee Scheduling' },
  { path: '/performance', icon: Star, label: 'Performance Evaluation' },
  { path: '/payroll', icon: Wallet, label: 'Payroll / Salary Slip' },
  { path: '/equipment', icon: Dumbbell, label: 'Equipment Management' },
  { path: '/maintenance-report', icon: Wrench, label: 'Maintenance Reports' },
  { path: '/maintenance-tracking', icon: ClipboardList, label: 'Maintenance Tracking' },
  { path: '/feedback', icon: MessageSquare, label: 'Feedback & Satisfaction' },
  { path: '/reports', icon: BarChart3, label: 'Reports & Statistics' },
  { path: '/packages', icon: Wallet, label: 'Packages & Payments' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications] = useState(12);

  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#050607] via-[#0a0b0d] to-[#050607] overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#EF233C]/5 via-transparent to-[#990000]/5 pointer-events-none" />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-80' : 'w-24'
        } glass-strong border-r border-white/5 transition-all duration-500 flex flex-col relative z-10 shadow-float`}
      >
        {/* Logo */}
        <div className="h-28 flex items-center justify-between px-6 border-b border-white/5">
          {sidebarOpen ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Dumbbell className="w-9 h-9 text-white relative z-10" />
              </div>
              <div>
                <h1 className="bebas text-4xl text-white tracking-wider bg-gradient-to-r from-white to-white/80 bg-clip-text">GYMX</h1>
                <p className="text-sm text-white/50 font-medium">Owner Portal</p>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center mx-auto shadow-glow-red">
              <Dumbbell className="w-9 h-9 text-white" />
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-8 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl mb-3 transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[#EF233C] to-[#990000] text-white shadow-glow-red'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
                )}
                <Icon className={`w-6 h-6 flex-shrink-0 relative z-10 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:text-[#EF233C] group-hover:scale-110'}`} />
                {sidebarOpen && (
                  <span className="text-base font-semibold relative z-10">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-3 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300 w-full group">
            <Bell className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-base font-semibold">Notifications</span>}
          </button>
          <button className="flex items-center gap-4 px-5 py-4 rounded-2xl mb-3 text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300 w-full group">
            <Settings className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-base font-semibold">Settings</span>}
          </button>
          <button className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[#EF233C] hover:bg-[#EF233C]/10 transition-all duration-300 w-full group">
            <LogOut className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-base font-semibold">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-4 top-32 w-10 h-10 bg-gradient-to-br from-[#EF233C] to-[#990000] rounded-full flex items-center justify-center text-white shadow-glow-red hover:scale-110 transition-all duration-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-24 glass border-b border-white/5 px-8 flex items-center justify-between relative z-10 shadow-premium">
          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40 group-hover:text-[#EF233C] transition-colors duration-300" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full glass border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-base text-white placeholder-white/40 focus:outline-none focus:border-[#EF233C]/50 focus:shadow-glow-red transition-all duration-300"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6 ml-6">
            {/* Date & Time */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3 px-4 py-2.5 glass rounded-2xl border border-white/5">
                <CalendarDays className="w-5 h-5 text-[#EF233C]" />
                <span className="text-sm font-medium text-white/80">{currentDate}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 glass rounded-2xl border border-white/5">
                <Clock className="w-5 h-5 text-[#EF233C]" />
                <span className="text-sm font-medium text-white/80">{currentTime}</span>
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-3 glass rounded-2xl border border-white/5 hover:border-[#EF233C]/30 transition-all duration-300 group">
              <Bell className="w-6 h-6 text-white/60 group-hover:text-[#EF233C] transition-colors" />
              {notifications > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#EF233C] to-[#990000] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-glow-red">
                  {notifications}
                </span>
              )}
            </button>

            {/* Business Status */}
            <div className="px-6 py-3 glass rounded-2xl border border-[#22C55E]/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#22C55E]/10 to-transparent opacity-50" />
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse shadow-lg shadow-[#22C55E]/50" />
                <span className="text-[#22C55E] text-sm font-bold tracking-wide">HOẠT ĐỘNG</span>
              </div>
            </div>

            {/* Owner Avatar */}
            <div className="flex items-center gap-4 glass rounded-2xl border border-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-sm font-bold text-white">Owner</p>
                <p className="text-xs text-white/50">Quản lý điều hành</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
