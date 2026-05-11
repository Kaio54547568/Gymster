import { CheckCircle, Clock, Wrench } from 'lucide-react';

const maintenanceRecords = [
  { recordId: 'MR-001', maThietBi: 'TB003', moTaLoi: 'Máy kéo xô bị kẹt cáp', ngayBaoLoi: '05/05/2026', ngaySuaXong: '06/05/2026', chiPhi: '850,000', trangThaiXuLy: 'Đã sửa xong' },
  { recordId: 'MR-002', maThietBi: 'TB004', moTaLoi: 'Màn hình rowing machine không hoạt động', ngayBaoLoi: '07/05/2026', ngaySuaXong: '', chiPhi: '', trangThaiXuLy: 'Đang xử lý' },
  { recordId: 'MR-003', maThietBi: 'TB001', moTaLoi: 'Treadmill bị lỗi băng chuyền', ngayBaoLoi: '06/05/2026', ngaySuaXong: '07/05/2026', chiPhi: '1,200,000', trangThaiXuLy: 'Đã sửa xong' },
  { recordId: 'MR-004', maThietBi: 'TB002', moTaLoi: 'Ghế bench press bị lỏng bu lông', ngayBaoLoi: '08/05/2026', ngaySuaXong: '', chiPhi: '', trangThaiXuLy: 'Chờ xử lý' }
];

export default function MaintenanceTracking() {
  const getStatusColor = (status: string) => {
    if (status === 'Đã sửa xong') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
    if (status === 'Đang xử lý') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
    return 'bg-[#EF233C]/10 border-[#EF233C]/30 text-[#EF233C]';
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">MAINTENANCE TRACKING</h1>
        <p className="text-[#A1A1AA]">Theo dõi tiến độ bảo trì</p>
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <h3 className="text-2xl font-bold text-white mb-6">Lịch Sử Bảo Trì</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Mã bảo trì</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Thiết bị</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Mô tả lỗi</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Ngày báo</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Ngày sửa xong</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Chi phí</th>
                <th className="text-left py-4 px-4 text-[#A1A1AA] font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceRecords.map((record) => (
                <tr key={record.recordId} className="border-b border-[#EF233C]/10 hover:bg-[#EF233C]/5 transition-colors">
                  <td className="py-4 px-4 text-white font-semibold">{record.recordId}</td>
                  <td className="py-4 px-4 text-[#EF233C]">{record.maThietBi}</td>
                  <td className="py-4 px-4 text-white">{record.moTaLoi}</td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{record.ngayBaoLoi}</td>
                  <td className="py-4 px-4 text-[#A1A1AA]">{record.ngaySuaXong || '--'}</td>
                  <td className="py-4 px-4 text-[#22C55E] font-bold">{record.chiPhi ? `${record.chiPhi} VNĐ` : '--'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${getStatusColor(record.trangThaiXuLy)}`}>
                      {record.trangThaiXuLy}
                    </span>
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
