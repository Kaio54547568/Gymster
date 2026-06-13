import { ReactNode, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  Clock,
  Dumbbell,
  Info,
  LogOut,
  Search,
  ShieldAlert,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import ThemeToggle from '../../components/theme/ThemeToggle';
import { logoutUser } from '../../services/authService';
import AIAssistantChat from './AIAssistantChat';
import { useAppearance } from './AppearanceContext';
import { useRoleTranslationEffect } from './LanguageContext';
import { useRoleNotifications, type RoleNotification } from './notificationStore';
import { openMedicalHistoryForm } from '../../services/medicalHistoryApi';

export type RoleShellItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
};

type RoleShellProps = {
  children: ReactNode;
  menuItems: RoleShellItem[];
  portalLabel: string;
  searchPlaceholder: string;
  userName: string;
  userRole: string;
  userInitials?: string;
  userAvatarUrl?: string;
  notificationCount?: number;
  notifications?: RoleNotification[];
  onOpenNotifications?: () => void;
  onAvatarClick?: () => void;
  darkMode?: boolean;
  assistantSlot?: ReactNode;
};

export default function RoleShell({
  children,
  menuItems,
  portalLabel,
  searchPlaceholder,
  userName,
  userRole,
  userInitials,
  userAvatarUrl,
  notificationCount,
  notifications,
  onOpenNotifications,
  onAvatarClick,
  darkMode,
  assistantSlot,
}: RoleShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const appearance = useAppearance();
  const shellDarkMode = darkMode ?? appearance.darkMode;
  const shellThemeClass = shellDarkMode ? 'gymster-dark' : 'gymster-light';
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<RoleNotification | null>(null);
  const {
    notifications: notificationItems,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useRoleNotifications(notifications);
  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const shownNotificationCount = notificationCount ?? unreadCount;
  const filteredNotificationItems =
    notificationFilter === 'unread' ? notificationItems.filter((item) => !item.read) : notificationItems;
  useRoleTranslationEffect(shellRef);

  const logout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const isMenuItemActive = (item: RoleShellItem) => {
    if (typeof item.active === 'boolean') return item.active;
    if (!item.path) return false;

    const normalizedPath = item.path.replace(/\/+$/, '') || '/';
    const currentPath = location.pathname.replace(/\/+$/, '') || '/';
    const roleRoot = currentPath.split('/').filter(Boolean)[0];

    if (normalizedPath === `/${roleRoot}`) {
      return currentPath === normalizedPath;
    }

    return currentPath === normalizedPath || currentPath.startsWith(`${normalizedPath}/`);
  };

  const renderMenuContent = (item: RoleShellItem, isActive: boolean) => {
    const Icon = item.icon;

    return (
      <>
        {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />}
        <Icon className={`w-6 h-6 flex-shrink-0 relative z-10 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:text-[#EF233C] group-hover:scale-110'}`} />
        {sidebarOpen && (
          <>
            <span className="text-base font-semibold relative z-10 leading-tight">{item.label}</span>
            {item.badge ? (
              <span className="relative z-10 ml-auto bg-[#EF233C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            ) : null}
          </>
        )}
      </>
    );
  };

  const openNotificationDetail = (item: RoleNotification) => {
    markNotificationRead(item.id);
    setSelectedNotification({ ...item, read: true });
  };

  const openAllNotifications = () => {
    setNotificationOpen(false);
    setNotificationFilter('all');

    if (onOpenNotifications) {
      onOpenNotifications();
      return;
    }

    const roleBase = location.pathname.split('/').filter(Boolean)[0];
    if (roleBase && ['admin', 'staff', 'member', 'pt'].includes(roleBase)) {
      navigate(`/${roleBase}/notifications`);
    }
  };

  const notificationIcon = (type: RoleNotification['type']) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-white" />;
    if (type === 'error') return <X className="w-5 h-5 text-white" />;
    if (type === 'info') return <Info className="w-5 h-5 text-white" />;
    return <ShieldAlert className="w-5 h-5 text-white" />;
  };

  const renderNotificationIcon = () => (
    <>
      <Bell className="w-6 h-6 text-white/60 group-hover:text-[#EF233C] transition-colors" />
      {shownNotificationCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-gradient-to-br from-[#EF233C] to-[#990000] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-glow-red">
          {shownNotificationCount}
        </span>
      )}
    </>
  );

  return (
    <div ref={shellRef} className={`gymster-shell ${shellThemeClass} flex h-screen bg-gradient-to-br from-[#050607] via-[#0a0b0d] to-[#050607] overflow-hidden relative`}>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#EF233C]/5 via-transparent to-[#990000]/5 pointer-events-none" />

      <aside
        className={`${sidebarOpen ? 'w-80' : 'w-24'} glass-strong border-r border-white/5 transition-all duration-500 flex flex-col relative z-10 shadow-float`}
      >
        <div className={`h-28 flex items-center border-b border-white/5 ${sidebarOpen ? 'px-6' : 'px-4'}`}>
          <div className="flex items-center gap-3 min-w-0 w-full">
            <div
              className={`bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red relative overflow-hidden group shrink-0 ${
                sidebarOpen ? 'w-14 h-14' : 'w-12 h-12'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Dumbbell className={`${sidebarOpen ? 'w-8 h-8' : 'w-7 h-7'} text-white relative z-10`} />
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <h1 className="bebas text-4xl text-white tracking-wider bg-gradient-to-r from-white to-white/80 bg-clip-text truncate">
                  Gymster
                </h1>
                <p className="text-sm text-white/50 font-medium truncate">{portalLabel}</p>
              </div>
            )}

          <button
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            className={`bg-white/5 hover:bg-[#EF233C]/15 border border-white/10 hover:border-[#EF233C]/40 flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 shrink-0 ${
              sidebarOpen
                ? 'w-10 h-10 rounded-2xl ml-auto'
                : 'w-8 h-8 rounded-xl bg-[#EF233C]/10 border-[#EF233C]/30 text-white'
            }`}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-4 h-4" />}
          </button>
          </div>
        </div>

        <nav className="role-sidebar-scroll flex-1 overflow-y-auto py-8 px-4">
          {menuItems.map((item) => {
            const isActive = isMenuItemActive(item);

            const className = `w-full flex items-center gap-4 px-5 py-4 rounded-2xl mb-3 transition-all duration-300 group relative overflow-hidden text-left ${
              isActive
                ? 'bg-gradient-to-r from-[#EF233C] to-[#990000] text-white shadow-glow-red'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`;

            return item.path ? (
              <Link key={item.id} to={item.path} className={className}>
                {renderMenuContent(item, isActive)}
              </Link>
            ) : (
              <button key={item.id} type="button" onClick={item.onClick} className={className}>
                {renderMenuContent(item, isActive)}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[#EF233C] hover:bg-[#EF233C]/10 transition-all duration-300 w-full group"
          >
            <LogOut className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" />
            {sidebarOpen && <span className="text-base font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 glass border-b border-white/5 px-8 flex items-center justify-between relative z-[80] shadow-premium">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40 group-hover:text-[#EF233C] transition-colors duration-300" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full glass border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-base text-white placeholder-white/40 focus:outline-none focus:border-[#EF233C]/50 focus:shadow-glow-red transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 ml-6">
            <div className="hidden xl:flex items-center gap-5">
              <div className="flex items-center gap-3 px-4 py-2.5 glass rounded-2xl border border-white/5">
                <CalendarDays className="w-5 h-5 text-[#EF233C]" />
                <span className="text-sm font-medium text-white/80">{currentDate}</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 glass rounded-2xl border border-white/5">
                <Clock className="w-5 h-5 text-[#EF233C]" />
                <span className="text-sm font-medium text-white/80">{currentTime}</span>
              </div>
            </div>

            <ThemeToggle />

            <div className="relative z-[90]">
              <button
                type="button"
                onClick={() => setNotificationOpen((current) => !current)}
                className="relative p-3 glass rounded-2xl border border-white/5 hover:border-[#EF233C]/30 transition-all duration-300 group"
                aria-label="Notifications"
              >
                {renderNotificationIcon()}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-16 z-[120] w-[420px] max-h-[680px] overflow-hidden rounded-3xl border border-white/10 bg-[#151515] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-2xl font-black text-white">Notifications</h2>
                    <button type="button" className="text-sm font-semibold text-[#EF233C] hover:text-white" onClick={markAllNotificationsRead}>
                      Mark all as read
                    </button>
                  </div>
                  <div className="flex gap-2 px-5 pb-3">
                    <button
                      type="button"
                      onClick={() => setNotificationFilter('all')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                        notificationFilter === 'all' ? 'bg-[#EF233C]/20 text-[#EF233C]' : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationFilter('unread')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                        notificationFilter === 'unread' ? 'bg-[#EF233C]/20 text-[#EF233C]' : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Unread
                    </button>
                  </div>
                  <div className="role-sidebar-scroll max-h-[500px] overflow-y-auto px-3 pb-3">
                    {filteredNotificationItems.length > 0 ? filteredNotificationItems.map((item) => (
                      <div
                        key={item.id}
                        className={`group relative flex gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5 ${item.read ? 'opacity-70' : 'opacity-100'}`}
                      >
                        <button
                          type="button"
                          onClick={() => openNotificationDetail(item)}
                          className="flex flex-1 gap-3 text-left"
                        >
                          <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF233C] to-[#990000]">
                            {notificationIcon(item.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white">{item.title}</div>
                            <p className="mt-0.5 line-clamp-2 text-sm text-white/70">{item.message}</p>
                            <div className="mt-1 text-xs font-semibold text-[#EF233C]">{item.time}</div>
                          </div>
                        </button>
                        {!item.read && <span className="mt-6 h-2.5 w-2.5 shrink-0 rounded-full bg-[#EF233C]" />}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markNotificationRead(item.id);
                          }}
                          className="absolute bottom-2 right-3 rounded-full px-2 py-1 text-[11px] font-semibold text-[#EF233C] opacity-0 transition-opacity hover:bg-[#EF233C]/10 group-hover:opacity-100"
                        >
                          Mark as read
                        </button>
                      </div>
                    )) : (
                      <div className="px-4 py-10 text-center text-sm font-semibold text-white/50">
                        No unread notifications.
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 p-4">
                    <button
                      type="button"
                      onClick={openAllNotifications}
                      className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#EF233C]/20"
                    >
                      See all
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onAvatarClick}
              className="flex items-center gap-4 glass rounded-2xl border border-white/5 px-4 py-2 text-left transition-all hover:border-[#EF233C]/30"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{userName}</p>
                <p className="text-xs text-white/50">{userRole}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red text-white font-bold">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt={`${userName} avatar`} className="h-full w-full rounded-2xl object-cover" />
                ) : userInitials ? userInitials : <User className="w-6 h-6 text-white" />}
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative z-0">
          {children}
        </main>
      </div>

      {selectedNotification && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setSelectedNotification(null)}>
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.75)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#EF233C] to-[#990000]">
                  {notificationIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedNotification.title}</h3>
                  <p className="text-sm font-semibold text-[#EF233C]">{selectedNotification.time}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedNotification(null)} className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-base leading-7 text-white/80">{selectedNotification.message}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/70">
              {selectedNotification.detail ?? 'This notification has been recorded. Open the related module for more details.'}
            </div>
            {selectedNotification.actionType === 'complete_medical_history' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedNotification(null);
                  openMedicalHistoryForm();
                }}
                className="mt-5 w-full rounded-2xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930]"
              >
                Complete medical history
              </button>
            )}
          </div>
        </div>
      )}
      {assistantSlot ?? <AIAssistantChat />}
    </div>
  );
}
