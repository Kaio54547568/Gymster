import React from 'react';
import { X, Clock, User, MapPin, Target, Flame } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: {
    id?: number;
    title: string;
    type: string;
    time: string;
    date: string;
    trainer: string;
    room: string;
    status: string;
    goal: string;
    duration: number;
    caloriesBurned: number;
    muscleGroups: string;
    exercises: Array<{ name: string; sets: number; reps: string }>;
    notes: string;
    hasReview?: boolean;
  };
  onReschedule?: () => void;
  onCancel?: () => void;
  onReview?: () => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  isOpen,
  onClose,
  workout,
  onReschedule,
  onCancel,
  onReview
}) => {
  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Chi tiết buổi tập</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-3">{workout.title}</h3>
            <StatusBadge status={workout.status} />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Thời gian</p>
                <p className="text-white font-medium">
                  {workout.time} - {workout.date}
                </p>
              </div>
            </div>

            {workout.trainer && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Huấn luyện viên</p>
                  <p className="text-white font-medium">{workout.trainer}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Phòng tập</p>
                <p className="text-white font-medium">{workout.room}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Mục tiêu</p>
                <p className="text-white font-medium">{workout.goal}</p>
              </div>
            </div>
          </div>

          {/* Workout Content */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-bold mb-4">Nội dung buổi tập</h4>
            <ol className="space-y-3">
              {workout.exercises.map((exercise, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-white font-medium">{exercise.name}</p>
                    <p className="text-sm text-gray-400">
                      {exercise.sets} hiệp x {exercise.reps}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Expected Results */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white font-bold mb-4">Hiệu quả dự kiến</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">{workout.duration} phút</span>
                </div>
                <p className="text-xs text-gray-400">Thời lượng</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-white font-medium">{workout.caloriesBurned} kcal</span>
                </div>
                <p className="text-xs text-gray-400">Calories ước tính</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-medium">{workout.muscleGroups}</span>
                </div>
                <p className="text-xs text-gray-400">Nhóm cơ chính</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {workout.notes && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <h4 className="text-blue-400 font-bold mb-2">Ghi chú từ HLV</h4>
              <p className="text-gray-300 text-sm">{workout.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-white/10 px-6 py-4 flex gap-3">
          {workout.status === 'Sắp tới' && (
            <>
              <button
                onClick={onReschedule}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Đổi lịch
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg transition-colors"
              >
                Hủy lịch
              </button>
            </>
          )}
          {workout.status === 'Đã hoàn thành' && !workout.hasReview && (
            <button
              onClick={onReview}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Đánh giá buổi tập
            </button>
          )}
          {workout.status === 'Đã hoàn thành' && workout.hasReview && (
            <div className="flex-1 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-center">
              Bạn đã đánh giá buổi tập này
            </div>
          )}
          {workout.status === 'Chờ xác nhận' && (
            <button
              onClick={onCancel}
              className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-lg transition-colors"
            >
              Hủy yêu cầu
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
