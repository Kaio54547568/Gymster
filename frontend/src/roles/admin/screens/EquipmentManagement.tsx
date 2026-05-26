import { useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import { Dumbbell, Plus, Search, CheckCircle, AlertCircle, Wrench, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchEquipmentManagementData } from '../../../services/adminDataApi';

type EquipmentRow = {
  maThietBi: string;
  tenThietBi: string;
  soLuong: number;
  ngayNhap: string;
  baoHanh: string;
  xuatXu: string;
  trangThai: string;
  maPhong: string;
  tenPhong: string;
  image: string;
};

export default function EquipmentManagement() {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [equipmentData, setEquipmentData] = useState<EquipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchEquipmentManagementData().then(({ data, error }) => {
      if (!isMounted) return;
      setEquipmentData(data);
      setLoadMessage(error ? 'Equipment data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEquipment = useMemo(() => {
    return equipmentData.filter((item) => {
      const matchesRoom = selectedRoom === 'all' || item.tenPhong === selectedRoom;
      const matchesStatus = selectedStatus === 'all' || item.trangThai === selectedStatus;
      return matchesRoom && matchesStatus;
    });
  }, [equipmentData, selectedRoom, selectedStatus]);
  const rooms = Array.from(new Set(equipmentData.map((item) => item.tenPhong).filter(Boolean)));
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">EQUIPMENT MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Danh sách thiết bị</p>
        </div>
        <button className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Equipment
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading equipment list...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Equipment" value={totalEquipment} icon={Dumbbell} iconColor="#EF233C" />
        <KPICard title="Active" value={functioning} icon={CheckCircle} iconColor="#22C55E" />
        <KPICard title="Broken" value={broken} icon={AlertCircle} iconColor="#EF233C" />
        <KPICard title="Maintenance" value={underMaintenance} icon={Wrench} iconColor="#F97316" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input type="text" placeholder="Search equipment..." className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]" />
        </div>
        <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer">
          <option value="all">All rooms</option>
          {rooms.map((room) => <option key={room} value={room}>{room}</option>)}
        </select>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer">
          <option value="all">All status</option>
          <option value="Active">Active</option>
          <option value="Broken">Broken</option>
          <option value="Under Maintenance">Under Maintenance</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipment.map((equipment) => {
          const statusColor = getStatusColor(equipment.trangThai);
          return (
            <motion.div key={equipment.maThietBi} whileHover={{ scale: 1.02, y: -4 }} className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl overflow-hidden hover:border-[#EF233C]/50 transition-all">
              <div className="h-40 bg-black/40 flex items-center justify-center">
                <Dumbbell className="h-16 w-16 text-[#EF233C]" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">{equipment.tenThietBi}</h3>
                    <p className="text-[#A1A1AA]">{equipment.maThietBi}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 border rounded-lg text-xs font-semibold ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}>
                    {getStatusIcon(equipment.trangThai)}
                    {equipment.trangThai}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#A1A1AA]"><MapPin className="w-4 h-4" />{equipment.tenPhong || 'Unassigned'}</div>
                  <p className="text-[#A1A1AA]">Brand/model: <span className="text-white">{equipment.xuatXu || '-'}</span></p>
                  <p className="text-[#A1A1AA]">Purchase date: <span className="text-white">{equipment.ngayNhap || '-'}</span></p>
                  <p className="text-[#A1A1AA]">{equipment.baoHanh || 'No maintenance date configured'}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && !filteredEquipment.length && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">No equipment records found.</div>}
    </div>
  );
}
