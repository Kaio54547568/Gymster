import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getCurrentUser } from '../../../services/authService';
import {
  createManualWorkoutSessionForMember,
  getWorkoutSessionStatusLabel,
  getWorkoutSessionsForMember,
} from '../../../services/workoutSessionApi';
import Section from '../components/Section';
import { currentPackage } from '../domain/memberConstants';
import { useMemberTrainingRequests } from '../hooks/useMemberTrainingRequests';

export default function MySchedulePage() {
  type ScheduleSession = {
    id: string;
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
  };

  const [view, setView] = useState<'Week' | 'Month' | 'List'>('Week');
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionLoadMessage, setSessionLoadMessage] = useState('');
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false);
  const [createWorkoutError, setCreateWorkoutError] = useState('');
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
    };
  });
  const weekLabel = `${weekDays[0].date} - ${weekDays[6].date}, ${new Date(`${weekDays[6].key}T00:00:00`).getFullYear()}`;
  const timeSlots = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
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
      packageName: session.packageName || currentPackage.title,
      notes: session.note || 'No workout session',
      isPtSession: Boolean(session.isPtSession || session.trainerId),
    };
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

    return () => {
      isMounted = false;
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
    const startSlot = Math.max(0, Math.min(timeSlots.length - 1, Math.floor((session.startHour - 6) / 2)));
    return {
      gridColumn: weekDays.findIndex((day) => day.key === session.dateIso) + 2,
      gridRow: startSlot + 2,
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Current Package</div>
          <div className="mt-2 text-xl font-black text-white">{currentPackage.title}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Remaining Sessions</div>
          <div className="mt-2 text-xl font-black text-[#EF233C]">{currentPackage.remainingSessions}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-[#181818] p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Next Session</div>
          <div className="mt-2 text-xl font-black text-white">{nextSession ? nextSession.title : 'No upcoming session'}</div>
          {nextSession && <div className="mt-1 text-sm text-white/50">{nextSession.date} - {nextSession.time}</div>}
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
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button" onClick={() => setCalendarAnchor(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 7))}>Previous</button>
            <button className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold text-white/70 hover:text-white" type="button" onClick={() => setCalendarAnchor(current => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 7))}>Next</button>
            <div className="ml-2 text-xl font-black text-white">{weekLabel}</div>
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
                  <div key={day.short} className="border-l border-white/8 p-3 text-center">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-white/45">{day.short}</div>
                    <div className="mt-1 text-lg font-black text-white">{day.date}</div>
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
                    className={`relative z-10 m-1 rounded-xl border px-3 py-2 text-left shadow-lg transition hover:scale-[1.01] ${
                      session.status === 'Completed'
                        ? 'border-emerald-400/25 bg-emerald-500/15'
                        : session.status === 'Incomplete'
                          ? 'border-red-400/25 bg-red-500/15'
                          : 'border-[#EF233C]/35 bg-[#EF233C]/20'
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
              <button className="rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white" type="button">View Details</button>
              {selectedSession.isPtSession && <button className="rounded-xl border border-[#EF233C]/30 px-4 py-3 text-sm font-bold text-[#EF233C]" type="button">Request Reschedule</button>}
              {selectedSession.isPtSession && <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60" type="button">Cancel Booking</button>}
            </div>
          </aside>
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
