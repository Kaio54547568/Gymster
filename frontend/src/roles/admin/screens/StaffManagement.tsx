import { useEffect, useMemo, useState } from 'react';
import { UserCheck, Plus, Search, Eye, Award, Calendar, DollarSign, X, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchAdminStaffData } from '../../../services/adminDataApi';

type StaffRow = {
  maNV: string;
  hoTen: string;
  email?: string;
  chucVu: string;
  luongCoBan: string;
  sdt: string;
  chuyenMon: string;
  chungChi: string;
  performance: number;
  avatar: string;
};

type TrainerRow = {
  id: string;
  name: string;
  specialty: string;
  currentActiveMembers: number;
  maxActiveMembers: number;
  status?: string;
};

type StaffForm = {
  hoTen: string;
  email: string;
  sdt: string;
  chucVu: 'Staff' | 'Trainer';
  chuyenMon: string;
  trangThai: 'Available' | 'Full' | 'Inactive';
};

const initialStaffForm: StaffForm = {
  hoTen: '',
  email: '',
  sdt: '',
  chucVu: 'Staff',
  chuyenMon: '',
  trangThai: 'Available',
};

export default function StaffManagement() {
  const [selectedEmployee, setSelectedEmployee] = useState<StaffRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffForm>(initialStaffForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [staffData, setStaffData] = useState<StaffRow[]>([]);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchAdminStaffData().then(({ data, trainers: trainerRows, error }) => {
      if (!isMounted) return;
      setStaffData(data);
      setTrainers(trainerRows);
      setLoadMessage(error ? 'Staff and trainer data could not be loaded.' : '');
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStaff = useMemo(() => {
    const search = query.trim().toLowerCase();
    return staffData.filter((employee) => {
      const matchesSearch = !search || employee.hoTen.toLowerCase().includes(search) || employee.maNV.toLowerCase().includes(search);
      const matchesRole = roleFilter === 'all' || employee.chucVu === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [query, roleFilter, staffData]);

  const roles = Array.from(new Set(staffData.map((employee) => employee.chucVu).filter(Boolean)));

  const handleViewDetail = (employee: StaffRow) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const openAddModal = () => {
    setStaffForm(initialStaffForm);
    setFormError('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError('');
  };

  const updateStaffForm = (field: keyof StaffForm, value: string) => {
    setStaffForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleAddStaff = () => {
    const name = staffForm.hoTen.trim();
    const email = staffForm.email.trim();
    const phone = staffForm.sdt.trim();
    const specialty = staffForm.chuyenMon.trim();

    if (!name || !email || !phone || !staffForm.chucVu || !staffForm.trangThai) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (staffForm.chucVu === 'Trainer' && !specialty) {
      setFormError('Trainer specialty is required.');
      return;
    }

    const rolePrefix = staffForm.chucVu === 'Trainer' ? 'TRN' : 'STF';
    const nextNumber = staffData.length + 1;
    const employeeCode = `${rolePrefix}-${String(nextNumber).padStart(3, '0')}`;
    const status = staffForm.trangThai;

    const newEmployee: StaffRow = {
      maNV: employeeCode,
      hoTen: name,
      email,
      chucVu: staffForm.chucVu,
      luongCoBan: '0',
      sdt: phone,
      chuyenMon: staffForm.chucVu === 'Trainer' ? specialty : 'Operations',
      chungChi: status,
      performance: 0,
      avatar: '',
    };

    setStaffData((current) => [newEmployee, ...current]);

    if (staffForm.chucVu === 'Trainer') {
      const isFull = status === 'Full';
      setTrainers((current) => [
        {
          id: `local-${Date.now()}`,
          name,
          specialty,
          currentActiveMembers: isFull ? 10 : 0,
          maxActiveMembers: 10,
          status,
        },
        ...current,
      ]);
    }

    setShowAddModal(false);
    setStaffForm(initialStaffForm);
    setSuccessMessage(`${name} has been added successfully.`);
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">STAFF & TRAINER MANAGEMENT</h1>
          <p className="text-[#A1A1AA]">Quản lý nhân viên và huấn luyện viên</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Loading staff records...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm font-bold text-[#D1FAE5]">
          <CheckCircle className="h-5 w-5 text-[#22C55E]" />
          {successMessage}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search staff..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="bg-[#0c1014] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] cursor-pointer"
        >
          <option value="all">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trainers.map((trainer) => {
          const isInactive = String(trainer.status || '').toLowerCase() === 'inactive';
          const isFull = !isInactive && ((String(trainer.status || '').toLowerCase() === 'full') || (trainer.currentActiveMembers >= trainer.maxActiveMembers && trainer.maxActiveMembers > 0));
          const percent = trainer.maxActiveMembers ? Math.round((trainer.currentActiveMembers / trainer.maxActiveMembers) * 100) : 0;

          return (
            <div key={trainer.id} className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white">{trainer.name}</h3>
                  <p className="mt-1 text-sm text-[#A1A1AA]">{trainer.specialty}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${isInactive ? 'bg-white/10 text-white/45' : isFull ? 'bg-red-500/15 text-red-300' : 'bg-[#22C55E]/15 text-[#22C55E]'}`}>
                  {isInactive ? 'Inactive' : isFull ? 'Full' : 'Available'}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA]">Active members</span>
                <span className="font-bold text-white">{trainer.currentActiveMembers}/{trainer.maxActiveMembers}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#050607]">
                <div className={`h-full rounded-full ${isFull ? 'bg-red-400' : 'bg-[#EF233C]'}`} style={{ width: `${Math.min(100, percent)}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.map((employee) => (
          <motion.div
            key={employee.maNV}
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 hover:border-[#EF233C]/50 transition-all cursor-pointer"
            onClick={() => handleViewDetail(employee)}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-[#EF233C]/15 border border-[#EF233C]/30 flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-[#EF233C]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white truncate">{employee.hoTen}</h3>
                <p className="text-[#EF233C] font-semibold">{employee.chucVu}</p>
                <p className="text-[#A1A1AA] text-sm">{employee.maNV}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4 text-[#22C55E]" />
                <span className="text-[#A1A1AA]">Salary:</span>
                <span className="text-white font-semibold">{employee.luongCoBan} VND</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-4 h-4 text-[#F97316]" />
                <span className="text-[#A1A1AA]">Department:</span>
                <span className="text-white">{employee.chuyenMon || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-[#EF233C]" />
                <span className="text-[#A1A1AA]">Status:</span>
                <span className="text-white">{employee.chungChi || '-'}</span>
              </div>
            </div>

            <button className="mt-5 w-full py-2 bg-[#EF233C]/10 border border-[#EF233C]/30 text-[#EF233C] rounded-lg hover:bg-[#EF233C] hover:text-white transition-all font-semibold flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </motion.div>
        ))}
      </div>

      {!loading && !filteredStaff.length && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">
          No staff records found.
        </div>
      )}

      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl bg-[#EF233C]/15 border border-[#EF233C]/30 flex items-center justify-center">
                <UserCheck className="h-10 w-10 text-[#EF233C]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedEmployee.hoTen}</h2>
                <p className="text-[#EF233C] text-lg">{selectedEmployee.chucVu}</p>
                <p className="text-[#A1A1AA]">{selectedEmployee.maNV}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Email</p>
                <p className="text-white font-semibold">{selectedEmployee.email || '-'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Phone</p>
                <p className="text-white font-semibold">{selectedEmployee.sdt || '-'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Base salary</p>
                <p className="text-white font-semibold">{selectedEmployee.luongCoBan} VND</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Department</p>
                <p className="text-white font-semibold">{selectedEmployee.chuyenMon || '-'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Status</p>
                <p className="text-white font-semibold">{selectedEmployee.chungChi || '-'}</p>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} className="w-full py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
              Close
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeAddModal}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-[#EF233C]/10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Add Staff</h2>
                <p className="mt-1 text-[#A1A1AA]">Create a new staff or trainer record.</p>
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
                <span className="text-sm font-semibold text-[#A1A1AA]">Full name</span>
                <input value={staffForm.hoTen} onChange={(event) => updateStaffForm('hoTen', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Email</span>
                <input type="email" value={staffForm.email} onChange={(event) => updateStaffForm('email', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Phone</span>
                <input value={staffForm.sdt} onChange={(event) => updateStaffForm('sdt', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Role</span>
                <select value={staffForm.chucVu} onChange={(event) => updateStaffForm('chucVu', event.target.value as StaffForm['chucVu'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Staff">Staff</option>
                  <option value="Trainer">Trainer</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Specialty</span>
                <input
                  value={staffForm.chuyenMon}
                  onChange={(event) => updateStaffForm('chuyenMon', event.target.value)}
                  disabled={staffForm.chucVu !== 'Trainer'}
                  placeholder={staffForm.chucVu === 'Trainer' ? 'Strength, Yoga, Boxing...' : 'Required for trainers only'}
                  className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none transition focus:border-[#EF233C] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Status</span>
                <select value={staffForm.trangThai} onChange={(event) => updateStaffForm('trangThai', event.target.value as StaffForm['trangThai'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Available">Available</option>
                  <option value="Full">Full</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeAddModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">
                Cancel
              </button>
              <button onClick={handleAddStaff} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000]">
                Save Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
