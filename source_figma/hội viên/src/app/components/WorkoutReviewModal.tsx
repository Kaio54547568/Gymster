import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';

interface WorkoutReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: any) => void;
  workout: {
    id: number;
    title: string;
    date: string;
    trainer: string;
    room: string;
  };
}

const quickTags = [
  'HLV hướng dẫn dễ hiểu',
  'Bài tập phù hợp',
  'Cường độ hợp lý',
  'Phòng tập sạch sẽ',
  'Thiết bị đầy đủ'
];

export const WorkoutReviewModal: React.FC<WorkoutReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workout
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Vui lòng chọn số sao đánh giá';
    }

    if (comment.trim().length < 10) {
      newErrors.comment = 'Nội dung đánh giá tối thiểu 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const reviewData = {
      workoutId: workout.id,
      ratingStars: rating,
      comment: comment.trim(),
      quickTags: selectedTags,
      createdAt: new Date().toISOString()
    };

    onSubmit(reviewData);
    resetForm();
  };

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setSelectedTags([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={handleClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Đánh giá buổi tập</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Workout Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Tên buổi tập</p>
                <p className="text-white font-medium">{workout.title}</p>
              </div>
              <div>
                <p className="text-gray-400">Ngày tập</p>
                <p className="text-white font-medium">
                  {new Date(workout.date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              {workout.trainer && (
                <div>
                  <p className="text-gray-400">Huấn luyện viên</p>
                  <p className="text-white font-medium">{workout.trainer}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400">Phòng tập</p>
                <p className="text-white font-medium">{workout.room}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-white font-medium mb-3">
                Đánh giá <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      setErrors({ ...errors, rating: '' });
                    }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && (
                <p className="text-red-400 text-sm mt-2">{errors.rating}</p>
              )}
            </div>

            {/* Quick Tags */}
            <div>
              <label className="block text-white font-medium mb-3">
                Đánh giá nhanh (chọn nhiều)
              </label>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {selectedTags.includes(tag) && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span className="text-sm">{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-white font-medium mb-2">
                Nội dung đánh giá <span className="text-red-400">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setErrors({ ...errors, comment: '' });
                }}
                className={`w-full bg-input-background border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.comment ? 'border-red-500' : 'border-white/10'
                }`}
                rows={5}
                placeholder="Chia sẻ trải nghiệm của bạn về buổi tập..."
              />
              <div className="flex items-center justify-between mt-1">
                {errors.comment ? (
                  <p className="text-red-400 text-sm">{errors.comment}</p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Tối thiểu 10 ký tự ({comment.length}/10)
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
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
                className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
              >
                Gửi đánh giá
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
