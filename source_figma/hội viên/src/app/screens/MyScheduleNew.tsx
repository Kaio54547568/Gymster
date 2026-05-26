import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { WorkoutCalendar } from '../components/WorkoutCalendar';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { BookingWorkoutModal } from '../components/BookingWorkoutModal';
import { RescheduleWorkoutModal } from '../components/RescheduleWorkoutModal';
import { CancelWorkoutModal } from '../components/CancelWorkoutModal';
import { WorkoutReviewModal } from '../components/WorkoutReviewModal';
import { WorkoutHistoryTable } from '../components/WorkoutHistoryTable';
import { WorkoutReportCard } from '../components/WorkoutReportCard';
import { calendarEvents as initialCalendarEvents, workoutHistory } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type Tab = 'calendar' | 'history';

export const MyScheduleNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [events, setEvents] = useState(initialCalendarEvents);

  const handleEventClick = (eventId: number) => {
    setSelectedEventId(eventId);
  };

  const handleNewBooking = () => {
    setIsBookingModalOpen(true);
  };

  const getWorkoutTypeName = (type: string) => {
    switch (type) {
      case 'gym':
        return 'Gym';
      case 'yoga':
        return 'Yoga';
      case 'cardio':
        return 'Cardio';
      case 'pt':
        return 'PT cá nhân';
      default:
        return type;
    }
  };

  const handleBookingSubmit = (bookingData: any) => {
    // Create new event
    const workoutTypeName = getWorkoutTypeName(bookingData.workoutType);
    const newEvent = {
      id: Date.now(), // Generate unique ID
      date: bookingData.date,
      time: bookingData.time,
      title: bookingData.trainerName
        ? `${workoutTypeName} với ${bookingData.trainerName.split(' ').pop()}`
        : workoutTypeName,
      trainer: bookingData.trainerName || '',
      status: 'Sắp tới',
      // Extended details for modal
      type: workoutTypeName,
      room: bookingData.room,
      notes: bookingData.notes,
      goal: 'Tập luyện theo kế hoạch',
      duration: 60,
      caloriesBurned: 300,
      muscleGroups: 'Toàn thân',
      exercises: [
        { name: 'Khởi động', sets: 1, reps: '10 phút' },
        { name: 'Bài tập chính', sets: 3, reps: '12 lần' },
        { name: 'Giãn cơ', sets: 1, reps: '5 phút' }
      ]
    };

    // Add new event to events list
    setEvents([...events, newEvent]);

    // Show success notification
    toast.success('Đặt lịch thành công!', {
      description: `Buổi ${workoutTypeName} vào ${bookingData.time} ngày ${new Date(
        bookingData.date
      ).toLocaleDateString('vi-VN')}`
    });
  };

  const handleOpenReschedule = () => {
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (rescheduleData: any) => {
    const updatedEvents = events.map((event) => {
      if (event.id === rescheduleData.workoutId) {
        return {
          ...event,
          date: rescheduleData.newDate,
          time: rescheduleData.newTime,
          trainer: rescheduleData.newTrainer,
          room: rescheduleData.newRoom,
          notes: rescheduleData.newNotes
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    setIsRescheduleModalOpen(false);
    toast.success('Đổi lịch thành công!');
  };

  const handleOpenCancel = () => {
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = (reason: string) => {
    if (!selectedEventId) return;

    const updatedEvents = events.map((event) => {
      if (event.id === selectedEventId) {
        return {
          ...event,
          status: 'Đã hủy'
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    setIsCancelModalOpen(false);
    toast.success('Hủy lịch thành công!');
  };

  const handleOpenReview = () => {
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (reviewData: any) => {
    const updatedEvents = events.map((event) => {
      if (event.id === reviewData.workoutId) {
        return {
          ...event,
          hasReview: true
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    setIsReviewModalOpen(false);
    toast.success('Cảm ơn bạn đã đánh giá buổi tập!');
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedWorkout = workoutHistory.find((w) => w.historyId === selectedHistoryId);

  const workoutDetail = selectedEvent
    ? {
        id: selectedEvent.id,
        title: selectedEvent.title,
        type: selectedEvent.type || 'Gym cá nhân',
        time: selectedEvent.time,
        date: selectedEvent.date,
        trainer: selectedEvent.trainer || 'Không có',
        room: selectedEvent.room || 'Phòng Gym tầng 2',
        status: selectedEvent.status,
        goal: selectedEvent.goal || 'Tăng sức mạnh',
        duration: selectedEvent.duration || 60,
        caloriesBurned: selectedEvent.caloriesBurned || 320,
        muscleGroups: selectedEvent.muscleGroups || 'Toàn thân',
        exercises: selectedEvent.exercises || workoutHistory[0]?.exercises || [],
        notes: selectedEvent.notes || 'Tập trung vào kỹ thuật',
        hasReview: selectedEvent.hasReview || false
      }
    : selectedWorkout || null;

  const stats = {
    totalWorkouts: workoutHistory.length,
    totalDuration: workoutHistory.reduce((sum, w) => sum + w.duration, 0),
    totalCalories: workoutHistory.reduce((sum, w) => sum + w.caloriesBurned, 0),
    mostFrequentExercise: 'Gym'
  };

  const chartData = [
    { id: 'mon', name: 'T2', calories: 320 },
    { id: 'tue', name: 'T3', calories: 0 },
    { id: 'wed', name: 'T4', calories: 410 },
    { id: 'thu', name: 'T5', calories: 0 },
    { id: 'fri', name: 'T6', calories: 180 },
    { id: 'sat', name: 'T7', calories: 450 },
    { id: 'sun', name: 'CN', calories: 0 }
  ];

  const tabs = [
    { id: 'calendar' as Tab, label: 'Lịch tập' },
    { id: 'history' as Tab, label: 'Lịch sử tập luyện' }
  ];

  return (
    <>
      <MemberHeader title="Lịch tập của tôi" subtitle="Quản lý lịch tập và theo dõi tiến độ" />

      <div className="p-8">
        {/* Tabs */}
        <div className="bg-card border border-white/10 rounded-xl mb-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'calendar' && (
          <WorkoutCalendar
            onEventClick={handleEventClick}
            onNewBooking={handleNewBooking}
            events={events}
          />
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <WorkoutReportCard stats={stats} />

            <div className="bg-card border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Calories đốt theo tuần</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" key="grid" />
                  <XAxis dataKey="name" stroke="#9ca3af" key="xaxis" />
                  <YAxis stroke="#9ca3af" key="yaxis" />
                  <Tooltip
                    key="tooltip"
                    contentStyle={{
                      backgroundColor: '#17181D',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="calories" fill="#E50914" radius={[8, 8, 0, 0]} key="bar" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <WorkoutHistoryTable onViewDetail={setSelectedHistoryId} />
          </div>
        )}
      </div>

      {/* Modals */}
      {workoutDetail && (
        <WorkoutDetailModal
          isOpen={!!(selectedEventId || selectedHistoryId)}
          onClose={() => {
            setSelectedEventId(null);
            setSelectedHistoryId(null);
          }}
          workout={workoutDetail}
          onReschedule={handleOpenReschedule}
          onCancel={handleOpenCancel}
          onReview={handleOpenReview}
        />
      )}

      <BookingWorkoutModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
      />

      {selectedEvent && (
        <>
          <RescheduleWorkoutModal
            isOpen={isRescheduleModalOpen}
            onClose={() => setIsRescheduleModalOpen(false)}
            onSubmit={handleRescheduleSubmit}
            workout={{
              id: selectedEvent.id,
              title: selectedEvent.title,
              type: selectedEvent.type || 'Gym cá nhân',
              date: selectedEvent.date,
              time: selectedEvent.time,
              trainer: selectedEvent.trainer || '',
              room: selectedEvent.room || 'Phòng Gym tầng 2',
              notes: selectedEvent.notes || ''
            }}
          />

          <CancelWorkoutModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={handleCancelConfirm}
            workout={{
              title: selectedEvent.title,
              date: selectedEvent.date,
              time: selectedEvent.time,
              trainer: selectedEvent.trainer || '',
              room: selectedEvent.room || 'Phòng Gym tầng 2'
            }}
          />

          <WorkoutReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={handleReviewSubmit}
            workout={{
              id: selectedEvent.id,
              title: selectedEvent.title,
              date: selectedEvent.date,
              trainer: selectedEvent.trainer || '',
              room: selectedEvent.room || 'Phòng Gym tầng 2'
            }}
          />
        </>
      )}
    </>
  );
};
