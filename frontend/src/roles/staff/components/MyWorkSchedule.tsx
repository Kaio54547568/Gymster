import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Award } from 'lucide-react';
import { useSupabaseUserProfile } from '../../shared/useSupabaseUserProfile';
import { fetchMyWorkSchedule } from '../../../services/staffScheduleApi';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const SHIFTS = [
  { code: 'shift_1', label: 'Ca 1', hours: '08:00 - 10:00' },
  { code: 'shift_2', label: 'Ca 2', hours: '14:00 - 16:00' },
  { code: 'shift_3', label: 'Ca 3', hours: '16:00 - 18:00' },
  { code: 'shift_4', label: 'Ca 4', hours: '18:00 - 20:00' }
];

export function MyWorkSchedule() {
  const { profile } = useSupabaseUserProfile('staff');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await fetchMyWorkSchedule();
    if (res.error) {
      if (res.error.status === 401) setError('Your session has expired. Please sign in again.');
      else if (res.error.code === 'STAFF_PROFILE_NOT_FOUND') setError('Your staff profile could not be found.');
      else if (res.error.code === 'BACKEND_UNAVAILABLE') setError('Schedule service is unavailable. Start the backend and retry.');
      else setError(res.error.message || 'Could not load your work schedule.');
    } else {
      setSchedules(res.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const isShiftActive = (day: string, shiftCode: string) => {
    return schedules.some(
      (s) => s.dayOfWeek.toLowerCase() === day.toLowerCase() && s.shiftCode.toLowerCase() === shiftCode.toLowerCase() && s.status === 'active'
    );
  };

  const totalShifts = schedules.filter(s => s.status === 'active').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">MY WORK SCHEDULE</h1>
        <p className="text-[#A1A1AA]">Lịch trực tuần cá nhân lặp lại cố định</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-[#EF233C]/10 border border-[#EF233C]/30 rounded-xl text-[#EF233C]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-wider">Weekly Shifts</p>
            <p className="text-2xl font-black text-white mt-1">{totalShifts} shift{totalShifts !== 1 ? 's' : ''} active</p>
          </div>
        </div>

        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-[#EF233C]/10 border border-[#EF233C]/30 rounded-xl text-[#EF233C]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-wider">Recurring Pattern</p>
            <p className="text-2xl font-black text-white mt-1">Weekly recurring</p>
          </div>
        </div>

        <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6 flex items-center gap-4">
          <div className="p-3 bg-[#EF233C]/10 border border-[#EF233C]/30 rounded-xl text-[#EF233C]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-wider">Role</p>
            <p className="text-2xl font-black text-white mt-1 capitalize">{profile.role || 'Staff'}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-8 text-center text-[#A1A1AA] font-bold">
          Loading your work schedule...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-8 text-center text-white font-bold">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadSchedule()}
            className="mt-4 rounded-xl border border-[#EF233C]/40 px-5 py-2 text-sm font-black text-white hover:bg-[#EF233C]/10"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="border border-[#EF233C]/20 rounded-2xl bg-[#0c1014] overflow-hidden p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#EF233C]/20 bg-[#EF233C]/5">
                  <th className="p-4 text-[#A1A1AA] font-bold text-sm">Ca trực</th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th key={d.key} className="p-4 text-white font-bold text-sm text-center capitalize">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map((s) => (
                  <tr key={s.code} className="border-b border-[#EF233C]/10 last:border-0 hover:bg-white/5">
                    <td className="p-4 font-semibold text-white text-sm whitespace-nowrap">
                      <div className="text-[#EF233C] font-bold">{s.label}</div>
                      <div className="text-xs text-[#A1A1AA] mt-1">{s.hours}</div>
                    </td>
                    {DAYS_OF_WEEK.map((d) => {
                      const active = isShiftActive(d.key, s.code);
                      return (
                        <td key={d.key} className="p-4 text-center">
                          <div
                            className={`w-full py-4 px-2 rounded-xl border text-sm font-bold transition-all ${
                              active
                                ? 'bg-[#EF233C]/15 border-[#EF233C]/40 text-white shadow-lg shadow-[#EF233C]/5'
                                : 'bg-black/20 border-white/5 text-white/10'
                            }`}
                          >
                            {active ? 'ON DUTY' : 'OFF'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
