import React from 'react';
import { Link, useLocation } from 'react-router';
import {
  Home,
  CreditCard,
  Calendar,
  History,
  ShoppingCart,
  Users,
  RefreshCw,
  Star,
  User,
  Lock,
  LogOut,
  Dumbbell
} from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Trang chủ', icon: Home },
  { path: '/my-package', label: 'Gói tập của tôi', icon: CreditCard },
  { path: '/my-schedule', label: 'Lịch tập của tôi', icon: Calendar },
  { path: '/trainers', label: 'Huấn luyện viên', icon: Users },
  { path: '/rate-service', label: 'Đánh giá dịch vụ', icon: Star },
  { path: '/account', label: 'Tài khoản cá nhân', icon: User }
];

export const MemberSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-64 bg-[#0B0B0F] border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">GYM PRO</h1>
            <p className="text-xs text-gray-400">Member Portal</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all w-full">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
