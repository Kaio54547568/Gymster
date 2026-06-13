import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import {
  cancelWorkoutSessionForMember,
  createManualWorkoutSessionForMember,
  getMakeupSessionSummary,
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForMember,
} from '../../../services/workoutSessionApi';
import { getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
import { createTrainingRequest } from '../../../services/trainingRequestApi';
import { getTrainerOpenScheduleSlots } from '../../../services/trainerAvailabilityApi';
import { getAllowedLeaveDaysForPackage } from '../../../services/packageEntitlement';
import Section from '../components/Section';
import { currentPackage } from '../domain/memberConstants';
import { useMemberTrainingRequests } from '../hooks/useMemberTrainingRequests';
import MuscleGroupSelector from '../../pt/components/workout-guidance/MuscleGroupSelector';

type Exercise = {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string | number;
  restTime: number;
  difficulty: string;
  muscleGroup: string;
  instruction: string;
};

type ScheduleSession = {
  id: string;
  memberId: string;
  trainerId: string;
  packageId: string;
  memberPackageId: string;
  title: string;
  trainer: string;
  dateIso: string;
  date: string;
  day: string;
  time: string;
  startHour: number;
  room: string;
  status: 'Scheduled' | 'Completed' | 'Incomplete';
  packageName: string;
  notes: string;
  isPtSession: boolean;
  hasContent: boolean;
  workoutContent: Exercise[];
};

export default function MySchedulePage() {
  const [view, setView] = useState<'Week' | 'Month' | 'List'>('Week');
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [detailSession, setDetailSession] = useState<ScheduleSession | null>(null);
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadMessage, setSessionLoadMessage] = useState('');
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [rescheduleSession, setRescheduleSession] = useState<ScheduleSession | null>(null);
  const [availableDays, setAvailableDays] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
  const [cancelSession, setCancelSession] = useState<ScheduleSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelMessage, setCancelMessage] = useState('');
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [createWorkoutError, setCreateWorkoutError] = useState('');
  const [makeupSummary, setMakeupSummary] = useState(() => getMakeupSessionSummary(getCurrentUser()));
  const [activePackage, setActivePackage] = useState<any>(null);
  const [manualWorkout, setManualWorkout] = useState(() => ({
    sessionDate: new Date().toISOString().slice(0, 10),
    startTime: '07:00',
    endTime: '08:00',
    title: '',
    notes: '',
  }));
  const { requests: memberRequests, isLoadingRequests, requestLoadMessage } = useMemberTrainingRequests();
  const declinedRequests = memberRequests.filter((request) => request.status === 'declined' || request.statusLabel === 'Declined' || request.status === 'Declined' || request.rawStatus === 'declined');
  const toIsoDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const startOfWeek = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth(), calendarAnchor.getDate());
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return {
      key: toIsoDate(date),
      short: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: toIsoDate(date) === toIsoDate(new Date()),
    };
  });
  const weekLabel = `${weekDays[0].date} - ${weekDays[6].date}, ${new Date(`${weekDays[6].key}T00:00:00`).getFullYear()}`;
  const monthDays = (() => {
    const firstOfMonth = new Date(calendarAnchor.getFullYear(), calendarAnchor.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: toIsoDate(date),
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === calendarAnchor.getMonth(),
        isToday: toIsoDate(date) === toIsoDate(new Date()),
      };
    });
  })();
  const calendarLabel = view === 'Month'
    ? calendarAnchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : weekLabel;
  const timeSlots = Array.from({ length: 15 }, (_, index) => `${String(index + 6).padStart(2, '0')}:00`);
  const moveCalendar = (direction: -1 | 1) => {
    setCalendarAnchor((current) => {
      if (view === 'Month') return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      const next = new Date(current);
      next.setDate(current.getDate() + direction * 7);
      return next;
    });
  };
  const mapWorkoutSessionToSchedule = (session: any): ScheduleSession => {
    const date = session.sessionDate || '';
    const startTime = String(session.startTime || '').slice(0, 5);
    const endTime = String(session.endTime || '').slice(0, 5);
    const parsedDate = date ? new Date(`${date}T00:00:00`) : null;
    const day = parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-US', { weekday: 'short' })
      : 'Mon';

    return {
      id: session.sessionId,
      memberId: session.memberId || '',
      trainerId: session.trainerId || '',
      packageId: session.packageId || '',
      memberPackageId: session.memberPackageId || '',
      title: session.sessionTitle || session.exerciseType || 'No workout session',
      trainer: session.isPtSession ? (session.trainerName || 'Trainer') : '',
      dateIso: date,
      date: parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : date || '-',
      day,
      time: endTime ? `${startTime} - ${endTime}` : startTime,
      startHour: Number(startTime.split(':')[0]) || 6,
      room: session.roomName || (session.isPtSession ? 'Training Room' : 'Personal workout'),
      status: getWorkoutSessionStatusLabel(session.status) as ScheduleSession['status'],
      packageName: session.packageName || activePackage?.packageName || currentPackage.title || 'Membership package',
      notes: session.note || 'No workout session',
      isPtSession: Boolean(session.isPtSession || session.trainerId),
      hasContent: Boolean(session.hasContent),
      workoutContent: Array.isArray(session.workoutContent) ? session.workoutContent : [],
    };
  };

  const currentPackageInfo = activePackage || {
    packageName: currentPackage.title || 'No active package',
    remainingSessions: currentPackage.remainingSessions,
    packageDurationMonths: 1,
    maxLeaveDays: getAllowedLeaveDaysForPackage({ packageDurationMonths: 1 }),
  };

  const openRescheduleRequest = async (session: ScheduleSession) => {
    setRescheduleSession(session);
    setSelectedSlot(null);
    setRescheduleReason('');
    setRescheduleMessage('');
    setIsLoadingSlots(true);
    const { data, error } = await getTrainerOpenScheduleSlots(session.trainerId, {
      excludeSessionId: session.id,
      daysAhead: 14,
    });
    setAvailableDays(data || []);
    setIsLoadingSlots(false);
    if (error) setRescheduleMessage('Không tải được lịch trống của PT. Bạn có thể thử lại sau.');
  };

  const submitRescheduleRequest = async () => {
    if (!rescheduleSession || !selectedSlot) {
      setRescheduleMessage('Chọn ngày và giờ muốn đổi sang.');
      return;
    }

    if (!rescheduleReason.trim()) {
      setRescheduleMessage('Nhập lý do muốn đổi lịch để PT xem xét.');
      return;
    }

    const currentUser = getCurrentUser();
    setIsSubmittingReschedule(true);
    const requestedSchedule = `${selectedSlot.date} ${selectedSlot.label}`;
    const { error } = await createTrainingRequest({
      requestType: 'reschedule',
      type: 'reschedule',
      memberId: rescheduleSession.memberId || currentUser?.memberId || currentUser?.member_id || currentUser?.id,
      memberEmail: currentUser?.email,
      trainerId: rescheduleSession.trainerId,
      packageId: rescheduleSession.packageId || activePackage?.packageId,
      memberPackageId: rescheduleSession.memberPackageId || activePackage?.memberPackageId,
      sourceWorkoutSessionId: rescheduleSession.id,
      currentSchedule: `${rescheduleSession.dateIso} ${rescheduleSession.time}`,
      requestedSchedule,
      requestedDate: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      reason: rescheduleReason.trim(),
    });
    setIsSubmittingReschedule(false);

    if (error) {
      setRescheduleMessage(error.message || 'Không gửi được yêu cầu đổi lịch.');
      return;
    }

    setRescheduleMessage('Đã gửi yêu cầu đổi lịch tới PT. Bạn sẽ nhận thông báo khi PT phản hồi.');
    window.dispatchEvent(new CustomEvent('gymster:training-requests-updated'));
  };

  const openCancelBooking = (session: ScheduleSession) => {
    setCancelSession(session);
    setCancelReason('');
    setCancelMessage('');
  };

  const cancelSelectedBooking = async () => {
    if (!cancelSession || !cancelSession.isPtSession) return;
    if (!cancelReason.trim()) {
      setCancelMessage('Nhập lý do hủy booking trước khi gửi cho PT.');
      return;
    }

    const currentUser = getCurrentUser();
    setIsCancellingBooking(true);
    const { error, makeupSummary: nextMakeupSummary } = await cancelWorkoutSessionForMember(cancelSession, currentUser);
    if (!error) {
      await createTrainingRequest({
        requestType: 'cancel_booking',
        type: 'cancel_booking',
        status: 'cancelled',
        memberId: cancelSession.memberId || currentUser?.memberId || currentUser?.member_id || currentUser?.id,
        memberEmail: currentUser?.email,
        memberName: currentUser?.name || currentUser?.fullName || '',
        trainerId: cancelSession.trainerId,
        packageId: cancelSession.packageId || activePackage?.packageId,
        memberPackageId: cancelSession.memberPackageId || activePackage?.memberPackageId,
        sourceWorkoutSessionId: cancelSession.id,
        currentSchedule: `${cancelSession.dateIso} ${cancelSession.time}`,
        requestedSchedule: `Cancel ${cancelSession.dateIso} ${cancelSession.time}`,
        requestedDate: cancelSession.dateIso,
        startTime: cancelSession.time.split(' - ')[0] || '',
        endTime: cancelSession.time.split(' - ')[1] || '',
        reason: cancelReason.trim(),
      });
    }
    setIsCancellingBooking(false);
    if (error) {
      setSessionLoadMessage('Không hủy được booking. Vui lòng thử lại.');
      return;
    }

    setScheduleSessions((current) => current.filter((session) => session.id !== cancelSession.id));
    setMakeupSummary(nextMakeupSummary || getMakeupSessionSummary(getCurrentUser()));
    setCancelSession(null);
    setCancelReason('');
    setSelectedSession(null);
    window.dispatchEvent(new CustomEvent('gymster:training-requests-updated'));
  };

  const createManualWorkout = async () => {
    setCreateWorkoutError('');
    if (manualWorkout.startTime >= manualWorkout.endTime) {
      setCreateWorkoutError('End time must be later than start time.');
      return;
    }

    setIsCreatingWorkout(true);
    const { data, error } = await createManualWorkoutSessionForMember(manualWorkout, getCurrentUser());
    setIsCreatingWorkout(false);
    if (error || !data) {
      setCreateWorkoutError(error?.message || 'The workout could not be created.');
      return;
    }

    setScheduleSessions((current) => [...current, mapWorkoutSessionToSchedule(data)]
      .sort((left, right) => `${left.dateIso}${left.time}`.localeCompare(`${right.dateIso}${right.time}`)));
    setShowAddWorkout(false);
    setManualWorkout({
      sessionDate: new Date().toISOString().slice(0, 10),
      startTime: '07:00',
      endTime: '08:00',
      title: '',
      notes: '',
    });
  };

  useEffect(() => {
    let isMounted = true;
    getCurrentMemberPackageForUser(getCurrentUser()).then(({ data }) => {
      if (isMounted) setActivePackage(data);
    });
    const loadSessions = () => {
      setIsLoadingSessions(true);

      getWorkoutSessionsForMember(getCurrentUser())
        .then(({ data, error }) => {
          if (!isMounted) return;

          if (error) {
            setScheduleSessions([]);
            setSessionLoadMessage('Some workout sessions could not be loaded.');
          } else if (data.length) {
            setScheduleSessions(data.map(mapWorkoutSessionToSchedule));
            setSessionLoadMessage('');
          } else {
            setScheduleSessions([]);
            setSessionLoadMessage('');
          }

          setIsLoadingSessions(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setScheduleSessions([]);
          setSessionLoadMessage('Some workout sessions could not be loaded.');
          setIsLoadingSessions(false);
        });
    };

    loadSessions();
    const loadMakeupSummary = () => setMakeupSummary(getMakeupSessionSummary(getCurrentUser()));
    loadMakeupSummary();
    window.addEventListener('gymster:schedule-updated', loadSessions);
    window.addEventListener('gymster:makeup-updated', loadMakeupSummary);

    return () => {
      isMounted = false;
      window.removeEventListener('gymster:schedule-updated', loadSessions);
      window.removeEventListener('gymster:makeup-updated', loadMakeupSummary);
    };
  }, []);
  const upcomingSessions = scheduleSessions.filter((session) => session.status === 'Scheduled');
  const sessionsInVisibleWeek = scheduleSessions.filter((session) => weekDays.some((day) => day.key === session.dateIso));
  const nextSession = upcomingSessions[0];

  const getStatusClass = (status: ScheduleSession['status']) => {
    if (status === 'Scheduled') return 'bg-[#EF233C]/15 text-[#EF233C] ring-1 ring-[#EF233C]/25';
    if (status === 'Completed') return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25';
    return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/25';
  };

  const getEventPosition = (session: ScheduleSession) => {
    const [startText = '06:00', endText = startText] = session.time.split(' - ');
    const toMinutes = (value: string) => {
      const [hour, minute] = value.split(':').map(Number);
      return (Number.isFinite(hour) ? hour : 6) * 60 + (Number.isFinite(minute) ? minute : 0);
    };
    const dayIndex = Math.max(0, weekDays.findIndex((day) => day.key === session.dateIso));
    const calendarStart = 6 * 60;
    const calendarEnd = 20 * 60;
    const rowHeight = 76;
    const slotMinutes = 60;
    const startMinutes = Math.max(calendarStart, Math.min(calendarEnd, toMinutes(startText)));
    const endMinutes = Math.max(startMinutes + 30, Math.min(calendarEnd, toMinutes(endText)));

    return {
      top: `${((startMinutes - calendarStart) / slotMinutes) * rowHeight}px`,
      left: `calc(72px + ${(dayIndex * 100) / 7}% - ${(dayIndex * 72) / 7}px + 4px)`,
      width: `calc(${100 / 7}% - ${72 / 7 + 8}px)`,
      height: `${Math.max(48, ((endMinutes - startMinutes) / slotMinutes) * rowHeight)}px`,
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white">My Schedule</h1>
          <p className="mt-1 text-sm text-white/50">View your workouts, trainer sessions, and booking status.</p>
        </div>
        <button type="button" onClick={() => { setCreateWorkoutError(''); setShowAddWorkout(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930]">
          <Plus className="h-4 w-4" />
          Add workout
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Current Package</div>
          <div className="mt-2 text-xl font-black text-white">{currentPackageInfo.packageName}</div>
          <div className="mt-1 text-xs font-semibold text-white/45">
            Max leave: {currentPackageInfo.maxLeaveDays || getAllowedLeaveDaysForPackage(currentPackageInfo)} days
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Remaining Sessions</div>
          <div className="mt-2 text-xl font-black text-[#EF233C]">{currentPackageInfo.remainingSessions ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Next Session</div>
          <div className="mt-2 text-xl font-black text-white">{nextSession ? nextSession.title : 'No upcoming session'}</div>
          {nextSession && <div className="mt-1 text-sm text-white/50">{nextSession.date} - {nextSession.time}</div>}
        </div>
        <div className="rounded-2xl border border-[#EF233C]/25 bg-[#211316] p-5 text-white">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF7A8D]">Buổi bù</div>
          <div className="mt-2 text-xl font-black text-white">{makeupSummary.credits}/{makeupSummary.resetBalance}</div>
          <div className="mt-1 text-xs font-semibold text-[#FF9AAB]">
            Tháng này: {makeupSummary.grantedThisMonth}/{makeupSummary.monthlyLimit}
          </div>
        </div>
      </div>

      <Section title="Workout Calendar">
        {isLoadingSessions && <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading workout schedule...</div>}
        {sessionLoadMessage && !isLoadingSessions && <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{sessionLoadMessage}</div>}
        {!isLoadingSessions && !sessionLoadMessage && scheduleSessions.length === 0 && (
          <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-6 text-center text-sm font-bold text-white/45">No workout sessions found.</div>
        )}
        {isLoadingRequests && <div className="mb-5 rounded-2xl border border-white/8 bg-[#222] p-4 text-sm font-bold text-white/45">Loading trainer request status...</div>}
        {requestLoadMessage && !isLoadingRequests && <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{requestLoadMessage}</div>}
        {declinedRequests.some((request) => request.type === 'reschedule') && (
          <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <div className="text-sm font-black text-amber-300">Reschedule request declined</div>
            {declinedRequests.filter((request) => request.type === 'reschedule').slice(0, 1).map((request) => (
              <div key={request.id} className="mt-2 text-sm text-white/65">
                {request.trainerName} declined your request for {request.preferredSchedule}.
                {request.declineReason && <span className="block mt-1 text-white/45">Reason: {request.declineReason}</span>}
                <span className="mt-2 block font-bold text-[#EF233C]">Please choose another PT or another schedule.</span>
              </div>
            ))}
          </div>
        )}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white hover:border-[#EF233C]/40" type="button" onClick={() => setCalendarAnchor(new Date())}>Today</button>
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button" onClick={() => moveCalendar(-1)}>Previous</button>
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button" onClick={() => moveCalendar(1)}>Next</button>
            <div className="ml-2 text-xl font-black text-white">{calendarLabel}</div>
          </div>
          <div className="flex rounded-full border border-white/10 bg-[#222] p-1">
            {(['Week', 'Month', 'List'] as const).map((item) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${view === item ? 'bg-[#EF233C] text-white' : 'text-white/55 hover:text-white'}`}
                type="button"
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {view === 'Week' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px] rounded-2xl border border-white/8 bg-[#111]">
              <div className="grid grid-cols-[72px_repeat(7,minmax(110px,1fr))] border-b border-white/8">
                <div className="p-3 text-xs font-bold text-white/35">GMT+7</div>
                {weekDays.map((day) => (
                  <div key={day.key} className={`border-l border-white/8 p-3 text-center ${day.isToday ? 'bg-[#EF233C]/10' : ''}`}>
                    <div className={`text-xs font-black uppercase tracking-[0.16em] ${day.isToday ? 'text-[#FF9AAB]' : 'text-white/45'}`}>{day.short}</div>
                    <div className={`mx-auto mt-1 inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-lg font-black ${day.isToday ? 'bg-[#EF233C] text-white shadow-[0_0_18px_rgba(239,35,60,0.35)]' : 'text-white'}`}>{day.date}</div>
                  </div>
                ))}
              </div>
              <div className="relative grid grid-cols-[72px_repeat(7,minmax(110px,1fr))]">
                {timeSlots.map((slot) => (
                  <div key={slot} className="contents">
                    <div className="min-h-[76px] border-b border-white/8 p-3 text-xs font-bold text-white/45">{slot}</div>
                    {weekDays.map((day) => (
                      <div key={`${day.short}-${slot}`} className="min-h-[76px] border-b border-l border-white/8" />
                    ))}
                  </div>
                ))}
                {sessionsInVisibleWeek.map((session) => (
                  <button
                    key={session.id}
                    className={`absolute z-10 rounded-xl border px-3 py-2 text-left shadow-lg transition hover:scale-[1.01] ${
                      session.status === 'Completed'
                        ? 'border-emerald-400/25 bg-emerald-500/15'
                        : session.status === 'Incomplete'
                          ? 'border-red-400/25 bg-red-500/15'
                          : 'border-[#EF233C]/45 bg-[#2A171B] text-white shadow-[#EF233C]/10'
                    }`}
                    style={getEventPosition(session)}
                    type="button"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="truncate text-sm font-black text-white">{session.title}</div>
                    <div className="mt-1 text-xs text-white/70">{session.time}</div>
                    <div className="mt-1 truncate text-xs text-white/45">{session.room}</div>
                    {session.isPtSession && <span className="absolute bottom-2 right-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-300 ring-1 ring-amber-300/30">PT</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : view === 'Month' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[980px] overflow-hidden rounded-2xl border border-white/8 bg-[#111]">
              <div className="grid grid-cols-7 border-b border-white/8 bg-[#101010]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                  <div key={label} className="border-l border-white/8 px-3 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white/55 first:border-l-0">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const events = scheduleSessions.filter((session) => session.dateIso === day.key);
                  return (
                    <div key={day.key} className="min-h-[136px] border-b border-l border-white/8 p-2 first:border-l-0">
                      <div className="mb-2 flex justify-center">
                        <span className={`flex size-7 items-center justify-center rounded-full text-xs font-black ${day.isToday ? 'bg-[#EF233C] text-white shadow-[0_0_18px_rgba(239,35,60,0.35)]' : day.inCurrentMonth ? 'text-white' : 'text-white/28'}`}>
                          {day.dayNumber}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {events.slice(0, 3).map((session) => (
                          <button
                            key={session.id}
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className={`w-full truncate rounded-md px-2 py-1 text-left text-[11px] font-black text-white transition hover:brightness-110 ${
                              session.status === 'Completed'
                                ? 'bg-emerald-500/70'
                                : session.status === 'Incomplete'
                                  ? 'bg-red-500/70'
                                  : 'bg-[#EF233C] shadow-[0_6px_16px_rgba(239,35,60,0.18)]'
                            }`}
                            title={`${session.title} - ${session.time}`}
                          >
                            {session.title}
                          </button>
                        ))}
                        {events.length > 3 && <div className="px-2 text-[11px] font-bold text-white/45">+{events.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {scheduleSessions.map((session) => (
              <button
                key={session.id}
                className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-[#222] p-4 pr-16 text-left hover:border-[#EF233C]/40"
                type="button"
                onClick={() => setSelectedSession(session)}
              >
                <div>
                  <div className="font-black text-white">{session.title}</div>
                  <div className="mt-1 text-sm text-white/50">{session.date} - {session.time} - {session.room}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(session.status)}`}>{session.status}</span>
                {session.isPtSession && <span className="absolute bottom-3 right-3 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-black text-amber-300 ring-1 ring-amber-300/30">PT</span>}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="Upcoming Sessions">
        {upcomingSessions.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {upcomingSessions.map((session) => (
              <button
                key={session.id}
                className="relative rounded-2xl border border-white/8 bg-[#222] p-5 text-left transition hover:border-[#EF233C]/40"
                type="button"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-black text-white">{session.title}</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(session.status)}`}>{session.status}</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-white/55">
                  <div>{session.date} - {session.time}</div>
                  {session.isPtSession && <div>Trainer: <span className="font-bold text-white">{session.trainer}</span></div>}
                  <div>Room: <span className="font-bold text-white">{session.room}</span></div>
                  <div>Package: <span className="font-bold text-[#EF233C]">{session.packageName}</span></div>
                </div>
                {session.isPtSession && <span className="absolute bottom-4 right-4 rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-black text-amber-300 ring-1 ring-amber-300/30">PT</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#222] p-8 text-center">
            <div className="text-xl font-black text-white">No upcoming sessions</div>
            <p className="mt-2 text-sm text-white/50">Your workout schedule is empty. Book a new session when you are ready.</p>
          </div>
        )}
      </Section>

      {selectedSession && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/65 backdrop-blur-sm" onClick={() => setSelectedSession(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#181818] p-6 shadow-[0_0_80px_rgba(0,0,0,0.7)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">{selectedSession.title}</h2>
                <p className="mt-1 text-sm text-white/50">{selectedSession.date} - {selectedSession.time}</p>
              </div>
              <button className="rounded-xl border border-white/10 px-3 py-2 text-white/70 hover:text-white" type="button" onClick={() => setSelectedSession(null)}>
                Close
              </button>
            </div>
            <div className="space-y-4 text-sm">
              {selectedSession.isPtSession && (
                <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                  <div className="text-white/40">Trainer</div>
                  <div className="mt-1 font-bold text-white">{selectedSession.trainer}</div>
                </div>
              )}
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Room / Location</div>
                <div className="mt-1 font-bold text-white">{selectedSession.room}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Package</div>
                <div className="mt-1 font-bold text-white">{selectedSession.packageName}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Status</div>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${getStatusClass(selectedSession.status)}`}>{selectedSession.status}</span>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
                <div className="text-white/40">Workout content</div>
                <p className="mt-1 leading-6 text-white/75">{selectedSession.notes}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button className="rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white" type="button" onClick={() => setDetailSession(selectedSession)}>View Details</button>
              {selectedSession.isPtSession && (
                <button
                  className="rounded-xl border border-[#EF233C]/30 px-4 py-3 text-sm font-bold text-[#EF233C]"
                  type="button"
                  onClick={() => openRescheduleRequest(selectedSession)}
                >
                  Request Đổi lịch
                </button>
              )}
              {selectedSession.isPtSession && (
                <button
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60 hover:border-red-400/30 hover:text-red-300 disabled:opacity-60"
                  type="button"
                  disabled={isCancellingBooking}
                  onClick={() => openCancelBooking(selectedSession)}
                >
                  {isCancellingBooking ? 'Cancelling...' : 'Hủy Booking'}
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {detailSession && (
        <ModalOverlay onClose={() => setDetailSession(null)}>
          <div className="max-h-[calc(100vh-48px)] w-[min(1040px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-white/10 bg-[#181818] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#EF233C]">Session Detail</p>
                <h3 className="mt-1 text-3xl font-black text-white">{detailSession.title}</h3>
                <p className="mt-1 text-sm text-white/45">{detailSession.trainer || 'Trainer'} - {detailSession.date} - {detailSession.time}</p>
              </div>
              <button type="button" onClick={() => setDetailSession(null)} className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between rounded-xl bg-[#222] p-3"><span className="text-white/40">Room/location</span><span className="font-bold text-white">{detailSession.room}</span></div>
              <div className="flex justify-between rounded-xl bg-[#222] p-3"><span className="text-white/40">Package</span><span className="font-bold text-white">{detailSession.packageName}</span></div>
              <div className="flex justify-between rounded-xl bg-[#222] p-3"><span className="text-white/40">Status</span><span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(detailSession.status)}`}>{detailSession.status}</span></div>
            </div>

            <div className="mt-5 space-y-4 rounded-xl border border-white/8 bg-[#111] p-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Workout name</span>
                <input value={detailSession.title} readOnly className="w-full rounded-lg border border-white/10 bg-[#222] px-3 py-3 text-sm font-semibold text-white outline-none" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-white/45">General notes</span>
                <textarea value={detailSession.notes} readOnly rows={4} className="w-full resize-none rounded-lg border border-white/10 bg-[#222] px-3 py-3 text-sm font-semibold leading-6 text-white outline-none" />
              </label>

              <div className="space-y-3">
                {detailSession.workoutContent.map((exercise, index) => (
                  <div key={exercise.exerciseId || `${detailSession.id}-${index}`} className="rounded-xl border border-white/5 bg-[#181818] p-4">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#EF233C]/25 bg-[#EF233C]/15 text-xs font-black text-[#EF233C]">{index + 1}</div>
                      <label className="min-w-0 flex-1">
                        <span className="mb-1 block text-xs font-black uppercase tracking-wide text-white/55">Exercise name</span>
                        <input value={exercise.exerciseName || ''} readOnly className="w-full rounded-lg border border-white/10 bg-[#222] px-3 py-3 text-sm font-semibold text-white outline-none" />
                      </label>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-3">
                      <label className="block"><span className="mb-1 block text-xs text-white/35">Sets</span><input value={exercise.sets || 0} readOnly className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-sm text-white outline-none" /></label>
                      <label className="block"><span className="mb-1 block text-xs text-white/35">Reps</span><input value={exercise.reps || ''} readOnly className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-sm text-white outline-none" /></label>
                      <label className="block"><span className="mb-1 block text-xs text-white/35">Rest (s)</span><input value={exercise.restTime || 0} readOnly className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-sm text-white outline-none" /></label>
                    </div>
                    <div className="mb-3 grid gap-3 xl:grid-cols-[1fr_0.7fr]">
                      <div>
                        <div className="mb-1 text-xs text-white/35">Muscle group</div>
                        <div className="flex min-h-[42px] items-center rounded-lg border border-white/8 bg-[#222] px-3 py-2 text-xs text-white">{exercise.muscleGroup || 'Chon mot hoac nhieu nhom co'}</div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs text-white/35">Difficulty</div>
                        <div className="flex min-h-[42px] items-center rounded-lg border border-white/8 bg-[#222] px-3 py-2 text-xs text-white">{exercise.difficulty || 'Medium'}</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <MuscleGroupSelector value={exercise.muscleGroup || ''} onChange={() => undefined} readOnly />
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-xs text-white/35">Technique instruction</span>
                      <input value={exercise.instruction || ''} readOnly className="w-full rounded-lg border border-white/8 bg-[#222] px-2.5 py-1.5 text-xs text-white outline-none" />
                    </label>
                  </div>
                ))}
                {!detailSession.workoutContent.length && (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#181818] p-8 text-center text-sm font-bold text-white/45">
                    No exercises added yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {cancelSession && (
        <ModalOverlay onClose={() => !isCancellingBooking && setCancelSession(null)}>
          <div className="w-[min(560px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.8)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Hủy booking</h2>
                <p className="mt-1 text-sm text-white/50">Nhập lý do hủy để PT nắm được tình trạng buổi tập.</p>
                <p className="mt-2 text-xs font-bold text-[#FF9AAB]">{cancelSession.dateIso} {cancelSession.time}</p>
              </div>
              <button type="button" disabled={isCancellingBooking} onClick={() => setCancelSession(null)} className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Lý do hủy</span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={5}
                placeholder="Ví dụ: Mình có việc đột xuất nên không thể tham gia buổi này."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-[#EF233C]/60"
              />
            </label>

            {cancelMessage && <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm font-bold text-amber-300">{cancelMessage}</div>}
            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/8 pt-4">
              <button type="button" disabled={isCancellingBooking} onClick={() => setCancelSession(null)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/65 hover:text-white disabled:opacity-50">Close</button>
              <button type="button" disabled={isCancellingBooking} onClick={cancelSelectedBooking} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930] disabled:opacity-60">
                {isCancellingBooking ? 'Sending...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {rescheduleSession && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-[160] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm sm:top-24" onClick={() => setRescheduleSession(null)}>
          <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.8)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Request đổi lịch</h2>
                <p className="mt-1 text-sm text-white/50">Chọn ngày và giờ PT còn trống để gửi yêu cầu xác nhận.</p>
                <p className="mt-2 text-xs font-bold text-[#FF9AAB]">Lịch hiện tại: {rescheduleSession.dateIso} {rescheduleSession.time}</p>
              </div>
              <button type="button" onClick={() => setRescheduleSession(null)} className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {isLoadingSlots ? (
              <div className="mt-6 rounded-2xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/50">Loading PT available slots...</div>
            ) : (
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availableDays.map((day) => (
                  <div key={day.date} className="rounded-2xl border border-white/8 bg-[#111] p-4">
                    <div className="text-sm font-black text-white">{day.label}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {day.slots.map((slot: any) => {
                        const slotId = `${day.date}-${slot.startTime}`;
                        const active = selectedSlot?.id === slotId;
                        return (
                          <button
                            key={slotId}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot({ ...slot, id: slotId, date: day.date })}
                            className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                              active
                                ? 'border-[#EF233C] bg-[#EF233C] text-white'
                                : slot.available
                                  ? 'border-white/10 bg-[#222] text-white hover:border-[#EF233C]/50'
                                  : 'cursor-not-allowed border-white/5 bg-[#1a1a1a] text-white/25'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Lý do đổi lịch</span>
              <textarea
                value={rescheduleReason}
                onChange={(event) => setRescheduleReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: Mình bận công việc đột xuất, muốn đổi sang buổi khác."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#222] px-4 py-3 text-sm font-semibold leading-6 text-white outline-none transition focus:border-[#EF233C]/60"
              />
            </label>

            {rescheduleMessage && <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm font-bold text-amber-300">{rescheduleMessage}</div>}
            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/8 pt-4">
              <button type="button" onClick={() => setRescheduleSession(null)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/65 hover:text-white">Close</button>
              <button type="button" disabled={isSubmittingReschedule || !selectedSlot} onClick={submitRescheduleRequest} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930] disabled:opacity-60">
                {isSubmittingReschedule ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddWorkout && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-[150] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm sm:top-24" onClick={() => setShowAddWorkout(false)}>
          <div className="max-h-[calc(100vh-8rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-[#181818] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.8)] sm:max-h-[calc(100vh-9rem)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Add workout</h2>
                <p className="mt-1 text-sm text-white/50">Create a personal workout outside your fixed PT schedule.</p>
              </div>
              <button type="button" onClick={() => setShowAddWorkout(false)} className="rounded-xl p-2 text-white/50 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Date</span>
                <input type="date" value={manualWorkout.sessionDate} onChange={(event) => setManualWorkout((current) => ({ ...current, sessionDate: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Start time</span>
                  <input type="time" value={manualWorkout.startTime} onChange={(event) => setManualWorkout((current) => ({ ...current, startTime: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">End time</span>
                  <input type="time" value={manualWorkout.endTime} onChange={(event) => setManualWorkout((current) => ({ ...current, endTime: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Workout name</span>
                <input value={manualWorkout.title} onChange={(event) => setManualWorkout((current) => ({ ...current, title: event.target.value }))} placeholder="Example: Evening cardio" className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#EF233C]/60" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Workout details</span>
                <textarea rows={5} value={manualWorkout.notes} onChange={(event) => setManualWorkout((current) => ({ ...current, notes: event.target.value }))} className="w-full resize-none rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-sm text-white outline-none focus:border-[#EF233C]/60" />
              </label>
            </div>

            {createWorkoutError && <div className="mt-5 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm font-bold text-red-300">{createWorkoutError}</div>}
            <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end gap-3 border-t border-white/8 bg-[#181818]/95 px-6 pb-1 pt-4 backdrop-blur">
              <button type="button" onClick={() => setShowAddWorkout(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white/65 hover:text-white">Close</button>
              <button type="button" disabled={isCreatingWorkout} onClick={createManualWorkout} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#c91930] disabled:opacity-60">
                {isCreatingWorkout ? 'Creating...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex min-h-full items-start justify-center py-4 sm:py-6">
        <div onClick={(event) => event.stopPropagation()}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
