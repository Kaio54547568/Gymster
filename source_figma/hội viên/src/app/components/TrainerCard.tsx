import React from 'react';
import { Star, Users } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useNavigate } from 'react-router';

interface TrainerCardProps {
  trainer: {
    id: number;
    name: string;
    specialty: string;
    experience: number;
    rating: number;
    students: number;
    availability: string;
    avatar: string;
  };
}

export const TrainerCard: React.FC<TrainerCardProps> = ({ trainer }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6 hover:border-primary transition-all">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={trainer.avatar}
          alt={trainer.name}
          className="w-16 h-16 rounded-full"
        />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{trainer.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{trainer.specialty}</p>
          <StatusBadge status={trainer.availability} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-white/10">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold">{trainer.rating}</span>
          </div>
          <p className="text-xs text-gray-400">Đánh giá</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-white font-bold">{trainer.students}</span>
          </div>
          <p className="text-xs text-gray-400">Học viên</p>
        </div>
        <div>
          <p className="text-white font-bold mb-1">{trainer.experience} năm</p>
          <p className="text-xs text-gray-400">Kinh nghiệm</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/trainer-detail/${trainer.id}`)}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Xem chi tiết
        </button>
        <button
          disabled={trainer.availability === 'Kín lịch'}
          onClick={() => navigate('/my-schedule')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            trainer.availability === 'Kín lịch'
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-white'
          }`}
        >
          Đặt lịch
        </button>
      </div>
    </div>
  );
};
