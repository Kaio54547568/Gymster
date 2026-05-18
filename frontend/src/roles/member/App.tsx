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
  User,
  Users,
} from 'lucide-react';
import RoleShell, { type RoleShellItem } from '../shared/RoleShell';
import AccountProfile from '../shared/AccountProfile';
import AccountSettings from '../shared/AccountSettings';
import { useSupabaseUserProfile } from '../shared/useSupabaseUserProfile';
import { getAvailableTrainers, getMemberTrainingNotifications, getTrainingRequests } from '../../services/trainerService';
import { getCurrentUser } from '../../services/authService';
import { getTrainingRequestsForMember } from '../../services/trainingRequestApi';
import { fetchPackagesFromSupabase } from '../../services/packageApi';
import {
  createPackageChangeRequest,
  createPendingRenewalRequest,
  getCurrentMemberPackageForUser,
} from '../../services/memberPackageApi';
import { getInvoicesForMember } from '../../services/invoiceApi';
import { getPaymentsForMember } from '../../services/paymentApi';
import {
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForMember,
} from '../../services/workoutSessionApi';

const member = {
  name: 'Nguyen Van A',
  email: 'nguyenvana@gmail.com',
  phone: '0912 345 678',
  initials: 'NVA',
  package: 'Basic Gym 6 Months',
  role: 'Gym Member',
};

const currentPackage = {
  title: 'Basic Gym 6 Months',
  status: 'Active',
  registrationDate: '10/04/2026',
  expiryDate: '10/10/2026',
  totalSessions: 48,
  usedSessions: 36,
  remainingSessions: 12,
  daysRemaining: 30,
  price: '3,000,000 VND',
};

const packages = [
  { title: 'Basic Gym 3 Months', duration: '3 months', price: '1,500,000 VND', benefits: ['Unlimited gym access', 'Basic nutrition guidance', 'Locker access'] },
  { title: 'Basic Gym 6 Months', duration: '6 months', price: '3,000,000 VND', benefits: ['Cardio area access', 'Priority schedule support', 'Monthly body check'] },
  { title: 'VIP PT Package', duration: '3 months', price: '5,000,000 VND', benefits: ['24 PT sessions', 'Personal workout plan', 'Weekly progress tracking'] },
];

const workouts = [
  { title: 'Strength Training', trainer: 'Alex Carter', date: '18/05/2026', time: '18:00 - 19:00', status: 'Upcoming' },
  { title: 'Cardio & HIIT', trainer: 'Maya Tran', date: '20/05/2026', time: '19:00 - 20:00', status: 'Upcoming' },
  { title: 'Full Body Recovery', trainer: 'Jordan Lee', date: '12/05/2026', time: '07:00 - 08:00', status: 'Completed' },
];

const trainers = [
  { name: 'Alex Carter', specialty: 'Strength Training', rating: 4.8, experience: '5 years', students: 120 },
  { name: 'Maya Tran', specialty: 'Weight Loss, Cardio, HIIT', rating: 4.7, experience: '4 years', students: 95 },
  { name: 'Jordan Lee', specialty: 'Yoga, Mobility, Recovery', rating: 4.9, experience: '6 years', students: 140 },
];

