import { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCheck, Plus, Search, Eye, X, CheckCircle, Mail, Phone, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { checkEmployeeCodeUnique, createAdminStaffRecord, fetchAdminStaffData, fetchAdminStaffDetail } from '../../../services/adminDataApi';

type StaffRow = {
  maNV: string;
  hoTen: string;
  email?: string;
  role?: string;
  chucVu: string;
  luongCoBan: string;
  sdt: string;
  chuyenMon: string;
  chungChi: string;
  currentActiveMembers?: number;
  maxActiveMembers?: number;
  performance: number;
  avatar: string;
};

type TrainerRow = {
  id: string;
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  avatar?: string;
  currentActiveMembers: number;
  maxActiveMembers: number;
  status?: string;
};

type StaffForm = {
  maNV: string;
  hoTen: string;
  email: string;
  sdt: string;
  gioiTinh: '' | 'unspecified' | 'male' | 'female' | 'other';
  ngaySinh: string;
  chucVu: 'Staff' | 'Trainer';
  matKhau: string;
};

type StaffDetail = {
  id: string;
  employee_code: string;
  full_name: string;
  role: 'staff' | 'trainer' | string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  department: string;
  base_salary: number | null;
  status: string;
  active_members: number;
  max_members: number;
};

const initialStaffForm: StaffForm = {
  maNV: '',
  hoTen: '',
  email: '',
  sdt: '',
  gioiTinh: '',
  ngaySinh: '',
  chucVu: 'Staff',
  matKhau: '',
};

const normalizeStatus = (status?: string) => {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'inactive' || normalized === 'suspended' ? 'Inactive' : 'Active';
};

const statusClassName = (status?: string) => (
  normalizeStatus(status) === 'Active'
    ? 'bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/20'
    : 'bg-white/10 text-white/50 border-white/10'
);

const initials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0])
  .join('')
  .toUpperCase() || 'G';

const validateWorkerPassword = (password: string) => {
  if (!password) return '';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character.';
  return '';
};

