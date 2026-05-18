import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { PackageSummaryCard } from '../components/PackageSummaryCard';
import { UpcomingWorkoutCard } from '../components/UpcomingWorkoutCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { NotificationCard } from '../components/NotificationCard';
import { DashboardStatCard } from '../components/DashboardStatCard';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { Calendar, RefreshCw, Users, Star, History } from 'lucide-react';
import { upcomingWorkouts, notifications, stats, workoutHistory } from '../data/mockData';
import { useNavigate } from 'react-router';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);

  const handleViewWorkoutDetail = () => {
    const workoutDetail = workoutHistory[0];
    setSelectedWorkout(workoutDetail);
  };

  return (
    <>
      <MemberHeader title="Trang chủ" />

      <div className="p-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-6">
          <DashboardStatCard
            title="Buổi tập trong tháng"
            value={stats.monthlyWorkouts}
            icon={Calendar}
          />
          <DashboardStatCard
            title="Tổng calories đã đốt"
            value={stats.totalCalories}
            icon={() => <span className="text-2xl">🔥</span>}
          />
          <DashboardStatCard
            title="Số buổi còn lại"
            value={stats.remainingSessions}
            icon={RefreshCw}
          />
          <DashboardStatCard
            title="Số ngày còn hạn"
            value={stats.daysRemaining}
            icon={() => <span className="text-2xl">⏰</span>}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Package Summary */}
          <div className="col-span-2">
            <PackageSummaryCard />
          </div>

          {/* Upcoming Workout */}
          <div>
            <UpcomingWorkoutCard
              workout={upcomingWorkouts[0]}
              onViewDetail={handleViewWorkoutDetail}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-5 gap-4">
            <QuickActionCard
              title="Đặt lịch tập"
              icon={Calendar}
              onClick={() => navigate('/my-schedule')}
            />
            <QuickActionCard
              title="Gia hạn gói"
              icon={RefreshCw}
              onClick={() => navigate('/my-package')}
            />
            <QuickActionCard
              title="Xem HLV"
              icon={Users}
              onClick={() => navigate('/trainers')}
            />
            <QuickActionCard
              title="Đánh giá"
              icon={Star}
              onClick={() => navigate('/rate-service')}
            />
            <QuickActionCard
              title="Lịch sử tập"
              icon={History}
              onClick={() => navigate('/my-schedule')}
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Thông báo</h3>
          <div className="grid grid-cols-2 gap-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                message={notification.message}
                type={notification.type}
                date={notification.date}
              />
            ))}
          </div>
        </div>
      </div>

      <WorkoutDetailModal
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        workout={selectedWorkout}
      />
    </>
  );
};
