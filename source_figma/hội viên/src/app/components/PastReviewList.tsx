import React from 'react';
import { Star } from 'lucide-react';
import { reviews } from '../data/mockData';
import { StatusBadge } from './StatusBadge';

export const PastReviewList: React.FC = () => {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Đánh giá của tôi</h3>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.reviewId} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400">Mã: {review.reviewId}</span>
                  <StatusBadge status={review.status} />
                </div>
                <p className="text-white font-medium">
                  {review.target}: {review.targetName}
                </p>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.ratingStars
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3">{review.comment}</p>

            <p className="text-xs text-gray-500">Ngày gửi: {review.createdAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
