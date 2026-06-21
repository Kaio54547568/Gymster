import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle, ChevronLeft, ChevronRight, Clock, RefreshCw, Search, Users } from 'lucide-react';
import { getStaffCheckInList, recordStaffCheckIn } from '../../../services/checkInApi';
import { useLanguage, type AppLanguage } from '../../shared/LanguageContext';

type MemberStatus = 'Active' | 'Expired' | 'Disabled';

interface Member {
  workoutSessionId: string;
  memberUuid: string;
  memberId: string;
  fullName: string;
  phoneNum: string;
  status: MemberStatus;
  currentPackage: string;
  expirationDate: string;
  sessionTitle: string;
  sessionTime: string;
}

interface CheckInRecord {
  id: string;
  memberId: string;
  usageDate: string;
}

type CheckInMessageCode = 'system_not_configured' | 'no_active_package' | 'no_booked_session' | 'already_checked' | 'check_in_success' | 'check_in_failed';

type CheckInResult = {
  ok: boolean;
  alreadyChecked?: boolean;
  code?: CheckInMessageCode;
  message: string;
};

const COPY = {
  en: {
    eyebrow: 'Staff check-in',
    title: 'Daily Member Check-in',
    description: 'Choose a training date, review members, and record daily check-ins. Package expiry still follows the package end date.',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    today: 'Today',
    stats: {
      date: 'Check-in date',
      checked: 'Checked in',
      active: 'Active members',
      remaining: 'Not checked in',
    },
    listTitle: 'Daily check-in list',
    listDescription: 'Review all members, package status, and check-in status for the selected day.',
    searchPlaceholder: 'Search members by name, ID, or phone number...',
    refresh: 'Refresh',
    table: {
      memberId: 'Member ID',
      member: 'Member',
      phone: 'Phone number',
      package: 'Package',
      session: 'Session',
      expiration: 'Expires',
      checkIn: 'Check-in',
      actions: 'Actions',
    },
    checkedAt: 'Checked in at',
    notChecked: 'Not checked in',
    recording: 'Recording...',
    checkedButton: 'Checked in',
    checkInButton: 'Check-in',
    invalidPackage: 'Invalid package',
    loading: 'Loading check-in data...',
    emptyTitle: 'No members found',
    emptyDescription: 'Only booked workout sessions for the selected day are shown here.',
    loadError: 'Could not load complete check-in data. Please try again.',
    messages: {
      system_not_configured: 'The system is not configured.',
      no_active_package: 'This member does not have an active package for check-in.',
      no_booked_session: 'This member does not have a booked workout session for this day.',
      already_checked: 'This member has already checked in for this day.',
      check_in_success: 'Check-in completed. Usage history and training session count were updated.',
      check_in_failed: 'Could not check in this member.',
    },
  },
  vi: {
    eyebrow: 'Check-in nhân viên',
    title: 'Check-in hội viên theo ngày',
    description: 'Chọn ngày tập, xem danh sách hội viên và ghi nhận lượt check-in trong ngày. Thời hạn gói tập vẫn tính theo ngày kết thúc gói.',
    previousDay: 'Ngày trước',
    nextDay: 'Ngày sau',
    today: 'Hôm nay',
    stats: {
      date: 'Ngày check-in',
      checked: 'Đã check-in',
      active: 'Hội viên đang hoạt động',
      remaining: 'Chưa check-in',
    },
    listTitle: 'Danh sách check-in theo ngày',
    listDescription: 'Xem toàn bộ hội viên, trạng thái gói tập và trạng thái check-in của ngày đã chọn.',
    searchPlaceholder: 'Tìm hội viên theo tên, mã hoặc số điện thoại...',
    refresh: 'Làm mới',
    table: {
      memberId: 'Mã hội viên',
      member: 'Hội viên',
      phone: 'Số điện thoại',
      package: 'Gói tập',
      session: 'Lịch tập',
      expiration: 'Hạn gói',
      checkIn: 'Check-in',
      actions: 'Thao tác',
    },
    checkedAt: 'Đã check-in lúc',
    notChecked: 'Chưa check-in',
    recording: 'Đang ghi nhận...',
    checkedButton: 'Đã check-in',
    checkInButton: 'Check-in',
    invalidPackage: 'Gói không hợp lệ',
    loading: 'Đang tải dữ liệu check-in...',
    emptyTitle: 'Không tìm thấy hội viên',
    emptyDescription: 'Chỉ hiển thị các lịch tập đã đặt trong ngày đang chọn.',
    loadError: 'Không thể tải đầy đủ dữ liệu check-in. Vui lòng thử lại.',
    messages: {
      system_not_configured: 'Hệ thống chưa được cấu hình.',
      no_active_package: 'Hội viên chưa có gói tập còn hiệu lực để check-in.',
      no_booked_session: 'Hội viên không có lịch tập đã đặt trong ngày này.',
      already_checked: 'Hội viên đã được check-in trong ngày này.',
      check_in_success: 'Check-in thành công. Lịch sử và số buổi tập đã được cập nhật.',
      check_in_failed: 'Không thể check-in hội viên.',
    },
  },
} as const;

