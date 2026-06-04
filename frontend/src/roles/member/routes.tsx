import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { CalendarDays, LayoutDashboard, MessageSquare, ReceiptText, Settings, Users } from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../shared/RoleShell';
import RoleNotificationsPage from '../shared/RoleNotificationsPage';
import { useSupabaseUserProfile } from '../shared/useSupabaseUserProfile';
import { getCurrentUser } from '../../services/authService';
import { getCurrentMemberPackageForUser } from '../../services/memberPackageApi';
import { getMembershipState } from './domain/packageHelpers';
import MemberDashboard from './screens/MemberDashboard';
import MyPackagePage from './screens/MyPackagePage';
import MySchedulePage from './screens/MySchedulePage';
import TrainerListPage from './screens/TrainerListPage';
import RateServicePage from './screens/RateServicePage';
import MemberProfilePage from './screens/MemberProfilePage';
import MemberSettingsPage from './screens/MemberSettingsPage';
import SelectPackageOnboarding from './screens/SelectPackageOnboarding';
import MedicalHistoryModal from './components/MedicalHistoryModal';

export default function MemberRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useSupabaseUserProfile('member');
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [showMedicalHistory, setShowMedicalHistory] = useState(false);
  const [membershipCheck, setMembershipCheck] = useState({
    loading: true,
    hasUsablePackage: false,
    daysRemaining: 0,
    isExpiringSoon: false,
    reason: 'loading',
  });
  const isActiveMember = currentUser?.accountStatus === 'Active' || currentUser?.account_status === 'active';
  const currentPath = location.pathname;
  const isRenewalPage = currentPath.startsWith('/member/my-package') || currentPath.startsWith('/member/select-package');
  const shouldLockContent = isActiveMember && !membershipCheck.loading && !membershipCheck.hasUsablePackage && !isRenewalPage;
  const activeMenuItems: RoleShellItem[] = [
    { id: 'dashboard', path: '/member', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'package', path: '/member/my-package', icon: ReceiptText, label: 'My Package' },
    { id: 'schedule', path: '/member/my-schedule', icon: CalendarDays, label: 'My Schedule' },
    { id: 'trainers', path: '/member/trainers', icon: Users, label: 'Trainers' },
    { id: 'rate-service', path: '/member/rate-service', icon: MessageSquare, label: 'Rate Service' },
    { id: 'settings', path: '/member/settings', icon: Settings, label: 'Settings' },
  ];
  const onboardingMenuItems: RoleShellItem[] = [
    { id: 'select-package', path: '/member/select-package', icon: ReceiptText, label: 'Select Package' },
    { id: 'settings', path: '/member/settings', icon: Settings, label: 'Settings' },
  ];
  const menuItems = isActiveMember ? activeMenuItems : onboardingMenuItems;

  useEffect(() => {
    const openMedicalHistory = () => setShowMedicalHistory(true);
    window.addEventListener('gymster-open-medical-history', openMedicalHistory);
    return () => window.removeEventListener('gymster-open-medical-history', openMedicalHistory);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isActiveMember) {
      setMembershipCheck({
        loading: false,
        hasUsablePackage: false,
        daysRemaining: 0,
        isExpiringSoon: false,
        reason: 'inactive',
      });
      return () => {
        isMounted = false;
      };
    }

    getCurrentMemberPackageForUser(currentUser).then(({ data }) => {
      if (!isMounted) return;
      setMembershipCheck({ loading: false, ...getMembershipState(data) });
    }).catch(() => {
      if (!isMounted) return;
      setMembershipCheck({
        loading: false,
        hasUsablePackage: false,
        daysRemaining: 0,
        isExpiringSoon: false,
        reason: 'error',
      });
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser, isActiveMember]);

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="Member Portal"
      searchPlaceholder="Search packages, workouts, trainers..."
      userName={profile.fullName || 'Member'}
      userRole={profile.roleLabel}
      userInitials={profile.initials}
      userAvatarUrl={profile.avatarUrl}
      onAvatarClick={() => navigate(isActiveMember ? '/member/profile' : '/member/settings')}
    >
      {isActiveMember ? (
        <div className="relative min-h-full">
          {membershipCheck.isExpiringSoon && (
            <div className="px-6 pt-6">
              <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-bold text-amber-200">
                Your package has {membershipCheck.daysRemaining} days remaining. Renew soon to avoid interrupted access.
              </div>
            </div>
          )}
          <div className={shouldLockContent ? 'pointer-events-none select-none blur-sm' : ''}>
            <Routes>
              <Route index element={<MemberDashboard />} />
              <Route path="my-package" element={<MyPackagePage />} />
              <Route path="my-schedule" element={<MySchedulePage />} />
              <Route path="trainers" element={<TrainerListPage />} />
              <Route path="rate-service" element={<RateServicePage />} />
              <Route path="notifications" element={<RoleNotificationsPage />} />
              <Route path="profile" element={<MemberProfilePage />} />
              <Route path="settings" element={<MemberSettingsPage />} />
              <Route path="*" element={<Navigate to="/member" replace />} />
            </Routes>
          </div>
          {shouldLockContent && (
            <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-3xl border border-[#EF233C]/35 bg-[#151515] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
                <h2 className="text-3xl font-black text-white">Package renewal required</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  Your package has expired or is not active. Renew or register a new package to continue using the system.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/member/my-package')}
                  className="mt-6 rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930]"
                >
                  Renew / register package
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Routes>
          <Route index element={<Navigate to="/member/select-package" replace />} />
          <Route path="select-package" element={<SelectPackageOnboarding onMemberActivated={setCurrentUserState} />} />
          <Route path="settings" element={<MemberSettingsPage />} />
          <Route path="*" element={<Navigate to="/member/select-package" replace />} />
        </Routes>
      )}
      {showMedicalHistory && <MedicalHistoryModal onClose={() => setShowMedicalHistory(false)} />}
    </RoleShell>
  );
}
