import { useCallback, useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import { AlertCircle, CheckCircle, Dumbbell, Edit, MapPin, Plus, Search, Trash2, Wrench, X } from 'lucide-react';
import { motion } from 'motion/react';
import {
  createEquipmentRecord,
  deleteEquipmentRecord,
  fetchEquipmentManagementData,
  fetchEquipmentStats,
  updateEquipmentRecord,
} from '../../../services/adminDataApi';
import { getCurrentUser } from '../../../services/authService';

type EquipmentRow = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  category: string;
  status: string;
  purchaseDate: string;
  location: string;
  description?: string;
  notes: string;
  brand?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastMaintenanceDate?: string;
};

type EquipmentStats = {
  total: number;
  active: number;
  inUse: number;
  maintenance: number;
};

type EquipmentForm = {
  equipmentName: string;
  equipmentCode: string;
  category: string;
  location: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Broken';
  purchaseDate: string;
  manufacturer: string;
  serialNumber: string;
  description: string;
  lastMaintenanceDate: string;
  notes: string;
};

const initialEquipmentForm: EquipmentForm = {
  equipmentName: '',
  equipmentCode: '',
  category: '',
  location: '',
  status: 'Available',
  purchaseDate: '',
  manufacturer: '',
  serialNumber: '',
  description: '',
  lastMaintenanceDate: '',
  notes: '',
};

function formFromEquipment(item: EquipmentRow): EquipmentForm {
  return {
    equipmentName: item.equipmentName || '',
    equipmentCode: item.equipmentCode || '',
    category: item.category || '',
    location: item.location || '',
    status: (['Available', 'Active', 'In Use', 'Maintenance', 'Broken'].includes(item.status) ? (item.status === 'Active' ? 'Available' : item.status) : 'Available') as EquipmentForm['status'],
    purchaseDate: item.purchaseDate || '',
    manufacturer: item.manufacturer || item.brand || '',
    serialNumber: item.serialNumber || '',
    description: item.description || '',
    lastMaintenanceDate: item.lastMaintenanceDate || '',
    notes: item.notes || '',
  };
}

