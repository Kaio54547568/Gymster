import { useEffect, useMemo, useState } from 'react';
import { DollarSign, Download, Eye, X, CheckCircle } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import { fetchPayrollData } from '../../../services/adminDataApi';

type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

type PayrollRecord = {
  payslipId?: string;
  employeeCode: string;
  employeeName: string;
  role: 'Staff' | 'Trainer' | 'Manager';
  baseSalary: number;
  bonus: number;
  deductions: number;
  allowance?: number;
  status: PaymentStatus;
  month: string;
  quarter: string;
  year: string;
  createdDate?: string;
  note?: string;
};

type PayrollForm = {
  employeeName: string;
  role: 'Staff' | 'Trainer' | 'Manager';
  month: string;
  year: string;
  baseSalary: string;
  bonus: string;
  deductions: string;
  allowance: string;
  note: string;
};

const months = ['All', 'January', 'February', 'March', 'April', 'May'];
const quarters = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const years = ['All', '2026', '2025'];
const roles = ['All', 'Staff', 'Trainer', 'Manager'];
const statuses = ['All', 'Paid', 'Pending', 'Failed'];
const createMonths = months.filter((item) => item !== 'All');

const initialPayrollForm: PayrollForm = {
  employeeName: '',
  role: 'Staff',
  month: 'May',
  year: '2026',
  baseSalary: '',
  bonus: '0',
  deductions: '0',
  allowance: '0',
  note: '',
};

const formatCurrency = (value: number) => `${value.toLocaleString('en-US')} VND`;

const statusClass = (status: PaymentStatus) => {
  if (status === 'Paid') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
  if (status === 'Pending') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
  return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
};

const getQuarterFromMonth = (monthName: string) => {
  const monthIndex = createMonths.indexOf(monthName);
  if (monthIndex < 0) return 'Q1';
  return `Q${Math.floor(monthIndex / 3) + 1}`;
};

