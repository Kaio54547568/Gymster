import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface UpcomingWorkoutCardProps {
  workout: {
    title: string;
    type: string;
    time: string;
    date: string;
    trainer: string;
    room: string;
    status: string;
  };
  onViewDetail?: () => void;
}

export const UpcomingWorkoutCard: React.FC<UpcomingWorkoutCardProps> = ({ workout, onViewDetail }) => {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-2">{workout.title}</h3>
          <StatusBadge status={workout.status} />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {workout.time} - {workout.date}
          </span>
        </div>
        {workout.trainer && (
          <div className="flex items-center gap-2 text-gray-400">
            <User className="w-4 h-4" />
            <span className="text-sm">{workout.trainer}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{workout.room}</span>
        </div>
      </div>

      <button
        onClick={onViewDetail}
        className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Xem chi tiết
      </button>
    </div>
  );
};
