import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { trainers } from '../data/mockData';

interface RescheduleWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rescheduleData: any) => void;
  workout: {
    id: number;
    title: string;
    type: string;
    date: string;
    time: string;
    trainer: string;
    room: string;
    notes?: string;
  };
}

const rooms = [
  'Phòng Gym tầng 2',
  'Phòng Yoga tầng 3',
  'Khu Cardio',
  'Khu Free Weight'
];

export const RescheduleWorkoutModal: React.FC<RescheduleWorkoutModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workout
}) => {
  const [formData, setFormData] = useState({
    date: workout.date,
    time: workout.time,
    trainer: workout.trainer,
    room: workout.room,
    notes: workout.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày tập mới';
    }

    if (!formData.time) {
      newErrors.time = 'Vui lòng chọn giờ tập mới';
    }

    // Check if new date/time is in the past
    const newDateTime = new Date(`${formData.date} ${formData.time}`);
    const now = new Date();

    if (newDateTime < now) {
      newErrors.general = 'Không thể đổi lịch sang thời gian trong quá khứ';
    }

    // Check if workout is too close (less than 2 hours)
    const oldDateTime = new Date(`${workout.date} ${workout.time}`);
    const timeDiff = (oldDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (timeDiff < 2 && timeDiff > 0) {
      newErrors.general = 'Không thể đổi lịch vì đã quá sát giờ tập (dưới 2 tiếng)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const rescheduleData = {
      workoutId: workout.id,
      newDate: formData.date,
      newTime: formData.time,
      newTrainer: formData.trainer,
      newRoom: formData.room,
      newNotes: formData.notes
    };

    onSubmit(rescheduleData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Đổi lịch tập</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Workout Info */}
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <p className="text-blue-400 font-medium mb-2">Thông tin buổi tập hiện tại</p>
              <div className="text-sm text-gray-300 space-y-1">
                <p>📋 {workout.title}</p>
                <p>📅 {new Date(workout.date).toLocaleDateString('vi-VN')} - {workout.time}</p>
                {workout.trainer && <p>👤 {workout.trainer}</p>}
                <p>📍 {workout.room}</p>
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">⚠️ {errors.general}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Ngày tập mới <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    setErrors({ ...errors, date: '', general: '' });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark] ${
                    errors.date ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.date && (
                  <p className="text-red-400 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Giờ tập mới <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({ ...formData, time: e.target.value });
                    setErrors({ ...errors, time: '', general: '' });
                  }}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark] ${
                    errors.time ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.time && (
                  <p className="text-red-400 text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Huấn luyện viên
              </label>
              <select
                value={formData.trainer}
                onChange={(e) => setFormData({ ...formData, trainer: e.target.value })}
                className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Không chọn HLV</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.name}>
                    {trainer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Phòng/Khu vực tập
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Ghi chú
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Ghi chú cho buổi tập..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-card border-t border-white/10 px-6 py-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Quay lại
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Xác nhận đổi lịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
