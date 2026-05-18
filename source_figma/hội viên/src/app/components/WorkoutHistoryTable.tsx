import React, { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import { workoutHistory } from '../data/mockData';

interface WorkoutHistoryTableProps {
  onViewDetail?: (historyId: number) => void;
}

export const WorkoutHistoryTable: React.FC<WorkoutHistoryTableProps> = ({ onViewDetail }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  const filteredHistory = workoutHistory.filter((workout) => {
    const matchesSearch = workout.exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài tập, ví dụ: Bench Press, Cardio, Yoga..."
            className="w-full bg-input-background border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter.from}
            onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
            className="bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Từ ngày"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateFilter.to}
            onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
            className="bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Đến ngày"
          />
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors">
          <Filter className="w-4 h-4" />
          <span>Lọc</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium py-3 px-4">Ngày tập</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Tên bài tập</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Thời lượng</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Calories</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">HLV</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((workout) => (
              <tr
                key={workout.historyId}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white">{workout.trainingDate}</td>
                <td className="py-3 px-4 text-white">{workout.exerciseName}</td>
                <td className="py-3 px-4 text-gray-400">{workout.duration} phút</td>
                <td className="py-3 px-4 text-orange-400 font-medium">
                  {workout.caloriesBurned} kcal
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {workout.trainer || 'Không có'}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewDetail?.(workout.historyId)}
                    className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg transition-colors text-sm"
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Không tìm thấy lịch sử tập luyện phù hợp</p>
        </div>
      )}
    </div>
  );
};
