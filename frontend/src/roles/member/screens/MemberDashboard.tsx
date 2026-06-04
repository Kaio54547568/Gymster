import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, Dumbbell, History } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
import { getWorkoutSessionStatusLabel, getWorkoutSessionsForMember } from '../../../services/workoutSessionApi';
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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [packageResult, workoutResult] = await Promise.all([
        getCurrentMemberPackageForUser(currentUser),
        getWorkoutSessionsForMember(currentUser),
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
      setDashboardMessage(packageResult.error || workoutResult.error ? 'Dashboard data could not be fully loaded.' : '');
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

      <div className="grid gap-4 md:grid-cols-4">
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
    </div>
  );
}
