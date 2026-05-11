import { useNavigate } from 'react-router';
import {
  BarChart3,
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
  Wrench,
} from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../../shared/RoleShell';

const menuItems: RoleShellItem[] = [
  { id: 'dashboard', path: '/admin', icon: LayoutDashboard, label: 'Executive Dashboard' },
  { id: 'revenue', path: '/admin/revenue', icon: DollarSign, label: 'Revenue Analytics' },
  { id: 'membership', path: '/admin/membership', icon: Users, label: 'Membership Analytics' },
  { id: 'staff', path: '/admin/staff', icon: UserCheck, label: 'Staff & Trainer Management' },
  { id: 'scheduling', path: '/admin/scheduling', icon: Calendar, label: 'Employee Scheduling' },
  { id: 'performance', path: '/admin/performance', icon: Star, label: 'Performance Evaluation' },
  { id: 'payroll', path: '/admin/payroll', icon: Wallet, label: 'Payroll / Salary Slip' },
  { id: 'equipment', path: '/admin/equipment', icon: Dumbbell, label: 'Equipment Management' },
  { id: 'maintenance-report', path: '/admin/maintenance-report', icon: Wrench, label: 'Maintenance Reports' },
  { id: 'maintenance-tracking', path: '/admin/maintenance-tracking', icon: ClipboardList, label: 'Maintenance Tracking' },
  { id: 'feedback', path: '/admin/feedback', icon: MessageSquare, label: 'Feedback & Satisfaction' },
  { id: 'reports', path: '/admin/reports', icon: BarChart3, label: 'Reports & Statistics' },
  { id: 'packages', path: '/admin/packages', icon: Wallet, label: 'Packages & Payments' },
  { id: 'settings', path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="Owner Portal"
      searchPlaceholder="Search..."
      userName="Owner"
      userRole="Gym Owner"
      userInitials="OW"
      onAvatarClick={() => navigate('/admin/profile')}
    >
      {children}
    </RoleShell>
  );
}
