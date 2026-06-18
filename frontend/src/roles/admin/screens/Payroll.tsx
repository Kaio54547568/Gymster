import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, DollarSign, Download, Eye, X } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { createPayrollRecord, fetchPayrollData, fetchPayrollRecordDetail } from '../../../services/adminDataApi';

type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

type PayrollRecord = {
  payslipId?: string;
  employeeId?: string;
  employeeCode: string;
  employeeName: string;
  role: 'Staff' | 'Trainer' | 'Manager';
  baseSalary: number;
  bonus: number;
  deductions: number;
  allowance?: number;
  totalPayout?: number;
  status: PaymentStatus;
  month: string;
  quarter: string;
  year: string;
  createdDate?: string;
  note?: string;
};

type PayrollEmployee = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  role: 'Staff' | 'Trainer' | 'Manager';
  baseSalary: number;
};

type PayrollForm = {
  employeeId: string;
  month: string;
  year: string;
  baseSalary: string;
  bonus: string;
  deductions: string;
  allowance: string;
  note: string;
};

const monthOptions = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const months = ['All', ...monthOptions];
const quarters = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const roles = ['All', 'Staff', 'Trainer', 'Manager'];
const statuses = ['All', 'Paid', 'Pending', 'Failed'];
const currentYear = new Date().getFullYear();
const baseYears = ['All', String(currentYear), String(currentYear - 1), String(currentYear + 1)];

const initialPayrollForm: PayrollForm = {
  employeeId: '',
  month: monthOptions[new Date().getMonth()],
  year: String(currentYear),
  baseSalary: '',
  bonus: '0',
  deductions: '0',
  allowance: '0',
  note: '',
};

const formatCurrency = (value: number) => `${Number(value || 0).toLocaleString('en-US')} VND`;

const statusClass = (status: PaymentStatus) => {
  if (status === 'Paid') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
  if (status === 'Pending') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
  return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
};

const getQuarterFromMonth = (monthName: string) => {
  const monthIndex = monthOptions.indexOf(monthName);
  if (monthIndex < 0) return 'Q1';
  return `Q${Math.floor(monthIndex / 3) + 1}`;
};

const getTotalPayout = (record: PayrollRecord) => (
  Number(record.totalPayout ?? (record.baseSalary + record.bonus + Number(record.allowance || 0) - record.deductions))
);

const parseMoney = (value: string) => Number(String(value || '0').replace(/[,\s]/g, '')) || 0;

const getFileSafeName = (value: string) => String(value || 'employee').trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');

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

