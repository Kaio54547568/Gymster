import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  DollarSign,
  Download,
  FileDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { getAllPayments } from '../../../services/paymentApi';
import { getInvoicesForAdmin } from '../../../services/invoiceApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import {
  REVENUE_RANGE_OPTIONS,
  buildPackageRevenue,
  buildPaymentMethodRevenue,
  buildRevenueGrowth,
  filterPaidPaymentsByRange,
  filterRowsByRange,
  resolvePackageLabel,
} from '../domain/revenueAnalytics';

type RangeValue = 'month' | 'sixMonths' | 'year';

type PackageRecord = {
  id: string;
  name: string;
  type?: string;
  duration?: string;
  durationMonths?: number;
  price?: number;
  priceText?: string;
  status?: string;
};

type RevenueRow = {
  invoiceId: string;
  paymentId: string;
  transactionCode: string;
  amount: number;
  date: string;
  rawDate: string;
  packageId: string | null;
  packageType: string;
  member: string;
};

function formatVnd(value: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

function formatCompactVnd(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B VND`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M VND`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K VND`;
  return `${Number(value || 0).toLocaleString('vi-VN')}`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB');
}

function getReportFileDate() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('_');
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
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
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

function buildRevenuePdf(rows: RevenueRow[], totalRevenue: number) {
  const pageWidth = 842;
  const pageHeight = 595;
  const rowsPerPage = 20;
  const columns = [
    { label: 'Invoice ID', x: 36 },
    { label: 'Customer', x: 180 },
    { label: 'Package', x: 330 },
    { label: 'Amount', x: 535 },
    { label: 'Created Date', x: 685 },
  ];
  const sourceRows = rows.length ? rows : [{
    invoiceId: '-',
    member: 'No invoices found',
    packageType: '-',
    amount: 0,
    date: '-',
  }] as RevenueRow[];
  const pages: string[] = [];

  for (let start = 0; start < sourceRows.length; start += rowsPerPage) {
    const pageRows = sourceRows.slice(start, start + rowsPerPage);
    const commands: string[] = [
      '0.98 0.98 0.98 rg 0 0 842 595 re f',
      '0.06 0.06 0.06 rg',
      'BT /F1 26 Tf 36 548 Td (Revenue Report) Tj ET',
      `BT /F1 10 Tf 36 528 Td (Exported at: ${escapePdfText(new Date().toLocaleString('en-GB'))}) Tj ET`,
      '0.90 0.08 0.16 rg 36 492 770 1.5 re f',
      '0.10 0.10 0.10 rg',
      `BT /F1 12 Tf 36 508 Td (Filtered revenue: ${escapePdfText(formatVnd(totalRevenue))}) Tj ET`,
      `BT /F1 12 Tf 400 508 Td (Invoices: ${rows.length}) Tj ET`,
      '0.92 0.92 0.92 rg 36 455 770 24 re f',
      '0.12 0.12 0.12 rg',
    ];
    columns.forEach((column) => {
      commands.push(`BT /F1 9 Tf ${column.x} 463 Td (${column.label}) Tj ET`);
    });
    pageRows.forEach((row, index) => {
      const y = 435 - index * 18;
      if (index % 2 === 0) commands.push(`0.96 0.96 0.96 rg 36 ${y - 5} 770 17 re f`);
      commands.push('0.12 0.12 0.12 rg');
      [
        truncatePdfText(row.invoiceId, 22),
        truncatePdfText(row.member, 24),
        truncatePdfText(row.packageType, 32),
        truncatePdfText(formatVnd(row.amount), 22),
        truncatePdfText(row.date, 16),
      ].forEach((value, columnIndex) => {
        commands.push(`BT /F1 8 Tf ${columns[columnIndex].x} ${y} Td (${escapePdfText(value)}) Tj ET`);
      });
    });
    commands.push(`0.35 0.35 0.35 rg BT /F1 9 Tf 36 28 Td (Page ${pages.length + 1}) Tj ET`);
    pages.push(commands.join('\n'));
  }

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  ];
  pages.forEach((content, index) => {
    const contentId = 4 + index * 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentId} 0 R >>`);
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

function RangeSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  ariaLabel: string;
}) {
  return (
    <label className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-black/20 px-2.5 py-2 text-xs font-semibold text-white/80">
      <CalendarDays className="h-4 w-4 text-[#EF233C]" />
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value as RangeValue)}
        className="cursor-pointer bg-transparent text-white outline-none"
      >
        {REVENUE_RANGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#0c1014]">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function RevenueAnalytics() {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoiceRows, setInvoiceRows] = useState<RevenueRow[]>([]);
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [growthRange, setGrowthRange] = useState<RangeValue>('sixMonths');
  const [methodRange, setMethodRange] = useState<RangeValue>('month');
  const [packageRange, setPackageRange] = useState<RangeValue>('month');
  const [invoiceRange, setInvoiceRange] = useState<RangeValue>('month');
  const [selectedInvoice, setSelectedInvoice] = useState<RevenueRow | null>(null);
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
      const [paymentsResult, invoicesResult, packagesResult] = await Promise.all([
        getAllPayments(),
        getInvoicesForAdmin(),
        fetchPackagesFromSupabase(),
      ]);
      if (!isMounted) return;

      const packageRows = packagesResult.data || [];
      const packageMap = new Map(packageRows.map((pkg: PackageRecord) => [pkg.id, pkg]));
      setPayments(paymentsResult.error ? [] : paymentsResult.data);
      setPackages(packageRows);

      if (!invoicesResult.error) {
        setInvoiceRows(invoicesResult.data.map((invoice: any) => {
          const packageId = invoice.packageId || null;
          return {
            invoiceId: invoice.invoiceNumber || invoice.invoiceId,
            paymentId: invoice.paymentId || '',
            transactionCode: invoice.transactionCode || invoice.paymentId || invoice.invoiceId,
            amount: Number(invoice.amount || 0),
            date: formatDate(invoice.issuedAt),
            rawDate: invoice.issuedAt || invoice.paidAt || '',
            packageId,
            packageType: resolvePackageLabel(packageId, packageMap),
            member: invoice.memberName || 'Member',
          };
        }));
      } else {
        setInvoiceRows([]);
      }

      setLoadMessage(
        paymentsResult.error || invoicesResult.error || packagesResult.error
          ? 'Some payment, invoice, or package data could not be loaded.'
          : '',
      );
      setIsLoading(false);
    }
    loadRevenueData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedInvoice) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedInvoice(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedInvoice]);

  const packagesById = useMemo(
    () => new Map(packages.map((pkg) => [pkg.id, pkg])),
    [packages],
  );

  const paymentSummary = useMemo(() => {
    const paid = payments.filter((payment) => payment.paymentStatus === 'paid');
    return {
      totalRevenue: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      paidCount: paid.length,
      pendingCount: payments.filter((payment) => payment.paymentStatus === 'pending').length,
      failedCount: payments.filter((payment) => ['failed', 'cancelled', 'refunded'].includes(payment.paymentStatus)).length,
    };
  }, [payments]);

  const growthPayments = useMemo(
    () => filterPaidPaymentsByRange(payments, growthRange),
    [payments, growthRange],
  );
  const methodPayments = useMemo(
    () => filterPaidPaymentsByRange(payments, methodRange),
    [payments, methodRange],
  );
  const packagePayments = useMemo(
    () => filterPaidPaymentsByRange(payments, packageRange),
    [payments, packageRange],
  );
  const growthData = useMemo(
    () => buildRevenueGrowth(growthPayments, growthRange),
    [growthPayments, growthRange],
  );
  const paymentMethodData = useMemo(
    () => buildPaymentMethodRevenue(methodPayments),
    [methodPayments],
  );
  const packageRevenueData = useMemo(
    () => buildPackageRevenue(packagePayments, packages),
    [packagePayments, packages],
  );
  const filteredInvoices = useMemo(
    () => filterRowsByRange(invoiceRows, invoiceRange, new Date(), (row: RevenueRow) => row.rawDate)
      .sort((a: RevenueRow, b: RevenueRow) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()),
    [invoiceRows, invoiceRange],
  );
  const filteredInvoiceTotal = useMemo(
    () => filteredInvoices.reduce((sum: number, row: RevenueRow) => sum + row.amount, 0),
    [filteredInvoices],
  );

  const selectedPackage = selectedInvoice?.packageId
    ? packagesById.get(selectedInvoice.packageId) || null
    : null;

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    window.setTimeout(() => setFeedbackMessage(''), 3500);
  };

  const handleExportCsv = async () => {
    setExportLoading(true);
    setExportError('');
    try {
      const csvRows = [
        ['Period', 'Revenue (VND)'].map(escapeCsvField).join(','),
        ...growthData.map((row) => [row.period, row.revenue].map(escapeCsvField).join(',')),
      ];
      downloadBlob(
        new Blob([`\uFEFF${csvRows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' }),
        `revenue_growth_${growthRange}_${getReportFileDate()}.csv`,
      );
      showFeedback('Revenue growth exported successfully.');
    } catch (error) {
      console.error('[Gymster] CSV export failed:', error);
      setExportError('Could not export the revenue growth CSV. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setExportError('');
    try {
      const pdf = buildRevenuePdf(filteredInvoices, filteredInvoiceTotal);
      downloadBlob(
        new Blob([pdf], { type: 'application/pdf' }),
        `revenue_invoices_${invoiceRange}_${getReportFileDate()}.pdf`,
      );
      showFeedback('Filtered invoice PDF downloaded successfully.');
    } catch (error) {
      console.error('[Gymster] PDF export failed:', error);
      setExportError('Could not download the PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-10 p-10">
      <div>
        <h1 className="bebas mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-7xl tracking-wider text-white">
          REVENUE ANALYTICS
        </h1>
        <p className="text-lg font-medium text-white/50">Detailed revenue, payment, and invoice overview</p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-white/50">
          Loading payments, invoices, and packages...
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Total Revenue" value={formatCompactVnd(paymentSummary.totalRevenue)} change="All time" changeType="positive" icon={DollarSign} iconColor="#22C55E" />
        <KPICard title="Paid Payments" value={String(paymentSummary.paidCount)} change="All time" changeType="positive" icon={TrendingUp} iconColor="#EF233C" />
        <KPICard title="Pending Payments" value={String(paymentSummary.pendingCount)} change="All time" changeType="positive" icon={DollarSign} iconColor="#F97316" />
        <KPICard title="Failed Payments" value={String(paymentSummary.failedCount)} change="All time" changeType="positive" icon={TrendingUp} iconColor="#22C55E" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Revenue Growth"
          subtitle={REVENUE_RANGE_OPTIONS.find((option) => option.value === growthRange)?.label}
          action={(
            <div className="flex flex-nowrap items-center justify-end gap-2">
              <RangeSelect value={growthRange} onChange={setGrowthRange} ariaLabel="Filter revenue growth" />
              <button
                onClick={handleExportCsv}
                disabled={exportLoading}
                className="whitespace-nowrap rounded-lg bg-[#EF233C] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="mr-2 inline h-4 w-4" />
                {exportLoading ? 'Exporting...' : 'Export'}
              </button>
            </div>
          )}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="period" stroke="#A1A1AA" minTickGap={18} />
              <YAxis stroke="#A1A1AA" tickFormatter={formatCompactVnd} width={88} />
              <Tooltip
                formatter={(value: number) => [formatVnd(value), 'Revenue']}
                contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#EF233C" strokeWidth={3} dot={{ fill: '#EF233C', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue by Payment Method"
          action={<RangeSelect value={methodRange} onChange={setMethodRange} ariaLabel="Filter payment method revenue" />}
        >
          {paymentMethodData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, item: any) => [
                    `${formatVnd(value)} (${(item.payload.percent * 100).toFixed(1)}%)`,
                    item.payload.name,
                  ]}
                  contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-[300px] place-items-center text-sm font-bold text-white/40">No paid revenue in this period.</div>
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue by Package Type"
            subtitle="All catalog packages are shown, including zero revenue"
            action={<RangeSelect value={packageRange} onChange={setPackageRange} ariaLabel="Filter package revenue" />}
          >
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: Math.max(760, packageRevenueData.length * 135) }}>
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={packageRevenueData} margin={{ bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="package" stroke="#A1A1AA" angle={-25} textAnchor="end" interval={0} height={95} />
                    <YAxis stroke="#A1A1AA" tickFormatter={formatCompactVnd} width={88} />
                    <Tooltip
                      formatter={(value: number) => [formatVnd(value), 'Revenue']}
                      contentStyle={{ background: '#0c1014', border: '1px solid #EF233C', borderRadius: '8px' }}
                    />
                    <Bar dataKey="revenue" fill="#EF233C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>

      <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-float">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-bold tracking-tight text-white">Invoice / Payment List</h3>
            <p className="mt-2 text-sm font-medium text-white/45">{filteredInvoices.length} invoices · {formatVnd(filteredInvoiceTotal)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RangeSelect value={invoiceRange} onChange={setInvoiceRange} ariaLabel="Filter invoice list" />
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="group flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#EF233C]/30 hover:shadow-glow-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileDown className="h-4 w-4 transition-transform group-hover:scale-110" />
              {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[900px] space-y-4">
            <div className="grid grid-cols-6 gap-4 px-6 py-4">
              {['Invoice', 'Amount', 'Date', 'Package', 'Member', 'Action'].map((heading) => (
                <div key={heading} className="text-sm font-bold uppercase tracking-wider text-white/50">{heading}</div>
              ))}
            </div>
            {filteredInvoices.length ? filteredInvoices.map((invoice) => (
              <div key={invoice.invoiceId} className="glass grid grid-cols-6 gap-4 rounded-2xl border border-white/5 px-6 py-5 transition-all duration-300 hover:border-[#EF233C]/30 hover:shadow-glow-red">
                <div className="flex items-center break-all font-bold text-white">{invoice.invoiceId}</div>
                <div className="flex items-center text-lg font-bold text-[#22C55E]">{formatVnd(invoice.amount)}</div>
                <div className="flex items-center text-white/70">{invoice.date}</div>
                <div className="flex items-center font-medium text-white">{invoice.packageType}</div>
                <div className="flex items-center text-white/70">{invoice.member}</div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(invoice)}
                    className="font-bold text-[#EF233C] transition-colors hover:text-white"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-white/5 px-6 py-8 text-center text-sm font-bold text-white/45">
                No invoices found in this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedInvoice(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="revenue-invoice-dialog-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0c1014] p-7 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#EF233C]">Invoice details</p>
                <h3 id="revenue-invoice-dialog-title" className="mt-2 text-3xl font-black text-white">{selectedInvoice.invoiceId}</h3>
              </div>
              <button type="button" aria-label="Close invoice details" onClick={() => setSelectedInvoice(null)} className="rounded-xl border border-white/10 p-2 text-white/60 transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Member', selectedInvoice.member],
                ['Invoice ID', selectedInvoice.invoiceId],
                ['Transaction code', selectedInvoice.transactionCode || '-'],
                ['Payment ID', selectedInvoice.paymentId || '-'],
                ['Package', selectedInvoice.packageType],
                ['Package type', selectedPackage?.type || '-'],
                ['Duration', selectedPackage?.duration || (selectedPackage?.durationMonths ? `${selectedPackage.durationMonths} months` : '-')],
                ['Listed price', selectedPackage ? formatVnd(Number(selectedPackage.price || 0)) : '-'],
                ['Paid amount', formatVnd(selectedInvoice.amount)],
                ['Payment date', selectedInvoice.date],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/40">{label}</p>
                  <p className="mt-2 break-words font-bold text-white">{value || '-'}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
