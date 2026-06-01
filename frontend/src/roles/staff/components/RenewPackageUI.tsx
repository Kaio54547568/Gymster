import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, FileText, Plus, Search, X } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import {
  createPackageChangeRequest,
  getPackageChangeRequests,
  updatePackageChangeRequestStatus,
} from '../../../services/memberPackageApi';

type PackageOption = {
  id: string;
  name: string;
  packageTypeLabel?: string;
  durationMonths?: number;
  price: number;
  sessionLimit?: string;
  hasPersonalTrainer?: boolean;
};

type MemberOption = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  currentPackageName: string;
};

type RenewalRequest = {
  requestId: string;
  memberId?: string;
  memberName: string;
  memberEmail?: string;
  currentPackageName: string;
  packageId?: string;
  packageName: string;
  amount: number;
  paymentMethod?: string;
  requestType: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  denyReason?: string;
  source?: string;
};

const paymentMethods = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'e_wallet', label: 'E-Wallet' },
];

function formatVnd(amount: number) {
  return `${Number(amount || 0).toLocaleString('vi-VN')} VND`;
}

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
}

function requestTypeLabel(type: string) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'buy') return 'Buy';
  if (normalized === 'upgrade') return 'Upgrade';
  if (normalized === 'manual') return 'Manual';
  return 'Renew';
}

function statusLabel(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'pending_staff_approval' || normalized === 'pending') return 'Pending';
  if (normalized === 'approved' || normalized === 'accepted') return 'Approved';
  if (normalized === 'denied' || normalized === 'rejected') return 'Denied';
  return normalized ? normalized.replaceAll('_', ' ') : 'Unknown';
}

function statusClass(status: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved' || normalized === 'accepted') {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  }
  if (normalized === 'denied' || normalized === 'rejected') {
    return 'bg-red-500/15 text-red-300 border-red-500/40';
  }
  return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
}

function normalizeRequest(request: any): RenewalRequest {
  return {
    requestId: String(request.requestId || request.request_id || request.id || `REQ-${Date.now()}`),
    memberId: request.memberId || request.member_id,
    memberName: request.memberName || request.member_name || request.fullName || request.memberEmail || 'Member',
    memberEmail: request.memberEmail || request.member_email || request.email,
    currentPackageName: request.currentPackageName || request.current_package_name || 'Current package not linked',
    packageId: request.packageId || request.package_id,
    packageName: request.packageName || request.package_name || 'Requested package',
    amount: Number(request.amount || request.price || 0),
    paymentMethod: request.paymentMethod || request.payment_method || 'Not selected',
    requestType: request.requestType || request.request_type || 'renewal',
    status: request.status || 'pending_staff_approval',
    createdAt: request.createdAt || request.created_at || new Date().toISOString(),
    reviewedAt: request.reviewedAt || request.reviewed_at,
    denyReason: request.denyReason || request.deny_reason,
    source: request.source,
  };
}

function combineUserName(user: any, fallback = 'Member') {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return name || fallback;
}

async function fetchMembersFromSupabase(): Promise<MemberOption[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('members')
    .select(`
      member_id,
      member_code,
      status,
      users (
        first_name,
        last_name,
        email,
        phone_number
      )
    `)
    .limit(100);

  if (error || !Array.isArray(data)) {
    if (error) console.error('[Gymster h\u1ec7 th\u1ed1ng] Failed to load members for renewal requests:', error);
    return [];
  }

  return data.map((row: any) => ({
    id: row.member_id || row.member_code,
    name: combineUserName(row.users, row.member_code || 'Member'),
    email: row.users?.email || '',
    phone: row.users?.phone_number || '',
    currentPackageName: 'Current package not linked',
  }));
}

