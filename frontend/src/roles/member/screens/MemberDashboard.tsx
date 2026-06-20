import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, Dumbbell, History } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
import { getWorkoutSessionStatusLabel, getWorkoutSessionsForMember } from '../../../services/workoutSessionApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import Section from '../components/Section';
import { member } from '../domain/memberConstants';

export default function MemberDashboard() {
  const currentUser = getCurrentUser();
  const displayName = currentUser?.fullName || currentUser?.username || member.name;
  const [dashboardPackage, setDashboardPackage] = useState({
    title: 'No active package',
    status: '',
    expiryDate: '',
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    daysRemaining: 0,
  });
  const [workoutRows, setWorkoutRows] = useState<any[]>([]);
  const [dashboardMessage, setDashboardMessage] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [packageResult, workoutResult, availablePackagesResult] = await Promise.all([
        getCurrentMemberPackageForUser(currentUser),
        getWorkoutSessionsForMember(currentUser),
        fetchPackagesFromSupabase(),
      ]);

      if (!isMounted) return;

      if (!packageResult.error && packageResult.data) {
        const item = packageResult.data;
        const totalSessions = item.sessionsTotal ?? item.packageSessionLimit ?? 0;
        const usedSessions = item.usedSessions ?? 0;
        const remainingSessions = item.remainingSessions ?? (totalSessions > 0 ? Math.max(0, totalSessions - usedSessions) : 0);
        const diff = item.endDate ? new Date(item.endDate).getTime() - Date.now() : 0;

        setDashboardPackage({
          title: item.packageName || 'Current package',
          status: item.status || '',
          expiryDate: item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '',
          totalSessions,
          usedSessions,
          remainingSessions: Number(remainingSessions) || 0,
          daysRemaining: item.endDate ? Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) : 0,
        });
      }

      setWorkoutRows(workoutResult.error ? [] : workoutResult.data);
      setPromotions(availablePackagesResult.error
        ? []
        : availablePackagesResult.data.filter((pkg: any) => pkg.promotion && pkg.isActive !== false));
      setDashboardMessage(packageResult.error || workoutResult.error || availablePackagesResult.error ? 'Dashboard data could not be fully loaded.' : '');
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyWorkouts = workoutRows.filter((session) => {
    const sessionDate = new Date(session.sessionDate);
    return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
  }).length;
  const completedSessions = workoutRows.filter((session) => String(session.status || '').toLowerCase() === 'completed').length;
  const upcomingWorkout = workoutRows.find((session) => {
    const sessionDate = new Date(`${session.sessionDate}T${session.startTime || '00:00'}`);
    return sessionDate.getTime() >= Date.now() && String(session.status || '').toLowerCase() === 'scheduled';
  });
  const usagePercent = dashboardPackage.totalSessions > 0
    ? Math.min(100, Math.round((dashboardPackage.usedSessions / dashboardPackage.totalSessions) * 100))
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Member Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">Welcome back, {displayName}. Track your membership, workouts, and trainers.</p>
        {dashboardMessage && <p className="mt-2 text-sm font-semibold text-[#EF233C]">{dashboardMessage}</p>}
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          ['Monthly Workouts', monthlyWorkouts, CalendarDays],
          ['Completed Sessions', completedSessions, Dumbbell],
          ['Remaining Sessions', dashboardPackage.remainingSessions, History],
          ['Days Remaining', dashboardPackage.daysRemaining, CheckCircle],
        ].map(([label, value, Icon]) => (
          <div key={label as string} className="rounded-2xl border border-white/8 bg-[#181818] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EF233C]/15 text-[#EF233C]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="mt-1 text-xs font-semibold text-white/45">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Current Package">
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-black text-white">{dashboardPackage.title}</div>
              <div className="mt-1 text-sm text-[#EF233C]">
                {[dashboardPackage.status, dashboardPackage.expiryDate].filter(Boolean).join(' - ')}
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-white/65">
              <div>Used: <span className="font-bold text-white">{dashboardPackage.usedSessions}</span></div>
              <div>Remaining: <span className="font-bold text-white">{dashboardPackage.remainingSessions}</span></div>
            </div>
          </div>
        </Section>

        <Section title="Upcoming Workout">
          <div className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4 text-sm font-bold text-white/60">
            {upcomingWorkout
              ? `${upcomingWorkout.sessionTitle || upcomingWorkout.exerciseType || 'Workout session'} - ${new Date(upcomingWorkout.sessionDate).toLocaleDateString()} - ${String(upcomingWorkout.startTime || '').slice(0, 5)} - ${getWorkoutSessionStatusLabel(upcomingWorkout.status)}`
              : 'Your workout sessions will appear in the schedule screen.'}
          </div>
        </Section>

      </div>

      <Section title="Current Promotions">
        {promotions.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {promotions.map((pkg) => (
              <article key={pkg.id} className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/8 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#EF233C]">{pkg.promotion.title}</p>
                    <h3 className="mt-1 text-lg font-black text-white">{pkg.name}</h3>
                  </div>
                  <span className="rounded-full bg-[#EF233C] px-3 py-1 text-xs font-black text-white">-{pkg.discountPercent}%</span>
                </div>
                <p className="mt-3 text-sm text-white/55">{pkg.promotion.description || 'Limited-time package promotion.'}</p>
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <span className="text-sm font-bold text-white/35 line-through">{Number(pkg.originalPrice).toLocaleString('vi-VN')} VND</span>
                  <span className="text-xl font-black text-[#EF233C]">{Number(pkg.discountedPrice).toLocaleString('vi-VN')} VND</span>
                </div>
                <p className="mt-2 text-xs text-white/40">Valid {pkg.promotion.startDate} – {pkg.promotion.endDate}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">No active promotions right now.</div>
        )}
      </Section>
    </div>
  );
}