const transactions = [
  { id: 'INV-1001', service: 'Basic Gym 6 Months', date: '10/04/2026', amount: '3,000,000 VND', status: 'Paid' },
  { id: 'INV-0974', service: 'PT trial session', date: '02/04/2026', amount: '300,000 VND', status: 'Paid' },
];
const paymentMethods = ['Cash', 'Bank Transfer', 'Credit Card', 'E-Wallet'];

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
  const [requests, setRequests] = useState<any[]>(getTrainingRequests());
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
          setRequests(getTrainingRequests());
          setRequestLoadMessage(error ? 'Supabase request status could not be loaded. Showing demo request status.' : '');
        } else {
          setRequests(data);
          setRequestLoadMessage('');
        }

        setIsLoadingRequests(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setRequests(getTrainingRequests());
        setRequestLoadMessage('Supabase request status could not be loaded. Showing demo request status.');
        setIsLoadingRequests(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { requests, isLoadingRequests, requestLoadMessage };
}

function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Member Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">Welcome back, {member.name}. Track your membership, workouts, and trainers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Monthly Workouts', '9', CalendarDays],
          ['Calories Burned', '8,420', Dumbbell],
          ['Remaining Sessions', currentPackage.remainingSessions, History],
          ['Days Remaining', currentPackage.daysRemaining, CheckCircle],
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
              <div className="text-2xl font-black text-white">{currentPackage.title}</div>
              <div className="mt-1 text-sm text-[#EF233C]">{currentPackage.status} · {currentPackage.expiryDate}</div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${(currentPackage.usedSessions / currentPackage.totalSessions) * 100}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-white/65">
              <div>Used: <span className="font-bold text-white">{currentPackage.usedSessions}</span></div>
              <div>Remaining: <span className="font-bold text-white">{currentPackage.remainingSessions}</span></div>
            </div>
          </div>
        </Section>

        <Section title="Upcoming Workout">
          <div className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4">
            <div className="font-bold text-white">{workouts[0].title}</div>
            <div className="mt-2 text-sm text-white/60">{workouts[0].trainer}</div>
            <div className="mt-2 text-sm font-semibold text-[#EF233C]">{workouts[0].date} · {workouts[0].time}</div>
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
  const getDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return currentPackage.daysRemaining;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const fallbackPackages: DisplayPackage[] = packages.map((item, index) => ({
    id: `fallback-${index}`,
    title: item.title,
    name: item.title,
    duration: item.duration,
    price: item.price,
    priceValue: Number(String(item.price).replace(/[^\d]/g, '')) || 0,
    description: item.benefits.join(', '),
    sessionLimit: item.benefits.find((benefit) => benefit.toLowerCase().includes('session')) || 'Unlimited gym access',
    hasPersonalTrainer: item.benefits.some((benefit) => benefit.toLowerCase().includes('pt')),
    benefits: item.benefits,
  }));
  const fallbackTransactions: DisplayTransaction[] = [
    ...transactions,
    { id: 'INV-1000', service: 'VIP PT package', date: '08/05/2026', amount: '5,000,000 VND', status: 'Pending' },
    { id: 'INV-0951', service: 'E-Wallet renewal', date: '25/03/2026', amount: '1,500,000 VND', status: 'Failed' },
  ];

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
      } else if (packagesResult.error) {
        setAvailablePackages(fallbackPackages);
      }

      if (!currentPackageResult.error && currentPackageResult.data) {
        const item = currentPackageResult.data;
        const totalSessions = item.sessionsTotal ?? item.packageSessionLimit ?? 0;
        const usedSessions = item.usedSessions ?? 0;
        const remainingSessions = item.remainingSessions ?? (totalSessions > 0 ? Math.max(0, totalSessions - usedSessions) : '-');
        setResolvedMemberId(currentPackageResult.memberId || item.memberId || null);
        setDisplayCurrentPackage({
          hasPackage: true,
          title: item.packageName || currentPackage.title,
          status: item.status || currentPackage.status,
          registrationDate: formatDate(item.startDate || item.activatedAt),
          expiryDate: formatDate(item.endDate),
          totalSessions,
          usedSessions,
          remainingSessions,
          daysRemaining: getDaysRemaining(item.endDate),
          price: item.packagePrice ? formatVnd(item.packagePrice) : currentPackage.price,
          trainer: item.trainerName || '',
        });
      } else if (currentPackageResult.error) {
        setDisplayCurrentPackage({
          hasPackage: true,
          title: currentPackage.title,
          status: currentPackage.status,
          registrationDate: currentPackage.registrationDate,
          expiryDate: currentPackage.expiryDate,
          totalSessions: currentPackage.totalSessions,
          usedSessions: currentPackage.usedSessions,
          remainingSessions: currentPackage.remainingSessions,
          daysRemaining: currentPackage.daysRemaining,
          price: currentPackage.price,
          trainer: '',
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
      } else if (paymentsResult.error || invoicesResult.error) {
        setTransactionRows(fallbackTransactions);
      } else {
        setTransactionRows([]);
      }

      setLoadMessage(
        packagesResult.error || currentPackageResult.error || paymentsResult.error || invoicesResult.error
          ? 'Some membership data could not be loaded. Demo data is shown temporarily.'
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
      memberId: resolvedMemberId || currentUser?.memberId || currentUser?.member_id || currentUser?.id || 'mock-member',
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

    const request = createPendingRenewalRequest(requestPayload);
    setRequestMessage(`Request ${request.requestId} submitted locally because Supabase insert failed.`);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Package</h1>
      {isLoadingMemberPackage && <div className="rounded-2xl border border-white/8 bg-[#181818] p-4 text-sm font-bold text-white/45">Loading package data from Supabase...</div>}
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
                <div className="mt-1 font-bold text-white">{displayCurrentPackage.daysRemaining} days</div>
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
                  {displayCurrentPackage.usedSessions}/{displayCurrentPackage.totalSessions} sessions used
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
function MyScheduleOld() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Schedule</h1>
      <Section title="Workout Calendar">
        <div className="grid gap-4 md:grid-cols-3">
          {workouts.map((item) => (
            <div key={`${item.date}-${item.title}`} className="rounded-xl border border-white/8 bg-[#222] p-4">
              <div className="font-bold text-white">{item.title}</div>
              <div className="mt-1 text-sm text-white/55">{item.trainer}</div>
              <div className="mt-3 text-sm font-semibold text-[#EF233C]">{item.date} · {item.time}</div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-lg bg-[#EF233C] px-3 py-2 text-xs font-bold text-white">View Detail</button>
                <button className="rounded-lg border border-[#EF233C]/30 px-3 py-2 text-xs font-bold text-[#EF233C]">Reschedule</button>
                <button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60">Cancel</button>
              </div>
            </div>
          ))}
        </div>
      </Section>
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
  const fallbackScheduleSessions: ScheduleSession[] = [
    {
      id: 'S001',
      title: 'Strength Training',
      trainer: 'Alex Carter',
      date: 'May 18, 2026',
      day: 'Mon',
      time: '18:00 - 19:00',
      startHour: 18,
      room: 'Strength Zone A',
      status: 'Scheduled',
      packageName: currentPackage.title,
      notes: 'Focus on compound lifts. Bring lifting gloves and arrive 10 minutes early.',
    },
    {
      id: 'S002',
      title: 'Cardio & HIIT',
      trainer: 'Maya Tran',
      date: 'May 20, 2026',
      day: 'Wed',
      time: '19:00 - 20:00',
      startHour: 19,
      room: 'Studio 2',
      status: 'Scheduled',
      packageName: currentPackage.title,
      notes: 'High-intensity interval session. Keep hydration ready.',
    },
    {
      id: 'S003',
      title: 'Mobility Recovery',
      trainer: 'Jordan Lee',
      date: 'May 22, 2026',
      day: 'Fri',
      time: '08:00 - 09:00',
      startHour: 8,
      room: 'Recovery Room',
      status: 'Pending Reschedule',
      packageName: currentPackage.title,
      notes: 'Member requested a later slot. Awaiting trainer confirmation.',
    },
    {
      id: 'S004',
      title: 'Full Body Recovery',
      trainer: 'Jordan Lee',
      date: 'May 12, 2026',
      day: 'Tue',
      time: '07:00 - 08:00',
      startHour: 7,
      room: 'Yoga Studio',
      status: 'Completed',
      packageName: currentPackage.title,
      notes: 'Completed recovery session with mobility assessment.',
    },
  ];
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
      notes: session.note || 'Workout session loaded from Supabase.',
    };
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingSessions(true);

    getWorkoutSessionsForMember(getCurrentUser())
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          setScheduleSessions(fallbackScheduleSessions);
          setSessionLoadMessage('Some workout sessions could not be loaded. Demo schedule is shown temporarily.');
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
        setScheduleSessions(fallbackScheduleSessions);
        setSessionLoadMessage('Some workout sessions could not be loaded. Demo schedule is shown temporarily.');
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
        {isLoadingSessions && <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading workout sessions from Supabase...</div>}
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
  const availableTrainers = getAvailableTrainers();
  const { requests: memberRequests, isLoadingRequests, requestLoadMessage } = useMemberTrainingRequests();
  const trackedRequests = memberRequests.filter((request) => ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.statusLabel) || ['Pending Approval', 'Accepted', 'Declined', 'Completed'].includes(request.status) || ['pending_pt_approval', 'accepted', 'approved', 'declined', 'completed'].includes(request.rawStatus || request.status));
  const declinedRequests = trackedRequests.filter((request) => request.status === 'declined' || request.statusLabel === 'Declined' || request.status === 'Declined' || request.rawStatus === 'declined');
  const notifications = getMemberTrainingNotifications();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">Trainers</h1>
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
              <span>{trainer.experience}</span>
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
  const trainerTargets = ['Nguyen Van Nam', 'Tran Minh Duc', 'Le Hoang An'];
  const recentSessions = ['Strength Training - May 18, 2026', 'Cardio & HIIT - May 20, 2026', 'Full Body Recovery - May 12, 2026'];
  const equipmentRooms = ['Strength Zone A', 'Studio 2', 'Recovery Room', 'Cardio Area', 'Locker Room'];
  const recentFeedback: Array<{ target: string; date: string; rating: number; comment: string; status: FeedbackStatus; response?: string }> = [
    {
      target: 'Strength Training with Nguyen Van Nam',
      date: 'May 10, 2026',
      rating: 5,
      comment: 'Great coaching and clear exercise corrections throughout the session.',
      status: 'Resolved',
      response: 'Thank you. We shared your feedback with the trainer team.',
    },
    {
      target: 'Cardio Area',
      date: 'May 04, 2026',
      rating: 3,
      comment: 'Room was crowded during peak hours.',
      status: 'In Review',
    },
    {
      target: 'Customer Support',
      date: 'Apr 28, 2026',
      rating: 4,
      comment: 'Support staff helped me renew the package quickly.',
      status: 'Submitted',
    },
  ];
  const recentComplaints: Array<{ type: string; target: string; date: string; description: string; status: ComplaintStatus; response?: string }> = [
    {
      type: 'Equipment',
      target: 'Treadmill X12 #5',
      date: 'May 12, 2026',
      description: 'The treadmill stopped suddenly during use and needs urgent inspection.',
      status: 'In Review',
      response: 'The maintenance team has been notified and the machine is temporarily unavailable.',
    },
    {
      type: 'Customer Support',
      target: 'Front desk',
      date: 'May 02, 2026',
      description: 'I needed faster support for a package renewal question.',
      status: 'Resolved',
    },
  ];

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
                onClick={() => {
                  setShowComplaintModal(false);
                  setComplaintForm({ type: '', target: '', description: '' });
                }}
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

function Profile() {
  const { profile, isLoading, errorMessage } = useSupabaseUserProfile('member');

  return (
    <>
      {(isLoading || errorMessage) && (
        <div className="px-6 pt-6">
          <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#181818] p-4 text-sm font-bold text-white/55">
            {isLoading ? 'Loading profile from Supabase...' : errorMessage}
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
  const menuItems: RoleShellItem[] = [
    { id: 'dashboard', path: '/member', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'package', path: '/member/my-package', icon: ReceiptText, label: 'My Package' },
    { id: 'schedule', path: '/member/my-schedule', icon: CalendarDays, label: 'My Schedule' },
    { id: 'trainers', path: '/member/trainers', icon: Users, label: 'Trainers' },
    { id: 'rate-service', path: '/member/rate-service', icon: MessageSquare, label: 'Rate Service' },
    { id: 'profile', path: '/member/profile', icon: User, label: 'Profile' },
    { id: 'settings', path: '/member/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <RoleShell
      menuItems={menuItems}
      portalLabel="Member Portal"
      searchPlaceholder="Search packages, workouts, trainers..."
      userName={profile.fullName || 'Member'}
      userRole={profile.roleLabel}
      userInitials={profile.initials}
      onAvatarClick={() => navigate('/member/profile')}
    >
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="my-package" element={<MyPackage />} />
        <Route path="my-schedule" element={<MySchedule />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="rate-service" element={<RateService />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<MemberSettings />} />
        <Route path="*" element={<Navigate to="/member" replace />} />
      </Routes>
    </RoleShell>
  );
}

export default function App() {
  return <MemberLayout />;
}


