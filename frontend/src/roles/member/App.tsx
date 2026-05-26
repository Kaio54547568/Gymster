import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import {
  CalendarDays,
  CheckCircle,
  CreditCard,
  Dumbbell,
  History,
  LayoutDashboard,
  MessageSquare,
  ReceiptText,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../shared/RoleShell';
import RoleNotificationsPage from '../shared/RoleNotificationsPage';
import AccountProfile from '../shared/AccountProfile';
import AccountSettings from '../shared/AccountSettings';
import { useSupabaseUserProfile } from '../shared/useSupabaseUserProfile';
import { fetchTrainersFromSupabase } from '../../services/trainerApi';
import { getCurrentUser, setCurrentUser } from '../../services/authService';
import { getTrainingRequestsForMember } from '../../services/trainingRequestApi';
import { fetchPackagesFromSupabase } from '../../services/packageApi';
import {
  createMemberPackage,
  createPackageChangeRequest,
  getCurrentMemberPackageForUser,
  updateMemberPackageStatus,
} from '../../services/memberPackageApi';
import { getInvoicesForMember } from '../../services/invoiceApi';
import { createPayment, getPaymentsForMember } from '../../services/paymentApi';
import {
  createWorkoutSessionsForSchedule,
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForMember,
} from '../../services/workoutSessionApi';
import {
  createMemberComplaint,
  createMemberServiceFeedback,
  getMemberFeedbackPortalData,
} from '../../services/memberEngagementApi';
import { activateMemberAccount } from '../../services/userApi';
import { getTrainerWeeklyAvailability } from '../../services/trainerAvailabilityApi';

const member = {
  name: 'Member',
  email: '',
  phone: '',
  initials: 'MB',
  package: '',
  role: 'Gym Member',
};

const currentPackage = {
  title: '',
  status: '',
  registrationDate: '',
  expiryDate: '',
  totalSessions: 0,
  usedSessions: 0,
  remainingSessions: 0,
  daysRemaining: 0,
  price: '',
};

const paymentMethods = ['Bank Transfer'];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]);
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPackageDurationMonths(pkg: any) {
  const directValue = Number(pkg?.durationMonths || pkg?.packageDurationMonths);
  if (Number.isFinite(directValue) && directValue > 0) return directValue;

  const match = String(pkg?.durationText || pkg?.duration || '').match(/\d+/);
  return Math.max(1, Number(match?.[0] || 1));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/8 bg-[#181818]">
      <div className="border-b border-white/8 px-6 py-5">
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function useMemberTrainingRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestLoadMessage, setRequestLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    const currentUser = getCurrentUser();
    const memberLookup = currentUser?.memberId || currentUser?.email || currentUser?.id;

    getTrainingRequestsForMember(memberLookup)
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error || !data.length) {
          setRequests([]);
          setRequestLoadMessage(error ? 'Request status could not be loaded.' : '');
        } else {
          setRequests(data);
          setRequestLoadMessage('');
        }

        setIsLoadingRequests(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setRequests([]);
        setRequestLoadMessage('Request status could not be loaded.');
        setIsLoadingRequests(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { requests, isLoadingRequests, requestLoadMessage };
}

function Dashboard() {
  const currentUser = getCurrentUser();
  const displayName = currentUser?.fullName || currentUser?.username || member.name;
  const [dashboardPackage, setDashboardPackage] = useState({
    title: 'Chưa có gói tập đang hoạt động',
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
          title: item.packageName || 'Gói tập hiện tại',
          status: item.status || '',
          expiryDate: item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '',
          totalSessions,
          usedSessions,
          remainingSessions: Number(remainingSessions) || 0,
          daysRemaining: item.endDate ? Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) : 0,
        });
      }

      setWorkoutRows(workoutResult.error ? [] : workoutResult.data);
      setDashboardMessage(packageResult.error || workoutResult.error ? 'Không thể tải đầy đủ dữ liệu dashboard.' : '');
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Current Package">
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-black text-white">{dashboardPackage.title}</div>
              <div className="mt-1 text-sm text-[#EF233C]">
                {[dashboardPackage.status, dashboardPackage.expiryDate].filter(Boolean).join(' · ')}
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
              ? `${upcomingWorkout.sessionTitle || upcomingWorkout.exerciseType || 'Buổi tập'} · ${new Date(upcomingWorkout.sessionDate).toLocaleDateString('vi-VN')} · ${String(upcomingWorkout.startTime || '').slice(0, 5)} · ${getWorkoutSessionStatusLabel(upcomingWorkout.status)}`
              : 'Các buổi tập sẽ hiển thị trong màn hình lịch tập.'}
          </div>
        </Section>

        <Section title="Quick Actions">
          <div className="grid gap-3">
            {['Book Workout', 'Renew Package', 'View Trainers', 'Rate Service'].map((label) => (
              <button key={label} className="rounded-xl border border-[#EF233C]/30 px-4 py-3 text-left text-sm font-bold text-[#EF233C] hover:bg-[#EF233C]/10">
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function MyPackage() {
  type DisplayPackage = {
    id: string | number;
    title: string;
    name: string;
    duration: string;
    durationMonths?: number;
    price: string;
    priceValue: number;
    description: string;
    sessionLimit: string;
    hasPersonalTrainer: boolean;
    isPopular?: boolean;
    benefits: string[];
  };

  type DisplayTransaction = {
    id: string;
    service: string;
    date: string;
    amount: string;
    status: string;
  };

  type DisplayCurrentPackage = {
    hasPackage: boolean;
    title: string;
    status: string;
    registrationDate: string;
    expiryDate: string;
    totalSessions: number;
    usedSessions: number;
    remainingSessions: string | number;
    daysRemaining: string | number;
    price: string;
    trainer: string;
  };

  const formatVnd = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;
  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
  };
  const toValidDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const resolveStartDate = (item: any) => {
    return item.startDate || item.activatedAt || item.createdAt || null;
  };
  const resolveEndDate = (item: any, startDate?: string | null) => {
    if (item.endDate) return item.endDate;
    const parsedStartDate = toValidDate(startDate);
    const durationMonths = getPackageDurationMonths(item);
    return parsedStartDate ? toDateInputValue(addMonths(parsedStartDate, durationMonths)) : null;
  };
  const getDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return currentPackage.daysRemaining;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };
  const resolveSessionStats = (item: any) => {
    const usedSessions = Number(item.usedSessions ?? 0);
    const packageSessionLimit = Number(item.packageSessionLimit);
    const sessionsTotal = Number(item.sessionsTotal);
    const storedRemaining = item.remainingSessions;
    const inferredTotal = Number.isFinite(sessionsTotal) && sessionsTotal > 0
      ? sessionsTotal
      : Number.isFinite(packageSessionLimit) && packageSessionLimit > 0
        ? packageSessionLimit
        : Number.isFinite(Number(storedRemaining)) && Number(storedRemaining) >= 0
          ? usedSessions + Number(storedRemaining)
          : 0;

    if (inferredTotal <= 0 && !item.hasPersonalTrainer) {
      return {
        totalSessions: 0,
        usedSessions,
        remainingSessions: 'Unlimited',
      };
    }

    return {
      totalSessions: inferredTotal,
      usedSessions,
      remainingSessions: Number.isFinite(Number(storedRemaining)) && Number(storedRemaining) >= 0
        ? Number(storedRemaining)
        : Math.max(0, inferredTotal - usedSessions),
    };
  };

  const [availablePackages, setAvailablePackages] = useState<DisplayPackage[]>([]);
  const [displayCurrentPackage, setDisplayCurrentPackage] = useState<DisplayCurrentPackage>({
    hasPackage: false,
    title: 'No active package found.',
    status: 'None',
    registrationDate: '-',
    expiryDate: '-',
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: '-',
    daysRemaining: '-',
    price: '-',
    trainer: '',
  });
  const [transactionRows, setTransactionRows] = useState<DisplayTransaction[]>([]);
  const [resolvedMemberId, setResolvedMemberId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [isLoadingMemberPackage, setIsLoadingMemberPackage] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const currentPackageIndex = availablePackages.findIndex((item) => item.title === displayCurrentPackage.title);
  const usagePercent = displayCurrentPackage.hasPackage && displayCurrentPackage.totalSessions > 0
    ? Math.min(100, Math.round((displayCurrentPackage.usedSessions / displayCurrentPackage.totalSessions) * 100))
    : 0;
  const canSubmitRequest = Boolean(selectedPackage && selectedPaymentMethod);
  const filteredPackages = availablePackages.filter((item) => {
    const search = packageSearch.trim().toLowerCase();
    return !search || item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search);
  });

  useEffect(() => {
    let isMounted = true;
    const currentUser = getCurrentUser();

    async function loadMemberPackageData() {
      setIsLoadingMemberPackage(true);
      const [packagesResult, currentPackageResult, paymentsResult, invoicesResult] = await Promise.all([
        fetchPackagesFromSupabase(),
        getCurrentMemberPackageForUser(currentUser),
        getPaymentsForMember(currentUser),
        getInvoicesForMember(currentUser),
      ]);

      if (!isMounted) return;

      if (!packagesResult.error && packagesResult.data.length) {
        setAvailablePackages(packagesResult.data.filter((pkg: any) => pkg.isActive !== false).map((pkg: any) => ({
          id: pkg.id,
          title: pkg.name,
          name: pkg.name,
          duration: pkg.durationText || pkg.duration,
          durationMonths: pkg.durationMonths,
          price: formatVnd(pkg.price),
          priceValue: pkg.price,
          description: pkg.description,
          sessionLimit: pkg.sessionLimit,
          hasPersonalTrainer: pkg.hasPersonalTrainer,
          isPopular: pkg.isPopular,
          benefits: [
            pkg.description || 'Package benefits configured',
            pkg.sessionLimit,
            pkg.hasPersonalTrainer ? 'Personal trainer included' : 'Self-service training',
          ],
        })));
      } else {
        setAvailablePackages([]);
      }

      if (!currentPackageResult.error && currentPackageResult.data) {
        const item = currentPackageResult.data;
        const startDate = resolveStartDate(item);
        const endDate = resolveEndDate(item, startDate);
        const sessionStats = resolveSessionStats(item);
        setResolvedMemberId(currentPackageResult.memberId || item.memberId || null);
        setDisplayCurrentPackage({
          hasPackage: true,
          title: item.packageName || currentPackage.title,
          status: item.status || currentPackage.status,
          registrationDate: formatDate(startDate),
          expiryDate: formatDate(endDate),
          totalSessions: sessionStats.totalSessions,
          usedSessions: sessionStats.usedSessions,
          remainingSessions: sessionStats.remainingSessions,
          daysRemaining: getDaysRemaining(endDate),
          price: item.packagePrice ? formatVnd(item.packagePrice) : currentPackage.price,
          trainer: item.trainerName || '',
        });
      } else {
        setResolvedMemberId(currentPackageResult.memberId || null);
      }

      if (!invoicesResult.error && invoicesResult.data.length) {
        setTransactionRows(invoicesResult.data.map((invoice: any) => ({
          id: invoice.invoiceNumber || invoice.invoiceId,
          service: invoice.packageName || 'Membership package',
          date: formatDate(invoice.issuedAt),
          amount: formatVnd(invoice.amount),
          status: invoice.statusLabel || 'Issued',
        })));
      } else if (!paymentsResult.error && paymentsResult.data.length) {
        setTransactionRows(paymentsResult.data.map((payment: any) => ({
          id: payment.transactionCode || payment.paymentId,
          service: payment.packageName || 'Membership package',
          date: formatDate(payment.paymentDate),
          amount: formatVnd(payment.amount),
          status: payment.paymentStatusLabel || (payment.paymentStatus ? payment.paymentStatus[0].toUpperCase() + payment.paymentStatus.slice(1) : 'Paid'),
        })));
      } else {
        setTransactionRows([]);
      }

      setLoadMessage(
        packagesResult.error || currentPackageResult.error || paymentsResult.error || invoicesResult.error
          ? 'Some package data could not be loaded.'
          : ''
      );
      setIsLoadingMemberPackage(false);
    }

    loadMemberPackageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPackageAction = (index: number, title: string) => {
    if (title === displayCurrentPackage.title) return 'Renew package';
    if (currentPackageIndex >= 0 && index > currentPackageIndex) return 'Upgrade package';
    return 'Select package';
  };

  const getTransactionBadgeClass = (status: string) => {
    if (status === 'Paid' || status === 'paid') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
    if (status === 'Pending' || status === 'pending') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
    return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
  };

  const submitRenewalRequest = async () => {
    if (!selectedPackage || !selectedPaymentMethod) return;
    const currentUser = getCurrentUser();
    const requestPayload = {
      memberId: resolvedMemberId || currentUser?.memberId || currentUser?.member_id || '',
      memberEmail: currentUser?.email || '',
      memberName: currentUser?.fullName || currentUser?.full_name || member.name,
      currentPackageName: displayCurrentPackage.hasPackage ? displayCurrentPackage.title : 'No active package',
      packageId: selectedPackage.id,
      packageName: selectedPackage.title,
      amount: selectedPackage.priceValue,
      paymentMethod: selectedPaymentMethod,
      requestType: !displayCurrentPackage.hasPackage ? 'buy' : selectedPackage.title === displayCurrentPackage.title ? 'renewal' : 'upgrade',
    };

    const { data, error } = await createPackageChangeRequest(requestPayload);

    if (!error && data) {
      setRequestMessage(`Request ${data.requestId} submitted for staff approval.`);
      return;
    }

    setRequestMessage('Request could not be saved.');
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Package</h1>
      {isLoadingMemberPackage && <div className="rounded-2xl border border-white/8 bg-[#181818] p-4 text-sm font-bold text-white/45">Loading package data...</div>}
      {loadMessage && !isLoadingMemberPackage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Current Package">
          <div className="space-y-5 text-sm text-white/65">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black text-white">{displayCurrentPackage.title}</div>
                <div className="mt-1 text-xs font-semibold text-white/40">
                  {displayCurrentPackage.hasPackage ? 'Active membership details' : 'Select a package below to request a membership.'}
                </div>
              </div>
              {displayCurrentPackage.hasPackage && (
                <span className="rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C] ring-1 ring-[#EF233C]/25">
                  {displayCurrentPackage.status}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Registration date</div>
                <div className="mt-1 font-bold text-white">{displayCurrentPackage.registrationDate}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Expiry date</div>
                <div className="mt-1 font-bold text-white">{displayCurrentPackage.expiryDate}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Remaining days</div>
                <div className="mt-1 font-bold text-white">
                  {displayCurrentPackage.daysRemaining === '-' ? '-' : `${displayCurrentPackage.daysRemaining} days`}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Remaining sessions</div>
                <div className="mt-1 font-bold text-white">
                  {displayCurrentPackage.remainingSessions === '-' ? '-' : `${displayCurrentPackage.remainingSessions} sessions`}
                </div>
              </div>
              {displayCurrentPackage.trainer && (
                <div className="rounded-xl bg-white/[0.03] p-3 sm:col-span-2">
                  <div className="text-xs text-white/40">Trainer</div>
                  <div className="mt-1 font-bold text-white">{displayCurrentPackage.trainer}</div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs font-bold text-white/45">
                <span>Package usage</span>
                <span>{usagePercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${usagePercent}%` }} />
              </div>
              {displayCurrentPackage.hasPackage ? (
                <div className="mt-2 text-xs text-white/45">
                  {displayCurrentPackage.totalSessions > 0
                    ? `${displayCurrentPackage.usedSessions}/${displayCurrentPackage.totalSessions} sessions used`
                    : 'Unlimited gym access'}
                </div>
              ) : (
                <div className="mt-2 text-xs text-white/45">No session usage yet.</div>
              )}
            </div>

            <div className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4">
              <div className="text-xs text-white/45">Price</div>
              <div className="mt-1 text-xl font-black text-[#EF233C]">{displayCurrentPackage.price}</div>
            </div>
          </div>
        </Section>

        <Section title="Transaction History">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-white/45">
                <tr>
                  <th className="py-3">Payment</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transactionRows.length ? (
                  transactionRows.map((item) => (
                    <tr key={item.id} className="border-t border-white/8 text-white">
                      <td className="py-3 font-mono text-[#EF233C]">{item.id}</td>
                      <td>{item.service}</td>
                      <td>{item.date}</td>
                      <td>{item.amount}</td>
                      <td>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getTransactionBadgeClass(item.status)}`}> 
                          {item.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="rounded-lg border border-[#EF233C]/30 px-3 py-1.5 text-xs font-bold text-[#EF233C]">Print Receipt</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-white/8">
                    <td colSpan={6} className="py-8 text-center text-sm font-bold text-white/45">No transactions yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="Buy / Renew / Upgrade">
          <div className="space-y-3">
            <input
              value={packageSearch}
              onChange={(event) => setPackageSearch(event.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-xl border border-white/8 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
            />
            {filteredPackages.map((item, index) => {
              const isCurrent = item.title === displayCurrentPackage.title;
              const isSelected = selectedPackage?.title === item.title;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition ${
                    isSelected ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-white/45">{item.duration} - {item.price}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {item.isPopular && <span className="rounded-full bg-[#EF233C]/15 px-2.5 py-1 text-[10px] font-black text-[#EF233C]">Popular</span>}
                      {isCurrent && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/70">
                          Current package
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-white/55 sm:grid-cols-3">
                    <div>PT: <span className="font-bold text-white">{item.hasPersonalTrainer ? 'Yes' : 'No'}</span></div>
                    <div>Sessions: <span className="font-bold text-white">{item.sessionLimit}</span></div>
                    <div>Duration: <span className="font-bold text-white">{item.duration}</span></div>
                  </div>
                  <ul className="mt-3 space-y-1 text-xs text-white/50">
                    {item.benefits.map((benefit) => (
                      <li key={benefit}>- {benefit}</li>
                    ))}
                  </ul>
                  <button
                    className="mt-3 rounded-lg bg-[#EF233C] px-4 py-2 text-sm font-bold text-white"
                    type="button"
                    onClick={() => setSelectedPackage(item)}
                  >
                    {getPackageAction(index, item.title)}
                  </button>
                </div>
              );
            })}
            {!filteredPackages.length && <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm text-white/45">No packages match your search.</div>}
          </div>
        </Section>

        <Section title="Request Summary">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold text-white transition ${
                  selectedPaymentMethod === method ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                }`}
                type="button"
                onClick={() => setSelectedPaymentMethod(method)}
              >
                <CreditCard className="h-4 w-4 text-[#EF233C]" />
                {method}
              </button>
            ))}

            <div className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="mb-3 text-sm font-black text-white">Renewal / Upgrade Summary</div>
              <div className="space-y-2 text-sm text-white/60">
                <div className="flex justify-between gap-3"><span>Selected package</span><span className="text-right font-bold text-white">{selectedPackage?.title ?? '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Duration</span><span className="font-bold text-white">{selectedPackage?.duration ?? '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Amount</span><span className="font-bold text-[#EF233C]">{selectedPackage?.price ?? '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Preferred payment method</span><span className="font-bold text-white">{selectedPaymentMethod || '-'}</span></div>
                <div className="flex justify-between gap-3"><span>Request status</span><span className="font-bold text-amber-300">Pending staff approval</span></div>
              </div>
            </div>

            <button
              className="w-full rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              disabled={!canSubmitRequest}
              type="button"
              onClick={submitRenewalRequest}
            >
              Submit Request
            </button>
            {requestMessage && <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">{requestMessage}</div>}
          </div>
        </Section>
      </div>
    </div>
  );
}
function MySchedule() {
  type ScheduleSession = {
    id: string;
    title: string;
    trainer: string;
    date: string;
    day: string;
    time: string;
    startHour: number;
    room: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending Reschedule' | 'No Show';
    packageName: string;
    notes: string;
  };

  const [view, setView] = useState<'Week' | 'Month' | 'List'>('Week');
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadMessage, setSessionLoadMessage] = useState('');
  const { requests: memberRequests, isLoadingRequests, requestLoadMessage } = useMemberTrainingRequests();
  const declinedRequests = memberRequests.filter((request) => request.status === 'declined' || request.statusLabel === 'Declined' || request.status === 'Declined' || request.rawStatus === 'declined');
  const weekDays = [
    { short: 'Mon', date: 'May 18' },
    { short: 'Tue', date: 'May 19' },
    { short: 'Wed', date: 'May 20' },
    { short: 'Thu', date: 'May 21' },
    { short: 'Fri', date: 'May 22' },
    { short: 'Sat', date: 'May 23' },
    { short: 'Sun', date: 'May 24' },
  ];
  const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const mapWorkoutSessionToSchedule = (session: any): ScheduleSession => {
    const date = session.sessionDate || '';
    const startTime = String(session.startTime || '').slice(0, 5);
    const endTime = String(session.endTime || '').slice(0, 5);
    const parsedDate = date ? new Date(`${date}T00:00:00`) : null;
    const day = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', { weekday: 'short' })
      : 'Mon';

    return {
      id: session.sessionId,
      title: session.sessionTitle || session.exerciseType || 'Workout Session',
      trainer: session.trainerName || 'Trainer',
      date: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : date || '-',
      day,
      time: endTime ? `${startTime} - ${endTime}` : startTime,
      startHour: Number(startTime.split(':')[0]) || 6,
      room: session.roomName || 'Training Room',
      status: getWorkoutSessionStatusLabel(session.status) as ScheduleSession['status'],
      packageName: session.packageName || currentPackage.title,
      notes: session.note || 'Workout session loaded.',
    };
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSessions(true);

    getWorkoutSessionsForMember(getCurrentUser())
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setScheduleSessions([]);
          setSessionLoadMessage('Some workout sessions could not be loaded.');
        } else if (data.length) {
          setScheduleSessions(data.map(mapWorkoutSessionToSchedule));
          setSessionLoadMessage('');
        } else {
          setScheduleSessions([]);
          setSessionLoadMessage('');
        }

        setIsLoadingSessions(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setScheduleSessions([]);
        setSessionLoadMessage('Some workout sessions could not be loaded.');
        setIsLoadingSessions(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);
  const upcomingSessions = scheduleSessions.filter((session) => session.status === 'Scheduled' || session.status === 'Pending Reschedule');
  const nextSession = upcomingSessions[0];

  const getStatusClass = (status: ScheduleSession['status']) => {
    if (status === 'Scheduled') return 'bg-[#EF233C]/15 text-[#EF233C] ring-1 ring-[#EF233C]/25';
    if (status === 'Completed') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
    if (status === 'Pending Reschedule') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
    if (status === 'Cancelled') return 'bg-white/10 text-white/45 ring-1 ring-white/10';
    return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
  };

  const getEventPosition = (session: ScheduleSession) => {
    const startSlot = Math.max(0, Math.min(timeSlots.length - 1, Math.floor((session.startHour - 6) / 2)));
    return {
      gridColumn: weekDays.findIndex((day) => day.short === session.day) + 2,
      gridRow: startSlot + 2,
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">My Schedule</h1>
        <p className="mt-1 text-sm text-white/50">View your workouts, trainer sessions, and booking status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Current Package</div>
          <div className="mt-2 text-xl font-black text-white">{currentPackage.title}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Remaining Sessions</div>
          <div className="mt-2 text-xl font-black text-[#EF233C]">{currentPackage.remainingSessions}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Next Session</div>
          <div className="mt-2 text-xl font-black text-white">{nextSession ? nextSession.title : 'No upcoming session'}</div>
          {nextSession && <div className="mt-1 text-sm text-white/50">{nextSession.date} · {nextSession.time}</div>}
        </div>
      </div>

      <Section title="Workout Calendar">
        {isLoadingSessions && <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading workout schedule...</div>}
        {sessionLoadMessage && !isLoadingSessions && <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{sessionLoadMessage}</div>}
        {!isLoadingSessions && !sessionLoadMessage && scheduleSessions.length === 0 && (
          <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No workout sessions found.</div>
        )}
        {isLoadingRequests && <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading trainer request status...</div>}
        {requestLoadMessage && !isLoadingRequests && <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{requestLoadMessage}</div>}
        {declinedRequests.some((request) => request.type === 'reschedule') && (
          <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <div className="text-sm font-black text-amber-300">Reschedule request declined</div>
            {declinedRequests.filter((request) => request.type === 'reschedule').slice(0, 1).map((request) => (
              <div key={request.id} className="mt-2 text-sm text-white/65">
                {request.trainerName} declined your request for {request.preferredSchedule}.
                {request.declineReason && <span className="block mt-1 text-white/45">Reason: {request.declineReason}</span>}
                <span className="mt-2 block font-bold text-[#EF233C]">Please choose another PT or another schedule.</span>
              </div>
            ))}
          </div>
        )}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white hover:border-[#EF233C]/40" type="button">Today</button>
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button">Previous</button>
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button">Next</button>
            <div className="ml-2 text-xl font-black text-white">May 18 - 24, 2026</div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-[#222] p-1">
            {(['Week', 'Month', 'List'] as const).map((item) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${view === item ? 'bg-[#EF233C] text-white' : 'text-white/55 hover:text-white'}`}
                type="button"
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {view === 'Week' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px] rounded-2xl border border-white/8 bg-[#111]">
              <div className="grid grid-cols-[72px_repeat(7,minmax(110px,1fr))] border-b border-white/8">
                <div className="p-3 text-xs font-bold text-white/35">GMT+7</div>
                {weekDays.map((day) => (
                  <div key={day.short} className="border-l border-white/8 p-3 text-center">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">{day.short}</div>
                    <div className="mt-1 text-lg font-black text-white">{day.date}</div>
                  </div>
                ))}
              </div>
              <div className="relative grid grid-cols-[72px_repeat(7,minmax(110px,1fr))]">
                {timeSlots.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="min-h-[76px] border-b border-white/8 p-3 text-xs font-bold text-white/45">{slot}</div>
                    {weekDays.map((day) => (
                      <div key={`${day.short}-${slot}`} className="min-h-[76px] border-b border-l border-white/8" />
                    ))}
                  </div>
                ))}
                {scheduleSessions.map((session) => (
                  <button
                    key={session.id}
                    className={`z-10 m-1 rounded-xl border px-3 py-2 text-left shadow-lg transition hover:scale-[1.01] ${
                      session.status === 'Completed'
                        ? 'border-emerald-400/25 bg-emerald-500/15'
                        : session.status === 'Pending Reschedule'
                          ? 'border-amber-400/25 bg-amber-500/15'
                          : 'border-[#EF233C]/35 bg-[#EF233C]/20'
                    }`}
                    style={getEventPosition(session)}
                    type="button"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="truncate text-sm font-black text-white">{session.title}</div>
                    <div className="mt-1 text-xs text-white/70">{session.time}</div>
                    <div className="mt-1 truncate text-xs text-white/45">{session.room}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {scheduleSessions.map((session) => (
              <button
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#222] p-4 text-left hover:border-[#EF233C]/40"
                type="button"
                onClick={() => setSelectedSession(session)}
              >
                <div>
                  <div className="font-black text-white">{session.title}</div>
                  <div className="mt-1 text-sm text-white/50">{session.date} · {session.time} · {session.room}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(session.status)}`}>{session.status}</span>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="Upcoming Sessions">
        {upcomingSessions.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {upcomingSessions.map((session) => (
              <button
                key={session.id}
                className="rounded-2xl border border-white/8 bg-[#222] p-5 text-left transition hover:border-[#EF233C]/40"
                type="button"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-black text-white">{session.title}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(session.status)}`}>{session.status}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/55">
                  <div>{session.date} · {session.time}</div>
                  <div>Trainer: <span className="font-bold text-white">{session.trainer}</span></div>
                  <div>Room: <span className="font-bold text-white">{session.room}</span></div>
                  <div>Package: <span className="font-bold text-[#EF233C]">{session.packageName}</span></div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#222] p-8 text-center">
            <div className="text-xl font-black text-white">No upcoming sessions</div>
            <p className="mt-2 text-sm text-white/50">Your workout schedule is empty. Book a new session when you are ready.</p>
          </div>
        )}
      </Section>

      {selectedSession && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/65 backdrop-blur-sm" onClick={() => setSelectedSession(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#181818] p-6 shadow-[0_0_80px_rgba(0,0,0,0.7)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">{selectedSession.title}</h2>
                <p className="mt-1 text-sm text-white/50">{selectedSession.date} · {selectedSession.time}</p>
              </div>
              <button className="rounded-xl border border-white/10 px-3 py-2 text-white/70 hover:text-white" type="button" onClick={() => setSelectedSession(null)}>
                Close
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Trainer</div>
                <div className="mt-1 font-bold text-white">{selectedSession.trainer}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Room / Location</div>
                <div className="mt-1 font-bold text-white">{selectedSession.room}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Package</div>
                <div className="mt-1 font-bold text-white">{selectedSession.packageName}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Status</div>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(selectedSession.status)}`}>{selectedSession.status}</span>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Notes</div>
                <p className="mt-1 leading-6 text-white/75">{selectedSession.notes}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button className="rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white" type="button">View Details</button>
              <button className="rounded-xl border border-[#EF233C]/30 px-4 py-3 text-sm font-bold text-[#EF233C]" type="button">Request Reschedule</button>
              <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60" type="button">Cancel Booking</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Trainers() {
  const [availableTrainers, setAvailableTrainers] = useState<any[]>([]);
  const [trainerLoadMessage, setTrainerLoadMessage] = useState('');
  const { requests: memberRequests, isLoadingRequests, requestLoadMessage } = useMemberTrainingRequests();
  const trackedRequests = memberRequests.filter((request) => ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.statusLabel) || ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.status) || ['pending_pt_approval', 'accepted', 'approved', 'declined', 'completed'].includes(request.rawStatus || request.status));
  const declinedRequests = trackedRequests.filter((request) => request.status === 'declined' || request.statusLabel === 'Declined' || request.status === 'Declined' || request.rawStatus === 'declined');
  const notifications: any[] = [];

  useEffect(() => {
    let isMounted = true;
    fetchTrainersFromSupabase().then(({ data, error }) => {
      if (!isMounted) return;
      setAvailableTrainers(data.filter((trainer: any) => trainer.currentActiveMembers < trainer.maxActiveMembers));
      setTrainerLoadMessage(error ? 'Trainer list could not be loaded.' : '');
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Trainers</h1>
      {trainerLoadMessage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{trainerLoadMessage}</div>}
      {(isLoadingRequests || requestLoadMessage || trackedRequests.length > 0 || notifications.length > 0) && (
        <Section title="Trainer Request Status">
          {isLoadingRequests && <div className="mb-3 rounded-xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading trainer request status...</div>}
          {requestLoadMessage && !isLoadingRequests && <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{requestLoadMessage}</div>}
          <div className="grid gap-3 lg:grid-cols-2">
            {trackedRequests.filter((request) => request.status !== 'declined' && request.statusLabel !== 'Declined' && request.status !== 'Declined' && request.rawStatus !== 'declined').slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4">
                <div className="text-sm font-black text-[#EF233C]">{request.statusLabel || request.status}</div>
                <div className="mt-1 text-sm text-white/70">{request.trainerName} request for {request.preferredSchedule || 'selected schedule'}.</div>
                <div className="mt-2 text-xs text-white/45">Created: {request.createdDate || 'Recently'}</div>
              </div>
            ))}
            {declinedRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                <div className="text-sm font-black text-amber-300">{request.type === 'reschedule' ? 'Reschedule declined' : 'Assignment declined'}</div>
                <div className="mt-1 text-sm text-white/70">{request.trainerName} declined the request.</div>
                {request.declineReason && <div className="mt-2 text-xs text-white/50">Reason: {request.declineReason}</div>}
                <div className="mt-3 text-xs font-bold text-[#EF233C]">Please choose another trainer or another schedule.</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        {availableTrainers.map((trainer) => (
          <div key={trainer.name} className="rounded-2xl border border-white/8 bg-[#181818] p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF233C]/15 font-black text-[#EF233C]">
              {trainer.name.split(' ').slice(-2).map((part) => part[0]).join('')}
            </div>
            <div className="mt-4 text-lg font-bold text-white">{trainer.name}</div>
            <div className="mt-1 text-sm text-white/50">{trainer.specialty}</div>
            <div className="mt-4 flex items-center gap-4 text-sm text-white/65">
              <span><Star className="mr-1 inline h-4 w-4 text-[#EF233C]" />{trainer.rating}</span>
              <span>{trainer.currentActiveMembers}/{trainer.maxActiveMembers} active members</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${Math.round((trainer.currentActiveMembers / trainer.maxActiveMembers) * 100)}%` }} />
            </div>
            <button className="mt-5 w-full rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white">View Profile</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateServiceOld() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Rate Service</h1>
      <Section title="Send Feedback">
        <div className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} className="rounded-xl border border-[#EF233C]/30 p-3 text-[#EF233C]">
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
          </div>
          <textarea className="min-h-40 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50" placeholder="Share your feedback..." />
          <button className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white">Submit Feedback</button>
        </div>
      </Section>
    </div>
  );
}

function RateService() {
  type ServiceType = 'Overall Service' | 'Trainer' | 'Workout Session' | 'Equipment' | 'Facilities' | 'Customer Support';
  type FeedbackStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Rejected';
  type ComplaintStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Rejected';

  const serviceTypes: ServiceType[] = ['Overall Service', 'Trainer', 'Workout Session', 'Equipment', 'Facilities', 'Customer Support'];
  const complaintTypes = ['Trainer', 'Workout Session', 'Equipment', 'Facilities', 'Overall Service', 'Customer Support'];
  const ratingLabels = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
  const ratingCriteria = ['Trainer attitude', 'Training quality', 'Equipment condition', 'Cleanliness', 'Staff support'];
  const quickTags = ['Professional trainer', 'Clean facilities', 'Good equipment', 'Crowded room', 'Equipment issue', 'Late trainer', 'Need better support'];
  const [trainerTargets, setTrainerTargets] = useState<string[]>([]);
  const [recentSessions, setRecentSessions] = useState<string[]>([]);
  const [equipmentRooms, setEquipmentRooms] = useState<string[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<Array<{ target: string; date: string; rating: number; comment: string; status: FeedbackStatus; response?: string }>>([]);
  const [recentComplaints, setRecentComplaints] = useState<Array<{ type: string; target: string; date: string; description: string; status: ComplaintStatus; response?: string }>>([]);
  const [loadMessage, setLoadMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [relatedTarget, setRelatedTarget] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [criteriaRatings, setCriteriaRatings] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ type: '', target: '', description: '' });

  const isLowRating = overallRating > 0 && overallRating <= 2;
  const canSubmit = Boolean(serviceType && overallRating && (!isLowRating || comment.trim().length > 0));

  const loadFeedbackData = async () => {
    const { data, error } = await getMemberFeedbackPortalData();
    if (error || !data) {
      setLoadMessage('Feedback data could not be loaded.');
      return;
    }
    setLoadMessage('');
    setTrainerTargets(data.trainers || []);
    setRecentSessions(data.sessions || []);
    setEquipmentRooms(data.equipmentRooms || []);
    setRecentFeedback(data.feedback || []);
    setRecentComplaints(data.complaints || []);
  };

  useEffect(() => {
    void loadFeedbackData();
  }, []);

  const submitFeedback = async () => {
    const { error } = await createMemberServiceFeedback({
      serviceType,
      rating: overallRating,
      comment,
      tags: selectedTags,
      target: relatedTarget,
    });
    if (error) {
      setSubmitMessage('Feedback could not be saved.');
      return;
    }
    setSubmitMessage('Feedback saved.');
    setServiceType('');
    setRelatedTarget('');
    setOverallRating(0);
    setCriteriaRatings({});
    setSelectedTags([]);
    setComment('');
    await loadFeedbackData();
  };

  const submitComplaint = async () => {
    const { error } = await createMemberComplaint(complaintForm);
    if (error) {
      setSubmitMessage('Complaint could not be saved.');
      return;
    }
    setSubmitMessage('Complaint saved.');
    setComplaintForm({ type: '', target: '', description: '' });
    setShowComplaintModal(false);
    await loadFeedbackData();
  };

  const getTargets = () => {
    if (serviceType === 'Trainer') return trainerTargets;
    if (serviceType === 'Workout Session') return recentSessions;
    if (serviceType === 'Equipment') return equipmentRooms;
    return [];
  };

  const getComplaintTargets = () => {
    if (complaintForm.type === 'Trainer') return trainerTargets;
    if (complaintForm.type === 'Workout Session') return recentSessions;
    if (complaintForm.type === 'Equipment') return equipmentRooms;
    if (complaintForm.type === 'Facilities') return ['Locker Room', 'Shower Area', 'Parking Area', 'Reception'];
    if (complaintForm.type === 'Customer Support') return ['Front desk', 'Hotline', 'Billing support'];
    if (complaintForm.type === 'Overall Service') return ['Gymster service experience'];
    return [];
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  };

  const getFeedbackBadgeClass = (status: FeedbackStatus) => {
    if (status === 'Submitted') return 'bg-[#EF233C]/15 text-[#EF233C] ring-1 ring-[#EF233C]/25';
    if (status === 'In Review') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
    if (status === 'Resolved') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
    return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
  };

  const targetOptions = getTargets();
  const complaintTargets = getComplaintTargets();
  const canSendComplaint = Boolean(complaintForm.type && complaintForm.target && complaintForm.description.trim());

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Rate Service</h1>
        <p className="mt-1 text-sm text-white/50">Share your experience so Gymster can improve your training journey.</p>
      </div>
      {loadMessage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}
      {submitMessage && <div className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{submitMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="Send Feedback">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-white">Service type</label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {serviceTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setServiceType(type);
                      setRelatedTarget('');
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                      serviceType === type ? 'border-[#EF233C] bg-[#EF233C]/10 text-white' : 'border-white/8 bg-[#222] text-white/65 hover:border-[#EF233C]/40 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {targetOptions.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-bold text-white">
                  {serviceType === 'Trainer' ? 'Select trainer' : serviceType === 'Workout Session' ? 'Select recent session' : 'Select equipment / room'}
                </label>
                <select
                  value={relatedTarget}
                  onChange={(event) => setRelatedTarget(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                >
                  <option value="">Choose an option</option>
                  {targetOptions.map((target) => (
                    <option key={target} value={target}>{target}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-bold text-white">Overall rating</label>
                {overallRating > 0 && <span className="text-sm font-bold text-[#EF233C]">{overallRating} {ratingLabels[overallRating - 1]}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      overallRating >= star ? 'border-[#EF233C] bg-[#EF233C]/15 text-[#EF233C]' : 'border-white/10 bg-[#222] text-white/45 hover:text-white'
                    }`}
                  >
                    <Star className={`h-5 w-5 ${overallRating >= star ? 'fill-current' : ''}`} />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-white">Rating criteria</label>
              <div className="grid gap-3 md:grid-cols-2">
                {ratingCriteria.map((criteria) => (
                  <div key={criteria} className="rounded-xl border border-white/8 bg-[#222] p-4">
                    <div className="mb-3 text-sm font-bold text-white">{criteria}</div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCriteriaRatings((current) => ({ ...current, [criteria]: star }))}
                          className={`rounded-lg p-1.5 ${Number(criteriaRatings[criteria] ?? 0) >= star ? 'text-[#EF233C]' : 'text-white/25 hover:text-white/60'}`}
                          aria-label={`${criteria} ${star} stars`}
                        >
                          <Star className={`h-4 w-4 ${Number(criteriaRatings[criteria] ?? 0) >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-white">Quick feedback tags</label>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                      selectedTags.includes(tag) ? 'border-[#EF233C] bg-[#EF233C]/15 text-[#EF233C]' : 'border-white/10 bg-[#222] text-white/55 hover:border-[#EF233C]/40 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between gap-3">
                <label className="text-sm font-bold text-white" htmlFor="feedback-comment">Tell us more</label>
                <span className={`text-xs font-bold ${comment.length > 500 ? 'text-red-300' : 'text-white/40'}`}>{comment.length}/500</span>
              </div>
              <textarea
                id="feedback-comment"
                className="min-h-40 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50"
                placeholder="Tell us more about your experience..."
                maxLength={500}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              {isLowRating && !comment.trim() && (
                <p className="mt-2 text-xs font-bold text-amber-300">Feedback text is required for 1 or 2 star ratings.</p>
              )}
            </div>

            <button
              className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              type="button"
              disabled={!canSubmit}
              onClick={submitFeedback}
            >
              Submit Feedback
            </button>
            <button
              className="rounded-xl border border-[#EF233C]/35 bg-[#EF233C]/10 px-5 py-3 text-sm font-bold text-[#EF233C] transition hover:bg-[#EF233C]/20"
              type="button"
              onClick={() => setShowComplaintModal(true)}
            >
              Send Complaint
            </button>
          </div>
        </Section>

        <Section title="My Recent Feedback">
          <div className="space-y-4">
            {recentFeedback.map((feedback) => (
              <article key={`${feedback.target}-${feedback.date}`} className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{feedback.target}</h3>
                    <p className="mt-1 text-xs text-white/45">{feedback.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${getFeedbackBadgeClass(feedback.status)}`}>{feedback.status}</span>
                </div>
                <div className="mb-3 flex gap-1 text-[#EF233C]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${feedback.rating >= star ? 'fill-current' : 'text-white/20'}`} />
                  ))}
                </div>
                <p className="text-sm leading-6 text-white/65">{feedback.comment}</p>
                {feedback.response && (
                  <div className="mt-3 rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-3 text-sm text-white/70">
                    <span className="font-bold text-[#EF233C]">Gym response: </span>{feedback.response}
                  </div>
                )}
              </article>
            ))}
            {!recentFeedback.length && <div className="rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No feedback yet.</div>}
          </div>
        </Section>
      </div>

      <Section title="My Recent Complaints">
        <div className="grid gap-4 lg:grid-cols-2">
          {recentComplaints.map((complaint) => (
            <article key={`${complaint.type}-${complaint.date}`} className="rounded-2xl border border-white/8 bg-[#222] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{complaint.type}</h3>
                  <p className="mt-1 text-xs text-white/45">{complaint.target} · {complaint.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getFeedbackBadgeClass(complaint.status)}`}>{complaint.status}</span>
              </div>
              <p className="text-sm leading-6 text-white/65">{complaint.description}</p>
              {complaint.response && (
                <div className="mt-3 rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-3 text-sm text-white/70">
                  <span className="font-bold text-[#EF233C]">Staff response: </span>{complaint.response}
                </div>
              )}
            </article>
          ))}
          {!recentComplaints.length && <div className="rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No complaints yet.</div>}
        </div>
      </Section>

      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#EF233C]/30 bg-[#111] p-6 shadow-2xl shadow-black/50">
            <div className="mb-5">
              <h2 className="text-3xl font-black text-white">Send Complaint</h2>
              <p className="mt-1 text-sm text-white/50">Use this for serious issues that need staff review.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-white">Complaint type</label>
                <select
                  value={complaintForm.type}
                  onChange={(event) => setComplaintForm({ type: event.target.value, target: '', description: complaintForm.description })}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                >
                  <option value="">Choose complaint type</option>
                  {complaintTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-white">Related target</label>
                <select
                  value={complaintForm.target}
                  onChange={(event) => setComplaintForm({ ...complaintForm, target: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
                  disabled={!complaintForm.type}
                >
                  <option value="">Choose related target</option>
                  {complaintTargets.map((target) => <option key={target} value={target}>{target}</option>)}
                </select>
              </div>

              <div>
                <div className="mb-2 flex justify-between gap-3">
                  <label className="text-sm font-bold text-white" htmlFor="complaint-description">Description</label>
                  <span className="text-xs font-bold text-white/40">{complaintForm.description.length}/500</span>
                </div>
                <textarea
                  id="complaint-description"
                  value={complaintForm.description}
                  onChange={(event) => setComplaintForm({ ...complaintForm, description: event.target.value })}
                  maxLength={500}
                  placeholder="Describe the serious issue..."
                  className="min-h-36 w-full rounded-xl border border-white/10 bg-[#222] p-4 text-sm text-white outline-none focus:border-[#EF233C]/50"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={!canSendComplaint}
                onClick={submitComplaint}
                className="flex-1 rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                Submit Complaint
              </button>
              <button type="button" onClick={() => setShowComplaintModal(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectPackageOnboarding({ onMemberActivated }: { onMemberActivated?: (user: any) => void }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [packages, setPackages] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [step, setStep] = useState<'package' | 'trainer' | 'payment'>('package');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      setIsLoading(true);
      const [packageResult, trainerResult] = await Promise.all([
        fetchPackagesFromSupabase(),
        fetchTrainersFromSupabase(),
      ]);

      if (!isMounted) return;

      setPackages(packageResult.error ? [] : packageResult.data.filter((item: any) => item.isActive !== false));
      setTrainers(trainerResult.error ? [] : trainerResult.data.filter((item: any) => item.status === 'active'));
      setMessage(packageResult.error || trainerResult.error ? 'Some package or trainer data could not be loaded.' : '');
      setIsLoading(false);
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!selectedTrainer?.id) {
      setAvailability([]);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingAvailability(true);
    getTrainerWeeklyAvailability(selectedTrainer.id).then(({ data }) => {
      if (!isMounted) return;
      setAvailability(data);
      setIsLoadingAvailability(false);
    }).catch(() => {
      if (!isMounted) return;
      setAvailability([]);
      setIsLoadingAvailability(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTrainer?.id]);

  const choosePackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setSelectedTrainer(null);
    setSelectedSlot(null);
    setStep(pkg.hasPersonalTrainer ? 'trainer' : 'payment');
    setMessage('');
  };

  const chooseTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
    setSelectedSlot(null);
    setMessage('');
  };

  const chooseSlot = (day: any, slot: any) => {
    if (!slot.available) return;
    setSelectedSlot({
      dayKey: day.key,
      dayLabel: day.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `${day.label}, ${slot.label}`,
    });
    setStep('payment');
    setMessage('');
  };

  const completePayment = async () => {
    if (!selectedPackage) return;
    if (selectedPackage.hasPersonalTrainer && (!selectedTrainer || !selectedSlot)) {
      setMessage('Please choose a trainer and a weekly training slot.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const activeUser = {
      ...currentUser,
      role: currentUser?.role || 'member',
      accountStatus: 'Active',
      account_status: 'active',
    };
    const flowData = {
      currentUser,
      selectedPackage,
      selectedTrainer,
      selectedSlot,
      paymentMethod,
      sessionLimit: selectedPackage.sessionLimitValue ?? (selectedPackage.hasPersonalTrainer ? 4 : null),
    };

    setCurrentUser(activeUser);
    onMemberActivated?.(activeUser);
    setIsSubmitting(false);
    navigate('/member', { replace: true });

    void (async () => {
      try {
        await withTimeout(activateMemberAccount(flowData.currentUser), 10000, 'Account activation timed out.');

        const createdPackage = await withTimeout(createMemberPackage({
          memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
          memberEmail: flowData.currentUser?.email || '',
          packageId: flowData.selectedPackage.id,
          trainerId: flowData.selectedTrainer?.id || null,
          status: 'pending_payment',
          remainingSessions: flowData.sessionLimit,
        }), 10000, 'Package registration timed out.');

        if (createdPackage.error || !createdPackage.data?.memberPackageId) {
          console.error('[Gymster hệ thống] Demo package registration could not be saved:', createdPackage.error);
          return;
        }

        const transactionCode = `GYMSTER-DEMO-${Date.now()}`;
        const paymentDate = new Date().toISOString();
        const paymentResult = await withTimeout(createPayment({
          memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
          memberEmail: flowData.currentUser?.email || '',
          packageId: flowData.selectedPackage.id,
          memberPackageId: createdPackage.data.memberPackageId,
          amount: flowData.selectedPackage.price,
          paymentMethod: flowData.paymentMethod,
          paymentDate,
          transactionCode,
          transferContent: `GYMSTER DEMO ${flowData.selectedPackage.code || flowData.selectedPackage.id}`,
        }), 10000, 'Payment save timed out.');

        if (paymentResult.error) {
          console.error('[Gymster hệ thống] Demo payment could not be saved:', paymentResult.error);
          return;
        }

        const startDate = toDateInputValue(new Date(paymentDate));
        const endDate = toDateInputValue(addMonths(new Date(paymentDate), getPackageDurationMonths(flowData.selectedPackage)));
        const packageUpdate = await withTimeout(updateMemberPackageStatus(createdPackage.data.memberPackageId, 'active', {
          start_date: startDate,
          end_date: endDate,
          remaining_sessions: flowData.sessionLimit,
          used_sessions: 0,
          activated_at: paymentDate,
        }), 10000, 'Package activation timed out.');

        if (packageUpdate.error) {
          console.error('[Gymster hệ thống] Demo member package could not be activated:', packageUpdate.error);
          return;
        }

        if (flowData.selectedPackage.hasPersonalTrainer && flowData.selectedTrainer && flowData.selectedSlot) {
          await withTimeout(createWorkoutSessionsForSchedule({
            memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
            memberEmail: flowData.currentUser?.email || '',
            trainerId: flowData.selectedTrainer.id,
            packageId: flowData.selectedPackage.id,
            memberPackageId: createdPackage.data.memberPackageId,
            selectedSchedule: flowData.selectedSlot.label,
            sessionCount: flowData.sessionLimit || 4,
          }), 8000, 'Workout session creation timed out.');
        }
      } catch (error) {
        console.error('[Gymster hệ thống] Demo payment background sync failed:', error);
      }
    })();

  };

  const canPay = Boolean(
    selectedPackage &&
    paymentMethod &&
    (!selectedPackage.hasPersonalTrainer || (selectedTrainer && selectedSlot)),
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Select Package</h1>
        <p className="mt-1 text-sm text-white/50">
          Choose a membership package. PT packages require a trainer and one available weekly training slot.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Package', step === 'package' || selectedPackage, selectedPackage?.name || 'Choose package'],
          ['Trainer & Schedule', !selectedPackage?.hasPersonalTrainer || step === 'trainer' || selectedTrainer, selectedPackage?.hasPersonalTrainer ? selectedTrainer?.name || 'Choose trainer' : 'Not required'],
          ['Payment', step === 'payment', paymentMethod],
        ].map(([label, active, value]) => (
          <div key={label as string} className={`rounded-2xl border p-4 ${active ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#181818]'}`}>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-white/35">{label}</div>
            <div className="mt-2 text-sm font-black text-white">{value as string}</div>
          </div>
        ))}
      </div>

      <Section title="Available Packages">
        {isLoading ? (
          <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">Loading packages...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => choosePackage(pkg)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedPackage?.id === pkg.id ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EF233C]/15 text-[#EF233C]">
                    {pkg.hasPersonalTrainer ? <Users className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">{pkg.type}</span>
                </div>
                <h2 className="text-xl font-black text-white">{pkg.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-white/55">{pkg.description || 'Membership package'}</p>
                <div className="mt-4 grid gap-2 text-sm text-white/65">
                  <div>Duration: <span className="font-bold text-white">{pkg.duration}</span></div>
                  <div>Sessions: <span className="font-bold text-white">{pkg.sessionLimit}</span></div>
                  <div>Trainer: <span className="font-bold text-white">{pkg.hasPersonalTrainer ? 'Required' : 'Optional later'}</span></div>
                </div>
                <div className="mt-5 text-2xl font-black text-[#EF233C]">{Number(pkg.price || 0).toLocaleString('vi-VN')} VND</div>
              </button>
            ))}
            {!packages.length && <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">No active packages found.</div>}
          </div>
        )}
      </Section>

      {selectedPackage?.hasPersonalTrainer && (
        <Section title="Choose PT and Weekly Schedule">
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <button
                  key={trainer.id}
                  type="button"
                  onClick={() => chooseTrainer(trainer)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedTrainer?.id === trainer.id ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">{trainer.name}</div>
                      <div className="mt-1 text-sm font-semibold text-white/45">{trainer.specialty}</div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C]">
                      <Star className="h-3.5 w-3.5 fill-current" /> {trainer.rating || 'New'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-bold text-white/40">
                    Active members {trainer.currentActiveMembers}/{trainer.maxActiveMembers || '-'}
                  </div>
                </button>
              ))}
              {!trainers.length && <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">No active trainers found.</div>}
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">Weekly available slots</h3>
                  <p className="mt-1 text-xs font-semibold text-white/45">Booked slots are hidden from selection.</p>
                </div>
                {selectedSlot && <span className="rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C]">{selectedSlot.label}</span>}
              </div>

              {!selectedTrainer ? (
                <div className="rounded-xl border border-white/8 bg-black/20 p-6 text-center text-sm font-bold text-white/45">Choose a PT to see available slots.</div>
              ) : isLoadingAvailability ? (
                <div className="rounded-xl border border-white/8 bg-black/20 p-6 text-center text-sm font-bold text-white/45">Loading PT schedule...</div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-7">
                  {availability.map((day) => (
                    <div key={day.key} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="mb-3 text-center text-sm font-black text-white">{day.shortLabel}</div>
                      <div className="grid gap-2">
                        {day.slots.map((slot: any) => (
                          <button
                            key={`${day.key}-${slot.label}`}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => chooseSlot(day, slot)}
                            className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                              selectedSlot?.dayKey === day.key && selectedSlot?.startTime === slot.startTime
                                ? 'border-[#EF233C] bg-[#EF233C] text-white'
                                : slot.available
                                  ? 'border-white/10 bg-white/5 text-white/70 hover:border-[#EF233C]/45 hover:text-white'
                                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20 line-through'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {selectedPackage && (!selectedPackage.hasPersonalTrainer || selectedSlot) && (
        <Section title="Payment">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="rounded-2xl border border-white/8 bg-[#222] p-5">
              <h3 className="text-xl font-black text-white">{selectedPackage.name}</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <div className="flex justify-between gap-3"><span>Amount</span><span className="font-black text-white">{Number(selectedPackage.price || 0).toLocaleString('vi-VN')} VND</span></div>
                <div className="flex justify-between gap-3"><span>Trainer</span><span className="font-black text-white">{selectedTrainer?.name || 'Not required'}</span></div>
                <div className="flex justify-between gap-3"><span>Schedule</span><span className="font-black text-white">{selectedSlot?.label || 'Not required'}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className="flex w-full items-center gap-3 rounded-xl border border-[#EF233C] bg-[#EF233C]/10 px-4 py-3 text-left text-sm font-black text-white transition"
              >
                <CreditCard className="h-4 w-4 text-[#EF233C]" />
                Bank Transfer
              </button>
              <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm leading-6 text-white/55">
                Bank transfer QR payment will be connected later. Use demo skip to activate this member package while testing.
              </div>
              <button
                type="button"
                disabled={!canPay || isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white/35 disabled:cursor-not-allowed"
              >
                Continue to Bank Transfer (Coming Soon)
              </button>
              <button
                type="button"
                disabled={!canPay || isSubmitting}
                onClick={completePayment}
                className="w-full rounded-xl bg-[#EF233C] px-5 py-4 text-sm font-black text-white transition hover:bg-[#c91930] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {isSubmitting ? 'Activating...' : 'Skip payment (demo)'}
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

function Profile() {
  const { profile, isLoading, errorMessage } = useSupabaseUserProfile('member');

  return (
    <>
      {(isLoading || errorMessage) && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#181818] p-4 text-sm font-bold text-white/55">
            {isLoading ? 'Loading profile...' : errorMessage}
          </div>
        </div>
      )}
      <AccountProfile
        title="Member Profile"
        subtitle="Member Account"
        firstName={profile.firstName}
        lastName={profile.lastName}
        roleLabel={profile.roleLabel}
        dob={profile.dob || ''}
        headline={profile.headline}
        email={profile.email}
        phone={profile.phone}
        initials={profile.initials}
        avatarUrl={profile.avatarUrl}
      />
    </>
  );
}

function MemberSettings() {
  const { profile } = useSupabaseUserProfile('member');

  return (
    <AccountSettings
      eyebrow="Member Account"
      title="Settings"
      description="Manage notification preferences, password, display mode, language, and contact information for the member account."
      accountName={profile.fullName || 'Member'}
      roleLabel={profile.roleLabel || 'Gym Member'}
      primaryEmail={profile.email || ''}
      phoneNumber={profile.phone || ''}
    />
  );
}

function MemberLayout() {
  const navigate = useNavigate();
  const { profile } = useSupabaseUserProfile('member');
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const isActiveMember = currentUser?.accountStatus === 'Active' || currentUser?.account_status === 'active';
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
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="my-package" element={<MyPackage />} />
          <Route path="my-schedule" element={<MySchedule />} />
          <Route path="trainers" element={<Trainers />} />
          <Route path="rate-service" element={<RateService />} />
          <Route path="notifications" element={<RoleNotificationsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<MemberSettings />} />
          <Route path="*" element={<Navigate to="/member" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route index element={<Navigate to="/member/select-package" replace />} />
          <Route path="select-package" element={<SelectPackageOnboarding onMemberActivated={setCurrentUserState} />} />
          <Route path="settings" element={<MemberSettings />} />
          <Route path="*" element={<Navigate to="/member/select-package" replace />} />
        </Routes>
      )}
    </RoleShell>
  );
}

export default function App() {
  return <MemberLayout />;
}


