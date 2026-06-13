import { useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import {
  DollarSign,
  TrendingUp,
  Download,
  FileDown,
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
import { fetchRevenueBreakdowns } from '../../../services/adminDataApi';

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

function getReportFileDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string | number) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function escapePdfText(value: string | number) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function truncatePdfText(value: string | number, maxLength: number) {
  const text = String(value ?? '');
  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
}

function buildRevenuePdf(rows: RevenueRow[], summary: { totalRevenue: number; paidCount: number; pendingCount: number; failedCount: number }) {
  const pageWidth = 842;
  const pageHeight = 595;
  const margin = 36;
  const rowHeight = 18;
  const rowsPerPage = 20;
  const columns = [
    { label: 'Invoice ID', x: 36, width: 90 },
    { label: 'Customer', x: 126, width: 120 },
    { label: 'Plan', x: 246, width: 140 },
    { label: 'Method', x: 386, width: 90 },
    { label: 'Amount', x: 476, width: 110 },
    { label: 'Status', x: 586, width: 90 },
    { label: 'Created Date', x: 676, width: 100 },
  ];
  const pages: string[] = [];
  const exportTime = new Date().toLocaleString('en-GB');
  const chunks = rows.length ? rows : [{
    invoiceId: '-',
    member: 'No invoices found',
    packageType: '-',
    method: '-',
    amount: 0,
    status: '-',
    date: '-',
  }];

  for (let start = 0; start < chunks.length; start += rowsPerPage) {
    const pageRows = chunks.slice(start, start + rowsPerPage);
    const commands: string[] = [
      '0.98 0.98 0.98 rg 0 0 842 595 re f',
      '0.06 0.06 0.06 rg',
      'BT /F1 26 Tf 36 548 Td (Revenue Report) Tj ET',
      '0.25 0.25 0.25 rg',
      `BT /F1 10 Tf 36 528 Td (Exported at: ${escapePdfText(exportTime)}) Tj ET`,
      '0.90 0.08 0.16 rg 36 492 770 1.5 re f',
      '0.10 0.10 0.10 rg',
      `BT /F1 12 Tf 36 508 Td (Total revenue: ${escapePdfText(formatVnd(summary.totalRevenue))}) Tj ET`,
      `BT /F1 12 Tf 270 508 Td (Total transactions: ${rows.length}) Tj ET`,
      `BT /F1 12 Tf 500 508 Td (Failed transactions: ${summary.failedCount}) Tj ET`,
      '0.92 0.92 0.92 rg 36 455 770 24 re f',
      '0.12 0.12 0.12 rg',
    ];

    columns.forEach((column) => {
      commands.push(`BT /F1 9 Tf ${column.x} 463 Td (${escapePdfText(column.label)}) Tj ET`);
    });

    pageRows.forEach((row, index) => {
      const y = 435 - index * rowHeight;
      if (index % 2 === 0) {
        commands.push(`0.96 0.96 0.96 rg 36 ${y - 5} 770 17 re f`);
      }
      commands.push('0.12 0.12 0.12 rg');
      [
        truncatePdfText(row.invoiceId, 16),
        truncatePdfText(row.member, 22),
        truncatePdfText(row.packageType, 24),
        truncatePdfText(row.method, 14),
        truncatePdfText(formatVnd(row.amount), 18),
        truncatePdfText(row.status, 14),
        truncatePdfText(row.date, 16),
      ].forEach((value, columnIndex) => {
        commands.push(`BT /F1 8 Tf ${columns[columnIndex].x} ${y} Td (${escapePdfText(value)}) Tj ET`);
      });
    });

    commands.push(`0.35 0.35 0.35 rg BT /F1 9 Tf ${margin} 28 Td (Page ${pages.length + 1}) Tj ET`);
    pages.push(commands.join('\n'));
  }

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ];

  pages.forEach((content, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export default function RevenueAnalytics() {
  const [timeRange, setTimeRange] = useState('month');
  const [payments, setPayments] = useState<any[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<RevenueRow[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<Array<{ month: string; revenue: number }>>([]);
  const [revenueByPackage, setRevenueByPackage] = useState<Array<{ package: string; revenue: number }>>([]);
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRevenueData() {
      setIsLoading(true);
      const [paymentsResult, invoicesResult] = await Promise.all([
        getAllPayments(),
        getInvoicesForAdmin(),
      ]);
      const breakdownResult = await fetchRevenueBreakdowns();

      if (!isMounted) return;

      if (!paymentsResult.error) {
        setPayments(paymentsResult.data);
      }
      if (!breakdownResult.error && breakdownResult.data) {
        setMonthlyRevenue(breakdownResult.data.monthlyRevenue);
        setRevenueByPackage(breakdownResult.data.revenueByPackage);
        setRevenueByPaymentMethod(breakdownResult.data.revenueByPaymentMethod);
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
      } else {
        setInvoiceRows([]);
      }

      setLoadMessage(
        paymentsResult.error || invoicesResult.error || breakdownResult.error
          ? 'Some payment, invoice, or analytics data could not be loaded.'
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

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => setFeedbackMessage(''), 3500);
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    setExportError('');
    try {
      const headers = ['Invoice ID', 'Customer Name', 'Membership Plan', 'Payment Method', 'Amount', 'Status', 'Created Date'];
      const csvRows = [
        headers.map(escapeCsvField).join(','),
        ...invoiceRows.map((invoice) => [
          invoice.invoiceId,
          invoice.member,
          invoice.packageType,
          invoice.method,
          invoice.amount,
          invoice.status,
          invoice.date,
        ].map(escapeCsvField).join(',')),
      ];
      const blob = new Blob([`\uFEFF${csvRows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `revenue_report_${getReportFileDate()}.csv`);
      showFeedback('Xuất báo cáo thành công');
    } catch (error) {
      console.error('[Gymster hệ thống] CSV export failed:', error);
      setExportError('Không thể xuất báo cáo CSV. Vui lòng thử lại.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setExportError('');
    try {
      const pdf = buildRevenuePdf(invoiceRows, paymentSummary);
      const blob = new Blob([pdf], { type: 'application/pdf' });
      downloadBlob(blob, `revenue_report_${getReportFileDate()}.pdf`);
      showFeedback('Tải PDF thành công');
    } catch (error) {
      console.error('[Gymster hệ thống] PDF export failed:', error);
      setExportError('Không thể tải PDF. Vui lòng thử lại.');
    } finally {
      setPdfLoading(false);
    }
  };

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
          Loading payments and invoices...
        </div>
      )}

      {loadMessage && !isLoading && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">
          {loadMessage}
        </div>
      )}

      {exportError && (
        <div className="rounded-2xl border border-[#EF233C]/30 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">
          {exportError}
        </div>
      )}

      {feedbackMessage && (
        <div className="rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm font-bold text-[#D1FAE5]">
          {feedbackMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatCompactVnd(paymentSummary.totalRevenue)}
          change="Cập nhật"
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
            <button
              onClick={handleExportCsv}
              disabled={exportLoading}
              className="px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="w-4 h-4 inline mr-2" />
              {exportLoading ? 'Exporting...' : 'Export'}
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
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="px-6 py-3 glass border border-white/10 text-white rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 text-sm font-semibold flex items-center gap-2 group disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
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
        <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">Employee Revenue Performance</h3>
        <p className="text-white/50 text-sm font-medium">
          Doanh thu theo nhân viên sẽ hiển thị khi hóa đơn có liên kết nhân viên.
        </p>
      </div>
    </div>
  );
}
