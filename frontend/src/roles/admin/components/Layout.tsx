import { useNavigate } from 'react-router';
import {
  Calendar,
  ClipboardList,
  DollarSign,
  Dumbbell,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../../shared/RoleShell';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

const menuItems: RoleShellItem[] = [
  { id: 'dashboard', path: '/admin', icon: LayoutDashboard, label: 'Executive Dashboard' },
  { id: 'revenue', path: '/admin/revenue', icon: DollarSign, label: 'Revenue Analytics' },
  { id: 'membership', path: '/admin/membership', icon: Users, label: 'Membership Analytics' },
  { id: 'staff', path: '/admin/staff', icon: UserCheck, label: 'Staff & Trainer Management' },
  { id: 'payroll', path: '/admin/payroll', icon: Wallet, label: 'Payroll / Salary Slip' },
  { id: 'equipment', path: '/admin/equipment', icon: Dumbbell, label: 'Equipment Management' },
  { id: 'maintenance-tracking', path: '/admin/maintenance-tracking', icon: ClipboardList, label: 'Maintenance Tracking' },
  { id: 'feedback', path: '/admin/feedback', icon: MessageSquare, label: 'Feedback & Report' },
  { id: 'packages', path: '/admin/packages', icon: Wallet, label: 'Packages & Payments' },
  { id: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { profile } = useSupabaseUserProfile('admin');

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="Owner Portal"
      searchPlaceholder="Search..."
      userName={profile.fullName || 'Admin'}
      userRole={profile.roleLabel}
      userInitials={profile.initials}
      userAvatarUrl={profile.avatarUrl}
      onAvatarClick={() => navigate('/admin/profile')}
    >
      {children}
    </RoleShell>
  );
}