function toDateInputValue(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function getLocale(language: AppLanguage) {
  return language === 'vi' ? 'vi-VN' : 'en-US';
}

function formatDisplayDate(value: string, language: AppLanguage) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(getLocale(language), { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(value: string, language: AppLanguage) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString(getLocale(language), { hour: '2-digit', minute: '2-digit' });
}

function shiftDate(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateInputValue(date);
}

export function DailyCheckIn() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [members, setMembers] = useState<Member[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [checkingMemberId, setCheckingMemberId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    const result = await getStaffCheckInList(selectedDate);
    if (result.error) {
      setMessage(copy.loadError);
    }
    const rows = result.error ? [] : (result.data || []);
    setMembers(rows.map((row: any) => ({ ...row, status: 'Active' })));
    setCheckIns(rows.filter((row: any) => row.checkedIn).map((row: any) => ({
      id: `${row.memberUuid}-${selectedDate}`,
      memberId: row.memberUuid,
      usageDate: row.checkedInAt,
    })));
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [selectedDate, language]);

  const checkedByMemberId = useMemo(() => {
    return new Map(checkIns.map((record) => [record.memberId, record]));
  }, [checkIns]);

  const filteredMembers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return members.filter((member) => {
      if (!query) return true;
      return (
        member.fullName.toLowerCase().includes(query) ||
        member.memberId.toLowerCase().includes(query) ||
        member.phoneNum.includes(searchTerm)
      );
    });
  }, [members, searchTerm]);

  const stats = useMemo(() => {
    const active = members.filter((member) => member.status === 'Active').length;
    const checked = checkIns.length;
    return {
      total: members.length,
      active,
      checked,
      remaining: Math.max(0, active - checked),
    };
  }, [members, checkIns]);

  const getResultMessage = (result: CheckInResult) => {
    return result.code ? copy.messages[result.code] : result.message;
  };

  const handleCheckIn = async (member: Member) => {
    setCheckingMemberId(member.memberUuid);
    setMessage('');
    const { error } = await recordStaffCheckIn(member.memberUuid, selectedDate, member.workoutSessionId);
    if (error) {
      const messageCode = String((error as any).code || '').toLowerCase() as CheckInMessageCode;
      setMessage(copy.messages[messageCode] || error.message || copy.messages.check_in_failed);
    } else {
      window.dispatchEvent(new CustomEvent('gymster:check-in-updated'));
      setMessage(copy.messages.check_in_success);
    }
    setCheckingMemberId(null);
    await loadData();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.35em] text-primary">{copy.eyebrow}</p>
            <h1 className="mb-3 text-5xl font-black tracking-tight">{copy.title}</h1>
            <p className="max-w-3xl text-muted-foreground">{copy.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
              className="rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary hover:bg-primary/10"
              aria-label={copy.previousDay}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-border bg-input px-4 py-3 font-black outline-none transition focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
              className="rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary hover:bg-primary/10"
              aria-label={copy.nextDay}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(toDateInputValue(new Date()))}
              className="rounded-xl bg-primary/15 px-4 py-3 font-black text-primary transition hover:bg-primary/25"
            >
              {copy.today}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: copy.stats.date, value: formatDisplayDate(selectedDate, language), icon: CalendarCheck },
            { label: copy.stats.checked, value: stats.checked, icon: CheckCircle },
            { label: copy.stats.active, value: stats.active, icon: Users },
            { label: copy.stats.remaining, value: stats.remaining, icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-card/90 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-2xl font-black">{item.value}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-primary">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{message}</p>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">{copy.listTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.listDescription}</p>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="w-full rounded-2xl border border-border bg-input py-3 pl-12 pr-4 font-semibold outline-none transition focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-border px-4 py-3 font-black transition hover:border-primary hover:bg-primary/10"
              >
                <RefreshCw className="h-5 w-5" />
                {copy.refresh}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-border text-left text-xs font-black uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4">{copy.table.memberId}</th>
                  <th className="px-5 py-4">{copy.table.member}</th>
                  <th className="px-5 py-4">{copy.table.phone}</th>
                  <th className="px-5 py-4">{copy.table.package}</th>
                  <th className="px-5 py-4">{copy.table.session}</th>
                  <th className="px-5 py-4">{copy.table.expiration}</th>
                  <th className="px-5 py-4">{copy.table.checkIn}</th>
                  <th className="px-5 py-4 text-right">{copy.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const record = checkedByMemberId.get(member.memberUuid);
                  const isActive = member.status === 'Active';
                  const isToday = selectedDate === toDateInputValue(new Date());
                  return (
                    <tr key={member.memberUuid} className="border-b border-border/70 transition hover:bg-primary/5">
                      <td className="px-5 py-4 font-mono text-sm font-black text-primary">{member.memberId}</td>
                      <td className="px-5 py-4 font-black">{member.fullName}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">{member.phoneNum || '-'}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{member.currentPackage}</td>
                      <td className="px-5 py-4 text-sm font-semibold">
                        <div className="max-w-[180px] truncate text-foreground">{member.sessionTitle || 'Workout session'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{member.sessionTime || selectedDate}</div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-muted-foreground whitespace-nowrap">{member.expirationDate || '-'}</td>
                      <td className="px-5 py-4">
                        {record ? (
                          <span className="gymster-nowrap-pill rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                            {copy.checkedAt} {formatTime(record.usageDate, language)}
                          </span>
                        ) : (
                          <span className="gymster-nowrap-pill rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
                            {copy.notChecked}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCheckIn(member)}
                          disabled={!isToday || !isActive || Boolean(record) || checkingMemberId === member.memberUuid}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-primary/15 px-4 py-2 text-sm font-black text-primary transition hover:bg-primary/25 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {checkingMemberId === member.memberUuid ? copy.recording : record ? copy.checkedButton : isToday && isActive ? copy.checkInButton : copy.invalidPackage}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {loading && <div className="py-12 text-center font-bold text-muted-foreground">{copy.loading}</div>}
          {!loading && filteredMembers.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-black">{copy.emptyTitle}</h3>
              <p className="text-muted-foreground">{copy.emptyDescription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
