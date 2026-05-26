import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { trainers } from '../data/mockData';

interface FeedbackFormProps {
  onSubmit?: (data: any) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    target: '',
    targetName: '',
    rating: 0,
    comment: ''
  });

  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (formData.target === '') {
      alert('Vui lòng chọn đối tượng đánh giá');
      return;
    }

    if (formData.comment.length < 10) {
      alert('Nội dung đánh giá tối thiểu 10 ký tự');
      return;
    }

    alert('Cảm ơn bạn đã gửi đánh giá. Phản hồi của bạn sẽ giúp phòng tập cải thiện chất lượng dịch vụ.');

    if (onSubmit) {
      onSubmit(formData);
    }

    // Reset form
    setFormData({
      target: '',
      targetName: '',
      rating: 0,
      comment: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
      <h3 className="text-xl font-bold text-white">Gửi đánh giá mới</h3>

      <div>
        <label className="block text-white font-medium mb-2">
          Đối tượng đánh giá <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: e.target.value, targetName: '' })}
          className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          required
        >
          <option value="">Chọn đối tượng đánh giá</option>
          <option value="gym">Phòng tập</option>
          <option value="equipment">Thiết bị</option>
          <option value="trainer">Huấn luyện viên</option>
          <option value="workout">Buổi tập đã hoàn thành</option>
        </select>
      </div>

      {formData.target === 'trainer' && (
        <div>
          <label className="block text-white font-medium mb-2">
            Chọn huấn luyện viên <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.targetName}
            onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
            className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Chọn huấn luyện viên</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.name}>
                {trainer.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {formData.target === 'equipment' && (
        <div>
          <label className="block text-white font-medium mb-2">
            Chọn thiết bị/khu vực <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.targetName}
            onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
            className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Chọn thiết bị/khu vực</option>
            <option value="Phòng Gym tầng 2">Phòng Gym tầng 2</option>
            <option value="Phòng Yoga tầng 3">Phòng Yoga tầng 3</option>
            <option value="Khu Cardio">Khu Cardio</option>
            <option value="Khu Free Weight">Khu Free Weight</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-white font-medium mb-2">
          Số sao đánh giá <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFormData({ ...formData, rating: star })}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || formData.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">
          Nội dung đánh giá <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
          className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          rows={5}
          placeholder="Nhập góp ý, phàn nàn hoặc khen ngợi của bạn..."
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Nội dung đánh giá tối thiểu 10 ký tự ({formData.comment.length}/10)
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
      >
        Gửi đánh giá
      </button>
    </form>
  );
};