export function RenewPackageUI() {
  const [requests, setRequests] = useState<RenewalRequest[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailRequest, setDetailRequest] = useState<RenewalRequest | null>(null);
  const [denyTarget, setDenyTarget] = useState<RenewalRequest | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    memberId: '',
    packageId: '',
    paymentMethod: 'cash',
    requestType: 'renewal',
  });

  const loadRequests = async () => {
    const { data, error } = await getPackageChangeRequests();
    if (!error) {
      setRequests(data.map(normalizeRequest));
      return;
    }
    setRequests([]);
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [packageResult, memberResult] = await Promise.all([
          fetchPackagesFromSupabase(),
          fetchMembersFromSupabase(),
        ]);

        if (!mounted) return;

        setPackages(packageResult.data);
        setMembers(memberResult);
        await loadRequests();

        if (packageResult.error) {
          setErrorMessage('Packages could not be loaded.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;

    return requests.filter((request) =>
      [
        request.requestId,
        request.memberName,
        request.memberEmail,
        request.currentPackageName,
        request.packageName,
        requestTypeLabel(request.requestType),
        statusLabel(request.status),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [requests, searchTerm]);

  const stats = useMemo(() => {
    const pending = requests.filter((request) => ['pending_staff_approval', 'pending'].includes(request.status)).length;
    const approved = requests.filter((request) => ['approved', 'accepted'].includes(request.status)).length;
    const denied = requests.filter((request) => ['denied', 'rejected'].includes(request.status)).length;
    return { total: requests.length, pending, approved, denied };
  }, [requests]);

  const handleAccept = async (request: RenewalRequest) => {
    await updatePackageChangeRequestStatus(request.requestId, 'approved');
    await loadRequests();
  };

  const handleDeny = async () => {
    if (!denyTarget) return;
    await updatePackageChangeRequestStatus(denyTarget.requestId, 'denied', denyReason.trim() || 'Denied by staff.');
    setDenyTarget(null);
    setDenyReason('');
    await loadRequests();
  };

  const handleCreateManualRequest = async () => {
    const selectedMember = members.find((member) => member.id === manualForm.memberId);
    const selectedPackage = packages.find((pkg) => pkg.id === manualForm.packageId);

    if (!selectedMember || !selectedPackage) return;

    const payload = {
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      memberEmail: selectedMember.email,
      currentPackageName: selectedMember.currentPackageName,
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      amount: selectedPackage.price,
      paymentMethod: manualForm.paymentMethod,
      requestType: manualForm.requestType,
    };

    const { error } = await createPackageChangeRequest(payload);
    if (error) {
      setErrorMessage('Request could not be created.');
      return;
    }

    setShowAddModal(false);
    await loadRequests();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-primary text-sm font-black tracking-[0.35em] uppercase mb-3">Duyệt gói tập</p>
            <h1 className="text-5xl font-black tracking-tight mb-3">Yêu cầu gia hạn gói</h1>
            <p className="text-muted-foreground max-w-3xl">
              Duyệt yêu cầu mua mới, gia hạn và nâng cấp gói tập của hội viên.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-destructive px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(255,0,0,0.35)] transition hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            Thêm mới
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Tổng yêu cầu', value: stats.total, icon: FileText },
            { label: 'Chờ duyệt', value: stats.pending, icon: AlertCircle },
            { label: 'Đã duyệt', value: stats.approved, icon: CheckCircle },
            { label: 'Đã từ chối', value: stats.denied, icon: X },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-card/90 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-3xl font-black">{item.value}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-border bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Danh sách yêu cầu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nguồn dữ liệu: <span className="font-semibold text-foreground">gymster_member_renewal_requests</span>
              </p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm yêu cầu..."
                className="w-full rounded-2xl border border-border bg-input py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4">Mã yêu cầu</th>
                  <th className="px-5 py-4">Hội viên</th>
                  <th className="px-5 py-4">Gói hiện tại</th>
                  <th className="px-5 py-4">Gói yêu cầu</th>
                  <th className="px-5 py-4">Loại</th>
                  <th className="px-5 py-4">Ngày yêu cầu</th>
                  <th className="px-5 py-4">Số tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center font-bold text-muted-foreground">
                      Đang tải yêu cầu gia hạn...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center font-bold text-muted-foreground">
                      Không tìm thấy yêu cầu gia hạn.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const canReview = ['pending_staff_approval', 'pending'].includes(request.status);
                    return (
                      <tr key={request.requestId} className="border-b border-border/70 transition hover:bg-primary/5">
                        <td className="px-5 py-4 font-mono text-sm font-black text-primary">{request.requestId}</td>
                        <td className="px-5 py-4">
                          <p className="font-black">{request.memberName}</p>
                          <p className="text-xs text-muted-foreground">{request.memberEmail || request.memberId || '-'}</p>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">{request.currentPackageName}</td>
                        <td className="px-5 py-4 font-bold">{request.packageName}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                            {requestTypeLabel(request.requestType)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold">{formatDate(request.createdAt)}</td>
                        <td className="px-5 py-4 font-black">{formatVnd(request.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass(request.status)}`}>
                            {statusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailRequest(request)}
                              className="rounded-xl border border-border px-3 py-2 text-sm font-bold transition hover:border-primary hover:bg-primary/10"
                            >
                              Xem chi tiết
                            </button>
                            {canReview && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(request)}
                                  className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/25"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDenyTarget(request)}
                                  className="rounded-xl bg-red-500/15 px-3 py-2 text-sm font-black text-red-300 transition hover:bg-red-500/25"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-[0_0_70px_rgba(255,0,0,0.25)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">Add New Renewal Action</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create a staff-approved manual renewal record.</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-black uppercase text-muted-foreground">Member</span>
                <select
                  value={manualForm.memberId}
                  onChange={(event) => setManualForm({ ...manualForm, memberId: event.target.value })}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 font-bold outline-none focus:border-primary"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black uppercase text-muted-foreground">Requested package</span>
                <select
                  value={manualForm.packageId}
                  onChange={(event) => setManualForm({ ...manualForm, packageId: event.target.value })}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 font-bold outline-none focus:border-primary"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatVnd(pkg.price)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black uppercase text-muted-foreground">Request type</span>
                <select
                  value={manualForm.requestType}
                  onChange={(event) => setManualForm({ ...manualForm, requestType: event.target.value })}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 font-bold outline-none focus:border-primary"
                >
                  <option value="buy">Buy</option>
                  <option value="renewal">Renew</option>
                  <option value="upgrade">Upgrade</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-black uppercase text-muted-foreground">Payment method</span>
                <select
                  value={manualForm.paymentMethod}
                  onChange={(event) => setManualForm({ ...manualForm, paymentMethod: event.target.value })}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 font-bold outline-none focus:border-primary"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">
                  This action records a staff-approved renewal in the local MVP request queue. It does not charge a real
                  payment provider.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-2xl border border-border px-5 py-3 font-black transition hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateManualRequest}
                className="rounded-2xl bg-gradient-to-r from-primary to-destructive px-5 py-3 font-black text-white transition hover:scale-[1.02]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {denyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-[0_0_70px_rgba(255,0,0,0.25)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-2xl font-black">Deny Request</h3>
              <button type="button" onClick={() => setDenyTarget(null)} className="rounded-xl p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Add a reason for denying <span className="font-bold text-foreground">{denyTarget.requestId}</span>.
            </p>
            <textarea
              value={denyReason}
              onChange={(event) => setDenyReason(event.target.value)}
              rows={4}
              placeholder="Reason for denial..."
              className="w-full resize-none rounded-2xl border border-border bg-input p-4 font-semibold outline-none focus:border-primary"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDenyTarget(null)}
                className="rounded-2xl border border-border px-5 py-3 font-black transition hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeny}
                className="rounded-2xl bg-red-500/20 px-5 py-3 font-black text-red-300 transition hover:bg-red-500/30"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-[0_0_70px_rgba(255,0,0,0.25)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">Request Detail</h3>
                <p className="mt-1 font-mono text-sm text-primary">{detailRequest.requestId}</p>
              </div>
              <button type="button" onClick={() => setDetailRequest(null)} className="rounded-xl p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Member', detailRequest.memberName],
                ['Member email', detailRequest.memberEmail || '-'],
                ['Current package', detailRequest.currentPackageName],
                ['Requested package', detailRequest.packageName],
                ['Request type', requestTypeLabel(detailRequest.requestType)],
                ['Payment method', detailRequest.paymentMethod || '-'],
                ['Amount', formatVnd(detailRequest.amount)],
                ['Status', statusLabel(detailRequest.status)],
                ['Requested date', formatDate(detailRequest.createdAt)],
                ['Reviewed date', formatDate(detailRequest.reviewedAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
                  <p className="mt-2 font-bold">{value}</p>
                </div>
              ))}
            </div>

            {detailRequest.denyReason && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs font-black uppercase text-red-300">Deny reason</p>
                <p className="mt-2 font-semibold">{detailRequest.denyReason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
