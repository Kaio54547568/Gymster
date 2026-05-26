import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ProgressCircle } from './ProgressCircle';
import { currentPackage } from '../data/mockData';
import { useNavigate } from 'react-router';

export const PackageSummaryCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{currentPackage.title}</h3>
          <StatusBadge status={currentPackage.status} />
        </div>
        <ProgressCircle
          value={currentPackage.usedSessions}
          max={currentPackage.totalSessions}
          size={100}
          strokeWidth={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <div>
            <p className="text-xs">Ngày hết hạn</p>
            <p className="text-white font-medium">{currentPackage.expiryDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <div>
            <p className="text-xs">Còn lại</p>
            <p className="text-white font-medium">{currentPackage.daysRemaining} ngày</p>
          </div>
        </div>
      </div>

      {currentPackage.daysRemaining <= 30 && (
        <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-3 mb-4">
          <p className="text-orange-400 text-sm">
            ⚠️ Gói tập còn {currentPackage.daysRemaining} ngày trước khi hết hạn
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/my-package')}
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Xem chi tiết
        </button>
        <button
          onClick={() => navigate('/my-package')}
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Gia hạn ngay
        </button>
      </div>
    </div>
  );
};
