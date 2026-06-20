import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Eye, Edit, RefreshCw, Search, UserX, X } from 'lucide-react';
import { disableStaffMember, getStaffMembers, renewStaffMemberPackage, updateStaffMember } from '../../../services/staffOperationsApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import { useLanguage } from '../../shared/LanguageContext';

type MemberStatus = 'Active' | 'Expired' | 'Disabled';

interface Member {
  memberUuid: string;
  memberId: string;
  userId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNum: string;
  citizenId: string;
  status: MemberStatus;
  currentPackageId?: string;
  currentPackage: string;
  expirationDate: string;
  dateOfBirth: string;
  gender: string;
}

interface PackageOption {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
}

type RenewalForm = {
  packageId: string;
  durationMonths: string;
  startDate: string;
  endDate: string;
  amount: string;
  paymentMethod: string;
  note: string;
};

const initialRenewalForm: RenewalForm = {
  packageId: '',
  durationMonths: '1',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  amount: '0',
  paymentMethod: 'cash',
  note: '',
};

const COPY = {
  en: {
    eyebrow: 'Member Operations',
    titleA: 'MEMBER',
    titleB: 'LIST',
    subtitle: 'Manage member profiles, package status, and access.',
    search: 'Search by name, ID, or phone...',
    all: 'All',
    active: 'Active',
    expired: 'Expired',
    disabled: 'Disabled',
    loading: 'Loading members...',
    warning: 'Some member data could not be loaded.',
    noMembers: 'No members found',
    adjust: 'Try adjusting your search or filters',
    showing: 'Showing',
    of: 'of',
    view: 'View Member',
    edit: 'Edit Member',
    renew: 'Renew Package',
    disable: 'Disable Member',
    password: 'Staff password',
    disablePrompt: 'Enter your staff password to disable this member account.',
    wrongPassword: 'Staff password is incorrect.',
    save: 'Save',
    cancel: 'Cancel',
    confirmDisable: 'Disable',
    renewSuccess: 'Package renewed successfully',
  },
  vi: {
    eyebrow: 'Quản lý hội viên',
    titleA: 'DANH SÁCH',
    titleB: 'HỘI VIÊN',
    subtitle: 'Quản lý hồ sơ hội viên, trạng thái gói tập và quyền truy cập từ dữ liệu hệ thống.',
    search: 'Tìm theo tên, mã hoặc số điện thoại...',
    all: 'Tất cả',
    active: 'Hoạt động',
    expired: 'Hết hạn',
    disabled: 'Vô hiệu hóa',
    loading: 'Đang tải hội viên...',
    warning: 'Một số dữ liệu hội viên không tải được từ hệ thống.',
    noMembers: 'Không tìm thấy hội viên',
    adjust: 'Hãy thử đổi từ khóa hoặc bộ lọc',
    showing: 'Đang hiển thị',
    of: 'trên',
    view: 'Xem hội viên',
    edit: 'Sửa hội viên',
    renew: 'Gia hạn gói',
    disable: 'Vô hiệu hóa hội viên',
    password: 'Mật khẩu staff',
    disablePrompt: 'Nhập mật khẩu staff để vô hiệu hóa tài khoản hội viên này.',
    wrongPassword: 'Mật khẩu staff không đúng.',
    save: 'Lưu',
    cancel: 'Hủy',
    confirmDisable: 'Vô hiệu hóa',
    renewSuccess: 'Gia hạn gói thành công',
  },
};

function formatDate(value: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB');
}

function addMonths(value: string, months: number) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== day) date.setDate(0);
  return date.toISOString().slice(0, 10);
}

function formatMoney(value: string | number) {
  return `${Number(value || 0).toLocaleString('vi-VN')} VND`;
}