const getTotalPayout = (record: PayrollRecord) => record.baseSalary + record.bonus + Number(record.allowance || 0) - record.deductions;

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
    ['Ma phieu luong', record.payslipId || `${record.employeeCode}-${record.month}-${record.year}`],
    ['Ten nhan vien', record.employeeName],
    ['Vai tro', record.role],
    ['Thang luong', `${record.month} ${record.year}`],
    ['Luong co ban', formatCurrency(record.baseSalary)],
    ['Thuong', formatCurrency(record.bonus)],
    ['Khau tru', formatCurrency(record.deductions)],
    ['Phu cap', formatCurrency(Number(record.allowance || 0))],
    ['Tong luong', formatCurrency(total)],
    ['Trang thai thanh toan', record.status],
    ['Ngay tao', record.createdDate || '-'],
    ['Ghi chu', record.note || '-'],
  ];
  const commands = [
    '0.98 0.98 0.98 rg 0 0 595 842 re f',
    '0.07 0.07 0.07 rg',
    'BT /F1 28 Tf 48 780 Td (Phieu luong) Tj ET',
    '0.90 0.08 0.16 rg 48 758 500 2 re f',
    '0.12 0.12 0.12 rg',
    `BT /F1 11 Tf 48 735 Td (Ngay xuat: ${escapePdfText(new Date().toLocaleString('en-GB'))}) Tj ET`,
  ];

  lines.forEach(([label, value], index) => {
    const y = 695 - index * 42;
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
  const allowedRoles = ['admin', 'manager', 'owner'];
  const canViewPayroll = Boolean(currentUser && allowedRoles.includes(currentUser.role));
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState('May');
  const [quarter, setQuarter] = useState('All');
  const [year, setYear] = useState('2026');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [payrollForm, setPayrollForm] = useState<PayrollForm>(initialPayrollForm);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchPayrollData().then(({ data, error }) => {
      if (!isMounted) return;
      setPayrollRecords(data);
      setLoadMessage(error ? 'Payroll data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return payrollRecords.filter((record) => {
      return (
        (month === 'All' || record.month === month) &&
        (quarter === 'All' || record.quarter === quarter) &&
        (year === 'All' || record.year === year) &&
        (role === 'All' || record.role === role) &&
        (status === 'All' || record.status === status)
      );
    });
  }, [month, quarter, year, role, status]);

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

  const handleCreatePayslip = () => {
    const employeeName = payrollForm.employeeName.trim();
    const baseSalary = parseMoney(payrollForm.baseSalary);
    const bonus = parseMoney(payrollForm.bonus);
    const deductions = parseMoney(payrollForm.deductions);
    const allowance = parseMoney(payrollForm.allowance);

    if (!employeeName || !payrollForm.role || !payrollForm.month || !payrollForm.year || !payrollForm.baseSalary.trim()) {
      setFormError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    if (baseSalary <= 0 || bonus < 0 || deductions < 0 || allowance < 0) {
      setFormError('Các giá trị lương phải hợp lệ và không được âm.');
      return;
    }

    const timestamp = Date.now();
    const newRecord: PayrollRecord = {
      payslipId: `PS-${timestamp}`,
      employeeCode: `EMP-${String(payrollRecords.length + 1).padStart(3, '0')}`,
      employeeName,
      role: payrollForm.role,
      baseSalary,
      bonus,
      deductions,
      allowance,
      status: 'Pending',
      month: payrollForm.month,
      quarter: getQuarterFromMonth(payrollForm.month),
      year: payrollForm.year,
      createdDate: new Date().toLocaleDateString('en-GB'),
      note: payrollForm.note.trim(),
    };

    setPayrollRecords((current) => [newRecord, ...current]);
    setShowCreateModal(false);
    setPayrollForm(initialPayrollForm);
    showToast('Tạo phiếu lương thành công');
  };

  const handleDownloadPayslip = (record: PayrollRecord) => {
    setDownloadError('');
    try {
      const pdf = buildPayslipPdf(record);
      const filename = `payslip_${getFileSafeName(record.employeeName)}_${getFileSafeName(`${record.month}_${record.year}`)}.pdf`;
      downloadBlob(new Blob([pdf], { type: 'application/pdf' }), filename);
      showToast('Tải phiếu lương thành công');
    } catch (error) {
      console.error('[Gymster hệ thống] Payslip PDF download failed:', error);
      setDownloadError('Không thể tải phiếu lương. Vui lòng thử lại.');
    }
  };

  if (!canViewPayroll) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8">
          <h1 className="bebas mb-3 text-5xl tracking-wider text-white">ACCESS DENIED</h1>
          <p className="text-[#A1A1AA]">Payroll data is available only to Admin, Manager, and Owner roles.</p>
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
          Tạo phiếu lương
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
                  <tr key={`${record.employeeCode}-${record.month}-${record.year}`} className="border-b border-[#EF233C]/10 transition-colors hover:bg-[#EF233C]/5">
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
                        <button onClick={() => setSelectedRecord(record)} className="rounded-lg bg-[#EF233C] p-2 text-white transition-colors hover:bg-[#990000]" title="View">
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
                <h2 className="text-3xl font-bold text-white">Tạo phiếu lương</h2>
                <p className="mt-1 text-[#A1A1AA]">Nhập thông tin bảng lương cho nhân viên.</p>
              </div>
              <button onClick={closeCreateModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && <div className="mb-5 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 px-4 py-3 text-sm font-semibold text-white">{formError}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Nhân viên</span>
                <input value={payrollForm.employeeName} onChange={(event) => updatePayrollForm('employeeName', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Vai trò</span>
                <select value={payrollForm.role} onChange={(event) => updatePayrollForm('role', event.target.value as PayrollForm['role'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Staff">Staff</option>
                  <option value="Trainer">Trainer</option>
                  <option value="Manager">Manager</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Tháng lương</span>
                <select value={payrollForm.month} onChange={(event) => updatePayrollForm('month', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  {createMonths.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Năm</span>
                <select value={payrollForm.year} onChange={(event) => updatePayrollForm('year', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  {years.filter((item) => item !== 'All').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              {[
                ['Lương cơ bản', 'baseSalary'],
                ['Thưởng', 'bonus'],
                ['Khấu trừ', 'deductions'],
                ['Phụ cấp', 'allowance'],
              ].map(([label, field]) => (
                <label key={field} className="space-y-2">
                  <span className="text-sm font-semibold text-[#A1A1AA]">{label}</span>
                  <input value={payrollForm[field as keyof PayrollForm]} onChange={(event) => updatePayrollForm(field as keyof PayrollForm, event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
                </label>
              ))}
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Ghi chú</span>
                <textarea value={payrollForm.note} onChange={(event) => updatePayrollForm('note', event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-[#EF233C]/20 bg-black/30 p-4 text-right">
              <p className="text-sm text-[#A1A1AA]">Tổng lương</p>
              <p className="text-2xl font-bold text-[#EF233C]">{formatCurrency(formTotal)}</p>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeCreateModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">Hủy</button>
              <button onClick={handleCreatePayslip} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000]">Tạo phiếu lương</button>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Chi tiết phiếu lương</h2>
                <p className="mt-1 text-[#A1A1AA]">{selectedRecord.employeeName} - {selectedRecord.month} {selectedRecord.year}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ['Mã phiếu lương', selectedRecord.payslipId || `${selectedRecord.employeeCode}-${selectedRecord.month}-${selectedRecord.year}`],
                ['Tên nhân viên', selectedRecord.employeeName],
                ['Vai trò', selectedRecord.role],
                ['Tháng lương', `${selectedRecord.month} ${selectedRecord.year}`],
                ['Lương cơ bản', formatCurrency(selectedRecord.baseSalary)],
                ['Thưởng', formatCurrency(selectedRecord.bonus)],
                ['Khấu trừ', formatCurrency(selectedRecord.deductions)],
                ['Phụ cấp', formatCurrency(Number(selectedRecord.allowance || 0))],
                ['Tổng lương', formatCurrency(getTotalPayout(selectedRecord))],
                ['Trạng thái thanh toán', selectedRecord.status],
                ['Ngày tạo', selectedRecord.createdDate || '-'],
                ['Ghi chú', selectedRecord.note || '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-black/30 p-4">
                  <p className="text-sm text-[#A1A1AA]">{label}</p>
                  <p className="mt-1 font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedRecord(null)} className="mt-8 w-full rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000]">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
