import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Dumbbell, MapPin, Plus, User, Users } from 'lucide-react';
import { fetchAdminScheduleData } from '../../../services/adminDataApi';

type ShiftAssignment = { shift: string; employee: string; role?: string; room: string };
type DaySchedule = { day: string; date: string; shifts: ShiftAssignment[] };
type TrainerAvailability = { dayOfWeek: number; startTime: string; endTime: string };
type ScheduleTrainer = { id: string; name: string; specialty?: string; status?: string; availability?: TrainerAvailability[] };
type CalendarDay = { label: string; dateLabel: string; dateKey: string; dayOfWeek: number };
type CalendarPerson = { name: string; role: 'PT' | 'Staff'; location: string };

const fixedTrainingSlots = [
  { id: '08:00-10:00', label: '08:00 - 10:00', startTime: '08:00', endTime: '10:00' },
  { id: '14:00-16:00', label: '14:00 - 16:00', startTime: '14:00', endTime: '16:00' },
  { id: '16:00-18:00', label: '16:00 - 18:00', startTime: '16:00', endTime: '18:00' },
  { id: '18:00-20:00', label: '18:00 - 20:00', startTime: '18:00', endTime: '20:00' },
];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateKey(date: Date) {
  return date.toLocaleDateString('en-GB');
}

function normalizeShiftKey(value: string) {
  const [start = '', end = ''] = String(value || '').split('-');
  return `${start.slice(0, 5)}-${end.slice(0, 5)}`;
}