export default function StaffManagement() {
  const [selectedDetail, setSelectedDetail] = useState<StaffDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffForm>(initialStaffForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [staffData, setStaffData] = useState<StaffRow[]>([]);
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadMessage, setLoadMessage] = useState('');
  const [detailError, setDetailError] = useState('');

  const loadStaffAndTrainers = useCallback(async () => {
    setLoading(true);
    const { data, trainers: trainerRows, error } = await fetchAdminStaffData();
    setStaffData(data);
    setTrainers(trainerRows);
    setLoadMessage(error ? 'Staff and trainer data could not be loaded.' : '');
    setLoading(false);
  }, []);

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

  const matchesSearch = (values: Array<string | number | undefined | null>, search: string) => (
    !search || values.some((value) => String(value || '').toLowerCase().includes(search))
  );

  const filteredTrainers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return trainers.filter((trainer) => matchesSearch([
      trainer.name,
      trainer.email,
      trainer.phone,
    ], search));
  }, [query, trainers]);

  const filteredStaff = useMemo(() => {
    const search = query.trim().toLowerCase();
    return staffData
      .filter((employee) => String(employee.role || employee.chucVu).toLowerCase() === 'staff')
      .filter((employee) => matchesSearch([
        employee.hoTen,
        employee.email,
        employee.sdt,
      ], search));
  }, [query, staffData]);

  const handleViewDetail = async (id: string, role: string) => {
    setDetailError('');
    const { data, error } = await fetchAdminStaffDetail(id, role);
    if (error || !data) {
      setDetailError(error?.message || 'Could not load staff detail.');
      return;
    }
    setSelectedDetail(data);
    setShowModal(true);
  };

  const closeDetailModal = () => {
    setShowModal(false);
    setSelectedDetail(null);
    setDetailError('');
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

  const handleAddStaff = async () => {
    const name = staffForm.hoTen.trim();
    const email = staffForm.email.trim();
    const phone = staffForm.sdt.trim();
    const employeeCode = staffForm.maNV.trim();

    if (!name || !email || !phone || !staffForm.gioiTinh || !staffForm.ngaySinh || !staffForm.chucVu) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const passwordError = validateWorkerPassword(staffForm.matKhau);
    if (passwordError) {
      setFormError(passwordError);
      return;
    }

    setSaving(true);
    if (employeeCode) {
      const { unique, error: codeError } = await checkEmployeeCodeUnique(employeeCode);
      if (codeError) {
        setSaving(false);
        setFormError(codeError.message || 'Could not check employee code.');
        return;
      }
      if (!unique) {
        setSaving(false);
        setFormError('Employee code already exists. Please enter another code.');
        return;
      }
    }

    const { error } = await createAdminStaffRecord(staffForm);
    setSaving(false);

    if (error) {
      setFormError(error.message || 'Could not save staff record.');
      return;
    }

    setShowAddModal(false);
    setStaffForm(initialStaffForm);
    setSuccessMessage(`${name} has been added successfully.`);
    await loadStaffAndTrainers();
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
      {detailError && !showModal && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{detailError}</div>}
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
            placeholder="Search staff or trainers..."
            className="w-full bg-[#0c1014] border border-[#EF233C]/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#EF233C]"
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold uppercase tracking-wide text-white">Trainers</h2>
          <span className="rounded-full border border-[#EF233C]/20 bg-[#0c1014] px-3 py-1 text-sm font-bold text-[#A1A1AA]">{filteredTrainers.length} records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTrainers.map((trainer) => (
            <article key={trainer.id} className="min-h-[260px] rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 transition hover:border-[#EF233C]/50">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EF233C]/30 bg-[#EF233C]/15">
                  {trainer.avatar ? (
                    <img src={trainer.avatar} alt={trainer.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#EF233C]">{initials(trainer.name)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl font-bold text-white">{trainer.name}</h3>
                  <p className="mt-1 truncate text-sm font-semibold text-[#EF233C]">{trainer.specialty || 'Personal training'}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-3 text-[#A1A1AA]">
                  <Mail className="h-4 w-4 shrink-0 text-[#EF233C]" />
                  <span className="truncate">{trainer.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[#A1A1AA]">
                  <Phone className="h-4 w-4 shrink-0 text-[#EF233C]" />
                  <span className="truncate">{trainer.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-[#A1A1AA]">
                  <Users className="h-4 w-4 shrink-0 text-[#EF233C]" />
                  <span>Members <span className="font-bold text-white">{trainer.currentActiveMembers}/{trainer.maxActiveMembers || 0}</span></span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClassName(trainer.status)}`}>
                  {normalizeStatus(trainer.status)}
                </span>
                <button
                  className="rounded-lg border border-[#EF233C]/30 bg-[#EF233C]/10 p-2 text-[#EF233C] transition hover:bg-[#EF233C] hover:text-white"
                  aria-label={`View ${trainer.name}`}
                  onClick={() => handleViewDetail(trainer.id, 'trainer')}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {!loading && !filteredTrainers.length && (
          <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">
            No trainer records found.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold uppercase tracking-wide text-white">Staff</h2>
          <span className="rounded-full border border-[#EF233C]/20 bg-[#0c1014] px-3 py-1 text-sm font-bold text-[#A1A1AA]">{filteredStaff.length} records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStaff.map((employee) => (
              <motion.div
                key={employee.maNV}
                whileHover={{ scale: 1.02, y: -4 }}
                className="min-h-[260px] cursor-pointer rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 transition-all hover:border-[#EF233C]/50"
                onClick={() => handleViewDetail(employee.maNV, 'staff')}
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#EF233C]/30 bg-[#EF233C]/15">
                    {employee.avatar ? (
                      <img src={employee.avatar} alt={employee.hoTen} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#EF233C]">{initials(employee.hoTen)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-bold text-white">{employee.hoTen}</h3>
                    <p className="mt-1 truncate text-sm font-semibold text-[#EF233C]">{employee.chuyenMon || 'Staff'}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-[#A1A1AA]">
                    <Mail className="h-4 w-4 shrink-0 text-[#EF233C]" />
                    <span className="truncate">{employee.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[#A1A1AA]">
                    <Phone className="h-4 w-4 shrink-0 text-[#EF233C]" />
                    <span className="truncate">{employee.sdt || '-'}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClassName(employee.chungChi)}`}>
                    {normalizeStatus(employee.chungChi)}
                  </span>
                  <button
                    className="rounded-lg border border-[#EF233C]/30 bg-[#EF233C]/10 p-2 text-[#EF233C] transition hover:bg-[#EF233C] hover:text-white"
                    aria-label={`View ${employee.hoTen}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleViewDetail(employee.maNV, 'staff');
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
          ))}
        </div>

        {!loading && !filteredStaff.length && (
          <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">
            No staff records found.
          </div>
        )}
      </section>

      {showModal && selectedDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeDetailModal}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-2xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl bg-[#EF233C]/15 border border-[#EF233C]/30 flex items-center justify-center">
                <UserCheck className="h-10 w-10 text-[#EF233C]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedDetail.full_name || 'Not provided'}</h2>
                <p className="text-[#EF233C] text-lg">{selectedDetail.role === 'trainer' ? 'Trainer' : 'Staff'}</p>
                <p className="text-[#A1A1AA]">{selectedDetail.employee_code || 'Not provided'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Full name</p>
                <p className="text-white font-semibold">{selectedDetail.full_name || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Role</p>
                <p className="text-white font-semibold">{selectedDetail.role === 'trainer' ? 'Trainer' : 'Staff'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Employee code</p>
                <p className="text-white font-semibold">{selectedDetail.employee_code || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Email</p>
                <p className="text-white font-semibold">{selectedDetail.email || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Phone</p>
                <p className="text-white font-semibold">{selectedDetail.phone || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Gender</p>
                <p className="text-white font-semibold">{selectedDetail.gender || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Date of birth</p>
                <p className="text-white font-semibold">{selectedDetail.date_of_birth || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Base salary</p>
                <p className="text-white font-semibold">{selectedDetail.base_salary === null ? 'Not provided' : `${Number(selectedDetail.base_salary || 0).toLocaleString('vi-VN')} VND`}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Department</p>
                <p className="text-white font-semibold">{selectedDetail.department || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4">
                <p className="text-[#A1A1AA] text-sm">Status</p>
                <p className="text-white font-semibold">{selectedDetail.status || 'Not provided'}</p>
              </div>
              <div className="bg-black/30 rounded-xl p-4 md:col-span-2">
                <p className="text-[#A1A1AA] text-sm">Active members</p>
                <p className="text-white font-semibold">{Number(selectedDetail.active_members || 0)}/{Number(selectedDetail.max_members || 0)}</p>
              </div>
            </div>
            <button onClick={closeDetailModal} className="w-full py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
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
                <p className="mt-1 text-[#A1A1AA]">Create a new staff or trainer account.</p>
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
                <span className="text-sm font-semibold text-[#A1A1AA]">Employee code</span>
                <input
                  value={staffForm.maNV}
                  onChange={(event) => updateStaffForm('maNV', event.target.value)}
                  placeholder="Leave blank to auto-generate NV0001..."
                  className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Full name</span>
                <input value={staffForm.hoTen} onChange={(event) => updateStaffForm('hoTen', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Email</span>
                <input type="email" value={staffForm.email} onChange={(event) => updateStaffForm('email', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Phone number</span>
                <input value={staffForm.sdt} onChange={(event) => updateStaffForm('sdt', event.target.value)} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]" />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Gender</span>
                <select value={staffForm.gioiTinh} onChange={(event) => updateStaffForm('gioiTinh', event.target.value as StaffForm['gioiTinh'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="">Select gender</option>
                  <option value="unspecified">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Date of birth</span>
                <input
                  type="date"
                  value={staffForm.ngaySinh}
                  onChange={(event) => updateStaffForm('ngaySinh', event.target.value)}
                  className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Role</span>
                <select value={staffForm.chucVu} onChange={(event) => updateStaffForm('chucVu', event.target.value as StaffForm['chucVu'])} className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]">
                  <option value="Staff">Staff</option>
                  <option value="Trainer">Trainer</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-[#A1A1AA]">Password</span>
                <input
                  type="password"
                  value={staffForm.matKhau}
                  onChange={(event) => updateStaffForm('matKhau', event.target.value)}
                  placeholder="Default: Worker@123"
                  className="w-full rounded-xl border border-[#EF233C]/20 bg-[#050607] px-4 py-3 text-white outline-none focus:border-[#EF233C]"
                />
              </label>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={closeAddModal} className="rounded-xl border border-[#EF233C]/30 bg-black/30 px-6 py-3 font-semibold text-white transition hover:border-[#EF233C]">
                Cancel
              </button>
              <button onClick={handleAddStaff} disabled={saving} className="rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition hover:bg-[#990000] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
