import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { WorkoutHistoryTable } from '../components/WorkoutHistoryTable';
import { WorkoutReportCard } from '../components/WorkoutReportCard';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { workoutHistory } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const WorkoutHistory: React.FC = () => {
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const selectedWorkout = workoutHistory.find((w) => w.historyId === selectedHistoryId);

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

  return (
    <>
      <MemberHeader
        title="Lịch sử tập luyện"
        subtitle="Theo dõi tiến độ và kết quả tập luyện"
      />

      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <WorkoutReportCard stats={stats} />

        {/* Chart */}
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

        {/* History Table */}
        <WorkoutHistoryTable onViewDetail={setSelectedHistoryId} />
      </div>

      {selectedWorkout && (
        <WorkoutDetailModal
          isOpen={!!selectedHistoryId}
          onClose={() => setSelectedHistoryId(null)}
          workout={selectedWorkout}
        />
      )}
    </>
  );
};
