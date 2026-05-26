import React from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressCircle } from '../components/ProgressCircle';
import { EmptyState } from '../components/EmptyState';
import { CheckCircle2, Calendar, Clock, Package } from 'lucide-react';
import { currentPackage } from '../data/mockData';
import { useNavigate } from 'react-router';

export const MyPackage: React.FC = () => {
  const navigate = useNavigate();
  const hasActivePackage = currentPackage.status === 'Đang hoạt động';

  return (
    <>
      <MemberHeader title="Gói tập của tôi" />

      <div className="p-8">
        {hasActivePackage ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Package Header */}
            <div className="bg-card border border-white/10 rounded-xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-8 h-8 text-primary" />
                    <h2 className="text-3xl font-bold text-white">{currentPackage.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <StatusBadge status={currentPackage.status} />
                    <span className="text-gray-400">Mã gói: {currentPackage.planCode}</span>
                  </div>
                  <p className="text-gray-400">Loại gói: {currentPackage.type}</p>
                </div>

                <ProgressCircle
                  value={currentPackage.usedSessions}
                  max={currentPackage.totalSessions}
                  size={140}
                  strokeWidth={10}
                />
              </div>

              {/* Package Stats */}
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400">Ngày đăng ký</p>
                  </div>
                  <p className="text-white font-bold">{currentPackage.registrationDate}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Ngày hết hạn</p>
                  </div>
                  <p className="text-white font-bold">{currentPackage.expiryDate}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400">Số buổi còn lại</p>
                  </div>
                  <p className="text-green-400 font-bold text-xl">
                    {currentPackage.remainingSessions}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <p className="text-xs text-gray-400">Giá gói</p>
                  </div>
                  <p className="text-white font-bold">
                    {currentPackage.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>

              {/* Expiry Alert */}
              {currentPackage.daysRemaining <= 30 && (
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-6">
                  <p className="text-orange-400 font-medium">
                    ⚠️ Còn {currentPackage.daysRemaining} ngày trước khi gói hết hạn
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Tiến độ sử dụng</span>
                  <span className="text-sm text-white font-medium">
                    {currentPackage.usedSessions}/{currentPackage.totalSessions} buổi
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{
                      width: `${
                        (currentPackage.usedSessions / currentPackage.totalSessions) * 100
                      }%`
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/renew-package')}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Gia hạn ngay
                </button>
                <button
                  onClick={() => navigate('/buy-package')}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-primary text-primary px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Nâng cấp gói
                </button>
                <button
                  onClick={() => navigate('/buy-package')}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Mua gói mới
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-card border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Quyền lợi gói tập</h3>
              <div className="grid grid-cols-2 gap-4">
                {currentPackage.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <EmptyState
              message="Bạn hiện không có gói tập nào đang hoạt động"
              action={{
                label: 'Đăng ký gói mới',
                onClick: () => navigate('/buy-package')
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};
