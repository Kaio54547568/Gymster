import { useState } from 'react';
import { UserCheck, Plus, Search, Edit, Eye, Award, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

const staffData = [
  {
    maNV: 'NV001',
    hoTen: 'Nguyễn Minh PT',
    chucVu: 'Personal Trainer',
    luongCoBan: '15,000,000',
    sdt: '0901234567',
    chuyenMon: 'Bodybuilding, Fitness',
    chungChi: 'ACE-CPT, NASM-CPT',
    performance: 95,
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  {
    maNV: 'NV002',
    hoTen: 'Trần Hoàng',
    chucVu: 'Sales Manager',
    luongCoBan: '18,000,000',
    sdt: '0907654321',
    chuyenMon: 'Sales, Marketing',
    chungChi: 'MBA',
    performance: 92,
    avatar: 'https://i.pravatar.cc/150?img=33'
  },
  {
    maNV: 'NV003',
    hoTen: 'Lê Thị Hằng',
    chucVu: 'Personal Trainer',
    luongCoBan: '14,000,000',
    sdt: '0912345678',
    chuyenMon: 'Yoga, Pilates',
    chungChi: 'RYT-200, STOTT Pilates',
    performance: 89,
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    maNV: 'NV004',
    hoTen: 'Phạm Văn Dũng',
    chucVu: 'Personal Trainer',
    luongCoBan: '16,000,000',
    sdt: '0923456789',
    chuyenMon: 'CrossFit, HIIT',
    chungChi: 'CF-L2, NASM-CPT',
    performance: 94,
    avatar: 'https://i.pravatar.cc/150?img=51'
  },
  {
    maNV: 'NV005',
    hoTen: 'Hoàng Văn Nam',
    chucVu: 'Receptionist',
    luongCoBan: '10,000,000',
    sdt: '0934567890',
    chuyenMon: 'Customer Service',
    chungChi: 'CS Cert',
    performance: 87,
    avatar: 'https://i.pravatar.cc/150?img=15'
  }
];

export default function StaffManagement() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleViewDetail = (employee: any) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">STAFF & TRAINER MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Manage staff and trainers</p>
        </div>
        <button className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
        </div>
        <select className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer">
          <option>Tất cả chức vụ</option>
          <option>Personal Trainer</option>
          <option>Sales Manager</option>
          <option>Receptionist</option>
        </select>
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {staffData.map((employee) => (
          <motion.div
            key={employee.maNV}
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 hover:border-[#EF233C]/50 transition-all cursor-pointer"
            onClick={() => handleViewDetail(employee)}
          >
            {/* Avatar & Basic Info */}
            <div className="flex items-start gap-4 mb-4">
              <img
                src={employee.avatar}
                alt={employee.hoTen}
                className="w-20 h-20 rounded-xl object-cover border-2 border-[#EF233C]"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{employee.hoTen}</h3>
                <p className="text-[#EF233C] text-sm font-semibold mb-1">{employee.chucVu}</p>
                <p className="text-[#A1A1AA] text-sm">Mã NV: {employee.maNV}</p>
              </div>
            </div>

            {/* Performance Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#A1A1AA]">Hiệu suất</span>
                <span className="text-sm font-bold text-[#22C55E]">{employee.performance}%</span>
              </div>
              <div className="h-2 bg-[#050607] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#EF233C] to-[#22C55E] rounded-full"
                  style={{ width: `${employee.performance}%` }}
                />
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[#22C55E]" />
                <span className="text-[#A1A1AA]">Lương:</span>
                <span className="text-white font-semibold">{employee.luongCoBan} VNĐ</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-[#F97316]" />
                <span className="text-[#A1A1AA]">Chuyên môn:</span>
                <span className="text-white">{employee.chuyenMon}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Chi tiết
              </button>
              <button className="px-4 py-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors">
                <Edit className="w-4 h-4" />
              </button>
              <button className="px-4 py-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors">
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Employee Detail Modal */}
      {showModal && selectedEmployee && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0c1014] border border-[#EF233C]/30 rounded-3xl p-8 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-6 mb-6">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.hoTen}
                className="w-32 h-32 rounded-2xl object-cover border-2 border-[#EF233C]"
              />
              <div className="flex-1">
                <h2 className="bebas text-4xl text-white tracking-wider mb-2">
                  {selectedEmployee.hoTen}
                </h2>
                <p className="text-[#EF233C] text-lg font-semibold mb-2">{selectedEmployee.chucVu}</p>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg text-[#22C55E] text-sm font-semibold">
                    Performance: {selectedEmployee.performance}%
                  </span>
                  <span className="text-[#A1A1AA] text-sm">{selectedEmployee.sdt}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[#A1A1AA] text-sm mb-1">Mã nhân viên</p>
                <p className="text-white font-semibold">{selectedEmployee.maNV}</p>
              </div>
              <div>
                <p className="text-[#A1A1AA] text-sm mb-1">Lương cơ bản</p>
                <p className="text-[#22C55E] font-bold">{selectedEmployee.luongCoBan} VNĐ</p>
              </div>
              <div>
                <p className="text-[#A1A1AA] text-sm mb-1">Chuyên môn</p>
                <p className="text-white font-semibold">{selectedEmployee.chuyenMon}</p>
              </div>
              <div>
                <p className="text-[#A1A1AA] text-sm mb-1">Chứng chỉ</p>
                <p className="text-white font-semibold">{selectedEmployee.chungChi}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
                Xem lịch làm việc
              </button>
              <button className="flex-1 px-6 py-3 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-xl hover:bg-[#EF233C]/10 transition-colors font-semibold">
                Xem đánh giá
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-[#050607] text-white rounded-xl hover:bg-[#0c1014] transition-colors font-semibold"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
