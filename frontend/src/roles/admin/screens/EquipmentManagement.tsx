import { useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import { Dumbbell, Plus, Search, CheckCircle, AlertCircle, Wrench, MapPin, X } from 'lucide-react';
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

type EquipmentForm = {
  tenThietBi: string;
  maThietBi: string;
  loaiThietBi: string;
  tenPhong: string;
  trangThai: 'Active' | 'Under Maintenance' | 'Broken';
  ngayNhap: string;
  ghiChu: string;
};

const initialEquipmentForm: EquipmentForm = {
  tenThietBi: '',
  maThietBi: '',
  loaiThietBi: '',
  tenPhong: '',
  trangThai: 'Active',
  ngayNhap: '',
  ghiChu: '',
};

export default function EquipmentManagement() {
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [equipmentData, setEquipmentData] = useState<EquipmentRow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentForm>(initialEquipmentForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    const search = query.trim().toLowerCase();
    return equipmentData.filter((item) => {
      const matchesSearch = !search
        || item.tenThietBi.toLowerCase().includes(search)
        || item.maThietBi.toLowerCase().includes(search)
        || item.tenPhong.toLowerCase().includes(search)
        || item.xuatXu.toLowerCase().includes(search);
      const matchesRoom = selectedRoom === 'all' || item.tenPhong === selectedRoom;
      const matchesStatus = selectedStatus === 'all' || item.trangThai === selectedStatus;
      return matchesSearch && matchesRoom && matchesStatus;
    });
  }, [equipmentData, query, selectedRoom, selectedStatus]);
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

  const openAddModal = () => {
    setEquipmentForm(initialEquipmentForm);
    setFormError('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError('');
  };

  const updateEquipmentForm = (field: keyof EquipmentForm, value: string) => {
    setEquipmentForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleAddEquipment = () => {
    const name = equipmentForm.tenThietBi.trim();
    const code = equipmentForm.maThietBi.trim();
    const type = equipmentForm.loaiThietBi.trim();
    const room = equipmentForm.tenPhong.trim();
    const purchaseDate = equipmentForm.ngayNhap.trim();
    const note = equipmentForm.ghiChu.trim();

    if (!name || !code || !type || !room || !equipmentForm.trangThai || !purchaseDate) {
      setFormError('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    const duplicateCode = equipmentData.some((item) => item.maThietBi.trim().toLowerCase() === code.toLowerCase());
    if (duplicateCode) {
      setFormError('Mã thiết bị đã tồn tại.');
      return;
    }

    const newEquipment: EquipmentRow = {
      maThietBi: code,
      tenThietBi: name,
      soLuong: 1,
      ngayNhap: purchaseDate,
      baoHanh: note || 'No notes',
      xuatXu: type,
      trangThai: equipmentForm.trangThai,
      maPhong: room,
      tenPhong: room,
      image: '',
    };

    setEquipmentData((current) => [newEquipment, ...current]);
    setShowAddModal(false);
    setEquipmentForm(initialEquipmentForm);
    setSuccessMessage(`Đã thêm thiết bị ${name} thành công.`);
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">EQUIPMENT MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Danh sách thiết bị</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Thêm thiết bị
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading equipment list...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm font-bold text-[#D1FAE5]">
          <CheckCircle className="h-5 w-5 text-[#22C55E]" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Equipment" value={totalEquipment} icon={Dumbbell} iconColor="#EF233C" />
        <KPICard title="Active" value={functioning} icon={CheckCircle} iconColor="#22C55E" />
        <KPICard title="Broken" value={broken} icon={AlertCircle} iconColor="#EF233C" />
        <KPICard title="Maintenance" value={underMaintenance} icon={Wrench} iconColor="#F97316" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search equipment..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeAddModal}>
          <div className="w-full max-w-3xl rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Thêm thiết bị</h2>
                <p className="mt-1 text-[#A1A1AA]">Tạo thiết bị mới cho danh sách quản lý hiện tại.</p>
              </div>
              <button onClick={closeAddModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-5 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 px-4 py-3 text-sm font-semibold text-white">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Tên thiết bị</span>
                <input value={equipmentForm.tenThietBi} onChange={(event) => updateEquipmentForm('tenThietBi', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Mã thiết bị</span>
                <input value={equipmentForm.maThietBi} onChange={(event) => updateEquipmentForm('maThietBi', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Loại thiết bị</span>
                <input value={equipmentForm.loaiThietBi} onChange={(event) => updateEquipmentForm('loaiThietBi', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Khu vực/phòng</span>
                <input value={equipmentForm.tenPhong} onChange={(event) => updateEquipmentForm('tenPhong', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Trạng thái</span>
                <select value={equipmentForm.trangThai} onChange={(event) => updateEquipmentForm('trangThai', event.target.value as EquipmentForm['trangThai'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Active">Hoạt động</option>
                  <option value="Under Maintenance">Bảo trì</option>
                  <option value="Broken">Hỏng</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Ngày mua / đưa vào sử dụng</span>
                <input type="date" value={equipmentForm.ngayNhap} onChange={(event) => updateEquipmentForm('ngayNhap', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Ghi chú</span>
                <textarea value={equipmentForm.ghiChu} onChange={(event) => updateEquipmentForm('ghiChu', event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeAddModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">
                Hủy
              </button>
              <button onClick={handleAddEquipment} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000]">
                Thêm thiết bị
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
