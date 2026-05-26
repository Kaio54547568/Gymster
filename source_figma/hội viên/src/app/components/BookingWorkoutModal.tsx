import React, { useState } from 'react';
import { X } from 'lucide-react';
import { trainers, currentPackage } from '../data/mockData';

interface BookingWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => void;
}

const rooms = [
  'Phòng Gym tầng 2',
  'Phòng Yoga tầng 3',
  'Khu Cardio',
  'Khu Free Weight'
];

export const BookingWorkoutModal: React.FC<BookingWorkoutModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    workoutType: '',
    trainer: '',
    date: '',
    time: '',
    room: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      workoutType: '',
      trainer: '',
      date: '',
      time: '',
      room: '',
      notes: ''
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.workoutType) {
      newErrors.workoutType = 'Vui lòng chọn môn tập';
    }

    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày tập';
    }

    if (!formData.time) {
      newErrors.time = 'Vui lòng chọn giờ tập';
    }

    if (formData.workoutType === 'pt' && !formData.trainer) {
      newErrors.trainer = 'Vui lòng chọn huấn luyện viên cho buổi tập PT cá nhân';
    }

    if (currentPackage.status !== 'Đang hoạt động') {
      newErrors.general = 'Gói tập của bạn đã hết hạn, vui lòng gia hạn trước khi đặt lịch';
    }

    if (currentPackage.remainingSessions <= 0) {
      newErrors.general = 'Bạn đã hết số buổi tập, vui lòng mua thêm hoặc gia hạn gói';
    }

    // Check if trainer is available
    if (formData.trainer) {
      const selectedTrainer = trainers.find(t => t.id === Number(formData.trainer));
      if (selectedTrainer && selectedTrainer.availability === 'Kín lịch') {
        newErrors.trainer = 'Huấn luyện viên đã kín lịch, vui lòng chọn khung giờ khác hoặc HLV khác';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Get trainer name
    const selectedTrainer = trainers.find(t => t.id === Number(formData.trainer));
    const trainerName = selectedTrainer ? selectedTrainer.name : '';

    // Create booking data
    const bookingData = {
      workoutType: formData.workoutType,
      trainerName: trainerName,
      trainerId: formData.trainer,
      date: formData.date,
      time: formData.time,
      room: formData.room || 'Phòng Gym tầng 2',
      notes: formData.notes
    };

    onSubmit(bookingData);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canBook = currentPackage.status === 'Đang hoạt động' && currentPackage.remainingSessions > 0;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Đặt lịch tập mới</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!canBook ? (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">
                {currentPackage.status !== 'Đang hoạt động'
                  ? '⚠️ Gói tập của bạn đã hết hạn. Vui lòng gia hạn để đặt lịch.'
                  : '⚠️ Bạn đã hết số buổi tập. Vui lòng gia hạn gói tập.'}
              </p>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm">
                📊 Bạn còn <span className="font-bold">{currentPackage.remainingSessions} buổi</span> tập
              </p>
            </div>
          )}

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">⚠️ {errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                Môn tập <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.workoutType}
                onChange={(e) => {
                  setFormData({ ...formData, workoutType: e.target.value });
                  setErrors({ ...errors, workoutType: '' });
                }}
                className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.workoutType ? 'border-red-500' : 'border-white/10'
                }`}
                disabled={!canBook}
              >
                <option value="">Chọn môn tập</option>
                <option value="gym">Gym</option>
                <option value="yoga">Yoga</option>
                <option value="cardio">Cardio</option>
                <option value="pt">PT cá nhân</option>
              </select>
              {errors.workoutType && (
                <p className="text-red-400 text-sm mt-1">{errors.workoutType}</p>
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Huấn luyện viên {formData.workoutType === 'pt' && <span className="text-red-400">*</span>}
              </label>
              <select
                value={formData.trainer}
                onChange={(e) => {
                  setFormData({ ...formData, trainer: e.target.value });
                  setErrors({ ...errors, trainer: '' });
                }}
                className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.trainer ? 'border-red-500' : 'border-white/10'
                }`}
                disabled={!canBook}
              >
                <option value="">Không chọn HLV</option>
                {trainers.map((trainer) => (
                  <option
                    key={trainer.id}
                    value={trainer.id}
                    disabled={trainer.availability === 'Kín lịch'}
                  >
                    {trainer.name} {trainer.availability === 'Kín lịch' ? '(Kín lịch)' : '(Còn lịch)'}
                  </option>
                ))}
              </select>
              {errors.trainer && (
                <p className="text-red-400 text-sm mt-1">{errors.trainer}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">
                  Ngày tập <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    setFormData({ ...formData, date: e.target.value });
                    setErrors({ ...errors, date: '' });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark] ${
                    errors.date ? 'border-red-500' : 'border-white/10'
                  }`}
                  disabled={!canBook}
                />
                {errors.date && (
                  <p className="text-red-400 text-sm mt-1">{errors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-white font-medium mb-2">
                  Giờ tập <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    setFormData({ ...formData, time: e.target.value });
                    setErrors({ ...errors, time: '' });
                  }}
                  className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary [color-scheme:dark] ${
                    errors.time ? 'border-red-500' : 'border-white/10'
                  }`}
                  disabled={!canBook}
                />
                {errors.time && (
                  <p className="text-red-400 text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Phòng/Khu vực tập
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!canBook}
              >
                <option value="">Chọn tự động</option>
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">
                Ghi chú cho HLV
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Nhập ghi chú nếu có..."
                disabled={!canBook}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!canBook}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
                  canBook
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Xác nhận đặt lịch
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
