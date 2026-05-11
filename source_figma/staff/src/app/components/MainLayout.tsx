import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  RefreshCw,
  History,
  MessageSquare,
  Dumbbell,
  FileText,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export function MainLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/add-member', icon: UserPlus, label: 'Add Member' },
    { path: '/members', icon: Users, label: 'Member List' },
    { path: '/renew-package', icon: RefreshCw, label: 'Renew Package' },
    { path: '/history', icon: History, label: 'Usage History' },
    { path: '/feedback', icon: MessageSquare, label: 'Feedback Management' },
    { path: '/equipment', icon: Dumbbell, label: 'Equipment Status' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const currentTime = new Date().toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">GYM MANAGER</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,0,0.4)]'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-4">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search members, packages, invoices..."
              className="bg-input px-4 py-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground">
              {currentTime}
            </div>

            <Link to="/notifications" className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(255,0,0,0.8)]"></span>
            </Link>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.4)]">
                <span className="font-bold">NS</span>
              </div>
              <div>
                <div className="text-sm font-medium">Nguyễn Staff</div>
                <div className="text-xs text-muted-foreground">Management Staff</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