export function MemberList() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [members, setMembers] = useState<Member[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'disable' | 'renew' | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [renewalForm, setRenewalForm] = useState<RenewalForm>(initialRenewalForm);
  const [staffPassword, setStaffPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isRenewing, setIsRenewing] = useState(false);

  const loadMembers = async () => {
    setLoading(true);
    const result = await getStaffMembers();
    if (result.error) {
      setWarning(copy.warning);
      setMembers([]);
    } else {
      setWarning('');
      setMembers(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchPackagesFromSupabase().then(({ data }) => {
      if (!isMounted) return;
      setPackages((data || []).filter((pkg: any) => pkg.isActive !== false).map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.price || 0),
        durationMonths: Number(pkg.durationMonths || 1),
      })));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return members.filter((member) => {
      const matchesSearch =
        member.fullName.toLowerCase().includes(query) ||
        member.memberId.toLowerCase().includes(query) ||
        member.phoneNum.includes(searchTerm);
      const matchesFilter = statusFilter === 'all' || member.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [members, searchTerm, statusFilter]);

  const buildRenewalForm = (member: Member): RenewalForm => {
    const fallbackPackage = packages.find((pkg) => pkg.name === member.currentPackage) || packages[0];
    const packageId = member.currentPackageId || fallbackPackage?.id || '';
    const startDate = new Date().toISOString().slice(0, 10);
    const durationMonths = '1';
    const selectedPackage = packages.find((pkg) => pkg.id === packageId) || fallbackPackage;
    const amount = selectedPackage ? Math.round((selectedPackage.price / Math.max(1, selectedPackage.durationMonths || 1)) * Number(durationMonths)) : 0;

    return {
      ...initialRenewalForm,
      packageId,
      durationMonths,
      startDate,
      endDate: addMonths(startDate, Number(durationMonths)),
      amount: String(amount),
    };
  };

  const openModal = (member: Member, mode: 'view' | 'edit' | 'disable' | 'renew') => {
    setSelectedMember(member);
    setModalMode(mode);
    setModalError('');
    setStaffPassword('');
    setEditForm({ ...member });
    if (mode === 'renew') {
      setRenewalForm(buildRenewalForm(member));
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setModalMode(null);
    setModalError('');
    setStaffPassword('');
    setIsRenewing(false);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3500);
  };

  const updateRenewalForm = (field: keyof RenewalForm, value: string) => {
    const next = { ...renewalForm, [field]: value };
    const selectedPackage = packages.find((pkg) => pkg.id === (field === 'packageId' ? value : next.packageId));
    const durationMonths = Number(field === 'durationMonths' ? value : next.durationMonths);
    const startDate = field === 'startDate' ? value : next.startDate;

    if (['packageId', 'durationMonths', 'startDate'].includes(field)) {
      next.endDate = addMonths(startDate, durationMonths);
      next.amount = selectedPackage
        ? String(Math.round((selectedPackage.price / Math.max(1, selectedPackage.durationMonths || 1)) * durationMonths))
        : '0';
    }

    setRenewalForm(next);
    setModalError('');
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;
    const result = await updateStaffMember(selectedMember.memberUuid, editForm);
    if (!result.ok) {
      setModalError(result.message);
      return;
    }
    closeModal();
    await loadMembers();
  };

  const handleDisableMember = async () => {
    if (!selectedMember) return;
    const result = await disableStaffMember(selectedMember.memberUuid, staffPassword);
    if (!result.ok) {
      setModalError(result.message || copy.wrongPassword);
      return;
    }
    closeModal();
    await loadMembers();
  };

  const handleRenewPackage = async () => {
    if (!selectedMember) return;
    const selectedPackage = packages.find((pkg) => pkg.id === renewalForm.packageId);

    if (!selectedPackage || !renewalForm.durationMonths || !renewalForm.startDate || !renewalForm.endDate || !renewalForm.amount || !renewalForm.paymentMethod) {
      setModalError('Vui lòng nhập đầy đủ thông tin gia hạn.');
      return;
    }

    setIsRenewing(true);
    const result = await renewStaffMemberPackage({
      memberId: selectedMember.memberUuid,
      packageId: renewalForm.packageId,
      packageName: selectedPackage.name,
      durationMonths: Number(renewalForm.durationMonths),
      startDate: renewalForm.startDate,
      endDate: renewalForm.endDate,
      amount: Number(renewalForm.amount),
      paymentMethod: renewalForm.paymentMethod,
      note: renewalForm.note,
    });
    setIsRenewing(false);

    if (!result.ok) {
      setModalError(result.message || 'Không thể gia hạn gói tập.');
      return;
    }

    setMembers((current) => current.map((member) => (
      member.memberUuid === selectedMember.memberUuid
        ? {
            ...member,
            status: 'Active',
            currentPackageId: result.data?.package_status === 'active' ? renewalForm.packageId : member.currentPackageId,
            currentPackage: result.data?.package_status === 'active' ? selectedPackage.name : member.currentPackage,
            expirationDate: result.data?.package_status === 'active' ? result.data?.end_date || renewalForm.endDate : member.expirationDate,
          }
        : member
    )));
    closeModal();
    showToast(copy.renewSuccess);
  };

  const getStatusBadge = (status: MemberStatus) => {
    const styles = {
      Active: 'bg-primary/20 text-primary border-primary/30',
      Expired: 'bg-destructive/20 text-destructive border-destructive/30',
      Disabled: 'bg-muted text-muted-foreground border-muted',
    };
    const label = status === 'Active' ? copy.active : status === 'Expired' ? copy.expired : copy.disabled;
    return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>{label}</span>;
  };

  return (
    <div className="relative">
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1762744829792-55562e8b873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxhdGhsZXRpYyUyMGZpdG5lc3MlMjB0cmFpbmluZ3xlbnwxfHx8fDE3NzgwODM0MTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Boxing Training"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60" />
        <div className="relative flex h-full items-center px-6">
          <div className="mx-auto w-full max-w-7xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">{copy.eyebrow}</p>
            <h1 className="mb-4 text-6xl font-black tracking-tight">
              <span className="text-primary">{copy.titleA}</span>
              <br />
              <span className="text-white">{copy.titleB}</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/70">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {warning && <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300">{warning}</div>}
          {toastMessage && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
              <CheckCircle className="h-5 w-5" />
              {toastMessage}
            </div>
          )}
          <div className="mb-6 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={copy.search}
                  className="w-full rounded-xl border-2 border-border bg-input py-4 pl-10 pr-4 font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                {[
                  ['all', copy.all],
                  ['Active', copy.active],
                  ['Expired', copy.expired],
                  ['Disabled', copy.disabled],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-xl px-4 py-3 font-bold transition-all ${statusFilter === value ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]' : 'bg-input hover:bg-secondary'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {['Member ID', 'Full Name', 'Phone', 'Citizen ID', 'Status', 'Current Package', 'Expiration', 'Actions'].map((heading) => (
                      <th key={heading} className="px-6 py-4 text-left font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr key={member.memberUuid} className={`border-b border-border transition-colors hover:bg-secondary/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'}`}>
                      <td className="px-6 py-4"><span className="font-mono text-primary">{member.memberId}</span></td>
                      <td className="px-6 py-4 font-medium">{member.fullName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{member.phoneNum || '-'}</td>
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{member.citizenId}</td>
                      <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                      <td className="px-6 py-4">{member.currentPackage}</td>
                      <td className="px-6 py-4 text-muted-foreground">{formatDate(member.expirationDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openModal(member, 'view')} className="rounded-lg p-2 transition-colors hover:bg-primary/20" title={copy.view}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => openModal(member, 'edit')} className="rounded-lg p-2 transition-colors hover:bg-primary/20" title={copy.edit}>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => openModal(member, 'renew')} className="rounded-lg p-2 transition-colors hover:bg-primary/20" title={copy.renew}>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button onClick={() => openModal(member, 'disable')} className="rounded-lg p-2 transition-colors hover:bg-destructive/20" title={copy.disable}>
                            <UserX className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loading && <div className="py-10 text-center text-muted-foreground">{copy.loading}</div>}
            {!loading && filteredMembers.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">{copy.noMembers}</h3>
                <p className="text-muted-foreground">{copy.adjust}</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {copy.showing} {filteredMembers.length} {copy.of} {members.length} members
          </div>
        </div>
      </div>

      {selectedMember && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-primary/40 bg-card p-6 shadow-[0_0_50px_rgba(255,0,0,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{modalMode === 'view' ? copy.view : modalMode === 'edit' ? copy.edit : modalMode === 'renew' ? copy.renew : copy.disable}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedMember.memberId} - {selectedMember.fullName}</p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>

            {modalError && <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{modalError}</div>}

            {modalMode === 'view' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  ['Email', selectedMember.email || '-'],
                  ['Phone', selectedMember.phoneNum || '-'],
                  ['Date of Birth', formatDate(selectedMember.dateOfBirth)],
                  ['Gender', selectedMember.gender],
                  ['Current Package', selectedMember.currentPackage],
                  ['Expiration', formatDate(selectedMember.expirationDate)],
                  ['Status', selectedMember.status],
                  ['User ID', selectedMember.userId || '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-input p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">{label}</p>
                    <p className="font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {modalMode === 'edit' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" value={editForm.firstName || ''} onChange={(event) => setEditForm({ ...editForm, firstName: event.target.value })} placeholder="First name" />
                <input className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" value={editForm.lastName || ''} onChange={(event) => setEditForm({ ...editForm, lastName: event.target.value })} placeholder="Last name" />
                <input className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" value={editForm.phoneNum || ''} onChange={(event) => setEditForm({ ...editForm, phoneNum: event.target.value })} placeholder="Phone" />
                <input type="date" className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" value={editForm.dateOfBirth || ''} onChange={(event) => setEditForm({ ...editForm, dateOfBirth: event.target.value })} />
                <select className="rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" value={editForm.gender || 'unspecified'} onChange={(event) => setEditForm({ ...editForm, gender: event.target.value })}>
                  <option value="unspecified">Unspecified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <button onClick={handleSaveMember} className="rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-destructive">{copy.save}</button>
              </div>
            )}

            {modalMode === 'renew' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-input p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Hội viên</p>
                    <p className="font-semibold text-white">{selectedMember.fullName}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-input p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-muted-foreground">Gói hiện tại</p>
                    <p className="font-semibold text-white">{selectedMember.currentPackage || '-'}</p>
                  </div>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Gói muốn gia hạn</span>
                    <select value={renewalForm.packageId} onChange={(event) => updateRenewalForm('packageId', event.target.value)} className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary">
                      <option value="">Chọn gói tập</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Thời hạn gia hạn</span>
                    <select value={renewalForm.durationMonths} onChange={(event) => updateRenewalForm('durationMonths', event.target.value)} className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary">
                      <option value="1">1 tháng</option>
                      <option value="3">3 tháng</option>
                      <option value="6">6 tháng</option>
                      <option value="12">12 tháng</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Ngày bắt đầu</span>
                    <input type="date" value={renewalForm.startDate} onChange={(event) => updateRenewalForm('startDate', event.target.value)} className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Ngày hết hạn mới</span>
                    <input type="date" value={renewalForm.endDate} readOnly className="w-full rounded-xl border border-border bg-input px-4 py-3 text-muted-foreground outline-none" />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Số tiền cần thanh toán</span>
                    <input value={formatMoney(renewalForm.amount)} readOnly className="w-full rounded-xl border border-border bg-input px-4 py-3 text-white outline-none" />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-muted-foreground">Phương thức thanh toán</span>
                    <select value={renewalForm.paymentMethod} onChange={(event) => updateRenewalForm('paymentMethod', event.target.value)} className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary">
                      <option value="cash">Tiền mặt</option>
                      <option value="bank_transfer">Chuyển khoản</option>
                      <option value="credit_card">Thẻ</option>
                      <option value="e_wallet">Ví điện tử</option>
                    </select>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-semibold text-muted-foreground">Ghi chú</span>
                    <textarea value={renewalForm.note} onChange={(event) => updateRenewalForm('note', event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary" />
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleRenewPackage} disabled={isRenewing} className="flex-1 rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-60">
                    {isRenewing ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}
                  </button>
                  <button onClick={closeModal} className="rounded-xl border border-border px-5 py-3 font-bold hover:bg-secondary">{copy.cancel}</button>
                </div>
              </div>
            )}

            {modalMode === 'disable' && (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">{copy.disablePrompt}</p>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(event) => setStaffPassword(event.target.value)}
                  placeholder={copy.password}
                  className="mb-5 w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary"
                />
                <div className="flex gap-3">
                  <button onClick={handleDisableMember} className="flex-1 rounded-xl bg-destructive px-5 py-3 font-bold text-white">{copy.confirmDisable}</button>
                  <button onClick={closeModal} className="rounded-xl border border-border px-5 py-3 font-bold hover:bg-secondary">{copy.cancel}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
