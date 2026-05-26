import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarEvents } from '../data/mockData';

interface WorkoutCalendarProps {
  onEventClick?: (eventId: number) => void;
  onNewBooking?: () => void;
  events?: Array<{
    id: number;
    date: string;
    time: string;
    title: string;
    trainer: string;
    status: string;
    type?: string;
    room?: string;
    notes?: string;
    goal?: string;
    duration?: number;
    caloriesBurned?: number;
    muscleGroups?: string;
    exercises?: any[];
  }>;
}

export const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  onEventClick,
  onNewBooking,
  events: externalEvents
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date(2026, 4, 12)); // May 12, 2026
  };

  const getEventsForDate = (day: number) => {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const eventsToUse = externalEvents || calendarEvents;
    return eventsToUse.filter(event => event.date === dateString);
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'Sắp tới':
        return 'bg-primary/80 hover:bg-primary';
      case 'Đã hoàn thành':
        return 'bg-gray-600 hover:bg-gray-500';
      case 'Đã hủy':
        return 'bg-gray-700 hover:bg-gray-600 line-through';
      case 'Chờ xác nhận':
        return 'bg-orange-500/80 hover:bg-orange-500';
      default:
        return 'bg-gray-600 hover:bg-gray-500';
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
          >
            Hôm nay
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">
            {monthNames[currentDate.getMonth()]}, {currentDate.getFullYear()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1 rounded text-sm transition-colors ${
                  view === v
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {v === 'month' ? 'Tháng' : v === 'week' ? 'Tuần' : 'Ngày'}
              </button>
            ))}
          </div>
          <button
            onClick={onNewBooking}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Đặt lịch mới
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
        {/* Day headers */}
        {dayNames.map((day) => (
          <div key={day} className="bg-card p-3 text-center">
            <span className="text-xs font-medium text-gray-400">{day}</span>
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card/50 p-3 min-h-[100px]" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = getEventsForDate(day);
          const isToday = day === 12; // Current day is May 12

          return (
            <div
              key={day}
              className={`bg-card p-3 min-h-[100px] ${
                isToday ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-primary' : 'text-white'
                  }`}
                >
                  {day}
                </span>
              </div>
              <div className="space-y-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event.id)}
                    className={`w-full text-left px-2 py-1 rounded text-xs text-white transition-colors ${getEventColor(
                      event.status
                    )}`}
                  >
                    <div className="font-medium">{event.time}</div>
                    <div className="truncate">{event.title}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
