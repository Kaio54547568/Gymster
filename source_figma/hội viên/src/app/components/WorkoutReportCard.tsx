import React from 'react';
import { Activity, Flame, Calendar, TrendingUp } from 'lucide-react';

interface WorkoutReportCardProps {
  stats: {
    totalWorkouts: number;
    totalDuration: number;
    totalCalories: number;
    mostFrequentExercise: string;
  };
}

export const WorkoutReportCard: React.FC<WorkoutReportCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-gray-400 text-sm">Tổng số buổi</p>
        </div>
        <p className="text-3xl font-bold text-white">{stats.totalWorkouts}</p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-gray-400 text-sm">Tổng thời gian</p>
        </div>
        <p className="text-3xl font-bold text-white">{stats.totalDuration}m</p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-gray-400 text-sm">Tổng calories</p>
        </div>
        <p className="text-3xl font-bold text-white">{stats.totalCalories}</p>
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-gray-400 text-sm">Bài tập hay tập</p>
        </div>
        <p className="text-lg font-bold text-white">{stats.mostFrequentExercise}</p>
      </div>
    </div>
  );
};