function escapePdfText(value: string | number) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPayslipPdf(record: PayrollRecord) {
  const total = getTotalPayout(record);
  const lines = [
    ['Payslip ID', record.payslipId || `${record.employeeCode}-${record.month}-${record.year}`],
    ['Employee name', record.employeeName],
    ['Employee code', record.employeeCode],
    ['Role', record.role],
    ['Payroll period', `${record.month} ${record.year}`],
    ['Base salary', formatCurrency(record.baseSalary)],
    ['Bonus', formatCurrency(record.bonus)],
    ['Allowance', formatCurrency(Number(record.allowance || 0))],
    ['Deductions', formatCurrency(record.deductions)],
    ['Total payout', formatCurrency(total)],
    ['Payment status', record.status],
    ['Created date', record.createdDate || '-'],
    ['Notes', record.note || '-'],
  ];
  const commands = [
    '0.98 0.98 0.98 rg 0 0 595 842 re f',
    '0.07 0.07 0.07 rg',
    'BT /F1 28 Tf 48 780 Td (Payslip) Tj ET',
    '0.90 0.08 0.16 rg 48 758 500 2 re f',
    '0.12 0.12 0.12 rg',
    `BT /F1 11 Tf 48 735 Td (Generated at: ${escapePdfText(new Date().toLocaleString('en-GB'))}) Tj ET`,
  ];

  lines.forEach(([label, value], index) => {
    const y = 695 - index * 40;
    if (index % 2 === 0) commands.push(`0.94 0.94 0.94 rg 48 ${y - 13} 500 30 re f`);
    commands.push('0.12 0.12 0.12 rg');
    commands.push(`BT /F1 11 Tf 62 ${y} Td (${escapePdfText(label)}) Tj ET`);
    commands.push(`BT /F1 12 Tf 255 ${y} Td (${escapePdfText(value)}) Tj ET`);
  });

  const content = commands.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

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

export default function Payroll() {
  const currentUser = getCurrentUser();
  const normalizedRole = String(currentUser?.role || '').toLowerCase();
  const normalizedSourceRole = String(currentUser?.sourceRole || '').toLowerCase();
  const canViewPayroll = Boolean(currentUser && (normalizedRole === 'owner' || normalizedSourceRole === 'owner'));

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [payrollEmployees, setPayrollEmployees] = useState<PayrollEmployee[]>([]);
  const [month, setMonth] = useState(monthOptions[new Date().getMonth()]);
  const [quarter, setQuarter] = useState('All');
  const [year, setYear] = useState(String(currentYear));
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollForm>(initialPayrollForm);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');

  const loadPayroll = useCallback(async () => {
    if (!canViewPayroll) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, employees, error } = await fetchPayrollData();
    setPayrollRecords(data);
    setPayrollEmployees(employees || []);
    setLoadMessage(error ? 'Payroll data could not be loaded.' : '');
    setLoading(false);
  }, [canViewPayroll]);

  useEffect(() => {
    void loadPayroll();
  }, [loadPayroll]);

  const years = useMemo(() => {
    const recordYears = payrollRecords.map((record) => record.year).filter(Boolean);
    return Array.from(new Set([...baseYears, ...recordYears]));
  }, [payrollRecords]);

  const selectedEmployee = useMemo(() => (
    payrollEmployees.find((employee) => employee.employeeId === payrollForm.employeeId) || null
  ), [payrollEmployees, payrollForm.employeeId]);

  useEffect(() => {
    if (!selectedEmployee) return;
    setPayrollForm((current) => ({
      ...current,
      baseSalary: String(selectedEmployee.baseSalary || ''),
    }));
  }, [selectedEmployee]);

  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((record) => (
      (month === 'All' || record.month === month)
      && (quarter === 'All' || record.quarter === quarter)
      && (year === 'All' || record.year === year)
      && (role === 'All' || record.role === role)
      && (status === 'All' || record.status === status)
    ));
  }, [month, quarter, year, role, status, payrollRecords]);

  const formTotal = parseMoney(payrollForm.baseSalary) + parseMoney(payrollForm.bonus) + parseMoney(payrollForm.allowance) - parseMoney(payrollForm.deductions);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3500);
  };

  const updatePayrollForm = (field: keyof PayrollForm, value: string) => {
    setPayrollForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const openCreateModal = () => {
    setPayrollForm(initialPayrollForm);
    setFormError('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setFormError('');
  };

  const handleCreatePayslip = async () => {
    const baseSalary = parseMoney(payrollForm.baseSalary);
    const bonus = parseMoney(payrollForm.bonus);
    const deductions = parseMoney(payrollForm.deductions);
    const allowance = parseMoney(payrollForm.allowance);

    if (!payrollForm.employeeId || !payrollForm.month || !payrollForm.year || !payrollForm.baseSalary.trim()) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (baseSalary <= 0 || bonus < 0 || deductions < 0 || allowance < 0) {
      setFormError('Salary values must be valid and non-negative.');
      return;
    }

    setSaving(true);
    const { error } = await createPayrollRecord({
      employeeId: payrollForm.employeeId,
      month: payrollForm.month,
      year: payrollForm.year,
      baseSalary,
      bonus,
      deductions,
      allowance,
      note: payrollForm.note.trim(),
      status: 'draft',
    });
    setSaving(false);

    if (error) {
      setFormError(error.message || 'Could not create payslip.');
      return;
    }

    setShowCreateModal(false);
    setPayrollForm(initialPayrollForm);
    showToast('Payslip created successfully.');
    await loadPayroll();
  };

  const handleViewPayslip = async (record: PayrollRecord) => {
    if (!record.payslipId) return;
    setDownloadError('');
    const { data, error } = await fetchPayrollRecordDetail(record.payslipId);
    if (error || !data) {
      setDownloadError(error?.message || 'Could not load payslip detail.');
      return;
    }
    setSelectedRecord(data);
  };

  const handleDownloadPayslip = async (record: PayrollRecord) => {
    setDownloadError('');
    try {
      const result = record.payslipId ? await fetchPayrollRecordDetail(record.payslipId) : { data: record, error: null };
      if (result.error || !result.data) throw new Error(result.error?.message || 'Could not load payslip detail.');
      const pdf = buildPayslipPdf(result.data);
      const filename = `payslip_${getFileSafeName(result.data.employeeName)}_${getFileSafeName(`${result.data.month}_${result.data.year}`)}.pdf`;
      downloadBlob(new Blob([pdf], { type: 'application/pdf' }), filename);
      showToast('Payslip downloaded successfully.');
    } catch (error) {
      console.error('[Gymster system] Payslip PDF download failed:', error);
      setDownloadError(error instanceof Error ? error.message : 'Could not download payslip. Please try again.');
    }
  };

  if (!canViewPayroll) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8">
          <h1 className="bebas mb-3 text-5xl tracking-wider text-white">ACCESS DENIED</h1>
          <p className="text-[#A1A1AA]">Payroll management is available only to Owner accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="bebas mb-2 text-5xl tracking-wider text-white">PAYROLL MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Review salary slips, payouts, bonuses, and payment status by period.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center justify-center gap-2 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]">
          <DollarSign className="h-5 w-5" />
          Create Payslip
        </button>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm font-bold text-[#D1FAE5]">
          <CheckCircle className="h-5 w-5 text-[#22C55E]" />
          {toastMessage}
        </div>
      )}

      {downloadError && (
        <div className="rounded-2xl border border-[#EF233C]/30 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">
          {downloadError}
        </div>
      )}

      <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-6">
        {loading && <div className="mb-4 rounded-xl border border-[#EF233C]/20 bg-black/30 p-4 text-sm font-bold text-[#A1A1AA]">Loading payroll records...</div>}
        {loadMessage && !loading && <div className="mb-4 rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{loadMessage}</div>}
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ['Month', month, setMonth, months],
            ['Quarter', quarter, setQuarter, quarters],
            ['Year', year, setYear, years],
            ['Staff / Trainer', role, setRole, roles],
            ['Payment status', status, setStatus, statuses],
          ].map(([label, value, setter, options]) => (
            <label key={label as string} className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">{label as string}</span>
              <select
                value={value as string}
                onChange={(event) => (setter as (next: string) => void)(event.target.value)}
                className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-sm font-semibold text-white outline-none focus:border-[#EF233C]"
              >
                {(options as string[]).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold text-white">Payroll Records</h3>
          <span className="rounded-full border border-[#EF233C]/25 bg-[#EF233C]/10 px-3 py-1 text-xs font-bold text-[#EF233C]">
            {filteredRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                {['Employee code', 'Employee name', 'Role', 'Base salary', 'Bonus', 'Deductions', 'Total payout', 'Payment status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-4 text-left font-semibold text-[#A1A1AA]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const totalPayout = getTotalPayout(record);

                return (
                  <tr key={record.payslipId || `${record.employeeCode}-${record.month}-${record.year}`} className="border-b border-[#EF233C]/10 transition-colors hover:bg-[#EF233C]/5">
                    <td className="px-4 py-4 font-semibold text-white">{record.employeeCode}</td>
                    <td className="px-4 py-4 text-white">{record.employeeName}</td>
                    <td className="px-4 py-4 text-[#A1A1AA]">{record.role}</td>
                    <td className="px-4 py-4 text-[#A1A1AA]">{formatCurrency(record.baseSalary)}</td>
                    <td className="px-4 py-4 text-[#22C55E]">+{formatCurrency(record.bonus)}</td>
                    <td className="px-4 py-4 text-red-300">-{formatCurrency(record.deductions)}</td>
                    <td className="px-4 py-4 text-lg font-bold text-[#EF233C]">{formatCurrency(totalPayout)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(record.status)}`}>{record.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewPayslip(record)} className="rounded-lg bg-[#EF233C] p-2 text-white transition-colors hover:bg-[#990000]" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDownloadPayslip(record)} className="rounded-lg border border-[#EF233C]/30 bg-[#0c1014] p-2 text-white transition-colors hover:bg-[#EF233C]/10" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeCreateModal}>
          <div className="w-full max-w-3xl rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Create Payslip</h2>
                <p className="mt-1 text-[#A1A1AA]">Select an employee and save the payslip directly to the database.</p>
              </div>
              <button onClick={closeCreateModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && <div className="mb-5 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 px-4 py-3 text-sm font-semibold text-white">{formError}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Employee</span>
                <select value={payrollForm.employeeId} onChange={(event) => updatePayrollForm('employeeId', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="">Select employee...</option>
                  {payrollEmployees.map((employee) => (
                    <option key={employee.employeeId} value={employee.employeeId}>
                      {employee.employeeName} ({employee.employeeCode}) - {employee.role}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Payroll month</span>
                <select value={payrollForm.month} onChange={(event) => updatePayrollForm('month', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  {monthOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Year</span>
                <select value={payrollForm.year} onChange={(event) => updatePayrollForm('year', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  {years.filter((item) => item !== 'All').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              {[
                ['Base salary', 'baseSalary'],
                ['Bonus', 'bonus'],
                ['Deductions', 'deductions'],
                ['Allowance', 'allowance'],
              ].map(([label, field]) => (
                <label key={field} className="space-y-2">
                  <span className="text-sm font-semibold text-[#A1A1AA]">{label}</span>
                  <input value={payrollForm[field as keyof PayrollForm]} onChange={(event) => updatePayrollForm(field as keyof PayrollForm, event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
                </label>
              ))}
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Notes</span>
                <textarea value={payrollForm.note} onChange={(event) => updatePayrollForm('note', event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-[#EF233C]/20 bg-black/30 p-4 text-right">
              <p className="text-sm text-[#A1A1AA]">Total payout</p>
              <p className="text-2xl font-bold text-[#EF233C]">{formatCurrency(formTotal)}</p>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeCreateModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">Cancel</button>
              <button onClick={handleCreatePayslip} disabled={saving} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Payslip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Payslip Detail</h2>
                <p className="mt-1 text-[#A1A1AA]">{selectedRecord.employeeName} - {selectedRecord.month} {selectedRecord.year}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['Payslip ID', selectedRecord.payslipId || `${selectedRecord.employeeCode}-${selectedRecord.month}-${selectedRecord.year}`],
                ['Employee name', selectedRecord.employeeName],
                ['Employee code', selectedRecord.employeeCode],
                ['Role', selectedRecord.role],
                ['Payroll period', `${selectedRecord.month} ${selectedRecord.year}`],
                ['Base salary', formatCurrency(selectedRecord.baseSalary)],
                ['Bonus', formatCurrency(selectedRecord.bonus)],
                ['Allowance', formatCurrency(Number(selectedRecord.allowance || 0))],
                ['Deductions', formatCurrency(selectedRecord.deductions)],
                ['Total payout', formatCurrency(getTotalPayout(selectedRecord))],
                ['Payment status', selectedRecord.status],
                ['Created date', selectedRecord.createdDate || '-'],
                ['Notes', selectedRecord.note || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/30 p-4">
                  <p className="text-sm text-[#A1A1AA]">{label}</p>
                  <p className="mt-1 font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedRecord(null)} className="mt-8 w-full rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
