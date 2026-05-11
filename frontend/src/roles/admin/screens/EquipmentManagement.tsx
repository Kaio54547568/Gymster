import { useState } from 'react';
import KPICard from '../components/KPICard';
import { Dumbbell, Plus, Search, CheckCircle, AlertCircle, Wrench, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

const equipmentData = [
  {
    maThietBi: 'TB001',
    tenThietBi: 'Treadmill X12 Pro',
    soLuong: 8,
    ngayNhap: '15/01/2024',
    baoHanh: '36 tháng',
    xuatXu: 'USA',
    trangThai: 'Active',
    maPhong: 'P01',
    tenPhong: 'Cardio Zone',
    image: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=300&fit=crop'
  },
  {
    maThietBi: 'TB002',
    tenThietBi: 'Bench Press Machine',
    soLuong: 5,
    ngayNhap: '20/02/2024',
    baoHanh: '24 tháng',
    xuatXu: 'Germany',
    trangThai: 'Active',
    maPhong: 'P02',
    tenPhong: 'Weight Training',
    image: 'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400&h=300&fit=crop'
  },
  {
    maThietBi: 'TB003',
    tenThietBi: 'Lat Pulldown Machine',
    soLuong: 4,
    ngayNhap: '10/03/2024',
    baoHanh: '24 tháng',
    xuatXu: 'Italy',
    trangThai: 'Broken',
    maPhong: 'P02',
    tenPhong: 'Weight Training',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&h=300&fit=crop'
  },
  {
    maThietBi: 'TB004',
    tenThietBi: 'Rowing Machine Elite',
    soLuong: 6,
    ngayNhap: '05/04/2024',
    baoHanh: '36 tháng',
    xuatXu: 'USA',
    trangThai: 'Under Maintenance',
    maPhong: 'P01',
    tenPhong: 'Cardio Zone',
    image: 'https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=400&h=300&fit=crop'
  },
  {
    maThietBi: 'TB005',
    tenThietBi: 'Leg Press Ultimate',
    soLuong: 3,
    ngayNhap: '12/04/2024',
    baoHanh: '24 tháng',
    xuatXu: 'Germany',
    trangThai: 'Active',
    maPhong: 'P02',
    tenPhong: 'Weight Training',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop'
  },
  {
    maThietBi: 'TB006',
    tenThietBi: 'Spin Bike Pro Series',
    soLuong: 12,
    ngayNhap: '18/04/2024',
    baoHanh: '24 tháng',
    xuatXu: 'Taiwan',
    trangThai: 'Active',
    maPhong: 'P03',
    tenPhong: 'Cycling Studio',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop'
  }
];

export default function EquipmentManagement() {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const totalEquipment = equipmentData.reduce((sum, eq) => sum + eq.soLuong, 0);
  const functioning = equipmentData.filter(eq => eq.trangThai === 'Active').reduce((sum, eq) => sum + eq.soLuong, 0);
  const broken = equipmentData.filter(eq => eq.trangThai === 'Broken').reduce((sum, eq) => sum + eq.soLuong, 0);
  const underMaintenance = equipmentData.filter(eq => eq.trangThai === 'Under Maintenance').reduce((sum, eq) => sum + eq.soLuong, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30', text: 'text-[#22C55E]' };
      case 'Broken':
        return { bg: 'bg-[#EF233C]/10', border: 'border-[#EF233C]/30', text: 'text-[#EF233C]' };
      case 'Under Maintenance':
        return { bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/30', text: 'text-[#F97316]' };
      default:
        return { bg: 'bg-[#A1A1AA]/10', border: 'border-[#A1A1AA]/30', text: 'text-[#A1A1AA]' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-5 h-5 text-[#22C55E]" />;
      case 'Broken':
        return <AlertCircle className="w-5 h-5 text-[#EF233C]" />;
      case 'Under Maintenance':
        return <Wrench className="w-5 h-5 text-[#F97316]" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Active':
        return 'Hoạt động';
      case 'Broken':
        return 'Hỏng';
      case 'Under Maintenance':
        return 'Đang bảo trì';
      default:
        return status;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">EQUIPMENT MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Quản lý thiết bị tập luyện</p>
        </div>
        <button className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Tổng Thiết Bị"
          value={totalEquipment}
          icon={Dumbbell}
          iconColor="#EF233C"
        />
        <KPICard
          title="Đang Hoạt Động"
          value={functioning}
          change={`${((functioning / totalEquipment) * 100).toFixed(0)}%`}
          changeType="positive"
          icon={CheckCircle}
          iconColor="#22C55E"
        />
        <KPICard
          title="Thiết Bị Hỏng"
          value={broken}
          change="Cần sửa chữa"
          changeType="negative"
          icon={AlertCircle}
          iconColor="#EF233C"
        />
        <KPICard
          title="Đang Bảo Trì"
          value={underMaintenance}
          icon={Wrench}
          iconColor="#F97316"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search equipment..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
        </div>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
        >
          <option value="all">Tất cả phòng</option>
          <option value="P01">Cardio Zone</option>
          <option value="P02">Weight Training</option>
          <option value="P03">Cycling Studio</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Active">Hoạt động</option>
          <option value="Broken">Hỏng</option>
          <option value="Under Maintenance">Đang bảo trì</option>
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipmentData.map((equipment) => {
          const statusColors = getStatusColor(equipment.trangThai);

          return (
            <motion.div
              key={equipment.maThietBi}
              whileHover={{ scale: 1.02, y: -4 }}
              className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl overflow-hidden hover:border-[#EF233C]/50 transition-all cursor-pointer"
            >
              {/* Equipment Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={equipment.image}
                  alt={equipment.tenThietBi}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">{equipment.tenThietBi}</h3>
                  <p className="text-[#A1A1AA] text-sm">Mã: {equipment.maThietBi}</p>
                </div>
                <div className={`absolute top-4 right-4 px-3 py-1 ${statusColors.bg} border ${statusColors.border} rounded-lg backdrop-blur-sm`}>
                  <span className={`${statusColors.text} text-xs font-semibold`}>
                    {getStatusText(equipment.trangThai)}
                  </span>
                </div>
              </div>

              {/* Equipment Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(equipment.trangThai)}
                    <span className="text-[#A1A1AA] text-sm">Số lượng:</span>
                  </div>
                  <span className="text-white font-bold text-lg">{equipment.soLuong} chiếc</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[#EF233C]" />
                  <span className="text-[#A1A1AA]">Phòng:</span>
                  <span className="text-white font-semibold">{equipment.tenPhong}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EF233C]/10">
                  <div>
                    <p className="text-[#A1A1AA] text-xs mb-1">Ngày nhập</p>
                    <p className="text-white text-sm font-semibold">{equipment.ngayNhap}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] text-xs mb-1">Bảo hành</p>
                    <p className="text-white text-sm font-semibold">{equipment.baoHanh}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] text-xs mb-1">Xuất xứ</p>
                    <p className="text-white text-sm font-semibold">{equipment.xuatXu}</p>
                  </div>
                  <div>
                    <p className="text-[#A1A1AA] text-xs mb-1">Mã phòng</p>
                    <p className="text-white text-sm font-semibold">{equipment.maPhong}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button className="flex-1 px-4 py-2 bg-[#EF233C] text-white rounded-lg hover:bg-[#990000] transition-colors text-sm font-semibold">
                    Update
                  </button>
                  <button className="px-4 py-2 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-lg hover:bg-[#EF233C]/10 transition-colors text-sm font-semibold">
                    Chi tiết
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
