import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { WorkoutCalendar } from '../components/WorkoutCalendar';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { BookingWorkoutModal } from '../components/BookingWorkoutModal';
import { calendarEvents, workoutHistory } from '../data/mockData';

export const MySchedule: React.FC = () => {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleEventClick = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  const selectedEvent = calendarEvents.find((e) => e.id === selectedEventId);

  const workoutDetail = selectedEvent
    ? {
        title: selectedEvent.title,
        type: 'Gym cá nhân',
        time: selectedEvent.time,
        date: selectedEvent.date,
        trainer: selectedEvent.trainer || 'Không có',
        room: 'Phòng Gym tầng 2',
        status: selectedEvent.status,
        goal: 'Tăng sức mạnh',
        duration: 60,
        caloriesBurned: 320,
        muscleGroups: 'Toàn thân',
        exercises: workoutHistory[0]?.exercises || [],
        notes: 'Tập trung vào kỹ thuật'
      }
    : null;

  return (
    <>
      <MemberHeader title="Lịch tập của tôi" subtitle="Quản lý lịch tập cá nhân" />

      <div className="p-8">
        <WorkoutCalendar onEventClick={handleEventClick} />
      </div>

      {workoutDetail && (
        <WorkoutDetailModal
          isOpen={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
          workout={workoutDetail}
        />
      )}

      <BookingWorkoutModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </>
  );
};
