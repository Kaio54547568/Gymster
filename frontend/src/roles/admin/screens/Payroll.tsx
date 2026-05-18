import { useMemo, useState } from 'react';
import { DollarSign, Download, Eye, Printer } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';

type PaymentStatus = 'Paid' | 'Pending' | 'Failed';

type PayrollRecord = {
  employeeCode: string;
  employeeName: string;
  role: 'Staff' | 'Trainer' | 'Manager';
  baseSalary: number;
  bonus: number;
  deductions: number;
  status: PaymentStatus;
  month: string;
  quarter: string;
  year: string;
};

const payrollRecords: PayrollRecord[] = [
  { employeeCode: 'EMP001', employeeName: 'Nguyen Minh PT', role: 'Trainer', baseSalary: 15000000, bonus: 3500000, deductions: 500000, status: 'Paid', month: 'May', quarter: 'Q2', year: '2026' },
  { employeeCode: 'EMP002', employeeName: 'Tran Hoang', role: 'Manager', baseSalary: 22000000, bonus: 4200000, deductions: 0, status: 'Pending', month: 'May', quarter: 'Q2', year: '2026' },
  { employeeCode: 'EMP003', employeeName: 'Le Thi Hang', role: 'Staff', baseSalary: 14000000, bonus: 1800000, deductions: 300000, status: 'Paid', month: 'May', quarter: 'Q2', year: '2026' },
  { employeeCode: 'EMP004', employeeName: 'Pham Van Dung', role: 'Trainer', baseSalary: 16000000, bonus: 3200000, deductions: 200000, status: 'Failed', month: 'April', quarter: 'Q2', year: '2026' },
  { employeeCode: 'EMP005', employeeName: 'Hoang Van Nam', role: 'Staff', baseSalary: 12000000, bonus: 1500000, deductions: 0, status: 'Paid', month: 'March', quarter: 'Q1', year: '2026' },
  { employeeCode: 'EMP006', employeeName: 'Mai Anh', role: 'Trainer', baseSalary: 17000000, bonus: 2800000, deductions: 400000, status: 'Pending', month: 'February', quarter: 'Q1', year: '2026' },
];

const months = ['All', 'January', 'February', 'March', 'April', 'May'];
const quarters = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const years = ['All', '2026', '2025'];
const roles = ['All', 'Staff', 'Trainer', 'Manager'];
const statuses = ['All', 'Paid', 'Pending', 'Failed'];

const formatCurrency = (value: number) => `${value.toLocaleString('en-US')} VND`;

const statusClass = (status: PaymentStatus) => {
  if (status === 'Paid') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
  if (status === 'Pending') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25';
  return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
};

export default function Payroll() {
  const currentUser = getCurrentUser();
  const allowedRoles = ['admin', 'manager', 'owner'];
  const canViewPayroll = Boolean(currentUser && allowedRoles.includes(currentUser.role));
  const [month, setMonth] = useState('May');
  const [quarter, setQuarter] = useState('All');
  const [year, setYear] = useState('2026');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');

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
        <button className="flex items-center justify-center gap-2 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]">
          <DollarSign className="h-5 w-5" />
          Create Payslip
        </button>
      </div>

      <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-6">
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
                const totalPayout = record.baseSalary + record.bonus - record.deductions;

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
                        <button className="rounded-lg bg-[#EF233C] p-2 text-white transition-colors hover:bg-[#990000]" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg border border-[#EF233C]/30 bg-[#0c1014] p-2 text-white transition-colors hover:bg-[#EF233C]/10" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg border border-[#EF233C]/30 bg-[#0c1014] p-2 text-white transition-colors hover:bg-[#EF233C]/10" title="Print">
                          <Printer className="h-4 w-4" />
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
    </div>
  );
}
