import { Outlet, useNavigate } from 'react-router';
import {
  Dumbbell,
  History,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../../shared/RoleShell';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';

const menuItems: RoleShellItem[] = [
  { id: 'dashboard', path: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'add-member', path: '/staff/add-member', icon: UserPlus, label: 'Add Member' },
  { id: 'members', path: '/staff/members', icon: Users, label: 'Member List' },
  { id: 'renew-package', path: '/staff/renew-package', icon: RefreshCw, label: 'Renew Package' },
  { id: 'history', path: '/staff/history', icon: History, label: 'Usage History' },
  { id: 'feedback', path: '/staff/feedback', icon: MessageSquare, label: 'Feedback Management' },
  { id: 'equipment', path: '/staff/equipment', icon: Dumbbell, label: 'Equipment Status' },
  { id: 'settings', path: '/staff/settings', icon: Settings, label: 'Settings' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const { profile } = useSupabaseUserProfile('staff');

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="Staff Portal"
      searchPlaceholder="Search members, packages, invoices..."
      userName={profile.fullName || 'Staff'}
      userRole={profile.roleLabel}
      userInitials={profile.initials}
      userAvatarUrl={profile.avatarUrl}
      onAvatarClick={() => navigate('/staff/profile')}
    >
      <Outlet />
    </RoleShell>
  );
}
