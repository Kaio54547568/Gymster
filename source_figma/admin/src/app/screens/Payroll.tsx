import { DollarSign, Download, Printer, Eye } from 'lucide-react';

const salaryData = [
  { maNV: 'NV001', hoTen: 'Nguyễn Minh PT', baseSalary: '15,000,000', bonus: '3,500,000', totalNet: '18,500,000', month: 'T5/2026' },
  { maNV: 'NV002', hoTen: 'Trần Hoàng', baseSalary: '18,000,000', bonus: '4,200,000', totalNet: '22,200,000', month: 'T5/2026' },
  { maNV: 'NV003', hoTen: 'Lê Thị Hằng', baseSalary: '14,000,000', bonus: '2,800,000', totalNet: '16,800,000', month: 'T5/2026' },
  { maNV: 'NV004', hoTen: 'Phạm Văn Dũng', baseSalary: '16,000,000', bonus: '3,200,000', totalNet: '19,200,000', month: 'T5/2026' },
  { maNV: 'NV005', hoTen: 'Hoàng Văn Nam', baseSalary: '10,000,000', bonus: '1,500,000', totalNet: '11,500,000', month: 'T5/2026' }
];

export default function Payroll() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">PAYROLL MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Quản lý lương và phiếu lương</p>
        </div>
        <button className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Tạo Phiếu Lương
        </button>
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Bảng Lương Tháng 5/2026</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Mã NV</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Họ tên</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Lương cơ bản</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Thưởng</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Tổng lương</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {salaryData.map((salary) => (
                <tr key={salary.maNV} className="border-b border-[#EF233C]/10 hover:bg-[#EF233C]/5 transition-colors">
                  <td className="py-4 px-4 text-white font-semibold">{salary.maNV}</td>
                  <td className="py-4 px-4 text-white">{salary.hoTen}</td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{salary.baseSalary} VNĐ</td>
                  <td className="py-4 px-4 text-[#22C55E]">+{salary.bonus} VNĐ</td>
                  <td className="py-4 px-4 text-[#EF233C] font-bold text-lg">{salary.totalNet} VNĐ</td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button className="p-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
