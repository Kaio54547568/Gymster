import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface CancelWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  workout: {
    title: string;
    date: string;
    time: string;
    trainer: string;
    room: string;
  };
}

export const CancelWorkoutModal: React.FC<CancelWorkoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  workout
}) => {
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Validate time (must be more than 2 hours before workout)
    const workoutDateTime = new Date(`${workout.date} ${workout.time}`);
    const now = new Date();
    const timeDiff = (workoutDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (timeDiff < 2 && timeDiff > 0) {
      setError('Không thể hủy lịch do đã quá sát giờ tập (dưới 2 tiếng)');
      return;
    }

    if (workoutDateTime < now) {
      setError('Không thể hủy buổi tập đã diễn ra trong quá khứ');
      return;
    }

    onConfirm(cancelReason);
    setCancelReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Xác nhận hủy lịch</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-300">
            Bạn có chắc chắn muốn hủy buổi tập này không?
          </p>

          {/* Workout Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Tên buổi tập</span>
              <span className="text-white font-medium">{workout.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ngày tập</span>
              <span className="text-white font-medium">
                {new Date(workout.date).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Giờ tập</span>
              <span className="text-white font-medium">{workout.time}</span>
            </div>
            {workout.trainer && (
              <div className="flex justify-between">
                <span className="text-gray-400">Huấn luyện viên</span>
                <span className="text-white font-medium">{workout.trainer}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Phòng tập</span>
              <span className="text-white font-medium">{workout.room}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">⚠️ {error}</p>
            </div>
          )}

          {/* Cancel Reason */}
          <div>
            <label className="block text-white font-medium mb-2">
              Lý do hủy (không bắt buộc)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                setError('');
              }}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Nhập lý do hủy nếu có..."
            />
          </div>

          <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
            <p className="text-orange-400 text-sm">
              ⚠️ Lưu ý: Nếu hủy đúng hạn (trước 2 tiếng), số buổi tập sẽ được hoàn lại vào gói của bạn.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Quay lại
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
};
