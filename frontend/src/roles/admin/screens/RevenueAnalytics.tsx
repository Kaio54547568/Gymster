import { useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import {
  DollarSign,
  TrendingUp,
  Download,
  FileDown,
  Printer,
  Calendar,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getAllPayments } from '../../../services/paymentApi';
import { getInvoicesForAdmin } from '../../../services/invoiceApi';

const monthlyRevenue = [
  { month: 'Jan', revenue: 450 },
  { month: 'Feb', revenue: 520 },
  { month: 'Mar', revenue: 680 },
  { month: 'Apr', revenue: 750 },
  { month: 'May', revenue: 820 },
  { month: 'Jun', revenue: 950 }
];

const fallbackRevenueByPaymentMethod = [
  { name: 'Cash', value: 35, color: '#22C55E' },
  { name: 'Bank Transfer', value: 45, color: '#EF233C' },
  { name: 'Credit Card', value: 15, color: '#F97316' },
  { name: 'E-Wallet', value: 5, color: '#990000' }
];

const revenueByPackage = [
  { package: 'Basic 3 Months', revenue: 280 },
  { package: 'Basic 6 Months', revenue: 320 },
  { package: 'VIP 12 Months', revenue: 220 },
  { package: 'PT Elite', revenue: 130 }
];

const fallbackInvoiceRows = [
  { invoiceId: 'INV-2026-001', amount: 2500000, date: '08/05/2026', packageType: 'Basic 3 Months', member: 'Nguyen Van A', method: 'Bank Transfer', status: 'Paid' },
  { invoiceId: 'INV-2026-002', amount: 4500000, date: '08/05/2026', packageType: 'Basic 6 Months', member: 'Taylor Morgan', method: 'Cash', status: 'Paid' },
  { invoiceId: 'INV-2026-003', amount: 8000000, date: '07/05/2026', packageType: 'VIP PT Package', member: 'Jordan Lee', method: 'Credit Card', status: 'Pending' },
];

const employeeRevenue = [
  { name: 'Alex Carter', revenue: '85,500,000', contracts: 34, ranking: 1, contribution: '28%' },
  { name: 'Gymster Staff', revenue: '72,300,000', contracts: 29, ranking: 2, contribution: '24%' },
  { name: 'Jordan Lee', revenue: '68,900,000', contracts: 27, ranking: 3, contribution: '23%' },
  { name: 'Taylor Morgan', revenue: '56,200,000', contracts: 22, ranking: 4, contribution: '19%' },
  { name: 'Owner Gymster', revenue: '45,100,000', contracts: 18, ranking: 5, contribution: '15%' }
];

type RevenueRow = {
  invoiceId: string;
  amount: number;
  date: string;
  packageType: string;
  member: string;
  method: string;
  status: string;
};

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatCompactVnd(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B VND`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M VND`;
  return formatVnd(value);
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
}

function formatStatus(status: string) {
  return String(status || 'pending')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMethod(method: string) {
  return String(method || 'Payment')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'paid' || normalized === 'issued') {
    return 'glass border border-[#22C55E]/30 text-[#22C55E] shadow-[#22C55E]/20';
  }
  if (normalized === 'pending' || normalized === 'draft') {
    return 'glass border border-[#F97316]/30 text-[#F97316] shadow-[#F97316]/20';
  }
  return 'glass border border-[#EF233C]/30 text-[#EF233C] shadow-[#EF233C]/20';
}

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [payments, setPayments] = useState<any[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<RevenueRow[]>(fallbackInvoiceRows);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRevenueData() {
      setIsLoading(true);
      const [paymentsResult, invoicesResult] = await Promise.all([
        getAllPayments(),
        getInvoicesForAdmin(),
      ]);

      if (!isMounted) return;

      if (!paymentsResult.error) {
        setPayments(paymentsResult.data);
      }

      if (!invoicesResult.error && invoicesResult.data.length) {
        setInvoiceRows(invoicesResult.data.map((invoice: any) => ({
          invoiceId: invoice.invoiceNumber || invoice.invoiceId,
          amount: invoice.amount,
          date: formatDate(invoice.issuedAt),
          packageType: invoice.packageName || 'Membership package',
          member: invoice.memberName || 'Member',
          method: formatMethod(invoice.paymentMethod || 'invoice'),
          status: invoice.statusLabel || formatStatus(invoice.status),
        })));
      } else if (!paymentsResult.error && paymentsResult.data.length) {
        setInvoiceRows(paymentsResult.data.map((payment: any) => ({
          invoiceId: payment.transactionCode || payment.paymentId,
          amount: payment.amount,
          date: formatDate(payment.paymentDate),
          packageType: payment.packageName || 'Membership package',
          member: payment.memberName || 'Member',
          method: formatMethod(payment.paymentMethod),
          status: payment.paymentStatusLabel || formatStatus(payment.paymentStatus),
        })));
      } else if (paymentsResult.error || invoicesResult.error) {
        setInvoiceRows(fallbackInvoiceRows);
      } else {
        setInvoiceRows([]);
      }

      setLoadMessage(
        paymentsResult.error || invoicesResult.error
          ? 'Some payment or invoice data could not be loaded. Demo rows are shown temporarily.'
          : ''
      );
      setIsLoading(false);
    }

    loadRevenueData();

    return () => {
      isMounted = false;
    };
  }, []);

  const paymentSummary = useMemo(() => {
    const paidPayments = payments.filter((payment) => payment.paymentStatus === 'paid');
    return {
      totalRevenue: paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      paidCount: paidPayments.length,
      pendingCount: payments.filter((payment) => payment.paymentStatus === 'pending').length,
      failedCount: payments.filter((payment) => ['failed', 'cancelled', 'refunded'].includes(payment.paymentStatus)).length,
    };
  }, [payments]);

  const revenueByPaymentMethod = useMemo(() => {
    if (!payments.length) return fallbackRevenueByPaymentMethod;

    const paidTotal = payments
      .filter((payment) => payment.paymentStatus === 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    if (!paidTotal) return fallbackRevenueByPaymentMethod;

    const colors = ['#22C55E', '#EF233C', '#F97316', '#990000'];
    const totals = payments
      .filter((payment) => payment.paymentStatus === 'paid')
      .reduce<Record<string, number>>((acc, payment) => {
        const method = formatMethod(payment.paymentMethod);
        acc[method] = (acc[method] || 0) + Number(payment.amount || 0);
        return acc;
      }, {});

    return Object.entries(totals).map(([name, total], index) => ({
      name,
      value: Math.round((total / paidTotal) * 100),
      color: colors[index % colors.length],
    }));
  }, [payments]);

  return (
    <div className="p-10 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-7xl text-white tracking-wider mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text">
            REVENUE ANALYTICS
          </h1>
          <p className="text-white/50 text-lg font-medium">Detailed revenue, payment, and invoice overview</p>
        </div>

        <div className="flex items-center gap-4 glass border border-white/10 rounded-2xl px-6 py-4">
          <Calendar className="w-6 h-6 text-[#EF233C]" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer text-base font-semibold"
          >
            <option value="today" className="bg-[#0c1014]">Today</option>
            <option value="week" className="bg-[#0c1014]">This week</option>
            <option value="month" className="bg-[#0c1014]">This month</option>
            <option value="quarter" className="bg-[#0c1014]">This quarter</option>
            <option value="year" className="bg-[#0c1014]">This year</option>
            <option value="custom" className="bg-[#0c1014]">Custom</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-white/50">
          Loading payments and invoices from Supabase...
        </div>
      )}

      {loadMessage && !isLoading && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">
          {loadMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatCompactVnd(paymentSummary.totalRevenue || 950000000)}
          change="+15.3%"
          changeType="positive"
          icon={DollarSign}
          iconColor="#22C55E"
        />
        <KPICard
          title="Paid Payments"
          value={String(paymentSummary.paidCount)}
          change="+8.2%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="#EF233C"
        />
        <KPICard
          title="Pending Payments"
          value={String(paymentSummary.pendingCount)}
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          iconColor="#F97316"
        />
        <KPICard
          title="Failed Payments"
          value={String(paymentSummary.failedCount)}
          change="+0.0%"
          changeType="positive"
          icon={TrendingUp}
          iconColor="#22C55E"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Monthly Revenue Growth"
          subtitle="Last 6 months"
          action={
            <button className="px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold">
              <Download className="w-4 h-4 inline mr-2" />
              Export
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue} id="revenue-monthly-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#A1A1AA" />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#EF233C" strokeWidth={3} dot={{ fill: '#EF233C', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Payment Method">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart id="revenue-payment-method-chart">
              <Pie
                data={revenueByPaymentMethod}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {revenueByPaymentMethod.map((entry, index) => (
                  <Cell key={`revenue-payment-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Package Type" subtitle="Package-level overview">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPackage} id="revenue-package-type-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="package" stroke="#A1A1AA" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#A1A1AA" />
              <Tooltip contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }} />
              <Bar dataKey="revenue" fill="#EF233C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="glass border border-white/10 rounded-[2rem] p-8 shadow-float">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold text-white tracking-tight">Invoice / Payment List</h3>
          <div className="flex gap-3">
            <button className="px-6 py-3 glass border border-white/10 text-white rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 text-sm font-semibold flex items-center gap-2 group">
              <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Download PDF
            </button>
            <button className="px-6 py-3 glass border border-white/10 text-white rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 text-sm font-semibold flex items-center gap-2 group">
              <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Print Report
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-8 gap-4 px-6 py-4">
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Invoice</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Amount</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Date</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Package</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Member</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Method</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Status</div>
            <div className="text-white/50 text-sm font-bold uppercase tracking-wider">Action</div>
          </div>

          {invoiceRows.length ? (
            invoiceRows.map((invoice) => (
              <div
                key={invoice.invoiceId}
                className="grid grid-cols-8 gap-4 px-6 py-5 glass border border-white/5 rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center text-white font-bold">{invoice.invoiceId}</div>
                <div className="flex items-center text-[#22C55E] font-bold text-lg">{formatVnd(invoice.amount)}</div>
                <div className="flex items-center text-white/70">{invoice.date}</div>
                <div className="flex items-center text-white font-medium">{invoice.packageType}</div>
                <div className="flex items-center text-white/70">{invoice.member}</div>
                <div className="flex items-center">
                  <span className="px-4 py-2 glass border border-[#EF233C]/30 rounded-xl text-[#EF233C] text-xs font-bold shadow-lg shadow-[#EF233C]/20">
                    {invoice.method}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatusClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center">
                  <button className="text-[#EF233C] hover:text-white font-bold text-sm group-hover:scale-110 transition-transform">
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/5 px-6 py-8 text-center text-sm font-bold text-white/45">
              No payments or invoices found.
            </div>
          )}
        </div>
      </div>

      <div className="glass border border-white/10 rounded-[2rem] p-8 shadow-float">
        <h3 className="text-3xl font-bold text-white mb-8 tracking-tight">Employee Revenue Performance</h3>
        <div className="space-y-5">
          {employeeRevenue.map((employee) => (
            <div
              key={employee.name}
              className="flex items-center gap-8 p-6 glass border border-white/10 rounded-3xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#EF233C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-16 h-16 bg-gradient-to-br from-[#EF233C] via-[#FF2D2D] to-[#990000] rounded-2xl flex items-center justify-center shadow-glow-red relative z-10 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-black text-2xl">#{employee.ranking}</span>
              </div>
              <div className="flex-1 relative z-10">
                <h4 className="text-white font-bold text-xl mb-2">{employee.name}</h4>
                <p className="text-white/50 text-sm font-medium">{employee.contracts} contracts</p>
              </div>
              <div className="text-right relative z-10">
                <p className="text-[#22C55E] font-black text-2xl mb-1">{employee.revenue} VND</p>
                <p className="text-white/50 text-sm font-medium">Contribution: <span className="text-[#EF233C] font-bold">{employee.contribution}</span></p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-[#EF233C] to-[#990000] text-white rounded-2xl hover:scale-105 transition-all duration-300 text-sm font-bold shadow-glow-red relative z-10">
                Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