export default function EquipmentManagement() {
  const currentUser = getCurrentUser();
  const normalizedRole = String(currentUser?.role || '').toLowerCase();
  const normalizedSourceRole = String(currentUser?.sourceRole || '').toLowerCase();
  const canManageEquipment = Boolean(currentUser && (normalizedRole === 'owner' || normalizedSourceRole === 'owner'));
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [equipmentData, setEquipmentData] = useState<EquipmentRow[]>([]);
  const [stats, setStats] = useState<EquipmentStats>({ total: 0, active: 0, inUse: 0, maintenance: 0 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRow | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<EquipmentForm>(initialEquipmentForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');

  const loadEquipment = useCallback(async () => {
    if (!canManageEquipment) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [listResult, statsResult] = await Promise.all([
      fetchEquipmentManagementData(),
      fetchEquipmentStats(),
    ]);
    setEquipmentData(listResult.data || []);
    setStats(statsResult.data || { total: 0, active: 0, inUse: 0, maintenance: 0 });
    setLoadMessage(listResult.error || statsResult.error ? 'Equipment data could not be loaded.' : '');
    setLoading(false);
  }, [canManageEquipment]);

  useEffect(() => {
    void loadEquipment();
  }, [loadEquipment]);

  const filteredEquipment = useMemo(() => {
    const search = query.trim().toLowerCase();
    return equipmentData.filter((item) => {
      const matchesSearch = !search
        || item.equipmentName.toLowerCase().includes(search)
        || item.equipmentCode.toLowerCase().includes(search)
        || item.location.toLowerCase().includes(search)
        || item.category.toLowerCase().includes(search);
      const matchesRoom = selectedRoom === 'all' || item.location === selectedRoom;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchesSearch && matchesRoom && matchesStatus;
    });
  }, [equipmentData, query, selectedRoom, selectedStatus]);

  const rooms = Array.from(new Set(equipmentData.map((item) => item.location).filter(Boolean)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Active':
        return { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30', text: 'text-[#22C55E]' };
      case 'In Use':
        return { bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30', text: 'text-[#60A5FA]' };
      case 'Broken':
        return { bg: 'bg-[#EF233C]/10', border: 'border-[#EF233C]/30', text: 'text-[#EF233C]' };
      case 'Maintenance':
        return { bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/30', text: 'text-[#F97316]' };
      default:
        return { bg: 'bg-[#A1A1AA]/10', border: 'border-[#A1A1AA]/30', text: 'text-[#A1A1AA]' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available':
      case 'Active':
        return <CheckCircle className="w-5 h-5 text-[#22C55E]" />;
      case 'In Use':
        return <Dumbbell className="w-5 h-5 text-[#60A5FA]" />;
      case 'Broken':
        return <AlertCircle className="w-5 h-5 text-[#EF233C]" />;
      case 'Maintenance':
        return <Wrench className="w-5 h-5 text-[#F97316]" />;
      default:
        return null;
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setEquipmentForm(initialEquipmentForm);
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (item: EquipmentRow) => {
    setEditingEquipment(item);
    setEquipmentForm(formFromEquipment(item));
    setFormError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingEquipment(null);
    setFormError('');
  };

  const updateEquipmentForm = (field: keyof EquipmentForm, value: string) => {
    setEquipmentForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!equipmentForm.equipmentName.trim() || !equipmentForm.equipmentCode.trim() || !equipmentForm.category.trim() || !equipmentForm.location.trim() || !equipmentForm.purchaseDate.trim()) {
      return 'Please fill in all required fields.';
    }
    return '';
  };

  const handleSaveEquipment = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    const result = editingEquipment
      ? await updateEquipmentRecord(editingEquipment.id, equipmentForm)
      : await createEquipmentRecord(equipmentForm);
    setSaving(false);

    if (result.error) {
      setFormError(result.error.message || 'Equipment could not be saved.');
      return;
    }

    closeFormModal();
    setSuccessMessage(editingEquipment ? 'Equipment updated successfully.' : 'Equipment added successfully.');
    await loadEquipment();
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleDeleteEquipment = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const result = await deleteEquipmentRecord(deleteTarget.id);
    setSaving(false);

    if (result.error) {
      setLoadMessage(result.error.message || 'Equipment could not be deleted.');
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);
    setSuccessMessage('Equipment deleted successfully.');
    await loadEquipment();
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  if (!canManageEquipment) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8">
          <h1 className="bebas mb-3 text-5xl tracking-wider text-white">ACCESS DENIED</h1>
          <p className="text-[#A1A1AA]">Equipment management is available only to Owner accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">EQUIPMENT MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Database-backed equipment inventory and status.</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Equipment
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
        <KPICard title="Total Equipment" value={stats.total} icon={Dumbbell} iconColor="#EF233C" />
        <KPICard title="Available" value={stats.active} icon={CheckCircle} iconColor="#22C55E" />
        <KPICard title="In Use" value={stats.inUse} icon={Dumbbell} iconColor="#60A5FA" />
        <KPICard title="Maintenance" value={stats.maintenance} icon={Wrench} iconColor="#F97316" />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
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
        <select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)} className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer">
          <option value="all">All rooms</option>
          {rooms.map((room) => <option key={room} value={room}>{room}</option>)}
        </select>
        <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer">
          <option value="all">All status</option>
          <option value="Available">Available</option>
          <option value="In Use">In Use</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Broken">Broken</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipment.map((equipment) => {
          const statusColor = getStatusColor(equipment.status);
          return (
            <motion.div key={equipment.id} whileHover={{ scale: 1.02, y: -4 }} className="relative bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl overflow-hidden hover:border-[#EF233C]/50 transition-all">
              <button
                type="button"
                onClick={() => openEditModal(equipment)}
                aria-label={`Edit ${equipment.equipmentName}`}
                className="absolute right-4 top-4 z-10 rounded-xl border border-[#EF233C]/30 bg-black/70 p-2.5 text-[#EF233C] shadow-lg shadow-black/20 transition hover:border-[#EF233C] hover:bg-[#EF233C] hover:text-white hover:scale-105"
              >
                <Edit className="h-4 w-4" />
              </button>
              <div className="h-32 bg-black/40 flex items-center justify-center">
                <Dumbbell className="h-14 w-14 text-[#EF233C]" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{equipment.equipmentName}</h3>
                    <p className="text-[#A1A1AA]">{equipment.equipmentCode}</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1 px-3 py-1 border rounded-lg text-xs font-semibold ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}>
                    {getStatusIcon(equipment.status)}
                    {equipment.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-[#A1A1AA]">Type: <span className="text-white">{equipment.category || 'Not set'}</span></p>
                  <div className="flex items-center gap-2 text-[#A1A1AA]"><MapPin className="w-4 h-4" />{equipment.location || 'Unassigned'}</div>
                  <p className="text-[#A1A1AA]">Purchase date: <span className="text-white">{equipment.purchaseDate || 'Not set'}</span></p>
                  {(equipment.manufacturer || equipment.brand) && <p className="text-[#A1A1AA]">Manufacturer: <span className="text-white">{equipment.manufacturer || equipment.brand}</span></p>}
                  {equipment.serialNumber && <p className="text-[#A1A1AA]">Serial: <span className="text-white">{equipment.serialNumber}</span></p>}
                  {equipment.description && <p className="text-[#A1A1AA]">Description: <span className="text-white">{equipment.description}</span></p>}
                  {equipment.lastMaintenanceDate && <p className="text-[#A1A1AA]">Last maintenance: <span className="text-white">{equipment.lastMaintenanceDate}</span></p>}
                  {equipment.notes && <p className="text-[#A1A1AA]">Notes: <span className="text-white">{equipment.notes}</span></p>}
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={() => setDeleteTarget(equipment)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2 font-bold text-white transition hover:border-[#EF233C] hover:text-[#EF233C]">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && !filteredEquipment.length && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">No equipment records found.</div>}

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeFormModal}>
          <div className="w-full max-w-3xl rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">{editingEquipment ? 'Edit Equipment' : 'Add Equipment'}</h2>
                <p className="mt-1 text-[#A1A1AA]">Changes are saved directly to the database.</p>
              </div>
              <button onClick={closeFormModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-[#A1A1AA] transition hover:border-[#EF233C] hover:text-white">
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
                <span className="text-sm font-semibold text-[#A1A1AA]">Equipment Code</span>
                <input value={equipmentForm.equipmentCode} disabled={Boolean(editingEquipment)} onChange={(event) => updateEquipmentForm('equipmentCode', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C] disabled:cursor-not-allowed disabled:opacity-60" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Equipment Name</span>
                <input value={equipmentForm.equipmentName} onChange={(event) => updateEquipmentForm('equipmentName', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Category / Type</span>
                <input value={equipmentForm.category} onChange={(event) => updateEquipmentForm('category', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Status</span>
                <select value={equipmentForm.status} onChange={(event) => updateEquipmentForm('status', event.target.value as EquipmentForm['status'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Broken">Broken</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Purchase Date</span>
                <input type="date" value={equipmentForm.purchaseDate} onChange={(event) => updateEquipmentForm('purchaseDate', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Location</span>
                <input value={equipmentForm.location} onChange={(event) => updateEquipmentForm('location', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Manufacturer</span>
                <input value={equipmentForm.manufacturer} onChange={(event) => updateEquipmentForm('manufacturer', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Serial Number</span>
                <input value={equipmentForm.serialNumber} onChange={(event) => updateEquipmentForm('serialNumber', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Last Maintenance Date</span>
                <input type="date" value={equipmentForm.lastMaintenanceDate} onChange={(event) => updateEquipmentForm('lastMaintenanceDate', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Description</span>
                <textarea value={equipmentForm.description} onChange={(event) => updateEquipmentForm('description', event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Notes</span>
                <textarea value={equipmentForm.notes} onChange={(event) => updateEquipmentForm('notes', event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeFormModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">
                Cancel
              </button>
              <button onClick={handleSaveEquipment} disabled={saving} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : editingEquipment ? 'Save changes' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-md rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-6 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white">Delete equipment?</h2>
            <p className="mt-3 text-sm text-[#A1A1AA]">This will remove {deleteTarget.equipmentName} from the database.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-5 py-3 font-semibold text-white transition hover:border-[#EF233C]">Cancel</button>
              <button onClick={handleDeleteEquipment} disabled={saving} className="rounded-xl bg-[#EF233C] px-5 py-3 font-semibold text-white transition hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