function dedupePeople(people: CalendarPerson[]) {
  const seen = new Set<string>();
  return people.filter((person) => {
    const key = `${person.role}-${person.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function Scheduling() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [trainers, setTrainers] = useState<ScheduleTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchAdminScheduleData().then(({ data, error }) => {
      if (!isMounted) return;
      setSchedule(data?.schedule || []);
      setTrainers(data?.trainers || []);
      setLoadMessage(error ? 'Không tải được dữ liệu lịch làm việc.' : '');
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + selectedWeek * 7);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);
      const dayOfWeek = date.getDay() || 7;

      return {
        label: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dateLabel: formatDateKey(date),
        dateKey: formatDateKey(date),
        dayOfWeek,
      };
    });
  }, [selectedWeek]);

  const scheduleByDate = useMemo(() => {
    return Object.fromEntries(schedule.map((day) => [day.date, day]));
  }, [schedule]);

  const weekRange = `${calendarDays[0]?.dateLabel || '-'} - ${calendarDays[calendarDays.length - 1]?.dateLabel || '-'}`;

  const getPeopleForSlot = (day: CalendarDay, slot: (typeof fixedTrainingSlots)[number]) => {
    const daySchedule = scheduleByDate[day.dateKey];
    const assignedPeople: CalendarPerson[] = (daySchedule?.shifts || [])
      .filter((assignment) => normalizeShiftKey(assignment.shift) === slot.id)
      .map((assignment) => ({
        name: assignment.employee,
        role: String(assignment.role || '').toLowerCase().includes('trainer') ? 'PT' : 'Staff',
        location: assignment.room || 'Unassigned',
      }));

    const availableTrainers: CalendarPerson[] = trainers
      .filter((trainer) => String(trainer.status || 'active').toLowerCase() !== 'inactive')
      .filter((trainer) => {
        const availability = trainer.availability || [];
        if (!availability.length) return true;
        return availability.some(
          (item) => item.dayOfWeek === day.dayOfWeek && item.startTime === slot.startTime && item.endTime === slot.endTime,
        );
      })
      .map((trainer) => ({
        name: trainer.name,
        role: 'PT',
        location: trainer.specialty || 'Personal training',
      }));

    return dedupePeople([...assignedPeople, ...availableTrainers]);
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas mb-2 text-5xl tracking-wider text-white">EMPLOYEE SCHEDULING</h1>
          <p className="text-[#A1A1AA]">Lịch làm việc nhân viên theo 4 mốc tập cố định mỗi ngày.</p>
        </div>
        <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 rounded-xl bg-[#EF233C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#990000]">
          <Plus className="h-5 w-5" />
          Phân ca
        </button>
      </div>

      {loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5 text-sm font-bold text-[#A1A1AA]">Đang tải lịch làm việc...</div>}
      {loadMessage && !loading && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-5 text-sm font-bold text-white">{loadMessage}</div>}

      <div className="flex items-center justify-between rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-6">
        <button onClick={() => setSelectedWeek((week) => week - 1)} className="rounded-lg p-2 text-[#EF233C] transition-colors hover:bg-[#EF233C]/10">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h3 className="mb-1 text-2xl font-bold text-white">Lịch làm việc</h3>
          <p className="text-[#A1A1AA]">{weekRange}</p>
        </div>
        <button onClick={() => setSelectedWeek((week) => week + 1)} className="rounded-lg p-2 text-[#EF233C] transition-colors hover:bg-[#EF233C]/10">
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fixedTrainingSlots.map((slot) => (
          <div key={slot.id} className="flex items-center gap-4 rounded-xl border border-[#EF233C]/20 bg-[#0c1014] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#EF233C] to-[#990000]">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">Mốc tập</h4>
              <p className="text-sm text-[#A1A1AA]">{slot.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#EF233C]/20 bg-[#0c1014]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px]">
            <thead>
              <tr className="bg-[#050607]">
                <th className="min-w-[150px] px-6 py-4 text-left font-bold text-[#EF233C]">Mốc giờ</th>
                {calendarDays.map((day) => (
                  <th key={day.dateKey} className="min-w-[145px] px-4 py-4 text-center">
                    <div className="text-lg font-bold text-white">{day.label}</div>
                    <div className="text-sm text-[#A1A1AA]">{day.dateLabel}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fixedTrainingSlots.map((slot) => (
                <tr key={slot.id} className="border-t border-[#EF233C]/10">
                  <td className="px-6 py-5 align-top">
                    <div className="font-bold text-white">{slot.label}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#A1A1AA]">PT & Staff</div>
                  </td>
                  {calendarDays.map((day) => {
                    const people = getPeopleForSlot(day, slot);

                    return (
                      <td key={`${day.dateKey}-${slot.id}`} className="px-3 py-4 align-top">
                        {people.length ? (
                          <div className="space-y-2">
                            {people.map((person) => (
                              <div key={`${person.role}-${person.name}`} className="rounded-xl border border-[#EF233C]/20 bg-[#050607] p-3">
                                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                                  {person.role === 'PT' ? <Dumbbell className="h-4 w-4 text-[#EF233C]" /> : <User className="h-4 w-4 text-[#EF233C]" />}
                                  <span className="line-clamp-2">{person.name}</span>
                                </div>
                                <div className="mb-2 inline-flex rounded-full bg-[#EF233C]/10 px-2 py-0.5 text-[11px] font-bold text-[#EF233C]">
                                  {person.role}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-1">{person.location}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs font-semibold text-[#A1A1AA]">
                            Chưa có người trực
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && !schedule.length && !trainers.length && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA]">
          Chưa có dữ liệu lịch làm việc.
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowAssignModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-8" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-[#EF233C]" />
              <h2 className="text-2xl font-bold text-white">Phân ca</h2>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-[#EF233C]/20 bg-[#050607] p-4 text-[#A1A1AA]">
              <Users className="mt-1 h-5 w-5 shrink-0 text-[#EF233C]" />
              <p>Calendar đã hiển thị theo 7 ngày trong tuần và 4 mốc tập cố định. Chức năng tạo ca chi tiết sẽ dùng bảng employee_schedules.</p>
            </div>
            <button onClick={() => setShowAssignModal(false)} className="mt-6 w-full rounded-xl bg-[#EF233C] py-3 font-semibold text-white">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
