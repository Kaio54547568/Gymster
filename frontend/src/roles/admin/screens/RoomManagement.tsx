import { useCallback, useEffect, useMemo, useState } from 'react';
import KPICard from '../components/KPICard';
import { AlertCircle, CheckCircle, Edit, Plus, Search, Trash2, Wrench, X, Home, Users } from 'lucide-react';
import { motion } from 'motion/react';
import {
  fetchRooms,
  fetchRoomStats,
  createRoomRecord,
  updateRoomRecord,
  deleteRoomRecord,
} from '../../../services/roomApi';
import { getCurrentUser } from '../../../services/authService';

type RoomRow = {
  id: string;
  roomCode: string;
  roomName: string;
  roomType: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  equipmentCount: number;
};

type RoomStats = {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
};

type RoomForm = {
  roomCode: string;
  roomName: string;
  roomType: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
};

const initialRoomForm: RoomForm = {
  roomCode: '',
  roomName: '',
  roomType: 'Gym',
  capacity: 0,
  status: 'active',
};

const ROOM_TYPE_OPTIONS = [
  'Gym',
  'Yoga',
  'Fitness',
  'Cardio',
  'Strength',
  'PT Studio',
  'Group Class',
  'Recovery',
  'Facility',
  'Other',
];

export default function RoomManagement() {
  const currentUser = getCurrentUser();
  const normalizedRole = String(currentUser?.role || '').toLowerCase();
  const normalizedSourceRole = String(currentUser?.sourceRole || '').toLowerCase();
  const canManageRooms = Boolean(currentUser && (normalizedRole === 'owner' || normalizedSourceRole === 'owner'));

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [stats, setStats] = useState<RoomStats>({ total: 0, active: 0, maintenance: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null);
  const [roomForm, setRoomForm] = useState<RoomForm>(initialRoomForm);
  const [customRoomType, setCustomRoomType] = useState('');
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<RoomRow | null>(null);

  const loadData = useCallback(async () => {
    if (!canManageRooms) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [roomsRes, statsRes] = await Promise.all([
      fetchRooms(),
      fetchRoomStats(),
    ]);

    if (roomsRes.error) {
      setLoadError(roomsRes.error.message || 'Could not load rooms.');
    } else {
      setRooms(roomsRes.data || []);
    }

    if (!statsRes.error && statsRes.data) {
      setStats(statsRes.data);
    }
    setLoading(false);
  }, [canManageRooms]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const roomTypes = useMemo(() => {
    const types = new Set<string>();
    rooms.forEach((r) => {
      if (r.roomType) {
        // Display type name elegantly
        types.add(r.roomType);
      }
    });
    return Array.from(types);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesSearch =
        !search ||
        room.roomCode.toLowerCase().includes(search) ||
        room.roomName.toLowerCase().includes(search) ||
        room.roomType.toLowerCase().includes(search);
      const matchesStatus = selectedStatus === 'all' || room.status === selectedStatus;
      const matchesType = selectedType === 'all' || room.roomType === selectedType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rooms, query, selectedStatus, selectedType]);

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomForm(initialRoomForm);
    setCustomRoomType('');
    setFormError('');
    setShowFormModal(true);
  };

  const openEditModal = (room: RoomRow) => {
    setEditingRoom(room);
    const isStandardType = ROOM_TYPE_OPTIONS.includes(room.roomType);
    setRoomForm({
      roomCode: room.roomCode,
      roomName: room.roomName,
      roomType: isStandardType ? room.roomType : 'Other',
      capacity: room.capacity,
      status: room.status,
    });
    setCustomRoomType(isStandardType ? '' : room.roomType);
    setFormError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingRoom(null);
    setFormError('');
  };

  const validateForm = () => {
    if (!roomForm.roomCode.trim() || !roomForm.roomName.trim()) {
      return 'Please fill in Room Code and Room Name.';
    }
    if (roomForm.roomType === 'Other' && !customRoomType.trim()) {
      return 'Please enter a custom room type.';
    }
    if (roomForm.capacity < 0) {
      return 'Capacity must be a non-negative integer.';
    }
    return '';
  };

  const handleSaveRoom = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      setFormError(errorMsg);
      return;
    }

    setSaving(true);
    const finalType = roomForm.roomType === 'Other' ? customRoomType.trim() : roomForm.roomType;
    const payload = {
      ...roomForm,
      roomType: finalType,
    };

    const result = editingRoom
      ? await updateRoomRecord(editingRoom.id, payload)
      : await createRoomRecord(payload);

    setSaving(false);

    if (result.error) {
      setFormError(result.error.message || 'Room could not be saved.');
      return;
    }

    closeFormModal();
    setSuccessMessage(editingRoom ? 'Room updated successfully.' : 'Room added successfully.');
    await loadData();
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  const handleDeleteRoom = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const result = await deleteRoomRecord(deleteTarget.id);
    setSaving(false);

    if (result.error) {
      // If error is 409, show special message and suggest Inactive
      if (result.error.status === 409) {
        setLoadError(result.error.message);
      } else {
        setLoadError(result.error.message || 'Room could not be deleted.');
      }
      setDeleteTarget(null);
      // clear load error after a few seconds
      window.setTimeout(() => setLoadError(''), 6000);
      return;
    }

    setDeleteTarget(null);
    setSuccessMessage('Room deleted successfully.');
    await loadData();
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30', text: 'text-[#22C55E]' };
      case 'maintenance':
        return { bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/30', text: 'text-[#F97316]' };
      case 'inactive':
        return { bg: 'bg-[#A1A1AA]/10', border: 'border-[#A1A1AA]/30', text: 'text-[#A1A1AA]' };
      default:
        return { bg: 'bg-[#A1A1AA]/10', border: 'border-[#A1A1AA]/30', text: 'text-[#A1A1AA]' };
    }
  };

  if (!canManageRooms) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8">
          <h1 className="bebas mb-3 text-5xl tracking-wider text-white">ACCESS DENIED</h1>
          <p className="text-[#A1A1AA]">Room management is available only to Owner accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">ROOM MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Create and manage gym rooms, studios, and facility zones.</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Room
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading room list...</div>}
      {loadError && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#EF233C]/30 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">
          <AlertCircle className="h-5 w-5 text-[#EF233C]" />
          {loadError}
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm font-bold text-[#D1FAE5]">
          <CheckCircle className="h-5 w-5 text-[#22C55E]" />
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Rooms" value={stats.total} icon={Home} iconColor="#EF233C" />
        <KPICard title="Active" value={stats.active} icon={CheckCircle} iconColor="#22C55E" />
        <KPICard title="Maintenance" value={stats.maintenance} icon={Wrench} iconColor="#F97316" />
        <KPICard title="Inactive" value={stats.inactive} icon={AlertCircle} iconColor="#A1A1AA" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search room code, name, or type..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
        >
          <option value="all">All Room Types</option>
          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table view */}
      <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EF233C]/10 bg-[#06080b]">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Room Code</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Room Name</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Type</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Capacity</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Equipments</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Status</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EF233C]/10 text-white">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#A1A1AA]">
                    No rooms found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const sc = getStatusColor(room.status);
                  return (
                    <tr key={room.id} className="hover:bg-[#EF233C]/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-white">{room.roomCode}</td>
                      <td className="p-4 font-semibold">{room.roomName}</td>
                      <td className="p-4 text-sm text-[#A1A1AA]">{room.roomType}</td>
                      <td className="p-4 flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#A1A1AA]" />
                        <span>{room.capacity}</span>
                      </td>
                      <td className="p-4 text-sm font-semibold">{room.equipmentCount} items</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full uppercase border ${sc.bg} ${sc.border} ${sc.text}`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(room)}
                            className="p-2 text-[#60A5FA] hover:bg-[#60A5FA]/10 rounded-lg transition-colors"
                            title="Edit Room"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(room)}
                            className="p-2 text-[#EF233C] hover:bg-[#EF233C]/10 rounded-lg transition-colors"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-6 shadow-2xl relative"
          >
            <button onClick={closeFormModal} className="absolute right-4 top-4 text-[#A1A1AA] hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <h2 className="bebas text-4xl text-white mb-6">
              {editingRoom ? 'EDIT ROOM' : 'ADD NEW ROOM'}
            </h2>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-4 rounded-xl border border-[#EF233C]/30 bg-[#EF233C]/10 text-sm text-white font-bold">
                <AlertCircle className="w-5 h-5 text-[#EF233C]" />
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Room Code</label>
                <input
                  type="text"
                  disabled={!!editingRoom}
                  value={roomForm.roomCode}
                  onChange={(e) => setRoomForm({ ...roomForm, roomCode: e.target.value })}
                  placeholder="e.g. CARDIO-01"
                  className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomForm.roomName}
                  onChange={(e) => setRoomForm({ ...roomForm, roomName: e.target.value })}
                  placeholder="e.g. Cardio Zone"
                  className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Room Type</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
                >
                  {ROOM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {roomForm.roomType === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Specify Type</label>
                  <input
                    type="text"
                    value={customRoomType}
                    onChange={(e) => setCustomRoomType(e.target.value)}
                    placeholder="e.g. Pilates Studio"
                    className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Capacity</label>
                  <input
                    type="number"
                    min={0}
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">Status</label>
                  <select
                    value={roomForm.status}
                    onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value as RoomForm['status'] })}
                    className="w-full bg-[#06080b] border border-[#EF233C]/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeFormModal}
                className="px-5 py-2.5 bg-transparent text-[#A1A1AA] hover:text-white border border-[#EF233C]/20 hover:border-[#EF233C]/40 rounded-xl transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoom}
                disabled={saving}
                className="px-5 py-2.5 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] disabled:opacity-50 transition-colors font-semibold"
              >
                {saving ? 'Saving...' : 'Save Room'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-6 shadow-2xl relative"
          >
            <button onClick={() => setDeleteTarget(null)} className="absolute right-4 top-4 text-[#A1A1AA] hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <h3 className="bebas text-3xl text-white mb-4">DELETE ROOM</h3>
            <p className="text-[#A1A1AA] mb-6">
              Are you sure you want to delete room <span className="text-white font-bold">{deleteTarget.roomName} ({deleteTarget.roomCode})</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 bg-transparent text-[#A1A1AA] hover:text-white border border-[#EF233C]/20 hover:border-[#EF233C]/40 rounded-xl transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRoom}
                disabled={saving}
                className="px-5 py-2.5 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] disabled:opacity-50 transition-colors font-semibold"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
